# Sistema de Múltiples Monedas - Implementación

## 📋 Descripción General

Se ha implementado un sistema completo para manejar ventas en múltiples monedas (PEN y USD) en el módulo de punto de venta fluvial. El sistema permite alternar entre soles peruanos (PEN) y dólares estadounidenses (USD), con comportamientos específicos para cada moneda.

## 🎯 Características Principales

### 1. **Selector de Moneda Visual**
- Switch toggle interactivo para cambiar entre PEN y USD
- Indicadores visuales claros del tipo de moneda seleccionada
- Mensajes informativos sobre el comportamiento de cada moneda
- Se deshabilita durante el procesamiento de ventas

### 2. **Comportamiento por Moneda**

#### **PEN (Soles Peruanos)**
- ✅ Precios automáticos desde tarifas configuradas
- ✅ Consulta automática de precio base según la ruta
- ✅ Modo manual solo cuando NO existe tarifa para la ruta
- ✅ Símbolo: `S/`

#### **USD (Dólares Estadounidenses)**
- ✅ Siempre requiere ingreso manual de precios
- ✅ No consulta tarifas automáticas
- ✅ El usuario debe ingresar manualmente:
  - Precio base del pasaje
  - Costo adicional (bultos)
  - Descuento
- ✅ Símbolo: `$`

### 3. **Actualización de Interfaz**
- Todos los montos se muestran con el símbolo de moneda correcto
- El resumen de venta se actualiza dinámicamente según la moneda
- Los placeholders de inputs reflejan la moneda seleccionada

## 📁 Estructura de Archivos

### Archivos Nuevos

```
src/features/fluvial/components/sales-point/
├── hooks/
│   └── useCurrencyManager.ts          # Hook para gestión de moneda
└── components/
    └── CurrencySelector.tsx            # Componente selector de moneda
```

### Archivos Modificados

```
src/features/fluvial/components/sales-point/
├── SaleForm.tsx                        # Integración del sistema de moneda
├── PriceSummary.tsx                    # Soporte para múltiples símbolos
├── services/
│   └── invoiceCreationService.ts       # Parámetro dinámico de moneda
└── hooks/
    └── useSaleBusinessLogic.ts         # Paso de moneda a backend
```

## 🔧 Implementación Técnica

### 1. Hook `useCurrencyManager`

```typescript
const {
  selectedCurrency,  // 'PEN' | 'USD'
  isUSD,             // boolean
  setCurrency,       // Función para cambiar moneda
  getCurrencySymbol, // Función que retorna 'S/' o '$'
} = useCurrencyManager();
```

**Responsabilidades:**
- Gestionar el estado de la moneda seleccionada
- Determinar si debe usarse modo manual de precios
- Proporcionar símbolo de moneda formateado
- Validar comportamiento según tipo de moneda

### 2. Componente `CurrencySelector`

**Props:**
```typescript
interface CurrencySelectorProps {
  selectedCurrency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  disabled?: boolean;
}
```

**Características:**
- Switch visual con animación
- Indicadores de color (azul para PEN, verde para USD)
- Mensaje informativo según la moneda
- Se deshabilita durante procesamiento de ventas

### 3. Lógica de Precio Manual

```typescript
// Detectar modo manual según moneda y disponibilidad de tarifa
useEffect(() => {
  // USD: Siempre manual
  if (isUSD) {
    setIsManualPriceMode(true);
    return;
  }
  
  // PEN: Solo manual si no hay tarifa
  const hasBothStopsSelected = !!selectedBoardingStopId && !!selectedDisembarkingStopId;
  const shouldUseManualPrice = hasBothStopsSelected && (!basePrice || basePrice === 0);
  
  setIsManualPriceMode(shouldUseManualPrice);
}, [basePrice, selectedBoardingStopId, selectedDisembarkingStopId, isUSD]);
```

### 4. Integración en el Backend

El sistema envía el código de moneda al backend:

```typescript
// En invoiceCreationService.ts
createInvoicePayload: (
  clientId,
  passengerData,
  series,
  branchName,
  items,
  selectedPaymentMethod,
  paymentOperationCode,
  currencyCode = 'PEN' // ← Parámetro dinámico
) => {
  return {
    // ... otros campos
    currency_code: currencyCode, // ← 'PEN' o 'USD'
  };
}
```

## 🎨 Experiencia de Usuario

### Flujo en PEN (Soles)

1. Usuario selecciona origen y destino
2. Sistema consulta tarifa automática
3. Si existe tarifa → muestra precio automático
4. Si NO existe tarifa → activa modo manual
5. Usuario completa venta con precio automático o manual

### Flujo en USD (Dólares)

1. Usuario cambia a USD con el switch
2. Sistema activa modo manual automáticamente
3. Usuario debe ingresar precio manual obligatoriamente
4. Usuario debe ingresar costos adicionales manualmente
5. Usuario completa venta con precios manuales

## 📊 Visualización en UI

### Selector de Moneda
```
┌─────────────────────────────────────────┐
│ Tipo de Moneda                          │
│ Precios automáticos desde tarifas       │
│                                         │
│  S/ Soles  ⚪─────  $ Dólares          │
│                                         │
│ ℹ️ Soles (PEN): El precio base se      │
│   obtiene automáticamente de las        │
│   tarifas configuradas.                 │
└─────────────────────────────────────────┘
```

### Resumen de Venta (USD)
```
┌─────────────────────────────────────────┐
│ Resumen de Venta                        │
├─────────────────────────────────────────┤
│ ! No hay tarifa configurada             │
│   Ingrese el precio manualmente         │
│                                         │
│ Precio Manual por Pasajero *           │
│ [ 50.00                        ]        │
│ ✓ Precio configurado: $ 50.00          │
├─────────────────────────────────────────┤
│ Tarifa Pasaje:           $ 50.00       │
│ Costo Adicional:         $ 10.00       │
│ Subtotal:                $ 60.00       │
│ IGV (18%):               $ 10.80       │
│ Descuento Manual:        $ 5.00        │
│ TOTAL:                   $ 65.80       │
└─────────────────────────────────────────┘
```

## ⚠️ Validaciones

### Validación de Precio Manual (USD)
```typescript
if (isManualPriceMode && (!manualPrice || manualPrice <= 0)) {
  toast.error("Debe ingresar un precio manual para continuar");
  return;
}
```

### Validación de Moneda en Venta
- El sistema valida que haya un precio válido antes de permitir la venta
- Para USD, el precio manual es obligatorio
- Para PEN, puede usar tarifa automática o manual

## 🔄 Flujo de Datos

```
┌──────────────┐
│ SaleForm     │
│ - Selector   │
└──────┬───────┘
       │
       ├─► useCurrencyManager()
       │   └─► selectedCurrency ('PEN' | 'USD')
       │
       ├─► useEffect (Detectar modo manual)
       │   └─► isManualPriceMode (boolean)
       │
       ├─► PriceSummary
       │   └─► currencySymbol ('S/' | '$')
       │
       └─► handleConfirmSale()
           ├─► handleCompanyInvoiceWithRepresentatives()
           │   └─► currencyCode
           │
           └─► handleRegularSale()
               └─► currencyCode
                   └─► invoiceCreationService.createInvoicePayload()
                       └─► Backend: { currency_code: 'PEN' | 'USD' }
```

## 🧪 Casos de Prueba

### Caso 1: Venta en PEN con Tarifa
- ✅ Seleccionar PEN
- ✅ Elegir ruta con tarifa configurada
- ✅ Verificar precio automático
- ✅ Completar venta

### Caso 2: Venta en PEN sin Tarifa
- ✅ Seleccionar PEN
- ✅ Elegir ruta sin tarifa
- ✅ Activar modo manual
- ✅ Ingresar precio manual
- ✅ Completar venta

### Caso 3: Venta en USD
- ✅ Cambiar a USD
- ✅ Verificar modo manual activo
- ✅ Ingresar precio manual obligatorio
- ✅ Verificar símbolo $ en toda la UI
- ✅ Completar venta

### Caso 4: Cambio de Moneda Durante Venta
- ✅ Iniciar venta en PEN
- ✅ Cambiar a USD
- ✅ Verificar actualización de UI
- ✅ Verificar modo manual activado
- ✅ Verificar símbolos actualizados

## 📝 Notas Importantes

### Comportamiento del Sistema

1. **Persistencia de Moneda**: La moneda NO se persiste entre sesiones. Cada vez que se carga el formulario, inicia en PEN.

2. **Limpieza de Formulario**: Al cambiar de moneda, NO se limpian los datos del pasajero ni los costos adicionales, solo se actualiza el modo de precio.

3. **IGV**: El IGV (18%) se aplica de la misma forma independientemente de la moneda.

4. **Descuentos**: Los descuentos funcionan igual para ambas monedas.

### Futuras Mejoras

- [ ] Agregar tipo de cambio dinámico entre PEN y USD
- [ ] Permitir configurar moneda predeterminada por sucursal
- [ ] Soporte para más monedas (EUR, etc.)
- [ ] Histórico de tipos de cambio en reportes
- [ ] Conversión automática en reportes consolidados

## 🚀 Despliegue

No se requieren cambios en el backend para esta funcionalidad, ya que el campo `currency_code` ya existía en el modelo de factura. Solo se ha hecho dinámico el valor enviado desde el frontend.

### Verificar antes de desplegar:
- ✅ Compilación sin errores TypeScript
- ✅ Pruebas de venta en PEN
- ✅ Pruebas de venta en USD
- ✅ UI responsive en diferentes resoluciones
- ✅ Compatibilidad con flujo de representantes (RUC)

---

**Fecha de Implementación**: Octubre 2025  
**Versión**: 1.0.0  
**Autor**: Sistema de Gestión Transportes Romero
