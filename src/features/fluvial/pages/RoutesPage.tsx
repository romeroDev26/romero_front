// src/features/fluvial/pages/RoutesPage.tsx
import React, { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, MapIcon, ClockIcon, PlusCircleIcon, MinusCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';
import { DataTable, Column, useConfirmDelete } from '../../../components/common/DataTable';
import { Route, RouteStop, Port, City } from '../../../types';
import { usePorts } from '../../../hooks/useCitiesPortsData';
import {
  useRoutes,
  useRoute,
  useCreateRoute,
  useUpdateRoute,
  useDeleteRoute,
  useUpdateRouteStops
} from '../hooks/useVesselsRoutesData';
import {
  RouteCreateData,
  RouteUpdateData,
  RouteStopCreateData,
  RouteWithStops,
  routeHelpers,
  routeValidations
} from '../../../services/routes.service';

// ========================================
// FORMULARIO PARA RUTAS
// ========================================
interface RouteFormProps {
  isOpen: boolean;
  onClose: () => void;
  route?: Route;
}

const RouteFormModal: React.FC<RouteFormProps> = ({ isOpen, onClose, route }) => {
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();
  const { data: ports = [] } = usePorts();
  
  const [formData, setFormData] = useState<RouteUpdateData>({
    name: '',
    origin_port_id: 0,
    destination_port_id: 0,
    estimated_duration_hours: 0,
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (route) {
      setFormData({
        name: route.name,
        origin_port_id: route.origin_port_id,
        destination_port_id: route.destination_port_id,
        estimated_duration_hours: route.estimated_duration_hours || 0,
        is_active: route.is_active
      });
    } else {
      setFormData({
        name: '',
        origin_port_id: 0,
        destination_port_id: 0,
        estimated_duration_hours: 0,
        is_active: true
      });
    }
    setErrors({});
  }, [route, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'El nombre de la ruta es requerido';
    }
    
    if (!formData.origin_port_id) {
      newErrors.origin_port_id = 'Debe seleccionar un puerto de origen';
    }
    
    if (!formData.destination_port_id) {
      newErrors.destination_port_id = 'Debe seleccionar un puerto de destino';
    }
    
    const portError = routeValidations.validatePorts(
      formData.origin_port_id || 0,
      formData.destination_port_id || 0
    );
    if (portError) {
      newErrors.ports = portError;
    }
    
    if ((formData.estimated_duration_hours || 0) <= 0) {
      newErrors.duration = 'La duración debe ser mayor a 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (route) {
        await updateRoute.mutateAsync({ id: route.id, data: formData });
      } else {
        // Para nueva ruta, crear con paradas básicas
        const createData: RouteCreateData = {
          ...formData as Required<RouteUpdateData>,
          stops: routeHelpers.generateBasicStops(
            formData.origin_port_id!,
            formData.destination_port_id!
          ),
          company_id: 0
        };
        // Actualizar duración de la última parada
        if (createData.stops && createData.stops.length > 0) {
          createData.stops[createData.stops.length - 1].estimated_duration_from_origin = 
            routeHelpers.hoursToTimeString(formData.estimated_duration_hours || 0);
        }
          
        await createRoute.mutateAsync(createData);
      }
      onClose();
    } catch (error) {
      // Los errores ya se manejan en los hooks
    }
  };

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={route ? 'Editar Ruta' : 'Nueva Ruta'} 
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Input
          label="Nombre de la Ruta"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          placeholder="Ej: Ruta Iquitos - Yurimaguas Express"
          required
        />
        
        {errors.ports && (
          <div className="text-sm text-red-600">{errors.ports}</div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Puerto de Origen *
            </label>
            <select
              value={formData.origin_port_id}
              onChange={(e) => setFormData({ ...formData, origin_port_id: parseInt(e.target.value) })}
              className={`w-full p-2 border rounded-md ${
                errors.origin_port_id ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Seleccione puerto de origen</option>
              {ports.map((port) => (
                <option key={port.id} value={port.id}>
                  {port.name} ({port.city?.name})
                </option>
              ))}
            </select>
            {errors.origin_port_id && (
              <p className="mt-1 text-sm text-red-600">{errors.origin_port_id}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Puerto de Destino *
            </label>
            <select
              value={formData.destination_port_id}
              onChange={(e) => setFormData({ ...formData, destination_port_id: parseInt(e.target.value) })}
              className={`w-full p-2 border rounded-md ${
                errors.destination_port_id ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Seleccione puerto de destino</option>
              {ports.map((port) => (
                <option key={port.id} value={port.id}>
                  {port.name} ({port.city?.name})
                </option>
              ))}
            </select>
            {errors.destination_port_id && (
              <p className="mt-1 text-sm text-red-600">{errors.destination_port_id}</p>
            )}
          </div>
        </div>

        <Input
          label="Duración Estimada (horas)"
          type="number"
          step="0.5"
          value={formData.estimated_duration_hours}
          onChange={(e) => setFormData({ ...formData, estimated_duration_hours: parseFloat(e.target.value) || 0 })}
          error={errors.duration}
          min="0.5"
          required
        />

        <div className="flex items-center gap-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="mr-2"
            />
            Ruta activa
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="submit"
            isLoading={createRoute.isPending || updateRoute.isPending}
          >
            {route ? 'Actualizar' : 'Crear'} Ruta
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ========================================
// FORMULARIO PARA PARADAS
// ========================================
interface RouteStopsModalProps {
  isOpen: boolean;
  onClose: () => void;
  route?: RouteWithStops;
}

const RouteStopsModal: React.FC<RouteStopsModalProps> = ({ isOpen, onClose, route }) => {
  const updateRouteStops = useUpdateRouteStops();
  const { data: ports = [] } = usePorts();
  
  const [stops, setStops] = useState<RouteStopCreateData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (route?.route_stops && route.route_stops.length > 0) {
      setStops(
        route.route_stops.map(stop => ({
          port_id: stop.port_id,
          stop_order: stop.stop_order,
          estimated_duration_from_origin: stop.estimated_duration_from_origin || '00:00:00',
          is_boarding_allowed: stop.is_boarding_allowed,
          is_disembarking_allowed: stop.is_disembarking_allowed,
          notes: stop.notes || ''
        }))
      );
    } else if (route) {
      // Generar paradas básicas si no hay paradas
      setStops(routeHelpers.generateBasicStops(
        route.origin_port_id,
        route.destination_port_id
      ));
    }
    setErrors([]);
  }, [route, isOpen]);

  const addStop = () => {
    const nextOrder = Math.max(...stops.map(s => s.stop_order)) + 1;
    setStops([...stops, { 
      port_id: 0, 
      stop_order: nextOrder, 
      estimated_duration_from_origin: '00:00:00',
      is_boarding_allowed: true, 
      is_disembarking_allowed: true, 
      notes: '' 
    }]);
  };

  const removeStop = (index: number) => {
    const newStops = stops.filter((_, i) => i !== index);
    // Reordenar stops
    newStops.forEach((stop, i) => {
      stop.stop_order = i + 1;
    });
    setStops(newStops);
  };

  const updateStop = (index: number, field: keyof RouteStopCreateData, value: any) => {
    const newStops = [...stops];
    
    if (field === 'estimated_duration_from_origin' && typeof value === 'object') {
      // Convertir horas y minutos a formato HH:MM:SS
      const hours = value.hours || 0;
      const minutes = value.minutes || 0;
      newStops[index] = {
        ...newStops[index],
        estimated_duration_from_origin: routeHelpers.hoursToTimeString(hours + minutes / 60)
      };
    } else {
      newStops[index] = { ...newStops[index], [field]: value };
    }
    
    setStops(newStops);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!route) return;
    
    const validationErrors = routeValidations.validateStops(
      stops,
      route.origin_port_id,
      route.destination_port_id
    );
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await updateRouteStops.mutateAsync({ 
        routeId: route.id, 
        stops 
      });
      onClose();
    } catch (error) {
      // Los errores ya se manejan en el hook
    }
  };

  if (!isOpen || !route) return null;

  // Parsear duración para mostrar en campos separados
  const parseDuration = (duration: string) => {
    const hours = routeHelpers.timeStringToHours(duration);
    return {
      hours: Math.floor(hours),
      minutes: Math.round((hours % 1) * 60)
    };
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Paradas de Ruta - ${route.name}`} 
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
          {stops.map((stop, index) => {
            const duration = parseDuration(stop.estimated_duration_from_origin || '00:00:00');
            return (
              <div key={index} className="grid grid-cols-7 gap-4 items-end p-4 border border-gray-200 rounded-lg">
                <div className="col-span-2">
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
                        {port.name} ({port.city?.name})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                  <input
                    type="number"
                    value={stop.stop_order}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horas</label>
                  <input
                    type="number"
                    value={duration.hours}
                    onChange={(e) => updateStop(index, 'estimated_duration_from_origin', {
                      hours: parseInt(e.target.value) || 0,
                      minutes: duration.minutes
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minutos</label>
                  <input
                    type="number"
                    value={duration.minutes}
                    onChange={(e) => updateStop(index, 'estimated_duration_from_origin', {
                      hours: duration.hours,
                      minutes: parseInt(e.target.value) || 0
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    min="0"
                    max="59"
                  />
                </div>
                
                <div>
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={stop.is_boarding_allowed}
                      onChange={(e) => updateStop(index, 'is_boarding_allowed', e.target.checked)}
                      className="mr-1"
                    />
                    Embarque
                  </label>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={stop.is_disembarking_allowed}
                      onChange={(e) => updateStop(index, 'is_disembarking_allowed', e.target.checked)}
                      className="mr-1"
                    />
                    Desemb.
                  </label>
                  
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => removeStop(index)}
                    disabled={stops.length <= 2}
                    className="ml-auto"
                  >
                    <MinusCircleIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
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
            <Button 
              type="submit"
              isLoading={updateRouteStops.isPending}
            >
              Guardar Paradas
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
export const RoutesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  
  // Estados para modales
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showStopsModal, setShowStopsModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | undefined>();
  const [configuringRouteId, setConfiguringRouteId] = useState<number | null>(null);

  // Queries y mutations
  const { data: routes = [], isLoading: routesLoading, error: routesError } = useRoutes(showOnlyActive);
  const { data: configuringRoute } = useRoute(configuringRouteId);
  const deleteRoute = useDeleteRoute();

  // Confirmación de eliminación
  const handleDeleteRoute = useConfirmDelete(
    (route: Route) => deleteRoute.mutate(route.id),
    (route: Route) => `¿Está seguro de desactivar la ruta ${route.name}? Esta acción puede afectar viajes programados.`
  );

  // Filtrar rutas según búsqueda
  const filteredRoutes = routes.filter(route =>
    route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.origin_port?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.destination_port?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Columnas para la tabla
  const routeColumns: Column<Route>[] = [
    {
      key: 'name',
      header: 'Ruta',
      accessor: (route) => (
        <div className="flex items-center">
          <MapIcon className="h-5 w-5 text-blue-500 mr-3" />
          <div className="font-medium text-gray-900">{route.name}</div>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Origen → Destino',
      accessor: (route) => (
        <div>
          <div className="flex items-center text-sm">
            <span className="font-medium">{route.origin_port?.city?.name}</span>
            <span className="mx-2">→</span>
            <span className="font-medium">{route.destination_port?.city?.name}</span>
          </div>
          <div className="text-xs text-gray-400">
            {route.origin_port?.name} → {route.destination_port?.name}
          </div>
        </div>
      ),
    },
    {
      key: 'duration',
      header: 'Duración',
      accessor: (route) => (
        <div className="flex items-center text-sm text-gray-500">
          <ClockIcon className="h-4 w-4 mr-1" />
          {route.estimated_duration_hours || 0}h
        </div>
      ),
    },
    {
      key: 'stops',
      header: 'Paradas',
      accessor: (route) => {
        const stopCount = (route as RouteWithStops).route_stops?.length || 0;
        return <span className="text-sm text-gray-500">{stopCount} paradas</span>;
      },
    },
    {
      key: 'status',
      header: 'Estado',
      accessor: (route) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          route.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {route.is_active ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ];

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
        <div className="flex gap-4 items-center flex-grow">
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
            setEditingRoute(undefined);
            setShowRouteModal(true);
          }}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Ruta
        </Button>
      </div>

      {/* Tabla de rutas con botón de configurar paradas */}
      <DataTable
        data={filteredRoutes}
        columns={routeColumns}
        isLoading={routesLoading}
        error={routesError}
        onEdit={(route) => {
          setEditingRoute(route);
          setShowRouteModal(true);
        }}
        onDelete={handleDeleteRoute}
        keyExtractor={(route) => route.id}
        emptyMessage="No se encontraron rutas"
        showActions={true}
        customActions={(route) => (
          <Button
            variant="outline"
            onClick={() => {
              setConfiguringRouteId(route.id);
              setShowStopsModal(true);
            }}
            className="p-1"
            title="Configurar paradas"
          >
            <MapIcon className="h-4 w-4" />
          </Button>
        )}
      />

      {/* Tip informativo */}
      {filteredRoutes.length > 0 && (
        <div className="text-sm text-gray-500 mt-2">
          <p>💡 Tip: Usa el botón <MapIcon className="h-4 w-4 inline" /> para configurar las paradas de cada ruta.</p>
        </div>
      )}

      {/* Modales */}
      <RouteFormModal
        isOpen={showRouteModal}
        onClose={() => {
          setShowRouteModal(false);
          setEditingRoute(undefined);
        }}
        route={editingRoute}
      />

      <RouteStopsModal
        isOpen={showStopsModal && !!configuringRoute}
        onClose={() => {
          setShowStopsModal(false);
          setConfiguringRouteId(null);
        }}
        route={configuringRoute ?? undefined}
      />
    </div>
  );
};