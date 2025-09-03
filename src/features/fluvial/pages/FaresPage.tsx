// src/features/fluvial/pages/FaresPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, CurrencyDollarIcon, ArrowRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';
import { Pagination } from '../../../components/common/Pagination';
import { Fare, Port, ServiceCategory, FareType } from '../../../types';
import { useFares } from '../../../hooks/useFares';
// ===================================================================
// CAMBIO 1: Importar el hook correcto
// ===================================================================
import { usePortsData } from '../../../hooks/usePorts'; 
import { CreateFareData, UpdateFareData } from '../../../services/fareService';
import { routeHelpers } from '../../../services/routes.service'; // Importar para obtener companyId
// ===================================================================
// CAMBIO 2: Importar toast para notificaciones
// ===================================================================
import { toast } from 'react-toastify';

// ve el usuario. Varias opciones pueden mapear al mismo `value`.
const SERVICE_CATEGORIES: { value: ServiceCategory; label: string }[] = [
  { value: 'PASAJES', label: 'Romero Express' },
  { value: 'OTROS', label: 'Romero Cargo' }
];

// (Ya no usamos mapeos de categorías históricas)

const FARE_TYPES: { value: FareType; label: string }[] = [
  { value: 'FULL_ROUTE', label: 'Ruta Completa' },
  { value: 'PARTIAL_SEGMENT', label: 'Tramo Parcial' },
  { value: 'SPECIAL', label: 'Especial' }
];


interface FareFormData {
  origin_port_id: number;
  destination_port_id: number;
  service_category: ServiceCategory;
  price: number;
  currency_code: string;
  tax_category_code: string;
  description: string;
  fare_type: FareType;
  route_id?: number;
  effective_date: string;
  expiration_date?: string;
}

// El componente FareFormModal se mantiene igual, pero le pasaremos
// `isLoading` en lugar de `loading`.
const FareFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FareFormData) => Promise<void>;
  fare?: Fare;
  ports: Port[];
  isLoading?: boolean; // Cambiado de `loading` a `isLoading` por consistencia
}> = ({ isOpen, onClose, onSubmit, fare, ports, isLoading }) => {
  // ... (El contenido de FareFormModal no necesita cambios, solo el nombre de la prop) ...
  // Solo asegúrate de que donde usabas `loading` ahora uses `isLoading`
  const [formData, setFormData] = useState<FareFormData>({
    origin_port_id: fare?.origin_port_id || 0,
    destination_port_id: fare?.destination_port_id || 0,
  service_category: (fare?.service_category as ServiceCategory) || 'PASAJES',
    price: fare?.price || 0,
    currency_code: fare?.currency_code || 'PEN',
    tax_category_code: fare?.tax_category_code || '10',
    description: fare?.description || '',
    fare_type: fare?.fare_type || 'PARTIAL_SEGMENT',
    route_id: fare?.route_id,
    effective_date: fare?.effective_date || new Date().toISOString().split('T')[0],
    expiration_date: fare?.expiration_date || ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===================================================================
  // CAMBIO: Agregar useEffect para actualizar formData cuando cambie la tarifa
  // ===================================================================
  useEffect(() => {
    if (fare) {
      setFormData({
        origin_port_id: fare.origin_port_id,
        destination_port_id: fare.destination_port_id,
  service_category: fare.service_category as ServiceCategory,
        price: fare.price,
        currency_code: fare.currency_code,
        tax_category_code: fare.tax_category_code,
        description: fare.description || '',
        fare_type: fare.fare_type,
        route_id: fare.route_id,
        effective_date: fare.effective_date,
        expiration_date: fare.expiration_date || ''
      });
    } else {
      // Reset form when creating new fare
      setFormData({
        origin_port_id: 0,
        destination_port_id: 0,
        service_category: 'PASAJES',
        price: 0,
        currency_code: 'PEN',
        tax_category_code: '10',
        description: '',
        fare_type: 'PARTIAL_SEGMENT',
        route_id: undefined,
        effective_date: new Date().toISOString().split('T')[0],
        expiration_date: ''
      });
    }
  }, [fare]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
  await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la tarifa');
    } finally {
      setSubmitting(false);
    }
  };

  // ===================================================================
  // CAMBIO: Arreglar el problema del precio base
  // ===================================================================
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Si el valor está vacío o es solo un punto, permitir
    if (value === '' || value === '.') {
      setFormData({ ...formData, price: 0 });
      return;
    }
    
    // Convertir a número y validar
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFormData({ ...formData, price: numValue });
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={fare ? 'Editar Tarifa' : 'Nueva Tarifa'} maxWidth="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Puerto de Origen</label>
            <select
              value={formData.origin_port_id}
              onChange={(e) => setFormData({ ...formData, origin_port_id: parseInt(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
              disabled={isLoading || submitting}
            >
              <option value="">Seleccione puerto de origen</option>
              {ports.map((port) => (
                <option key={port.id} value={port.id}>
                  {port.name}
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
              disabled={isLoading || submitting}
            >
              <option value="">Seleccione puerto de destino</option>
              {ports.map((port) => (
                <option key={port.id} value={port.id}>
                  {port.name}
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
              disabled={submitting}
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
              disabled={submitting}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio Base</label>
            <input
              type="number"
              step="0.01"
              value={formData.price === 0 ? '' : formData.price}
              onChange={handlePriceChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
              disabled={submitting}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
            <select
              value={formData.currency_code}
              onChange={(e) => setFormData({ ...formData, currency_code: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={submitting}
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
              disabled={submitting}
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
          disabled={submitting}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha de Vigencia"
            type="date"
            value={formData.effective_date}
            onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
            required
            disabled={submitting}
          />
          <Input
            label="Fecha de Vencimiento"
            type="date"
            value={formData.expiration_date || ''}
            onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
            disabled={submitting}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting} isLoading={submitting}>
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // ===================================================================
  // CAMBIO 2: Usar el helper para obtener companyId de forma segura
  // ===================================================================
  const companyId = routeHelpers.getCurrentCompanyId();

  const initialFilters = useMemo(() => ({
    // Sin filtros adicionales, cargar todos los registros
  }), []);

  const { fares, loading: isLoadingFares, error: errorFares, createFare, updateFare, deactivateFare } = useFares(companyId, initialFilters);

  // ===================================================================
  // CAMBIO 3: Actualizar la llamada al hook de puertos
  // ===================================================================
  const { data: ports = [], isLoading: isLoadingPorts } = usePortsData();

  const [showFareModal, setShowFareModal] = useState(false);
  const [editingFare, setEditingFare] = useState<Fare | undefined>();
  
  // El resto de la lógica (enrichedFares, filteredFares, handlers, stats) funciona sin cambios.
  // Solo la forma en que se obtienen los datos iniciales ha sido actualizada.

  // ... (toda tu lógica de `enrichedFares`, `filteredFares`, `getServiceCategoryLabel`, etc., se mantiene igual) ...
  const enrichedFares = useMemo(() => {
    if (ports.length === 0) return fares; // Devolver tarifas sin enriquecer si los puertos aún no cargan
    
    return fares.map(fare => ({
      ...fare,
      origin_port: ports.find(p => p.id === fare.origin_port_id),
      destination_port: ports.find(p => p.id === fare.destination_port_id)
    }));
  }, [fares, ports]);

  const filteredFares = useMemo(() => {
    return enrichedFares.filter(fare => {
      // Filtrar solo tarifas activas
      if (!fare.is_active) return false;

      // Dividir el término de búsqueda en palabras
      const searchWords = searchTerm.toLowerCase().split(/\s+/).filter(word => word.length > 0);

      // Si no hay palabras de búsqueda, mostrar todas las tarifas activas
      if (searchWords.length === 0) return true;

      // Verificar que cada palabra de búsqueda coincida con al menos uno de los campos
      const matchesSearch = searchWords.every(word =>
        fare.description?.toLowerCase().includes(word) ||
        fare.origin_port?.name.toLowerCase().includes(word) ||
        fare.destination_port?.name.toLowerCase().includes(word)
      );

      // Si selectedCategory está vacío, pasar. Si el valor seleccionado es 'OTROS',
      // aceptamos tarifas cuyo service_category actual sea 'OTROS' o categorías históricas
      // como ENCOMIENDA_* / CARGA_*.
      let matchesCategory = false;
      if (selectedCategory === '') matchesCategory = true;
      else {
        matchesCategory = fare.service_category === selectedCategory;
      }

      return matchesSearch && matchesCategory;
    });
  }, [enrichedFares, searchTerm, selectedCategory]);

  // Lógica de paginación
  const totalPages = Math.ceil(filteredFares.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFares = filteredFares.slice(startIndex, endIndex);

  // Reset de página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const getServiceCategoryLabel = (category: ServiceCategory) => {
  return SERVICE_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const getFareTypeLabel = (type: FareType) => {
    return FARE_TYPES.find(t => t.value === type)?.label || type;
  };

  const handleCreateFare = async (data: FareFormData) => {
    try {
      const createData: CreateFareData = {
        ...data,
        company_id: companyId,
        is_active: true,
        expiration_date: data.expiration_date || undefined
      };
      await createFare(createData);
      toast.success('Tarifa creada exitosamente');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Error al crear la tarifa';
      toast.error(message);
      throw error; // Re-lanzar para que el modal maneje el error
    }
  };

  const handleUpdateFare = async (data: FareFormData) => {
    if (!editingFare) return;

    try {
      const updateData: UpdateFareData = {
        price: data.price,
        currency_code: data.currency_code,
        tax_category_code: data.tax_category_code,
        description: data.description,
        is_active: true, // =================================================================== CAMBIO: Agregar is_active: true
        expiration_date: data.expiration_date || null,
      };

      await updateFare(editingFare.id, updateData);
      toast.success('Tarifa actualizada exitosamente');
      setEditingFare(undefined);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Error al actualizar la tarifa';
      toast.error(message);
      throw error; // Re-lanzar para que el modal maneje el error
    }
  };

  const handleDeactivateFare = async (fareId: number) => {
    if (confirm('¿Está seguro de desactivar esta tarifa? La tarifa dejará de estar disponible para nuevas ventas, pero se conservará en el historial.')) {
      try {
        await deactivateFare(fareId);
        toast.success('Tarifa desactivada exitosamente');
      } catch (error: any) {
        console.error('Error al desactivar la tarifa:', error);
        const message = error.response?.data?.detail || 'No se pudo desactivar la tarifa. Intente de nuevo.';
        toast.error(message);
      }
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

  const stats = useMemo(() => {
    // Filtrar solo tarifas activas para las estadísticas
    const activeFares = fares.filter(f => f.is_active);
    
    return {
      total: activeFares.length,
      pasajes: activeFares.filter(f => f.service_category === 'PASAJES').length,
      encomiendas: activeFares.filter(f => f.service_category === 'OTROS').length,
      porVencer: activeFares.filter(f => isExpiringSoon(f.expiration_date)).length,
      vencidas: activeFares.filter(f => isExpired(f.expiration_date)).length
    };
  }, [fares]);
  
  // ===================================================================
  // CAMBIO 4: Actualizar la condición de carga
  // ===================================================================
  if (isLoadingFares || isLoadingPorts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  // El manejo de errores ya es compatible con useQuery
  if (errorFares) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          Error al cargar las tarifas: {errorFares}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ... El resto de tu JSX se mantiene exactamente igual ... */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Tarifas</h1>
          <p className="text-gray-600">Configura los precios base por tramo y categoría de servicio</p>
        </div>
      </div>

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
            className="rounded-md border-gray-300 shadow-sm p-2 pr-8 border"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            {paginatedFares.map((fare) => (
              <tr key={fare.id} className={`hover:bg-gray-50 ${!fare.is_active ? 'bg-gray-100 opacity-60' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 flex items-center">
                        <span>{fare.origin_port?.name || `Puerto ${fare.origin_port_id}`}</span>
                        <ArrowRightIcon className="h-4 w-4 mx-2 text-gray-400" />
                        <span>{fare.destination_port?.name || `Puerto ${fare.destination_port_id}`}</span>
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
                    !fare.is_active
                      ? 'bg-gray-200 text-gray-800'
                      : isExpired(fare.expiration_date)
                      ? 'bg-red-100 text-red-800'
                      : isExpiringSoon(fare.expiration_date)
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {!fare.is_active
                      ? 'Inactivo'
                      : isExpired(fare.expiration_date)
                      ? 'Vencido'
                      : isExpiringSoon(fare.expiration_date)
                      ? 'Por Vencer'
                      : 'Activo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        const fareToEdit = { ...fare, expiration_date: fare.expiration_date || '' };
                        setEditingFare(fareToEdit);
                        setShowFareModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="Editar tarifa"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    {fare.is_active && (
                      <button
                        onClick={() => handleDeactivateFare(fare.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Desactivar tarifa"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Información de paginación y controles */}
      {filteredFares.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          total={filteredFares.length}
          limit={itemsPerPage}
          onPageChange={setCurrentPage}
          loading={isLoadingFares}
        />
      )}

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

      {/* =================================================================== */}
      {/* CAMBIO 5: Pasar `isLoadingPorts` al modal */}
      {/* =================================================================== */}
      <FareFormModal
        isOpen={showFareModal}
        onClose={() => setShowFareModal(false)}
        onSubmit={editingFare ? handleUpdateFare : handleCreateFare}
        fare={editingFare}
        ports={ports}
        isLoading={isLoadingPorts}
      />
    </div>
  );
};