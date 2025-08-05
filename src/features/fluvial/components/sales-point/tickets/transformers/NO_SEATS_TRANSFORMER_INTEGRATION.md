# Integración de Transformador para Embarcaciones Sin Asientos

## Resumen

Se ha creado un transformador especializado `NoSeatsSaleTransformer` para manejar la generación de tickets de embarcaciones que no requieren selección de asientos (como lanchas colectivas), mostrando "Elección libre" en lugar de números de asiento específicos.

## Archivos Creados

### `noSeatsSale.transformer.ts`
- **Propósito**: Transformador especializado para embarcaciones sin asientos
- **Ubicación**: `src/features/fluvial/components/sales-point/tickets/transformers/`
- **Diferencia Principal**: En el bloque de detalles del viaje, muestra "Elección libre" en el campo ASIENTO

## Implementación de Detección Automática

Para integrar este transformador en el sistema existente, necesitas implementar la lógica de selección automática entre transformadores:

### 1. Crear un Factory de Transformadores

```typescript
// src/features/fluvial/components/sales-point/tickets/transformers/transformerFactory.ts

import { BackendInvoiceData } from '../types/backend.types';
import { TicketData } from '../types/ticket.types';
import { NormalSaleTransformer } from './normalSale.transformer';
import { NoSeatsSaleTransformer } from './noSeatsSale.transformer';
import { isVesselWithoutSeats } from '../utils/ticketHelpers';

export class TransformerFactory {
  /**
   * Selecciona automáticamente el transformador apropiado basado en el tipo de embarcación
   */
  static transform(backendData: BackendInvoiceData): TicketData {
    if (isVesselWithoutSeats(backendData.items)) {
      console.log('Detectada embarcación sin asientos, usando NoSeatsSaleTransformer');
      return NoSeatsSaleTransformer.transform(backendData);
    } else {
      console.log('Detectada embarcación con asientos, usando NormalSaleTransformer');
      return NormalSaleTransformer.transform(backendData);
    }
  }
}
```

### 2. Actualizar Componentes que Generen Tickets

En los componentes que actualmente usan `NormalSaleTransformer.transform()`, reemplaza por:

```typescript
// Antes:
const ticketData = NormalSaleTransformer.transform(backendData);

// Después:
const ticketData = TransformerFactory.transform(backendData);
```

### 3. Exportar en el Index

Agrega al archivo `index.ts` del directorio de transformers:

```typescript
export { NoSeatsSaleTransformer } from './noSeatsSale.transformer';
export { TransformerFactory } from './transformerFactory';
```

## Criterios de Detección

El sistema detecta embarcaciones sin asientos basándose en:

1. **Categoría del Servicio**: `item.category === "OTROS"`
2. **API de Mapa de Asientos**: Status HTTP 204 (Sin contenido) al consultar `/seat-map/`
3. **Función Helper**: `isVesselWithoutSeats()` implementa esta lógica

## Funcionalidad Específica

### Diferencias del NoSeatsSaleTransformer:

1. **Campo ASIENTO**: Muestra "Elección libre" en lugar de números específicos
2. **Mantenimiento de Estructura**: Todos los demás campos permanecen iguales
3. **Compatibilidad**: Usa la misma estructura de datos que el transformador normal

### Ejemplo de Salida:

```
DATOS DEL VIAJE
EMBARCACIÓN    L.C. VICTORIA 25
ORIGEN         Iquitos
DESTINO        Pevas
FECHA VIAJE    15/01/2024
HORA VIAJE     08:00
EMBARQUE       07:30
ASIENTO        Elección libre  ← Esta es la diferencia principal
```

## Beneficios

1. **Separación de Responsabilidades**: Cada transformador maneja su tipo específico
2. **Mantenimiento**: Cambios en uno no afectan al otro
3. **Escalabilidad**: Fácil agregar nuevos tipos de transformadores
4. **Detección Automática**: No requiere intervención manual del usuario
5. **Backward Compatibility**: El sistema existente sigue funcionando igual

## Próximos Pasos

1. **Crear TransformerFactory**: Implementar la clase factory mostrada arriba
2. **Actualizar Componentes**: Reemplazar llamadas directas por el factory
3. **Pruebas**: Verificar que ambos tipos de embarcación generan tickets correctos
4. **Documentación**: Actualizar la documentación del desarrollador

## Notas Técnicas

- El transformador usa exactamente la misma estructura de tipos que el original
- La única diferencia está en la línea que determina el valor del campo ASIENTO
- Mantiene toda la funcionalidad de validación y formateo del transformador original
- Es completamente compatible con el sistema de generación de tickets existente
