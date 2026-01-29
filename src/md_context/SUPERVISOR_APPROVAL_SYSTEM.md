# Sistema de Aprobación de Anulaciones - Implementación Frontend

## 📋 Resumen

Se ha implementado un sistema completo de solicitudes de anulación de comprobantes cuando el viaje ya ha partido, que requiere aprobación del supervisor.

## 🎯 Funcionalidades Implementadas

### 1. **Bloqueo Automático (Vendedor)**
- Cuando un vendedor intenta anular un comprobante de un viaje que ya salió
- El backend responde con `403 Forbidden`
- El frontend captura este error y ofrece la opción de solicitar aprobación

### 2. **Solicitud de Anulación (Vendedor)**
- Modal `RequestCancellationModal` que aparece cuando se recibe el 403
- El vendedor debe explicar el motivo de la solicitud
- Se envía al endpoint `POST /operations/cancellation-requests/`
- Estado inicial: `PENDING`

### 3. **Panel del Supervisor**
- Nueva sección en el menú lateral solo visible para supervisores
- Badge animado en rojo mostrando el número de solicitudes pendientes
- Actualización automática cada 30 segundos mediante polling
- Ruta: `/supervisor/cancellation-requests`

### 4. **Dashboard de Solicitudes**
- Vista de estadísticas: Pendientes, Aprobadas, Rechazadas
- Tabla con todas las solicitudes y filtros por estado
- Información detallada: Vendedor, Comprobante, Pasajero, Motivo, Fecha

### 5. **Aprobación de Solicitudes**
- Modal `ApprovalModal` con información completa
- Selección de serie de Nota de Crédito (BC01, FC01)
- Al aprobar, se genera automáticamente la NC y se envía a SUNAT
- Endpoint: `POST /operations/cancellation-requests/{id}/approve`

### 6. **Rechazo de Solicitudes**
- Modal `RejectionModal` para rechazar con motivo
- El vendedor puede ver el motivo del rechazo
- Endpoint: `POST /operations/cancellation-requests/{id}/reject`

## 📁 Estructura de Archivos Creados/Modificados

### Nuevos Archivos

```
src/
├── features/
│   ├── accounting/
│   │   ├── components/
│   │   │   └── RequestCancellationModal.tsx         # Modal vendedor
│   │   ├── services/
│   │   │   └── cancellationRequests.service.ts      # Servicio API
│   │   └── types/
│   │       └── cancellationRequests.ts              # Tipos TypeScript
│   └── supervisor/
│       ├── components/
│       │   ├── ApprovalModal.tsx                    # Modal aprobar
│       │   └── RejectionModal.tsx                   # Modal rechazar
│       └── pages/
│           └── CancellationRequestsPage.tsx         # Panel principal
└── hooks/
    └── useCancellationRequests.ts                   # Hook custom
```

### Archivos Modificados

```
src/
├── App.tsx                                          # Rutas nuevas
├── components/layout/Sidebar.tsx                    # Badge + menú
├── features/accounting/
│   ├── credit-notes/pages/
│   │   └── CreditNoteAnnulFormPage.tsx             # Manejo 403
│   └── types/index.ts                              # Exports
└── hooks/usePermissions.ts                          # Permisos supervisor
```

## 🔑 Tipos TypeScript

### CancellationRequest
```typescript
interface CancellationRequest {
  id: number;
  invoice_id: number;
  requester_id: string;
  supervisor_id?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  request_reason: string;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}
```

### CancellationRequestListItem
```typescript
interface CancellationRequestListItem extends CancellationRequest {
  requester_name: string;      // Nombre del vendedor
  series: string;               // Serie del comprobante
  number: number;               // Número del comprobante
  passenger_name?: string;      // Nombre del pasajero (opcional)
  trip_info?: string;           // Info del viaje (opcional)
}
```

## 🛠️ Servicios API

### cancellationRequestsService

```typescript
// Crear solicitud (vendedor)
create(data: CancellationRequestCreate): Promise<CancellationRequest>

// Listar pendientes (supervisor)
getPending(params?: CancellationRequestListParams): Promise<CancellationRequestListItem[]>

// Listar todas con filtros
getAll(params?: CancellationRequestListParams): Promise<CancellationRequestListItem[]>

// Aprobar solicitud
approve(id: number, data: CancellationRequestApproval): Promise<CancellationRequestApprovalResponse>

// Rechazar solicitud
reject(id: number, data: CancellationRequestRejection): Promise<CancellationRequest>

// Obtener conteo de pendientes
getPendingCount(): Promise<number>
```

## 🎨 Componentes UI

### 1. RequestCancellationModal
**Ubicación:** `src/features/accounting/components/RequestCancellationModal.tsx`
- Se muestra cuando el vendedor recibe un 403 al intentar anular
- Campos:
  - Información del comprobante (solo lectura)
  - Campo de texto para motivo de solicitud (requerido)
- Acciones:
  - Cancelar
  - Enviar Solicitud

### 2. ApprovalModal
**Ubicación:** `src/features/supervisor/components/ApprovalModal.tsx`
- Muestra información completa de la solicitud
- Campos:
  - Info de la solicitud (solo lectura)
  - Selector de serie de NC (BC01, FC01)
- Acciones:
  - Cancelar
  - Aprobar y Generar NC

### 3. RejectionModal
**Ubicación:** `src/features/supervisor/components/RejectionModal.tsx`
- Muestra información de la solicitud
- Campos:
  - Info de la solicitud (solo lectura)
  - Campo de texto para motivo de rechazo (requerido)
- Acciones:
  - Cancelar
  - Rechazar Solicitud

### 4. CancellationRequestsPage
**Ubicación:** `src/features/supervisor/pages/CancellationRequestsPage.tsx`

**Secciones:**
1. **Header:** Título + Botón de actualizar
2. **Stats Cards:** 3 tarjetas con contadores (Pendientes, Aprobadas, Rechazadas)
3. **Filtros:** Botones para filtrar por estado (Pendientes, Aprobadas, Rechazadas, Todas)
4. **Tabla:** Lista de solicitudes con columnas:
   - Vendedor
   - Comprobante
   - Pasajero
   - Motivo
   - Fecha
   - Estado
   - Acciones (Aprobar/Rechazar para pendientes)

## 🔐 Permisos

### Rol: `supervisor`
- Acceso a `/supervisor/cancellation-requests`
- Ver solicitudes pendientes
- Aprobar/Rechazar solicitudes
- Ver historial completo

### Rol: `sales` (Vendedor)
- Crear solicitudes de anulación
- Ver modal cuando recibe 403

### Rol: `admin`
- Acceso total (puede ver panel de supervisor)

## 🎯 Flujo de Usuario

### Vendedor:
1. Intenta anular un comprobante → **403**
2. Se abre `RequestCancellationModal`
3. Explica el motivo
4. Envía solicitud
5. Espera aprobación del supervisor

### Supervisor:
1. Ve badge rojo con número de solicitudes pendientes
2. Entra a `/supervisor/cancellation-requests`
3. Revisa solicitudes en tabla
4. Click en ✅ para aprobar o ❌ para rechazar
5. En aprobar: selecciona serie de NC y confirma
6. En rechazar: escribe motivo y confirma
7. El sistema actualiza automáticamente

## 🔄 Polling y Actualizaciones

- **Badge en Sidebar:** Se actualiza cada 30 segundos automáticamente
- **Panel de Supervisor:** Botón de actualizar manual + auto-refresh en hook
- **Hook `useCancellationRequests`:**
  - `autoRefresh: true` → Activa polling
  - `refreshInterval: 30000` → 30 segundos

## 🎨 Estilos y Animaciones

### Badge Animado
```tsx
<span className="... animate-pulse bg-red-500">
  {pendingCount > 99 ? '99+' : pendingCount}
</span>
```

### Estados con Colores
- **Pendiente:** Amarillo (`yellow-100`, `yellow-800`)
- **Aprobada:** Verde (`green-100`, `green-800`)
- **Rechazada:** Rojo (`red-100`, `red-800`)

### Cards de Estadísticas
- Bordes de color según estado
- Iconos de HeroIcons
- Números grandes y legibles

## 📡 Endpoints Backend (Referencia)

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| POST | `/operations/cancellation-requests/` | `sales` | Crear solicitud |
| GET | `/operations/cancellation-requests/pending` | `supervisor` | Listar pendientes |
| GET | `/operations/cancellation-requests/` | `supervisor` | Listar todas |
| POST | `/operations/cancellation-requests/{id}/approve` | `supervisor` | Aprobar |
| POST | `/operations/cancellation-requests/{id}/reject` | `supervisor` | Rechazar |

## ✅ Testing Checklist

- [ ] Vendedor intenta anular viaje que ya salió → Recibe 403
- [ ] Modal de solicitud se abre correctamente
- [ ] Solicitud se crea y aparece en panel de supervisor
- [ ] Badge muestra el número correcto
- [ ] Supervisor puede aprobar → NC se genera automáticamente
- [ ] Supervisor puede rechazar → Solicitud se marca como rechazada
- [ ] Filtros funcionan correctamente
- [ ] Polling actualiza el badge cada 30 segundos
- [ ] Permisos: Solo supervisor puede acceder al panel
- [ ] Permisos: Vendedor puede crear solicitudes

## 🚀 Próximas Mejoras (Opcionales)

1. **Notificaciones en Tiempo Real:** WebSocket para notificar al vendedor cuando su solicitud es aprobada/rechazada
2. **Historial Detallado:** Ver detalles completos de solicitudes aprobadas/rechazadas
3. **Búsqueda y Filtros Avanzados:** Por vendedor, rango de fechas, comprobante
4. **Exportar Reporte:** CSV/Excel de solicitudes
5. **Dashboard de Métricas:** Gráficos de solicitudes por periodo, tasa de aprobación, etc.
6. **Comentarios:** Sistema de comentarios entre vendedor y supervisor
7. **Notificaciones por Email:** Alertas automáticas al supervisor

## 📝 Notas Importantes

- El sistema está diseñado para funcionar **solo en frontend**, el backend ya tiene todos los endpoints implementados
- El badge se actualiza automáticamente cada 30 segundos sin intervención del usuario
- Las NC se generan automáticamente al aprobar, no requiere pasos adicionales
- El supervisor puede ver todo el historial, no solo pendientes
- Los permisos son estrictos: solo rol `supervisor` puede aprobar/rechazar
