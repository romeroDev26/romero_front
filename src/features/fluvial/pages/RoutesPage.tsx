// src/features/fluvial/pages/RoutesPage.tsx
import React, { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, MapIcon, ClockIcon, PlusCircleIcon, MinusCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';
import { Route, RouteStop, Port, City } from '../../../types';

// Datos estáticos simulados
const CITIES_DATA: City[] = [
  { id: 1, name: 'Iquitos', code: 'IQT', ubigeo: '160101', department: 'Loreto', province: 'Maynas', country_code: 'PE', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 2, name: 'Nauta', code: 'NAU', ubigeo: '160201', department: 'Loreto', province: 'Loreto', country_code: 'PE', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 3, name: 'Yurimaguas', code: 'YUR', ubigeo: '160301', department: 'Loreto', province: 'Alto Amazonas', country_code: 'PE', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 4, name: 'Contamana', code: 'CON', ubigeo: '250101', department: 'Ucayali', province: 'Padre Abad', country_code: 'PE', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 5, name: 'Pucallpa', code: 'PUC', ubigeo: '250101', department: 'Ucayali', province: 'Coronel Portillo', country_code: 'PE', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' }
];

const PORTS_DATA: (Port & { city?: City })[] = [
  { id: 1, name: 'Puerto Principal de Iquitos', ubigeo: '160101', address: 'Av. Ramón Castilla s/n, Belén', city_id: 1, city: CITIES_DATA[0], is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 2, name: 'Embarcadero de Nauta', ubigeo: '160201', address: 'Puerto Fluvial de Nauta', city_id: 2, city: CITIES_DATA[1], is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 3, name: 'Puerto Fluvial Yurimaguas', ubigeo: '160301', address: 'Malecón Tahuishco s/n', city_id: 3, city: CITIES_DATA[2], is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 4, name: 'Embarcadero Contamana', ubigeo: '250101', address: 'Puerto de Contamana', city_id: 4, city: CITIES_DATA[3], is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 5, name: 'Puerto Callao de Pucallpa', ubigeo: '250101', address: 'Jr. Raimondi s/n, Callería', city_id: 5, city: CITIES_DATA[4], is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 6, name: 'Embarcadero La Hoyada', ubigeo: '250101', address: 'Puerto La Hoyada, Pucallpa', city_id: 5, city: CITIES_DATA[4], is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' }
];

const ROUTES_DATA: (Route & { origin_port?: Port; destination_port?: Port; route_stops?: RouteStop[] })[] = [
  {
    id: 1,
    name: 'Ruta Iquitos - Yurimaguas Express',
    origin_port_id: 1,
    destination_port_id: 3,
    origin_port: PORTS_DATA[0],
    destination_port: PORTS_DATA[2],
    estimated_duration_hours: 10,
    company_id: 1,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    route_stops: [
      { id: 1, route_id: 1, port_id: 1, port: PORTS_DATA[0], stop_order: 1, estimated_duration_from_origin: '00:00:00', is_boarding_allowed: true, is_disembarking_allowed: false, notes: 'Puerto de origen', created_at: '2025-01-01T00:00:00Z' },
      { id: 2, route_id: 1, port_id: 2, port: PORTS_DATA[1], stop_order: 2, estimated_duration_from_origin: '04:00:00', is_boarding_allowed: true, is_disembarking_allowed: true, notes: 'Parada intermedia', created_at: '2025-01-01T00:00:00Z' },
      { id: 3, route_id: 1, port_id: 3, port: PORTS_DATA[2], stop_order: 3, estimated_duration_from_origin: '10:00:00', is_boarding_allowed: false, is_disembarking_allowed: true, notes: 'Puerto de destino', created_at: '2025-01-01T00:00:00Z' }
    ]
  },
  {
    id: 2,
    name: 'Ruta Yurimaguas - Pucallpa',
    origin_port_id: 3,
    destination_port_id: 5,
    origin_port: PORTS_DATA[2],
    destination_port: PORTS_DATA[4],
    estimated_duration_hours: 12,
    company_id: 1,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    route_stops: [
      { id: 4, route_id: 2, port_id: 3, port: PORTS_DATA[2], stop_order: 1, estimated_duration_from_origin: '00:00:00', is_boarding_allowed: true, is_disembarking_allowed: false, notes: 'Puerto de origen', created_at: '2025-01-01T00:00:00Z' },
      { id: 5, route_id: 2, port_id: 4, port: PORTS_DATA[3], stop_order: 2, estimated_duration_from_origin: '06:00:00', is_boarding_allowed: true, is_disembarking_allowed: true, notes: 'Parada intermedia', created_at: '2025-01-01T00:00:00Z' },
      { id: 6, route_id: 2, port_id: 5, port: PORTS_DATA[4], stop_order: 3, estimated_duration_from_origin: '12:00:00', is_boarding_allowed: false, is_disembarking_allowed: true, notes: 'Puerto de destino', created_at: '2025-01-01T00:00:00Z' }
    ]
  },
  {
    id: 3,
    name: 'Ruta Circular Amazonas',
    origin_port_id: 1,
    destination_port_id: 1,
    origin_port: PORTS_DATA[0],
    destination_port: PORTS_DATA[0],
    estimated_duration_hours: 24,
    company_id: 1,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    route_stops: [
      { id: 7, route_id: 3, port_id: 1, port: PORTS_DATA[0], stop_order: 1, estimated_duration_from_origin: '00:00:00', is_boarding_allowed: true, is_disembarking_allowed: false, notes: 'Puerto de origen', created_at: '2025-01-01T00:00:00Z' },
      { id: 8, route_id: 3, port_id: 2, port: PORTS_DATA[1], stop_order: 2, estimated_duration_from_origin: '06:00:00', is_boarding_allowed: true, is_disembarking_allowed: true, notes: 'Primera parada', created_at: '2025-01-01T00:00:00Z' },
      { id: 9, route_id: 3, port_id: 3, port: PORTS_DATA[2], stop_order: 3, estimated_duration_from_origin: '12:00:00', is_boarding_allowed: true, is_disembarking_allowed: true, notes: 'Segunda parada', created_at: '2025-01-01T00:00:00Z' },
      { id: 10, route_id: 3, port_id: 4, port: PORTS_DATA[3], stop_order: 4, estimated_duration_from_origin: '18:00:00', is_boarding_allowed: true, is_disembarking_allowed: true, notes: 'Tercera parada', created_at: '2025-01-01T00:00:00Z' },
      { id: 11, route_id: 3, port_id: 1, port: PORTS_DATA[0], stop_order: 5, estimated_duration_from_origin: '24:00:00', is_boarding_allowed: false, is_disembarking_allowed: true, notes: 'Regreso al origen', created_at: '2025-01-01T00:00:00Z' }
    ]
  }
];

// Formularios
interface RouteFormData {
  name: string;
  origin_port_id: number;
  destination_port_id: number;
  estimated_duration_hours: number;
}

interface RouteStopFormData {
  port_id: number;
  stop_order: number;
  estimated_duration_hours: number;
  estimated_duration_minutes: number;
  is_boarding_allowed: boolean;
  is_disembarking_allowed: boolean;
  notes: string;
}

const RouteFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RouteFormData) => void;
  route?: Route;
  ports: Port[];
}> = ({ isOpen, onClose, onSubmit, route, ports }) => {
  const [formData, setFormData] = useState<RouteFormData>({
    name: route?.name || '',
    origin_port_id: route?.origin_port_id || 0,
    destination_port_id: route?.destination_port_id || 0,
    estimated_duration_hours: route?.estimated_duration_hours || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={route ? 'Editar Ruta' : 'Nueva Ruta'} maxWidth="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Input
          label="Nombre de la Ruta"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Puerto de Origen</label>
            <select
              value={formData.origin_port_id}
              onChange={(e) => setFormData({ ...formData, origin_port_id: parseInt(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Seleccione puerto de origen</option>
              {ports.map((port) => (
                <option key={port.id} value={port.id}>
                  {port.name} ({port.city?.name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Puerto de Destino</label>
            <select
              value={formData.destination_port_id}
              onChange={(e) => setFormData({ ...formData, destination_port_id: parseInt(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Seleccione puerto de destino</option>
              {ports.map((port) => (
                <option key={port.id} value={port.id}>
                  {port.name} ({port.city?.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Duración Estimada (horas)"
          type="number"
          step="0.5"
          value={formData.estimated_duration_hours}
          onChange={(e) => setFormData({ ...formData, estimated_duration_hours: parseFloat(e.target.value) || 0 })}
          required
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            {route ? 'Actualizar' : 'Crear'} Ruta
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const RouteStopsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (stops: RouteStopFormData[]) => void;
  route?: Route & { route_stops?: RouteStop[] };
  ports: Port[];
}> = ({ isOpen, onClose, onSubmit, route, ports }) => {
  const [stops, setStops] = useState<RouteStopFormData[]>(
    route?.route_stops?.map(stop => {
      const duration = stop.estimated_duration_from_origin || '00:00:00';
      const [hours, minutes] = duration.split(':').map(Number);
      return {
        port_id: stop.port_id,
        stop_order: stop.stop_order,
        estimated_duration_hours: hours || 0,
        estimated_duration_minutes: minutes || 0,
        is_boarding_allowed: stop.is_boarding_allowed,
        is_disembarking_allowed: stop.is_disembarking_allowed,
        notes: stop.notes || ''
      };
    }) || [{ port_id: 0, stop_order: 1, estimated_duration_hours: 0, estimated_duration_minutes: 0, is_boarding_allowed: true, is_disembarking_allowed: false, notes: '' }]
  );

  const addStop = () => {
    const nextOrder = Math.max(...stops.map(s => s.stop_order)) + 1;
    setStops([...stops, { 
      port_id: 0, 
      stop_order: nextOrder, 
      estimated_duration_hours: 0, 
      estimated_duration_minutes: 0,
      is_boarding_allowed: true, 
      is_disembarking_allowed: true, 
      notes: '' 
    }]);
  };

  const removeStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const updateStop = (index: number, field: keyof RouteStopFormData, value: any) => {
    const newStops = [...stops];
    newStops[index] = { ...newStops[index], [field]: value };
    setStops(newStops);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(stops);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Paradas de Ruta - ${route?.name}`} maxWidth="2xl">
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {stops.map((stop, index) => (
            <div key={index} className="grid grid-cols-7 gap-4 items-end p-4 border border-gray-200 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Puerto</label>
                <select
                  value={stop.port_id}
                  onChange={(e) => updateStop(index, 'port_id', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  required
                >
                  <option value="">Seleccione</option>
                  {ports.map((port) => (
                    <option key={port.id} value={port.id}>
                      {port.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                <input
                  type="number"
                  value={stop.stop_order}
                  onChange={(e) => updateStop(index, 'stop_order', parseInt(e.target.value) || 1)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horas</label>
                <input
                  type="number"
                  value={stop.estimated_duration_hours}
                  onChange={(e) => updateStop(index, 'estimated_duration_hours', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minutos</label>
                <input
                  type="number"
                  value={stop.estimated_duration_minutes}
                  onChange={(e) => updateStop(index, 'estimated_duration_minutes', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  min="0"
                  max="59"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Embarque</label>
                <input
                  type="checkbox"
                  checked={stop.is_boarding_allowed}
                  onChange={(e) => updateStop(index, 'is_boarding_allowed', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desembarque</label>
                <input
                  type="checkbox"
                  checked={stop.is_disembarking_allowed}
                  onChange={(e) => updateStop(index, 'is_disembarking_allowed', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              
              <div>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => removeStop(index)}
                  disabled={stops.length === 1}
                >
                  <MinusCircleIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-4">
          <Button type="button" variant="outline" onClick={addStop}>
            <PlusCircleIcon className="h-4 w-4 mr-2" />
            Agregar Parada
          </Button>
          
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Guardar Paradas
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export const RoutesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [routes, setRoutes] = useState<(Route & { origin_port?: Port; destination_port?: Port; route_stops?: RouteStop[] })[]>(ROUTES_DATA);
  
  // Estados para modales
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showStopsModal, setShowStopsModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | undefined>();
  const [configuringRoute, setConfiguringRoute] = useState<(Route & { route_stops?: RouteStop[] }) | undefined>();

  // Filtrar rutas según búsqueda
  const filteredRoutes = routes.filter(route =>
    route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.origin_port?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.destination_port?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRoute = (data: RouteFormData) => {
    const originPort = PORTS_DATA.find(p => p.id === data.origin_port_id);
    const destinationPort = PORTS_DATA.find(p => p.id === data.destination_port_id);
    
    const newRoute = {
      id: Math.max(...routes.map(r => r.id)) + 1,
      ...data,
      company_id: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      origin_port: originPort,
      destination_port: destinationPort,
      route_stops: []
    };
    setRoutes([...routes, newRoute]);
    console.log('Ruta creada:', newRoute);
  };

  const handleUpdateRoute = (data: RouteFormData) => {
    if (!editingRoute) return;
    
    const originPort = PORTS_DATA.find(p => p.id === data.origin_port_id);
    const destinationPort = PORTS_DATA.find(p => p.id === data.destination_port_id);
    
    const updatedRoutes = routes.map(route =>
      route.id === editingRoute.id
        ? { 
            ...route, 
            ...data, 
            origin_port: originPort,
            destination_port: destinationPort,
            updated_at: new Date().toISOString() 
          }
        : route
    );
    setRoutes(updatedRoutes);
    setEditingRoute(undefined);
    console.log('Ruta actualizada:', data);
  };

  const handleUpdateStops = (stopsData: RouteStopFormData[]) => {
    if (!configuringRoute) return;
    
    const newStops: RouteStop[] = stopsData.map((stopData, index) => {
      const port = PORTS_DATA.find(p => p.id === stopData.port_id);
      const durationString = `${stopData.estimated_duration_hours.toString().padStart(2, '0')}:${stopData.estimated_duration_minutes.toString().padStart(2, '0')}:00`;
      
      return {
        id: Date.now() + index,
        route_id: configuringRoute.id,
        port_id: stopData.port_id,
        port: port,
        stop_order: stopData.stop_order,
        estimated_duration_from_origin: durationString,
        is_boarding_allowed: stopData.is_boarding_allowed,
        is_disembarking_allowed: stopData.is_disembarking_allowed,
        notes: stopData.notes,
        created_at: new Date().toISOString()
      };
    });

    const updatedRoutes = routes.map(route =>
      route.id === configuringRoute.id
        ? { ...route, route_stops: newStops, updated_at: new Date().toISOString() }
        : route
    );
    setRoutes(updatedRoutes);
    setConfiguringRoute(undefined);
    console.log('Paradas actualizadas:', stopsData);
  };

  const handleDeleteRoute = (routeId: number) => {
    if (confirm('¿Está seguro de eliminar esta ruta?')) {
      setRoutes(routes.filter(route => route.id !== routeId));
      console.log('Ruta eliminada:', routeId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Rutas</h1>
          <p className="text-gray-600">Administra las rutas fluviales del sistema</p>
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
            placeholder="Buscar rutas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button
          onClick={() => {
            setEditingRoute(undefined);
            setShowRouteModal(true);
          }}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Ruta
        </Button>
      </div>

      {/* Lista de rutas */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ruta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Origen → Destino
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duración
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paradas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRoutes.map((route) => (
              <tr key={route.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <MapIcon className="h-5 w-5 text-blue-500 mr-3" />
                    <div className="font-medium text-gray-900">{route.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <span className="font-medium">{route.origin_port?.city?.name}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{route.destination_port?.city?.name}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {route.origin_port?.name} → {route.destination_port?.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {route.estimated_duration_hours}h
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="font-medium">{route.route_stops?.length || 0}</span> paradas
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    route.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {route.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingRoute(route);
                        setShowRouteModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="Editar ruta"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setConfiguringRoute(route);
                        setShowStopsModal(true);
                      }}
                      className="text-green-600 hover:text-green-900"
                      title="Configurar paradas"
                    >
                      <MapIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRoute(route.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Eliminar ruta"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRoutes.length === 0 && (
        <div className="text-center py-12">
          <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay rutas</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No se encontraron rutas que coincidan con la búsqueda' : 'Comience agregando una nueva ruta'}
          </p>
        </div>
      )}

      {/* Modales */}
      <RouteFormModal
        isOpen={showRouteModal}
        onClose={() => setShowRouteModal(false)}
        onSubmit={editingRoute ? handleUpdateRoute : handleCreateRoute}
        route={editingRoute}
        ports={PORTS_DATA}
      />

      <RouteStopsModal
        isOpen={showStopsModal}
        onClose={() => setShowStopsModal(false)}
        onSubmit={handleUpdateStops}
        route={configuringRoute}
        ports={PORTS_DATA}
      />
    </div>
  );
};