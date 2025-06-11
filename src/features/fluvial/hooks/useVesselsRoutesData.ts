// src/features/fluvial/hooks/useVesselsRoutesData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { 
  vesselsService,
  VesselCreateData,
  VesselUpdateData,
  SeatConfigurationCreateData,
  VesselWithConfigurations
} from '../../../services/vessels.service';
import {
  routesService,
  RouteCreateData,
  RouteUpdateData,
  RouteStopCreateData,
  RouteWithStops
} from '../../../services/routes.service';
import {
  seatTypesService,
  SeatTypeCreateData,
  SeatTypeUpdateData
} from '../../../services/seat-types.service';
import { Vessel, Route, VesselSeatConfiguration, RouteStop, SeatType } from '../../../types';

// ========================================
// HOOKS PARA EMBARCACIONES
// ========================================

export const useVessels = (isActive = true) => {
  return useQuery({
    queryKey: ['vessels', { isActive }],
    queryFn: () => vesselsService.getAll({ is_active: isActive }),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useVessel = (vesselId: number | null) => {
  return useQuery({
    queryKey: ['vessel', vesselId],
    queryFn: () => vesselId ? vesselsService.getById(vesselId) : null,
    enabled: !!vesselId,
  });
};

export const useCreateVessel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VesselCreateData) => vesselsService.create(data),
    onSuccess: (newVessel) => {
      // Actualizar la cache con la nueva embarcación
      queryClient.setQueryData<Vessel[]>(['vessels', { isActive: true }], (old) => {
        if (!old) return [newVessel];
        return [...old, newVessel];
      });
      
      toast.success(`Embarcación ${newVessel.name} creada exitosamente`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al crear la embarcación';
      toast.error(message);
    },
  });
};

export const useUpdateVessel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: VesselUpdateData }) => 
      vesselsService.update(id, data),
    onSuccess: (updatedVessel) => {
      // Actualizar la cache
      queryClient.setQueryData<Vessel[]>(['vessels', { isActive: true }], (old) => {
        if (!old) return [];
        return old.map(vessel => vessel.id === updatedVessel.id ? updatedVessel : vessel);
      });
      
      // Invalidar query específica
      queryClient.invalidateQueries({ queryKey: ['vessel', updatedVessel.id] });
      
      toast.success(`Embarcación ${updatedVessel.name} actualizada exitosamente`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al actualizar la embarcación';
      toast.error(message);
    },
  });
};

export const useDeleteVessel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => vesselsService.delete(id),
    onSuccess: (deletedVessel) => {
      // Actualizar la cache removiendo la embarcación
      queryClient.setQueryData<Vessel[]>(['vessels', { isActive: true }], (old) => {
        if (!old) return [];
        return old.filter(vessel => vessel.id !== deletedVessel.id);
      });
      
      toast.success(`Embarcación ${deletedVessel.name} desactivada exitosamente`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al desactivar la embarcación';
      toast.error(message);
    },
  });
};

// Hooks para configuración de asientos
export const useAddSeatConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vesselId, configs }: { vesselId: number; configs: SeatConfigurationCreateData[] }) =>
      vesselsService.addMultipleSeatConfigurations(vesselId, configs),
    onSuccess: (_, variables) => {
      // Invalidar la query de la embarcación específica para recargar con las nuevas configuraciones
      queryClient.invalidateQueries({ queryKey: ['vessel', variables.vesselId] });
      
      toast.success('Configuración de asientos actualizada exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al actualizar la configuración de asientos';
      toast.error(message);
    },
  });
};

export const useDeleteSeatConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (configId: number) => vesselsService.deleteSeatConfiguration(configId),
    onSuccess: () => {
      // Invalidar todas las queries de embarcaciones para refrescar
      queryClient.invalidateQueries({ queryKey: ['vessels'] });
      queryClient.invalidateQueries({ queryKey: ['vessel'] });
      
      toast.success('Configuración de asientos eliminada exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al eliminar la configuración';
      toast.error(message);
    },
  });
};

// ========================================
// HOOKS PARA RUTAS
// ========================================

export const useRoutes = (isActive = true, filters?: { originPortId?: number; destinationPortId?: number }) => {
  return useQuery({
    queryKey: ['routes', { isActive, ...filters }],
    queryFn: () => routesService.getAll({ 
      is_active: isActive,
      originPortId: filters?.originPortId,
      destinationPortId: filters?.destinationPortId
    }),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useRoute = (routeId: number | null) => {
  return useQuery({
    queryKey: ['route', routeId],
    queryFn: () => routeId ? routesService.getById(routeId) : null,
    enabled: !!routeId,
  });
};

export const useCreateRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RouteCreateData) => routesService.create(data),
    onSuccess: (newRoute) => {
      // Invalidar las queries de rutas para forzar refetch
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      
      // Establecer la nueva ruta en el cache
      queryClient.setQueryData(['route', newRoute.id], newRoute);
      
      toast.success(`Ruta ${newRoute.name} creada exitosamente`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al crear la ruta';
      toast.error(message);
    },
  });
};

export const useUpdateRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RouteUpdateData }) => 
      routesService.update(id, data),
    onSuccess: (updatedRoute) => {
      // Invalidar las queries de rutas
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      
      // Actualizar la ruta específica en el cache
      queryClient.setQueryData(['route', updatedRoute.id], updatedRoute);
      
      toast.success(`Ruta ${updatedRoute.name} actualizada exitosamente`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al actualizar la ruta';
      toast.error(message);
    },
  });
};

export const useDeleteRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => routesService.delete(id),
    onSuccess: (deletedRoute) => {
      // Invalidar las queries de rutas
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      
      // Marcar la ruta como inactiva en el cache
      queryClient.setQueryData(['route', deletedRoute.id], {
        ...deletedRoute,
        is_active: false
      });
      
      toast.success(`Ruta ${deletedRoute.name} desactivada exitosamente`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al desactivar la ruta';
      toast.error(message);
    },
  });
};

// Hook para actualizar paradas de ruta
export const useUpdateRouteStops = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ routeId, stops }: { routeId: number; stops: RouteStopCreateData[] }) =>
      routesService.updateStops(routeId, stops),
    onSuccess: (updatedStops, variables) => {
      // Invalidar la query de la ruta específica para recargar con las nuevas paradas
      queryClient.invalidateQueries({ queryKey: ['route', variables.routeId] });
      
      // También invalidar las queries de rutas por si muestran conteo de paradas
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      
      toast.success('Paradas de la ruta actualizadas exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al actualizar las paradas';
      toast.error(message);
    },
  });
};

// ========================================
// HOOKS PARA TIPOS DE ASIENTOS
// ========================================

export const useSeatTypes = (isActive = true) => {
  return useQuery({
    queryKey: ['seatTypes', { isActive }],
    queryFn: () => seatTypesService.getAll({ is_active: isActive }),
    staleTime: 1000 * 60 * 10, // 10 minutos (cambian menos frecuentemente)
  });
};

export const useSeatType = (seatTypeId: number | null) => {
  return useQuery({
    queryKey: ['seatType', seatTypeId],
    queryFn: () => seatTypeId ? seatTypesService.getById(seatTypeId) : null,
    enabled: !!seatTypeId,
  });
};

export const useCreateSeatType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SeatTypeCreateData) => seatTypesService.create(data),
    onSuccess: (newSeatType) => {
      queryClient.setQueryData<SeatType[]>(['seatTypes', { isActive: true }], (old) => {
        if (!old) return [newSeatType];
        return [...old, newSeatType];
      });
      
      toast.success(`Tipo de asiento ${newSeatType.name} creado exitosamente`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al crear el tipo de asiento';
      toast.error(message);
    },
  });
};

export const useUpdateSeatType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SeatTypeUpdateData }) => 
      seatTypesService.update(id, data),
    onSuccess: (updatedSeatType) => {
      queryClient.setQueryData<SeatType[]>(['seatTypes', { isActive: true }], (old) => {
        if (!old) return [];
        return old.map(type => type.id === updatedSeatType.id ? updatedSeatType : type);
      });
      
      queryClient.invalidateQueries({ queryKey: ['seatType', updatedSeatType.id] });
      
      toast.success(`Tipo de asiento ${updatedSeatType.name} actualizado exitosamente`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al actualizar el tipo de asiento';
      toast.error(message);
    },
  });
};

export const useDeleteSeatType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => seatTypesService.delete(id),
    onSuccess: (deletedSeatType) => {
      queryClient.setQueryData<SeatType[]>(['seatTypes', { isActive: true }], (old) => {
        if (!old) return [];
        return old.filter(type => type.id !== deletedSeatType.id);
      });
      
      toast.success(`Tipo de asiento ${deletedSeatType.name} desactivado exitosamente`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al desactivar el tipo de asiento';
      toast.error(message);
    },
  });
};

// ========================================
// HOOKS UTILITARIOS
// ========================================

// Hook para obtener resumen de flota
export const useFleetSummary = () => {
  const { data: vessels = [], isLoading } = useVessels();
  
  const summary = {
    totalVessels: vessels.length,
    totalCapacityPassengers: vessels.reduce((sum, v) => sum + (v.capacity_passengers || 0), 0),
    totalCapacityWeight: vessels.reduce((sum, v) => sum + (v.capacity_weight_kg || 0), 0),
    totalCapacityPackages: vessels.reduce((sum, v) => sum + (v.capacity_packages || 0), 0),
    activeVessels: vessels.filter(v => v.is_active).length,
  };
  
  return { summary, isLoading };
};

// Hook para obtener rutas por puerto
export const useRoutesByPort = (portId: number | null) => {
  const { data: allRoutes = [], isLoading } = useRoutes();
  
  const routes = portId 
    ? allRoutes.filter(route => 
        route.origin_port_id === portId || 
        route.destination_port_id === portId
      )
    : [];
  
  return { routes, isLoading };
};

// Hook para validación de disponibilidad de embarcación
export const useVesselAvailability = (vesselId: number, date: Date) => {
  // Este hook sería más complejo en producción, consultando los viajes programados
  // Por ahora retorna un placeholder
  return useQuery({
    queryKey: ['vessel-availability', vesselId, date.toISOString()],
    queryFn: async () => {
      // Aquí iría la lógica real de verificación de disponibilidad
      // consultando los viajes programados para esa fecha
      return { isAvailable: true, scheduledTrips: [] };
    },
    enabled: !!vesselId,
  });
};