# Botón de Solicitud de Anulación al Supervisor - Implementación

## Descripción General

Se agregó un nuevo botón **"Solicitar Anulación"** en la vista detallada de facturas/boletas que permite a los vendedores solicitar la anulación de un comprobante directamente a su supervisor asignado.

## Objetivo

Proporcionar una forma más segura y auditada para que los vendedores soliciten la anulación de comprobantes, delegando la decisión final al supervisor en lugar de permitir la anulación directa.

## Características

- **Disponibilidad**: Solo visible para usuarios con rol `sales` (vendedor)
- **Condiciones de activación**:
  - `sunat_status === 'ACCEPTED'` (solo comprobantes aceptados por SUNAT)
  - El usuario tiene un supervisor asignado (`supervisor_id`)
- **Ubicación**: Misma fila que el botón "Anular" existente
- **Estilo**: Color rojo (variante `danger`) para consistencia con el botón "Anular"

## Flujo de Uso

1. Vendedor abre un comprobante en la vista detallada
2. Si el comprobante fue aceptado por SUNAT, verá el botón "Solicitar Anulación"
3. Al hacer clic, se abre el modal de `RequestCancellationModal`
4. El vendedor ingresa el motivo de la solicitud
5. La solicitud se envía al supervisor asignado del vendedor
6. El supervisor revisa y decide: aprobar (genera automáticamente Nota de Crédito) o rechazar

## Cambios Implementados

### Archivo: `src/features/accounting/pages/InvoiceDetailPage.tsx`

#### Imports Agregados
```typescript
import RequestCancellationModal from '../components/RequestCancellationModal';
import { authService } from '../../../services/auth.service';
```

#### Estados Agregados
```typescript
const [showRequestCancellationModal, setShowRequestCancellationModal] = useState(false);
const currentUser = authService.getCurrentUser();
```

#### Botón Agregado (líneas ~295-310)
- Ubicado antes del botón "Anular" existente
- Verificación de rol: `currentUser?.role_name?.toLowerCase() === 'sales'`
- Deshabilitado si:
  - `sunat_status !== 'ACCEPTED'`
  - Usuario no tiene supervisor asignado

#### Modal Agregado (líneas ~479-493)
```typescript
{showRequestCancellationModal && invoice && (
  <RequestCancellationModal
    invoiceId={invoice.id}
    invoiceSeries={invoice.series}
    invoiceNumber={invoice.number}
    onClose={() => setShowRequestCancellationModal(false)}
    onSuccess={() => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
    }}
  />
)}
```

## Reutilización de Componentes Existentes

- **RequestCancellationModal**: Modal existente que maneja toda la lógica de solicitud
- **cancellationRequestsService**: Servicio existente que procesa la solicitud
- **usePermissions hook**: Sistema de permisos existente

No se duplicó funcionalidad; se reutilizó el sistema de `CancellationRequest` ya implementado.

## Diferencias con el Botón "Anular"

| Aspecto | "Solicitar Anulación" | "Anular" |
|--------|-------------------|---------|
| Rol | Solo `sales` | `sales` o `supervisor` |
| Acción | Crea solicitud pendiente | Anula directamente |
| Flujo | Requiere aprobación supervisor | Acción inmediata |
| Auditoría | Mayor trazabilidad | Requiere permisos especiales |

## Datos Disponibles

El invoice devuelve del backend:
- `id`: ID de la factura
- `series`: Serie del comprobante
- `number`: Número del comprobante
- `sunat_status`: Estado de SUNAT (ACCEPTED, REJECTED, etc.)
- `client`: Información del cliente
- Otros datos necesarios para la solicitud

El usuario actual proporciona:
- `supervisor_id`: ID del supervisor asignado
- `role_name`: Rol del usuario

## Validaciones

1. **Rol correcto**: Solo vendedores (`sales`)
2. **Estado de SUNAT**: Solo comprobantes ACCEPTED
3. **Supervisor asignado**: El usuario debe tener un supervisor
4. **Motivo obligatorio**: El vendedor debe proporcionar un motivo en el modal

## Tooltips Informativos

- Cuando no es ACCEPTED: "Solo se pueden solicitar anulaciones de facturas ACEPTADAS"
- Cuando sin supervisor: "No tienes supervisor asignado"
- Normal: "Solicitar anulación al supervisor"

## Integración con WebSocket

Las notificaciones en tiempo real ya están implementadas en el sistema:
- El supervisor recibirá notificaciones de nuevas solicitudes
- El vendedor recibirá notificaciones cuando su solicitud sea resuelta
- El contador de solicitudes pendientes se actualiza automáticamente

## Próximos Pasos (Opcional)

Si se requiere mejorar la UX:
1. Agregar confirmación visual de la acción
2. Mostrar historial de solicitudes del vendedor
3. Permitir ver el estado de escrituras anteriores
4. Notificaciones push adicionales
