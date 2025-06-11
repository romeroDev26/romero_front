// src/hooks/useCitiesPortsData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '../config/api';
import { City, Port } from '../types';

// ========================================
// SERVICIOS
// ========================================

const portsService = {
  getAll: async (params?: { is_active?: boolean }): Promise<Port[]> => {
    const response = await api.get<Port[]>('/config/ports/', { params });
    return response.data;
  },
  
  getById: async (portId: number): Promise<Port> => {
    const response = await api.get<Port>(`/config/ports/${portId}`);
    return response.data;
  },
  
  create: async (portData: Partial<Port>): Promise<Port> => {
    const response = await api.post<Port>('/config/ports/', portData);
    return response.data;
  },
  
  update: async (portId: number, portData: Partial<Port>): Promise<Port> => {
    const response = await api.patch<Port>(`/config/ports/${portId}`, portData);
    return response.data;
  },
  
  delete: async (portId: number): Promise<Port> => {
    const response = await api.delete<Port>(`/config/ports/${portId}`);
    return response.data;
  }
};

const citiesService = {
  getAll: async (params?: { is_active?: boolean }): Promise<City[]> => {
    const response = await api.get<City[]>('/config/cities/', { params });
    return response.data;
  },
  
  getById: async (cityId: number): Promise<City> => {
    const response = await api.get<City>(`/config/cities/${cityId}`);
    return response.data;
  }
};

// ========================================
// HOOKS
// ========================================

export const usePorts = (isActive = true) => {
  return useQuery({
    queryKey: ['ports', { isActive }],
    queryFn: () => portsService.getAll({ is_active: isActive }),
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
};

export const usePort = (portId: number | null) => {
  return useQuery({
    queryKey: ['port', portId],
    queryFn: () => portId ? portsService.getById(portId) : null,
    enabled: !!portId,
  });
};

export const useCities = (isActive = true) => {
  return useQuery({
    queryKey: ['cities', { isActive }],
    queryFn: () => citiesService.getAll({ is_active: isActive }),
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
};

export const useCity = (cityId: number | null) => {
  return useQuery({
    queryKey: ['city', cityId],
    queryFn: () => cityId ? citiesService.getById(cityId) : null,
    enabled: !!cityId,
  });
};

export const useCreatePort = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (portData: Partial<Port>) => portsService.create(portData),
    onSuccess: (newPort) => {
      queryClient.invalidateQueries({ queryKey: ['ports'] });
      toast.success(`Puerto ${newPort.name} creado exitosamente`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al crear el puerto';
      toast.error(message);
    },
  });
};

export const useUpdatePort = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Port> }) => 
      portsService.update(id, data),
    onSuccess: (updatedPort) => {
      queryClient.invalidateQueries({ queryKey: ['ports'] });
      queryClient.invalidateQueries({ queryKey: ['port', updatedPort.id] });
      toast.success(`Puerto ${updatedPort.name} actualizado exitosamente`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al actualizar el puerto';
      toast.error(message);
    },
  });
};

export const useDeletePort = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => portsService.delete(id),
    onSuccess: (deletedPort) => {
      queryClient.invalidateQueries({ queryKey: ['ports'] });
      toast.success(`Puerto ${deletedPort.name} desactivado exitosamente`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al desactivar el puerto';
      toast.error(message);
    },
  });
};