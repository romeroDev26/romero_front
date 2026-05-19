// src/features/remissionGuides/components/RemissionGuideSenderPDFButton.tsx

import React from 'react';
import { 
  DocumentArrowDownIcon,
  EyeIcon 
} from '@heroicons/react/24/outline';
import { generateRemissionGuidePDF } from './pdf/RemissionGuidePDFGenerator';
import { convertSenderGuideToAutoGenerate, canGenerateSenderPDF } from '../utils/guideConversion';
import { RemissionGuideRemitente } from '../../../types';
import { remissionGuidesSenderService } from '../../../services/remissionGuidesSender.service';
import { toast } from '@/utils/sileo-toast';

interface RemissionGuideSenderPDFButtonProps {
  guide: RemissionGuideRemitente;
  variant?: 'preview' | 'download' | 'both';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export const RemissionGuideSenderPDFButton: React.FC<RemissionGuideSenderPDFButtonProps> = ({
  guide,
  variant = 'both',
  size = 'md',
  showLabels = false
}) => {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handlePreviewPDF = async () => {
    if (!canGenerateSenderPDF(guide)) {
      toast.error('La guía no tiene los datos suficientes para generar PDF');
      return;
    }

    setIsGenerating(true);
    try {
      const convertedGuide = convertSenderGuideToAutoGenerate(guide);
      if (!convertedGuide) {
        toast.error('Error al procesar los datos de la guía');
        return;
      }

      const { blob } = await generateRemissionGuidePDF(convertedGuide, 'remitente');
      
      // Subir PDF al backend automáticamente
      try {
        const fileName = `${guide.series}-${guide.number.toString().padStart(8, '0')}`;
        const pdfFile = new File([blob], `guia-remision-${fileName}.pdf`, {
          type: 'application/pdf'
        });
        
        await remissionGuidesSenderService.uploadRemissionGuidePDF(guide.id, pdfFile, 'a4');
        toast.success('PDF generado y subido al sistema');
      } catch (uploadError) {
        console.warn('Error al subir PDF automáticamente:', uploadError);
        // No mostrar error, ya que el PDF se generó correctamente
      }

      // Abrir PDF en nueva ventana para previsualización
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Limpiar URL después de un tiempo
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      
    } catch (error) {
      console.error('Error generating sender PDF:', error);
      toast.error('Error al generar el PDF de la guía del remitente');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!canGenerateSenderPDF(guide)) {
      toast.error('La guía no tiene los datos suficientes para generar PDF');
      return;
    }

    setIsGenerating(true);
    try {
      const convertedGuide = convertSenderGuideToAutoGenerate(guide);
      if (!convertedGuide) {
        toast.error('Error al procesar los datos de la guía');
        return;
      }

      const { pdf, blob } = await generateRemissionGuidePDF(convertedGuide, 'remitente');
      
      // Subir PDF al backend automáticamente
      try {
        const fileName = `${guide.series}-${guide.number.toString().padStart(8, '0')}`;
        const pdfFile = new File([blob], `guia-remision-${fileName}.pdf`, {
          type: 'application/pdf'
        });
        
        await remissionGuidesSenderService.uploadRemissionGuidePDF(guide.id, pdfFile, 'a4');
        toast.success('PDF generado y subido al sistema');
      } catch (uploadError) {
        console.warn('Error al subir PDF automáticamente:', uploadError);
        // No mostrar error, ya que el PDF se generó correctamente
      }

      // Descargar el PDF
      const fileName = `${guide.series}-${guide.number.toString().padStart(8, '0')}`;
      pdf.save(`guia-remision-remitente-${fileName}.pdf`);
      
    } catch (error) {
      console.error('Error generating sender PDF:', error);
      toast.error('Error al generar el PDF de la guía del remitente');
    } finally {
      setIsGenerating(false);
    }
  };

  const buttonClass = `
    ${size === 'sm' ? 'px-2 py-1 text-xs' : size === 'lg' ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'}
    inline-flex items-center justify-center rounded-md font-medium
    transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
    ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  if (variant === 'preview') {
    return (
      <button
        onClick={handlePreviewPDF}
        disabled={isGenerating}
        className={`${buttonClass} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`}
      >
        <EyeIcon className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} ${showLabels ? 'mr-1' : ''}`} />
        {showLabels && 'Ver PDF'}
      </button>
    );
  }

  if (variant === 'download') {
    return (
      <button
        onClick={handleDownloadPDF}
        disabled={isGenerating}
        className={`${buttonClass} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500`}
      >
        <DocumentArrowDownIcon className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} ${showLabels ? 'mr-1' : ''}`} />
        {showLabels && 'Descargar'}
      </button>
    );
  }

  // variant === 'both'
  return (
    <div className="flex space-x-2">
      <button
        onClick={handlePreviewPDF}
        disabled={isGenerating}
        className={`${buttonClass} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`}
      >
        <EyeIcon className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} ${showLabels ? 'mr-1' : ''}`} />
        {showLabels && 'Ver'}
      </button>
      
      <button
        onClick={handleDownloadPDF}
        disabled={isGenerating}
        className={`${buttonClass} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500`}
      >
        <DocumentArrowDownIcon className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} ${showLabels ? 'mr-1' : ''}`} />
        {showLabels && 'PDF'}
      </button>
    </div>
  );
};