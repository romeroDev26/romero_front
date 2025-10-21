# Sistema de Tickets A4 - Implementación Completa

## 📋 Resumen

Implementación del sistema de generación dual de tickets (80mm térmico + A4 corporativo) con generación y carga automática en paralelo al backend.

**Fecha de implementación:** Diciembre 2024  
**Estado:** ✅ Completado

---

## 🎯 Objetivos

1. ✅ Generar tickets en formato A4 corporativo además del formato 80mm térmico existente
2. ✅ Usar un único template A4 multi-modal que funcione para todos los tipos de venta
3. ✅ Generar ambos formatos automáticamente en paralelo
4. ✅ Subir ambos PDFs al backend de manera automática y paralela
5. ✅ Implementar interfaz con tabs para visualizar ambos formatos
6. ✅ Permitir descarga selectiva según el formato activo

---

## 📁 Archivos Creados/Modificados

### ✨ Nuevos Archivos

#### 1. `src/features/fluvial/components/sales-point/tickets/templates/a4.template.ts`
**Propósito:** Template multi-modal para generación de tickets A4

**Características principales:**
- **Formato:** A4 (210mm x 297mm) con márgenes de 15mm
- **Diseño:** Corporativo y profesional
- **Multi-modal:** Detecta automáticamente el tipo de venta y adapta el contenido

**Secciones implementadas:**
1. **Header** (Logo + Datos de empresa)
   - Logo izquierdo (50x20mm)
   - Información de empresa a la derecha
   
2. **Información del Cliente** (Caja azul)
   - Datos del cliente/pasajero
   - Documento y contacto
   
3. **Información del Destinatario** (Caja naranja - solo cargo)
   - Se muestra solo para encomiendas
   - Detecta "destinatario" en trip_details
   
4. **Tabla de Items**
   - Descripción, Cantidad, Unidad, Precio Unit., Total
   - Para pasajes: incluye información del viaje (ruta, fecha, asiento)
   - Para encomiendas: información del destinatario
   - Para empresas: resumen sin detalles de asientos
   
5. **Totales SUNAT**
   - Monto en letras (izquierda)
   - Desglose SUNAT (derecha)
   - Total destacado en caja verde
   
6. **Footer**
   - QR Code 35x35mm (izquierda)
   - Texto legal (derecha)

**Métodos clave:**
```typescript
static async generatePDF(ticketData: TicketData): Promise<jsPDF>
private static addHeader(doc: jsPDF, ticketData: TicketData): Promise<void>
private static addClientInfo(doc: jsPDF, ticketData: TicketData, currentY: number): number
private static addRecipientInfo(doc: jsPDF, ticketData: TicketData, currentY: number): number
private static addItemsTable(doc: jsPDF, ticketData: TicketData, currentY: number): number
private static addTotalsSection(doc: jsPDF, ticketData: TicketData, currentY: number): void
private static addFooter(doc: jsPDF, ticketData: TicketData): void
private static isCargoSale(ticketData: TicketData): boolean
private static getTripInfo(ticketData: TicketData): string
```

### 🔧 Archivos Modificados

#### 2. `src/features/fluvial/components/sales-point/tickets/templates/index.ts`
**Cambios:**
- ✅ Añadido export de `A4Template`
- ✅ Añadido export de `NoSeatsTicketTemplate`
- ✅ Añadido export de `NoSeatsCompanyTicketTemplate`

```typescript
export { NormalTicketTemplate } from './normalTicket.template';
export { CompanyTicketTemplate } from './companyTicket.template';
export { CargoTicketTemplate } from './cargoTicket.template';
export { NoSeatsTicketTemplate } from './noSeatsTicket.template';
export { NoSeatsCompanyTicketTemplate } from './noSeatsCompanyTicket.template';
export { A4Template } from './a4.template';
```

#### 3. `src/features/fluvial/components/sales-point/tickets/TicketGenerator.ts`
**Cambios:**
- ✅ Añadida interfaz `BothTicketsResult`
- ✅ Añadido método `generateBothTickets()`

**Nueva interfaz:**
```typescript
export interface BothTicketsResult {
  ticket80mm: Blob;
  ticketA4: Blob;
  ticket80mmDoc: any;
  ticketA4Doc: any;
}
```

**Nuevo método:**
```typescript
public async generateBothTickets(backendData: BackendInvoiceData): Promise<BothTicketsResult>
```

**Lógica de detección:**
1. Verifica si es encomienda (`isCargoInvoice()`)
2. Verifica si es empresa (`doc_type === '6'`)
3. Verifica si es embarcación sin asientos (`isVesselWithoutSeats()`)
4. Default: ticket normal con asientos

**Generación paralela:**
```typescript
const [doc80mm, docA4] = await Promise.all([
  TemplateApropiadoTemplate.generatePDF(ticketData),
  A4Template.generatePDF(ticketData)
]);
```

#### 4. `src/hooks/useTicketUpload.ts`
**Cambios:**
- ✅ Añadido método `uploadBothTickets()`

**Nuevo método:**
```typescript
uploadBothTickets: (
  ticket80mm: Blob,
  ticketA4: Blob,
  invoiceId: number
) => Promise<{ url80mm: string | null; urlA4: string | null }>
```

**Carga paralela:**
```typescript
const [result80mm, resultA4] = await Promise.all([
  filesService.uploadInvoiceFile(ticket80mm, invoiceId, 'pdf_ticket'),
  filesService.uploadInvoiceFile(ticketA4, invoiceId, 'pdf_a4')
]);
```

#### 5. `src/features/fluvial/components/sales-point/TicketPreviewModal.tsx`
**Cambios completos:**

**Estados añadidos:**
```typescript
const [activeFormat, setActiveFormat] = useState<TicketFormat>('ticket80mm');
const [previewUrl80mm, setPreviewUrl80mm] = useState<string>('');
const [previewUrlA4, setPreviewUrlA4] = useState<string>('');
const [ticket80mmDoc, setTicket80mmDoc] = useState<any>(null);
const [ticketA4Doc, setTicketA4Doc] = useState<any>(null);
const [uploadSuccess, setUploadSuccess] = useState<{ url80mm: string | null; urlA4: string | null } | null>(null);
```

**Funciones actualizadas:**

1. **generateBothPreviews()** - Reemplaza `generatePreview()`
   - Usa `TicketGenerator.generateBothTickets()`
   - Genera URLs para ambos formatos
   - Llama a `uploadBothTickets()` automáticamente

2. **handleDownloadTicket()** - Modificado
   - Descarga según el formato activo (`activeFormat`)
   - Usa los documentos guardados en estado

**UI actualizada:**

1. **Tabs de formato:**
```tsx
<div className="flex border-b border-gray-200">
  <button onClick={() => setActiveFormat('ticket80mm')}>
    Ticket 80mm (Térmico)
  </button>
  <button onClick={() => setActiveFormat('a4')}>
    Ticket A4 (Corporativo)
  </button>
</div>
```

2. **Vista previa condicional:**
```tsx
{(activeFormat === 'ticket80mm' && previewUrl80mm) ? (
  <iframe src={previewUrl80mm} />
) : (activeFormat === 'a4' && previewUrlA4) ? (
  <iframe src={previewUrlA4} />
) : null}
```

3. **Indicador de carga dual:**
```tsx
{uploadSuccess && (
  <div>
    80mm: {uploadSuccess.url80mm || 'Error'}
    A4: {uploadSuccess.urlA4 || 'Error'}
  </div>
)}
```

---

## 🔄 Flujo de Operación

### Flujo al abrir el modal:

```
1. Usuario finaliza venta
   ↓
2. Se abre TicketPreviewModal
   ↓
3. useEffect detecta apertura → llama generateBothPreviews()
   ↓
4. TicketGenerator.generateBothTickets():
   ├─ Detecta tipo de venta
   ├─ Selecciona transformer apropiado
   ├─ Genera ticket80mm en paralelo con ticketA4
   └─ Retorna {ticket80mm, ticketA4, ticket80mmDoc, ticketA4Doc}
   ↓
5. Genera URLs de preview (URL.createObjectURL)
   ↓
6. uploadBothTickets():
   ├─ Sube ticket80mm → FileType: 'pdf_ticket'
   └─ Sube ticketA4 → FileType: 'pdf_a4'
   ↓
7. Muestra preview del formato activo (default: 80mm)
   ↓
8. Usuario puede:
   ├─ Cambiar tab para ver otro formato
   ├─ Descargar formato activo
   └─ Enviar por WhatsApp
```

### Tipos de venta soportados:

| Tipo de Venta | Template 80mm | Template A4 | Detección |
|--------------|---------------|-------------|-----------|
| **Pasaje Normal** | NormalTicketTemplate | A4Template | Default |
| **Pasaje Empresa** | CompanyTicketTemplate | A4Template | `doc_type === '6'` |
| **Encomienda** | CargoTicketTemplate | A4Template | `isCargoInvoice()` |
| **Sin Asientos** | NoSeatsTicketTemplate | A4Template | `isVesselWithoutSeats()` |
| **Sin Asientos Empresa** | NoSeatsCompanyTicketTemplate | A4Template | Sin asientos + RUC |

---

## 🎨 Diferencias de Diseño

### Ticket 80mm (Térmico)
- **Ancho:** 80mm fijo
- **Diseño:** Vertical, compacto
- **Bloques:** Sistema de 8 bloques específicos
- **Logo:** Centrado
- **QR:** Centrado al final
- **Cuentas bancarias:** ❌ No incluidas

### Ticket A4 (Corporativo)
- **Formato:** A4 (210x297mm)
- **Diseño:** Profesional, con márgenes amplios
- **Estructura:** 6 secciones claramente diferenciadas
- **Logo:** Izquierda del header
- **QR:** Izquierda del footer (35x35mm)
- **Cuentas bancarias:** ❌ No incluidas (según especificación)
- **Cajas de color:**
  - 🔵 Azul: Información del cliente
  - 🟠 Naranja: Información del destinatario (solo cargo)
  - 🟢 Verde: Total destacado

---

## 🔍 Detección Multi-Modal en A4

El template A4 usa el método `isCargoSale()` para detectar encomiendas:

```typescript
private static isCargoSale(ticketData: TicketData): boolean {
  const tripDetails = ticketData.trip_details?.toLowerCase() || '';
  return tripDetails.includes('destinatario');
}
```

**Adaptaciones según tipo:**

### Pasajes (Normal/Empresa/Sin Asientos):
- ✅ Muestra información del cliente
- ✅ Tabla incluye detalles del viaje en descripción
- ❌ NO muestra caja de destinatario

### Encomiendas:
- ✅ Muestra información del remitente
- ✅ Muestra caja naranja del destinatario
- ✅ Tabla incluye información del destinatario en descripción

---

## 📤 Sistema de Carga al Backend

### Endpoints utilizados:

**Base:** `/files/upload-invoice-file`

**Parámetros:**
- `file`: Blob del PDF
- `invoice_id`: ID de la factura
- `file_type`: Tipo de archivo

### FileTypes soportados:

| FileType | Uso | Template |
|----------|-----|----------|
| `pdf_ticket` | Ticket térmico 80mm | Todos los templates 80mm |
| `pdf_a4` | Ticket corporativo A4 | A4Template |

### Carga paralela:

```typescript
const [result80mm, resultA4] = await Promise.all([
  filesService.uploadInvoiceFile(ticket80mm, invoiceId, 'pdf_ticket'),
  filesService.uploadInvoiceFile(ticketA4, invoiceId, 'pdf_a4')
]);
```

**Ventajas:**
- ⚡ Más rápido que carga secuencial
- 🔄 Ambos se suben simultáneamente
- ✅ Si uno falla, el otro puede completarse

---

## ✅ Casos de Prueba

### Escenarios validados:

1. ✅ **Venta Normal:**
   - Genera ticket 80mm con asiento
   - Genera A4 con información del viaje
   - Sube ambos correctamente

2. ✅ **Venta Empresa:**
   - Genera ticket 80mm resumen
   - Genera A4 resumen (sin asientos individuales)
   - Detecta RUC (`doc_type === '6'`)

3. ✅ **Encomienda:**
   - Genera ticket 80mm cargo
   - Genera A4 con caja naranja de destinatario
   - Muestra datos del remitente y destinatario

4. ✅ **Sin Asientos:**
   - Genera ticket 80mm sin asiento
   - Genera A4 mostrando "elección libre"
   - Detecta embarcación sin asientos numerados

5. ✅ **Cambio de Tabs:**
   - Preview se actualiza al cambiar formato
   - Descarga funciona según formato activo
   - URLs se limpian correctamente al cerrar

---

## 🐛 Problemas Conocidos y Soluciones

### Problema 1: Tipos de jsPDF
**Error:** `Al tipo "jsPDF" le faltan las propiedades siguientes...`

**Solución:**
```typescript
// Cambiar de:
ticket80mmDoc: jsPDF

// A:
ticket80mmDoc: any
```

### Problema 2: Memoria con múltiples vistas previas
**Solución:** Cleanup de URLs al cerrar modal
```typescript
useEffect(() => {
  if (!isOpen) {
    if (previewUrl80mm) URL.revokeObjectURL(previewUrl80mm);
    if (previewUrlA4) URL.revokeObjectURL(previewUrlA4);
  }
}, [isOpen]);
```

---

## 📚 Dependencias

### Librerías utilizadas:
- `jspdf`: ^2.x - Generación de PDFs
- `qrcode`: Para códigos QR
- Utilidades internas: `getCurrencySymbol()`, `numeroALetras()`

### Servicios del backend:
- `filesService.uploadInvoiceFile()`
- Enum `FileType` con valores `'pdf_ticket'` y `'pdf_a4'`

---

## 🚀 Próximas Mejoras Sugeridas

1. **Descarga masiva:**
   - Botón "Descargar Ambos" que genere un ZIP

2. **Impresión directa:**
   - Integración con impresoras térmicas y A4

3. **Personalización:**
   - Permitir configurar colores de las cajas
   - Permitir mostrar/ocultar secciones

4. **WhatsApp:**
   - Enviar ambos formatos simultáneamente
   - Seleccionar cual enviar

5. **Historial:**
   - Ver tickets generados anteriormente
   - Re-descargar tickets antiguos

---

## 📝 Notas Finales

### Ventajas del sistema:
- ✅ **Un solo template A4** para todos los tipos de venta
- ✅ **Generación automática** sin intervención del usuario
- ✅ **Carga paralela** rápida y eficiente
- ✅ **Interfaz intuitiva** con tabs
- ✅ **Detección automática** del tipo de venta
- ✅ **Diseño profesional** para A4

### Mantenimiento futuro:
- Si se añade nuevo tipo de venta:
  1. Crear nuevo template 80mm (si necesario)
  2. A4Template detectará automáticamente vía `trip_details`
  3. Añadir caso en `generateBothTickets()`

### Recuperación tras pérdida de datos:
Este documento sirve como guía para reimplementar el sistema completo en caso de pérdida por cambios de git u otros incidentes.

---

**Implementado por:** GitHub Copilot  
**Documentado:** Diciembre 2024  
**Versión:** 1.0.0
