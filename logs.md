# 🎯 Guía: Selecciones vs Reservas Temporales - WebSocket y Redis

## 📋 *Diferencias Fundamentales*

### **1. Selección Normal (SEAT_SELECTION)**
- *Propósito:* Selección inmediata para venta individual
- *Duración:* 5 minutos (TTL automático)
- *Limitación:* *1 selección por usuario* ⚠
- *Estado visual:* selected (azul)
- *Uso:* Ventas individuales rápidas

### **2. Reserva Temporal (SEAT_TEMP_RESERVE)**
- *Propósito:* Reserva para representantes empresariales
- *Duración:* 30 minutos (TTL automático)
- *Limitación:* *Múltiples reservas por usuario* ✅
- *Estado visual:* representative_reserved (púrpura)
- *Uso:* Facturas empresariales con múltiples representantes

---

## 🔧 *Implementación Automática vs Manual*

### *✅ Automático (Recomendado - Ya Implementado)*

El backend maneja automáticamente:

javascript
// ✅ AUTO-LIBERACIÓN: El backend libera automáticamente selecciones previas
// cuando el mismo usuario hace una nueva selección
websocket.send(JSON.stringify({
  type: "SEAT_SELECTION",
  seatId: 123
}));
// Backend automáticamente libera selección anterior del mismo usuario


### *🔧 Manual (Opcional - Para Mayor Control)*

El frontend puede controlar manualmente:

javascript
// 🔧 CONTROL MANUAL: Frontend libera explícitamente antes de nueva selección
websocket.send(JSON.stringify({
  type: "SEAT_TEMP_RELEASE_ALL"
}));

// Luego hacer nueva reserva
websocket.send(JSON.stringify({
  type: "SEAT_TEMP_RESERVE",
  seatId: 456,
  representativeName: "Juan Pérez"
}));


---

## 📡 *Eventos WebSocket Completos*

### *Eventos que Envía el Frontend:*

| Evento | Propósito | Parámetros | Limitación | TTL |
|--------|-----------|------------|------------|-----|
| SEAT_SELECTION | Selección normal | seatId | 1 por usuario | 5 min |
| SEAT_RELEASED | Liberar selección | seatId | - | - |
| SEAT_TEMP_RESERVE | Reserva temporal | seatId, representativeName | Múltiples por usuario | 30 min |
| SEAT_TEMP_RELEASE | *Liberar 1 reserva específica* | seatId | ✅ *Para eliminar solo 1 de 3* | - |
| SEAT_TEMP_RELEASE_ALL | *Liberar TODAS las reservas* | reservationType (opcional) | ⚠ *Elimina todas del usuario* | - |

### *Eventos que Recibe el Frontend:*

| Evento | Cuándo se Envía | Acción Frontend |
|--------|-----------------|------------------|
| SEAT_SELECTED | Alguien selecciona asiento | Marcar como selected (azul) |
| SEAT_RELEASED | Alguien libera asiento | Marcar como available (gris) |
| SEAT_TEMP_RESERVED | Alguien reserva temporalmente | Marcar como representative_reserved (púrpura) |
| SEAT_TEMP_RELEASED | Alguien libera reserva temporal | Marcar como available (gris) |
| SEATS_OCCUPIED | Venta completada | Marcar como occupied (rojo) |

---

## 🎨 *Estados Visuales y CSS*

css
/* 1. Disponible */
.seat.available {
  background-color: #6c757d; /* Gris */
  cursor: pointer;
}

/* 2. Seleccionado (1 por usuario) */
.seat.selected {
  background-color: #007bff; /* Azul */
  color: white;
}

/* 3. Reserva temporal (múltiples por usuario) */
.seat.representative_reserved {
  background-color: #6f42c1; /* Púrpura */
  color: white;
}

/* 4. Ocupado (vendido) */
.seat.occupied {
  background-color: #dc3545; /* Rojo */
  color: white;
  cursor: not-allowed;
  pointer-events: none;
}


---

## 💻 *Implementación Frontend Completa*

### *1. Manejo de Selecciones Normales (1 por usuario)*

javascript
class SeatManager {
  constructor() {
    this.currentSelection = null; // Solo 1 selección permitida
    this.tempReservations = []; // Múltiples reservas permitidas
  }
  
  // Selección normal (limita a 1 por usuario)
  selectSeat(seatId) {
    // ✅ AUTO-LIBERACIÓN: El backend maneja esto automáticamente
    // No necesitas liberar manualmente la selección anterior
    
    this.websocket.send(JSON.stringify({
      type: "SEAT_SELECTION",
      seatId: seatId
    }));
    
    // Actualizar estado local
    this.currentSelection = seatId;
  }
  
  // Liberar selección actual
  releaseSeat() {
    if (this.currentSelection) {
      this.websocket.send(JSON.stringify({
        type: "SEAT_RELEASED",
        seatId: this.currentSelection
      }));
      
      this.currentSelection = null;
    }
  }
}


### *2. Manejo de Reservas Temporales (múltiples por usuario)*

javascript
class RepresentativeManager {
  constructor() {
    this.tempReservations = new Map(); // Múltiples reservas
  }
  
  // Reserva temporal (permite múltiples)
  reserveSeatForRepresentative(seatId, representativeName) {
    this.websocket.send(JSON.stringify({
      type: "SEAT_TEMP_RESERVE",
      seatId: seatId,
      representativeName: representativeName
    }));
  }
  
  // Liberar reserva específica
  releaseRepresentativeReservation(seatId) {
    this.websocket.send(JSON.stringify({
      type: "SEAT_TEMP_RELEASE",
      seatId: seatId
    }));
    
    this.tempReservations.delete(seatId);
  }
  
  // Liberar todas las reservas del usuario
  releaseAllReservations() {
    this.websocket.send(JSON.stringify({
      type: "SEAT_TEMP_RELEASE_ALL",
      reservationType: "REPRESENTATIVE_TEMP_RESERVATION"
    }));
    
    this.tempReservations.clear();
  }
}


### *3. Manejo de Respuestas WebSocket*

javascript
function handleWebSocketMessage(event) {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    // === SELECCIONES NORMALES ===
    case 'SEAT_SELECTED':
      updateSeatState(data.seatId, 'selected');
      if (data.userId === currentUserId) {
        seatManager.currentSelection = data.seatId;
      }
      break;
      
    case 'SEAT_RELEASED':
      updateSeatState(data.seatId, 'available');
      if (data.userId === currentUserId) {
        seatManager.currentSelection = null;
      }
      break;
    
    // === RESERVAS TEMPORALES ===
    case 'SEAT_TEMP_RESERVE_RESPONSE':
      if (data.success) {
        console.log('✅ Reserva temporal exitosa');
      } else {
        console.log('❌ Error en reserva temporal:', data.message);
        showError('No se pudo reservar el asiento');
      }
      break;
      
    case 'SEAT_TEMP_RESERVED':
      updateSeatState(data.seatId, 'representative_reserved');
      if (data.userId === currentUserId) {
        representativeManager.tempReservations.set(data.seatId, {
          representativeName: data.representativeName,
          timestamp: data.timestamp
        });
      }
      break;
      
    case 'SEAT_TEMP_RELEASED':
      // Puede ser un solo asiento o múltiples
      const seatIds = Array.isArray(data.seatIds) ? data.seatIds : [data.seatId];
      seatIds.forEach(seatId => {
        updateSeatState(seatId, 'available');
        if (data.userId === currentUserId) {
          representativeManager.tempReservations.delete(seatId);
        }
      });
      break;
      
    case 'SEAT_TEMP_RELEASE_ALL_RESPONSE':
      if (data.success) {
        console.log(`✅ Liberadas ${data.releasedCount} reservas temporales`);
        representativeManager.tempReservations.clear();
      }
      break;
    
    // === VENTAS COMPLETADAS ===
    case 'SEATS_OCCUPIED':
      data.seatIds.forEach(seatId => {
        updateSeatState(seatId, 'occupied');
      });
      showNotification(`${data.seatIds.length} asientos vendidos en factura ${data.invoiceSeries}-${data.invoiceNumber}`);
      break;
      
    default:
      console.log('Evento WebSocket no manejado:', data.type);
  }
}


### *4. Función de Actualización de Estados*

javascript
function updateSeatState(seatId, newState) {
  const seatElement = document.querySelector(`[data-seat-id="${seatId}"]`);
  if (!seatElement) return;
  
  // Remover todos los estados anteriores
  seatElement.classList.remove('available', 'selected', 'representative_reserved', 'occupied');
  
  // Aplicar nuevo estado
  seatElement.classList.add(newState);
  seatElement.setAttribute('data-state', newState);
  
  // Configurar interactividad
  switch (newState) {
    case 'available':
      seatElement.style.pointerEvents = 'auto';
      seatElement.style.cursor = 'pointer';
      break;
      
    case 'occupied':
      seatElement.style.pointerEvents = 'none';
      seatElement.style.cursor = 'not-allowed';
      break;
      
    default:
      seatElement.style.pointerEvents = 'auto';
      seatElement.style.cursor = 'pointer';
  }
}


---

## 🔄 *Flujos de Trabajo Típicos*

### *Flujo 1: Venta Individual*

1. Usuario selecciona asiento → SEAT_SELECTION
2. Backend auto-libera selección anterior (si existe)
3. Frontend recibe SEAT_SELECTED → Asiento azul
4. Usuario crea factura individual
5. Frontend recibe SEATS_OCCUPIED → Asiento rojo


### *Flujo 2: Venta Empresarial*

1. Usuario reserva asiento para Rep1 → SEAT_TEMP_RESERVE
2. Frontend recibe SEAT_TEMP_RESERVED → Asiento púrpura
3. Usuario reserva asiento para Rep2 → SEAT_TEMP_RESERVE
4. Frontend recibe SEAT_TEMP_RESERVED → Asiento púrpura
5. Usuario crea factura empresarial
6. Backend libera reservas temporales automáticamente
7. Frontend recibe SEATS_OCCUPIED → Asientos rojos


### *Flujo 3: Cancelación de Reservas*

// Opción A: Liberar todas (recomendado)
representativeManager.releaseAllReservations();

// Opción B: Liberar una por una
representativeManager.releaseRepresentativeReservation(seatId);


---

## ⚠ *Limitaciones y Reglas*

### *Selecciones Normales:*
- ✅ *1 selección por usuario máximo*
- ✅ *Auto-liberación* cuando selecciona otro asiento
- ✅ *TTL 5 minutos* (Redis automático)
- ✅ *Para ventas individuales*

### *Reservas Temporales:*
- ✅ *Múltiples reservas por usuario*
- ✅ *TTL 30 minutos* (Redis automático)
- ✅ *Para ventas empresariales*
- ✅ *Auto-liberación* al completar venta

### *Estados Finales:*
- ✅ *Ocupado (rojo):* Asiento vendido permanentemente
- ✅ *No interactivo:* pointer-events: none
- ✅ *Persistente:* No se libera automáticamente

---

## *🎯 Casos de Uso Típicos*

### *Venta Individual:*
javascript
// 1. Usuario selecciona asiento
webSocket.send(JSON.stringify({
  type: "SEAT_SELECTION",
  seatId: "12A",
  userId: "user123"
}));

// 2. Procesar venta
// 3. El backend libera automáticamente


### *Venta Empresarial (Múltiples Representantes):*
javascript
// 1. Reservar múltiples asientos
for (let seat of selectedSeats) {
  webSocket.send(JSON.stringify({
    type: "SEAT_TEMP_RESERVE",
    seatId: seat.id,
    userId: "user123",
    representativeName: seat.representativeName
  }));
}

// 2. Procesar factura empresarial
// 3. El backend libera automáticamente todas las reservas


### *🔧 Escenario: 3 Reservas, Eliminar Solo 1*

*Situación:* Tienes reservas temporales para 3 representantes pero quieres eliminar solo 1.

javascript
// ✅ CORRECTO: Usar SEAT_TEMP_RELEASE para asiento específico
webSocket.send(JSON.stringify({
  type: "SEAT_TEMP_RELEASE",
  seatId: "15C",  // Solo elimina este asiento
  userId: "user123"
}));

// ❌ INCORRECTO: SEAT_TEMP_RELEASE_ALL eliminaría las 3
webSocket.send(JSON.stringify({
  type: "SEAT_TEMP_RELEASE_ALL",  // Elimina TODAS las reservas
  userId: "user123"
}));


*Resultado:*
- SEAT_TEMP_RELEASE: Solo libera el asiento 15C
- Las otras 2 reservas (ej: 15A, 15B) permanecen activas
- Puedes seguir procesando la factura con 2 representantes

---

## *❓ Preguntas Frecuentes*

### *P: ¿SEAT_TEMP_RELEASE_ALL solo libera las reservas de un usuario?*
*R:* ✅ *Sí*, solo libera las reservas temporales del userId especificado. No afecta las reservas de otros usuarios.

### *P: ¿Si tengo 3 reservas temporales, puedo eliminar solo 1?*
*R:* ✅ *Sí*, usa SEAT_TEMP_RELEASE con el seatId específico:
javascript
// Elimina solo el asiento 15C, mantiene 15A y 15B
webSocket.send(JSON.stringify({
  type: "SEAT_TEMP_RELEASE",
  seatId: "15C",
  userId: "user123"
}));


### *P: ¿Cuándo usar SEAT_TEMP_RELEASE vs SEAT_TEMP_RELEASE_ALL?*
*R:* 
- **SEAT_TEMP_RELEASE*: Para eliminar **1 asiento específico*
- **SEAT_TEMP_RELEASE_ALL*: Para **cancelar toda la operación* y empezar de nuevo

### *P: ¿Las reservas tienen límite de tiempo?*
*R:* ✅ *Sí*, 30 minutos TTL. Después se liberan automáticamente.

### *P: ¿Puedo tener reservas en diferentes viajes simultáneamente?*
*R:* ✅ *Sí*, las reservas son por tripId, puedes tener reservas en múltiples viajes.

---

## 🎯 *Recomendaciones*

### *Para el Frontend:*
1. *Usar auto-liberación* del backend (ya implementada)
2. *Manejar todos los eventos* WebSocket listados
3. *Implementar estados visuales* claros
4. *Validar límites* antes de enviar eventos

### *Para UX:*
1. *Mostrar contador* de reservas temporales activas
2. *Indicar tiempo restante* de TTL
3. *Confirmar liberación* de múltiples reservas
4. *Notificar ventas completadas* de otros usuarios

---

*El sistema está diseñado para manejar automáticamente la mayoría de casos, pero proporciona control manual cuando se necesita mayor precisión.*