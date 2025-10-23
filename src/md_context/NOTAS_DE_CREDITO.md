## Notas de Crédito — Resumen técnico

Este documento lista las funciones actuales, modales y archivos involucrados en el flujo de Notas de Crédito (NC) dentro del módulo de contabilidad. Útil para planear cambios, entender responsabilidades y localizar los puntos de modificación.

### Objetivo

Proveer un mapa rápido de los componentes, hooks y servicios que intervienen cuando se crean, listan o visualizan Notas de Crédito.

---

## Checklist rápido (lo que pediste)

- [x] Documentar funciones actuales y responsabilidades.
- [x] Listar modales y UI que aparecen (selector de factura, cliente, producto, edición de disminución/descuento).
- [x] Listar archivos principales que se verán afectados por cambios.

---

## Páginas principales

- `pages/CreditNotesListPage.tsx`
  - Lista de Notas de Crédito, filtros, refresco de estados SUNAT y enlaces a detalle/creación.
- `pages/CreditNoteFullFormPage.tsx` (y `CreditNoteFullFormPageNew.tsx` si existe variante)
  - Formulario completo de creación de NC con validación (zod + react-hook-form), carga de clientes, productos, series.
- `pages/CreditNoteNewPage.tsx`
  - Página para crear NC (puede ser un wrapper o versión simplificada).
- `pages/CreditNoteDetailPage.tsx`
  - Visualización del detalle de una NC existente.
- `pages/CreditNoteAnnulFormPage.tsx`
  - Formulario específico para anulaciones (si aplica).

## Servicios y hooks

- `services/creditNotes.service.ts`
  - Endpoints relacionados con NC (crear, listar, obtener, anular). Revisa ese archivo para los endpoints exactos.
- `hooks/useCreditNotes.ts`
  - Hooks de react-query usados por las páginas: listado (`useCreditNotes`), creación (`useCreateCreditNote`), obtener facturas anulables (`useVoidableInvoices`), refrescar estados pendientes (`useRefreshPendingStatuses`).

## Componentes clave (secciones y modales)

- `components/AffectedDocumentSection.tsx`
  - Sección que muestra y controla el documento afectado por la NC. Usa `InvoiceSelector`.
- `components/InvoiceSelector.tsx` (Modal)
  - Modal que muestra facturas anulables/afectables. Llama a `invoicesService.getById` para obtener detalle y notifica al formulario principal.
  - Estado: `showModal`, `search`, `loadingDetail`.
- `components/CreditNoteReasonSection.tsx`
  - Controla motivo (`credit_note_type_code`) y descripción (`reason`). Muestra ayuda contextual (catálogo SUNAT 09).
- `components/CreditNoteItemsSection.tsx` (Modal de productos)
  - Maneja array de items (react-hook-form useFieldArray), agrega/quita items, abre modal de selección de producto (`Modal` interno) y calcula `price_with_tax` según IGV.
- `components/ClientInfoSection.tsx` (Modal de clientes)
  - Selector de cliente en modal; setea `client_id` y selecciona serie si corresponde.
- `components/CreditNoteSidebar.tsx`
  - Panel lateral con acciones auxiliares: aplicar descuentos globales, disminuir montos proporcionalmente, modal de edición por ítem para tipo 09, información y advertencias antes de crear.

## Otros componentes comunes usados

- `components/common/Modal` — modal genérico usado por `InvoiceSelector`, selección producto/cliente y edición de disminución.
- `components/common/Button` — botones con estados de carga.

## Flujo de creación (resumen)

1. Usuario abre `CreditNoteFullFormPage`.
2. Selecciona factura a afectar mediante `InvoiceSelector` (modal). Se carga detalle con `invoicesService.getById`.
3. El formulario se autocompleta: cliente, items, moneda, serie (si aplica), igv_applicable.
4. Usuario elige motivo en `CreditNoteReasonSection` y edita la `reason`.
5. En `CreditNoteItemsSection` puede agregar/quitar items o seleccionar productos desde modal interno. Las conversiones unit_price <-> price_with_tax se calculan aquí.
6. En `CreditNoteSidebar` puede aplicar descuentos/disminuciones (global o por ítem). Hay un modal para edición detallada en tipo 09.
7. Al enviar, `useCreateCreditNote` (react-query) hace POST al servicio (`creditNotes.service`) con el `payload` armado y, al éxito, navega a la lista.

## Modales detectados y su propósito

- Selector de Factura — `InvoiceSelector` (modal): buscar y seleccionar factura afectada. Carga detalle.
- Selector de Cliente — `ClientInfoSection` internal modal: seleccionar cliente.
- Selector de Producto/Servicio — modal dentro de `CreditNoteItemsSection`.
- Modal de Disminución/Edición — `CreditNoteSidebar` abre `Modal` para editar disminuciones por ítem o aplicar global.

## Puntos de integración con backend

- `creditNotes.service.ts` — endpoints principales de NC.
- `invoices.service.ts` — obtener factura por id (detalle usado para autocompletar).
- `products-services.service.ts`, `clients.service.ts` — listas y detalles usados por selectores.
- Hooks `useAccountingDocumentSeriesForBranch` — para cargar series disponibles.

## Archivos involucrados (lista con propósito)

- `pages/CreditNotesListPage.tsx` — lista y filtros.
- `pages/CreditNoteFullFormPage.tsx` — formulario principal de creación.
- `pages/CreditNoteNewPage.tsx` — página de creación (si aplica).
- `pages/CreditNoteDetailPage.tsx` — detalle.
- `components/AffectedDocumentSection.tsx` — sección documento afectado.
- `components/InvoiceSelector.tsx` — modal selección de factura.
- `components/CreditNoteReasonSection.tsx` — motivo y descripción.
- `components/CreditNoteItemsSection.tsx` — manejo de items y selector de producto.
- `components/ClientInfoSection.tsx` — selector de cliente y serie.
- `components/CreditNoteSidebar.tsx` — acciones laterales (descuentos/disminuciones).
- `hooks/useCreditNotes.ts` — hooks de react-query para NC.
- `services/creditNotes.service.ts` — API para NC.

## Posibles puntos donde hacer cambios (con impacto esperado)

- Añadir campo en payload de creación -> modificar `CreditNoteFullFormPage.tsx` (construcción de payload) y `creditNotes.service.ts`.
- Cambiar validaciones -> actualizar `creditNoteSchema` en `CreditNoteFullFormPage.tsx` y mensajes en `CreditNoteReasonSection`.
- Nuevo comportamiento en selección de factura -> `InvoiceSelector.tsx` (filtrado / API) y `AffectedDocumentSection.tsx`.
- Modificar cálculo IGV/descuentos -> `CreditNoteItemsSection.tsx` y `CreditNoteSidebar.tsx`.
- Cambios de UI en modales -> archivos `components/*` que usan `Modal`.

## Recomendaciones rápidas antes de cambiar

1. Buscar en `useCreditNotes.ts` los hooks que invalidan caches para actualizar listas tras cambios.
2. Si añades campos al backend, versiona el servicio o valida con pruebas locales para evitar rompimiento.
3. Agregar pruebas unitarias para la lógica de distribución proporcional (usada en `CreditNoteSidebar`) — es la parte más propensa a errores de rounding.
4. Mantener las transformaciones numéricas consistentes: el proyecto usa toFixed(10) en varios lugares; conserva el mismo enfoque.

## Requisitos cubiertos

- Documento creado: `NOTAS_DE_CREDITO.md` en la carpeta del feature — Hecho.
- Lista de modales y componentes involucrados — Hecho.
- Mapa de archivos y responsabilidades — Hecho.

---

Si quieres, puedo:

- Generar un diagrama simple (ASCII o mermaid) del flujo.
- Añadir tareas concretas (PR checklist) para implementar cambios (por ejemplo: agregar un nuevo campo al payload y pruebas).

Fecha de extracción: 27-08-2025
