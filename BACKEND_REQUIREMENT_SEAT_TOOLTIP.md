# Requisito Backend — Información de Ocupante en Mapa de Asientos (POS)

> **Fecha:** 2026-05-27  
> **Módulo:** Operaciones / Punto de Venta (POS) — Mapa de Asientos  
> **Solicitante:** Frontend Team  
> **Prioridad:** Media-Alta

---

## 1. Resumen

En el punto de venta (POS), los vendedores necesitan ver información útil al pasar el cursor sobre los asientos **vendidos** (`CONFIRMED`) o **reservados** (`RESERVED`) en el mapa de asientos. Actualmente el tooltip solo muestra el número de asiento, tipo y estado genérico, lo cual no aporta valor operativo.

**Objetivo:** Enriquecer la respuesta del endpoint que entrega el mapa de asientos para que incluya, en cada asiento ocupado o reservado, los datos del pasajero: **nombre**, **origen**, **destino** y **monto pagado**.

---

## 2. Cambios Requeridos

### 2.1 Endpoint Afectado

```
GET /api/v1/operations/trips/{tripId}/seat-map
```

**Descripción actual:** Devuelve un array de `SeatMapItem` con la configuración y estado de cada asiento del viaje.

**Descripción nueva:** La respuesta debe seguir siendo un array de `SeatMapItem`, pero cada elemento **puede** incluir un campo opcional `occupant` cuando el asiento tenga estado `CONFIRMED` o `RESERVED`.

---

### 2.2 Estructura de Datos Propuesta

#### `SeatMapItem` (existente — sin cambios en campos actuales)

```json
{
  "id": 1523,
  "trip_id": 87,
  "vessel_seat_config_id": 42,
  "seat_number": "15",
  "status": "CONFIRMED",
  "notes": "",
  "seat_type": {
    "id": 1,
    "name": "reclinable",
    "code": "REC",
    "price_multiplier": 1.0
  }
}
```

#### `SeatMapItem` con campo nuevo `occupant`

```json
{
  "id": 1523,
  "trip_id": 87,
  "vessel_seat_config_id": 42,
  "seat_number": "15",
  "status": "CONFIRMED",
  "notes": "",
  "seat_type": {
    "id": 1,
    "name": "reclinable",
    "code": "REC",
    "price_multiplier": 1.0
  },
  "occupant": {
    "passenger_name": "Juan Pérez García",
    "origin_stop_name": "Iquitos",
    "destination_stop_name": "Yurimaguas",
    "amount_paid": 85.00,
    "currency_code": "PEN",
    "document_number": "44556677",
    "status_detail": "PAGADO"
  }
}
```

---

### 2.3 Definición del Objeto `occupant`

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `passenger_name` | `string` | Sí | Nombre completo del pasajero. Para reservas, usar `customer_name`. |
| `origin_stop_name` | `string` | Sí | Nombre del puerto/ciudad de embarque (`boarding_stop.name` o `boarding_stop.port.name`). |
| `destination_stop_name` | `string` | Sí | Nombre del puerto/ciudad de desembarque (`disembarking_stop.name` o `disembarking_stop.port.name`). |
| `amount_paid` | `number` | Sí | Monto total pagado por el pasaje. Para reservas, usar `total_price`. |
| `currency_code` | `string` | Sí | Código de moneda (ej. `"PEN"`, `"USD"`). |
| `document_number` | `string` | No | DNI, CE o RUC del pasajero. Muy útil para el vendedor a la hora de identificar. |
| `status_detail` | `string` | No | Texto descriptivo del estado de pago. Ejemplos: `"PAGADO"`, `"PENDIENTE S/ 30.00"`, `"ADELANTO S/ 50.00"`. |

> **Nota:** El campo `occupant` debe ser **omitido** (no `null`, sino omitido por completo) cuando el asiento tenga estado `AVAILABLE`, `BLOCKED`, `CANCELLED` o `EXPIRED`.

---

### 2.4 Fuentes de Datos Sugeridas (Backend)

Dependiendo del estado del asiento, el backend debe consultar:

| Estado | Tabla/Entidad Principal | Relaciones a incluir |
|--------|------------------------|----------------------|
| `CONFIRMED` | `SeatAssignment` | `passenger_name`, `boarding_stop` → `port`, `disembarking_stop` → `port`, `invoice_item` → `total_price`, `currency` |
| `RESERVED` | `SeatReservation` | `customer_name`, `boarding_stop` → `port`, `disembarking_stop` → `port`, `total_price`, `advance_amount`, `remaining_amount`, `currency_code` |

**Lógica sugerida para `amount_paid`:**
- Si es `CONFIRMED`: usar el monto total del ítem de factura (`invoice_item.total_price` o `invoice_item.unit_price * quantity`).
- Si es `RESERVED`: usar `total_price`. En `status_detail` se puede indicar si hay saldo pendiente.

---

## 3. Cambios en WebSocket (Opcional pero Recomendado)

Cuando el backend emite el mensaje `SEATS_OCCUPIED` por WebSocket a todos los clientes conectados al viaje, sería ideal incluir también el objeto `occupant` para que el tooltip se actualice en tiempo real sin necesidad de refrescar la página.

**Mensaje WebSocket actual (ejemplo):**
```json
{
  "type": "SEATS_OCCUPIED",
  "tripId": 87,
  "seatIds": [1523],
  "status": "CONFIRMED"
}
```

**Mensaje WebSocket propuesto:**
```json
{
  "type": "SEATS_OCCUPIED",
  "tripId": 87,
  "seatIds": [1523],
  "status": "CONFIRMED",
  "occupants": {
    "1523": {
      "passenger_name": "Juan Pérez García",
      "origin_stop_name": "Iquitos",
      "destination_stop_name": "Yurimaguas",
      "amount_paid": 85.00,
      "currency_code": "PEN",
      "document_number": "44556677",
      "status_detail": "PAGADO"
    }
  }
}
```

> Si no se incluye en WebSocket, el frontend hará un refetch del `/seat-map` para obtener la información actualizada, lo cual genera carga adicional innecesaria.

---

## 4. Consideraciones de Performance

- El endpoint `/seat-map` ya hace un `JOIN` con `seat_type`. Agregar los datos del ocupante requerirá joins adicionales con `seat_assignments` / `seat_reservations` y sus relaciones (`trip_stops`, `ports`, `invoice_items`).
- Se recomienda usar **eager loading** o una **query optimizada** para evitar el problema N+1.
- El campo `occupant` es opcional, por lo que no debería afectar el payload para asientos disponibles.

---

## 5. Validación (Checklist para Backend)

- [ ] El endpoint `GET /operations/trips/{tripId}/seat-map` incluye `occupant` en asientos `CONFIRMED`.
- [ ] El endpoint incluye `occupant` en asientos `RESERVED`.
- [ ] El campo `occupant` está **omitido** en asientos `AVAILABLE`, `BLOCKED`, `CANCELLED`, `EXPIRED`.
- [ ] `origin_stop_name` y `destination_stop_name` muestran el nombre del puerto (no el ID).
- [ ] `amount_paid` es un número con 2 decimales.
- [ ] `currency_code` sigue el formato ISO 4217 (3 letras).
- [ ] (Opcional) El mensaje WebSocket `SEATS_OCCUPIED` incluye el mapa `occupants`.

---

## 6. Contacto

Cualquier duda sobre la integración o el formato de los datos, contactar al equipo de Frontend.
