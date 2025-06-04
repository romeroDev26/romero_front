// src/features/fluvial/pages/VesselsPage.tsx
import React, { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, PresentationChartBarIcon, CogIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';
import { Vessel, VesselSeatConfiguration, SeatType } from '../../../types';

// Datos estáticos simulados
const SEAT_TYPES: SeatType[] = [
  { 
    id: 1, 
    name: 'Común', 
    code: 'COM', 
    price_multiplier: 1.0, 
    is_active: true, 
    display_order: 1,
    created_at: '2025-01-01T00:00:00Z'
  },
  { 
    id: 2, 
    name: 'Premium', 
    code: 'PREM', 
    price_multiplier: 1.5, 
    is_active: true, 
    display_order: 2,
    created_at: '2025-01-01T00:00:00Z'
  },
  { 
    id: 3, 
    name: 'Auxiliar', 
    code: 'AUX', 
    price_multiplier: 0.8, 
    is_active: true, 
    display_order: 3,
    created_at: '2025-01-01T00:00:00Z'
  }
];

const VESSELS_DATA: (Vessel & { seat_configurations?: VesselSeatConfiguration[] })[] = [
  {
    id: 1,
    registration_number: 'FL-001-2024',
    name: 'Expreso Amazonas',
    capacity_weight_kg: 15000,
    capacity_packages: 200,
    capacity_passengers: 35,
    company_id: 1,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    seat_configurations: [
      { id: 1, vessel_id: 1, seat_type_id: 1, seat_type: SEAT_TYPES[0], total_seats: 20, deck_level: 1, notes: 'Cubierta principal', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
      { id: 2, vessel_id: 1, seat_type_id: 2, seat_type: SEAT_TYPES[1], total_seats: 10, deck_level: 2, notes: 'Cubierta superior', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
      { id: 3, vessel_id: 1, seat_type_id: 3, seat_type: SEAT_TYPES[2], total_seats: 5, deck_level: 1, notes: 'Asientos auxiliares', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' }
    ]
  },
  {
    id: 2,
    registration_number: 'FL-002-2024',
    name: 'Río Grande',
    capacity_weight_kg: 12000,
    capacity_packages: 150,
    capacity_passengers: 25,
    company_id: 1,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    seat_configurations: [
      { id: 4, vessel_id: 2, seat_type_id: 1, seat_type: SEAT_TYPES[0], total_seats: 18, deck_level: 1, notes: 'Cubierta principal', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
      { id: 5, vessel_id: 2, seat_type_id: 2, seat_type: SEAT_TYPES[1], total_seats: 7, deck_level: 2, notes: 'Cubierta superior', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' }
    ]
  },
  {
    id: 3,
    registration_number: 'FL-003-2023',
    name: 'Selva Express',
    capacity_weight_kg: 18000,
    capacity_packages: 250,
    capacity_passengers: 40,
    company_id: 1,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    seat_configurations: [
      { id: 6, vessel_id: 3, seat_type_id: 1, seat_type: SEAT_TYPES[0], total_seats: 25, deck_level: 1, notes: 'Cubierta principal', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
      { id: 7, vessel_id: 3, seat_type_id: 2, seat_type: SEAT_TYPES[1], total_seats: 15, deck_level: 2, notes: 'Cubierta superior', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' }
    ]
  },
  {
    id: 4,
    registration_number: 'FL-004-2023',
    name: 'Amazonía I',
    capacity_weight_kg: 10000,
    capacity_packages: 120,
    capacity_passengers: 30,
    company_id: 1,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    seat_configurations: [
      { id: 8, vessel_id: 4, seat_type_id: 1, seat_type: SEAT_TYPES[0], total_seats: 25, deck_level: 1, notes: 'Cubierta única', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
      { id: 9, vessel_id: 4, seat_type_id: 3, seat_type: SEAT_TYPES[2], total_seats: 5, deck_level: 1, notes: 'Asientos auxiliares', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' }
    ]
  }
];

// Formulario para embarcaciones
interface VesselFormData {
  registration_number: string;
  name: string;
  capacity_weight_kg: number;
  capacity_packages: number;
  capacity_passengers: number;
}

interface SeatConfigFormData {
  seat_type_id: number;
  total_seats: number;
  deck_level: number;
  notes: string;
}

const VesselFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VesselFormData) => void;
  vessel?: Vessel;
}> = ({ isOpen, onClose, onSubmit, vessel }) => {
  const [formData, setFormData] = useState<VesselFormData>({
    registration_number: vessel?.registration_number || '',
    name: vessel?.name || '',
    capacity_weight_kg: vessel?.capacity_weight_kg || 0,
    capacity_packages: vessel?.capacity_packages || 0,
    capacity_passengers: vessel?.capacity_passengers || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={vessel ? 'Editar Embarcación' : 'Nueva Embarcación'} maxWidth="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Número de Matrícula"
            value={formData.registration_number}
            onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
            required
          />
          <Input
            label="Nombre de la Embarcación"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Capacidad de Peso (kg)"
            type="number"
            value={formData.capacity_weight_kg}
            onChange={(e) => setFormData({ ...formData, capacity_weight_kg: parseFloat(e.target.value) || 0 })}
            required
          />
          <Input
            label="Capacidad de Bultos"
            type="number"
            value={formData.capacity_packages}
            onChange={(e) => setFormData({ ...formData, capacity_packages: parseInt(e.target.value) || 0 })}
            required
          />
          <Input
            label="Capacidad de Pasajeros"
            type="number"
            value={formData.capacity_passengers}
            onChange={(e) => setFormData({ ...formData, capacity_passengers: parseInt(e.target.value) || 0 })}
            required
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            {vessel ? 'Actualizar' : 'Crear'} Embarcación
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const SeatConfigModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SeatConfigFormData[]) => void;
  vessel?: Vessel & { seat_configurations?: VesselSeatConfiguration[] };
}> = ({ isOpen, onClose, onSubmit, vessel }) => {
  const [configs, setConfigs] = useState<SeatConfigFormData[]>(
    vessel?.seat_configurations?.map(config => ({
      seat_type_id: config.seat_type_id,
      total_seats: config.total_seats,
      deck_level: config.deck_level || 1,
      notes: config.notes || ''
    })) || [{ seat_type_id: 1, total_seats: 0, deck_level: 1, notes: '' }]
  );

  const addConfig = () => {
    setConfigs([...configs, { seat_type_id: 1, total_seats: 0, deck_level: 1, notes: '' }]);
  };

  const removeConfig = (index: number) => {
    setConfigs(configs.filter((_, i) => i !== index));
  };

  const updateConfig = (index: number, field: keyof SeatConfigFormData, value: any) => {
    const newConfigs = [...configs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    setConfigs(newConfigs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(configs);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Configuración de Asientos - ${vessel?.name}`} maxWidth="2xl">
      <form onSubmit={handleSubmit} className="p-6">
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
                  {SEAT_TYPES.map((seatType) => (
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

        <div className="flex justify-between items-center mt-4">
          <Button type="button" variant="outline" onClick={addConfig}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Agregar Configuración
          </Button>
          
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Guardar Configuración
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export const VesselsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [vessels, setVessels] = useState<(Vessel & { seat_configurations?: VesselSeatConfiguration[] })[]>(VESSELS_DATA);
  
  // Estados para modales
  const [showVesselModal, setShowVesselModal] = useState(false);
  const [showSeatConfigModal, setShowSeatConfigModal] = useState(false);
  const [editingVessel, setEditingVessel] = useState<Vessel | undefined>();
  const [configuringVessel, setConfiguringVessel] = useState<(Vessel & { seat_configurations?: VesselSeatConfiguration[] }) | undefined>();

  // Filtrar embarcaciones según búsqueda
  const filteredVessels = vessels.filter(vessel =>
    vessel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vessel.registration_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTotalSeats = (vessel: Vessel & { seat_configurations?: VesselSeatConfiguration[] }) => {
    return vessel.seat_configurations?.reduce((total, config) => total + config.total_seats, 0) || 0;
  };

  const handleCreateVessel = (data: VesselFormData) => {
    const newVessel = {
      id: Math.max(...vessels.map(v => v.id)) + 1,
      ...data,
      company_id: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      seat_configurations: []
    };
    setVessels([...vessels, newVessel]);
    console.log('Embarcación creada:', newVessel);
  };

  const handleUpdateVessel = (data: VesselFormData) => {
    if (!editingVessel) return;
    
    const updatedVessels = vessels.map(vessel =>
      vessel.id === editingVessel.id
        ? { ...vessel, ...data, updated_at: new Date().toISOString() }
        : vessel
    );
    setVessels(updatedVessels);
    setEditingVessel(undefined);
    console.log('Embarcación actualizada:', data);
  };

  const handleUpdateSeatConfig = (configs: SeatConfigFormData[]) => {
    if (!configuringVessel) return;
    
    const newConfigurations: VesselSeatConfiguration[] = configs.map((config, index) => ({
      id: Date.now() + index, // Simulado
      vessel_id: configuringVessel.id,
      seat_type_id: config.seat_type_id,
      seat_type: SEAT_TYPES.find(st => st.id === config.seat_type_id),
      total_seats: config.total_seats,
      deck_level: config.deck_level,
      notes: config.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const updatedVessels = vessels.map(vessel =>
      vessel.id === configuringVessel.id
        ? { ...vessel, seat_configurations: newConfigurations, updated_at: new Date().toISOString() }
        : vessel
    );
    setVessels(updatedVessels);
    setConfiguringVessel(undefined);
    console.log('Configuración de asientos actualizada:', configs);
  };

  const handleDeleteVessel = (vesselId: number) => {
    if (confirm('¿Está seguro de eliminar esta embarcación?')) {
      setVessels(vessels.filter(vessel => vessel.id !== vesselId));
      console.log('Embarcación eliminada:', vesselId);
    }
  };

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
                    <div className="font-medium">{vessel.seat_configurations?.length || 0}</div>
                  </div>
                </div>

                {vessel.seat_configurations && vessel.seat_configurations.length > 0 && (
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Configuración de Asientos:</h4>
                    <div className="space-y-1">
                      {vessel.seat_configurations.map((config) => (
                        <div key={config.id} className="flex justify-between text-xs">
                          <span>{config.seat_type?.name} (Cubierta {config.deck_level})</span>
                          <span className="font-medium">{config.total_seats} asientos</span>
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
                      setConfiguringVessel(vessel);
                      setShowSeatConfigModal(true);
                    }}
                    className="text-green-600 hover:text-green-900"
                    title="Configurar asientos"
                  >
                    <CogIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteVessel(vessel.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Eliminar embarcación"
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
        onClose={() => setShowVesselModal(false)}
        onSubmit={editingVessel ? handleUpdateVessel : handleCreateVessel}
        vessel={editingVessel}
      />

      <SeatConfigModal
        isOpen={showSeatConfigModal}
        onClose={() => setShowSeatConfigModal(false)}
        onSubmit={handleUpdateSeatConfig}
        vessel={configuringVessel}
      />
    </div>
  );
};