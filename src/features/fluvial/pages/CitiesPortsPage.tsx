// src/features/fluvial/pages/CitiesPortsPage.tsx
import React, { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';
import { City, Port } from '../../../types';

// Datos estáticos simulados
const CITIES_DATA: City[] = [
  {
    id: 1,
    name: 'Iquitos',
    code: 'IQT',
    ubigeo: '160101',
    department: 'Loreto',
    province: 'Maynas',
    country_code: 'PE',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Nauta',
    code: 'NAU',
    ubigeo: '160201',
    department: 'Loreto',
    province: 'Loreto',
    country_code: 'PE',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 3,
    name: 'Yurimaguas',
    code: 'YUR',
    ubigeo: '160301',
    department: 'Loreto',
    province: 'Alto Amazonas',
    country_code: 'PE',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 4,
    name: 'Contamana',
    code: 'CON',
    ubigeo: '250101',
    department: 'Ucayali',
    province: 'Padre Abad',
    country_code: 'PE',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 5,
    name: 'Pucallpa',
    code: 'PUC',
    ubigeo: '250101',
    department: 'Ucayali',
    province: 'Coronel Portillo',
    country_code: 'PE',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

const PORTS_DATA: (Port & { city?: City })[] = [
  {
    id: 1,
    name: 'Puerto Principal de Iquitos',
    ubigeo: '160101',
    address: 'Av. Ramón Castilla s/n, Belén',
    city_id: 1,
    city: CITIES_DATA[0],
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Embarcadero de Nauta',
    ubigeo: '160201',
    address: 'Puerto Fluvial de Nauta',
    city_id: 2,
    city: CITIES_DATA[1],
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 3,
    name: 'Puerto Fluvial Yurimaguas',
    ubigeo: '160301',
    address: 'Malecón Tahuishco s/n',
    city_id: 3,
    city: CITIES_DATA[2],
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 4,
    name: 'Embarcadero Contamana',
    ubigeo: '250101',
    address: 'Puerto de Contamana',
    city_id: 4,
    city: CITIES_DATA[3],
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 5,
    name: 'Puerto Callao de Pucallpa',
    ubigeo: '250101',
    address: 'Jr. Raimondi s/n, Callería',
    city_id: 5,
    city: CITIES_DATA[4],
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 6,
    name: 'Embarcadero La Hoyada',
    ubigeo: '250101',
    address: 'Puerto La Hoyada, Pucallpa',
    city_id: 5,
    city: CITIES_DATA[4],
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

// Formulario para ciudades
interface CityFormData {
  name: string;
  code: string;
  ubigeo: string;
  department: string;
  province: string;
  country_code: string;
}

// Formulario para puertos
interface PortFormData {
  name: string;
  ubigeo: string;
  address: string;
  city_id: number;
}

const CityFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CityFormData) => void;
  city?: City;
}> = ({ isOpen, onClose, onSubmit, city }) => {
  const [formData, setFormData] = useState<CityFormData>({
    name: city?.name || '',
    code: city?.code || '',
    ubigeo: city?.ubigeo || '',
    department: city?.department || '',
    province: city?.province || '',
    country_code: city?.country_code || 'PE'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={city ? 'Editar Ciudad' : 'Nueva Ciudad'} maxWidth="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombre de la Ciudad"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Código"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Ubigeo"
            value={formData.ubigeo}
            onChange={(e) => setFormData({ ...formData, ubigeo: e.target.value })}
            required
          />
          <Input
            label="Departamento"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            required
          />
          <Input
            label="Provincia"
            value={formData.province}
            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
            required
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            {city ? 'Actualizar' : 'Crear'} Ciudad
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const PortFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PortFormData) => void;
  port?: Port;
  cities: City[];
}> = ({ isOpen, onClose, onSubmit, port, cities }) => {
  const [formData, setFormData] = useState<PortFormData>({
    name: port?.name || '',
    ubigeo: port?.ubigeo || '',
    address: port?.address || '',
    city_id: port?.city_id || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={port ? 'Editar Puerto' : 'Nuevo Puerto'} maxWidth="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Input
          label="Nombre del Puerto"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
            <select
              value={formData.city_id}
              onChange={(e) => setFormData({ ...formData, city_id: parseInt(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Seleccione una ciudad</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name} ({city.department})
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Ubigeo"
            value={formData.ubigeo}
            onChange={(e) => setFormData({ ...formData, ubigeo: e.target.value })}
            required
          />
        </div>

        <Input
          label="Dirección"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            {port ? 'Actualizar' : 'Crear'} Puerto
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export const CitiesPortsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cities' | 'ports'>('cities');
  const [searchTerm, setSearchTerm] = useState('');
  const [cities, setCities] = useState<City[]>(CITIES_DATA);
  const [ports, setPorts] = useState<(Port & { city?: City })[]>(PORTS_DATA);
  
  // Estados para modales
  const [showCityModal, setShowCityModal] = useState(false);
  const [showPortModal, setShowPortModal] = useState(false);
  const [editingCity, setEditingCity] = useState<City | undefined>();
  const [editingPort, setEditingPort] = useState<Port | undefined>();

  // Filtrar datos según búsqueda
  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPorts = ports.filter(port =>
    port.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    port.city?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    port.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCity = (data: CityFormData) => {
    const newCity: City = {
      id: Math.max(...cities.map(c => c.id)) + 1,
      ...data,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setCities([...cities, newCity]);
    console.log('Ciudad creada:', newCity);
  };

  const handleUpdateCity = (data: CityFormData) => {
    if (!editingCity) return;
    
    const updatedCities = cities.map(city =>
      city.id === editingCity.id
        ? { ...city, ...data, updated_at: new Date().toISOString() }
        : city
    );
    setCities(updatedCities);
    setEditingCity(undefined);
    console.log('Ciudad actualizada:', data);
  };

  const handleCreatePort = (data: PortFormData) => {
    const selectedCity = cities.find(c => c.id === data.city_id);
    const newPort = {
      id: Math.max(...ports.map(p => p.id)) + 1,
      ...data,
      city: selectedCity,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setPorts([...ports, newPort]);
    console.log('Puerto creado:', newPort);
  };

  const handleUpdatePort = (data: PortFormData) => {
    if (!editingPort) return;
    
    const selectedCity = cities.find(c => c.id === data.city_id);
    const updatedPorts = ports.map(port =>
      port.id === editingPort.id
        ? { ...port, ...data, city: selectedCity, updated_at: new Date().toISOString() }
        : port
    );
    setPorts(updatedPorts);
    setEditingPort(undefined);
    console.log('Puerto actualizado:', data);
  };

  const handleDeleteCity = (cityId: number) => {
    if (confirm('¿Está seguro de eliminar esta ciudad?')) {
      setCities(cities.filter(city => city.id !== cityId));
      console.log('Ciudad eliminada:', cityId);
    }
  };

  const handleDeletePort = (portId: number) => {
    if (confirm('¿Está seguro de eliminar este puerto?')) {
      setPorts(ports.filter(port => port.id !== portId));
      console.log('Puerto eliminado:', portId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ciudades y Puertos</h1>
          <p className="text-gray-600">Gestión de ubicaciones geográficas del sistema fluvial</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('cities')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cities'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Ciudades ({cities.length})
          </button>
          <button
            onClick={() => setActiveTab('ports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Puertos ({ports.length})
          </button>
        </nav>
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
            placeholder={`Buscar ${activeTab === 'cities' ? 'ciudades' : 'puertos'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button
          onClick={() => {
            if (activeTab === 'cities') {
              setEditingCity(undefined);
              setShowCityModal(true);
            } else {
              setEditingPort(undefined);
              setShowPortModal(true);
            }
          }}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          {activeTab === 'cities' ? 'Nueva Ciudad' : 'Nuevo Puerto'}
        </Button>
      </div>

      {/* Contenido de tabs */}
      {activeTab === 'cities' ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ciudad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubigeo
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
              {filteredCities.map((city) => (
                <tr key={city.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="font-medium text-gray-900">{city.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {city.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {city.province}, {city.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {city.ubigeo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      city.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {city.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setEditingCity(city);
                        setShowCityModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCity(city.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puerto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ciudad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dirección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubigeo
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
              {filteredPorts.map((port) => (
                <tr key={port.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPinIcon className="h-5 w-5 text-blue-400 mr-3" />
                      <div className="font-medium text-gray-900">{port.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {port.city?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {port.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {port.ubigeo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      port.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {port.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setEditingPort(port);
                        setShowPortModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePort(port.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales */}
      <CityFormModal
        isOpen={showCityModal}
        onClose={() => setShowCityModal(false)}
        onSubmit={editingCity ? handleUpdateCity : handleCreateCity}
        city={editingCity}
      />

      <PortFormModal
        isOpen={showPortModal}
        onClose={() => setShowPortModal(false)}
        onSubmit={editingPort ? handleUpdatePort : handleCreatePort}
        port={editingPort}
        cities={cities}
      />
    </div>
  );
};