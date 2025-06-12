// src/features/fluvial/pages/RoutesPage.tsx
import React, { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, MapIcon, ClockIcon, PlusCircleIcon, MinusCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';
import { DataTable, Column, useConfirmDelete } from '../../../components/common/DataTable';
import { Route, Port } from '../../../types';
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
} from '../../../services/routes.service';

// ========================================
// FORMULARIO PARA RUTAS (REVISED)
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
        estimated_duration_hours: routeHelpers.isoStringToHours(route.estimated_duration),
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
    if (!formData.name?.trim()) newErrors.name = 'El nombre de la ruta es requerido';
    if (!formData.origin_port_id) newErrors.origin_port_id = 'Debe seleccionar un puerto de origen';
    if (!formData.destination_port_id) newErrors.destination_port_id = 'Debe seleccionar un puerto de destino';
    if (formData.origin_port_id === formData.destination_port_id) newErrors.ports = 'El puerto de origen y destino deben ser diferentes';
    if ((formData.estimated_duration_hours || 0) <= 0) newErrors.duration = 'La duración debe ser mayor a 0';
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
        const createData: RouteCreateData = {
          ...formData as Required<RouteUpdateData>,
          estimated_duration: routeHelpers.hoursToISOString(formData.estimated_duration_hours || 0),
          stops: routeHelpers.generateBasicStops(
            formData.origin_port_id!,
            formData.destination_port_id!,
            formData.estimated_duration_hours || 0
          ),
          company_id: routeHelpers.getCurrentCompanyId()
        };
        await createRoute.mutateAsync(createData);
      }
      onClose();
    } catch (error) {
      // Errores ya manejados en el hook
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={route ? 'Editar Ruta' : 'Nueva Ruta'} maxWidth="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Input
          label="Nombre de la Ruta"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
        />
        {errors.ports && <div className="text-sm text-red-600">{errors.ports}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Puerto de Origen *</label>
            <select
              value={formData.origin_port_id}
              onChange={(e) => setFormData({ ...formData, origin_port_id: parseInt(e.target.value) })}
              className={`w-full p-2 border rounded-md ${errors.origin_port_id ? 'border-red-500' : 'border-gray-300'}`}
              required
            >
              <option value="0">Seleccione puerto</option>
              {ports.map((port) => (
                <option key={port.id} value={port.id}>
                  {port.name} ({port.city?.name})
                </option>
              ))}
            </select>
            {errors.origin_port_id && <p className="mt-1 text-sm text-red-600">{errors.origin_port_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Puerto de Destino *</label>
            <select
              value={formData.destination_port_id}
              onChange={(e) => setFormData({ ...formData, destination_port_id: parseInt(e.target.value) })}
              className={`w-full p-2 border rounded-md ${errors.destination_port_id ? 'border-red-500' : 'border-gray-300'}`}
              required
            >
              <option value="0">Seleccione puerto</option>
              {ports.map((port) => (
                <option key={port.id} value={port.id}>
                  {port.name} ({port.city?.name})
                </option>
              ))}
            </select>
            {errors.destination_port_id && <p className="mt-1 text-sm text-red-600">{errors.destination_port_id}</p>}
          </div>
        </div>
        <Input
          label="Duración Estimada (horas)"
          type="number"
          step="0.5"
          value={formData.estimated_duration_hours || ''}
          onChange={(e) => setFormData({ ...formData, estimated_duration_hours: parseFloat(e.target.value) || 0 })}
          error={errors.duration}
          min="0.5"
          required
        />
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="mr-2"
          />
          Ruta activa
        </label>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={createRoute.isPending || updateRoute.isPending}>
            {route ? 'Actualizar' : 'Crear'} Ruta
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ========================================
// FORMULARIO PARA PARADAS (REVISED)
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

  useEffect(() => {
    if (route?.stops) {
      setStops(
        route.stops.map((stop) => ({
          port_id: stop.port_id,
          stop_order: stop.stop_order,
          estimated_duration_from_origin: stop.estimated_duration_from_origin || 'PT0S',
          is_boarding_allowed: stop.is_boarding_allowed,
          is_disembarking_allowed: stop.is_disembarking_allowed,
          notes: stop.notes || '',
        }))
      );
    }
  }, [route, isOpen]);

  const addStop = () => {
    const nextOrder = stops.length > 0 ? Math.max(...stops.map((s) => s.stop_order)) + 1 : 1;
    setStops([
      ...stops,
      {
        port_id: 0,
        stop_order: nextOrder,
        estimated_duration_from_origin: 'PT0S',
        is_boarding_allowed: true,
        is_disembarking_allowed: true,
        notes: '',
      },
    ]);
  };

  const removeStop = (index: number) =>
    setStops(
      stops
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, stop_order: i + 1 }))
    );

  const updateStop = (index: number, field: keyof RouteStopCreateData, value: any) => {
    const newStops = [...stops];
    if (field === 'estimated_duration_from_origin' && typeof value === 'object') {
      const totalHours = (value.hours || 0) + (value.minutes || 0) / 60;
      newStops[index] = {
        ...newStops[index],
        estimated_duration_from_origin: routeHelpers.hoursToISOString(totalHours),
      };
    } else {
      newStops[index] = { ...newStops[index], [field]: value };
    }
    setStops(newStops);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!route) return;
    await updateRouteStops.mutateAsync({
      routeId: route.id,
      stops,
    });
    onClose();
  };

  if (!isOpen || !route) return null;

  const parseDurationForUI = (isoString: string) => {
    const totalHours = routeHelpers.isoStringToHours(isoString);
    return {
      hours: Math.floor(totalHours),
      minutes: Math.round((totalHours % 1) * 60),
    };
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Paradas de Ruta - ${route.name}`} maxWidth="2xl">
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {stops.map((stop, index) => {
            const duration = parseDurationForUI(stop.estimated_duration_from_origin);
            return (
              <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 border rounded-lg">
                <div className="col-span-3">
                  <label className="text-xs">Puerto</label>
                  <select
                    value={stop.port_id}
                    onChange={(e) => updateStop(index, 'port_id', parseInt(e.target.value))}
                    className="w-full p-2 border rounded-md text-sm"
                    required
                  >
                    <option value="0">Seleccione</option>
                    {ports.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="text-xs">Orden</label>
                  <input
                    type="number"
                    value={stop.stop_order}
                    readOnly
                    className="w-full p-2 border rounded-md text-sm bg-gray-50"
                  />
                </div>

                <div className="col-span-1">
                  <label className="text-xs">Horas</label>
                  <input
                    type="number"
                    value={duration.hours}
                    onChange={(e) =>
                      updateStop(index, 'estimated_duration_from_origin', {
                        hours: parseInt(e.target.value) || 0,
                        minutes: duration.minutes,
                      })
                    }
                    className="w-full p-2 border rounded-md text-sm"
                    min="0"
                  />
                </div>

                <div className="col-span-1">
                  <label className="text-xs">Minutos</label>
                  <input
                    type="number"
                    value={duration.minutes}
                    onChange={(e) =>
                      updateStop(index, 'estimated_duration_from_origin', {
                        hours: duration.hours,
                        minutes: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 border rounded-md text-sm"
                    min="0"
                    max="59"
                  />
                </div>

                <div className="col-span-3">
                  <label className="text-xs">Notas</label>
                  <input
                    type="text"
                    value={stop.notes || ''}
                    onChange={(e) => updateStop(index, 'notes', e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                    placeholder="Opcional"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1 text-xs">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={stop.is_boarding_allowed}
                      onChange={(e) => updateStop(index, 'is_boarding_allowed', e.target.checked)}
                      className="mr-1"
                    />
                    Embarque
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={stop.is_disembarking_allowed}
                      onChange={(e) => updateStop(index, 'is_disembarking_allowed', e.target.checked)}
                      className="mr-1"
                    />
                    Desemb.
                  </label>
                </div>
                <div className="col-span-1 flex items-center">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeStop(index)}
                    disabled={stops.length <= 2}
                  >
                    <MinusCircleIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={addStop}>
            <PlusCircleIcon className="h-4 w-4 mr-2" />
            Agregar Parada
          </Button>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={updateRouteStops.isPending}>
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
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showStopsModal, setShowStopsModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | undefined>();
  const [configuringRouteId, setConfiguringRouteId] = useState<number | null>(null);

  const { data: routes = [], isLoading: routesLoading, error: routesError } = useRoutes(showOnlyActive);
  const { data: configuringRoute } = useRoute(configuringRouteId);
  const deleteRoute = useDeleteRoute();

  const handleDeleteRoute = useConfirmDelete(
    (route: Route) => deleteRoute.mutate(route.id),
    (route: Route) => `¿Está seguro de desactivar la ruta ${route.name}?`
  );

  const filteredRoutes = routes.filter(
    (route) =>
      route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.origin_port?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.destination_port?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const routeColumns: Column<Route>[] = [
    {
      key: 'name',
      header: 'Ruta',
      accessor: (r) => <div className="font-medium text-gray-900">{r.name}</div>,
    },
    {
      key: 'route',
      header: 'Origen → Destino',
      accessor: (r) => `${r.origin_port?.name} → ${r.destination_port?.name}`,
    },
    {
      key: 'duration',
      header: 'Duración',
      accessor: (r) => (
        <div className="flex items-center text-sm">
          <ClockIcon className="h-4 w-4 mr-1" />
          {`${routeHelpers.isoStringToHours(r.estimated_duration).toFixed(1)}h`}
        </div>
      ),
    },
    {
      key: 'stops',
      header: 'Paradas',
      accessor: (r) => <span className="text-sm">{r.stops?.length || 0} paradas</span>,
    },
    {
      key: 'status',
      header: 'Estado',
      accessor: (r) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            r.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {r.is_active ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Rutas</h1>
          <p className="text-gray-600">Administra las rutas fluviales del sistema</p>
        </div>
        <Button onClick={() => { setEditingRoute(undefined); setShowRouteModal(true); }}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Ruta
        </Button>
      </div>
      <div className="flex gap-4 items-center">
        <div className="relative flex-grow">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="pl-10 w-full rounded-md border-gray-300 shadow-sm p-2 border"
            placeholder="Buscar rutas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showOnlyActive}
            onChange={(e) => setShowOnlyActive(e.target.checked)}
            className="mr-2"
          />
          Solo activas
        </label>
      </div>
      <DataTable
        data={filteredRoutes}
        columns={routeColumns}
        isLoading={routesLoading}
        error={routesError}
        onEdit={(route) => { setEditingRoute(route); setShowRouteModal(true); }}
        onDelete={handleDeleteRoute}
        keyExtractor={(route) => route.id}
        emptyMessage="No se encontraron rutas"
        showActions={true}
        customActions={(route) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setConfiguringRouteId(route.id);
              setShowStopsModal(true);
            }}
            title="Configurar paradas"
          >
            <MapIcon className="h-4 w-4" />
          </Button>
        )}
      />
      <RouteFormModal
        isOpen={showRouteModal}
        onClose={() => setShowRouteModal(false)}
        route={editingRoute}
      />
      <RouteStopsModal
        isOpen={showStopsModal && !!configuringRoute}
        onClose={() => {
          setShowStopsModal(false);
          setConfiguringRouteId(null);
        }}
        route={configuringRoute as RouteWithStops | undefined}
      />
    </div>
  );
};
