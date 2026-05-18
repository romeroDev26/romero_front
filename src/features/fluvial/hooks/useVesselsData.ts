// src/features/fluvial/hooks/useVesselsData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/sileo-toast';
import {
  vesselsService,
  VesselCreateData,
  VesselUpdateData,
  SeatConfigurationCreateData,
} from '../../../services/vessels.service';

// Helper para obtener el company_id. Idealmente vendría de un contexto de autenticación.
const getCurrentCompanyId = (): number => {
  return 1; // Usamos 1 como valor fijo por ahora.
};

// ========================================
// HOOKS PARA EMBARCACIONES
// ========================================

export const useVessels = (isActive: boolean | undefined = true) => {
  const companyId = getCurrentCompanyId();
  return useQuery({
    queryKey: ['vessels', { companyId, isActive }],
    queryFn: () => vesselsService.getAll({
      company_id: companyId,
      is_active: isActive,
    }),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useVessel = (vesselId: number | null) => {
  return useQuery({
    queryKey: ['vessel', vesselId],
    queryFn: () => (vesselId ? vesselsService.getById(vesselId) : null),
    enabled: !!vesselId,
  });
};

export const useCreateVessel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VesselCreateData) => vesselsService.create(data),
    onSuccess: (newVessel) => {
      queryClient.invalidateQueries({ queryKey: ['vessels'] });
      toast.success(`Embarcación "${newVessel.name}" creada.`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear la embarcación');
    },
  });
};

export const useUpdateVessel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: VesselUpdateData }) =>
      vesselsService.update(id, data),
    onSuccess: (updatedVessel) => {
      queryClient.invalidateQueries({ queryKey: ['vessels'] });
      queryClient.invalidateQueries({ queryKey: ['vessel', updatedVessel.id] });
      toast.success(`Embarcación "${updatedVessel.name}" actualizada.`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar la embarcación');
    },
  });
};

export const useDeleteVessel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => vesselsService.delete(id),
    onSuccess: (deletedVessel) => {
      queryClient.invalidateQueries({ queryKey: ['vessels'] });
      queryClient.invalidateQueries({ queryKey: ['vessel', deletedVessel.id] });
      toast.success(`Embarcación "${deletedVessel.name}" desactivada.`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al desactivar la embarcación');
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
      vesselsService.addMultipleSeatConfigurations(vesselId, configs),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vessel', variables.vesselId] });
      queryClient.invalidateQueries({ queryKey: ['vessels'] });
      toast.success('Configuración de asientos actualizada.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al configurar asientos');
    },
  });
};

export const useDeleteSeatConfiguration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (configId: number) => vesselsService.deleteSeatConfiguration(configId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vessels', 'vessel'] });
      toast.success('Configuración de asientos eliminada.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al eliminar la configuración');
    },
  });
};

// ========================================
// HOOKS AUXILIARES
// ========================================

export const useFleetStatistics = () => {
  const { data: vessels = [], isLoading } = useVessels();
  const vesselsWithConfiguration = vessels.filter(v =>
    typeof v.seat_configurations_count === 'number' && v.seat_configurations_count > 0
  ).length;

  return {
    isLoading,
    totalVessels: vessels.length,
    activeVessels: vessels.filter(v => v.is_active).length,
    inactiveVessels: vessels.filter(v => !v.is_active).length,
    totalCapacity: {
      passengers: vessels.reduce((sum, v) => sum + (v.capacity_passengers || 0), 0),
      weight: vessels.reduce((sum, v) => sum + (v.capacity_weight_kg || 0), 0),
      packages: vessels.reduce((sum, v) => sum + (v.capacity_packages || 0), 0)
    },
    vesselsWithConfiguration
  };
};
