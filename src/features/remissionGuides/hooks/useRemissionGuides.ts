// src/features/remissionGuides/hooks/useRemissionGuides.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { 
  remissionGuidesService, 
  ListGuidesParams,
  RemissionGuideTransportistaCreateData,
  ProcessSunatData,
  CheckTicketStatusData,
  ProcessCdrData
} from '../../../services/remissionGuides.service';
import {
  remissionGuidesSenderService,
  ListSenderGuidesParams
} from '../../../services/remissionGuidesSender.service';
import { RemissionGuidesByBranchOfficeResponse } from '../../../types';

// Hook para listar guías de remisión
export const useRemissionGuides = (params: ListGuidesParams & { enabled?: boolean }) => {
  const { enabled = true, ...queryParams } = params;
  
  return useQuery({
    queryKey: ['remissionGuides', queryParams],
    queryFn: () => {
      if (!queryParams.company_id) {
        return Promise.resolve([]);
      }
      return remissionGuidesService.list(queryParams);
    },
    enabled: enabled && !!queryParams.company_id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para obtener una guía específica
export const useRemissionGuide = (guideId: number | null, companyId?: number) => {
  return useQuery({
    queryKey: ['remissionGuide', guideId, companyId],
    queryFn: () => remissionGuidesService.getById(guideId!, companyId),
    enabled: !!guideId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

// Hook para obtener estado SUNAT de una guía
export const useRemissionGuideSunatStatus = (guideId: number | null, companyId: number | null) => {
  return useQuery({
    queryKey: ['remissionGuideSunatStatus', guideId, companyId],
    queryFn: () => remissionGuidesService.getSunatStatus(guideId!, companyId!),
    enabled: !!guideId && !!companyId,
    refetchInterval: (query) => {
      // Solo hacer polling si está en estados que cambian
      const pollingStates = ['SENT', 'ACCEPTED'];
      const data = query.state.data;
      return data?.sunat_status && pollingStates.includes(data.sunat_status) ? 30000 : false;
    },
    staleTime: 1000 * 30, // 30 segundos
  });
};

// Hook para crear una nueva guía
export const useCreateRemissionGuide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RemissionGuideTransportistaCreateData) => remissionGuidesService.create(data),
    onSuccess: () => {
      toast.success('Guía de remisión creada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['remissionGuides'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Error al crear la guía de remisión';
      toast.error(errorMessage);
    },
  });
};

// Hook para actualizar una guía
export const useUpdateRemissionGuide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ guideId, data }: { guideId: number; data: Partial<RemissionGuideTransportistaCreateData> }) => 
      remissionGuidesService.update(guideId, data),
    onSuccess: (data) => {
      toast.success('Guía de remisión actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['remissionGuides'] });
      queryClient.invalidateQueries({ queryKey: ['remissionGuide', data.id] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Error al actualizar la guía de remisión';
      toast.error(errorMessage);
    },
  });
};

// Hook para procesar una guía en SUNAT
export const useProcessSunatGuide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ guideId, data }: { guideId: number; data: ProcessSunatData }) => 
      remissionGuidesService.processSunat(guideId, data),
    onSuccess: (data) => {
      toast.success(data.message || 'Guía enviada a SUNAT exitosamente');
      queryClient.invalidateQueries({ queryKey: ['remissionGuides'] });
      queryClient.invalidateQueries({ queryKey: ['remissionGuide', data.guide_id] });
      queryClient.invalidateQueries({ queryKey: ['remissionGuideSunatStatus', data.guide_id] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Error al procesar la guía en SUNAT';
      toast.error(errorMessage);
    },
  });
};

// Hook para consultar estado del ticket
export const useCheckTicketStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ guideId, data }: { guideId: number; data: CheckTicketStatusData }) => 
      remissionGuidesService.checkTicketStatus(guideId, data),
    onSuccess: (data) => {
      const statusMessages = {
        'ACCEPTED': 'Estado consultado: Guía aceptada por SUNAT',
        'REJECTED': 'Estado consultado: Guía rechazada por SUNAT',
        'PENDING': 'Estado consultado: Guía pendiente de procesamiento',
        'SENT': 'Estado consultado: Guía enviada a SUNAT'
      };
      
      const message = statusMessages[data.current_status as keyof typeof statusMessages] || 
                     data.message || 'Estado consultado exitosamente';
      toast.info(message);
      
      queryClient.invalidateQueries({ queryKey: ['remissionGuides'] });
      queryClient.invalidateQueries({ queryKey: ['remissionGuide', data.guide_id] });
      queryClient.invalidateQueries({ queryKey: ['remissionGuideSunatStatus', data.guide_id] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Error al consultar el estado del ticket';
      toast.error(errorMessage);
    },
  });
};

// Hook para listar guías de remisión del remitente
export const useRemissionGuidesSender = (params: ListSenderGuidesParams & { enabled?: boolean }) => {
  const { enabled = true, ...queryParams } = params;
  
  return useQuery({
    queryKey: ['remissionGuidesSender', queryParams],
    queryFn: () => {
      if (!queryParams.company_id) {
        return Promise.resolve([]);
      }
      return remissionGuidesSenderService.list(queryParams);
    },
    enabled: enabled && !!queryParams.company_id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para obtener una guía del remitente específica
export const useRemissionGuideSender = (guideId: number | null, companyId?: number) => {
  return useQuery({
    queryKey: ['remissionGuideSender', guideId, companyId],
    queryFn: () => remissionGuidesSenderService.getById(guideId!, companyId),
    enabled: !!guideId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

// Hook para obtener estado SUNAT de una guía del remitente
export const useRemissionGuideSenderSunatStatus = (guideId: number | null, companyId: number | null) => {
  return useQuery({
    queryKey: ['remissionGuideSenderSunatStatus', guideId, companyId],
    queryFn: () => remissionGuidesSenderService.getSunatStatus(guideId!, companyId!),
    enabled: !!guideId && !!companyId,
    refetchInterval: (query) => {
      // Solo hacer polling si está en estados que cambian
      const pollingStates = ['SENT', 'ACCEPTED'];
      const data = query.state.data;
      return data?.sunat_status && pollingStates.includes(data.sunat_status) ? 30000 : false;
    },
    staleTime: 1000 * 30, // 30 segundos
  });
};

// Hook para crear una nueva guía del remitente
export const useCreateRemissionGuideSender = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => remissionGuidesSenderService.create(data),
    onSuccess: () => {
      toast.success('Guía de remisión del remitente creada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['remissionGuidesSender'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Error al crear la guía de remisión del remitente';
      toast.error(errorMessage);
    },
  });
};

// Hook para actualizar una guía del remitente
export const useUpdateRemissionGuideSender = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ guideId, data }: { guideId: number; data: Partial<any> }) => 
      remissionGuidesSenderService.update(guideId, data),
    onSuccess: (data) => {
      toast.success('Guía de remisión del remitente actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['remissionGuidesSender'] });
      queryClient.invalidateQueries({ queryKey: ['remissionGuideSender', data.id] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Error al actualizar la guía de remisión del remitente';
      toast.error(errorMessage);
    },
  });
};

// Hook para procesar una guía del remitente en SUNAT
export const useProcessSunatGuideSender = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ guideId, data }: { guideId: number; data: ProcessSunatData }) => 
      remissionGuidesSenderService.processSunat(guideId, data),
    onSuccess: (data) => {
      toast.success(data.message || 'Guía enviada a SUNAT exitosamente');
      queryClient.invalidateQueries({ queryKey: ['remissionGuidesSender'] });
      queryClient.invalidateQueries({ queryKey: ['remissionGuideSender', data.guide_id] });
      queryClient.invalidateQueries({ queryKey: ['remissionGuideSenderSunatStatus', data.guide_id] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Error al procesar la guía del remitente en SUNAT';
      toast.error(errorMessage);
    },
  });
};

// Hook para consultar estado del ticket para guía del remitente
export const useCheckTicketStatusSender = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ guideId, data }: { guideId: number; data: CheckTicketStatusData }) => 
      remissionGuidesSenderService.checkTicketStatus(guideId, data),
    onSuccess: (data) => {
      const statusMessages = {
        'ACCEPTED': 'Estado consultado: Guía aceptada por SUNAT',
        'REJECTED': 'Estado consultado: Guía rechazada por SUNAT',
        'PENDING': 'Estado consultado: Guía pendiente de procesamiento',
        'SENT': 'Estado consultado: Guía enviada a SUNAT'
      };
      
      const message = statusMessages[data.current_status as keyof typeof statusMessages] || 
                     data.message || 'Estado consultado exitosamente';
      toast.info(message);
      
      queryClient.invalidateQueries({ queryKey: ['remissionGuidesSender'] });
      queryClient.invalidateQueries({ queryKey: ['remissionGuideSender', data.guide_id] });
      queryClient.invalidateQueries({ queryKey: ['remissionGuideSenderSunatStatus', data.guide_id] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Error al consultar el estado del ticket del remitente';
      toast.error(errorMessage);
    },
  });
};

// Hook para procesar CDR
export const useProcessCdr = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ guideId, data }: { guideId: number; data: ProcessCdrData }) => 
      remissionGuidesService.processCdr(guideId, data),
    onSuccess: (data) => {
      if (data.cdr_processed) {
        toast.success(data.message || 'CDR procesado exitosamente');
      } else {
        toast.info(data.message || 'CDR no disponible aún');
      }
      
      queryClient.invalidateQueries({ queryKey: ['remissionGuides'] });
      queryClient.invalidateQueries({ queryKey: ['remissionGuide', data.guide_id] });
      queryClient.invalidateQueries({ queryKey: ['remissionGuideSunatStatus', data.guide_id] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Error al procesar el CDR';
      toast.error(errorMessage);
    },
  });
};

// Hook para procesar CDR para guía del remitente
export const useProcessCdrSender = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ guideId, data }: { guideId: number; data: ProcessCdrData }) => 
      remissionGuidesSenderService.processCdr(guideId, data),
    onSuccess: (data) => {
      if (data.cdr_processed) {
        toast.success(data.message || 'CDR procesado exitosamente');
      } else {
        toast.info(data.message || 'CDR no disponible aún');
      }
      
      queryClient.invalidateQueries({ queryKey: ['remissionGuidesSender'] });
      queryClient.invalidateQueries({ queryKey: ['remissionGuideSender', data.guide_id] });
      queryClient.invalidateQueries({ queryKey: ['remissionGuideSenderSunatStatus', data.guide_id] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Error al procesar el CDR del remitente';
      toast.error(errorMessage);
    },
  });
};

// Hook para obtener todas las guías (transportista y remitente) por sucursal
export const useRemissionGuidesByBranchOffice = (branchOfficeId: number | null) => {
  return useQuery({
    queryKey: ['remissionGuidesByBranchOffice', branchOfficeId],
    queryFn: () => remissionGuidesSenderService.getAllByBranchOffice(branchOfficeId!),
    enabled: !!branchOfficeId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    select: (data: RemissionGuidesByBranchOfficeResponse) => ({
      transportista: data.filter((guide: any) => guide.guide_type === 'transportista'),
      remitente: data.filter((guide: any) => guide.guide_type === 'remitente')
    })
  });
};