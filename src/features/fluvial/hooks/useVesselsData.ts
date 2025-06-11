// src/features/fluvial/hooks/useVesselsData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { 
  vesselsService,
  VesselCreateData,
  VesselUpdateData,
  SeatConfigurationCreateData,
  VesselWithConfigurations,
  vesselHelpers
} from '../../../services/vessels.service';
import { Vessel, VesselSeatConfiguration } from '../../../types';

// ========================================
// HOOKS PARA EMBARCACIONES
// ========================================

export const useVessels = (isActive = true) => {
  return useQuery({
    queryKey: ['vessels', { isActive }],    
    queryFn: async () => {
      const companyId = vesselHelpers.getCurrentCompanyId();
      const vessels = await vesselsService.getAll({ 
        company_id: companyId,
        is_active: isActive 
      });
      return vessels;
    },
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

// ========================================
// HOOKS PARA CONFIGURACIÓN DE ASIENTOS
// ========================================

export const useAddSeatConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vesselId, configs }: { vesselId: number; configs: SeatConfigurationCreateData[] }) => 
      vesselsService.addMultipleSeatConfigurations(vesselId, configs),    onSuccess: (_newConfigs, variables) => {
      // Invalidar la query de la embarcación específica para recargar con las nuevas configuraciones
      queryClient.invalidateQueries({ queryKey: ['vessel', variables.vesselId] });
      
      // También actualizar la lista de embarcaciones para reflejar el cambio
      queryClient.invalidateQueries({ queryKey: ['vessels'] });
      
      toast.success('Configuración de asientos actualizada exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al configurar los asientos';
      toast.error(message);
    },
  });
};

export const useDeleteSeatConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (configId: number) => vesselsService.deleteSeatConfiguration(configId),
    onSuccess: () => {
      // Invalidar todas las queries de embarcaciones para refrescar los datos
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
// HOOKS AUXILIARES
// ========================================

// Hook para obtener estadísticas de la flota
export const useFleetStatistics = () => {
  const { data: vessels = [] } = useVessels();
  
  return {
    totalVessels: vessels.length,
    activeVessels: vessels.filter(v => v.is_active).length,
    inactiveVessels: vessels.filter(v => !v.is_active).length,
    totalCapacity: {
      passengers: vessels.reduce((sum, v) => sum + (v.capacity_passengers || 0), 0),
      weight: vessels.reduce((sum, v) => sum + (v.capacity_weight_kg || 0), 0),
      packages: vessels.reduce((sum, v) => sum + (v.capacity_packages || 0), 0)
    },
    vesselsWithConfiguration: vessels.filter(v => 
      Array.isArray(v.seat_configurations) && v.seat_configurations.length > 0
    ).length
  };
};