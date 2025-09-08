// src/features/fluvial/components/sales-point/components/PrintOptionsModal.tsx

import React, { useState } from 'react';
import { Modal } from '../../../../../components/common/Modal';
import { Button } from '../../../../../components/common/Button';
import { 
  DocumentArrowDownIcon, 
  EyeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

export interface PrintOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreview: () => void;
  onDownloadA4: () => void;
  onDownloadTicket: () => void;
  invoiceNumber: string;
  documentType: string;
  isProcessing?: boolean;
}

export const PrintOptionsModal: React.FC<PrintOptionsModalProps> = ({
  isOpen,
  onClose,
  onPreview,
  onDownloadA4,
  onDownloadTicket,
  invoiceNumber,
  documentType,
  isProcessing = false
}) => {
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  const handleActionSelect = (action: string) => {
    setSelectedActions(prev => 
      prev.includes(action) 
        ? prev.filter(a => a !== action)
        : [...prev, action]
    );
  };

  const executeSelectedActions = () => {
    if (selectedActions.length === 0) {
      toast.warning('Seleccione al menos una acción');
      return;
    }

    selectedActions.forEach(action => {
      switch (action) {
        case 'preview':
          onPreview();
          break;
        case 'download-a4':
          onDownloadA4();
          break;
        case 'download-ticket':
          onDownloadTicket();
          break;
      }
    });

    toast.success(`Ejecutando ${selectedActions.length} acción(es)`);
    onClose();
  };

  const actionOptions = [
    {
      id: 'preview',
      label: 'Vista Previa',
      description: 'Ver comprobantes antes de descargar',
      icon: EyeIcon,
      color: 'bg-blue-50 border-blue-200 text-blue-700',
      recommended: true
    },
    {
      id: 'download-a4',
      label: 'Descargar A4',
      description: 'Guardar PDF en formato A4',
      icon: DocumentArrowDownIcon,
      color: 'bg-green-50 border-green-200 text-green-700',
      recommended: true
    },
    {
      id: 'download-ticket',
      label: 'Descargar Ticket',
      description: 'Guardar PDF en formato ticket',
      icon: DocumentArrowDownIcon,
      color: 'bg-gray-50 border-gray-200 text-gray-700',
      recommended: false
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="¿Qué desea hacer con el comprobante?"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Success message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h3 className="font-semibold text-green-800">
                ¡Venta procesada exitosamente!
              </h3>
              <p className="text-green-700 text-sm">
                {documentType}: {invoiceNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Action options */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Seleccione las acciones que desea realizar:</h4>
          
          <div className="grid gap-3">
            {actionOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedActions.includes(option.id);
              
              return (
                <div
                  key={option.id}
                  className={`
                    relative border-2 rounded-lg p-4 cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  onClick={() => handleActionSelect(option.id)}
                >
                  <div className="flex items-center">
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-lg mr-4
                      ${isSelected ? 'bg-blue-100 text-blue-600' : option.color}
                    `}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h5 className="font-medium text-gray-900">
                          {option.label}
                        </h5>
                        {option.recommended && (
                          <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Recomendado
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {option.description}
                      </p>
                    </div>
                    
                    {isSelected && (
                      <CheckCircleIcon className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-3">Acciones rápidas:</h5>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedActions(['preview', 'download-a4'])}
            >
              Vista previa + Descargar A4
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedActions(['download-a4', 'download-ticket'])}
            >
              Descargar ambos formatos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedActions(['preview'])}
            >
              Solo vista previa
            </Button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            {selectedActions.length > 0 ? 
              `${selectedActions.length} acción(es) seleccionada(s)` :
              'Ninguna acción seleccionada'
            }
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cerrar
            </Button>
            
            <Button
              variant="primary"
              onClick={executeSelectedActions}
              disabled={selectedActions.length === 0 || isProcessing}
              isLoading={isProcessing}
            >
              Ejecutar Acciones
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
