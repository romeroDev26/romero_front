
// src/features/fluvial/pages/RoutesPage.tsx
import React, { useState, useMemo } from 'react';
import { 
  PlusIcon, 
  MapIcon, 
  ClockIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { toast } from '@/utils/sileo-toast';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';
import { DataTable, Column, useConfirmDelete } from '../../../components/common/DataTable';
import { SearchInput } from '../../../components/common/SearchInput';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { SearchableSelect } from '../../../components/common/SearchableSelect';
import { Route } from '../../../types';
import { usePortsData } from '../../../hooks/usePorts'; // **RUTA CORRECTA Y VERIFICADA**
import { usePorts } from '../../../hooks/useCitiesPortsData';
import { 
  useRoutes, 
  useRoute, 
  useCreateRoute, 
  useUpdateRoute, 
  useDeleteRoute 
} from '../hooks/useVesselsRoutesData';
import { 
  RouteCreateData, 
  RouteUpdateData, 
  RouteWithStops, 
  routeHelpers,
  routesService
} from '../../../services/routes.service';

import { RouteMapModal } from '../components/routes/RouteMapModal';

// ========================================
// COMPONENTE: MODAL PARA FORMULARIO DE RUTA BÁSICO
// ========================================
interface RouteFormProps {
  isOpen: boolean;
  onClose: () => void;
  route?: Route;
  routes: Route[];
}

const RouteFormModal: React.FC<RouteFormProps> = ({ isOpen, onClose, route, routes }) => {
  // ... (No se necesitan cambios aquí, lo dejo por completitud)
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();
  const { data: ports = [] } = usePorts({ portType: 'PRIMARY_HUB' });

  const portsMap = React.useMemo(() => new Map(ports.map(port => [port.id, port])), [ports]);

  // Convertir puertos a formato de opciones para SearchableSelect
  const portOptions = React.useMemo(() => 
    ports.map(port => ({
      value: port.id,
      label: port.name
    })), [ports]
  );

  const getFullRouteName = () => {
    if (!formData.origin_port_id || !formData.destination_port_id || !formData.type) return '';
    const originPort = portsMap.get(formData.origin_port_id);
    const destinationPort = portsMap.get(formData.destination_port_id);
    if (!originPort || !destinationPort) return '';
    return `${originPort.name.toUpperCase()} - ${destinationPort.name.toUpperCase()} ${formData.type}`;
  };

  const parseRouteName = (name: string) => {
    const parts = name.split(' - ');
    if (parts.length !== 2) return null;
    const [originName, rest] = parts;
    const typeParts = rest.split(' ');
    if (typeParts.length < 2) return null;
    const destinationName = typeParts.slice(0, -1).join(' ');
    const type = typeParts[typeParts.length - 1] as 'CARGO' | 'EXPRESS';
    if (type !== 'CARGO' && type !== 'EXPRESS') return null;
    return { originName, destinationName, type };
  };

  const getInitialFormData = (): RouteUpdateData & { type?: 'CARGO' | 'EXPRESS' } => ({
    name: '', origin_port_id: 0, destination_port_id: 0, estimated_duration_hours: 0, is_active: true, type: 'CARGO'
  });

  const [formData, setFormData] = useState<RouteUpdateData & { type?: 'CARGO' | 'EXPRESS' }>(getInitialFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Opciones para destino, excluyendo el origen seleccionado
  const destinationPortOptions = React.useMemo(() => 
    portOptions.filter(option => option.value !== formData.origin_port_id), [portOptions, formData.origin_port_id]
  );

  React.useEffect(() => {
    if (isOpen) {
      if (route) {
        const parsed = parseRouteName(route.name);
        if (parsed) {
          const originPort = ports.find(p => p.name.toUpperCase() === parsed.originName.toUpperCase());
          const destinationPort = ports.find(p => p.name.toUpperCase() === parsed.destinationName.toUpperCase());
          setFormData({
            name: route.name,
            origin_port_id: originPort?.id || 0,
            destination_port_id: destinationPort?.id || 0,
            estimated_duration_hours: routeHelpers.isoStringToHours(route.estimated_duration),
            is_active: route.is_active,
            type: parsed.type
          });
        } else {
          // Si no se puede parsear, usar valores por defecto o algo
          setFormData({
            name: route.name,
            origin_port_id: route.origin_port_id,
            destination_port_id: route.destination_port_id,
            estimated_duration_hours: routeHelpers.isoStringToHours(route.estimated_duration),
            is_active: route.is_active,
            type: 'CARGO'
          });
        }
      } else {
        setFormData(getInitialFormData());
      }
      setErrors({});
    }
  }, [route, isOpen, ports]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.origin_port_id) newErrors.origin_port_id = 'Debe seleccionar un puerto de origen';
    if (!formData.destination_port_id) newErrors.destination_port_id = 'Debe seleccionar un puerto de destino';
    if (formData.origin_port_id === formData.destination_port_id) {
        newErrors.destination_port_id = 'El origen y destino deben ser diferentes';
    }
    if ((formData.estimated_duration_hours || 0) <= 0) {
        newErrors.estimated_duration_hours = 'La duración debe ser mayor a 0';
    }
    if (!formData.type) {
      newErrors.type = 'Debe seleccionar un tipo de ruta';
    }
    // Verificar duplicados
    const fullName = getFullRouteName();
    if (fullName) {
      const existingRoute = routes.find(r => r.name.toUpperCase() === fullName.toUpperCase() && (!route || r.id !== route.id));
      if (existingRoute) {
        newErrors.origin_port_id = 'Ya existe una ruta con esta combinación de puertos y tipo';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const fullName = getFullRouteName();
    try {
      if (route) {
        const updateData: RouteUpdateData = {
          ...formData,
          name: fullName,
          estimated_duration: routeHelpers.hoursToISOString(formData.estimated_duration_hours || 0)
        };
        await updateRoute.mutateAsync({ id: route.id, data: updateData });
      } else {
        const createData: RouteCreateData = {
          ...formData as Required<RouteUpdateData>,
          name: fullName,
          company_id: routeHelpers.getCurrentCompanyId(),
          estimated_duration: routeHelpers.hoursToISOString(formData.estimated_duration_hours || 0),
          stops: routeHelpers.generateBasicStops(
            formData.origin_port_id!,
            formData.destination_port_id!,
            formData.estimated_duration_hours || 0
          ),
        };
        await createRoute.mutateAsync(createData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save route:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={route ? 'Editar Ruta' : 'Nueva Ruta'} maxWidth="xl">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* ... (contenido del formulario sin cambios) ... */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <SearchableSelect
              label="Puerto de Origen"
              value={formData.origin_port_id || null}
              onChange={(value) => {
                const newOrigin = value as number;
                setFormData(prev => ({
                  ...prev,
                  origin_port_id: newOrigin,
                  destination_port_id: prev.destination_port_id === newOrigin ? 0 : prev.destination_port_id
                }));
              }}
              options={portOptions}
              placeholder="Buscar puerto de origen..."
            />
            {errors.origin_port_id && <p className="text-sm text-red-500 mt-1">{errors.origin_port_id}</p>}
          </div>
          <div>
            <SearchableSelect
              label="Puerto de Destino"
              value={formData.destination_port_id || null}
              onChange={(value) => setFormData({ ...formData, destination_port_id: value as number })}
              options={destinationPortOptions}
              placeholder="Buscar puerto de destino..."
            />
            {errors.destination_port_id && <p className="text-sm text-red-500 mt-1">{errors.destination_port_id}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Tipo de Ruta</label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="type"
                value="CARGO"
                checked={formData.type === 'CARGO'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'CARGO' | 'EXPRESS' })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-900">CARGO</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="type"
                value="EXPRESS"
                checked={formData.type === 'EXPRESS'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'CARGO' | 'EXPRESS' })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-900">EXPRESS</span>
            </label>
          </div>
          {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type}</p>}
        </div>
        <div className="p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600 mb-1">Previsualización del nombre completo:</p>
          <p className="text-sm font-medium text-gray-900">{getFullRouteName() || 'Seleccione origen, destino y tipo'}</p>
        </div>
        <Input label="Duración Estimada (horas)" type="number" name="estimated_duration_hours" step="0.5" value={formData.estimated_duration_hours || ''} onChange={(e) => setFormData({ ...formData, estimated_duration_hours: parseFloat(e.target.value) || 0 })} error={errors.estimated_duration_hours} min="0.5"/>
        <div className="flex items-center">
          <input id="is_active" type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">Ruta activa</label>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" isLoading={createRoute.isPending || updateRoute.isPending}>{route ? 'Actualizar Ruta' : 'Crear Ruta'}</Button>
        </div>
      </form>
    </Modal>
  );
};


// ========================================
// COMPONENTE PRINCIPAL DE LA PÁGINA
// ========================================
export const RoutesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | undefined>();
  const [configuringRouteId, setConfiguringRouteId] = useState<number | null>(null);
  const [syncingRouteId, setSyncingRouteId] = useState<number | null>(null);

  // Hooks de datos
  const { data: routes = [], isLoading: routesLoading, error: routesError } = useRoutes(showOnlyActive);
  // ** PASO 1: CARGAR TODOS LOS PUERTOS **
  const { data: ports = [], isLoading: portsLoading } = usePortsData(); 
  
  const { data: routeForMap } = useRoute(configuringRouteId);
  const deleteRouteMutation = useDeleteRoute();
  
  // ** PASO 2: COMBINAR RUTAS Y PUERTOS USANDO useMemo **
  const populatedRoutes = useMemo(() => {
    // Si no hay rutas o puertos, no hay nada que hacer
    if (!routes.length || !ports.length) {
      return [];
    }
    // Crear un mapa de puertos para búsqueda rápida y eficiente
    const portsMap = new Map(ports.map(port => [port.id, port]));

    // "Poblar" cada ruta con sus objetos de puerto de origen y destino
    return routes.map(route => ({
      ...route,
      origin_port: portsMap.get(route.origin_port_id),
      destination_port: portsMap.get(route.destination_port_id),
    }));
  }, [routes, ports]); // Se recalcula solo cuando cambian las rutas o los puertos

  const filteredRoutes = useMemo(() => 
    populatedRoutes.filter(
      (route) =>
        route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.origin_port?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.destination_port?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [populatedRoutes, searchTerm]
  );
  
  const handleDelete = useConfirmDelete(
    (route: Route) => deleteRouteMutation.mutate(route.id),
    (route: Route) => `¿Está seguro de desactivar la ruta "${route.name}"?`
  );

  const handleOpenNewRouteModal = () => {
    setSelectedRoute(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditRoute = (route: Route) => {
    setSelectedRoute(route);
    setIsFormModalOpen(true);
  };

  const handleConfigureStops = (route: Route) => {
    setConfiguringRouteId(route.id);
    setIsMapModalOpen(true);
  };

  const handleSyncTripStops = async (route: Route) => {
    setSyncingRouteId(route.id);
    try {
      await routesService.syncTripStops(route.id, 'append_new');
      toast.success(`Paradas sincronizadas correctamente para la ruta "${route.name}"`);
    } catch (error) {
      console.error('Error al sincronizar paradas:', error);
      toast.error('Error al sincronizar las paradas de la ruta');
    } finally {
      setSyncingRouteId(null);
    }
  };

  const routeColumns: Column<Route>[] = [
    { 
      key: 'name', 
      header: 'Ruta', 
      accessor: (r) => (
        <div className="flex items-center gap-2.5">
          <MapPinIcon className="h-4 w-4 text-[#828282] shrink-0" strokeWidth={1.5} />
          <span className="font-medium text-[#202020]">{r.name}</span>
        </div>
      ) 
    },
    { 
      key: 'origin_destination', 
      header: 'Origen → Destino', 
      accessor: (r) => (
        <span className="text-[14px] text-[#4d4d4d]">
          {r.origin_port?.name || 'N/A'} → {r.destination_port?.name || 'N/A'}
        </span>
      ) 
    },
    { 
      key: 'duration', 
      header: 'Duración', 
      accessor: (r) => ( 
        <div className="flex items-center text-[14px] text-[#4d4d4d]">
          <ClockIcon className="h-4 w-4 mr-1.5 text-[#828282]" strokeWidth={1.5} />
          {`${routeHelpers.isoStringToHours(r.estimated_duration).toFixed(1)}h`}
        </div> 
      )
    },
    { 
      key: 'stops', 
      header: 'Paradas', 
      accessor: (r) => (
        <span className="text-[14px] text-[#828282]">{r.stops?.length || 0} paradas</span>
      ) 
    },
    { 
      key: 'status', 
      header: 'Estado', 
      accessor: (r) => <StatusBadge isActive={r.is_active} /> 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1
            className="text-[32px] font-medium text-[#202020] tracking-[-0.64px] leading-[1.19]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Rutas Fluviales
          </h1>
          <p className="mt-1 text-[15px] text-[#4d4d4d] leading-[1.33]">
            Crea, edita y gestiona las rutas y sus paradas.
          </p>
        </div>
        <button
          onClick={handleOpenNewRouteModal}
          className="inline-flex items-center px-5 py-3 bg-[#1F4690] hover:bg-[#163672] text-white text-[15px] font-medium rounded-[20px] transition-colors shrink-0"
        >
          <PlusIcon className="h-5 w-5 mr-2" strokeWidth={1.5} />
          Nueva Ruta
        </button>
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por nombre o puerto..."
          className="w-full sm:max-w-sm"
        />
        <label className="flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showOnlyActive}
            onChange={(e) => setShowOnlyActive(e.target.checked)}
            className="h-4 w-4 rounded border-[#e8e8e8] text-[#1F4690] focus:ring-[#1F4690]/20 mr-2"
          />
          <span className="text-[14px] text-[#4d4d4d]">Mostrar solo activas</span>
        </label>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-3">
        {filteredRoutes.map((route) => (
          <div
            key={route.id}
            className="bg-white rounded-[12px] border border-[#e8e8e8] p-5"
          >
            <div className="flex justify-between items-start mb-3 gap-3">
              <div className="min-w-0">
                <h3 className="text-[15px] font-medium text-[#202020] truncate">{route.name}</h3>
                <p className="text-[13px] text-[#4d4d4d] mt-0.5">
                  {route.origin_port?.name || 'N/A'} → {route.destination_port?.name || 'N/A'}
                </p>
              </div>
              <StatusBadge isActive={route.is_active} />
            </div>

            <div className="flex items-center gap-4 text-[13px] text-[#828282] mb-4">
              <div className="flex items-center gap-1.5">
                <ClockIcon className="h-4 w-4" strokeWidth={1.5} />
                <span>{routeHelpers.isoStringToHours(route.estimated_duration).toFixed(1)}h</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapIcon className="h-4 w-4" strokeWidth={1.5} />
                <span>{route.stops?.length || 0} paradas</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-[#f0f0f0]">
              <button
                onClick={() => handleConfigureStops(route)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[#1F4690] bg-[#1F4690]/5 border border-[#1F4690]/10 rounded-[10px] hover:bg-[#1F4690]/10 transition-colors"
              >
                <MapIcon className="h-4 w-4" strokeWidth={1.5} />
                Mapa
              </button>
              <button
                onClick={() => handleSyncTripStops(route)}
                disabled={syncingRouteId === route.id}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[#4d4d4d] bg-[#f5f5f5] border border-[#e8e8e8] rounded-[10px] hover:bg-[#e8e8e8] disabled:opacity-50 transition-colors"
              >
                <ArrowPathIcon className={`h-4 w-4 ${syncingRouteId === route.id ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                {syncingRouteId === route.id ? 'Sincronizando...' : 'Sincronizar'}
              </button>
              <button
                onClick={() => handleEditRoute(route)}
                className="p-2 text-[#828282] hover:text-[#1F4690] transition-colors"
              >
                <PencilIcon className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => handleDelete(route)}
                className="p-2 text-[#828282] hover:text-[#cf1322] transition-colors"
              >
                <TrashIcon className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        ))}

        {filteredRoutes.length === 0 && (
          <div className="bg-white rounded-[12px] border border-[#e8e8e8] p-8 text-center">
            <p className="text-[15px] text-[#828282]">No se encontraron rutas que coincidan con los filtros.</p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <DataTable
          data={filteredRoutes}
          columns={routeColumns}
          isLoading={routesLoading || portsLoading}
          error={routesError as Error | null}
          onEdit={handleEditRoute}
          onDelete={handleDelete}
          keyExtractor={(route) => route.id}
          emptyMessage="No se encontraron rutas que coincidan con los filtros."
          showActions={true}
          customActions={(route) => (
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => handleConfigureStops(route)}
                className="text-[#828282] hover:text-[#1F4690] transition-colors"
                title="Gestionar paradas en el mapa"
              >
                <MapIcon className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => handleSyncTripStops(route)}
                disabled={syncingRouteId === route.id}
                className="text-[#828282] hover:text-[#1F4690] transition-colors disabled:opacity-40"
                title="Sincronizar paradas de viajes con la ruta"
              >
                <ArrowPathIcon className={`h-4 w-4 ${syncingRouteId === route.id ? 'animate-spin' : ''}`} strokeWidth={1.5} />
              </button>
            </div>
          )}
        />
      </div>

      <RouteFormModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} route={selectedRoute} routes={routes} />

      <RouteMapModal
        isOpen={isMapModalOpen && !!routeForMap}
        onClose={() => { setIsMapModalOpen(false); setConfiguringRouteId(null); }}
        route={routeForMap as RouteWithStops | undefined}
      />
    </div>
  );
};
