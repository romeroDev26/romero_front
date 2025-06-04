// src/features/fluvial/pages/FaresPage.tsx
import React, { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, CurrencyDollarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';
import { Fare, Port, City, ServiceCategory, FareType } from '../../../types';

// Datos estáticos simulados (consistentes con otros componentes)
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

const FARES_DATA: (Fare & { origin_port?: Port; destination_port?: Port })[] = [
  {
    id: 1,
    company_id: 1,
    origin_port_id: 1,
    destination_port_id: 2,
    origin_port: PORTS_DATA[0],
    destination_port: PORTS_DATA[1],
    service_category: 'PASAJES',
    price: 85.00,
    currency_code: 'PEN',
    tax_category_code: '10',
    description: 'Tarifa estándar Iquitos-Nauta',
    fare_type: 'PARTIAL_SEGMENT',
    route_id: 1,
    is_active: true,
    effective_date: '2025-01-01',
    expiration_date: '2025-12-31',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 2,
    company_id: 1,
    origin_port_id: 2,
    destination_port_id: 3,
    origin_port: PORTS_DATA[1],
    destination_port: PORTS_DATA[2],
    service_category: 'PASAJES',
    price: 95.00,
    currency_code: 'PEN',
    tax_category_code: '10',
    description: 'Tarifa estándar Nauta-Yurimaguas',
    fare_type: 'PARTIAL_SEGMENT',
    route_id: 1,
    is_active: true,
    effective_date: '2025-01-01',
    expiration_date: '2025-12-31',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 3,
    company_id: 1,
    origin_port_id: 1,
    destination_port_id: 3,
    origin_port: PORTS_DATA[0],
    destination_port: PORTS_DATA[2],
    service_category: 'PASAJES',
    price: 160.00,
    currency_code: 'PEN',
    tax_category_code: '10',
    description: 'Tarifa completa Iquitos-Yurimaguas',
    fare_type: 'FULL_ROUTE',
    route_id: 1,
    is_active: true,
    effective_date: '2025-01-01',
    expiration_date: '2025-12-31',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 4,
    company_id: 1,
    origin_port_id: 3,
    destination_port_id: 4,
    origin_port: PORTS_DATA[2],
    destination_port: PORTS_DATA[3],
    service_category: 'PASAJES',
    price: 110.00,
    currency_code: 'PEN',
    tax_category_code: '10',
    description: 'Tarifa Yurimaguas-Contamana',
    fare_type: 'PARTIAL_SEGMENT',
    route_id: 2,
    is_active: true,
    effective_date: '2025-01-01',
    expiration_date: '2025-12-31',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 5,
    company_id: 1,
    origin_port_id: 4,
    destination_port_id: 5,
    origin_port: PORTS_DATA[3],
    destination_port: PORTS_DATA[4],
    service_category: 'PASAJES',
    price: 120.00,
    currency_code: 'PEN',
    tax_category_code: '10',
    description: 'Tarifa Contamana-Pucallpa',
    fare_type: 'PARTIAL_SEGMENT',
    route_id: 2,
    is_active: true,
    effective_date: '2025-01-01',
    expiration_date: '2025-12-31',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 6,
    company_id: 1,
    origin_port_id: 1,
    destination_port_id: 2,
    origin_port: PORTS_DATA[0],
    destination_port: PORTS_DATA[1],
    service_category: 'ENCOMIENDA_PEQUENA',
    price: 15.00,
    currency_code: 'PEN',
    tax_category_code: '10',
    description: 'Encomienda pequeña Iquitos-Nauta',
    fare_type: 'PARTIAL_SEGMENT',
    is_active: true,
    effective_date: '2025-01-01',
    expiration_date: '2025-12-31',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 7,
    company_id: 1,
    origin_port_id: 2,
    destination_port_id: 3,
    origin_port: PORTS_DATA[1],
    destination_port: PORTS_DATA[2],
    service_category: 'ENCOMIENDA_MEDIANA',
    price: 25.00,
    currency_code: 'PEN',
    tax_category_code: '10',
    description: 'Encomienda mediana Nauta-Yurimaguas',
    fare_type: 'PARTIAL_SEGMENT',
    is_active: true,
    effective_date: '2025-01-01',
    expiration_date: '2025-07-15',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 8,
    company_id: 1,
    origin_port_id: 3,
    destination_port_id: 5,
    origin_port: PORTS_DATA[2],
    destination_port: PORTS_DATA[4],
    service_category: 'CARGA_GENERAL_KGM',
    price: 2.50,
    currency_code: 'PEN',
    tax_category_code: '10',
    description: 'Carga general por kilogramo Yurimaguas-Pucallpa',
    fare_type: 'PARTIAL_SEGMENT',
    is_active: true,
    effective_date: '2025-01-01',
    expiration_date: '2025-06-30',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

const SERVICE_CATEGORIES: { value: ServiceCategory; label: string }[] = [
  { value: 'PASAJES', label: 'Pasajes' },
  { value: 'ENCOMIENDA_PEQUENA', label: 'Encomienda Pequeña' },
  { value: 'ENCOMIENDA_MEDIANA', label: 'Encomienda Mediana' },
  { value: 'ENCOMIENDA_GRANDE', label: 'Encomienda Grande' },
  { value: 'CARGA_GENERAL_KGM', label: 'Carga General (kg)' },
  { value: 'CARGA_GENERAL_VOL', label: 'Carga General (m³)' },
  { value: 'OTROS', label: 'Otros' }
];

const FARE_TYPES: { value: FareType; label: string }[] = [
  { value: 'FULL_ROUTE', label: 'Ruta Completa' },
  { value: 'PARTIAL_SEGMENT', label: 'Tramo Parcial' },
  { value: 'SPECIAL', label: 'Especial' }
];

// Formulario de tarifas
interface FareFormData {
  origin_port_id: number;
  destination_port_id: number;
  service_category: ServiceCategory;
  price: number;
  currency_code: string;
  tax_category_code: string;
  description: string;
  fare_type: FareType;
  effective_date: string;
  expiration_date: string;
}

const FareFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FareFormData) => void;
  fare?: Fare;
  ports: Port[];
}> = ({ isOpen, onClose, onSubmit, fare, ports }) => {
  const [formData, setFormData] = useState<FareFormData>({
    origin_port_id: fare?.origin_port_id || 0,
    destination_port_id: fare?.destination_port_id || 0,
    service_category: fare?.service_category || 'PASAJES',
    price: fare?.price || 0,
    currency_code: fare?.currency_code || 'PEN',
    tax_category_code: fare?.tax_category_code || '10',
    description: fare?.description || '',
    fare_type: fare?.fare_type || 'PARTIAL_SEGMENT',
    effective_date: fare?.effective_date || new Date().toISOString().split('T')[0],
    expiration_date: fare?.expiration_date || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={fare ? 'Editar Tarifa' : 'Nueva Tarifa'} maxWidth="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría de Servicio</label>
            <select
              value={formData.service_category}
              onChange={(e) => setFormData({ ...formData, service_category: e.target.value as ServiceCategory })}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              {SERVICE_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Tarifa</label>
            <select
              value={formData.fare_type}
              onChange={(e) => setFormData({ ...formData, fare_type: e.target.value as FareType })}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              {FARE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Precio Base (S/)"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
            <select
              value={formData.currency_code}
              onChange={(e) => setFormData({ ...formData, currency_code: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="PEN">PEN - Soles</option>
              <option value="USD">USD - Dólares</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría IGV</label>
            <select
              value={formData.tax_category_code}
              onChange={(e) => setFormData({ ...formData, tax_category_code: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="10">10 - Gravado</option>
              <option value="20">20 - Exonerado</option>
              <option value="30">30 - Inafecto</option>
            </select>
          </div>
        </div>

        <Input
          label="Descripción"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha de Vigencia"
            type="date"
            value={formData.effective_date}
            onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
            required
          />
          <Input
            label="Fecha de Vencimiento"
            type="date"
            value={formData.expiration_date}
            onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            {fare ? 'Actualizar' : 'Crear'} Tarifa
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export const FaresPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [fares, setFares] = useState<(Fare & { origin_port?: Port; destination_port?: Port })[]>(FARES_DATA);
  
  // Estados para modales
  const [showFareModal, setShowFareModal] = useState(false);
  const [editingFare, setEditingFare] = useState<Fare | undefined>();

  // Filtrar tarifas según búsqueda y categoría
  const filteredFares = fares.filter(fare => {
    const matchesSearch = 
      fare.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fare.origin_port?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fare.destination_port?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fare.origin_port?.city?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fare.destination_port?.city?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || fare.service_category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getServiceCategoryLabel = (category: ServiceCategory) => {
    return SERVICE_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const getFareTypeLabel = (type: FareType) => {
    return FARE_TYPES.find(t => t.value === type)?.label || type;
  };

  const handleCreateFare = (data: FareFormData) => {
    const originPort = PORTS_DATA.find(p => p.id === data.origin_port_id);
    const destinationPort = PORTS_DATA.find(p => p.id === data.destination_port_id);
    
    const newFare = {
      id: Math.max(...fares.map(f => f.id)) + 1,
      ...data,
      company_id: 1,
      origin_port: originPort,
      destination_port: destinationPort,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setFares([...fares, newFare]);
    console.log('Tarifa creada:', newFare);
  };

  const handleUpdateFare = (data: FareFormData) => {
    if (!editingFare) return;
    
    const originPort = PORTS_DATA.find(p => p.id === data.origin_port_id);
    const destinationPort = PORTS_DATA.find(p => p.id === data.destination_port_id);
    
    const updatedFares = fares.map(fare =>
      fare.id === editingFare.id
        ? { 
            ...fare, 
            ...data, 
            origin_port: originPort,
            destination_port: destinationPort,
            updated_at: new Date().toISOString() 
          }
        : fare
    );
    setFares(updatedFares);
    setEditingFare(undefined);
    console.log('Tarifa actualizada:', data);
  };

  const handleDeleteFare = (fareId: number) => {
    if (confirm('¿Está seguro de eliminar esta tarifa?')) {
      setFares(fares.filter(fare => fare.id !== fareId));
      console.log('Tarifa eliminada:', fareId);
    }
  };

  const isExpiringSoon = (expirationDate: string | undefined) => {
    if (!expirationDate) return false;
    const expDate = new Date(expirationDate);
    const today = new Date();
    const daysUntilExpiration = (expDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
    return daysUntilExpiration <= 30 && daysUntilExpiration > 0;
  };

  const isExpired = (expirationDate: string | undefined) => {
    if (!expirationDate) return false;
    const expDate = new Date(expirationDate);
    const today = new Date();
    return expDate < today;
  };

  // Calcular estadísticas
  const stats = {
    total: fares.length,
    pasajes: fares.filter(f => f.service_category === 'PASAJES').length,
    encomiendas: fares.filter(f => f.service_category.includes('ENCOMIENDA')).length,
    porVencer: fares.filter(f => isExpiringSoon(f.expiration_date)).length,
    vencidas: fares.filter(f => isExpired(f.expiration_date)).length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Tarifas</h1>
          <p className="text-gray-600">Configura los precios base por tramo y categoría de servicio</p>
        </div>
      </div>

      {/* Filtros y acciones */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4 flex-grow">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              placeholder="Buscar tarifas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm p-2 border"
          >
            <option value="">Todas las categorías</option>
            {SERVICE_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        
        <Button
          onClick={() => {
            setEditingFare(undefined);
            setShowFareModal(true);
          }}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Tarifa
        </Button>
      </div>

      {/* Resumen de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tarifas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pasajes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pasajes}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Encomiendas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.encomiendas}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Por Vencer</p>
              <p className="text-2xl font-bold text-gray-900">{stats.porVencer}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vencidas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.vencidas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de tarifas */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tramo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio Base
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vigencia
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
            {filteredFares.map((fare) => (
              <tr key={fare.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 flex items-center">
                        <span>{fare.origin_port?.city?.name}</span>
                        <ArrowRightIcon className="h-4 w-4 mx-2 text-gray-400" />
                        <span>{fare.destination_port?.city?.name}</span>
                      </div>
                      <div className="text-gray-500 text-xs">
                        {fare.origin_port?.name} → {fare.destination_port?.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {getServiceCategoryLabel(fare.service_category)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getFareTypeLabel(fare.fare_type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-4 w-4 text-green-500 mr-1" />
                    <span className="font-medium text-gray-900">
                      {fare.currency_code === 'PEN' ? 'S/ ' : '$ '}
                      {fare.price.toFixed(2)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>
                    <div>Desde: {fare.effective_date}</div>
                    {fare.expiration_date && (
                      <div className={isExpired(fare.expiration_date) ? 'text-red-600' : isExpiringSoon(fare.expiration_date) ? 'text-orange-600' : ''}>
                        Hasta: {fare.expiration_date}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    isExpired(fare.expiration_date) 
                      ? 'bg-red-100 text-red-800'
                      : isExpiringSoon(fare.expiration_date)
                      ? 'bg-yellow-100 text-yellow-800'
                      : fare.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isExpired(fare.expiration_date) 
                      ? 'Vencido'
                      : isExpiringSoon(fare.expiration_date)
                      ? 'Por Vencer'
                      : fare.is_active 
                      ? 'Activo' 
                      : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingFare(fare);
                        setShowFareModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="Editar tarifa"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFare(fare.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Eliminar tarifa"
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

      {filteredFares.length === 0 && (
        <div className="text-center py-12">
          <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tarifas</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedCategory 
              ? 'No se encontraron tarifas que coincidan con los filtros' 
              : 'Comience agregando una nueva tarifa'}
          </p>
        </div>
      )}

      {/* Modal */}
      <FareFormModal
        isOpen={showFareModal}
        onClose={() => setShowFareModal(false)}
        onSubmit={editingFare ? handleUpdateFare : handleCreateFare}
        fare={editingFare}
        ports={PORTS_DATA}
      />
    </div>
  );
};