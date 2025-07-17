import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/common/Button';
import { TrashIcon, PlusIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useAddSeatConfiguration, useDeleteSeatConfiguration, useUpdateVessel } from '../../hooks/useVesselsData';
import { useSeatTypes } from '../../hooks/useSeatTypesData';
import { VesselWithConfigurations, SeatConfigurationCreateData, vesselValidations } from '../../../../services/vessels.service';
import { toast } from 'react-toastify';
import { Input } from '../../../../components/common/Input';

interface ConfigRowState {
  id?: number;
  seat_type_id: number;
  total_seats: number;
  deck_level: number;
  notes?: string;
  total_rows?: number;
  total_columns?: number;
}

interface SeatConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  vessel?: VesselWithConfigurations;
}

export const SeatConfigModal: React.FC<SeatConfigModalProps> = ({ isOpen, onClose, vessel }) => {
  const addConfigsMutation = useAddSeatConfiguration();
  const deleteConfigMutation = useDeleteSeatConfiguration();
  const updateVesselMutation = useUpdateVessel();
  const { data: seatTypes = [], isLoading: isLoadingSeatTypes } = useSeatTypes();

  const [configs, setConfigs] = useState<ConfigRowState[]>([]);
  const [globalColumns, setGlobalColumns] = useState(4);
  const [errors, setErrors] = useState<string[]>([]);

  const recalculateDistribution = (prevConfigs: ConfigRowState[], columns: number): ConfigRowState[] => {
    if (columns <= 0) return prevConfigs.map(c => ({ ...c, total_rows: 0 }));
    return prevConfigs.map(config => ({
      ...config,
      total_columns: columns,
      total_rows: Math.ceil((config.total_seats || 0) / columns),
    }));
  };

  const getEmptyRow = (level: number = 1): ConfigRowState => ({
    seat_type_id: seatTypes[0]?.id || 0,
    total_seats: 0,
    deck_level: level,
    notes: '',
    total_columns: globalColumns,
    total_rows: 0,
  });

  useEffect(() => {
    if (isOpen && vessel) {
      const vesselColumns = vessel.total_columns || 4;
      setGlobalColumns(vesselColumns);

      const initialConfigs = vessel.seat_configurations?.length
        ? vessel.seat_configurations.map(c => ({ ...c }))
        : [getEmptyRow()];

      setConfigs(recalculateDistribution(initialConfigs, vesselColumns));
      setErrors([]);
    }
  }, [vessel, isOpen, seatTypes]);

  const handleGlobalColumnsChange = (value: string) => {
    const newColumns = parseInt(value) || 0;
    setGlobalColumns(newColumns);
    setConfigs(prev => recalculateDistribution(prev, newColumns));
  };

  const handleAddRow = () => {
    setConfigs(prev => {
      const lastConfig = prev[prev.length - 1];
      const newLevel = lastConfig ? (lastConfig.deck_level || 0) + 1 : 1;
      return [...prev, getEmptyRow(newLevel)];
    });
  };

  const handleRemoveRow = async (index: number, configId?: number) => {
    if (configId) {
      if (window.confirm('¿Está seguro de eliminar esta configuración guardada?')) {
        await deleteConfigMutation.mutateAsync(configId);
      }
    } else {
      setConfigs(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleChange = (index: number, field: keyof ConfigRowState, value: string) => {
    const newConfigs = [...configs];
    let parsedValue = field !== 'notes' ? parseInt(value) || 0 : value;
    newConfigs[index] = { ...newConfigs[index], [field]: parsedValue };
    if (field === 'total_seats' && globalColumns > 0) {
      const seats = typeof parsedValue === 'number' ? parsedValue : parseInt(parsedValue) || 0;
      newConfigs[index].total_rows = Math.ceil(seats / globalColumns);
      newConfigs[index].total_columns = globalColumns;
    }
    setConfigs(newConfigs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vessel) return;

    if (vessel.total_columns !== globalColumns) {
      await updateVesselMutation.mutateAsync({ id: vessel.id, data: { total_columns: globalColumns } });
    }

    const configsToSave: SeatConfigurationCreateData[] = configs
      .filter(c => !c.id && c.total_seats && c.total_seats > 0 && c.seat_type_id)
      .map(c => ({
        seat_type_id: c.seat_type_id,
        total_seats: c.total_seats,
        total_rows: c.total_rows!,
        total_columns: globalColumns,
        deck_level: c.deck_level,
        notes: c.notes,
      }));

    if (configsToSave.length === 0) {
      toast.info("No hay nuevas configuraciones para guardar.");
      if (!deleteConfigMutation.isPending) onClose();
      return;
    }

    const allConfigsForValidation = configs.map(c => ({
      seat_type_id: c.seat_type_id ?? 0,
      total_seats: c.total_seats ?? 0,
      total_rows: c.total_rows ?? 0,
      total_columns: c.total_columns ?? 0,
      deck_level: c.deck_level ?? 1,
      notes: c.notes ?? '',
    }));

    const validationErrors = vesselValidations.validateSeatConfiguration(allConfigsForValidation, vessel.capacity_passengers);
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
    <Modal isOpen={isOpen} onClose={onClose} title={`Configurar Asientos: ${vessel.name}`} maxWidth="2xl">
      <form onSubmit={handleSubmit} className="p-6 flex flex-col" style={{ height: '85vh' }}>
        <p className="text-sm text-gray-500 mb-4">Define la distribución para cada tipo de asiento. Para modificar una configuración existente, bórrela y añádala de nuevo.</p>
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <Input
            label="Número Total de Columnas en la Embarcación"
            type="number"
            value={globalColumns}
            onChange={(e) => handleGlobalColumnsChange(e.target.value)}
            min="1"
            required
          />
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <InformationCircleIcon className="h-4 w-4"/>
            Este valor define el "ancho" de la embarcación y se aplicará a todos los tipos de asiento.
          </p>
        </div>
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
            <ul className="list-disc list-inside text-sm">
              {errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}
        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
          {configs.map((config, index) => (
            <div key={config.id || index} className="p-4 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-12 gap-x-4 gap-y-3 items-end">
                <div className="col-span-12 md:col-span-4">
                  <label className="block text-sm font-medium">Tipo de Asiento</label>
                  <select
                    value={config.seat_type_id || ''}
                    onChange={(e) => handleChange(index, 'seat_type_id', e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md text-sm"
                    disabled={isLoadingSeatTypes || !!config.id}
                  >
                    <option value="" disabled>Seleccionar...</option>
                    {seatTypes.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                  </select>
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-sm font-medium">Cantidad</label>
                  <input
                    type="number"
                    value={config.total_seats || ''}
                    onChange={(e) => handleChange(index, 'total_seats', e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md text-sm"
                    min="1"
                    disabled={!!config.id}
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-sm font-medium">Filas (auto)</label>
                  <input
                    type="text"
                    value={config.total_rows || 0}
                    disabled
                    className="w-full mt-1 p-2 border-gray-200 bg-gray-100 rounded-md text-sm text-center"
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className="block text-sm font-medium">Nivel</label>
                  <input
                    type="number"
                    value={config.deck_level || ''}
                    onChange={(e) => handleChange(index, 'deck_level', e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md text-sm"
                    min="1"
                    disabled={!!config.id}
                  />
                </div>
                <div className="col-span-1 md:col-span-2 flex justify-center md:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="!p-2.5 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleRemoveRow(index, config.id)}
                    title="Eliminar"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </Button>
                </div>
                <div className="col-span-12 mt-2">
                  <label className="block text-sm font-medium">Notas</label>
                  <input
                    type="text"
                    value={config.notes || ''}
                    onChange={(e) => handleChange(index, 'notes', e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md text-sm"
                    placeholder="Ej: Lado ventana, cerca a salida, etc."
                    disabled={!!config.id}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg text-center" style={{ backgroundColor: totalConfigured > maxPassengers ? '#FEF2F2' : '#EFF6FF', color: totalConfigured > maxPassengers ? '#DC2626' : '#1E40AF' }}>
          <p className="text-sm font-semibold">
            Total Configurado: <strong className="text-lg">{totalConfigured}</strong> / Capacidad Máxima: <strong className="text-lg">{maxPassengers}</strong>
          </p>
        </div>
        <div className="mt-6 flex justify-between items-center border-t pt-5">
          <Button type="button" variant="outline" onClick={handleAddRow}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Añadir Tipo de Asiento
          </Button>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" isLoading={addConfigsMutation.isPending || deleteConfigMutation.isPending}>Guardar Cambios</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
