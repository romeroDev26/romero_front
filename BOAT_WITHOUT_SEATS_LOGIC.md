# Lógica de Ventas para Botes Sin Asientos

## Descripción General

El sistema de ventas de Transportes Romero maneja dos tipos de embarcaciones:
1. **Lanchas con asientos** - Embarcaciones con configuración específica de asientos numerados
2. **Botes sin asientos** - Embarcaciones donde los pasajeros no tienen asientos asignados

Esta documentación explica cómo funciona la lógica para **botes sin asientos**.

## Arquitectura de la Solución

### 1. Detección Automática del Tipo de Embarcación

**Ubicación:** `SaleForm.tsx` líneas 137-161

```typescript
// Detectar tipo de embarcación
useQuery({
  queryKey: ['seatMap', trip.id],
  queryFn: async () => {
    try {
      const response = await api.get(`/operations/trips/${trip.id}/seat-map`);
      
      if (response.status === 204) {
        // 🔑 SIN ASIENTOS: El backend responde 204 No Content
        setCanSellWithoutSeats(true);
        setShowSeatMap(false);
        return null;
      } else if (response.status === 200) {
        // CON ASIENTOS: El backend responde 200 con datos
        const data = response.data;
        setCanSellWithoutSeats(false);
        setShowSeatMap(true);
        return data;
      }
    } catch (error) {
      // En caso de error, asumir que SÍ tiene asientos
      setCanSellWithoutSeats(false);
      setShowSeatMap(true);
      throw error;
    }
  },
  staleTime: 1000 * 60 * 5,
  retry: 1
});
```

### 2. Estados de Control

**Ubicación:** `SaleForm.tsx` líneas 95-96

```typescript
const [canSellWithoutSeats, setCanSellWithoutSeats] = useState(false);
const [showSeatMap, setShowSeatMap] = useState(true);
```

| Estado | Descripción |
|--------|-------------|
| `canSellWithoutSeats` | `true` cuando la embarcación no tiene configuración de asientos |
| `showSeatMap` | `false` oculta el mapa de asientos en la UI |

## Flujo de Detección

```mermaid
graph TD
    A[Cargar formulario de venta] --> B[Hacer petición GET /operations/trips/{id}/seat-map]
    B --> C{¿Qué status devuelve?}
    C -->|200 OK| D[Embarcación CON asientos]
    C -->|204 No Content| E[Embarcación SIN asientos]
    C -->|Error| F[Asumir CON asientos por seguridad]
    
    D --> G[canSellWithoutSeats = false<br/>showSeatMap = true<br/>serviceCategory = 'PASAJES']
    E --> H[canSellWithoutSeats = true<br/>showSeatMap = false<br/>serviceCategory = 'OTROS']
    F --> G
```

## Cambios en la Lógica de Negocio

### 1. Categoría de Servicio Automática

**Ubicación:** `SaleForm.tsx` líneas 212-214

```typescript
const serviceCategory = useMemo(() => {
  return canSellWithoutSeats ? "OTROS" as ServiceCategory : "PASAJES" as ServiceCategory;
}, [canSellWithoutSeats]);
```

| Tipo de Embarcación | Categoría de Servicio |
|--------------------|-----------------------|
| Con asientos | `"PASAJES"` |
| Sin asientos | `"OTROS"` |

### 2. Búsqueda de Tarifas

**Ubicación:** `SaleForm.tsx` líneas 216-220

```typescript
const { data: foundFare } = useFindFare({
  originPortId: getBoardingPortId(),
  destinationPortId: getDisembarkingPortId(),
  serviceCategory: serviceCategory, // 🔑 Cambia automáticamente
});
```

## Validaciones Adaptativas

### 1. Validación de Selección de Asiento

**Ubicación:** `saleValidationService.ts` líneas 42-52

```typescript
validateSeatSelection: (
  showSeatMap: boolean,
  selectedSeat: SeatMapItem | null
): SaleValidationResult => {
  const errors: string[] = [];

  // 🔑 CLAVE: Solo valida asiento si showSeatMap es true
  if (showSeatMap && !selectedSeat) {
    errors.push("Seleccione un número de asiento");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
},
```

### 2. Condición para Habilitar Botón de Venta

**Ubicación:** `SaleForm.tsx` líneas 500-505

```typescript
const areActionsEnabled =
  !!selectedBoardingStopId &&
  !!selectedDisembarkingStopId &&
  !!passengerData.docNumber.trim() &&
  !!passengerData.name.trim() &&
  // 🔑 Si no muestra mapa de asientos, no requiere asiento seleccionado
  (isRuc ? representatives.length > 0 : (!showSeatMap || !!selectedSeat));
```

## Cambios en la Interfaz de Usuario

### 1. Ocultación del Mapa de Asientos

Cuando `showSeatMap = false`, el componente `SeatAndFareSelector` aún se renderiza pero internamente:
- `SeatMapRealtime` no muestra el mapa
- No se requiere selección de asiento
- Solo se muestran los selectores de origen y destino

### 2. Ocultación del Botón de Reserva

**Ubicación:** `SaleForm.tsx` líneas 696-705

```typescript
{!isConfirmingMode && showSeatMap && !isRuc && (
  <Button onClick={() => setReservationModalOpen(true)}>
    Reservar Asiento
  </Button>
)}
```

El botón de reserva solo se muestra cuando `showSeatMap = true`.

### 3. Deshabilitación del Modal de Reserva

**Ubicación:** `SaleForm.tsx` líneas 731-744

```typescript
{selectedSeat && tripDetails && areActionsEnabled && showSeatMap && (
  <ReservationModal
    // ...props
  />
)}
```

## Manejo de Representantes (Ventas RUC)

### Para Embarcaciones Sin Asientos

**Ubicación:** `AddRepresentativeForm.tsx`

```typescript
// Detección de embarcación sin asientos
useQuery({
  queryKey: ['seatMap', tripId],
  queryFn: async () => {
    const response = await api.get(`/operations/trips/${tripId}/seat-map`);
    if (response.status === 204) {
      return null; // Sin asientos configurados
    }
    return response.data;
  }
});

// Texto mostrado en la UI
const seatDisplayText = selectedSeat?.seat_number 
  ? selectedSeat.seat_number 
  : "Sin asientos configurados";

// Mensaje cuando no hay configuración
<p className="text-gray-500 text-sm text-center">
  Esta embarcación no tiene asientos configurados
</p>
```

## Procesamiento de Ventas

### 1. Validación de Asiento Condicional

**Ubicación:** `useSaleBusinessLogic.ts` líneas 253-261

```typescript
// Validación de asiento solo si es necesario
if (showSeatMap && selectedSeat) {
  const seatValidationResult = await seatValidation.validateSeatAvailability({
    tripId,
    seatId: selectedSeat.id,
    userId: currentUser?.id || 'unknown'
  });
  // ...validación
}
```

### 2. Creación de Factura Sin Asiento

Para embarcaciones sin asientos:
- No se crea `SeatAssignment`
- No se valida disponibilidad de asiento
- Se procesa como servicio de categoría "OTROS"
- El precio se busca en tarifas de tipo "OTROS"

## Ejemplos de Uso

### Caso 1: Lancha con Asientos
```
GET /operations/trips/123/seat-map
Response: 200 OK
{
  "seats": [
    {"id": 1, "seat_number": "1A", "status": "available"},
    {"id": 2, "seat_number": "1B", "status": "occupied"}
  ]
}

Resultado:
- canSellWithoutSeats = false
- showSeatMap = true
- serviceCategory = "PASAJES"
- Se requiere seleccionar asiento
```

### Caso 2: Bote sin Asientos
```
GET /operations/trips/456/seat-map
Response: 204 No Content

Resultado:
- canSellWithoutSeats = true
- showSeatMap = false
- serviceCategory = "OTROS"
- NO se requiere seleccionar asiento
```

## Beneficios de la Arquitectura

### 1. **Detección Automática**
- El frontend no necesita configuración manual
- El backend determina el tipo de embarcación
- Status HTTP 204 vs 200 como indicador

### 2. **Adaptación Transparente**
- Mismo formulario para ambos tipos
- Validaciones condicionales
- UI responsiva según el tipo

### 3. **Compatibilidad Total**
- Funciona con ventas individuales
- Funciona con ventas empresariales (RUC)
- Mantiene toda la funcionalidad existente

### 4. **Mantenimiento Simplificado**
- Un solo punto de verdad (el backend)
- Lógica centralizada en el formulario
- Fácil extensión para nuevos tipos

## Consideraciones Técnicas

### Estados Críticos
- `canSellWithoutSeats`: Controlador principal
- `showSeatMap`: Control de UI
- `serviceCategory`: Búsqueda de tarifas correctas

### Validaciones Clave
- Asiento solo requerido si `showSeatMap = true`
- Botón habilitado sin asiento si `showSeatMap = false`
- Representantes pueden agregarse sin asiento específico

### Flujo de Datos
1. **Detección** → API `/seat-map` determina tipo
2. **Estado** → Se actualiza `canSellWithoutSeats`
3. **Categoría** → Cambia automáticamente a "OTROS" o "PASAJES"  
4. **Tarifas** → Se buscan con la categoría correcta
5. **Validación** → Condicional según `showSeatMap`
6. **Venta** → Se procesa sin asignación de asiento

Esta arquitectura permite manejar ambos tipos de embarcaciones de manera transparente y eficiente.

## Generación de Tickets para Botes Sin Asientos

### Características del Ticket

Para embarcaciones **sin asientos** (botes cargueros con hamacas), el ticket se genera normalmente usando el transformer `normalSale.transformer.ts`, pero con las siguientes adaptaciones:

#### 1. **Detección Automática en el Transformer**

**Ubicación:** `normalSale.transformer.ts` - función `transformTripDetails`

```typescript
// Detectar si es embarcación sin asientos para personalizar el mensaje
const isWithoutSeats = isVesselWithoutSeats(data.items);
const seatInfo = isWithoutSeats ? 'Elección libre' : extractMainSeatNumber(data.items);
```

#### 2. **Función Helper de Detección**

**Ubicación:** `ticketHelpers.ts`

```typescript
/**
 * Detecta si la venta corresponde a una embarcación sin asientos
 * Basándose en trip_seat_id null y descripción con "elección libre"
 */
export function isVesselWithoutSeats(items: any[]): boolean {
  return items.some(item => 
    item.trip_id && 
    (item.trip_seat_id === null || item.trip_seat_id === undefined) &&
    item.item_description && 
    item.item_description.toLowerCase().includes('elección libre')
  );
}
```

#### 3. **Diferencias en el Ticket**

| Tipo de Embarcación | Campo ASIENTO |
|---------------------|---------------|
| Con asientos | `"N° 24"` |
| Sin asientos | `"Elección libre"` |

### Criterios de Detección

Un ticket se considera de "embarcación sin asientos" cuando:

1. **`trip_seat_id: null`** - No hay ID de asiento específico
2. **`seat_number: null`** - No hay número de asiento
3. **`item_description`** contiene "elección libre de ubicación"
4. **`vehicle_name`** típicamente "Bote Carguero" (ej: "Romero X")

### Ejemplo de JSON Sin Asientos

```json
{
  "items": [
    {
      "trip_seat_id": null,
      "seat_number": null,
      "item_description": "Servicio de Transporte Fluvial. Tramo: Iquitos - Nauta. Elección libre de ubicación",
      "vehicle_name": "Romero X"
    }
  ]
}
```

### Helper Functions Actualizadas

#### `extractMainSeatNumber()`
- **Con asientos:** Retorna el número de asiento (ej: "24")  
- **Sin asientos:** Retorna "Elección libre" cuando detecta `trip_seat_id: null`

#### `extractVehicleName()`
- **Con asientos:** Busca por `trip_seat_id` válido
- **Sin asientos:** Busca por `trip_id` cuando no hay asientos específicos

### Flujo de Generación de Ticket

```mermaid
graph TD
    A[Datos del backend] --> B[normalSale.transformer.ts]
    B --> C[isVesselWithoutSeats()]
    C -->|true| D[seatInfo = 'Elección libre']
    C -->|false| E[seatInfo = extractMainSeatNumber()]
    D --> F[Generar ticket con 'Elección libre']
    E --> G[Generar ticket con número de asiento]
```

### Compatibilidad

- **✅ Tickets normales** - Funcionan igual que antes
- **✅ Tickets sin asientos** - Muestran "Elección libre"  
- **✅ Tickets empresariales** - Compatible con ambos tipos
- **✅ Mismo template** - Un solo transformer para ambos casos
