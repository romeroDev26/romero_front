# Corrección: Sistema de Detección de Embarcaciones Sin Asientos

## Problema Identificado

Se encontró un **conflicto crítico** en la detección de embarcaciones sin asientos que causaba que la UI mostrara información incorrecta:

### ❌ **Conflicto de Consultas Duplicadas**
```
1. SaleForm.tsx (línea 237): useQuery({ queryKey: ["seatMap", trip.id] })
   ↓ Detecta código 204 → setShowSeatMap(false)
   
2. useSeatMap.ts: useQuery({ queryKey: ['seatMap', tripId] })  
   ↓ Usa tripsService.getSeatMap() → NO maneja 204 → FALLA
   ↓ React Query cache colisiona → SOBREESCRIBE el resultado
```

### 🔍 **Síntomas del Error**
- Embarcación **SIN asientos** mostraba UI **CON asientos**
- La detección inicial funcionaba, pero era sobreescrita
- Consultas con la misma `queryKey` se pisaban entre sí
- `SeatAndFareSelector` se renderizaba cuando no debería

## Solución Implementada

### ✅ **1. Sistema Centralizado de Detección**

Creada nueva carpeta: `/vessel-detection/`

```
📁 vessel-detection/
├── 📄 types.ts              - Interfaces y tipos
├── 📄 config.ts             - Configuración (keywords, listas conocidas)
├── 📄 vesselDetectionService.ts - Lógica centralizada  
├── 📄 useVesselDetection.ts - Hook personalizado
└── 📄 index.ts              - Exports
```

### ✅ **2. VesselDetectionService**

**Métodos de detección ordenados por confiabilidad:**

```typescript
1. 🎯 API 204 (alta confianza)    → /seat-map devuelve 204 No Content
2. 🎯 API 200 (alta confianza)    → /seat-map devuelve datos
3. 📋 Lista conocida (alta confianza) → IDs/nombres específicos
4. 🔤 Keywords (media confianza)   → Análisis del nombre
5. 🛡️ Fallback (baja confianza)   → Por defecto CON asientos
```

### ✅ **3. Hook Personalizado: useVesselDetection**

```typescript
const {
  hasSeats,                    // boolean - resultado final
  canSellWithoutSeats,         // boolean - estado derivado
  showSeatMap,                 // boolean - controla UI
  detectionMethod,             // string - método usado
  confidence,                  // 'high'|'medium'|'low'
  isLoading                    // boolean - cargando
} = useVesselDetection({
  tripId: trip.id,
  vesselName: trip.vessel_name
});
```

## Cambios en SaleForm.tsx

### ❌ **Antes (Código Problemático)**
```typescript
// 🚨 DUPLICADO 1: Query manual conflictiva
useQuery({
  queryKey: ["seatMap", trip.id], // ← COLISIONA
  queryFn: async () => {
    const response = await api.get(`/operations/trips/${trip.id}/seat-map`);
    if (response.status === 204) setShowSeatMap(false);
    // ... 100+ líneas de lógica manual
  }
});

// 🚨 DUPLICADO 2: SeatAndFareSelector usa useSeatMap
// useSeatMap.ts también usa queryKey: ['seatMap', tripId] ← COLISIONA
```

### ✅ **Después (Código Limpio)**
```typescript
// ✅ CENTRALIZADO: Una sola fuente de verdad
const { canSellWithoutSeats, showSeatMap } = useVesselDetection({
  tripId: trip.id,
  vesselName: trip.vessel_name
});

// ✅ Estados locales sincronizados automáticamente
useEffect(() => {
  if (!isDetectingVessel) {
    setCanSellWithoutSeats(detectedCanSellWithoutSeats);
    setShowSeatMap(detectedShowSeatMap);
  }
}, [detectedCanSellWithoutSeats, detectedShowSeatMap, isDetectingVessel]);
```

## UI Corregida

### ✅ **Flujo Correcto**
```
1. useVesselDetection detecta embarcación sin asientos
2. showSeatMap = false
3. SaleForm renderiza UI alternativa:
   ┌─────────────────────────────────────┐
   │ 🚢 Embarcación sin asientos numerados │
   │ Esta embarcación utiliza sistema de  │
   │ elección libre de asientos           │
   └─────────────────────────────────────┘
4. SeatAndFareSelector NO se renderiza
5. Botón "Reservar" NO aparece ✅
```

## Beneficios de la Solución

### 🔧 **Técnicos**
- ✅ **Una sola fuente de verdad** - No más consultas duplicadas
- ✅ **Configuración centralizada** - Fácil mantenimiento
- ✅ **Tipos TypeScript** - Mejor developer experience  
- ✅ **Queries optimizadas** - Cache sin conflictos

### 👥 **Para Usuario**
- ✅ **UI correcta** - Muestra el estado real de la embarcación
- ✅ **Sin opciones confusas** - No aparece "Reservar" cuando no aplica
- ✅ **Información clara** - Mensaje específico sobre elección libre

### 🛡️ **Para Mantenimiento**
- ✅ **Código organizado** - Lógica separada por responsabilidad
- ✅ **Fácil testing** - Funciones puras y modulares
- ✅ **Extensible** - Agregar nuevos métodos de detección
- ✅ **Documentado** - Tipos y comentarios claros

## Testing Manual

Para verificar que funciona:

1. **Embarcación CON asientos:**
   - ✅ Debe mostrar `SeatAndFareSelector`
   - ✅ Debe mostrar botón "Reservar Asiento"

2. **Embarcación SIN asientos:**
   - ✅ Debe mostrar mensaje "Embarcación sin asientos numerados"
   - ✅ NO debe mostrar `SeatAndFareSelector`
   - ✅ NO debe mostrar botón "Reservar"

## Estado del Fix

✅ **COMPLETADO**: Sistema de detección refactorizado
✅ **COMPLETADO**: Conflicto de queries resuelto  
🔄 **EN PROGRESO**: Integración completa en SaleForm.tsx
⏳ **PENDIENTE**: Testing en producción