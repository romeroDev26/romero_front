// src/features/fluvial/pages/FaresByRoutePage.tsx
import React, { useState, useMemo } from 'react';
import { 
  MagnifyingGlassIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useFaresByRoute } from '../../../hooks/useFaresByRoute';
import { routeHelpers } from '../../../services/routes.service';
import { RouteSegmentFare, CreateFareData, UpdateFareData } from '../../../services/fareService';
import { ServiceCategory } from '../../../types';
import { toast } from '@/utils/sileo-toast';

const SERVICE_CATEGORIES: { value: ServiceCategory; label: string }[] = [
  { value: 'PASAJES', label: 'Express' },
  { value: 'OTROS', label: 'Cargo' }
];

interface EditingFare {
  segment: RouteSegmentFare;
  price: string;
  currency_code: string;
  tax_category_code: string;
}

export const FaresByRoutePage: React.FC = () => {
  const companyId = routeHelpers.getCurrentCompanyId();
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('PASAJES');
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFare, setEditingFare] = useState<EditingFare | null>(null);

  const { 
    routeGroupedFares, 
    isLoading, 
    error, 
    updateFare,
    createFare,
    isUpdating,
    isCreating 
  } = useFaresByRoute({
    company_id: companyId,
    service_category: selectedCategory,
    only_active_routes: true
  });

  // Filtrar rutas por término de búsqueda
  const filteredRoutes = useMemo(() => {
    if (!searchTerm) return routeGroupedFares;
    
    const searchLower = searchTerm.toLowerCase();
    return routeGroupedFares.filter(route =>
      route.route_name.toLowerCase().includes(searchLower) ||
      route.origin_port_name.toLowerCase().includes(searchLower) ||
      route.destination_port_name.toLowerCase().includes(searchLower)
    );
  }, [routeGroupedFares, searchTerm]);

  // Obtener la ruta seleccionada
  const selectedRoute = useMemo(() => {
    if (!selectedRouteId) return null;
    return routeGroupedFares.find(r => r.route_id === selectedRouteId) || null;
  }, [selectedRouteId, routeGroupedFares]);

  // Seleccionar automáticamente la primera ruta si hay resultados
  React.useEffect(() => {
    if (filteredRoutes.length > 0 && !selectedRouteId) {
      setSelectedRouteId(filteredRoutes[0].route_id);
    }
  }, [filteredRoutes, selectedRouteId]);

  const handleEditClick = (segment: RouteSegmentFare) => {
    setEditingFare({
      segment,
      price: segment.price?.toString() || '',
      currency_code: segment.currency_code || 'PEN',
      tax_category_code: segment.tax_category_code || '10'
    });
  };

  const handleSaveFare = async () => {
    if (!editingFare) return;

    const price = parseFloat(editingFare.price);
    if (isNaN(price) || price <= 0) {
      toast.error('Ingrese un precio válido');
      return;
    }

    try {
      if (editingFare.segment.fare_id) {
        // Actualizar tarifa existente
        const updateData: UpdateFareData = {
          price,
          currency_code: editingFare.currency_code,
          tax_category_code: editingFare.tax_category_code,
          is_active: true
        };
        await updateFare({ 
          fareId: editingFare.segment.fare_id, 
          data: updateData 
        });
        toast.success('Tarifa actualizada exitosamente');
      } else {
        // Crear nueva tarifa
        const createData: CreateFareData = {
          company_id: companyId,
          origin_port_id: editingFare.segment.origin_port_id,
          destination_port_id: editingFare.segment.destination_port_id,
          service_category: selectedCategory,
          price,
          currency_code: editingFare.currency_code,
          tax_category_code: editingFare.tax_category_code,
          description: editingFare.segment.label,
          fare_type: 'PARTIAL_SEGMENT',
          route_id: editingFare.segment.route_id,
          is_active: true,
          effective_date: new Date().toISOString().split('T')[0]
        };
        await createFare(createData);
        toast.success('Tarifa creada exitosamente');
      }
      setEditingFare(null);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Error al guardar la tarifa';
      toast.error(message);
    }
  };

  const handleCancelEdit = () => {
    setEditingFare(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-dm-text-secondary">Cargando tarifas por ruta...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          Error al cargar las tarifas: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <div>
          <h1 className="text-2xl font-bold text-dm-text-primary">Gestión de Tarifas</h1>
          <p className="text-dm-text-secondary">Configure los precios por parada y categoría de servicio</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-dm-text-muted" />
          </div>
          <input
            type="text"
            className="pl-10 block w-full rounded-md border-dm-border-primary shadow-sm p-2 border"
            placeholder="Buscar ruta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value as ServiceCategory);
            setSelectedRouteId(null);
          }}
          className="w-full sm:w-auto rounded-md border-dm-border-primary shadow-sm p-2 pr-8 border"
        >
          {SERVICE_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Routes List */}
        <div className="lg:col-span-1 bg-dm-bg-primary rounded-lg shadow-md overflow-hidden">
          <div className="bg-dm-bg-secondary px-4 py-3 border-b border-dm-border-primary">
            <h2 className="text-sm font-semibold text-dm-text-secondary">
              Rutas ({filteredRoutes.length})
            </h2>
          </div>
          <div className="divide-y divide-dm-border-primary max-h-[300px] lg:max-h-[calc(100vh-300px)] overflow-y-auto">
            {filteredRoutes.length === 0 ? (
              <div className="p-4 text-center text-dm-text-muted">
                No se encontraron rutas
              </div>
            ) : (
              filteredRoutes.map((route) => (
                <button
                  key={route.route_id}
                  onClick={() => setSelectedRouteId(route.route_id)}
                  className={`w-full text-left px-4 py-3 hover:bg-dm-bg-hover transition-colors ${
                    selectedRouteId === route.route_id ? 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="font-medium text-dm-text-primary text-sm mb-1">
                    {route.route_name}
                  </div>
                  <div className="text-xs text-dm-text-muted flex items-center">
                    <span>{route.origin_port_name}</span>
                    <ArrowRightIcon className="h-3 w-3 mx-1" />
                    <span>{route.destination_port_name}</span>
                  </div>
                  <div className="text-xs text-dm-text-muted mt-1">
                    {route.segments.filter(s => s.price !== null).length} / {route.segments.length} con precio
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Fares Content */}
        <div className="lg:col-span-3 bg-dm-bg-primary rounded-lg shadow-md overflow-hidden">
          {selectedRoute ? (
            <>
              <div className="bg-dm-bg-secondary px-6 py-4 border-b border-dm-border-primary">
                <h2 className="text-lg font-semibold text-dm-text-primary">
                  {selectedRoute.route_name}
                </h2>
                <p className="text-sm text-dm-text-secondary mt-1">
                  Tarifas desde {selectedRoute.origin_port_name}
                </p>
              </div>
              
              {/* Mobile Card View for Fares */}
              <div className="block lg:hidden p-4 space-y-4">
                {selectedRoute.segments.map((segment) => {
                  const isEditing = editingFare?.segment.stop_order === segment.stop_order;
                  
                  return (
                    <div key={segment.stop_order} className="bg-dm-bg-primary border border-dm-border-primary rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-xs font-medium text-dm-text-muted uppercase">Destino</span>
                          <div className="text-base font-medium text-dm-text-primary">{segment.to_port_name}</div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-dm-bg-secondary text-dm-text-primary">
                          Orden: {segment.stop_order}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-dm-text-muted mb-1">Precio</label>
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editingFare.price}
                              onChange={(e) => setEditingFare({ ...editingFare, price: e.target.value })}
                              className="w-full p-2 border border-dm-border-primary rounded-md text-sm"
                              placeholder="0.00"
                            />
                          ) : (
                            <div className="flex items-center text-sm">
                              {segment.price !== null ? (
                                <>
                                  <CurrencyDollarIcon className="h-4 w-4 text-green-500 mr-1" />
                                  <span className="font-medium text-dm-text-primary">{segment.price.toFixed(2)}</span>
                                </>
                              ) : (
                                <span className="text-dm-text-muted italic">Sin precio</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-dm-text-muted mb-1">Moneda</label>
                            {isEditing ? (
                              <select
                                value={editingFare.currency_code}
                                onChange={(e) => setEditingFare({ ...editingFare, currency_code: e.target.value })}
                                className="w-full p-2 border border-dm-border-primary rounded-md text-sm"
                              >
                                <option value="PEN">PEN</option>
                                <option value="USD">USD</option>
                              </select>
                            ) : (
                              <span className="text-sm text-dm-text-primary">{segment.currency_code || '-'}</span>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-dm-text-muted mb-1">IGV</label>
                            {isEditing ? (
                              <select
                                value={editingFare.tax_category_code}
                                onChange={(e) => setEditingFare({ ...editingFare, tax_category_code: e.target.value })}
                                className="w-full p-2 border border-dm-border-primary rounded-md text-sm"
                              >
                                <option value="10">Gravado</option>
                                <option value="20">Exonerado</option>
                                <option value="30">Inafecto</option>
                              </select>
                            ) : (
                              <span className="text-sm text-dm-text-primary">
                                {segment.tax_category_code === '10' && 'Gravado'}
                                {segment.tax_category_code === '20' && 'Exonerado'}
                                {segment.tax_category_code === '30' && 'Inafecto'}
                                {!segment.tax_category_code && '-'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-dm-border-secondary flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={handleCancelEdit}
                              disabled={isUpdating || isCreating}
                              className="flex items-center px-3 py-1.5 border border-dm-border-primary rounded text-sm font-medium text-dm-text-secondary bg-dm-bg-primary hover:bg-dm-bg-hover"
                            >
                              <XMarkIcon className="h-4 w-4 mr-1" /> Cancelar
                            </button>
                            <button
                              onClick={handleSaveFare}
                              disabled={isUpdating || isCreating}
                              className="flex items-center px-3 py-1.5 border border-transparent rounded text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                            >
                              <CheckIcon className="h-4 w-4 mr-1" /> Guardar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEditClick(segment)}
                            className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-300 text-sm font-medium"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" /> Editar Tarifa
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-dm-border-primary">
                  <thead className="bg-dm-bg-secondary">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                        Orden
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                        Puerto de Destino
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                        Moneda
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                        IGV
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-dm-bg-primary divide-y divide-dm-border-primary">
                    {selectedRoute.segments.map((segment) => {
                      const isEditing = editingFare?.segment.stop_order === segment.stop_order;
                      
                      return (
                        <tr key={segment.stop_order} className="hover:bg-dm-bg-hover">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-dm-text-muted">
                            {segment.stop_order}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-dm-text-primary">
                              {segment.to_port_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editingFare.price}
                                onChange={(e) => setEditingFare({ ...editingFare, price: e.target.value })}
                                className="w-24 p-1 border border-dm-border-primary rounded-md text-sm"
                                placeholder="0.00"
                                autoFocus
                              />
                            ) : segment.price !== null ? (
                              <div className="flex items-center">
                                <CurrencyDollarIcon className="h-4 w-4 text-green-500 mr-1" />
                                <span className="font-medium text-dm-text-primary">
                                  {segment.price.toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-dm-text-muted italic text-sm">Sin precio</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <select
                                value={editingFare.currency_code}
                                onChange={(e) => setEditingFare({ ...editingFare, currency_code: e.target.value })}
                                className="w-20 p-1 border border-dm-border-primary rounded-md text-sm"
                              >
                                <option value="PEN">PEN</option>
                                <option value="USD">USD</option>
                              </select>
                            ) : (
                              <span className="text-sm text-dm-text-secondary">
                                {segment.currency_code || '-'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <select
                                value={editingFare.tax_category_code}
                                onChange={(e) => setEditingFare({ ...editingFare, tax_category_code: e.target.value })}
                                className="w-24 p-1 border border-dm-border-primary rounded-md text-sm"
                              >
                                <option value="10">Gravado</option>
                                <option value="20">Exonerado</option>
                                <option value="30">Inafecto</option>
                              </select>
                            ) : (
                              <span className="text-sm text-dm-text-secondary">
                                {segment.tax_category_code === '10' && 'Gravado'}
                                {segment.tax_category_code === '20' && 'Exonerado'}
                                {segment.tax_category_code === '30' && 'Inafecto'}
                                {!segment.tax_category_code && '-'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {isEditing ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={handleSaveFare}
                                  disabled={isUpdating || isCreating}
                                  className="text-green-600 dark:text-green-400 hover:text-green-900 disabled:opacity-50"
                                  title="Guardar"
                                >
                                  <CheckIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  disabled={isUpdating || isCreating}
                                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:text-red-200 disabled:opacity-50"
                                  title="Cancelar"
                                >
                                  <XMarkIcon className="h-5 w-5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditClick(segment)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900"
                                title="Editar tarifa"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <CurrencyDollarIcon className="mx-auto h-12 w-12 text-dm-text-muted" />
              <h3 className="mt-2 text-sm font-medium text-dm-text-primary">
                Seleccione una ruta
              </h3>
              <p className="mt-1 text-sm text-dm-text-muted">
                Elija una ruta de la lista para ver y editar sus tarifas
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
