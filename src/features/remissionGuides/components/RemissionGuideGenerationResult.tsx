// src/features/remissionGuides/components/RemissionGuideGenerationResult.tsx

import React, { useState } from 'react';
import { 
  CheckCircleIcon, 
  DocumentArrowDownIcon, 
  EyeIcon 
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { useRemissionGuidePDFGeneration } from '../hooks/useRemissionGuidePDFGeneration';
import { AutoGenerateRemissionGuidesResponse } from '../../../types';

interface RemissionGuideGenerationResultProps {
  generationResult: AutoGenerateRemissionGuidesResponse;
  onClose?: () => void;
  onNavigateToList?: () => void;
}

export const RemissionGuideGenerationResult: React.FC<RemissionGuideGenerationResultProps> = ({
  generationResult,
  onClose,
  onNavigateToList
}) => {
  const [showPDFOptions, setShowPDFOptions] = useState(false);
  const { 
    isGenerating,
    previewMultiplePDFs,
    downloadMultiplePDFs,
    previewSinglePDF,
    downloadSinglePDF 
  } = useRemissionGuidePDFGeneration();

  const handlePreviewAllPDFs = async () => {
    if (generationResult.guides_generated.length > 0) {
      await previewMultiplePDFs(generationResult.guides_generated);
    }
  };

  const handleDownloadAllPDFs = async () => {
    if (generationResult.guides_generated.length > 0) {
      await downloadMultiplePDFs(generationResult.guides_generated);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header de éxito */}
      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 rounded-xl p-6 mb-8">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full mr-4">
            <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-900">
              ¡Guías Generadas Exitosamente!
            </h3>
            <p className="text-green-700 dark:text-green-300 mt-1">
              Se generaron {generationResult.guides_generated.length} guías de remisión para el viaje "{generationResult.trip_name}"
            </p>
          </div>
        </div>
      </div>

      {/* Información del resultado */}
      <div className="bg-dm-bg-primary rounded-xl shadow-sm border border-dm-border-primary mb-8">
        <div className="border-b border-dm-border-primary px-6 py-4">
          <h4 className="font-semibold text-dm-text-primary">Resumen de Generación</h4>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {generationResult.guides_generated.length}
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-300">Guías Generadas</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {generationResult.destinations_processed}
              </div>
              <div className="text-sm text-green-800 dark:text-green-300">Destinos Procesados</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {generationResult.total_packages}
              </div>
              <div className="text-sm text-purple-800">Total Paquetes</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {generationResult.total_weight} kg
              </div>
              <div className="text-sm text-orange-800 dark:text-orange-300">Peso Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Opciones de PDF */}
      <div className="bg-dm-bg-primary rounded-xl shadow-sm border border-dm-border-primary mb-8">
        <div className="border-b border-dm-border-primary px-6 py-4">
          <h4 className="font-semibold text-dm-text-primary">Descargar PDFs de Guías</h4>
          <p className="text-sm text-dm-text-secondary mt-1">
            Genere e imprima los PDFs A4 de todas las guías de remisión creadas
          </p>
        </div>
        <div className="p-6">
          {/* Botones de acción global */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Button
              onClick={handlePreviewAllPDFs}
              disabled={isGenerating}
              className="flex items-center"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generando...' : `Vista Previa Todos (${generationResult.guides_generated.length})`}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDownloadAllPDFs}
              disabled={isGenerating}
              className="flex items-center"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Descargar Todos los PDFs
            </Button>

            <Button
              variant="secondary"
              onClick={() => setShowPDFOptions(!showPDFOptions)}
            >
              {showPDFOptions ? 'Ocultar' : 'Mostrar'} Opciones Individuales
            </Button>
          </div>

          {/* Opciones individuales */}
          {showPDFOptions && (
            <div className="border-t border-dm-border-primary pt-6">
              <h5 className="font-medium text-dm-text-primary mb-4">Guías Individuales</h5>
              <div className="space-y-3">
                {generationResult.guides_generated.map((guide) => (
                  <div key={guide.guide_id} className="flex items-center justify-between p-4 bg-dm-bg-secondary rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-dm-text-primary">
                        Guía #{guide.document_number}
                      </div>
                      <div className="text-sm text-dm-text-secondary">
                        Destino: {guide.destination_port_name} | 
                        Destinatario: {guide.recipient_name} |
                        {guide.package_items.length} paquete(s)
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => previewSinglePDF(guide)}
                        disabled={isGenerating}
                        className="flex items-center"
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => downloadSinglePDF(guide)}
                        disabled={isGenerating}
                        className="flex items-center"
                      >
                        <DocumentArrowDownIcon className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Acciones finales */}
      <div className="flex justify-center space-x-4">
        <Button
          variant="outline"
          onClick={onNavigateToList}
          className="px-6"
        >
          Ver Lista de Guías
        </Button>
        
        {onClose && (
          <Button
            variant="secondary"
            onClick={onClose}
            className="px-6"
          >
            Cerrar
          </Button>
        )}
      </div>

      {/* Información adicional */}
      <div className="mt-8 text-center text-sm text-dm-text-muted">
        <p>
          Generado el {new Date(generationResult.generated_at).toLocaleString('es-PE')}
        </p>
        <p className="mt-1">
          Los PDFs seguirán el formato oficial de guías de remisión de transportista
        </p>
      </div>
    </div>
  );
};