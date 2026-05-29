# Alineación WebSocket: Frontend vs Backend

> **Fecha:** 2026-05-28
> **Estado:** ✅ Cambios implementados y probados
> **Tests:** 244/244 passing (incluye 7 nuevos tests de WebSocket)
> **Build:** TypeScript compilación limpia

---

## Resumen Ejecutivo

Se comparó el contrato WebSocket del frontend contra la guía oficial del backend. Se identificaron **3 discrepancias críticas** y **1 mejora de compatibilidad**. Todas fueron resueltas con cambios de código.

---

## Discrepancias Encontradas y Soluciones

### 1. 🔴 CRÍTICO: `INITIAL_STATE` — Formato incompatible

**Guía Backend:**
```json
{
  "type": "INITIAL_STATE",
  "tripId": 2080,
  "seatMap": [
    { "id": 153893, "seat_number": "1", "status": "AVAILABLE" },
    { "id": 153894, "seat_number": "2", "status": "RESERVED" },
    { "id": 153895, "seat_number": "3", "status": "CONFIRMED" }
  ]
}
```

**Frontend ANTES:**
Esperaba `selecctionSeats` (con typo doble C) + `occupiedSeats` separados. No manejaba `seatMap`.

**Solución implementada:**
- `websocket.types.ts`: Agregado `seatMap?: SeatMapWsItem[]` al tipo `SeatUpdateMessage`
- `websocketMessageHandler.ts`: `handleInitialState` ahora procesa `seatMap` primero (formato oficial del backend), recorriendo cada asiento y actualizando su estado + occupant. Mantiene fallback a `selecctionSeats`/`occupiedSeats` para compatibilidad legacy.

**Tests agregados:**
- `processes seatMap from backend official format`
- `processes seatMap with occupants and marks confirmedSeats`

---

### 2. 🔴 CRÍTICO: `SEATS_RELEASED` — No implementado en frontend

**Guía Backend:**
```json
{
  "type": "SEATS_RELEASED",
  "tripId": 2080,
  "seatIds": [153908],
  "reason": "CANCELLED_RESERVATION",
  "timestamp": "2026-05-29T03:20:00Z"
}
```

**Frontend ANTES:**
No tenía este tipo en el union ni handler. Los asientos liberados por anulación o timeout no se actualizaban en el mapa.

**Solución implementada:**
- `websocket.types.ts`: Agregado `'SEATS_RELEASED'` al union type + campo `reason?: string`
- `websocketMessageHandler.ts`: Nuevo método `handleSeatsReleased()` que:
  1. Recorre `seatIds`
  2. Elimina de `confirmedSeats` (si estaba vendido)
  3. Actualiza estado a `AVAILABLE`
  4. Remueve selección temporal
- Agregado al switch de `handleMessage`

**Tests agregados:**
- `marks multiple seats as AVAILABLE and removes selections`
- `handles single seat release`
- `ignores empty seatIds array`

---

### 3. 🟡 MEDIO: `SEAT_RESERVED` — Campos adicionales no tipados

**Guía Backend:**
```json
{
  "type": "SEAT_RESERVED",
  "tripId": 2080,
  "seatTypeId": 2,
  "reservationId": 1971,
  "customerId": 0,
  "quantity": 1,
  "seatId": 153908,
  "seatNumber": "16",
  "timestamp": "2026-05-29T03:09:45Z"
}
```

**Frontend ANTES:**
El handler ya funcionaba con `seatId`, pero los campos adicionales (`seatTypeId`, `reservationId`, `customerId`, `quantity`, `seatNumber`) no estaban en la interfaz TypeScript, causando errores si se accedía a ellos.

**Solución implementada:**
- `websocket.types.ts`: Agregados campos opcionales `seatTypeId`, `reservationId`, `customerId`, `quantity`, `seatNumber` a `SeatUpdateMessage`
- `websocketMessageHandler.ts`: Verificado que `handleSeatReserved` maneja correctamente `seatId`

**Tests agregados:**
- `handles full backend payload with seatTypeId, reservationId, etc.`

---

### 4. 🟢 COMPATIBLE (sin cambios): `SEATS_OCCUPIED`

**Guía Backend:**
```json
{
  "type": "SEATS_OCCUPIED",
  "tripId": 2080,
  "seatIds": [153908, 153909],
  "userId": "uuid",
  "userName": "Nombre Vendedor",
  "timestamp": "2026-05-29T03:15:00Z"
}
```

**Frontend:**
✅ Ya era compatible. El handler `handleSeatsOccupied` espera `seatIds: number[]` y opcionalmente `occupants`. El campo `userId`/`userName` del backend no se usa en el handler pero no causa conflictos.

---

### 5. 🟢 COMPATIBLE (sin cambios): `SEAT_SELECTION`

**Guía Backend:**
```json
{
  "type": "SEAT_SELECTION",
  "tripId": 2080,
  "seatId": 153908,
  "userId": "uuid-del-vendedor",
  "userName": "Nombre Vendedor",
  "status": "SEAT_SELECTION",
  "timestamp": "2026-05-29T03:09:11Z"
}
```

**Frontend:**
✅ Ya era compatible. El handler `handleSeatSelection` maneja exactamente estos campos.

---

## Matriz de Compatibilidad Final

| Tipo de Mensaje | Dirección | Estado | Notas |
|-----------------|-----------|--------|-------|
| `INITIAL_STATE` | Backend → Frontend | ✅ **Alineado** | Ahora soporta `seatMap` oficial + legacy fallback |
| `SEAT_SELECTION` | Backend → Frontend | ✅ **Alineado** | Sin cambios necesarios |
| `SEAT_RESERVED` | Backend → Frontend | ✅ **Alineado** | Campos adicionales tipados |
| `SEATS_OCCUPIED` | Backend → Frontend | ✅ **Alineado** | Sin cambios necesarios |
| `SEATS_RELEASED` | Backend → Frontend | ✅ **Alineado** | Nuevo handler implementado |
| `CONNECT` | Frontend → Backend | ⚠️ No verificable | Guía no especifica inbound |
| `REQUEST_INITIAL_STATE` | Frontend → Backend | ⚠️ No verificable | Guía no especifica inbound |
| `PING` | Frontend → Backend | ⚠️ No verificable | Guía no especifica inbound |
| `SEAT_SELECTION` | Frontend → Backend | ⚠️ No verificable | Guía no especifica inbound |
| `SEAT_RELEASED` | Frontend → Backend | ⚠️ No verificable | Guía usa `SEATS_RELEASED` (plural) solo para inbound |
| `SEAT_UPDATE` (SOLD) | Frontend → Backend | ⚠️ No verificable | Guía no especifica inbound |
| `SEAT_TEMP_RESERVE` | Frontend → Backend | ⚠️ No verificable | Guía no especifica inbound |
| `SEAT_TEMP_RELEASE` | Frontend → Backend | ⚠️ No verificable | Guía no especifica inbound |
| `SEAT_TEMP_RELEASE_ALL` | Frontend → Backend | ⚠️ No verificable | Guía no especifica inbound |

---

## Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `src/features/fluvial/types/websocket.types.ts` | +`SeatMapWsItem`, +`'SEATS_RELEASED'`, +`seatMap`, +`reason`, +`seatTypeId/reservationId/customerId/quantity/seatNumber` |
| `src/features/fluvial/services/websocketMessageHandler.ts` | +`handleSeatsReleased()`, `handleInitialState` ahora procesa `seatMap`, +`SEATS_RELEASED` en switch |
| `src/features/fluvial/services/websocketMessageHandler.test.ts` | +7 tests nuevos para `seatMap`, `SEATS_RELEASED`, `SEAT_RESERVED` completo |

---

## Preguntas Pendientes para el Backend

La guía solo detalla los eventos que **recibe** el frontend. Quedan sin verificar los mensajes que **envía** el frontend:

1. **¿El backend espera `SEAT_RELEASED` (singular) o `SEATS_RELEASED` (plural) cuando el frontend libera un asiento?**
   - El frontend envía `SEAT_RELEASED` con `seatId` individual.
   - El backend envía `SEATS_RELEASED` con `seatIds` array.
   - Si el backend espera `SEATS_RELEASED` del frontend también, necesitaremos ajustar `seatOperations.ts`.

2. **¿El backend maneja `SEAT_TEMP_RESERVE`, `SEAT_TEMP_RELEASE`, `SEAT_TEMP_RELEASE_ALL`?**
   - Usados para el flujo de representantes (modo empresa/RUC).

3. **¿El backend maneja `SEAT_UPDATE` con `status: "SOLD"` para confirmar ventas?**
   - El frontend lo envía en `confirmPurchase()`.

4. **¿El backend espera `tripId` en el body de los mensajes o solo lo toma de la URL del WebSocket?**
   - El frontend lo envía en ambos lugares.

---

## Estado de Tests

```
Test Files  20 passed (20)
     Tests  244 passed (244)
   Duration  ~9s
```

**Nuevos tests WebSocket:** 7 tests adicionales en `websocketMessageHandler.test.ts`
