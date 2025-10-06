// src/features/fluvial/pages/RoutesPage.tsx
import React, { useState, useMemo } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  MapIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';
import { DataTable, Column, useConfirmDelete } from '../../../components/common/DataTable';
import { SearchableSelect } from '../../../components/common/SearchableSelect';
import { Route } from '../../../types';
import { usePortsData } from '../../../hooks/usePorts'; // **RUTA CORRECTA Y VERIFICADA**
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
  routeHelpers 
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
  const { data: ports = [] } = usePortsData();

  const getInitialFormData = (): RouteUpdateData & { type?: 'CARGO' | 'EXPRESS' } => ({
    name: '', origin_port_id: 0, destination_port_id: 0, estimated_duration_hours: 0, is_active: true, type: 'CARGO'
  });

  const [formData, setFormData] = useState<RouteUpdateData & { type?: 'CARGO' | 'EXPRESS' }>(getInitialFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Convertir puertos a formato de opciones para SearchableSelect
  const portOptions = React.useMemo(() => 
    ports.map(port => ({
      value: port.id,
      label: port.name
    })), [ports]
  );

  React.useEffect(() => {
    if (isOpen) {
      if (route) {
        setFormData({
          name: route.name,
          origin_port_id: route.origin_port_id,
          destination_port_id: route.destination_port_id,
          estimated_duration_hours: routeHelpers.isoStringToHours(route.estimated_duration),
          is_active: route.is_active
        });
      } else {
        setFormData(getInitialFormData());
      }
      setErrors({});
    }
  }, [route, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = 'El nombre de la ruta es requerido';
    if (!formData.origin_port_id) newErrors.origin_port_id = 'Debe seleccionar un puerto de origen';
    if (!formData.destination_port_id) newErrors.destination_port_id = 'Debe seleccionar un puerto de destino';
    if (formData.origin_port_id === formData.destination_port_id) {
        newErrors.destination_port_id = 'El origen y destino deben ser diferentes';
    }
    if ((formData.estimated_duration_hours || 0) <= 0) {
        newErrors.estimated_duration_hours = 'La duración debe ser mayor a 0';
    }
    if (!route && !formData.type) {
      newErrors.type = 'Debe seleccionar un tipo de ruta';
    }
    // Verificar duplicados
    let fullName = formData.name?.trim().toUpperCase();
    if (!route && formData.type) {
      fullName = `${fullName} ${formData.type}`;
    }
    if (fullName) {
      const existingRoute = routes.find(r => r.name.toUpperCase() === fullName && (!route || r.id !== route.id));
      if (existingRoute) {
        newErrors.name = 'Ya existe una ruta con este nombre';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      if (route) {
        const updateData: RouteUpdateData = {
          ...formData,
          estimated_duration: routeHelpers.hoursToISOString(formData.estimated_duration_hours || 0)
        };
        await updateRoute.mutateAsync({ id: route.id, data: updateData });
      } else {
        const fullName = `${formData.name?.toUpperCase()} ${formData.type}`;
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
        <Input label="Nombre de la Ruta" name="name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={errors.name} required />
        {!route && (
          <>
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
              <p className="text-sm font-medium text-gray-900">{formData.name?.toUpperCase()} {formData.type}</p>
            </div>
            <p className="text-xs text-gray-500">Escriba solo el nombre de la ruta (ej: Origen - Destino). El tipo se agregará automáticamente.</p>
          </>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <SearchableSelect
              label="Puerto de Origen"
              value={formData.origin_port_id || null}
              onChange={(value) => setFormData({ ...formData, origin_port_id: value as number })}
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
              options={portOptions}
              placeholder="Buscar puerto de destino..."
            />
            {errors.destination_port_id && <p className="text-sm text-red-500 mt-1">{errors.destination_port_id}</p>}
          </div>
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

  // La definición de columnas ya es correcta, no necesita cambios.
  const routeColumns: Column<Route>[] = [
    { key: 'name', header: 'Ruta', accessor: (r) => <div className="font-medium text-gray-900">{r.name}</div> },
    { key: 'origin_destination', header: 'Origen → Destino', accessor: (r) => `${r.origin_port?.name || 'N/A'} → ${r.destination_port?.name || 'N/A'}` },
    { key: 'duration', header: 'Duración', accessor: (r) => ( <div className="flex items-center text-sm text-gray-600"><ClockIcon className="h-4 w-4 mr-1.5" />{`${routeHelpers.isoStringToHours(r.estimated_duration).toFixed(1)}h`}</div> )},
    { key: 'stops', header: 'Paradas', accessor: (r) => <span className="text-sm text-gray-600">{r.stops?.length || 0} paradas</span> },
    { key: 'status', header: 'Estado', accessor: (r) => (<span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${ r.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' }`}>{r.is_active ? 'Activo' : 'Inactivo'}</span>) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Rutas Fluviales</h1>
          <p className="text-gray-600">Crea, edita y gestiona las rutas y sus paradas.</p>
        </div>
        <Button onClick={handleOpenNewRouteModal}><PlusIcon className="h-5 w-5 mr-2" />Nueva Ruta</Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative flex-grow w-full sm:max-w-md">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" className="pl-10 block w-full rounded-md border-gray-300 shadow-sm p-2" placeholder="Buscar por nombre o puerto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <label className="flex items-center text-sm text-gray-700">
          <input type="checkbox" checked={showOnlyActive} onChange={(e) => setShowOnlyActive(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"/>
          Mostrar solo activas
        </label>
      </div>
      
      <DataTable
        // ** PASO 3: PASAR LOS DATOS CORRECTOS A LA TABLA **
        data={filteredRoutes} 
        columns={routeColumns}
        isLoading={routesLoading || portsLoading} // Mostrar loading si cualquiera de los dos está cargando
        error={routesError as Error | null}
        onEdit={handleEditRoute}
        onDelete={handleDelete}
        keyExtractor={(route) => route.id}
        emptyMessage="No se encontraron rutas que coincidan con los filtros."
        showActions={true}
        customActions={(route) => (
          <Button variant="outline" size="sm" onClick={() => handleConfigureStops(route)} title="Gestionar paradas en el mapa" className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700">
            <MapIcon className="h-4 w-4" />
          </Button>
        )}
      />
      
      <RouteFormModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} route={selectedRoute} routes={routes} />
      
      <RouteMapModal isOpen={isMapModalOpen && !!routeForMap} onClose={() => { setIsMapModalOpen(false); setConfiguringRouteId(null); }} route={routeForMap as RouteWithStops | undefined} />
    </div>
  );
};