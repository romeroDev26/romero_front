# Problema de Inconsistencia en IDs de Configuraciones de Asientos

## Descripción del Problema

En algunas embarcaciones, los asientos no se pintan en el mapa de asientos del frontend, a pesar de que la API de `seatMap` devuelve datos. El problema afecta a ciertos trips/vessels de manera inconsistente.

## Evidencia de Logs

### Embarcación que NO funciona (vesselId: 2, tripId: 11)
```
vesselConfigIds: [4, 3]  // IDs reales de vessel.seat_configurations
seatConfigIdsInMap: [1, 2]  // IDs en seatMap.vessel_seat_config_id
missingConfigIds: [1, 2]  // No coinciden
Config 4: 0 seats  // Ningún asiento asignado
Config 3: 0 seats  // Ningún asiento asignado
seatLayout updated: {length: 2, sections: Array(2)}  // Secciones vacías
```

### Embarcación que SÍ funciona (vesselId: 1, tripId: 3)
```
vesselConfigIds: [1, 2]  // IDs reales de vessel.seat_configurations
seatConfigIdsInMap: [1, 2]  // IDs en seatMap.vessel_seat_config_id
missingConfigIds: []  // Coinciden perfectamente
Config 1: 120 seats  // Asientos asignados correctamente
Config 2: 20 seats  // Asientos asignados correctamente
seatLayout updated: {length: 2, sections: Array(2)}  // Secciones con asientos
```

## Causa Raíz

El backend está enviando datos inconsistentes en la API de `seatMap`. Específicamente:

- Los `vessel_seat_config_id` en los objetos del `seatMap` no coinciden con los `id` de `vessel.seat_configurations` para ciertos vessels/trips.
- Para vesselId 2: seatMap usa IDs [1, 2], pero vessel tiene configuraciones con IDs [4, 3].
- Para vesselId 1: Ambos coinciden en [1, 2].

Esto causa que el frontend no pueda asignar asientos a las secciones correctas, resultando en un mapa vacío.

## Impacto

- Usuarios no pueden seleccionar asientos en trips afectados.
- Inconsistencia en la experiencia de usuario entre diferentes embarcaciones.
- Pérdida de ventas potenciales.

## Solución Sugerida

1. **Revisar la lógica de generación del seatMap**: Asegurar que `vessel_seat_config_id` en cada asiento del seatMap corresponda exactamente a un `id` existente en `vessel.seat_configurations` del vessel asociado al trip.

2. **Verificar consistencia de datos**: Para cada trip, validar que todos los `vessel_seat_config_id` del seatMap existan en el vessel correspondiente.

3. **Posible query defectuosa**: Revisar si la query que genera el seatMap está uniendo incorrectamente con vessel configurations, o si hay datos corruptos en la base de datos.

## Pasos para Reproducir

1. Acceder a un trip con vesselId 2 (ej. tripId 11).
2. Verificar que el seatMap se carga (140 asientos), pero no se pintan.
3. Comparar con tripId 3 (vesselId 1), donde funciona correctamente.

## Archivos Afectados en Frontend

- `src/features/fluvial/components/seat-map/SeatMap.tsx`
- `src/features/fluvial/components/seat-map/SeatMapRealtime.tsx`
- Lógica en `useMemo` de `seatLayout` que asigna asientos por configuración.

## Prioridad

Alta - Afecta funcionalidad crítica de ventas.</content>
<parameter name="filePath">c:\Users\Zeltux\Desktop\pro\PROYECTO IQUITOS\transportes-romero-frontend\src\md_context\PROBLEMA_SEATMAP_IDS_INCONSISTENTES.md