# Implementación de Tarifas por Ruta

## 📋 Resumen

Se ha implementado una nueva interfaz para gestionar tarifas agrupadas por ruta, permitiendo visualizar y editar los precios de cada parada dentro de una ruta específica de forma más organizada y eficiente.

## 🎯 Objetivo

Reestructurar la gestión de tarifas para que en lugar de mostrar una lista plana de todas las tarifas, se organicen por rutas y se puedan editar los precios de cada parada directamente desde una tabla estructurada.

## 🔧 Cambios Realizados

### 1. Servicio de Tarifas (`fareService.ts`)

Se agregó un nuevo método para obtener tarifas agrupadas por ruta:

```typescript
async getFaresByRouteGrouped(params: {
  company_id: number;
  service_category?: ServiceCategory;
  route_id?: number;
  only_active_routes?: boolean;
  skip?: number;
  limit?: number;
}): Promise<RouteGroupedFare[]>
```

#### Nuevos tipos de datos:

- **`RouteSegmentFare`**: Representa una parada dentro de una ruta con su información de tarifa
  - `stop_order`: Orden de la parada
  - `to_port_id`: ID del puerto de destino
  - `to_port_name`: Nombre del puerto de destino
  - `price`: Precio (puede ser `null` si no tiene tarifa configurada)
  - `currency_code`: Código de moneda
  - `fare_id`: ID de la tarifa (null si no existe)
  - `tax_category_code`: Categoría de IGV
  - Y otros campos relacionados

- **`RouteGroupedFare`**: Representa una ruta con todos sus segmentos
  - `route_id`: ID de la ruta
  - `route_name`: Nombre de la ruta
  - `origin_port_id` y `origin_port_name`: Puerto de origen
  - `destination_port_id` y `destination_port_name`: Puerto de destino
  - `segments`: Array de `RouteSegmentFare`

### 2. Hook Personalizado (`useFaresByRoute.ts`)

Nuevo hook que encapsula la lógica de React Query para manejar las tarifas por ruta:

**Características:**
- Carga automática de datos usando `useQuery`
- Invalidación automática de caché tras mutaciones
- Métodos para actualizar y crear tarifas
- Estados de carga y error

**API del Hook:**
```typescript
const {
  routeGroupedFares,    // Array de rutas con sus tarifas
  isLoading,            // Estado de carga
  error,                // Mensaje de error
  refetch,              // Función para recargar datos
  updateFare,           // Función para actualizar tarifa
  createFare,           // Función para crear tarifa
  isUpdating,           // Estado de actualización
  isCreating            // Estado de creación
} = useFaresByRoute(params);
```

### 3. Nueva Página (`FaresByRoutePage.tsx`)

Página completa con interfaz moderna para gestionar tarifas por ruta.

#### Características Principales:

1. **Filtros:**
   - Búsqueda por nombre de ruta o puertos
   - Selector de categoría de servicio (Romero Express / Romero Cargo)

2. **Vista de Dos Columnas:**
   - **Columna Izquierda:** Lista de rutas disponibles
     - Muestra nombre de la ruta
     - Puertos origen → destino
     - Contador de paradas con/sin precio
     - Selección activa destacada

   - **Columna Derecha:** Tabla de tarifas de la ruta seleccionada
     - Orden de parada
     - Puerto de destino
     - Precio (editable inline)
     - Moneda (PEN/USD)
     - Categoría de IGV (Gravado/Exonerado/Inafecto)
     - Acciones (editar, guardar, cancelar)

3. **Edición Inline:**
   - Click en el botón de editar para activar modo edición
   - Campos editables directamente en la tabla
   - Botones de guardar/cancelar para cada fila
   - Validación de precios antes de guardar

4. **Manejo de Tarifas Faltantes:**
   - Muestra "Sin precio" cuando no hay tarifa configurada
   - Permite crear nueva tarifa desde la misma interfaz
   - Usa valores predeterminados sensatos

5. **Feedback Visual:**
   - Toast notifications para operaciones exitosas/fallidas
   - Estados de carga durante actualización
   - Deshabilitación de controles durante operaciones

### 4. Integración con la Aplicación

#### Rutas (`App.tsx`)
```typescript
// Importación lazy
const FaresByRoutePage = React.lazy(() => 
  import('./features/fluvial/pages/FaresByRoutePage')
    .then(module => ({ default: module.FaresByRoutePage }))
);

// Ruta
<Route path="fares-by-route" element={
  <Suspense fallback={<Spinner />}>
    <FaresByRoutePage />
  </Suspense>
} />
```

#### Menú Lateral (`Sidebar.tsx`)
```typescript
{
  name: 'Tarifas',
  path: '/fluvial/config/fares-by-route',
  icon: CurrencyDollarIcon,
  iconColor: 'text-blue-500'
}
```

**Nota:** Esta es ahora la única interfaz de gestión de tarifas. La página antigua ha sido reemplazada completamente.

## 🌐 Endpoint de la API

```
GET /config/fares/by-route
```

### Parámetros:
- `company_id` (requerido): ID de la compañía
- `service_category` (opcional): PASAJES | OTROS
- `route_id` (opcional): ID de ruta específica
- `only_active_routes` (opcional): true/false
- `skip` (opcional): Para paginación
- `limit` (opcional): Para paginación

### Ejemplo de Respuesta:

```json
[
  {
    "route_id": 3,
    "route_name": "NAUTA - YURIMAGUAS EXPRESS",
    "origin_port_id": 2,
    "origin_port_name": "NAUTA",
    "destination_port_id": 5,
    "destination_port_name": "YURIMAGUAS",
    "segments": [
      {
        "stop_order": 2,
        "to_port_id": 88,
        "to_port_name": "SAN PEDRO DE TIPISHCA 1RA ZONA",
        "price": 25,
        "currency_code": "PEN",
        "label": "NAUTA-SAN PEDRO DE TIPISHCA 1RA ZONA",
        "fare_id": 478,
        "fare_type": "PARTIAL_SEGMENT",
        "tax_category_code": "GRA",
        "effective_date": "2025-01-01",
        "expiration_date": null,
        "is_route_specific": false,
        "company_id": 1,
        "origin_port_id": 2,
        "destination_port_id": 88,
        "service_category": "PASAJES",
        "route_id": 3
      },
      // ... más segmentos
    ]
  }
]
```

## 📱 Flujo de Usuario

1. **Acceso:**
   - Usuario navega a "Configuración Fluvial" → "Tarifas"

2. **Selección de Categoría:**
   - Selecciona entre Romero Express (PASAJES) o Romero Cargo (OTROS)

3. **Búsqueda de Ruta:**
   - Opcionalmente busca por nombre de ruta o puertos

4. **Selección de Ruta:**
   - Click en una ruta de la lista lateral
   - Se cargan automáticamente todas las paradas de esa ruta

5. **Edición de Tarifa:**
   - Click en el botón de editar (lápiz) de una parada
   - Se activa el modo de edición inline
   - Modifica precio, moneda o categoría de IGV
   - Click en guardar (check) para confirmar o cancelar (X) para descartar

6. **Creación de Tarifa:**
   - Si una parada muestra "Sin precio"
   - Click en editar y completa los datos
   - El sistema crea automáticamente la tarifa

## 🎨 Beneficios de la Nueva Implementación

1. **Organización Visual:**
   - Agrupación lógica por rutas
   - Fácil identificación de paradas sin precio
   - Vista clara del recorrido completo

2. **Eficiencia:**
   - Edición inline sin modales
   - Menos clicks para editar múltiples tarifas
   - Carga optimizada con React Query

3. **Usabilidad:**
   - Interfaz intuitiva de dos columnas
   - Feedback inmediato de operaciones
   - Validación en tiempo real

4. **Mantenibilidad:**
   - Código modular y reutilizable
   - Separación clara de responsabilidades
   - Tipos TypeScript fuertemente tipados

## 🔄 Compatibilidad

- Esta nueva interfaz reemplaza completamente a la página anterior de tarifas
- Los datos se gestionan a través de la misma API y base de datos
- No se requiere migración de datos, solo cambio de interfaz

### Archivos Eliminados (Sistema Antiguo):
- ✅ `src/features/fluvial/pages/FaresPage.tsx` - Página antigua de tarifas
- ✅ `src/hooks/useFares.ts` - Hook del sistema antiguo
- ✅ `src/features/fluvial/hooks/useFaresData.ts` - Hook duplicado

### Archivos Nuevos (Sistema Actual):
- ✅ `src/features/fluvial/pages/FaresByRoutePage.tsx` - Nueva página de tarifas por ruta
- ✅ `src/hooks/useFaresByRoute.ts` - Hook optimizado con React Query
- ✅ `src/services/fareService.ts` - Actualizado con método `getFaresByRouteGrouped()`

## 🚀 Próximas Mejoras Sugeridas

1. **Edición Masiva:**
   - Permitir editar múltiples precios a la vez
   - Aplicar incrementos porcentuales a toda una ruta

2. **Historial de Cambios:**
   - Registro de modificaciones de precios
   - Comparación de tarifas en diferentes fechas

3. **Importación/Exportación:**
   - Exportar tarifas a Excel
   - Importar tarifas masivamente desde archivo

4. **Validaciones Avanzadas:**
   - Alertas de precios fuera de rangos normales
   - Sugerencias de precios basados en distancia

## 📝 Notas Técnicas

- Se usa React Query para caché y sincronización de datos
- Edición optimista podría implementarse en futuras versiones
- Los componentes son completamente tipados con TypeScript
- Diseño responsive compatible con tablets y móviles

## 🐛 Debugging

Si encuentras problemas:

1. Verifica que el endpoint `/config/fares/by-route` esté disponible
2. Revisa que `company_id` sea válido en localStorage
3. Comprueba la consola para errores de red o validación
4. Verifica que existan rutas activas para la categoría seleccionada

---

**Fecha de Implementación:** 4 de octubre de 2025
**Desarrollador:** Sistema de IA con supervisión del equipo
