# Sistema de Confirmación de Reservas

Este módulo maneja toda la lógica relacionada con la confirmación de reservas de asientos en el sistema fluvial. Ha sido separado del componente `SaleForm` principal para reducir la complejidad y mejorar la mantenibilidad.

## Componentes

### ReservationConfirmationHandler

Componente visual que muestra información detallada de la reserva y maneja la UI del proceso de confirmación.

**Props:**
- `reservation`: Datos de la reserva a confirmar (`SeatReservation`)
- `tripDetails`: Detalles del viaje
- `seatMap`: Mapa de asientos del viaje
- `onPassengerDataChange`: Callback para actualizar datos del pasajero
- `onBoardingStopChange`: Callback para cambiar parada de embarque
- `onDisembarkingStopChange`: Callback para cambiar parada de desembarque
- `onSelectedSeatChange`: Callback para seleccionar asiento
- `onConfirmingModeChange`: Callback para cambiar modo de confirmación

**Características:**
- Muestra información completa de la reserva (cliente, precios, fechas)
- Valida automáticamente si la reserva es elegible para confirmación
- Muestra alertas sobre pagos pendientes y estados de la reserva
- Prellenado automático de todos los campos del formulario

### useReservationConfirmation

Hook que centraliza la lógica de procesamiento de reservas.

**Funciones principales:**

#### `preparePassengerDataFromReservation(reservation)`
Convierte datos de una reserva en formato `PassengerData` para prellenar el formulario.

#### `validateReservationForConfirmation(reservation)`
Valida si una reserva puede ser confirmada, retornando errores y advertencias.

#### `findReservedSeatInMap(reservation, seatMap)`
Encuentra el asiento correspondiente en el mapa de asientos.

#### `processReservationForConfirmation(reservation, seatMap)`
Función principal que procesa una reserva completa y retorna todos los datos necesarios.

## Integración con SaleForm

El sistema se integra automáticamente con el `SaleForm` principal:

1. **Detección automática**: Cuando se pasa un `reservationToConfirm`, el sistema se activa automáticamente
2. **Prellenado de datos**: Todos los campos (documento, nombre, teléfono, email) se prellenan y bloquean automáticamente
3. **Validación**: Se valida el estado de la reserva y se muestran alertas apropiadas
4. **Sincronización de asientos**: El asiento reservado se selecciona automáticamente en el mapa

## Flujo de Confirmación

1. Usuario selecciona "Confirmar venta" en una reserva
2. `ReservationConfirmationHandler` se renderiza mostrando información de la reserva
3. Hook `useReservationConfirmation` procesa la reserva y prellena datos
4. Campos del formulario se bloquean para evitar modificaciones accidentales
5. Usuario puede proceder con la venta usando los botones normales del `SaleForm`

## Mejoras implementadas

### Manejo de Datos Faltantes
- **Email nulo**: Se maneja correctamente cuando `customer_email` es `null`
- **Teléfono faltante**: Se proporciona string vacío cuando `customer_phone` es `null`
- **Dirección**: No se incluye en reservas (solo para RUC en ventas directas)

### Validaciones Mejoradas
- Verificación de estado de reserva (solo `RESERVED` puede confirmarse)
- Validación de fechas de expiración
- Alertas sobre pagos pendientes
- Advertencias sobre asientos no encontrados en el mapa

### UX Mejorada
- Información visual clara de la reserva
- Códigos de color para diferentes estados
- Mensajes contextuales sobre pagos pendientes
- Bloqueo automático de campos para evitar errores

## Uso

```tsx
// En SaleForm, el componente se renderiza automáticamente cuando hay reservationToConfirm
{reservationToConfirm && isConfirmingMode && (
  <ReservationConfirmationHandler
    reservation={reservationToConfirm}
    tripDetails={tripDetails}
    seatMap={seatMap}
    onPassengerDataChange={setPassengerData}
    onBoardingStopChange={setSelectedBoardingStopId}
    onDisembarkingStopChange={setSelectedDisembarkingStopId}
    onSelectedSeatChange={setSelectedSeat}
    onConfirmingModeChange={setIsConfirmingMode}
  />
)}
```

## Beneficios

1. **Reducción de complejidad**: Lógica separada del `SaleForm` principal
2. **Mejor mantenibilidad**: Código específico de confirmaciones en un módulo dedicado
3. **Reutilización**: Componente puede ser usado en otros contextos si es necesario
4. **Testing**: Más fácil testear lógica aislada
5. **UX consistente**: Experiencia uniforme para confirmación de reservas