//src/hooks/useBranchOffices.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { branchOfficesService, BranchOfficeCreateData, BranchOfficeUpdateData } from '../services/branchOffices.service';
import { getErrorMessage } from '../utils/errorHandler';

const QUERY_KEY = 'branchOffices';

export const useBranchOffices = (companyId: number | undefined) => {
  return useQuery({
    queryKey: [QUERY_KEY, companyId],
    queryFn: () => branchOfficesService.getAllByCompany(companyId!),
    enabled: !!companyId,
  });
};

export const useCreateBranchOffice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BranchOfficeCreateData) => branchOfficesService.create(data),
    onSuccess: (newOffice) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(`Sucursal "${newOffice.name}" creada exitosamente.`);
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Error al crear la sucursal.');
      toast.error(message);
    },
  });
};

export const useUpdateBranchOffice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BranchOfficeUpdateData }) => branchOfficesService.update(id, data),
    onSuccess: (updatedOffice) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(`Sucursal "${updatedOffice.name}" actualizada.`);
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Error al actualizar la sucursal.');
      toast.error(message);
    },
  });
};

export const useDeactivateBranchOffice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => branchOfficesService.deactivate(id),
    onSuccess: (deactivatedOffice) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.warning(`Sucursal "${deactivatedOffice.name}" ha sido desactivada.`);
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Error al desactivar. Verifique que no sea la principal o no tenga usuarios asignados.');
      toast.error(message);
    },
  });
};