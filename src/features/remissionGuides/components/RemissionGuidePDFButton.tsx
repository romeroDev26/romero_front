// src/features/remissionGuides/components/RemissionGuidePDFButton.tsx

import React from 'react';
import { 
  DocumentArrowDownIcon,
  EyeIcon 
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { useRemissionGuidePDFGeneration } from '../hooks/useRemissionGuidePDFGeneration';
import { convertToAutoGenerateGuide, canGeneratePDF } from '../utils/guideConversion';
import { RemissionGuideTransportista } from '../../../types';
import { toast } from '@/utils/sileo-toast';

interface RemissionGuidePDFButtonProps {
  guide: RemissionGuideTransportista;
  variant?: 'preview' | 'download' | 'both';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export const RemissionGuidePDFButton: React.FC<RemissionGuidePDFButtonProps> = ({
  guide,
  variant = 'both',
  size = 'md',
  showLabels = false
}) => {
  const { isGenerating, previewSinglePDF, downloadSinglePDF } = useRemissionGuidePDFGeneration();

  const handlePreviewPDF = async () => {
    if (!canGeneratePDF(guide)) {
      toast.error('No se puede generar el PDF. Faltan datos requeridos.');
      return;
    }

    const convertedGuide = convertToAutoGenerateGuide(guide);
    if (!convertedGuide) {
      toast.error('Error al procesar los datos de la guía.');
      return;
    }

    await previewSinglePDF(convertedGuide);
  };

  const handleDownloadPDF = async () => {
    if (!canGeneratePDF(guide)) {
      toast.error('No se puede generar el PDF. Faltan datos requeridos.');
      return;
    }

    const convertedGuide = convertToAutoGenerateGuide(guide);
    if (!convertedGuide) {
      toast.error('Error al procesar los datos de la guía.');
      return;
    }

    await downloadSinglePDF(convertedGuide);
  };

  if (!canGeneratePDF(guide)) {
    return null;
  }

  if (variant === 'preview') {
    return (
      <Button
        size={size}
        variant="outline"
        onClick={handlePreviewPDF}
        disabled={isGenerating}
        className="flex items-center"
      >
        <EyeIcon className="h-4 w-4 mr-2" />
        {showLabels && (isGenerating ? 'Generando...' : 'Vista Previa PDF')}
      </Button>
    );
  }

  if (variant === 'download') {
    return (
      <Button
        size={size}
        onClick={handleDownloadPDF}
        disabled={isGenerating}
        className="flex items-center"
      >
        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
        {showLabels && (isGenerating ? 'Generando...' : 'Descargar PDF')}
      </Button>
    );
  }

  // variant === 'both'
  return (
    <div className="flex space-x-2">
      <Button
        size={size}
        variant="outline"
        onClick={handlePreviewPDF}
        disabled={isGenerating}
        className="flex items-center"
      >
        <EyeIcon className="h-4 w-4 mr-1" />
        {showLabels && 'Vista Previa'}
      </Button>
      
      <Button
        size={size}
        onClick={handleDownloadPDF}
        disabled={isGenerating}
        className="flex items-center"
      >
        <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
        {showLabels && 'PDF'}
      </Button>
    </div>
  );
};