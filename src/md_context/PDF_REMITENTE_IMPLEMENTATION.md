# Implementación de PDF para Guías de Remisión del Remitente

## Resumen

Esta implementación extiende el sistema existente de generación de PDFs para guías de remisión de transportista para soportar también guías de remisión del remitente, utilizando el mismo PDF Generator pero con distintas configuraciones según el tipo de guía.

## 🚀 Características Implementadas

- ✅ **Conversión de datos**: Función para convertir guías del remitente al formato compatible con el PDF Generator
- ✅ **PDF Generator extendido**: Soporte para generar PDFs tanto de transportista como de remitente
- ✅ **Servicio de subida**: Nuevo endpoint para subir PDFs del remitente (`/api/v1/sunat/remission-guides-sender/{guide_id}/upload-pdf`)
- ✅ **Componente PDF Button**: Botón específico para guías del remitente con funcionalidades completas
- ✅ **Hook personalizado**: Hook para manejar generación y subida de PDFs del remitente
- ✅ **Subida automática**: Los PDFs se suben automáticamente al backend al ser generados
- ✅ **Modal de previsualización**: Modal específico para mostrar PDF del remitente después de creación
- ✅ **Integración en formulario**: El formulario de remitente ahora genera y muestra PDF automáticamente
- ✅ **Flujo completo**: Crear guía → Generar PDF → Subir al backend → Mostrar previsualización

## 📁 Estructura de Archivos Creados/Modificados

```
src/features/remissionGuides/
├── components/
│   ├── pdf/
│   │   └── RemissionGuidePDFGenerator.tsx          # ✅ MODIFICADO: Soporte para remitente
│   ├── RemissionGuideSenderPDFButton.tsx           # ✅ NUEVO: Botón PDF remitente
│   ├── RemissionGuideSenderPreviewModal.tsx        # ✅ NUEVO: Modal previsualización
│   ├── FormStepContentSender.tsx                   # ✅ MODIFICADO: Integración PDF
│   └── index.ts                                    # ✅ MODIFICADO: Exports actualizados
├── hooks/
│   └── useRemissionGuideSenderPDFGeneration.ts     # ✅ NUEVO: Hook remitente
├── utils/
│   └── guideConversion.ts                          # ✅ MODIFICADO: Conversión remitente
└── services/
    └── remissionGuidesSender.service.ts            # ✅ MODIFICADO: Upload PDF
```

## 🔧 Cambios Técnicos Principales

### 1. PDF Generator Extendido

El generador de PDFs ahora acepta un parámetro `guideType` para generar PDFs apropiados:

```typescript
export const generateRemissionGuidePDF = async (
  guideData: AutoGenerateRemissionGuide,
  guideType: RemissionGuideType = 'transportista' // 'transportista' | 'remitente'
): Promise<{ pdf: jsPDF; blob: Blob }> => {
  // Título dinámico según el tipo
  const guideTitle = guideType === 'transportista' 
    ? 'GUÍA DE REMISIÓN TRANSPORTISTA'
    : 'GUÍA DE REMISIÓN REMITENTE';
  
  // Logo texto dinámico
  const companyType = guideType === 'transportista' ? 'TRANSPORTISTA' : 'REMITENTE';
  // ...resto de la lógica
}
```

### 2. Conversión de Datos del Remitente

Nueva función para convertir la estructura del remitente (basada en log.md) al formato esperado:

```typescript
export const convertSenderGuideToAutoGenerate = (
  guide: RemissionGuideRemitente
): AutoGenerateRemissionGuide | null => {
  // Conversión de estructura de remitente a formato PDF
  // Maneja campos específicos del remitente vs transportista
}
```

### 3. Servicio de Subida PDF Remitente

Nuevo método en el servicio del remitente:

```typescript
async uploadRemissionGuidePDF(
  guideId: number, 
  pdfFile: File,
  pdfType: 'standard' | 'a4' | 'ticket' = 'standard'
): Promise<void> {
  // Subida a /api/v1/sunat/remission-guides-sender/{guide_id}/upload-pdf
}
```

### 4. Componente PDF Button del Remitente

Botón especializado para guías del remitente con:
- Generación automática de PDF
- Subida automática al backend
- Previsualización y descarga
- Manejo de errores específico

## 🎯 Cómo Usar

### En una página de lista de guías del remitente:

```tsx
import { RemissionGuideSenderPDFButton } from '../components/RemissionGuideSenderPDFButton';

// En el componente
<RemissionGuideSenderPDFButton 
  guide={remissionGuideRemitente} 
  variant="both"          // 'preview' | 'download' | 'both'
  size="sm"              // 'sm' | 'md' | 'lg'
  showLabels={true}      // Mostrar texto en botones
/>
```

### Usando el hook directamente:

```tsx
import { useRemissionGuideSenderPDFGeneration } from '../hooks/useRemissionGuideSenderPDFGeneration';

const MyComponent = () => {
  const { 
    isGenerating,
    previewSinglePDF,
    downloadSinglePDF,
    downloadMultiplePDFs 
  } = useRemissionGuideSenderPDFGeneration();

  const handlePreview = async () => {
    await previewSinglePDF(guideData, true); // true = subir al backend
  };

  // ...resto del componente
};
```

## 🔄 Flujo de Generación PDF Remitente

### Flujo Principal (Formulario):
1. **Usuario completa formulario** → Datos del remitente, destinatario, productos
2. **Submit formulario** → `FormStepContentSender.onSubmit()`
3. **Crear guía** → `remissionGuidesSenderService.create()`
4. **Conversión automática** → `convertSenderGuideToAutoGenerate()`
5. **Generar PDF** → `generateRemissionGuidePDF(data, 'remitente')`
6. **Subida automática** → `uploadRemissionGuidePDF()` al backend
7. **Mostrar modal** → `RemissionGuideSenderPreviewModal` con vista previa
8. **Acciones usuario** → Descargar, imprimir, cerrar → navegar a lista

### Flujo Alternativo (Botón directo):
1. **Usuario hace clic** → `RemissionGuideSenderPDFButton`
2. **Conversión de datos** → `convertSenderGuideToAutoGenerate()`
3. **Generación PDF** → `generateRemissionGuidePDF(data, 'remitente')`
4. **Subida automática** → `uploadRemissionGuidePDF()` al backend
5. **Acción final** → Previsualización o descarga directa

## 📋 Endpoint de Subida

**POST** `/api/v1/sunat/remission-guides-sender/{guide_id}/upload-pdf`

**Parámetros:**
- `guide_id`: ID de la guía del remitente
- `file`: Archivo PDF (multipart/form-data)
- `pdf_type`: Tipo de PDF ('standard', 'a4', 'ticket')

**Permisos:** Requiere rol `dispatcher` o `admin`

## 🔍 Diferencias entre Transportista y Remitente

| Aspecto | Transportista | Remitente |
|---------|---------------|-----------|
| **Endpoint subida** | `/sunat/remission-guides-auto/{id}/upload-pdf` | `/sunat/remission-guides-sender/{id}/upload-pdf` |
| **Título PDF** | "GUÍA DE REMISIÓN TRANSPORTISTA" | "GUÍA DE REMISIÓN REMITENTE" |
| **Logo texto** | "S.A.C. - TRANSPORTISTA" | "S.A.C. - REMITENTE" |
| **Tipo documento** | "31" | "09" |
| **Estructura datos** | `AutoGenerateRemissionGuide` directa | Conversión desde `RemissionGuideRemitente` |

## 🧪 Testing

Para probar la funcionalidad completa:

### 1. Flujo Principal (Formulario):
1. **Ir a crear nueva guía** → `/remission-guides/new`
2. **Seleccionar "Remitente"** en el selector de tipo
3. **Completar formulario** con todos los datos requeridos
4. **Hacer clic en "Generar Guía de Remisión"**
5. **Verificar creación** exitosa y toast de confirmación
6. **Confirmar aparición** del modal de previsualización automático
7. **Verificar PDF generado** con título "GUÍA DE REMISIÓN REMITENTE"
8. **Probar botones** de descargar e imprimir
9. **Cerrar modal** y verificar navegación a lista

### 2. Flujo Alternativo (Botón directo):
1. **Localizar guía del remitente** existente en cualquier lista
2. **Usar `RemissionGuideSenderPDFButton`** con diferentes variantes
3. **Verificar generación** y subida automática
4. **Confirmar formato** A4 y contenido apropiado

## 📝 Ejemplo de Estructura de Datos

### Input (RemissionGuideRemitente - del backend):
```json
{
  "id": 12,
  "series": "R001",
  "number": 12,
  "document_type_code": "09",
  "sender_doc_type": "6",
  "sender_doc_number": "76307497",
  "sender_name": "Wilmer Alexander Edquén Barboza",
  // ...resto de campos del log.md
}
```

### Output (AutoGenerateRemissionGuide - para PDF):
```json
{
  "guide_id": 12,
  "document_type_code": "09",
  "series": "R001",
  "number": 12,
  "document_number": "R001-00000012",
  "sender_doc_type": "6",
  "sender_doc_number": "76307497",
  "sender_name": "Wilmer Alexander Edquén Barboza",
  // ...campos convertidos para el PDF Generator
}
```

## 🔒 Validaciones

- ✅ **Datos mínimos**: Verifica que la guía tenga sender, receiver, addresses
- ✅ **Tipo correcto**: Solo acepta guías del remitente (document_type_code: "09")
- ✅ **Permisos**: Validación en backend para subida de archivos
- ✅ **Formato archivo**: Solo PDFs válidos
- ✅ **Tamaño**: Limitación estándar de archivos

## 🚧 Limitaciones Conocidas

1. **Puerto destino**: No siempre disponible en guías del remitente, usa valor por defecto
2. **Información embarcación**: Puede ser limitada comparado con transportista  
3. **Conversión automática**: Algunos campos requieren valores por defecto si no están disponibles

## 🎉 Beneficios de la Implementación

- **Reutilización de código**: Usa el mismo PDF Generator optimizado
- **Consistencia visual**: PDFs con formato similar pero identificación clara
- **Subida automática**: Integración transparente con el backend
- **Experiencia unificada**: Botones y flujo similares entre ambos tipos
- **Mantenimiento simplificado**: Un solo generador para ambos tipos

---

**✨ La implementación está lista para usar!** Solo resta integrar los componentes en las páginas donde se listen o muestren guías del remitente.