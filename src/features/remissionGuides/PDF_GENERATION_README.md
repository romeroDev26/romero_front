# Sistema de Generación PDF para Guías de Remisión de Transportista

## Resumen

Este sistema permite generar PDFs A4 profesionales para las guías de remisión de transportista siguiendo el formato oficial especificado. Después de generar guías automáticamente, se muestra un modal de previsualización que permite visualizar y descargar cada PDF, además de subirlos automáticamente al backend.

## Características Principales

- ✅ **Generación automática** de PDFs tras crear guías
- ✅ **Modal de previsualización** con iframe integrado  
- ✅ **Upload automático** al backend usando la API oficial
- ✅ **Navegación entre múltiples** PDFs generados
- ✅ **Formato A4** siguiendo el modelo oficial
- ✅ **Conversión automática** de tipos de datos
- ✅ **Vista previa** y descarga directa
- ✅ **Estados de carga** y feedback visual

## Flujo Principal

### 1. Generación de Guías Automática

1. Usuario selecciona viaje y completa datos del conductor
2. Hace clic en "Generar Guías Automáticamente"  
3. Backend genera guías para cada destino del viaje
4. **NUEVO**: Automáticamente se abre modal de previsualización
5. Se generan PDFs para cada guía y se suben al backend
6. Usuario puede navegar, previsualizar y descargar PDFs

### 2. Modal de Previsualización

El modal `RemissionGuidePreviewModal` se muestra automáticamente y:

- Genera PDFs A4 para todas las guías creadas
- Sube cada PDF al backend usando `/api/v1/sunat/remission-guides-auto/{guide_id}/upload-pdf`
- Muestra estado de upload (subiendo/éxito/error) para cada guía
- Permite navegación entre múltiples PDFs 
- Incluye botones para imprimir, descargar individual y descargar todas

## Estructura de Archivos Actualizada

```
src/features/remissionGuides/
├── components/
│   ├── pdf/
│   │   └── RemissionGuidePDFGenerator.tsx     # Generador principal de PDFs
│   ├── RemissionGuidePDFButton.tsx            # Botón para páginas existentes
│   ├── RemissionGuidePreviewModal.tsx         # Modal de previsualización
│   ├── RemissionGuideGenerationResult.tsx    # Resultado post-generación  
│   └── FormStepContent.tsx                    # Integrado con modal
├── hooks/
│   └── useRemissionGuidePDFGeneration.ts      # Hook para manejar PDFs
├── utils/
│   └── guideConversion.ts                     # Conversión de tipos
└── services/
    └── remissionGuides.service.ts             # Servicio con upload PDF
```

## API Integration

### Upload de PDFs

El servicio incluye método para subir PDFs al backend:

```typescript
await remissionGuidesService.uploadRemissionGuidePDF(
  guideId: number, 
  pdfFile: File, 
  pdfType: 'standard' | 'a4' | 'ticket' = 'a4'
);
```

**Endpoint utilizado**: `/api/v1/sunat/remission-guides-auto/{guide_id}/upload-pdf?pdf_type=a4`

**Parámetros**:
- `guide_id`: ID de la guía generada automáticamente
- `pdf_type`: Tipo de PDF (`a4` por defecto)
- `pdf_file`: Archivo PDF en FormData

### Estados de Upload

El modal muestra estados en tiempo real:
- ✓ **Success**: PDF subido correctamente  
- ↑ **Uploading**: Upload en progreso
- ✗ **Error**: Error en el upload

## Uso del Modal de Previsualización

### Integración Automática

```tsx
// En FormStepContent.tsx - se activa automáticamente
const handleAutoGenerate = async () => {
  // ... lógica de generación ...
  const response = await remissionGuidesService.autoGenerate(payload);
  
  // Mostrar modal automáticamente
  setGenerationResult(response);
  setShowPreviewModal(true);
};

// Modal se renderiza automáticamente
{showPreviewModal && generationResult && (
  <RemissionGuidePreviewModal
    isOpen={showPreviewModal}
    onClose={() => {
      setShowPreviewModal(false);
      navigate('/remission-guides');
    }}
    generationResult={generationResult}
  />
)}
```

### Uso Manual

```tsx
import { RemissionGuidePreviewModal } from '../components/RemissionGuidePreviewModal';

<RemissionGuidePreviewModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  generationResult={generationResponse}
/>
```

## Funcionalidades del Modal

### 1. Navegación entre PDFs

- Lista clickeable de todas las guías generadas
- Información de destino y destinatario
- Estados de upload visible en cada guía

### 2. Previsualización

- Iframe integrado para vista en vivo del PDF
- Cambio automático al seleccionar otra guía
- Indicadores de carga durante generación

### 3. Acciones Disponibles

- **Imprimir**: Abre PDF en nueva ventana para imprimir
- **Descargar Esta**: Descarga PDF de la guía actual
- **Descargar Todas**: Descarga todos los PDFs (con delay)
- **Cerrar**: Cierra modal y navega a lista de guías

## Ejemplo de Respuesta del Backend

```json
{
  "trip_id": 25,
  "trip_name": "Guía test 2", 
  "guides_generated": [
    {
      "guide_id": 69,
      "document_number": "R001-00000049",
      "destination_port_name": "NUEVA UNIÓN",
      "recipient_name": "WILMER ALEXANDER EDQUÉN BARBOZA",
      // ... más datos
    }
  ]
}
```

## Manejo de Errores

### Upload Fallbacks

```typescript
try {
  await remissionGuidesService.uploadRemissionGuidePDF(guide.guide_id, file, 'a4');
  // Éxito - marca como subido
} catch (uploadError) {
  // Error - permite descarga manual
  console.warn(`Upload falló para guía ${guide.guide_id}`);
}
```

### Estados de Error

- **PDF Generation Error**: Muestra mensaje en lugar de iframe
- **Upload Error**: Marca guía con ✗ pero permite descarga
- **Network Error**: Toast de error y estado visual

## Beneficios de la Nueva Implementación

### Para el Usuario
- ✅ **Feedback inmediato** de las guías generadas
- ✅ **Vista previa** antes de imprimir/usar  
- ✅ **Descarga selectiva** o masiva
- ✅ **Confirmación visual** de subida al sistema

### Para el Sistema
- ✅ **Upload automático** al backend
- ✅ **Validación visual** de documentos generados
- ✅ **Reducción de errores** por previsualización
- ✅ **Mejor experiencia** de usuario

### Para el Desarrollo
- ✅ **Patrón consistente** con otros módulos (manifiestos)
- ✅ **Reutilización** de componentes PDF existentes
- ✅ **Separación de responsabilidades** clara
- ✅ **Fácil mantenimiento** y extensión

## Comparación con Manifiestos

| Aspecto | Manifiestos | Guías de Remisión |
|---------|-------------|-------------------|
| Modal | ✅ ManifestPreviewModal | ✅ RemissionGuidePreviewModal |
| Upload Auto | ✅ uploadManifestPDF | ✅ uploadRemissionGuidePDF |  
| Multi-PDF | ❌ Solo uno | ✅ Múltiples guías |
| Navegación | ❌ N/A | ✅ Selector de guías |
| Estados | ✅ Básicos | ✅ Upload status por guía |

## Próximas Mejoras

- [ ] **Compresión** de PDFs para uploads más rápidos
- [ ] **Retry automático** para uploads fallidos  
- [ ] **Progress bars** individuales por PDF
- [ ] **Notificaciones** push de éxito/error
- [ ] **Preview thumbnails** en selector de guías