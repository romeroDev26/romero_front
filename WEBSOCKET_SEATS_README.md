# 🚀 Selección de Asientos en Tiempo Real con WebSocket

## 📋 Descripción

Esta funcionalidad implementa selección de asientos en tiempo real usando WebSockets, permitiendo a múltiples vendedores ver instantáneamente qué asientos están siendo seleccionados por otros usuarios para evitar conflictos y mejorar la experiencia de venta. **Incluye sistema de fallback robusto** que garantiza que las ventas funcionen normalmente incluso si el WebSocket falla.

## ✨ Características

### 🔄 Estados en Tiempo Real
- **Disponible**: Asiento libre para selección
- **Seleccionado**: Asiento seleccionado por el usuario actual
- **Siendo seleccionado**: Otro vendedor está considerando este asiento (naranja, animado)
- **Ocupado**: Asiento ya vendido/reservado
- **Bloqueado**: Asiento fuera de servicio

### 🌐 Conectividad WebSocket con Fallback Inteligente
- **Conexión automática**: Se conecta al cargar el mapa de asientos
- **Reconexión automática**: Hasta 3 intentos de reconexión con delay incremental
- **Fallback robusto**: Después de 3 intentos fallidos, continúa en modo normal
- **Validación del servidor**: Confirma disponibilidad de asientos antes de cada venta
- **Reserva temporal**: Bloquea asientos durante el proceso de venta
- **Heartbeat**: Mantiene la conexión activa con pings periódicos

### 👥 Colaboración Multi-usuario
- **Selecciones temporales**: Los otros vendedores ven qué asientos estás considerando
- **Liberación automática**: Las selecciones temporales expiran después de 30 segundos
- **Información del usuario**: Se muestra quién está seleccionando cada asiento
- **Protección contra conflictos**: Validación en tiempo real del estado de asientos

### 🛡️ Sistema de Protección Anti-Conflictos

#### Modo WebSocket Activo:
- Selecciones visibles en tiempo real
- Prevención visual de conflictos
- Reservas temporales automáticas

#### Modo Fallback (Sin WebSocket):
- Validación del servidor antes de cada venta
- Reservas temporales durante el proceso
- Mensajes de error claros si hay conflictos
- **Continuidad total de ventas** garantizada

## 🏗️ Arquitectura

### Frontend (React + TypeScript)

```
src/features/fluvial/
├── hooks/
│   └── useSeatMapRealtime.ts          # Hook principal de WebSocket con fallback
├── components/
│   └── seat-map/
│       ├── SeatMapRealtime.tsx        # Mapa de asientos con tiempo real
│       └── SeatRealtime.tsx           # Componente individual de asiento
└── sales-point/
    └── SeatAndFareSelector.tsx        # Selector actualizado
└── services/
    └── seatValidation.service.ts      # Validación de asientos del servidor
```

### Estados de Conexión

```typescript
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'failed';

// 'failed' = Se agotaron los 3 intentos, continúa en modo normal
// maxReconnectAttempts = 3 (configurable)
// Delay incremental: 3s, 6s, 9s
```

### Mensajes WebSocket

```typescript
interface SeatUpdateMessage {
  type: 'SEAT_UPDATE' | 'SEAT_SELECTION' | 'SEAT_RELEASED';
  tripId: number;
  seatId: number;
  status?: string;
  userId?: string;
  userName?: string;
  timestamp: string;
}
```

### API de Validación de Asientos

```typescript
// Endpoints requeridos en el backend
POST /api/v1/seat-validation/validate
POST /api/v1/seat-validation/reserve-temporarily
POST /api/v1/seat-validation/release-reservation
```

## 🔧 Configuración

### Variables de Entorno

```env
# WebSocket URL para conexión en tiempo real
VITE_WS_URL=wss://romeroapi-production.up.railway.app
```

### Backend Requirements

El backend debe implementar un endpoint WebSocket en:
```
/ws/seats/{trip_id}?user_id={user_id}&user_name={user_name}
```

## 🎯 Implementación Backend (Recomendación)

### 1. WebSocket Endpoint (FastAPI + Python)

```python
# main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
import asyncio

app = FastAPI()

# Gestión de conexiones por trip
class SeatConnectionManager:
    def __init__(self):
        # trip_id -> {user_id: websocket}
        self.active_connections: Dict[int, Dict[str, WebSocket]] = {}
        # trip_id -> {seat_id: {user_id, user_name, timestamp}}
        self.active_selections: Dict[int, Dict[int, dict]] = {}
        self.max_reconnect_attempts = 3

    async def connect(self, websocket: WebSocket, trip_id: int, user_id: str):
        await websocket.accept()
        if trip_id not in self.active_connections:
            self.active_connections[trip_id] = {}
        self.active_connections[trip_id][user_id] = websocket

    def disconnect(self, trip_id: int, user_id: str):
        if trip_id in self.active_connections:
            self.active_connections[trip_id].pop(user_id, None)
            if not self.active_connections[trip_id]:
                del self.active_connections[trip_id]

    async def broadcast_to_trip(self, trip_id: int, message: dict, exclude_user: str = None):
        if trip_id in self.active_connections:
            for user_id, websocket in self.active_connections[trip_id].items():
                if user_id != exclude_user:
                    try:
                        await websocket.send_text(json.dumps(message))
                    except:
                        # Conexión cerrada, remover
                        pass

manager = SeatConnectionManager()

@app.websocket("/ws/seats/{trip_id}")
async def websocket_endpoint(websocket: WebSocket, trip_id: int, user_id: str, user_name: str):
    await manager.connect(websocket, trip_id, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "SEAT_SELECTION":
                # Broadcast a otros usuarios
                await manager.broadcast_to_trip(
                    trip_id, 
                    message, 
                    exclude_user=user_id
                )
                
            elif message["type"] == "SEAT_RELEASED":
                await manager.broadcast_to_trip(
                    trip_id, 
                    message, 
                    exclude_user=user_id
                )
                
            elif message["type"] == "PING":
                await websocket.send_text(json.dumps({"type": "PONG"}))
                
    except WebSocketDisconnect:
        manager.disconnect(trip_id, user_id)
```

### 2. API de Validación de Asientos

```python
# seat_validation.py
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

router = APIRouter(prefix="/seat-validation")

@router.post("/validate")
async def validate_seat_availability(request: SeatValidationRequest, db: Session = Depends(get_db)):
    # Verificar si el asiento está disponible
    seat_assignment = db.query(SeatAssignment).filter(
        SeatAssignment.trip_id == request.trip_id,
        SeatAssignment.trip_seat_id == request.seat_id,
        SeatAssignment.status.in_(['CONFIRMED', 'BOARDED'])
    ).first()
    
    if seat_assignment:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "El asiento seleccionado ya no está disponible",
                "conflictDetails": {
                    "occupiedBy": seat_assignment.passenger_name,
                    "occupiedAt": seat_assignment.created_at.isoformat(),
                    "invoiceNumber": seat_assignment.invoice_item.invoice.full_number if seat_assignment.invoice_item else None
                }
            }
        )
    
    return {"isAvailable": True}

@router.post("/reserve-temporarily")
async def reserve_seat_temporarily(request: SeatReservationRequest, db: Session = Depends(get_db)):
    # Crear reserva temporal por 5 minutos
    expires_at = datetime.utcnow() + timedelta(minutes=request.duration_minutes)
    
    temp_reservation = TemporarySeatReservation(
        trip_id=request.trip_id,
        seat_id=request.seat_id,
        user_id=request.user_id,
        expires_at=expires_at
    )
    
    db.add(temp_reservation)
    db.commit()
    
    return {"success": True, "expiresAt": expires_at.isoformat()}

@router.post("/release-reservation")
async def release_seat_reservation(request: SeatValidationRequest, db: Session = Depends(get_db)):
    # Liberar reserva temporal
    db.query(TemporarySeatReservation).filter(
        TemporarySeatReservation.trip_id == request.trip_id,
        TemporarySeatReservation.seat_id == request.seat_id,
        TemporarySeatReservation.user_id == request.user_id
    ).delete()
    
    db.commit()
    return {"success": True}
```

### 2. Base de datos para persistencia

```sql
-- Tabla para tracking de selecciones activas
CREATE TABLE active_seat_selections (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL,
    seat_id INTEGER NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    UNIQUE(trip_id, seat_id)
);

-- Nueva tabla para reservas temporales durante venta
CREATE TABLE temporary_seat_reservations (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL,
    seat_id INTEGER NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    UNIQUE(trip_id, seat_id)
);

-- Índices para rendimiento
CREATE INDEX idx_active_selections_trip ON active_seat_selections(trip_id);
CREATE INDEX idx_active_selections_expires ON active_seat_selections(expires_at);
CREATE INDEX idx_temp_reservations_trip ON temporary_seat_reservations(trip_id);
CREATE INDEX idx_temp_reservations_expires ON temporary_seat_reservations(expires_at);

-- Job para limpieza automática de registros expirados
-- Ejecutar cada 5 minutos
DELETE FROM active_seat_selections WHERE expires_at < NOW();
DELETE FROM temporary_seat_reservations WHERE expires_at < NOW();
```

## 🚀 Flujo de Trabajo

### Modo WebSocket Activo (Ideal)
1. **Conexión**: Usuario se conecta al WebSocket del viaje
2. **Selección**: Al seleccionar asiento, se notifica a otros usuarios
3. **Visualización**: Otros ven el asiento como "siendo seleccionado"
4. **Validación**: Al confirmar venta, se valida disponibilidad
5. **Reserva temporal**: Se reserva durante el proceso de venta
6. **Venta**: Se completa la transacción
7. **Liberación**: Se libera la reserva temporal

### Modo Fallback (Sin WebSocket)
1. **Detección**: Después de 3 intentos fallidos de conexión
2. **Modo normal**: Interfaz indica "sin tiempo real"
3. **Selección**: Usuario selecciona asiento normalmente
4. **Validación crítica**: Al confirmar venta, se valida disponibilidad
5. **Reserva temporal**: Se reserva durante el proceso de venta
6. **Protección**: Si asiento ocupado, error claro y selección de otro
7. **Venta**: Se completa normalmente
8. **Liberación**: Se libera la reserva temporal

## 🚨 Manejo de Conflictos

### Conflicto Detectado Durante Venta
```typescript
// Mensaje de error claro para el usuario
"El asiento 15 acaba de ser vendido por otro vendedor. 
Por favor, seleccione otro asiento disponible."

// Con detalles adicionales si está disponible
"Ocupado por: Juan Pérez (Factura: B001-00001234)"
```

### Recuperación Automática
- **Refresco del mapa**: Se actualiza automáticamente
- **Selección nueva**: Usuario debe elegir otro asiento
- **Proceso continúa**: Venta se completa normalmente
- **Sin pérdida de datos**: Información del cliente se mantiene

## 🚀 Uso

### En el componente SaleForm

```tsx
// El componente ya está configurado para usar WebSocket automáticamente
<SeatAndFareSelector
  tripId={trip.id}
  // ... otras props
  userId={currentUser?.id || 'unknown'}
  userName={currentUser?.full_name || 'Usuario'}
/>
```

### Estados visuales para el usuario

- 🟢 **Indicador verde**: Conectado al sistema en tiempo real
- 🟡 **Indicador amarillo**: Conectando...
- 🔴 **Indicador rojo**: Sin conexión en tiempo real
- 🟠 **Asientos naranjas**: Siendo seleccionados por otros vendedores

## 📝 Beneficios

1. **Reduce conflictos**: Evita que dos vendedores vendan el mismo asiento
2. **Mejora UX**: Los vendedores ven actividad en tiempo real
3. **Aumenta eficiencia**: Menos tiempo perdido en asientos ocupados
4. **Transparencia**: Siempre saben qué está disponible realmente

## 🔮 Futuras Mejoras

- **Notificaciones push**: Alertas cuando se liberan asientos deseados
- **Chat integrado**: Comunicación entre vendedores
- **Analytics**: Métricas de selección de asientos
- **Reservas temporales**: Bloqueo automático por X minutos
- **Integración móvil**: Soporte para apps móviles

## 🐛 Solución de Problemas

### Problema: WebSocket no conecta
```bash
# Verificar variables de entorno
echo $VITE_WS_URL

# Verificar conectividad
curl -I https://romeroapi-production.up.railway.app/health
```

### Problema: Selecciones no se sincronizan
1. Verificar que el backend implemente los endpoints WebSocket
2. Revisar la consola del navegador para errores de WebSocket
3. Confirmar que los user_id sean únicos y consistentes

### Problema: Conexión se pierde frecuentemente
1. Verificar configuración de proxy/load balancer
2. Ajustar intervalo de heartbeat (actualmente 30s)
3. Implementar política de reconexión más agresiva
