# Corrección del Sistema de Notificaciones de Solicitudes de Anulación

## Fecha: 29 de enero de 2026

## Problemas Identificados

### 1. Contador del Supervisor No Se Actualiza
- **Problema**: Cuando el supervisor aprobaba o rechazaba una solicitud, el contador de solicitudes pendientes en el NavBar no se actualizaba inmediatamente
- **Causa**: El método `refresh()` no actualizaba explícitamente el contador de pendientes

### 2. Contador del Vendedor Muestra Todas las Respuestas
- **Problema**: El contador del vendedor mostraba TODAS las respuestas históricas (ejemplo: 10 respuestas acumuladas) en lugar de solo las nuevas/no vistas
- **Causa**: No existía un sistema para rastrear qué respuestas el vendedor ya había visto

### 3. Falta de Indicador Visual para Nuevas Respuestas
- **Problema**: El vendedor no podía distinguir entre respuestas nuevas y ya vistas
- **Causa**: No había sistema de marcado de lectura

## Soluciones Implementadas

### 1. Actualización Inmediata del Contador del Supervisor

**Archivo modificado**: [CancellationRequestsPage.tsx](../features/supervisor/pages/CancellationRequestsPage.tsx)

#### Cambios:
- Se actualizó `handleApprove` para refrescar datos inmediatamente después de aprobar
- Se actualizó `handleReject` para refrescar datos inmediatamente después de rechazar
- Se agregó callback `onCancellationRequestResolved` al WebSocket para actualizar cuando otro supervisor resuelve una solicitud

```typescript
// Antes
refresh(); // Método genérico

// Después
await Promise.all([
  fetchPendingRequests(),
  fetchAllRequests()
]); // Actualización explícita y paralela
```

### 2. Sistema de Tracking de Respuestas Vistas (Vendedor)

**Archivo modificado**: [cancellationRequests.service.ts](../features/accounting/services/cancellationRequests.service.ts)

#### Nuevo método: `markResolvedAsViewed()`
- Marca solicitudes resueltas como vistas
- Usa `localStorage` con la key `'cancellation_requests_viewed'`
- Almacena un array de IDs de solicitudes ya vistas

#### Método actualizado: `getUnreadResolvedCount()`
```typescript
async getUnreadResolvedCount(): Promise<number> {
  const myRequests = await this.getMyRequests();
  const resolvedRequests = myRequests.filter(
    r => r.status === 'APPROVED' || r.status === 'REJECTED'
  );
  
  // Obtener IDs ya vistas desde localStorage
  const viewedIds: Set<number> = /* ... */;
  
  // Contar solo las NO vistas
  return resolvedRequests.filter(r => !viewedIds.has(r.id)).length;
}
```

### 3. Actualización del Dashboard

**Archivo modificado**: [Dashboard.tsx](../components/layout/Dashboard.tsx)

#### Cambios:
- Se actualiza `handleOpenSellerModal` para marcar respuestas como vistas al abrir el modal
- Se resetea el contador a 0 inmediatamente después de marcar como vistas

```typescript
const handleOpenSellerModal = async () => {
  const requests = await cancellationRequestsService.getMyRequests();
  
  // Marcar como vistas
  cancellationRequestsService.markResolvedAsViewed(requests);
  
  // Resetear contador
  setSellerResponsesCount(0);
};
```

### 4. Indicador Visual de Nuevas Respuestas

**Archivo modificado**: [SellerNotificationsModal.tsx](../components/common/SellerNotificationsModal.tsx)

#### Nuevo indicador "Nueva":
- Badge azul con la palabra "Nueva" en respuestas no vistas
- Se determina comparando IDs de solicitudes con las almacenadas en localStorage

```tsx
{isNew && (
  <div className="absolute -top-2 -right-2">
    <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-white bg-blue-500 rounded-full shadow-lg">
      Nueva
    </span>
  </div>
)}
```

## Flujo de Trabajo Mejorado

### Para el Supervisor:
1. Supervisor ve solicitud pendiente (contador actualizado por WebSocket)
2. Supervisor aprueba/rechaza solicitud
3. **NUEVO**: Contador se actualiza inmediatamente
4. WebSocket notifica a otros supervisores (si están conectados)

### Para el Vendedor:
1. Vendedor crea solicitud de anulación
2. Supervisor responde (aprueba/rechaza)
3. **NUEVO**: WebSocket incrementa contador solo si es respuesta nueva
4. Vendedor abre modal de respuestas
5. **NUEVO**: Respuestas nuevas tienen badge "Nueva"
6. **NUEVO**: Al abrir modal, todas las respuestas se marcan como vistas
7. **NUEVO**: Contador se resetea a 0 (hasta que llegue nueva respuesta)

## Almacenamiento Local

### Key de localStorage:
- **Nombre**: `cancellation_requests_viewed`
- **Formato**: Array de números (IDs de solicitudes)
- **Ejemplo**: `[1, 5, 12, 23, 45]`

### Consideraciones:
- Los datos persisten entre sesiones del navegador
- Se pueden acumular muchos IDs con el tiempo (optimización futura: limpiar IDs antiguos)
- Específico por navegador/dispositivo

## Testing Manual Recomendado

### Escenario 1: Supervisor
1. Login como supervisor
2. Verificar contador de solicitudes pendientes
3. Aprobar/Rechazar una solicitud
4. ✅ Verificar que el contador baja inmediatamente

### Escenario 2: Vendedor - Primera Vista
1. Login como vendedor
2. Tener 2 solicitudes resueltas
3. ✅ Verificar que contador muestra "2"
4. Abrir modal de respuestas
5. ✅ Verificar que ambas tienen badge "Nueva"
6. Cerrar modal
7. ✅ Verificar que contador ahora muestra "0"

### Escenario 3: Vendedor - Nueva Respuesta Después de Ver Anteriores
1. Vendedor ya vio 2 respuestas (contador en 0)
2. Supervisor responde una nueva solicitud
3. ✅ WebSocket notifica
4. ✅ Contador sube a "1" (no a "3")
5. Abrir modal
6. ✅ Solo la nueva tiene badge "Nueva"

### Escenario 4: Múltiples Supervisores
1. Supervisor A y B conectados
2. Supervisor A aprueba solicitud
3. ✅ Contador de Supervisor A baja inmediatamente
4. ✅ Contador de Supervisor B se actualiza por WebSocket

## Archivos Modificados

1. `src/features/supervisor/pages/CancellationRequestsPage.tsx`
2. `src/components/layout/Dashboard.tsx`
3. `src/features/accounting/services/cancellationRequests.service.ts`
4. `src/components/common/SellerNotificationsModal.tsx`

## Notas Técnicas

- **Actualización inmediata**: Se usa `await Promise.all()` para actualizar pendingRequests y allRequests en paralelo
- **LocalStorage**: Solución frontend-only que no requiere cambios en el backend
- **Performance**: El sistema es eficiente ya que solo consulta localStorage (operación muy rápida)
- **WebSocket**: Mantiene la funcionalidad en tiempo real existente

## Mejoras Futuras Posibles

1. **Limpieza de localStorage**: Implementar lógica para eliminar IDs de solicitudes muy antiguas
2. **Backend Integration**: Agregar campo `read_by_requester` en el backend para persistir el estado en la base de datos
3. **Notificaciones push**: Integrar con servicio de push notifications del navegador
4. **Sonido de notificación**: Agregar efecto de sonido cuando llega una nueva respuesta
