// src/features/fluvial/hooks/useSunatData.ts
import { useMutation } from '@tanstack/react-query';
import { externalQueryService, DniResponse, RucResponse } from '../../../services/external.service';
import { toast } from 'react-toastify';

export const useSunatData = () => {
  const queryDniMutation = useMutation<DniResponse, Error, string>({
    mutationFn: (dni: string) => externalQueryService.queryDni(dni),
    onSuccess: () => {
      // Toast eliminado para evitar múltiples mensajes durante el flujo de venta
    },
    onError: (error) => {
      toast.error(`Error al consultar DNI: ${error.message}`);
    },
  });

  const queryRucMutation = useMutation<RucResponse, Error, string>({
    mutationFn: (ruc: string) => externalQueryService.queryRuc(ruc),
     onSuccess: () => {
      // Toast eliminado para evitar múltiples mensajes durante el flujo de venta
    },
    onError: (error) => {
      toast.error(`Error al consultar RUC: ${error.message}`);
    },
  });

  return {
    queryDni: queryDniMutation.mutateAsync,
    isQueryingDni: queryDniMutation.isPending,
    queryRuc: queryRucMutation.mutateAsync,
    isQueryingRuc: queryRucMutation.isPending,
  };
};