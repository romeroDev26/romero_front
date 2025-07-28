# 🔧 Recomendaciones para Backend WebSocket - Reservas de Representantes

## 📋 Problema Actual

Cuando una empresa (RUC) selecciona asientos para múltiples representantes:
- ✅ **Funciona**: El primer representante puede seleccionar su asiento
- ❌ **Falla**: Al seleccionar el asiento del segundo representante, el primero desaparece para otros vendedores

## 🔍 Análisis del Frontend

### Mensajes WebSocket Enviados
```json
// Primer representante
{
  "type": "SEAT_TEMP_RESERVE",
  "seatId": 101,
  "userId": "user123-company-session-abc-rep-0",
  "userName": "Empresa ABC - Juan Perez",
  "representativeName": "Juan Perez",
  "representativeIndex": 0,
  "reservationType": "representative",
  "companyName": "Empresa ABC",
  "sessionId": "session-1722181800000-xyz123",
  "maxGroupReservations": 10
}

// Segundo representante
{
  "type": "SEAT_TEMP_RESERVE", 
  "seatId": 102,
  "userId": "user123-company-session-abc-rep-1",
  "userName": "Empresa ABC - Maria Garcia",
  "representativeName": "Maria Garcia",
  "representativeIndex": 1,
  "reservationType": "representative",
  "companyName": "Empresa ABC",
  "sessionId": "session-1722181800000-xyz123", // Mismo sessionId
  "maxGroupReservations": 10
}
```

## ❓ Preguntas para el Backend

### 1. **Gestión de Reservas Múltiples**
- ¿El backend puede mantener múltiples `SEAT_TEMP_RESERVE` activos simultáneamente para el mismo `tripId`?
- ¿Hay algún límite en el número de asientos reservados temporalmente por "grupo"?
- ¿El backend usa algún criterio de agrupación (IP, sessionId, companyName) para las reservas?

### 2. **Identificación de Reservas**
- ¿El backend identifica reservas únicamente por `userId` o usa `tripId + seatId + userId`?
- ¿Existe algún mecanismo de "sesión de empresa" en el backend?
- ¿Se diferencia entre `reservationType: "user"` vs `reservationType: "representative"`?

### 3. **Sistema de Notificaciones**
- ¿Las notificaciones `SEAT_TEMP_RESERVED` se envían a TODOS los clientes conectados?
- ¿O solo se notifica a otros usuarios (excluyendo quien hizo la reserva)?
- ¿Cómo maneja el backend las notificaciones cuando hay múltiples representantes de la misma empresa?

## 🛠️ Soluciones Sugeridas para Backend

### **Opción 1: Soporte Nativo para Sesiones de Empresa**

#### Estructura de Datos Recomendada
```javascript
// Backend debería mantener algo como:
{
  tripId: 123,
  companyReservations: {
    "session-1722181800000-xyz123": {
      userId: "user123",
      companyName: "Empresa ABC",
      maxReservations: 10,
      seats: [
        {
          seatId: 101,
          representativeIndex: 0,
          representativeName: "Juan Perez",
          userId: "user123-company-session-abc-rep-0"
        },
        {
          seatId: 102, 
          representativeIndex: 1,
          representativeName: "Maria Garcia",
          userId: "user123-company-session-abc-rep-1"
        }
      ],
      createdAt: "2025-07-28T14:30:00Z",
      expiresAt: "2025-07-28T15:00:00Z"
    }
  },
  individualReservations: {
    // Reservas de usuarios individuales (no empresas)
  }
}
```

#### Lógica Propuesta para el Backend
```javascript
// Cuando llega SEAT_TEMP_RESERVE con sessionId
function handleSeatTempReserve(message) {
  const { sessionId, userId, seatId, representativeIndex, companyName } = message;
  
  if (sessionId && representativeIndex !== undefined) {
    // Es una reserva de empresa
    if (!companyReservations[sessionId]) {
      companyReservations[sessionId] = {
        userId: userId.split('-company-')[0], // Extraer userId original
        companyName,
        seats: [],
        maxReservations: message.maxGroupReservations || 10,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
      };
    }
    
    // Agregar/actualizar asiento para este representante
    const existingIndex = companyReservations[sessionId].seats.findIndex(
      s => s.representativeIndex === representativeIndex
    );
    
    if (existingIndex >= 0) {
      // Liberar asiento anterior del representante
      const oldSeat = companyReservations[sessionId].seats[existingIndex];
      releaseSeat(oldSeat.seatId);
      companyReservations[sessionId].seats[existingIndex] = {
        seatId,
        representativeIndex,
        representativeName: message.representativeName,
        userId: message.userId
      };
    } else {
      // Nuevo asiento para representante
      companyReservations[sessionId].seats.push({
        seatId,
        representativeIndex,
        representativeName: message.representativeName,
        userId: message.userId
      });
    }
    
    // Notificar a todos los clientes sobre TODOS los asientos de la empresa
    broadcastCompanyReservations(sessionId);
    
  } else {
    // Reserva individual (lógica actual)
    handleIndividualReservation(message);
  }
}
```

### **Opción 2: Mejoras Mínimas (Más Fácil de Implementar)**

Si cambios grandes son difíciles, al menos:

1. **Cambiar el criterio de unicidad**: En lugar de usar solo `userId`, usar `tripId + seatId + userId`
2. **Mejorar notificaciones**: Incluir `sessionId` y `representativeIndex` en las respuestas
3. **Agregue timeout por grupos**: Permitir múltiples reservas con el mismo `sessionId`

```javascript
// Cambio mínimo en el backend
function handleSeatTempReserve(message) {
  // En lugar de: reservationKey = `${userId}`
  // Usar: reservationKey = `${tripId}-${seatId}-${userId}`
  
  const reservationKey = `${message.tripId}-${message.seatId}-${message.userId}`;
  
  temporaryReservations[reservationKey] = {
    ...message,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000)
  };
  
  // Notificar incluyendo información de sesión
  broadcastToAllClients({
    type: 'SEAT_TEMP_RESERVED',
    ...message,
    reservationKey
  });
}
```

## 🔄 Frontend Actual (Ya Implementado)

### Mejoras Implementadas en Frontend
- ✅ **UserIds únicos**: Cada representante tiene un `userId` único con `sessionId`
- ✅ **Tracking local**: Sistema de seguimiento de reservas en `sessionStorage`
- ✅ **Información adicional**: Campos `sessionId` y `maxGroupReservations` en mensajes
- ✅ **Compatibilidad**: Mantiene compatibilidad con sistema actual

### Estructura de Mensajes Frontend
```typescript
// Nuevo formato de mensaje enviado al backend
interface SeatOperationMessage {
  type: string;
  seatId?: number;
  userId?: string;           // Único por representante
  userName?: string;
  reservationType?: string;  // "representative"
  companyName?: string;
  representativeName?: string;
  representativeIndex?: number;
  timestamp: string;
  sessionId?: string;        // NUEVO: Identifica sesión de empresa
  maxGroupReservations?: number; // NUEVO: Límite sugerido
}
```

## 📞 Próximos Pasos

1. **Revisar** estas preguntas con el desarrollador del backend
2. **Decidir** qué opción es más viable (Opción 1 vs Opción 2)
3. **Coordinar** la implementación del lado del backend
4. **Probar** la integración completa

## 🧪 Pruebas Recomendadas

Una vez implementadas las mejoras del backend, probar:

1. **Caso base**: Usuario individual selecciona asiento ✅
2. **Empresa simple**: Empresa selecciona 1 representante ✅
3. **Empresa múltiple**: Empresa selecciona 2+ representantes ❌ → ✅
4. **Múltiples empresas**: 2 empresas seleccionan representantes simultáneamente
5. **Timeout**: Verificar que las reservas expiren correctamente
6. **Conexión/Desconexión**: Verificar comportamiento con WebSocket intermitente

---
*Documento generado el 28 de julio de 2025*
