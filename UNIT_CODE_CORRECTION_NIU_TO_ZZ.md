# Corrección de Códigos de Unidad SUNAT - De "NIU" a "ZZ" para Servicios

## 📋 Resumen de Cambios Realizados

Se ha corregido el error en los códigos de unidad SUNAT. Según las normativas de SUNAT, los servicios de transporte deben usar el código **"ZZ"** en lugar de **"NIU"**.

## 🔧 Archivos Modificados

### 1. **useSaleBusinessLogic.ts**
- **Línea ~111**: Cambio en servicio principal de transporte
- **Antes**: `unit_code: "NIU" // NIU = Unidad`
- **Después**: `unit_code: "ZZ" // ZZ = Servicio (CORREGIDO de NIU)`

### 2. **invoiceCreationService.ts**
- **Línea ~74**: Cambio en servicio de transporte fluvial
- **Línea ~93**: Cambio en costos adicionales/servicios extras
- **Antes**: `unit_code: "NIU",`
- **Después**: `unit_code: "ZZ", // ZZ = Servicio (CORREGIDO de NIU)`

### 3. **ProductServiceFormModal.tsx**
- **Valor por defecto**: Cambio en INITIAL_FORM_DATA
- **Antes**: `unit_code: 'NIU',`
- **Después**: `unit_code: 'ZZ', // ZZ = Servicio (CORREGIDO de NIU)`
- **Validación**: Cambio de fallback de 'NIU' a 'ZZ'

### 4. **products-services-ui.types.ts**
- **Comentarios actualizados** para mayor claridad:
  - `'NIU' // Unidad (para bienes físicos/encomiendas)`
  - `'ZZ'; // Unidad (para servicios de transporte)`
- **UNIT_CODE_OPTIONS reordenado**: ZZ ahora aparece primero como opción principal para servicios

### 5. **ticketHelpers.ts** y **cargoSale.transformer.ts**
- **Comentarios actualizados** para distinguir entre encomiendas físicas (NIU) y servicios (ZZ)
- **Mapas de unidades actualizados** con mejor documentación

## 🎯 Impacto de los Cambios

### ✅ **Antes (Incorrecto)**:
```json
{
  "product_id": 1,
  "unit_code": "NIU",
  "item_description": "Servicio de Transporte de Pasajeros"
}
```

### ✅ **Después (Correcto)**:
```json
{
  "product_id": 1,
  "unit_code": "ZZ",
  "item_description": "Servicio de Transporte de Pasajeros"
}
```

## 📊 Clasificación SUNAT Correcta

| Tipo de Ítem | Código | Uso |
|--------------|--------|-----|
| **Servicios de Transporte** | **ZZ** | Transporte de pasajeros, servicios extras |
| **Encomiendas Físicas** | **NIU** | Paquetes, unidades físicas |
| **Peso** | **KGM** | Equipaje por peso |
| **Paquetes** | **PAQ** | Encomiendas empaquetadas |
| **Cajas** | **XBX** | Encomiendas en cajas |

## 🚀 Beneficios

1. **Cumplimiento SUNAT**: Ahora los comprobantes usan los códigos correctos según normativa
2. **Consistencia**: Todos los servicios de transporte usan "ZZ"
3. **Claridad**: Distinción clara entre bienes físicos (NIU) y servicios (ZZ)
4. **Auditoría**: Los tickets y facturas mostrarán la clasificación correcta

## ⚠️ Nota Importante

- **NIU** se mantiene para encomiendas físicas y productos tangibles
- **ZZ** es específicamente para servicios de transporte
- **KGM** se mantiene para equipaje extra pesado
- Los cambios son retrocompatibles con facturas existentes

## 🔍 Verificación

Para verificar que los cambios funcionen correctamente:
1. Realizar una venta de pasaje regular → Debe usar "ZZ"
2. Realizar una venta con equipaje extra → Servicio debe usar "ZZ"
3. Generar ticket/factura → Verificar que aparezca "servicio(s)" en lugar de "unidad(es)"

Los cambios están listos para uso en producción.
