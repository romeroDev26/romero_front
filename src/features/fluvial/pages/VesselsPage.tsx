// src/features/fluvial/pages/VesselsPage.tsx
import React, { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, PresentationChartBarIcon, CogIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';
import { Spinner } from '../../../components/common/Spinner';
import { useConfirmDelete } from '../../../components/common/DataTable';
import { Vessel, VesselSeatConfiguration, SeatType } from '../../../types';
import {
  useVessels,
  useVessel,
  useCreateVessel,
  useUpdateVessel,
  useDeleteVessel,
  useAddSeatConfiguration
} from '../hooks/useVesselsData';
import { useSeatTypes } from '../hooks/useSeatTypesData';
import { 
  VesselCreateData, 
  SeatConfigurationCreateData,
  vesselHelpers,
  vesselValidations,
  VesselWithConfigurations
} from '../../../services/vessels.service';

// ========================================
// FORMULARIO PARA EMBARCACIONES
// ========================================
interface VesselFormProps {
  isOpen: boolean;
  onClose: () => void;
  vessel?: Vessel;
}

const VesselFormModal: React.FC<VesselFormProps> = ({ isOpen, onClose, vessel }) => {
  const createVessel = useCreateVessel();
  const updateVessel = useUpdateVessel();
  
  const [formData, setFormData] = useState<VesselCreateData>({
    registration_number: '',
    name: '',
    capacity_weight_kg: 0,
    capacity_packages: 0,
    capacity_passengers: 0,
    company_id: vesselHelpers.getCurrentCompanyId(), // AGREGADO
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (vessel) {
      setFormData({
        registration_number: vessel.registration_number,
        name: vessel.name,
        capacity_weight_kg: vessel.capacity_weight_kg || 0,
        capacity_packages: vessel.capacity_packages || 0,
        capacity_passengers: vessel.capacity_passengers || 0,
        company_id: vessel.company_id || vesselHelpers.getCurrentCompanyId(),
        is_active: vessel.is_active
      });
    } else {
      // Generar número de matrícula automático para nuevas embarcaciones
      setFormData({
        registration_number: vesselHelpers.generateRegistrationNumber(),
        name: '',
        capacity_weight_kg: 0,
        capacity_packages: 0,
        capacity_passengers: 0,
        company_id: vesselHelpers.getCurrentCompanyId(),
        is_active: true
      });
    }
    setErrors({});
  }, [vessel, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (!vesselValidations.validateRegistrationNumber(formData.registration_number)) {
      newErrors.registration_number = 'Formato inválido (XX-XXXXX-XX)';
    }
    
    const capacityErrors = vesselValidations.validateCapacities(formData);
    if (capacityErrors.length > 0) {
      capacityErrors.forEach((error, index) => {
        newErrors[`capacity_${index}`] = error;
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    console.log('Submitting vessel data:', formData);
    
    // Validar que company_id esté presente
    if (!formData.company_id) {
      console.error('company_id is missing!');
      setErrors({ ...errors, company_id: 'ID de compañía es requerido' });
      return;
    }

    try {
      if (vessel) {
        await updateVessel.mutateAsync({ id: vessel.id, data: formData });
      } else {
        await createVessel.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving vessel:', error);
      // Los errores ya se manejan en los hooks
    }
  };

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={vessel ? 'Editar Embarcación' : 'Nueva Embarcación'} 
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Número de Matrícula"
            value={formData.registration_number}
            onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
            error={errors.registration_number}
            placeholder="IQ-12345-AB"
            required
          />
          <Input
            label="Nombre de la Embarcación"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Capacidad de Peso (kg)"
            type="number"
            value={formData.capacity_weight_kg}
            onChange={(e) => setFormData({ ...formData, capacity_weight_kg: parseFloat(e.target.value) || 0 })}
            error={errors.capacity_0}
            min="0"
            required
          />
          <Input
            label="Capacidad de Bultos"
            type="number"
            value={formData.capacity_packages}
            onChange={(e) => setFormData({ ...formData, capacity_packages: parseInt(e.target.value) || 0 })}
            error={errors.capacity_1}
            min="0"
            required
          />
          <Input
            label="Capacidad de Pasajeros"
            type="number"
            value={formData.capacity_passengers}
            onChange={(e) => setFormData({ ...formData, capacity_passengers: parseInt(e.target.value) || 0 })}
            error={errors.capacity_2}
            min="0"
            required
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="mr-2"
            />
            Embarcación activa
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            isLoading={createVessel.isPending || updateVessel.isPending}
          >
            {vessel ? 'Actualizar' : 'Crear'} Embarcación
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ========================================
// FORMULARIO PARA CONFIGURACIÓN DE ASIENTOS
// ========================================
interface SeatConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  vessel?: VesselWithConfigurations;
}

const SeatConfigModal: React.FC<SeatConfigModalProps> = ({ isOpen, onClose, vessel }) => {
  const addSeatConfiguration = useAddSeatConfiguration();
  const { data: seatTypes = [] } = useSeatTypes();

  const [configs, setConfigs] = useState<SeatConfigurationCreateData[]>([
    { seat_type_id: 1, total_seats: 0, deck_level: 1, notes: '' }
  ]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (vessel?.seat_configurations && vessel.seat_configurations.length > 0) {
      setConfigs(
        vessel.seat_configurations.map(config => ({
          seat_type_id: config.seat_type_id,
          total_seats: config.total_seats,
          deck_level: config.deck_level || 1,
          notes: config.notes || ''
        }))
      );
    } else {
      setConfigs([{ seat_type_id: 1, total_seats: 0, deck_level: 1, notes: '' }]);
    }
    setErrors([]);
  }, [vessel, isOpen]);

  const addConfig = () => {
    setConfigs([...configs, { seat_type_id: 1, total_seats: 0, deck_level: 1, notes: '' }]);
  };

  const removeConfig = (index: number) => {
    setConfigs(configs.filter((_, i) => i !== index));
  };

  const updateConfig = (index: number, field: keyof SeatConfigurationCreateData, value: any) => {
    const newConfigs = [...configs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    setConfigs(newConfigs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vessel) return;
    
    const validationErrors = vesselValidations.validateSeatConfiguration(
      configs,
      vessel.capacity_passengers
    );
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await addSeatConfiguration.mutateAsync({ 
        vesselId: vessel.id, 
        configs 
      });
      onClose();
    } catch (error) {
      // Los errores ya se manejan en el hook
    }
  };

  if (!isOpen || !vessel) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Configuración de Asientos - ${vessel.name}`} 
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="p-6">
        {errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg">
            <h4 className="font-medium text-red-900 mb-2">Errores de validación:</h4>
            <ul className="list-disc list-inside text-sm text-red-700">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {configs.map((config, index) => (
            <div key={index} className="grid grid-cols-5 gap-4 items-end p-4 border border-gray-200 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Asiento</label>
                <select
                  value={config.seat_type_id}
                  onChange={(e) => updateConfig(index, 'seat_type_id', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  {seatTypes.map((seatType) => (
                    <option key={seatType.id} value={seatType.id}>
                      {seatType.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input
                  type="number"
                  value={config.total_seats}
                  onChange={(e) => updateConfig(index, 'total_seats', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cubierta</label>
                <input
                  type="number"
                  value={config.deck_level}
                  onChange={(e) => updateConfig(index, 'deck_level', parseInt(e.target.value) || 1)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <input
                  type="text"
                  value={config.notes}
                  onChange={(e) => updateConfig(index, 'notes', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Opcional"
                />
              </div>
              
              <div>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => removeConfig(index)}
                  disabled={configs.length === 1}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            Capacidad máxima: {vessel.capacity_passengers} pasajeros | 
            Total configurado: {configs.reduce((sum, c) => sum + c.total_seats, 0)} asientos
          </p>
        </div>

        <div className="flex justify-between items-center mt-4">
          <Button type="button" variant="outline" onClick={addConfig}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Agregar Configuración
          </Button>
          
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit"
              isLoading={addSeatConfiguration.isPending}
            >
              Guardar Configuración
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

// ========================================
// COMPONENTE PRINCIPAL
// ========================================
export const VesselsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  
  // Estados para modales
  const [showVesselModal, setShowVesselModal] = useState(false);
  const [showSeatConfigModal, setShowSeatConfigModal] = useState(false);
  const [editingVessel, setEditingVessel] = useState<Vessel | undefined>();
  const [configuringVesselId, setConfiguringVesselId] = useState<number | null>(null);

  // Queries y mutations
  const { data: vessels = [], isLoading: vesselsLoading, error: vesselsError } = useVessels(showOnlyActive);
  const { data: configuringVessel } = useVessel(configuringVesselId);
  const deleteVessel = useDeleteVessel();

  // Confirmación de eliminación
  const handleDeleteVessel = useConfirmDelete(
    (vessel: Vessel) => deleteVessel.mutate(vessel.id),
    (vessel: Vessel) => `¿Está seguro de desactivar la embarcación ${vessel.name}? Esta acción puede afectar viajes programados.`
  );

  // Filtrar embarcaciones según búsqueda
  const filteredVessels = vessels.filter(vessel =>
    vessel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vessel.registration_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener total de asientos para una embarcación
  const getTotalSeats = (vessel: any) => {
    return vesselHelpers.getTotalConfiguredSeats(vessel);
  };

  if (vesselsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (vesselsError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error al cargar las embarcaciones</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Embarcaciones</h1>
          <p className="text-gray-600">Administra la flota de embarcaciones del sistema fluvial</p>
        </div>
      </div>

      {/* Filtros y acciones */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4 items-center flex-grow">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              placeholder="Buscar embarcaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <label className="flex items-center whitespace-nowrap">
            <input
              type="checkbox"
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
              className="mr-2"
            />
            Solo activas
          </label>
        </div>
        
        <Button
          onClick={() => {
            setEditingVessel(undefined);
            setShowVesselModal(true);
          }}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Embarcación
        </Button>
      </div>

      {/* Lista de embarcaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVessels.map((vessel) => (
          <div key={vessel.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <PresentationChartBarIcon className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{vessel.name}</h3>
                    <p className="text-sm text-gray-500">{vessel.registration_number}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  vessel.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {vessel.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Pasajeros:</span>
                    <div className="font-medium">{getTotalSeats(vessel)} / {vessel.capacity_passengers}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Peso (kg):</span>
                    <div className="font-medium">{vessel.capacity_weight_kg?.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Bultos:</span>
                    <div className="font-medium">{vessel.capacity_packages}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Configuraciones:</span>
                    <div className="font-medium">{Array.isArray(vessel.seat_configurations) ? vessel.seat_configurations.length : 0}</div>
                  </div>
                </div>

                {Array.isArray(vessel.seat_configurations) && vessel.seat_configurations.length > 0 && (
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Configuración de Asientos:</h4>
                    <div className="space-y-1">
                      {vesselHelpers.getSeatConfigurationSummary({ ...vessel, seat_configurations: vessel.seat_configurations }).map((summary, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span>{summary.seatType} (Cubiertas: {summary.decks.join(', ')})</span>
                          <span className="font-medium">{summary.totalSeats} asientos</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      console.log('Edit clicked, vessel:', vessel);
                      setEditingVessel(vessel);
                      setShowVesselModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                    title="Editar embarcación"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      console.log('Config clicked, vessel:', vessel);
                      setConfiguringVesselId(vessel.id);
                      setShowSeatConfigModal(true);
                    }}
                    className="text-green-600 hover:text-green-900"
                    title="Configurar asientos"
                  >
                    <CogIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      console.log('Delete clicked, vessel:', vessel);
                      handleDeleteVessel(vessel);
                    }}
                    className="text-red-600 hover:text-red-900"
                    title="Desactivar embarcación"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVessels.length === 0 && (
        <div className="text-center py-12">
          <PresentationChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay embarcaciones</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No se encontraron embarcaciones que coincidan con la búsqueda' : 'Comience agregando una nueva embarcación'}
          </p>
        </div>
      )}

      {/* Modales */}
      <VesselFormModal
        isOpen={showVesselModal}
        onClose={() => {
          setShowVesselModal(false);
          setEditingVessel(undefined);
        }}
        vessel={editingVessel}
      />

      <SeatConfigModal
        isOpen={showSeatConfigModal && !!configuringVessel}
        onClose={() => {
          setShowSeatConfigModal(false);
          setConfiguringVesselId(null);
        }}
        vessel={configuringVessel ?? undefined}
      />
    </div>
  );
};