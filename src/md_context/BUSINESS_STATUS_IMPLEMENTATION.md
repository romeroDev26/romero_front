# 📊 Estado del Negocio - Implementación

## 🎯 Objetivo
Añadir una columna adicional para mostrar el **Estado del Negocio** de las facturas/boletas, complementando el estado de SUNAT. Esto permite identificar documentos que fueron aceptados por SUNAT pero que posteriormente fueron cancelados por el negocio (mediante notas de crédito o anulaciones).

## 📋 Requisitos

### Backend
El backend ya proporciona el campo `business_status` en las respuestas de facturas/boletas:
- **ACTIVE**: Documento activo (valor por defecto)
- **CANCELLED**: Documento cancelado por nota de crédito o anulación
- **INCREASED**: Documento con cargos adicionales (notas de débito aplicadas)

### Frontend
Mostrar ambos estados en la columna de estado:
```
┌─────────────────────────────┐
│ ESTADO SUNAT / NEGOCIO      │
├─────────────────────────────┤
│ [Badge: ACEPTADO]           │
│ [Badge: CANCELADO]          │
└─────────────────────────────┘
```

## 🔧 Implementación

### 1. Tipos Actualizados

#### `src/types/index.ts`
```typescript
export interface Invoice {
  // ... otros campos
  sunat_status: SunatDocumentStatus;
  business_status?: 'ACTIVE' | 'CANCELLED' | 'INCREASED';  // ✅ Campo actualizado
  // ... otros campos
}
```

#### `src/types/sellerDetailedReport.ts`
```typescript
export interface SellerDetailedInvoice {
  // ... otros campos
  sunat_status: string;
  business_status?: string;  // ✅ Campo añadido
  // ... otros campos
}
```

### 2. Componente Nuevo: InvoiceStatusBadge

**Archivo**: `src/features/accounting/components/InvoiceStatusBadge.tsx`

#### Características:
- ✅ Muestra el estado de SUNAT (siempre visible)
- ✅ Muestra el estado del negocio solo si está `CANCELLED`
- ✅ Diseño con badges apilados verticalmente
- ✅ Colores distintivos para cada estado

#### Uso:
```tsx
<InvoiceStatusBadge 
  sunatStatus={invoice.sunat_status} 
  businessStatus={invoice.business_status}
/>
```

#### Estados Soportados:
- `'ACTIVE'` o `undefined`: Solo muestra estado SUNAT
- `'CANCELLED'`: Muestra estado SUNAT + badge "CANCELADO" (rojo)
- `'INCREASED'`: Muestra estado SUNAT + badge "AUMENTADO" (amarillo)

### 3. Páginas Actualizadas

#### ✅ `CreditNoteNewPage.tsx` y `DebitNoteNewPage.tsx`
- **Notas de Crédito**: 
  - Facturas con `business_status: 'CANCELLED'`: Deshabilitadas, fondo gris, badge rojo
  - Facturas con `business_status: 'INCREASED'`: Habilitadas, badge amarillo, acciones disponibles
  - Facturas con `business_status: 'ACTIVE'` o `undefined`: Habilitadas, sin badge adicional
- **Notas de Débito**:
  - Facturas con `business_status: 'CANCELLED'`: Deshabilitadas, fondo gris, badge rojo
  - Facturas con `business_status: 'INCREASED'`: **Deshabilitadas**, fondo gris, badge amarillo (no se pueden crear notas de débito sobre documentos que ya tienen una)
  - Facturas con `business_status: 'ACTIVE'` o `undefined`: Habilitadas, sin badge adicional
- **Acciones disponibles** solo para documentos con `business_status: 'ACTIVE'` o `undefined` (en Notas de Débito)
- **Acciones de Crédito** disponibles para `'ACTIVE'`, `undefined` e `'INCREASED'`
- **Acciones deshabilitadas** para documentos con `business_status: 'CANCELLED'` (ambas) e `'INCREASED'` (solo Débito)

#### ✅ `InvoiceDetailPage.tsx`
- Importa `InvoiceStatusBadge` en lugar de `SunatStatusBadge`
- Muestra ambos estados en el encabezado del detalle
- Badges visibles junto a la fecha y monto

#### ✅ `SellerStatisticsDetailPage.tsx`
- Columna renombrada a "Estado SUNAT / Negocio"
- Implementación inline de badges apilados
- Muestra "CANCELADO" solo cuando `business_status === 'CANCELLED'`

## 🎨 Diseño Visual

### Estado Activo (Normal)
```
┌─────────────┐
│  ACEPTADO   │  ← Badge verde
└─────────────┘
```

### Estado Cancelado
```
┌─────────────┐
│  ACEPTADO   │  ← Badge verde (estado SUNAT)
├─────────────┤
│  CANCELADO  │  ← Badge rojo (estado negocio)
└─────────────┘
```

### Estado Aumentado
```
┌─────────────┐
│  ACEPTADO   │  ← Badge verde (estado SUNAT)
├─────────────┤
│ AUMENTADO   │  ← Badge amarillo (estado negocio)
└─────────────┘
```

## 📊 Casos de Uso

### Caso 1: Boleta Aceptada y Activa
```json
{
  "sunat_status": "ACCEPTED",
  "business_status": "ACTIVE"  // o null/undefined
}
```
**Vista**: Solo muestra badge "ACEPTADO" (verde)

### Caso 2: Boleta Aceptada pero Cancelada
```json
{
  "sunat_status": "ACCEPTED",
  "business_status": "CANCELLED"
}
```
**Vista**: 
- Badge "ACEPTADO" (verde)
- Badge "CANCELADO" (rojo) debajo

### Caso 3: Boleta Aceptada con Cargos Adicionales
```json
{
  "sunat_status": "ACCEPTED",
  "business_status": "INCREASED"
}
```
**Vista**: 
- Badge "ACEPTADO" (verde)
- Badge "AUMENTADO" (amarillo) debajo

### Caso 4: Boleta Pendiente
```json
{
  "sunat_status": "PENDING",
  "business_status": null
}
```
**Vista**: Solo muestra badge "PENDIENTE" (gris)

## � Estados y Acciones por Página

### Lista de Facturas (`InvoicesListPage.tsx`)
| Estado SUNAT | Estado Negocio | Badge Mostrado | Acciones Disponibles |
|-------------|----------------|----------------|---------------------|
| ACCEPTED | ACTIVE/undefined | Solo "ACEPTADO" | ✅ Nota Crédito + Nota Débito |
| ACCEPTED | INCREASED | "ACEPTADO" + "AUMENTADO" | ✅ Solo Nota Crédito (Nota Débito deshabilitada) |
| ACCEPTED | CANCELLED | "ACEPTADO" + "CANCELADO" | ❌ Ninguna |
| PENDING | Cualquier | Solo estado SUNAT | ❌ Ninguna |

### Selección para Notas (`CreditNoteNewPage.tsx` & `DebitNoteNewPage.tsx`)
| Estado SUNAT | Estado Negocio | Badge Mostrado | Selección Disponible |
|-------------|----------------|----------------|---------------------|
| ACCEPTED | ACTIVE/undefined | Solo tipo documento | ✅ Sí |
| ACCEPTED | INCREASED | Tipo documento + "AUMENTADO" | ✅ Crédito / ❌ Débito |
| ACCEPTED | CANCELLED | Tipo documento + "CANCELADO" | ❌ No |

**Nota**: En `DebitNoteNewPage`, los documentos con estado `INCREASED` aparecen deshabilitados (fondo gris, botón "No disponible") porque ya tienen una nota de débito aplicada.

##  Lugares donde se Implementó

1. ✅ **Lista de Facturas/Boletas** (`InvoicesListPage.tsx`)
   - Muestra botón de Nota de Crédito para: `ACTIVE`, `INCREASED` (todos menos `CANCELLED`)
   - Muestra botón de Nota de Débito solo para: `ACTIVE` o `undefined` (NO para `INCREASED` ni `CANCELLED`)
2. ✅ **Detalle de Factura/Boleta** (`InvoiceDetailPage.tsx`)
3. ✅ **Estadísticas de Vendedor** (`SellerStatisticsDetailPage.tsx`)
4. ✅ **Selección para Notas de Crédito** (`CreditNoteNewPage.tsx`)
   - Permite seleccionar documentos con estado `ACTIVE`, `undefined` e `INCREASED`
   - Deshabilita documentos con estado `CANCELLED`
5. ✅ **Selección para Notas de Débito** (`DebitNoteNewPage.tsx`)
   - Permite seleccionar solo documentos con estado `ACTIVE` o `undefined`
   - Deshabilita documentos con estado `CANCELLED` e `INCREASED`
   - Los documentos `INCREASED` aparecen con fondo gris y botón "No disponible"

## 💡 Lógica de Negocio

### ¿Por qué no permitir Nota de Débito en documentos INCREASED?

Un documento con estado `INCREASED` indica que ya tiene una o más **notas de débito aplicadas** que incrementaron el monto original. Por lo tanto:

- ✅ **Permitir Nota de Crédito**: Es válido porque el cliente aún puede devolver productos o corregir errores a su favor
- ❌ **No permitir Nota de Débito**: Previene incrementos múltiples descontrolados y mantiene un mejor control del flujo de cargos adicionales

Esta restricción ayuda a mantener la integridad de los documentos contables y evita confusiones en la cadena de notas de débito.

### Implementación de la Restricción

La restricción se implementa en **dos niveles**:

1. **Lista de Facturas** (`InvoicesListPage.tsx`): El botón de crear nota de débito no se muestra para documentos `INCREASED`
2. **Selección de Documentos** (`DebitNoteNewPage.tsx`): Los documentos `INCREASED` aparecen deshabilitados (no se pueden seleccionar) con indicadores visuales claros

## 🚀 Beneficios

1. **Claridad**: Los usuarios pueden ver de inmediato si un documento está cancelado
2. **Auditoría**: Facilita la identificación de documentos con notas de crédito
3. **Control**: Mejor seguimiento del ciclo de vida de los documentos
4. **Consistencia**: Mismo patrón visual en todas las vistas de facturas

## 📝 Notas Importantes

- El campo `business_status` es opcional y puede venir como `null` o `undefined`
- Solo se muestra el badge adicional cuando el valor es `'CANCELLED'` o `'INCREASED'`
- El estado SUNAT siempre se muestra, independientemente del estado del negocio
- Las acciones de notas de crédito están disponibles para documentos `'ACTIVE'`, `'INCREASED'` (todos excepto `'CANCELLED'`)
- Las acciones de notas de débito están disponibles solo para documentos `'ACTIVE'` o `undefined`
- Las acciones de notas de débito NO están disponibles para documentos con estado `'INCREASED'` o `'CANCELLED'`
- El componente `InvoiceStatusBadge` es reutilizable en cualquier vista que liste facturas

## 🎯 Próximos Pasos (Opcionales)

1. **Filtros**: Añadir filtro por `business_status` en el listado
2. **Exportación**: Incluir `business_status` en las exportaciones a Excel
3. **Reportes**: Considerar `business_status` en los reportes financieros
4. **Tooltips**: Añadir información adicional sobre por qué fue cancelado

---

**Fecha de Implementación**: 23 de octubre de 2025  
**Estado**: ✅ Completado  
**Última Actualización**: 23 de octubre de 2025 - Restricción completa de Nota de Débito para documentos INCREASED (lista y selección)
