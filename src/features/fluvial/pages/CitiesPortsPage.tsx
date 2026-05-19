import React, { useEffect, useMemo, useState } from 'react';
import { PlusIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';
import { Spinner } from '../../../components/common/Spinner';
import { DataTable, useConfirmDelete, Column } from '../../../components/common/DataTable';
import { Pagination } from '../../../components/common/Pagination';
import { SearchInput } from '../../../components/common/SearchInput';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { City, Port, PortType } from '../../../types';
import {
  useCities,
  useCreateCity,
  useUpdateCity,
  useDeactivateCity,
  usePorts,
  useCreatePort,
  useUpdatePort,
  useDeactivatePort,
} from '../../../hooks/useCitiesPortsData';
import { CityCreateData, CityUpdateData, PortCreateData, PortUpdateData } from '../../../services/ports.cities.service';
import { toast } from '@/utils/sileo-toast';

const PORT_TYPE_LABELS: Record<PortType, string> = {
  PRIMARY_HUB: 'Puerto Principal',
  SECONDARY_STOP: 'Parada Secundaria',
};

const ITEMS_PER_PAGE = 10;

// ========================================
// MODAL DE CIUDAD
// ========================================
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
    country_code: city?.country_code || 'PE',
    is_active: city?.is_active ?? true,
  });

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: city?.name || '',
        code: city?.code || '',
        ubigeo: city?.ubigeo || '',
        department: city?.department || '',
        province: city?.province || '',
        country_code: city?.country_code || 'PE',
        is_active: city?.is_active ?? true,
      });
    }
  }, [isOpen, city]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setFormData({ ...formData, ubigeo: value });
            }}
            required
            maxLength={6}
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
        <div className="flex items-center space-x-3">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">Ciudad activa</span>
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">{city ? 'Actualizar' : 'Crear'} Ciudad</Button>
        </div>
      </form>
    </Modal>
  );
};

// ========================================
// MODAL DE PUERTO
// ========================================
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
    port_type: port?.port_type || ('SECONDARY_STOP' as PortType),
  });

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: port?.name || '',
        ubigeo: port?.ubigeo || '',
        address: port?.address || '',
        city_id: port?.city_id || 0,
        port_type: port?.port_type || ('SECONDARY_STOP' as PortType),
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
      toast.error('Por favor, seleccione una ciudad.');
      return;
    }
    onSubmit(formData);
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
          <Input
            label="Ubigeo (6 dígitos)"
            value={formData.ubigeo}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setFormData({ ...formData, ubigeo: value });
            }}
            required
            maxLength={6}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Puerto</label>
            <select
              value={formData.port_type}
              onChange={(e) => setFormData({ ...formData, port_type: e.target.value as PortType })}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              {Object.entries(PORT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
          <select
            value={formData.city_id}
            onChange={(e) => setFormData({ ...formData, city_id: parseInt(e.target.value) })}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          >
            <option value={0}>Seleccione una ciudad</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name} ({city.department})
              </option>
            ))}
          </select>
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
          <Button type="submit">{port ? 'Actualizar' : 'Crear'} Puerto</Button>
        </div>
      </form>
    </Modal>
  );
};

// ========================================
// PÁGINA PRINCIPAL
// ========================================
export const CitiesPortsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cities' | 'ports'>('cities');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showPortModal, setShowPortModal] = useState(false);
  const [editingCity, setEditingCity] = useState<City | undefined>();
  const [editingPort, setEditingPort] = useState<Port | undefined>();

  const { data: cities = [], isLoading: isLoadingCities } = useCities();
  const { data: ports = [], isLoading: isLoadingPorts } = usePorts({ isActive: true });

  const createCityMutation = useCreateCity();
  const updateCityMutation = useUpdateCity();
  const deactivateCityMutation = useDeactivateCity();
  const createPortMutation = useCreatePort();
  const updatePortMutation = useUpdatePort();
  const deactivatePortMutation = useDeactivatePort();

  // Resetear página al cambiar de tab o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const handleFormSubmit = (
    data: CityCreateData | CityUpdateData | PortCreateData | PortUpdateData
  ) => {
    if (editingCity) {
      updateCityMutation.mutate(
        { id: editingCity.id, data: data as CityUpdateData },
        { onSuccess: () => setShowCityModal(false) }
      );
    } else if (editingPort) {
      updatePortMutation.mutate(
        { id: editingPort.id, data: data as PortUpdateData },
        { onSuccess: () => setShowPortModal(false) }
      );
    } else if (activeTab === 'cities') {
      createCityMutation.mutate(data as CityCreateData, {
        onSuccess: () => setShowCityModal(false),
      });
    } else {
      createPortMutation.mutate(data as PortCreateData, {
        onSuccess: () => setShowPortModal(false),
      });
    }
  };

  const handleDeleteCity = useConfirmDelete(
    (city: City) => deactivateCityMutation.mutate(city.id),
    (city: City) => `¿Está seguro de que desea desactivar la ciudad "${city.name}"?`
  );

  const handleDeletePort = useConfirmDelete(
    (port: Port) => deactivatePortMutation.mutate(port.id),
    (port: Port) => `¿Está seguro de que desea desactivar el puerto "${port.name}"?`
  );

  const filteredCities = useMemo(
    () =>
      cities.filter(
        (city) =>
          city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          city.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          city.code?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [cities, searchTerm]
  );

  const filteredPorts = useMemo(
    () =>
      ports.filter(
        (port) =>
          port.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          port.city?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          port.address?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [ports, searchTerm]
  );

  const paginatedCities = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCities.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCities, currentPage]);

  const paginatedPorts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPorts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPorts, currentPage]);

  const totalPages = Math.ceil(
    (activeTab === 'cities' ? filteredCities.length : filteredPorts.length) / ITEMS_PER_PAGE
  );
  const totalItems = activeTab === 'cities' ? filteredCities.length : filteredPorts.length;

  const isLoading = isLoadingCities || isLoadingPorts;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Columnas para Ciudades
  const cityColumns: Column<City>[] = [
    {
      key: 'name',
      header: 'Ciudad',
      accessor: (city) => (
        <div className="flex items-center gap-2.5">
          <MapPinIcon className="h-4 w-4 text-[#828282] shrink-0" strokeWidth={1.5} />
          <span className="font-medium">{city.name}</span>
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Código',
      accessor: (city) => city.code || '—',
    },
    {
      key: 'location',
      header: 'Ubicación',
      accessor: (city) =>
        [city.province, city.department].filter(Boolean).join(', ') || '—',
    },
    {
      key: 'ubigeo',
      header: 'Ubigeo',
      accessor: (city) => city.ubigeo || '—',
    },
    {
      key: 'status',
      header: 'Estado',
      accessor: (city) => <StatusBadge isActive={city.is_active} />,
    },
  ];

  // Columnas para Puertos
  const portColumns: Column<Port>[] = [
    {
      key: 'name',
      header: 'Puerto',
      accessor: (port) => (
        <div className="flex items-center gap-2.5">
          <MapPinIcon className="h-4 w-4 text-[#828282] shrink-0" strokeWidth={1.5} />
          <span className="font-medium">{port.name}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      accessor: (port) => PORT_TYPE_LABELS[port.port_type] || port.port_type,
    },
    {
      key: 'city',
      header: 'Ciudad',
      accessor: (port) => port.city?.name || '—',
    },
    {
      key: 'address',
      header: 'Dirección',
      accessor: (port) => (
        <span className="block max-w-[240px] truncate">{port.address || '—'}</span>
      ),
    },
    {
      key: 'ubigeo',
      header: 'Ubigeo',
      accessor: (port) => port.ubigeo || '—',
    },
    {
      key: 'status',
      header: 'Estado',
      accessor: (port) => <StatusBadge isActive={port.is_active} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-[32px] font-medium text-[#202020] tracking-[-0.64px] leading-[1.19]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Ciudades y Puertos
        </h1>
        <p className="mt-1 text-[15px] text-[#4d4d4d] leading-[1.33]">
          Gestión de ubicaciones geográficas del sistema fluvial
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#e8e8e8]">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('cities')}
            className={`pb-3 text-[15px] font-medium transition-colors border-b-2 ${
              activeTab === 'cities'
                ? 'text-[#202020] border-[#1F4690]'
                : 'text-[#828282] border-transparent hover:text-[#4d4d4d]'
            }`}
          >
            Ciudades
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-[12px] font-medium ${
                activeTab === 'cities'
                  ? 'bg-[#1F4690]/10 text-[#1F4690]'
                  : 'bg-[#f5f5f5] text-[#828282]'
              }`}
            >
              {cities.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('ports')}
            className={`pb-3 text-[15px] font-medium transition-colors border-b-2 ${
              activeTab === 'ports'
                ? 'text-[#202020] border-[#1F4690]'
                : 'text-[#828282] border-transparent hover:text-[#4d4d4d]'
            }`}
          >
            Puertos
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-[12px] font-medium ${
                activeTab === 'ports'
                  ? 'bg-[#1F4690]/10 text-[#1F4690]'
                  : 'bg-[#f5f5f5] text-[#828282]'
              }`}
            >
              {ports.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={`Buscar ${activeTab === 'cities' ? 'ciudades' : 'puertos'}...`}
          className="w-full sm:max-w-sm"
        />
        <button
          onClick={() => {
            if (activeTab === 'cities') {
              setEditingCity(undefined);
              setShowCityModal(true);
            } else {
              setEditingPort(undefined);
              setShowPortModal(true);
            }
          }}
          className="inline-flex items-center px-5 py-3 bg-[#1F4690] hover:bg-[#163672] text-white text-[15px] font-medium rounded-[20px] transition-colors shrink-0"
        >
          <PlusIcon className="h-5 w-5 mr-2" strokeWidth={1.5} />
          {activeTab === 'cities' ? 'Nueva Ciudad' : 'Nuevo Puerto'}
        </button>
      </div>

      {/* Tabla y Paginación */}
      {activeTab === 'cities' ? (
        <div className="space-y-2">
          <DataTable
            data={paginatedCities}
            columns={cityColumns}
            keyExtractor={(city) => city.id}
            onEdit={(city) => {
              setEditingCity(city);
              setShowCityModal(true);
            }}
            onDelete={handleDeleteCity}
            emptyMessage={
              searchTerm
                ? 'No se encontraron ciudades con ese criterio'
                : 'No hay ciudades registradas'
            }
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={totalItems}
            limit={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <DataTable
            data={paginatedPorts}
            columns={portColumns}
            keyExtractor={(port) => port.id}
            onEdit={(port) => {
              setEditingPort(port);
              setShowPortModal(true);
            }}
            onDelete={handleDeletePort}
            emptyMessage={
              searchTerm
                ? 'No se encontraron puertos con ese criterio'
                : 'No hay puertos registrados'
            }
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={totalItems}
            limit={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Modales */}
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
