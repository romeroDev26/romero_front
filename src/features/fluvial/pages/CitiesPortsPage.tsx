import React, { useMemo, useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';
import { Spinner } from '../../../components/common/Spinner';
import { City, Port, PortType } from '../../../types';
import { useCities, useCreateCity, useUpdateCity, useDeactivateCity, usePorts, useCreatePort, useUpdatePort, useDeactivatePort } from '../../../hooks/useCitiesPortsData';
import { CityCreateData, CityUpdateData, PortCreateData, PortUpdateData } from '../../../services/ports.cities.service';
import { toast } from 'react-toastify';

// Objeto para mapear los tipos de puerto a etiquetas legibles
const PORT_TYPE_LABELS: Record<PortType, string> = {
  'PRIMARY_HUB': 'Puerto Principal',
  'SECONDARY_STOP': 'Parada Secundaria',
};

// Componente para el modal de Ciudad
const CityFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CityCreateData | CityUpdateData) => void;
  city?: City;
}> = ({ isOpen, onClose, onSubmit, city }) => {
  const [formData, setFormData] = useState({
    name: city?.name || '',
    code: city?.code || '',
    ubigeo: city?.ubigeo || '',
    department: city?.department || '',
    province: city?.province || '',
    country_code: city?.country_code || 'PE'
  });

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: city?.name || '',
        code: city?.code || '',
        ubigeo: city?.ubigeo || '',
        department: city?.department || '',
        province: city?.province || '',
        country_code: city?.country_code || 'PE'
      });
    }
  }, [isOpen, city]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validar que el Ubigeo tenga exactamente 6 dígitos
    if (!/^\d{6}$/.test(formData.ubigeo)) {
      toast.error('El Ubigeo debe contener exactamente 6 dígitos.');
      return;
    }
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={city ? 'Editar Ciudad' : 'Nueva Ciudad'} maxWidth="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nombre de la Ciudad" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="Código" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Ubigeo" value={formData.ubigeo} onChange={(e) => {
            // Limitar a máximo 6 caracteres numéricos
            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
            setFormData({ ...formData, ubigeo: value });
          }} required maxLength={6} />
          <Input label="Departamento" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} required />
          <Input label="Provincia" value={formData.province} onChange={(e) => setFormData({ ...formData, province: e.target.value })} required />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit">{city ? 'Actualizar' : 'Crear'} Ciudad</Button>
        </div>
      </form>
    </Modal>
  );
};

// Componente para el modal de Puerto
const PortFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PortCreateData | PortUpdateData) => void;
  port?: Port;
  cities: City[];
}> = ({ isOpen, onClose, onSubmit, port, cities }) => {
  const [formData, setFormData] = useState({
    name: port?.name || '',
    ubigeo: port?.ubigeo || '',
    address: port?.address || '',
    city_id: port?.city_id || 0,
    port_type: port?.port_type || 'SECONDARY_STOP' as PortType
  });

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: port?.name || '',
        ubigeo: port?.ubigeo || '',
        address: port?.address || '',
        city_id: port?.city_id || 0,
        port_type: port?.port_type || 'SECONDARY_STOP' as PortType
      });
    }
  }, [isOpen, port]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(formData.ubigeo)) {
      toast.error('El Ubigeo debe contener exactamente 6 dígitos.');
      return;
    }
    if (formData.city_id === 0) {
      toast.error("Por favor, seleccione una ciudad.");
      return;
    }
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={port ? 'Editar Puerto' : 'Nuevo Puerto'} maxWidth="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Input label="Nombre del Puerto" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Ubigeo (6 dígitos)" value={formData.ubigeo} onChange={(e) => {
            // Limitar a máximo 6 caracteres numéricos
            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
            setFormData({ ...formData, ubigeo: value });
          }} required maxLength={6} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Puerto</label>
            <select
              value={formData.port_type}
              onChange={(e) => setFormData({ ...formData, port_type: e.target.value as PortType })}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              {Object.entries(PORT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
          <select value={formData.city_id} onChange={(e) => setFormData({ ...formData, city_id: parseInt(e.target.value) })} className="w-full p-2 border border-gray-300 rounded-md" required>
            <option value={0}>Seleccione una ciudad</option>
            {cities.map((city) => (<option key={city.id} value={city.id}>{city.name} ({city.department})</option>))}
          </select>
        </div>
        <Input label="Dirección" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit">{port ? 'Actualizar' : 'Crear'} Puerto</Button>
        </div>
      </form>
    </Modal>
  );
};

// Componente principal de la página
export const CitiesPortsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cities' | 'ports'>('cities');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCityModal, setShowCityModal] = useState(false);
  const [showPortModal, setShowPortModal] = useState(false);
  const [editingCity, setEditingCity] = useState<City | undefined>();
  const [editingPort, setEditingPort] = useState<Port | undefined>();

  const { data: cities = [], isLoading: isLoadingCities } = useCities();
  const { data: ports = [], isLoading: isLoadingPorts } = usePorts(true);

  const createCityMutation = useCreateCity();
  const updateCityMutation = useUpdateCity();
  const deactivateCityMutation = useDeactivateCity();
  const createPortMutation = useCreatePort();
  const updatePortMutation = useUpdatePort();
  const deactivatePortMutation = useDeactivatePort();

  const handleFormSubmit = (data: CityCreateData | CityUpdateData | PortCreateData | PortUpdateData) => {
    if (editingCity) {
      updateCityMutation.mutate({ id: editingCity.id, data: data as CityUpdateData }, { onSuccess: () => setShowCityModal(false) });
    } else if (editingPort) {
      updatePortMutation.mutate({ id: editingPort.id, data: data as PortUpdateData }, { onSuccess: () => setShowPortModal(false) });
    } else if (activeTab === 'cities') {
      createCityMutation.mutate(data as CityCreateData, { onSuccess: () => setShowCityModal(false) });
    } else {
      createPortMutation.mutate(data as PortCreateData, { onSuccess: () => setShowPortModal(false) });
    }
  };

  const handleDelete = (id: number) => {
    const confirmationText = activeTab === 'cities' ? '¿Está seguro de que desea desactivar esta ciudad?' : '¿Está seguro de que desea desactivar este puerto?';
    if (window.confirm(confirmationText)) {
      if (activeTab === 'cities') {
        deactivateCityMutation.mutate(id);
      } else {
        deactivatePortMutation.mutate(id);
      }
    }
  };

  const filteredCities = useMemo(() =>
    cities.filter(city =>
      city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.code?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [cities, searchTerm]);

  const filteredPorts = useMemo(() =>
    ports.filter(port =>
      port.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      port.city?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      port.address?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [ports, searchTerm]);

  if (isLoadingCities || isLoadingPorts) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ciudades y Puertos</h1>
          <p className="text-gray-600">Gestión de ubicaciones geográficas del sistema fluvial</p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button onClick={() => setActiveTab('cities')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'cities' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Ciudades ({cities.length})
          </button>
          <button onClick={() => setActiveTab('ports')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'ports' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Puertos ({ports.length})
          </button>
        </nav>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MagnifyingGlassIcon className="h-5 w-5 text-gray-400" /></div>
          <input type="text" className="pl-10 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder={`Buscar ${activeTab === 'cities' ? 'ciudades' : 'puertos'}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Button onClick={() => {
          if (activeTab === 'cities') { setEditingCity(undefined); setShowCityModal(true); }
          else { setEditingPort(undefined); setShowPortModal(true); }
        }} className="flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          {activeTab === 'cities' ? 'Nueva Ciudad' : 'Nuevo Puerto'}
        </Button>
      </div>

      {activeTab === 'cities' ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ciudad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubigeo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCities.map((city) => (
                <tr key={city.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><MapPinIcon className="h-5 w-5 text-gray-400 mr-3" /><div className="font-medium text-gray-900">{city.name}</div></div></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{city.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{city.province}, {city.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{city.ubigeo}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${city.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{city.is_active ? 'Activo' : 'Inactivo'}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => { setEditingCity(city); setShowCityModal(true); }} className="text-blue-600 hover:text-blue-900 mr-3"><PencilIcon className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(city.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-4 w-4" /></button>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puerto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ciudad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubigeo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPorts.map((port) => (
                <tr key={port.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><MapPinIcon className="h-5 w-5 text-blue-400 mr-3" /><div className="font-medium text-gray-900">{port.name}</div></div></td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{PORT_TYPE_LABELS[port.port_type] || port.port_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{port.city?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{port.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{port.ubigeo}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${port.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{port.is_active ? 'Activo' : 'Inactivo'}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => { setEditingPort(port); setShowPortModal(true); }} className="text-blue-600 hover:text-blue-900 mr-3"><PencilIcon className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(port.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CityFormModal
        isOpen={showCityModal}
        onClose={() => setShowCityModal(false)}
        onSubmit={handleFormSubmit}
        city={editingCity}
      />

      <PortFormModal
        isOpen={showPortModal}
        onClose={() => setShowPortModal(false)}
        onSubmit={handleFormSubmit}
        port={editingPort}
        cities={cities}
      />
    </div>
  );
};
