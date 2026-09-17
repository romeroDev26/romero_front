// src/features/remissionGuides/hooks/useRemissionGuideSenderPDFGeneration.ts

import { useState } from 'react';
import { toast } from '@/utils/sileo-toast';
import { generateRemissionGuidePDF } from '../components/pdf/RemissionGuidePDFGenerator';
import { convertSenderGuideToAutoGenerate } from '../utils/guideConversion';
import { remissionGuidesSenderService } from '../../../services/remissionGuidesSender.service';
import type jsPDF from 'jspdf';
import type { RemissionGuideRemitente } from '../../../types';

export interface RemissionGuideSenderPDFResult {
  pdf: jsPDF;
  blob: Blob;
}

export const useRemissionGuideSenderPDFGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Genera PDF para una sola guía de remisión del remitente
   */
  const generateSinglePDF = async (
    guideData: RemissionGuideRemitente
  ): Promise<RemissionGuideSenderPDFResult | null> => {
    setIsGenerating(true);
    try {
      const convertedGuide = convertSenderGuideToAutoGenerate(guideData);
      if (!convertedGuide) {
        toast.error('Error al procesar los datos de la guía del remitente');
        return null;
      }

      const result = await generateRemissionGuidePDF(convertedGuide, 'remitente');
      toast.success(`PDF generado para guía ${convertedGuide.document_number}`);
      return result;
    } catch (error) {
      console.error('Error generating remission guide sender PDF:', error);
      toast.error('Error al generar el PDF de la guía del remitente');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Genera múltiples PDFs para guías del remitente
   */
  const generateMultiplePDFs = async (
    guidesData: RemissionGuideRemitente[]
  ): Promise<RemissionGuideSenderPDFResult[] | null> => {
    setIsGenerating(true);
    try {
      const results: RemissionGuideSenderPDFResult[] = [];

      for (const guide of guidesData) {
        const convertedGuide = convertSenderGuideToAutoGenerate(guide);
        if (convertedGuide) {
          const result = await generateRemissionGuidePDF(convertedGuide, 'remitente');
          results.push(result);
        }
      }

      toast.success(`${results.length} PDFs generados para guías del remitente`);
      return results;
    } catch (error) {
      console.error('Error generating multiple remission guide sender PDFs:', error);
      toast.error('Error al generar los PDFs de las guías del remitente');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Descarga un PDF individual y opcionalmente lo sube al backend
   */
  const downloadSinglePDF = async (
    guideData: RemissionGuideRemitente,
    uploadToBackend: boolean = true
  ): Promise<void> => {
    setIsGenerating(true);
    try {
      const convertedGuide = convertSenderGuideToAutoGenerate(guideData);
      if (!convertedGuide) {
        toast.error('Error al procesar los datos de la guía del remitente');
        return;
      }

      const { pdf, blob } = await generateRemissionGuidePDF(convertedGuide, 'remitente');

      // Subir al backend si se solicita
      if (uploadToBackend) {
        try {
          const fileName = `${guideData.series}-${guideData.number.toString().padStart(8, '0')}`;
          const pdfFile = new File([blob], `guia-remision-remitente-${fileName}.pdf`, {
            type: 'application/pdf'
          });
          
          await remissionGuidesSenderService.uploadRemissionGuidePDF(guideData.id, pdfFile, 'a4');
          toast.success('PDF generado, descargado y subido al sistema');
        } catch (uploadError) {
          console.warn('Error al subir PDF automáticamente:', uploadError);
          toast.success('PDF descargado (error al subir al sistema)');
        }
      } else {
        toast.success(`PDF descargado: ${convertedGuide.document_number}`);
      }

      // Descargar el PDF
      const fileName = `${guideData.series}-${guideData.number.toString().padStart(8, '0')}`;
      pdf.save(`guia-remision-remitente-${fileName}.pdf`);
    } catch (error) {
      console.error('Error downloading remission guide sender PDF:', error);
      toast.error('Error al descargar el PDF del remitente');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Descarga múltiples PDFs con delay entre cada uno
   */
  const downloadMultiplePDFs = async (
    guidesData: RemissionGuideRemitente[],
    uploadToBackend: boolean = true
  ): Promise<void> => {
    setIsGenerating(true);
    try {
      // Programar descarga en cadena para evitar generar muchos blobs simultáneamente
      for (let i = 0; i < guidesData.length; i++) {
        const guide = guidesData[i];

        setTimeout(() => {
          (async () => {
            try {
              const convertedGuide = convertSenderGuideToAutoGenerate(guide);
              if (!convertedGuide) return;

              const { pdf, blob } = await generateRemissionGuidePDF(convertedGuide, 'remitente');

              // Subir al backend si se solicita
              if (uploadToBackend) {
                try {
                  const fileName = `${guide.series}-${guide.number.toString().padStart(8, '0')}`;
                  const pdfFile = new File([blob], `guia-remision-remitente-${fileName}.pdf`, {
                    type: 'application/pdf'
                  });
                  
                  await remissionGuidesSenderService.uploadRemissionGuidePDF(guide.id, pdfFile, 'a4');
                } catch (uploadError) {
                  console.warn(`Error al subir PDF de guía ${guide.id}:`, uploadError);
                }
              }

              // Descargar
              const fileName = `${guide.series}-${guide.number.toString().padStart(8, '0')}`;
              pdf.save(`guia-remision-remitente-${fileName}.pdf`);
            } catch (err) {
              console.error('Error generando PDF para descarga masiva:', err);
            }
          })();
        }, i * 300); // 300ms delay between downloads
      }
      
      toast.success(`${guidesData.length} PDFs del remitente programados para descarga`);
    } catch (error) {
      console.error('Error downloading multiple sender PDFs:', error);
      toast.error('Error al descargar los PDFs del remitente');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Previsualiza un PDF en nueva ventana y opcionalmente lo sube al backend
   */
  const previewSinglePDF = async (
    guideData: RemissionGuideRemitente,
    uploadToBackend: boolean = true
  ): Promise<void> => {
    setIsGenerating(true);
    try {
      const convertedGuide = convertSenderGuideToAutoGenerate(guideData);
      if (!convertedGuide) {
        toast.error('Error al procesar los datos de la guía del remitente');
        return;
      }

      const { blob } = await generateRemissionGuidePDF(convertedGuide, 'remitente');

      // Subir al backend si se solicita
      if (uploadToBackend) {
        try {
          const fileName = `${guideData.series}-${guideData.number.toString().padStart(8, '0')}`;
          const pdfFile = new File([blob], `guia-remision-remitente-${fileName}.pdf`, {
            type: 'application/pdf'
          });
          
          await remissionGuidesSenderService.uploadRemissionGuidePDF(guideData.id, pdfFile, 'a4');
          toast.success('PDF generado y subido al sistema');
        } catch (uploadError) {
          console.warn('Error al subir PDF automáticamente:', uploadError);
          toast.success('PDF generado (error al subir al sistema)');
        }
      } else {
        toast.success(`PDF generado: ${convertedGuide.document_number}`);
      }

      // Abrir en nueva ventana
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error('Error previewing remission guide sender PDF:', error);
      toast.error('Error al previsualizar el PDF del remitente');
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    generateSinglePDF,
    generateMultiplePDFs,
    downloadSinglePDF,
    downloadMultiplePDFs,
    previewSinglePDF
  };
};