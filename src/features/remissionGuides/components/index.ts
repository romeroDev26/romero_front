// src/features/remissionGuides/components/index.ts

// Componentes de interfaz principal
export { RemissionGuideActions } from './RemissionGuideActions';
export { RemissionGuideSunatStatusModal } from './RemissionGuideSunatStatusModal';

// Modal de visualización de PDF
export { RemissionGuidePDFModal } from './RemissionGuidePDFModal';

// Componentes del flujo de creación de guías
export { StepIndicator } from './StepIndicator';
export { BranchStepContent } from './BranchStepContent';
export { TripStepContent } from './TripStepContent';
export { FormStepContent } from './FormStepContent';

// Componentes reutilizables específicos
export { ItemsForGuideModal } from './ItemsForGuideModal';
export { RemissionGuideTripSelector } from './RemissionGuideTripSelector';
export { BranchSelectorForRemission } from './BranchSelectorForRemission';

// Componente de resultado de generación
export { RemissionGuideGenerationResult } from './RemissionGuideGenerationResult';

// Modal de previsualización
export { RemissionGuidePreviewModal } from './RemissionGuidePreviewModal';

// Componentes PDF específicos
export { RemissionGuidePDFButton } from './RemissionGuidePDFButton';
export { RemissionGuideSenderPDFButton } from './RemissionGuideSenderPDFButton';
export { RemissionGuideSenderPreviewModal } from './RemissionGuideSenderPreviewModal';

// Componentes de generación PDF
export { 
  RemissionGuidePDFGenerator,
  MultipleRemissionGuidePDFGenerator,
  generateRemissionGuidePDF,
  generateMultipleRemissionGuidePDFs
} from './pdf/RemissionGuidePDFGenerator';
