import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/sileo-toast';
import { citiesConfigService, portsConfigService } from '../services/ports.cities.service';
import { CityCreateData, CityUpdateData, PortCreateData, PortUpdateData } from '../services/ports.cities.service';
import { PortType } from '../types';
import { getErrorMessage } from '../utils/errorHandler';

// ========================================
// HOOKS PARA CIUDADES
// ========================================

export const useCities = () => {
  return useQuery({
    queryKey: ['cities'],
    queryFn: () => citiesConfigService.getAll({ limit: 200 }),
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateCity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cityData: CityCreateData) => citiesConfigService.create(cityData),
    onSuccess: (newCity) => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      toast.success(`Ciudad "${newCity.name}" creada exitosamente.`);
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Error al crear la ciudad. Verifique que el nombre y código no existan.');
      toast.error(message);
    },
  });
};

export const useUpdateCity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CityUpdateData }) =>
      citiesConfigService.update(id, data),
    onSuccess: (updatedCity) => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      queryClient.setQueryData(['city', updatedCity.id], updatedCity);
      toast.success(`Ciudad "${updatedCity.name}" actualizada exitosamente.`);
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Error al actualizar la ciudad.');
      toast.error(message);
    },
  });
};

export const useDeactivateCity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => citiesConfigService.deactivate(id),
    onSuccess: (deactivatedCity) => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      toast.success(`Ciudad "${deactivatedCity.name}" desactivada exitosamente.`);
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Error al desactivar la ciudad.');
      toast.error(message);
    },
  });
};

// ========================================
// HOOKS PARA PUERTOS
// ========================================

export const usePorts = (params?: { isActive?: boolean; portType?: PortType }) => {
  const { isActive = true, portType } = params || {};

  return useQuery({
    queryKey: ['ports', { isActive }],
    queryFn: () => portsConfigService.getAll({ is_active: isActive, limit: 200 }),
    staleTime: 1000 * 60 * 5,
    select: (allPorts) => {
      if (!portType) {
        return allPorts;
      }
      return allPorts.filter(port => port.port_type === portType);
    },
  });
};

export const useCreatePort = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (portData: PortCreateData) => portsConfigService.create(portData),
    onSuccess: (newPort) => {
      queryClient.invalidateQueries({ queryKey: ['ports'] });
      toast.success(`Puerto "${newPort.name}" creado exitosamente.`);
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Error al crear el puerto. Verifique que el nombre no exista.');
      toast.error(message);
    },
  });
};

export const useUpdatePort = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PortUpdateData }) =>
      portsConfigService.update(id, data),
    onSuccess: (updatedPort) => {
      queryClient.invalidateQueries({ queryKey: ['ports'] });
      queryClient.setQueryData(['port', updatedPort.id], updatedPort);
      toast.success(`Puerto "${updatedPort.name}" actualizado exitosamente.`);
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Error al actualizar el puerto.');
      toast.error(message);
    },
  });
};

export const useDeactivatePort = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => portsConfigService.deactivate(id),
    onSuccess: (deactivatedPort) => {
      queryClient.invalidateQueries({ queryKey: ['ports'] });
      toast.success(`Puerto "${deactivatedPort.name}" desactivado exitosamente.`);
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Error al desactivar el puerto.');
      toast.error(message);
    },
  });
};
