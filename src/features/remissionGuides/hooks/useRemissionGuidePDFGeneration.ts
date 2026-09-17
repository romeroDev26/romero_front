// src/features/remissionGuides/hooks/useRemissionGuidePDFGeneration.ts

import { useState } from 'react';
import { toast } from '@/utils/sileo-toast';
import { generateRemissionGuidePDF } from '../components/pdf/RemissionGuidePDFGenerator';
import { AutoGenerateRemissionGuide } from '../../../types';
import type jsPDF from 'jspdf';

export interface RemissionGuidePDFResult {
  pdf: jsPDF;
  blob: Blob;
}

export const useRemissionGuidePDFGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Genera PDF para una sola guía de remisión
   */
  const generateSinglePDF = async (
    guideData: AutoGenerateRemissionGuide
  ): Promise<RemissionGuidePDFResult | null> => {
    setIsGenerating(true);
    try {
      const result = await generateRemissionGuidePDF(guideData);
      toast.success(`PDF generado para guía ${guideData.document_number}`);
      return result;
    } catch (error) {
      console.error('Error generating remission guide PDF:', error);
      toast.error('Error al generar el PDF de la guía de remisión');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Genera PDFs para múltiples guías de remisión
   */
  const generateMultiplePDFs = async (
    guidesData: AutoGenerateRemissionGuide[]
  ): Promise<{ pdfs: jsPDF[]; blobs: Blob[] } | null> => {
    setIsGenerating(true);
    try {
      const pdfs: jsPDF[] = [];
      const blobs: Blob[] = [];
      // Generar en serie para controlar memoria y requests
      for (const guide of guidesData) {
         
        const res = await generateRemissionGuidePDF(guide);
        pdfs.push(res.pdf);
        blobs.push(res.blob);
      }
      toast.success(`${guidesData.length} PDFs generados exitosamente`);
      return { pdfs, blobs };
    } catch (error) {
      console.error('Error generating multiple remission guide PDFs:', error);
      toast.error('Error al generar los PDFs de las guías de remisión');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Descarga un PDF individual
   */
  const downloadSinglePDF = async (
    guideData: AutoGenerateRemissionGuide
  ): Promise<void> => {
    setIsGenerating(true);
    try {
      const { pdf } = await generateRemissionGuidePDF(guideData);
      pdf.save(`guia-remision-${guideData.document_number}.pdf`);
      toast.success(`PDF descargado: ${guideData.document_number}`);
    } catch (error) {
      console.error('Error downloading remission guide PDF:', error);
      toast.error('Error al descargar el PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Descarga múltiples PDFs
   */
  const downloadMultiplePDFs = async (
    guidesData: AutoGenerateRemissionGuide[]
  ): Promise<void> => {
    setIsGenerating(true);
    try {
      // Generar y descargar en serie para evitar bloqueos y uso excesivo de memoria
      for (let i = 0; i < guidesData.length; i++) {
        const guide = guidesData[i];
         
        const { pdf } = await generateRemissionGuidePDF(guide);
        // Programar el guardado con pequeño delay para no colapsar el navegador
        setTimeout(() => pdf.save(`guia-remision-${guide.document_number}.pdf`), i * 200);
      }
      
      toast.success(`${guidesData.length} PDFs programados para descarga`);
    } catch (error) {
      console.error('Error downloading multiple remission guide PDFs:', error);
      toast.error('Error al descargar los PDFs');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Abre vista previa de un PDF individual
   */
  const previewSinglePDF = async (
    guideData: AutoGenerateRemissionGuide
  ): Promise<void> => {
    setIsGenerating(true);
    try {
      const { blob } = await generateRemissionGuidePDF(guideData);
      if (!(blob instanceof Blob)) throw new Error('generateRemissionGuidePDF no devolvió un Blob válido');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      // Limpiar URL después de 10 segundos
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      
    } catch (error) {
      console.error('Error previewing remission guide PDF:', error);
      toast.error('Error al mostrar vista previa del PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Abre vista previa de múltiples PDFs
   */
  const previewMultiplePDFs = async (
    guidesData: AutoGenerateRemissionGuide[]
  ): Promise<void> => {
    setIsGenerating(true);
    try {
      // Generar cada PDF en serie y abrir su vista previa
      for (let i = 0; i < guidesData.length; i++) {
        const guide = guidesData[i];
         
        const { blob } = await generateRemissionGuidePDF(guide);
        if (!(blob instanceof Blob)) {
          console.warn(`Guía ${guide.guide_id} no generó un blob válido`);
          continue;
        }
        setTimeout(() => {
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => URL.revokeObjectURL(url), 10000);
        }, i * 300);
      }
      
    } catch (error) {
      console.error('Error previewing multiple remission guide PDFs:', error);
      toast.error('Error al mostrar vista previa de los PDFs');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Genera PDF y retorna como Blob para upload al servidor
   */
  const generatePDFBlob = async (
    guideData: AutoGenerateRemissionGuide
  ): Promise<Blob | null> => {
    try {
      const { blob } = await generateRemissionGuidePDF(guideData);
      if (!(blob instanceof Blob)) return null;
      return blob;
    } catch (error) {
      console.error('Error generating PDF blob:', error);
      return null;
    }
  };

  return {
    isGenerating,
    generateSinglePDF,
    generateMultiplePDFs,
    downloadSinglePDF,
    downloadMultiplePDFs,
    previewSinglePDF,
    previewMultiplePDFs,
    generatePDFBlob
  };
};