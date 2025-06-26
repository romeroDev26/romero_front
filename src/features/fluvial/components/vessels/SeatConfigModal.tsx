// src/features/fluvial/components/vessels/SeatConfigModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/common/Button';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAddSeatConfiguration, useDeleteSeatConfiguration } from '../../hooks/useVesselsData';
import { useSeatTypes } from '../../hooks/useSeatTypesData';
import { VesselWithConfigurations, SeatConfigurationCreateData, vesselValidations } from '../../../../services/vessels.service';
import { toast } from 'react-toastify';

interface SeatConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  vessel?: VesselWithConfigurations;
}

export const SeatConfigModal: React.FC<SeatConfigModalProps> = ({ isOpen, onClose, vessel }) => {
  const addConfigsMutation = useAddSeatConfiguration();
  const deleteConfigMutation = useDeleteSeatConfiguration();
  const { data: seatTypes = [], isLoading: isLoadingSeatTypes } = useSeatTypes();
  
  const [configs, setConfigs] = useState<Partial<SeatConfigurationCreateData & { id?: number }>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && vessel) {
      // Si la embarcación tiene configuraciones, las usamos.
      // Si no, iniciamos con una fila vacía y el primer tipo de asiento disponible.
      const initialConfigs = vessel.seat_configurations?.length 
        ? [...vessel.seat_configurations] 
        : [{ seat_type_id: seatTypes[0]?.id || 0, total_seats: 0, deck_level: 1, notes: '' }];
      setConfigs(initialConfigs);
      setErrors([]);
    }
  }, [vessel, isOpen, seatTypes]);

  const handleAddRow = () => {
    setConfigs(prev => [...prev, { seat_type_id: seatTypes[0]?.id || 0, total_seats: 0, deck_level: 1, notes: '' }]);
  };

  const handleRemoveRow = async (index: number, configId?: number) => {
    if (configId) {
      if (window.confirm('¿Está seguro de eliminar esta configuración guardada?')) {
        try {
          await deleteConfigMutation.mutateAsync(configId);
          setConfigs(prev => prev.filter(c => c.id !== configId));
        } catch (error) { /* El hook ya muestra el toast */ }
      }
    } else {
      setConfigs(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleChange = (index: number, field: keyof SeatConfigurationCreateData, value: string) => {
    const newConfigs = [...configs];
    const parsedValue = (field === 'total_seats' || field === 'deck_level' || field === 'seat_type_id') ? parseInt(value) || 0 : value;
    newConfigs[index] = { ...newConfigs[index], [field]: parsedValue };
    setConfigs(newConfigs);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vessel) return;

    const configsToSave = configs.filter(c => c.total_seats && c.total_seats > 0 && c.seat_type_id) as SeatConfigurationCreateData[];
    
    if (configsToSave.length === 0) {
      toast.warn("No hay configuraciones válidas para guardar.");
      return;
    }

    const validationErrors = vesselValidations.validateSeatConfiguration(configsToSave, vessel.capacity_passengers);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await addConfigsMutation.mutateAsync({ vesselId: vessel.id, configs: configsToSave });
      onClose();
    } catch (error) {
       console.error('Failed to save seat configurations:', error);
    }
  };

  if (!vessel) return null;

  const totalConfigured = configs.reduce((sum, config) => sum + (config.total_seats || 0), 0);
  const maxPassengers = vessel.capacity_passengers || 0;

  return (
    // ===================================================================
    //  CAMBIO 1: Aumentar el ancho del modal
    // ===================================================================
    <Modal isOpen={isOpen} onClose={onClose} title={`Configurar Asientos: ${vessel.name}`} maxWidth="2xl"> 
      <form onSubmit={handleSubmit} className="p-6">
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
            <ul className="list-disc list-inside text-sm">
              {errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        {/* Contenedor de las filas de configuración */}
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
          {configs.map((config, index) => (
            // ===================================================================
            //  CAMBIO 2: Ajustar la grilla y los estilos
            // ===================================================================
            <div key={config.id || index} className="p-4 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-12 gap-x-4 items-end">
                {/* Tipo de Asiento */}
                <div className="col-span-12 sm:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Asiento</label>
                  <select
                    value={config.seat_type_id || ''}
                    onChange={(e) => handleChange(index, 'seat_type_id', e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoadingSeatTypes}
                  >
                    <option value="" disabled>Seleccionar...</option>
                    {seatTypes.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                  </select>
                </div>
                {/* Cantidad */}
                <div className="col-span-6 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                  <input
                    type="number"
                    value={config.total_seats || ''}
                    onChange={(e) => handleChange(index, 'total_seats', e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>
                {/* Cubierta */}
                <div className="col-span-6 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cubierta</label>
                  <input
                    type="number"
                    value={config.deck_level || ''}
                    onChange={(e) => handleChange(index, 'deck_level', e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                  />
                </div>
                {/* Notas */}
                <div className="col-span-12 sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <input
                    type="text"
                    value={config.notes || ''}
                    onChange={(e) => handleChange(index, 'notes', e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Opcional"
                  />
                </div>
                {/* Botón de eliminar */}
                <div className="col-span-12 sm:col-span-1 flex justify-end">
                   <Button
                      type="button"
                      variant="outline"
                      className="!p-2.5 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleRemoveRow(index, config.id)}
                      disabled={configs.length === 1 && !config.id}
                      title="Eliminar fila"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Barra de Totales */}
        <div className="mt-4 p-3 rounded-lg text-center"
             style={{ backgroundColor: totalConfigured > maxPassengers ? '#FEF2F2' : '#EFF6FF', color: totalConfigured > maxPassengers ? '#DC2626' : '#1E40AF' }}>
          <p className="text-sm font-semibold">
            Total Configurado: <strong className="text-lg">{totalConfigured}</strong> / Capacidad Máxima: <strong className="text-lg">{maxPassengers}</strong>
          </p>
          {totalConfigured > maxPassengers && <p className="text-xs mt-1">¡La configuración excede la capacidad máxima de la embarcación!</p>}
        </div>

        {/* Botones de acción del formulario */}
        <div className="mt-6 flex justify-between items-center border-t border-gray-200 pt-5">
          <Button type="button" variant="outline" onClick={handleAddRow}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Añadir Fila
          </Button>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" isLoading={addConfigsMutation.isPending}>Guardar Cambios</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};