import React from 'react';
import { TruckIcon, UserIcon } from '@heroicons/react/24/outline';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';

interface TypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'transportista' | 'remitente') => void;
}

export const TypeSelectionModal: React.FC<TypeSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Seleccionar Tipo de Guía de Remisión"
      maxWidth="2xl"
    >
      <div className="space-y-8">
        <p className="text-dm-text-secondary text-center text-lg">
          Elija el tipo de guía de remisión que desea crear
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Opción Transportista */}
          <div
            className="border-2 border-dm-border-primary rounded-2xl p-8 hover:border-blue-400 hover:shadow-lg transition-all duration-200 cursor-pointer bg-dm-bg-primary"
            onClick={() => onSelectType('transportista')}
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                <TruckIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-dm-text-primary">
                  Guía del Transportista
                </h3>
                <p className="text-dm-text-secondary text-base leading-relaxed">
                  Para transportar mercancías de encomiendas existentes. Los productos se cargan desde las encomiendas registradas.
                </p>
              </div>
              
              <Button
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base"
                onClick={() => onSelectType('transportista')}
              >
                Seleccionar Transportista
              </Button>
            </div>
          </div>

          {/* Opción Remitente */}
          <div
            className="border-2 border-dm-border-primary rounded-2xl p-8 hover:border-green-400 hover:shadow-lg transition-all duration-200 cursor-pointer bg-dm-bg-primary"
            onClick={() => onSelectType('remitente')}
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full">
                <UserIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-dm-text-primary">
                  Guía del Remitente
                </h3>
                <p className="text-dm-text-secondary text-base leading-relaxed">
                  Para remitir productos directamente. Los productos se agregan manualmente al formulario.
                </p>
              </div>
              
              <Button
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold text-base"
                onClick={() => onSelectType('remitente')}
              >
                Seleccionar Remitente
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-6 border-t border-dm-border-primary">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-8 py-2"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
};