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
  RouteWithStops,
  routeHelpers
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
    queryFn: () => vesselsService.getAll({
      is_active: isActive,
      company_id: 0
    }),
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
      queryClient.setQueryData<Vessel[]>(['vessels', { isActive: true }], (old) => {
        if (!old) return [];
        return old.map(vessel => vessel.id === updatedVessel.id ? updatedVessel : vessel);
      });

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
// HOOKS PARA RUTAS (REVISED)
// ========================================

export const useRoutes = (isActive = true) => {
  const companyId = routeHelpers.getCurrentCompanyId();

  return useQuery({
    queryKey: ['routes', { companyId, isActive }],
    queryFn: () => routesService.getAll({
      company_id: companyId,
      is_active: isActive
    }),
    staleTime: 1000 * 60 * 5,
    enabled: !!companyId,
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
      queryClient.invalidateQueries({ queryKey: ['routes'] });
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
    mutationFn: ({ id, data }: { id: number; data: RouteUpdateData }) => routesService.update(id, data),
    onSuccess: (updatedRoute) => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
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
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['route', deletedId] });
      toast.success(`Ruta desactivada exitosamente`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al desactivar la ruta';
      toast.error(message);
    },
  });
};

export const useUpdateRouteStops = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ routeId, stops }: { routeId: number; stops: RouteStopCreateData[] }) =>
      routesService.updateStops(routeId, stops),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['route', variables.routeId] });
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
    staleTime: 1000 * 60 * 10,
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

export const useVesselAvailability = (vesselId: number, date: Date) => {
  return useQuery({
    queryKey: ['vessel-availability', vesselId, date.toISOString()],
    queryFn: async () => {
      return { isAvailable: true, scheduledTrips: [] };
    },
    enabled: !!vesselId,
  });
};
export { routeHelpers };

