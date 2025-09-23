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
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mr-4">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-900">
              ¡Guías Generadas Exitosamente!
            </h3>
            <p className="text-green-700 mt-1">
              Se generaron {generationResult.guides_generated.length} guías de remisión para el viaje "{generationResult.trip_name}"
            </p>
          </div>
        </div>
      </div>

      {/* Información del resultado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="border-b border-gray-200 px-6 py-4">
          <h4 className="font-semibold text-gray-900">Resumen de Generación</h4>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {generationResult.guides_generated.length}
              </div>
              <div className="text-sm text-blue-800">Guías Generadas</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {generationResult.destinations_processed}
              </div>
              <div className="text-sm text-green-800">Destinos Procesados</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {generationResult.total_packages}
              </div>
              <div className="text-sm text-purple-800">Total Paquetes</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {generationResult.total_weight} kg
              </div>
              <div className="text-sm text-orange-800">Peso Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Opciones de PDF */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="border-b border-gray-200 px-6 py-4">
          <h4 className="font-semibold text-gray-900">Descargar PDFs de Guías</h4>
          <p className="text-sm text-gray-600 mt-1">
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
            <div className="border-t border-gray-200 pt-6">
              <h5 className="font-medium text-gray-900 mb-4">Guías Individuales</h5>
              <div className="space-y-3">
                {generationResult.guides_generated.map((guide) => (
                  <div key={guide.guide_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">
                        Guía #{guide.document_number}
                      </div>
                      <div className="text-sm text-gray-600">
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
      <div className="mt-8 text-center text-sm text-gray-500">
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