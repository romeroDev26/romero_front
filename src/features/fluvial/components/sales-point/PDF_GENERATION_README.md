# 📄 Sistema de Generación de PDFs para Comprobantes

## 🏗️ Arquitectura

Esta implementación modular permite generar y gestionar PDFs de comprobantes (facturas, boletas, encomiendas) en dos formatos: **A4** (estándar) y **Ticket** (térmico).

### 📁 Estructura de Directorios

```
src/features/fluvial/components/sales-point/
├── hooks/
│   └── usePDFGeneration.ts           # Hook principal para gestión de PDFs
├── services/
│   ├── pdfGenerationService.ts       # Lógica de generación de PDFs
│   └── pdfUploadService.ts           # Subida de PDFs al backend
├── components/
│   ├── PDFPreviewModal.tsx           # Modal de vista previa de PDFs
│   ├── PrintOptionsModal.tsx         # Modal de opciones de impresión
│   └── index.ts                      # Exportaciones
└── utils/
    ├── pdfTemplates.ts               # Plantillas A4 y Ticket
    └── pdfUtils.ts                   # Utilidades auxiliares
```

## 🚀 Uso Básico

### 1. Integrar en SaleForm.tsx

```tsx
import { usePDFGeneration } from './hooks/usePDFGeneration';
import { PDFPreviewModal, PrintOptionsModal } from './components';

export const SaleForm = () => {
  const { generateAndUploadPDFs, generatePreviewPDFs, isProcessing } = usePDFGeneration();
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [lastInvoiceData, setLastInvoiceData] = useState(null);

  const handleSaleSuccess = async (invoiceData) => {
    // Guardar datos de la factura
    setLastInvoiceData(invoiceData);
    
    // Mostrar modal de opciones
    setShowPrintOptions(true);
  };

  const handleGenerateAndUpload = async () => {
    if (!lastInvoiceData) return;
    
    const authToken = localStorage.getItem('authToken');
    const result = await generateAndUploadPDFs(lastInvoiceData, authToken);
    
    if (result.success) {
      // Mostrar preview o redireccionar
    }
  };

  return (
    <>
      {/* Tu formulario existente */}
      
      <PrintOptionsModal
        isOpen={showPrintOptions}
        onClose={() => setShowPrintOptions(false)}
        onPreview={() => setShowPDFPreview(true)}
        // ... otros props
      />
      
      <PDFPreviewModal
        isOpen={showPDFPreview}
        onClose={() => setShowPDFPreview(false)}
        // ... otros props
      />
    </>
  );
};
```

### 2. Modificar el callback onSaleSuccess

En lugar de solo cerrar o mostrar toast, ahora:

```tsx
const handleConfirmSale = async () => {
  // ... lógica existente de venta
  
  const result = await handleRegularSale(/* parámetros */);
  
  if (result.success) {
    // Activar el flujo de PDFs
    handleSaleSuccess(result.invoiceData);
  }
};
```

## 📋 Tipos de Datos Soportados

### Venta Normal (DNI/RUC simple)
```typescript
interface InvoiceData {
  id: number;
  series: string;
  number: number;
  document_type_code: string;
  client: ClientData;
  company: CompanyData;
  items: ItemData[];
  // ... otros campos
}
```

### Venta Empresarial (con representantes)
```typescript
interface CompanyInvoiceData {
  invoice: InvoiceData;
  representatives: RepresentativeData[];
  summary: SummaryData;
}
```

### Venta de Encomiendas
El mismo formato `InvoiceData`, pero con items específicos de carga.

## 🎨 Personalización de Plantillas

### Modificar Plantilla A4
```typescript
// En pdfTemplates.ts
export const pdfTemplateA4 = {
  addCompanyHeader: (doc, company, startY, pageWidth) => {
    // Personalizar header de empresa
    doc.setFontSize(16);
    doc.text(company.business_name, pageWidth / 2, startY, { align: 'center' });
    // ...
  },
  // ... otros métodos
};
```

### Modificar Plantilla Ticket
```typescript
// En pdfTemplates.ts
export const pdfTemplateTicket = {
  addCompactHeader: (doc, company, startY, pageWidth) => {
    // Header más compacto para ticket térmico
    doc.setFontSize(10);
    // ...
  },
  // ... otros métodos
};
```

## 🔧 Configuración de Backend

### Endpoint requerido para subir archivos:
- `POST /api/v1/files/upload`

### Endpoint requerido para actualizar rutas PDF:
- `PATCH /api/v1/invoices/{id}/pdf-paths`

## ⚡ Flujo Completo

1. **Venta exitosa** → Se ejecuta `onSaleSuccess`
2. **Modal de opciones** → Usuario selecciona qué hacer
3. **Generar PDFs** → En paralelo (A4 + Ticket)
4. **Subir al backend** → Actualizar rutas en BD
5. **Mostrar preview** → Modal con ambos formatos
6. **Imprimir/Descargar** → Según selección del usuario

## 🔍 Debugging

### Logs útiles:
```typescript
// En pdfGenerationService.ts
console.log('Generando PDF A4 para factura:', invoice.id);

// En pdfUploadService.ts  
console.log('Subiendo PDFs al backend:', { invoiceId, fileSize });

// En usePDFGeneration.ts
console.log('Estado del proceso:', { isGenerating, isUploading });
```

### Validaciones comunes:
- Verificar que jsPDF esté instalado: `npm list jspdf`
- Verificar estructura de datos de factura
- Verificar tokens de autenticación
- Verificar endpoints del backend

## 🚨 Consideraciones Importantes

1. **Tamaños de archivo**: PDF A4 (~500KB), PDF Ticket (~200KB)
2. **Tiempo de generación**: ~2-3 segundos en total
3. **Compatibilidad**: Navegadores modernos con soporte Blob
4. **Memoria**: Los PDFs se mantienen en memoria temporalmente
5. **Errores de red**: Manejo robusto de fallos de subida

## 🔄 Próximas Mejoras

- [ ] Generar códigos QR para los comprobantes
- [ ] Integración con impresoras térmicas directas
- [ ] Cache de PDFs generados
- [ ] Plantillas personalizables por empresa
- [ ] Watermarks y sellos digitales
- [ ] Envío automático por email
