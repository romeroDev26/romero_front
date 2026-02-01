# Quick Sales (Venta Rápida)

Módulo para realizar ventas rápidas de productos y servicios sin asociarlos a un viaje específico.

## Estructura

```
quick-sales/
├── components/          # Componentes reutilizables
│   ├── ServiceSelector.tsx         # Selector de servicios/productos
│   ├── RouteSection.tsx            # Formulario de origen/destino
│   ├── ServiceDetailsForm.tsx      # Detalles del servicio
│   └── index.ts
├── hooks/              # Hooks personalizados
│   ├── useProducts.ts              # Hook para cargar productos
│   └── useRouteHistory.ts          # Hook para historial de rutas
├── types/              # Definiciones de tipos
│   └── quickSale.types.ts
├── pages/              # Páginas principales
│   └── QuickSalePage.tsx
└── index.ts
```

## Características

### 1. Selector de Servicios/Productos
- Lista todos los productos y servicios activos
- Buscador en tiempo real
- Muestra precio, descripción y categoría
- Visual claro de selección

### 2. Datos del Cliente (Opcional)
- Obligatorio solo para facturas (RUC)
- Para boletas puede usar cliente genérico
- Reutiliza PassengerDataForm

### 3. Ruta (Opcional)
- Campos de texto libre para origen y destino
- Autocompletado basado en historial (localStorage)
- Guarda las últimas 20 rutas más usadas
- El texto de ruta se guarda en el campo `notes` como "Origen > Destino"

### 4. Detalles del Servicio
- Cantidad ajustable
- Precio personalizable (opcional, usa precio base por defecto)
- Descripción adicional opcional
- Toggle para IGV gravado/exonerado

### 5. Proceso de Venta
- Selección de tipo de comprobante (Boleta/Factura)
- Selección de serie
- Pago simple o dividido
- Confirmación de venta
- Preview y envío de ticket

## Hooks Personalizados

### useProducts
Carga la lista de productos y servicios activos desde la API.

```typescript
const { data: products, isLoading } = useProducts();
```

### useRouteHistory
Gestiona el historial de rutas en localStorage con autocompletado.

```typescript
const { 
  saveRoute, 
  getOriginSuggestions, 
  getDestinationSuggestions 
} = useRouteHistory();
```

## Flujo de Trabajo

1. Usuario selecciona un servicio/producto de la lista
2. Completa datos del cliente (si es necesario)
3. Define ruta origen-destino (opcional)
4. Ajusta cantidad, precio y detalles
5. Configura método de pago
6. Confirma la venta
7. Visualiza y envía el ticket

## Notas Técnicas

- **Campo notes**: Se construye dinámicamente
  - Con ruta: "Origen > Destino"
  - Sin ruta: "Venta Rápida - [Nombre del Producto]"
  
- **Historial de rutas**: Se almacena en localStorage
  - Keys: `quickSale_origins`, `quickSale_destinations`
  - Máximo 20 entradas por lista
  - Sin duplicados (case-insensitive)

- **Precio**: Puede ser personalizado o usar el precio base del producto

- **IGV**: Código de categoría tributaria
  - Gravado (10): Con IGV 18%
  - Exonerado (20): Sin IGV
