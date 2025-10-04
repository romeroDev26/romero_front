# Corrección de Problema de Zona Horaria en Consultas de Estadísticas

## Problema Identificado

Las consultas de estadísticas de usuario estaban consultando datos del día siguiente debido a problemas con la conversión de zona horaria. Cuando un usuario en Perú (UTC-5) consultaba sus estadísticas, el sistema consultaba el día 4 cuando estaba en el día 3.

### Causa Raíz

El uso de `new Date().toISOString().split('T')[0]` convierte la fecha a UTC antes de extraer la parte de la fecha. Esto causa que:

- En Perú (UTC-5), cuando son las 11:00 PM del 3 de octubre, en UTC ya es el 4 de octubre a las 4:00 AM
- Al consultar estadísticas "del día actual", se enviaba `2025-10-04` en lugar de `2025-10-03`
- Las estadísticas mostraban 0 ventas porque no había datos para el día siguiente

## Solución Implementada

### 1. Creación de Utilidades de Fecha Local (`dateUtils.ts`)

Se creó un nuevo archivo de utilidades que maneja fechas en zona horaria local:

```typescript
// src/utils/dateUtils.ts

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD en la zona horaria local
 */
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};
```

**Funciones principales:**
- `getLocalDateString()` - Fecha actual en formato local
- `getDaysAgo(days)` - Fecha de hace N días
- `getMonthsAgo(months)` - Fecha de hace N meses
- `getStartOfMonth()` - Primer día del mes actual
- `getEndOfMonth()` - Último día del mes actual
- `addDays()` - Incrementar fecha en días
- `addMonths()` - Incrementar fecha en meses

### 2. Actualización del Servicio de Estadísticas de Usuario

**Archivo:** `src/services/userStatistics.service.ts`

**Cambios realizados:**

```typescript
// ANTES ❌
getTodayStatistics: async (userId: string) => {
  const today = new Date().toISOString().split('T')[0]; // UTC
  return userStatisticsService.getUserStatistics({
    user_id: userId,
    period: 'day',
    date: today
  });
}

// DESPUÉS ✅
getTodayStatistics: async (userId: string) => {
  const today = getLocalDateString(); // Zona horaria local
  return userStatisticsService.getUserStatistics({
    user_id: userId,
    period: 'day',
    date: today
  });
}
```

**Métodos actualizados:**
- `getTodayStatistics()` - Estadísticas del día actual
- `getCurrentMonthStatistics()` - Estadísticas del mes actual
- `getCurrentYearStatistics()` - Estadísticas del año actual
- `getLast7DaysStatistics()` - Últimos 7 días
- `getLast12MonthsStatistics()` - Últimos 12 meses
- `getStatisticsTrends()` - Tendencias por período

### 3. Actualización de Hooks de Dashboard

**Archivo:** `src/hooks/useDashboardMetrics.ts`

Se actualizaron todos los hooks para administradores que consultan métricas:

```typescript
// ANTES ❌
export const useSalesMetrics = (companyId?: number) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const filters: ReportFilters = {
    start_date: startOfMonth.toISOString().split('T')[0],
    end_date: endOfMonth.toISOString().split('T')[0],
  };
  // ...
}

// DESPUÉS ✅
export const useSalesMetrics = (companyId?: number) => {
  const startOfMonth = getStartOfMonth();
  const endOfMonth = getEndOfMonth();

  const filters: ReportFilters = {
    start_date: startOfMonth,
    end_date: endOfMonth,
  };
  // ...
}
```

**Hooks actualizados:**
- `useSalesMetrics()` - Métricas de ventas del mes
- `useTopSellers()` - Top vendedores
- `usePopularRoutes()` - Rutas populares
- `usePaymentMethods()` - Métodos de pago
- `useVesselOccupancy()` - Ocupación de embarcaciones

### 4. Actualización de Componentes de Dashboard

**Archivos actualizados:**

1. **SellerStatisticsDetailPage.tsx**
   ```typescript
   // ANTES ❌
   const today = new Date();
   const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
   const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
   const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

   // DESPUÉS ✅
   const [startDate, setStartDate] = useState(getStartOfMonth());
   const [endDate, setEndDate] = useState(getLocalDateString());
   ```

2. **BranchSalesLineChart.tsx**
   ```typescript
   // ANTES ❌
   const report = await adminReportsService.getSalesByBranch({
     start_date: startDate.toISOString().split('T')[0],
     end_date: endDate.toISOString().split('T')[0],
     // ...
   });

   // DESPUÉS ✅
   const todayStr = getLocalDateString(now);
   const report = await adminReportsService.getSalesByBranch({
     start_date: todayStr,
     end_date: todayStr,
     // ...
   });
   ```

## Impacto de los Cambios

### ✅ Beneficios

1. **Precisión de Datos:** Las estadísticas ahora muestran datos del día correcto según la zona horaria local
2. **Consistencia:** Todos los componentes de dashboard usan la misma lógica de fechas
3. **Mantenibilidad:** Funciones centralizadas en un solo archivo de utilidades
4. **Reutilizable:** Las funciones pueden usarse en cualquier parte del proyecto

### 🎯 Componentes Afectados

- Dashboard de usuario (no admin) - `SalesPointSelector.tsx`
- Gráfico de ventas de usuario - `UserSalesChart.tsx`
- Estadísticas detalladas por vendedor - `SellerStatisticsDetailPage.tsx`
- Gráfico de ventas por sucursal - `BranchSalesLineChart.tsx`
- Métricas de dashboard de admin - Todos los hooks en `useDashboardMetrics.ts`

### 📊 Resultados Esperados

**Antes de la corrección:**
- Usuario en Perú consulta estadísticas el 3 de octubre a las 11 PM
- Sistema consulta datos del 4 de octubre (UTC)
- Muestra: 0 ventas, S/ 0 ingresos

**Después de la corrección:**
- Usuario en Perú consulta estadísticas el 3 de octubre a las 11 PM
- Sistema consulta datos del 3 de octubre (zona local)
- Muestra: Datos reales del día 3

## Pruebas Recomendadas

1. **Verificar estadísticas de hoy:**
   - Iniciar sesión como vendedor (no admin)
   - Verificar que "Ventas Hoy" muestre datos del día actual
   - Comparar con la fecha mostrada en el sistema

2. **Verificar gráfico de últimos 7 días:**
   - Confirmar que el último punto del gráfico corresponde al día actual
   - Verificar que las fechas en el eje X sean correctas

3. **Verificar métricas de administrador:**
   - Iniciar sesión como admin
   - Verificar que las métricas del mes muestren datos correctos
   - Comparar con reportes del backend

4. **Prueba en diferentes horas:**
   - Probar antes y después de la medianoche
   - Confirmar que la fecha cambia correctamente en zona local

## Notas Técnicas

### ¿Por qué `toISOString()` causa problemas?

```javascript
// En Perú (UTC-5), 3 de octubre 2025, 11:00 PM
const date = new Date('2025-10-03T23:00:00-05:00');

// toISOString() convierte a UTC
console.log(date.toISOString()); 
// "2025-10-04T04:00:00.000Z" ← ¡Día siguiente!

// Métodos locales mantienen la zona horaria
console.log(date.getFullYear(), date.getMonth() + 1, date.getDate());
// 2025 10 3 ← ¡Correcto!
```

### Alternativas Consideradas

1. **Moment.js / Luxon:** Demasiado pesado para este caso de uso
2. **date-fns:** Buena opción, pero agrega dependencia externa
3. **Funciones nativas:** ✅ Elegida - Sin dependencias, liviana, suficiente

## Mantenimiento Futuro

Para nuevas funcionalidades que requieran manejo de fechas:

1. **SIEMPRE usar** `getLocalDateString()` en lugar de `toISOString().split('T')[0]`
2. **EVITAR** conversiones UTC cuando se trabaja con fechas de usuario
3. **USAR** las funciones de `dateUtils.ts` para operaciones de fecha
4. **DOCUMENTAR** cualquier caso especial donde se requiera UTC

## Referencias

- Issue relacionado: Consultas mostrando día siguiente en estadísticas
- Archivo de utilidades: `src/utils/dateUtils.ts`
- Servicio actualizado: `src/services/userStatistics.service.ts`
- Hooks actualizados: `src/hooks/useDashboardMetrics.ts`
