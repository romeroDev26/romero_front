# Implementación del Generador de PDF para Cotizaciones

## Descripción
Se ha creado un generador de PDF para cotizaciones que sigue la misma estructura que el generador de manifiestos, adaptado para mostrar la información específica de cotizaciones.

## Archivos Creados/Modificados

### 1. QuotationPDFGenerator.tsx
- **Ubicación**: `src/features/quotations/components/QuotationPDFGenerator.tsx`
- **Descripción**: Componente principal que genera PDFs de cotizaciones usando jsPDF y jspdf-autotable
- **Características**:
  - Header con información de la empresa (logo, nombre, RUC, dirección, teléfono, email)
  - Información general de la cotización (fechas, términos de pago, estado)
  - Información del cliente (nombre, documento, email, teléfono, dirección)
  - Tabla detallada de items con precios y totales
  - Sección de totales con subtotal, descuentos, IGV y total final
  - Total en palabras
  - Observaciones y notas del servicio
  - Footer con información del sistema y vendedor

### 2. Modificaciones en index.ts
- **Ubicación**: `src/features/quotations/components/index.ts`
- **Descripción**: Se agregó la exportación del QuotationPDFGenerator

### 3. Modificaciones en QuotationDetailPage.tsx
- **Ubicación**: `src/features/quotations/pages/QuotationDetailPage.tsx`
- **Descripción**: Se integró el QuotationPDFGenerator en la página de detalles de cotización
- **Cambios**:
  - Se importó el QuotationPDFGenerator
  - Se reemplazó el botón "Imprimir PDF" con el componente QuotationPDFGenerator
  - Se eliminó la función handlePrintPDF que no tenía implementación

## Funcionalidades del PDF

### Header de la Empresa
- Logo de la empresa (con placeholder si no está disponible)
- Nombre de la empresa (business_name)
- RUC
- Dirección completa
- Teléfono y email de contacto

### Información de la Cotización
- Título "COTIZACIÓN"
- Número de cotización (formato: SERIE-NÚMERO)
- Fecha de emisión y fecha de vencimiento
- Moneda, términos de pago y estado
- Información completa del cliente

### Tabla de Items
Columnas:
- N°
- DESCRIPCIÓN
- CANTIDAD
- UNIDAD
- PRECIO UNITARIO
- DESCUENTO
- SUBTOTAL

### Sección de Totales
- Subtotal
- Descuentos (si aplican)
- IGV (18%)
- Total final
- Total en palabras

### Información Adicional
- Observaciones del cliente
- Información del servicio (desde internal_notes)
- Footer con fecha de generación, vendedor y validez

## Uso del Componente

```tsx
import { QuotationPDFGenerator } from '../components/QuotationPDFGenerator';

// En el JSX
<QuotationPDFGenerator quotationData={quotation} />
```

El componente renderiza dos botones:
1. **Vista Previa**: Abre el PDF en una nueva ventana del navegador
2. **Descargar PDF**: Descarga el archivo PDF directamente

## Estructura del JSON de Cotización Esperada

El componente espera recibir un objeto `Quotation` que incluya todas las propiedades definidas en `src/features/quotations/types/index.ts`, especialmente:

- `company`: Información completa de la empresa
- `client`: Información completa del cliente
- `seller`: Información del vendedor
- `items`: Array de items con precios y descripciones
- `total_*`: Todos los campos de totales
- `notes`: Observaciones del cliente
- `internal_notes`: Información del servicio

## Dependencias Requeridas

Las siguientes dependencias ya están instaladas en el proyecto:
- `jspdf`: ^3.0.1
- `jspdf-autotable`: ^5.0.2
- `@types/jspdf`: ^1.3.3

## Ejemplo de Uso Completo

```tsx
// En una página de detalle de cotización
export const QuotationDetailPage: React.FC = () => {
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  
  // ... lógica para cargar la cotización ...
  
  return (
    <div className="space-y-6">
      {/* ... otros elementos ... */}
      
      <div className="flex space-x-2">
        {/* Botones de PDF */}
        <QuotationPDFGenerator quotationData={quotation} />
        
        {/* ... otros botones ... */}
      </div>
      
      {/* ... contenido de la página ... */}
    </div>
  );
};
```

## Personalización

El componente puede personalizarse modificando:
- Colores del tema en `headStyles.fillColor`
- Tamaños de fuente en `fontSize`
- Anchos de columna en `columnStyles`
- Contenido del footer
- Estilos de la tabla

La implementación está lista para ser usada inmediatamente en cualquier página que tenga acceso a un objeto `Quotation` completo con toda la información necesaria.
