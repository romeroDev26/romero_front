import React, { useState, useEffect } from 'react';
import { toast } from '@/utils/sileo-toast';
import { 
  DocumentTextIcon, 
  UsersIcon, 
  CubeIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { Modal } from '../../../../components/common/Modal';
import { manifestService } from '../../../manifests/services/manifest.service';
import { UnifiedTripViewItem } from '../../hooks/useTripsView';

interface ManifestGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: UnifiedTripViewItem;
  onManifestGenerated?: () => void;
  onManifestCreated?: (manifestData: any, tripInfo: any) => void;
}

export const ManifestGenerationModal: React.FC<ManifestGenerationModalProps> = ({
  isOpen,
  onClose,
  trip,
  onManifestGenerated,
  onManifestCreated
}) => {
  const [selectedType, setSelectedType] = useState<'PASSENGER' | 'CARGO'>('PASSENGER');
  const [observations, setObservations] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [cargoValidationStatus, setCargoValidationStatus] = useState<{
    isValidated: boolean;
    canGenerate: boolean;
    message: string;
    itemCount?: number;
  }>({
    isValidated: false,
    canGenerate: true,
    message: ''
  });

  // Efecto para validar la disponibilidad de carga cuando se selecciona el tipo CARGO
  useEffect(() => {
    // Solo validar si el modal está abierto, es tipo CARGO, y no se ha validado previamente
    if (isOpen && selectedType === 'CARGO' && !cargoValidationStatus.isValidated && !isGenerating) {
      const validateCargo = async () => {
        try {
          const result = await validateCargoManifest();
          setCargoValidationStatus({
            isValidated: true,
            canGenerate: result.canGenerate,
            message: result.message,
            itemCount: result.itemCount
          });
        } catch {
          console.warn('Error en validación inicial, usando valores por defecto');
          // En caso de error en la validación, asumir que se puede generar
          // El error real se manejará al intentar crear el manifiesto
        }
      };

      // Agregar un pequeño delay para evitar llamadas inmediatas
      const timeoutId = setTimeout(validateCargo, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, selectedType, isGenerating]);

  // Función para validar si se puede generar manifiesto de carga
  const validateCargoManifest = async (): Promise<{ canGenerate: boolean; message: string; itemCount?: number }> => {
    try {
      return await manifestService.validateCargoManifest(trip.trip_id);
    } catch (error: any) {
      console.error('Error en validación de manifiesto de carga:', error);
      return { 
        canGenerate: false, 
        message: 'Error al validar los datos de carga para este viaje' 
      };
    }
  };

  const handleGenerate = async () => {
    // Validación previa opcional para manifiesto de carga
    // Solo bloquear si estamos seguros de que no hay datos
    if (selectedType === 'CARGO' && cargoValidationStatus.isValidated && !cargoValidationStatus.canGenerate) {
      // Solo mostrar error si la validación fue concluyente
      toast.error(cargoValidationStatus.message);
      return;
    }

    setIsGenerating(true);
    try {
      const result = await manifestService.createOrRegenerateManifest({
        trip_id: trip.trip_id,
        manifest_type: selectedType,
        observations: observations.trim() || undefined
      });
      const actionMessage = result.isRegeneration ? 'regenerado' : 'generado';
      toast.success(`Manifiesto ${selectedType === 'PASSENGER' ? 'de Pasajeros' : 'de Carga'} ${actionMessage} exitosamente`);
      onManifestCreated?.(result.data, selectedType);
      if (onManifestGenerated) {
        onManifestGenerated();
      }
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error al generar manifiesto:', error);
      
      // Manejo específico para diferentes tipos de error
      if (error.response?.status === 403) {
        // Error 403 - Sin permisos
        const errorMessage = error.response.data?.detail || 'No tienes permisos para generar manifiestos';
        toast.error(errorMessage);
      } else if (error.response?.status === 401) {
        // Error 401 puede indicar falta de datos en lugar de problema de autenticación
        if (selectedType === 'CARGO') {
          toast.error('No se puede generar el manifiesto de carga: no hay carga registrada para este viaje');
        } else {
          toast.error('No se puede generar el manifiesto de pasajeros: no hay pasajeros registrados para este viaje');
        }
      } else if (error.response?.status === 400 || error.response?.status === 422) {
        // Errores de validación o datos insuficientes
        const errorMessage = error.response.data?.message || error.response.data?.detail;
        toast.error(errorMessage || `No hay datos suficientes para generar el manifiesto de ${selectedType === 'CARGO' ? 'carga' : 'pasajeros'}`);
      } else {
        // Otros errores
        toast.error(error.message || 'Error al generar el manifiesto');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setSelectedType('PASSENGER');
    setObservations('');
    setCargoValidationStatus({
      isValidated: false,
      canGenerate: true,
      message: ''
    });
  };

  const handleTypeChange = (newType: 'PASSENGER' | 'CARGO') => {
    setSelectedType(newType);
    // Reset validation status when changing type
    setCargoValidationStatus({
      isValidated: false,
      canGenerate: true,
      message: ''
    });
  };

  const handleClose = () => {
    if (!isGenerating) {
      resetForm();
      onClose();
    }
  };

  const getManifestTypeInfo = (type: 'PASSENGER' | 'CARGO') => {
    return type === 'PASSENGER' 
      ? {
          icon: UsersIcon,
          title: 'Manifiesto de Pasajeros',
          description: 'Genera un manifiesto con la lista oficial de todos los pasajeros del viaje, incluyendo sus datos personales y asientos asignados.',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-950/30',
          borderColor: 'border-blue-200 dark:border-blue-800/50',
          hoverColor: 'hover:bg-blue-100 dark:bg-blue-900/40'
        }
      : {
          icon: CubeIcon,
          title: 'Manifiesto de Carga',
          description: 'Genera un manifiesto con la lista oficial de toda la carga y encomiendas transportadas en el viaje.',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-950/30',
          borderColor: 'border-green-200 dark:border-green-800/50',
          hoverColor: 'hover:bg-green-100 dark:hover:bg-green-900/40'
        };
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" maxWidth="2xl">
      <div className="space-y-6">
        {/* Header personalizado */}
        <div className="flex items-center justify-between pb-4 border-b border-dm-border-primary">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
              <DocumentTextIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-dm-text-primary">
                Generar Manifiesto
              </h2>
              <p className="text-dm-text-secondary mt-1">
                {trip.vessel_name} - {new Date(trip.departure_datetime).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
          
          {!isGenerating && (
            <button
              onClick={handleClose}
              className="p-2 hover:bg-dm-bg-hover rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-dm-text-muted hover:text-dm-text-secondary" />
            </button>
          )}
        </div>

        {/* Información del viaje compacta */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-4 border border-blue-100 dark:border-blue-800/50">
          <div className="grid grid-cols-2 gap-6">
            {/* Columna izquierda */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-dm-text-secondary">Ruta:</span>
                <span className="text-sm font-medium text-dm-text-primary">
                  {trip.origin_port_name || 'N/A'} → {trip.destination_port_name || 'N/A'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-dm-text-secondary">Fecha:</span>
                <span className="text-sm font-medium text-dm-text-primary">
                  {new Date(trip.departure_datetime).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
            
            {/* Columna derecha */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium text-dm-text-secondary">Hora:</span>
                <span className="text-sm font-medium text-dm-text-primary">
                  {new Date(trip.departure_datetime).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-dm-text-secondary">Estado:</span>
                <span className="text-sm font-medium text-dm-text-primary">{trip.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selección de tipo de manifiesto más elegante */}
        <div>
          <h3 className="text-lg font-semibold text-dm-text-primary mb-4">Tipo de Manifiesto</h3>
          <div className="grid grid-cols-2 gap-6">
            {(['PASSENGER', 'CARGO'] as const).map((type) => {
              const info = getManifestTypeInfo(type);
              const Icon = info.icon;
              
              return (
                <div key={type} className="relative">
                  <input
                    type="radio"
                    id={`manifest-type-${type}`}
                    name="manifest_type"
                    value={type}
                    checked={selectedType === type}
                    onChange={(e) => handleTypeChange(e.target.value as 'PASSENGER' | 'CARGO')}
                    className="sr-only"
                    disabled={isGenerating}
                  />
                  <label
                    htmlFor={`manifest-type-${type}`}
                    className={`block cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 ${
                      selectedType === type
                        ? `${info.borderColor} ${info.bgColor} shadow-lg transform scale-105`
                        : `border-dm-border-primary bg-dm-bg-primary hover:border-dm-border-primary hover:shadow-md`
                    } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-center">
                      <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                        selectedType === type ? info.bgColor : 'bg-dm-bg-secondary'
                      }`}>
                        <Icon className={`w-8 h-8 ${
                          selectedType === type ? info.color : 'text-dm-text-muted'
                        }`} />
                      </div>
                      <h3 className={`text-lg font-semibold mb-2 ${
                        selectedType === type ? info.color : 'text-dm-text-secondary'
                      }`}>
                        {type === 'PASSENGER' ? 'Manifiesto de Pasajeros' : 'Manifiesto de Carga'}
                      </h3>
                      <p className="text-sm text-dm-text-secondary mb-2">
                        {type === 'PASSENGER' 
                          ? 'Lista oficial de pasajeros y asientos' 
                          : 'Lista oficial de carga y encomiendas'
                        }
                      </p>
                      
                      {/* Indicador de disponibilidad para carga */}
                      {type === 'CARGO' && cargoValidationStatus.isValidated && (
                        <div className={`flex items-center space-x-2 text-xs ${
                          cargoValidationStatus.canGenerate 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            cargoValidationStatus.canGenerate 
                              ? 'bg-green-400' 
                              : 'bg-red-400'
                          }`}></div>
                          <span>
                            {cargoValidationStatus.canGenerate 
                              ? (cargoValidationStatus.itemCount 
                                  ? `${cargoValidationStatus.itemCount} items de carga`
                                  : 'Carga disponible'
                                )
                              : 'No hay carga registrada'
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Observaciones más elegantes */}
        <div>
          <label className="block text-lg font-semibold text-dm-text-primary mb-4">
            Observaciones (Opcional)
          </label>
          <div className="relative">
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-2 border-dm-border-primary rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-dm-text-secondary placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Ingrese observaciones adicionales sobre el manifiesto..."
              disabled={isGenerating}
              maxLength={500}
            />
            <div className="absolute bottom-3 right-3 text-xs text-dm-text-muted">
              {observations.length}/500
            </div>
          </div>
        </div>

        {/* Botones de acción más elegantes */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-dm-border-primary">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isGenerating}
            className="px-8 py-3 text-base"
          >
            Cancelar
          </Button>
          
          <Button
            type="button"
            variant="primary"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-8 py-3 text-base min-w-[180px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            {isGenerating ? 'Generando...' : `Generar ${selectedType === 'PASSENGER' ? 'Pasajeros' : 'Carga'}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
