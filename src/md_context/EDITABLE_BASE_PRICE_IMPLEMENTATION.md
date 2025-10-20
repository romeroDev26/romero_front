# Implementación de Precio Base Editable en SaleForm

## 📋 Resumen
Se ha implementado la funcionalidad para permitir que el precio de la tarifa de pasaje sea **editable directamente** en el componente `PriceSummary`, permitiendo al usuario modificar el precio si está incorrecto o necesita ajustes.

## 🎯 Objetivo
Permitir que los usuarios puedan modificar manualmente el precio de la tarifa de pasaje directamente desde el resumen de venta, sin afectar las funcionalidades existentes de:
- Precio manual para USD
- Precio manual cuando no hay tarifa configurada
- Cálculos automáticos de IGV, descuentos y costos adicionales

## 🔧 Cambios Implementados

### 1. **SaleForm.tsx**

#### Nuevos Estados
```typescript
// Estado para precio base editable (siempre disponible)
const [editableBasePrice, setEditableBasePrice] = useState<number | null>(null);
```

#### Sincronización Automática con Tarifa
Se agregó un `useEffect` que sincroniza automáticamente el precio editable con el precio de la tarifa cuando este cambia:

```typescript
useEffect(() => {
  if (basePrice !== null && basePrice > 0) {
    setEditableBasePrice(basePrice);
  } else {
    setEditableBasePrice(null);
  }
}, [basePrice]);
```

#### Cálculo del Precio Efectivo
Se modificó el cálculo del precio efectivo para incluir el precio editable con la siguiente prioridad:

1. **Precio editable modificado** por el usuario (si es diferente al precio base)
2. **Precio manual** (para USD o cuando no hay tarifa)
3. **Precio base** de la tarifa o precio editable sincronizado

```typescript
const effectiveBasePrice = useMemo(() => {
  if (editableBasePrice !== null && editableBasePrice !== basePrice) {
    return editableBasePrice;
  }
  if (isManualPriceMode) {
    return manualPrice || 0;
  }
  return editableBasePrice ?? basePrice ?? 0;
}, [editableBasePrice, basePrice, isManualPriceMode, manualPrice]);
```

#### Handler para Cambio de Precio
```typescript
const handleEditableBasePriceChange = (newPrice: number) => {
  if (newPrice < 0) {
    toast.error("El precio no puede ser negativo");
    return;
  }
  if (newPrice > 10000) {
    toast.error("El precio no puede exceder S/ 10,000");
    return;
  }
  setEditableBasePrice(newPrice);
};
```

#### Limpieza de Estado
Se actualizaron las funciones de limpieza para incluir el precio editable:

```typescript
// clearFormAfterSale
setEditableBasePrice(null);

// clearStateForVesselChange
setEditableBasePrice(null);
```

#### Props Pasadas a PriceSummary
```typescript
<PriceSummary
  // ... props existentes
  editableBasePrice={editableBasePrice}
  onEditableBasePriceChange={handleEditableBasePriceChange}
/>
```

### 2. **PriceSummary.tsx**

#### Nuevas Props
```typescript
interface PriceSummaryProps {
  // ... props existentes
  editableBasePrice?: number | null;
  onEditableBasePriceChange?: (price: number) => void;
}
```

#### UI Mejorada con Campo Editable

**Para venta individual (no RUC):**
```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Tarifa Pasaje (Editable):
  </label>
  <Input
    type="number"
    value={editableBasePrice === null || editableBasePrice === 0 ? '' : editableBasePrice.toString()}
    onChange={(e) => {
      const value = parseFloat(e.target.value) || 0;
      onEditableBasePriceChange?.(value);
    }}
    placeholder={`${currencySymbol} 0.00`}
    step="0.10"
    min="0"
    max="10000"
    className="text-sm font-medium"
  />
  {seatMultiplier !== 1 && (
    <p className="text-xs text-blue-600">
      Multiplicador de asiento: x{seatMultiplier.toFixed(2)}
    </p>
  )}
</div>
```

**Para venta empresarial (RUC con representantes):**
```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Tarifa por Pasajero (Editable):
  </label>
  <Input
    type="number"
    value={editableBasePrice === null || editableBasePrice === 0 ? '' : editableBasePrice.toString()}
    onChange={(e) => {
      const value = parseFloat(e.target.value) || 0;
      onEditableBasePriceChange?.(value);
    }}
    placeholder={`${currencySymbol} 0.00`}
    step="0.10"
    min="0"
    max="10000"
    className="text-sm font-medium"
  />
</div>
```

#### Nota Informativa
Se agregó una nota informativa para que el usuario sepa que puede editar el precio:

```tsx
{!isManualPriceMode && (
  <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
    <p className="text-xs text-blue-700">
      💡 <strong>Consejo:</strong> Puede editar el precio de la tarifa directamente si es necesario
    </p>
  </div>
)}
```

## 📊 Flujo de Datos

```
Tarifa del Backend (basePrice)
    ↓
Sincronización automática
    ↓
editableBasePrice (estado local)
    ↓
Usuario puede modificar en PriceSummary
    ↓
Cálculo de effectiveBasePrice
    ↓
Usado en calculatePriceDetails
    ↓
Cálculos finales (IGV, descuentos, total)
```

## ✅ Validaciones Implementadas

1. **Precio mínimo:** No puede ser negativo
2. **Precio máximo:** No puede exceder S/ 10,000
3. **Compatibilidad:** No afecta el modo manual para USD
4. **Sincronización:** Se actualiza automáticamente cuando cambia la tarifa
5. **Limpieza:** Se resetea correctamente al completar venta o cambiar embarcación

## 🎨 Experiencia de Usuario

### Antes
- El precio se mostraba como un valor estático no editable
- Si el precio estaba mal, se requería ajustar desde otro lugar

### Ahora
- El precio se muestra en un campo de input editable
- El usuario puede modificarlo directamente si es necesario
- Se muestra un hint informativo sobre la posibilidad de editar
- Para ventas empresariales, se muestra claramente "Tarifa por Pasajero (Editable)"
- El multiplicador de asiento se muestra cuando es diferente de 1

## 🔄 Compatibilidad

✅ **Mantiene compatibilidad con:**
- Sistema de precio manual para USD
- Sistema de precio manual cuando no hay tarifa configurada
- Cálculos de IGV y descuentos
- Ventas empresariales con representantes
- Ventas individuales
- Multiplicadores de asiento (VIP, etc.)
- Sistema de monedas (PEN/USD)

## 🧪 Casos de Uso

### Caso 1: Precio Automático con Ajuste Manual
1. Usuario selecciona origen y destino
2. Sistema carga precio automático de S/ 50.00
3. Usuario nota que el precio debería ser S/ 55.00
4. Usuario edita directamente el campo a S/ 55.00
5. Los cálculos se actualizan automáticamente

### Caso 2: Venta Empresarial
1. Usuario ingresa RUC y datos de empresa
2. Agrega 5 representantes
3. Sistema muestra tarifa por pasajero de S/ 45.00
4. Usuario ajusta a S/ 48.00
5. Total se calcula: S/ 48.00 × 5 = S/ 240.00

### Caso 3: Sin Tarifa Configurada
1. Usuario selecciona tramo sin tarifa
2. Sistema activa modo manual (alert amarillo)
3. Usuario ingresa precio manual
4. (El sistema editable NO interfiere con este flujo)

## 📝 Notas Técnicas

- El estado `editableBasePrice` se sincroniza automáticamente con `basePrice`
- Solo se considera "modificado" si el valor es diferente al `basePrice` original
- El cálculo de `effectiveBasePrice` tiene una jerarquía clara de prioridades
- Se mantiene toda la lógica existente de validaciones y cálculos

## 🐛 Posibles Mejoras Futuras

1. **Historial de cambios:** Registrar cuando se modifica manualmente un precio
2. **Límites dinámicos:** Calcular límites máximos basados en reglas de negocio
3. **Advertencias:** Mostrar alerta si el precio difiere mucho del precio base
4. **Autorización:** Requerir permisos especiales para modificar precios

## 🔍 Testing Recomendado

- ✅ Editar precio en venta individual
- ✅ Editar precio en venta empresarial
- ✅ Verificar que descuentos funcionen correctamente
- ✅ Verificar cálculo de IGV con precio editado
- ✅ Verificar que se resetee al cambiar de embarcación
- ✅ Verificar que se resetee después de una venta exitosa
- ✅ Verificar compatibilidad con modo USD
- ✅ Verificar validaciones de precio negativo y máximo
