import { useState } from 'react';
import { toast } from '@/utils/sileo-toast';
import { manifestService } from '../services/manifest.service';
import { Manifest } from '../types/manifest.types';
import { generatePassengerManifestPDF } from '../services/manifestPdfGeneration.service';

interface GenerateOptions {
  upload?: boolean;
}

export const useManifestPDFGeneration = () => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generatePDFBlob = async (manifestData: Manifest): Promise<Blob> => {
    const { blob } = await generatePassengerManifestPDF(manifestData);
    return blob;
  };

  const generatePreview = async (
    manifestData: Manifest,
    options: GenerateOptions = { upload: true }
  ): Promise<string> => {
    setIsGeneratingPDF(true);

    try {
      const blob = await generatePDFBlob(manifestData);
      const url = URL.createObjectURL(blob);

      if (options.upload !== false) {
        try {
          const file = new File([blob], `manifiesto-${manifestData.id}.pdf`, {
            type: 'application/pdf',
          });
          await manifestService.uploadManifestPDF(manifestData.id, file, 'a4');
        } catch (uploadError) {
          console.warn('No se pudo subir PDF automáticamente:', uploadError);
        }
      }

      return url;
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      toast.error('Error al generar la previsualización del PDF');
      throw error;
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const downloadPDF = async (manifestData: Manifest): Promise<void> => {
    try {
      const blob = await generatePDFBlob(manifestData);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `manifiesto-${manifestData.manifest_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Error al descargar el PDF');
    }
  };

  return {
    isGeneratingPDF,
    generatePDFBlob,
    generatePreview,
    downloadPDF,
  };
};
