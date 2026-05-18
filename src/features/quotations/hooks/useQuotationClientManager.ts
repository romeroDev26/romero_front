import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsService } from '../../../services/clients.service';
import { Client, CreateClientData } from '../../../types/index';
import { SunatDocType } from '../../../features/fluvial/types/sunat.types';
import { toast } from '@/utils/sileo-toast';

const isInternationalDocument = (docType: string): boolean => {
  return [
    SunatDocType.CARNET_EXTRANJERIA,
    SunatDocType.PASAPORTE,
    SunatDocType.CEDULA_DIPLOMATICA,
    SunatDocType.OTROS,
  ].includes(docType as SunatDocType);
};

export const useQuotationClientManager = () => {
  const queryClient = useQueryClient();

  const clientMutation = useMutation<Client, Error, CreateClientData>({
    mutationFn: async (clientDataToProcess: CreateClientData): Promise<Client> => {
      if (!clientDataToProcess.doc_number?.trim()) {
        throw new Error('El número de documento es requerido.');
      }
      if (isInternationalDocument(clientDataToProcess.doc_type)) {
        if (!clientDataToProcess.name?.trim()) {
          throw new Error('El nombre es requerido para crear un nuevo cliente.');
        }
        if (!clientDataToProcess.country_code?.trim()) {
          throw new Error('El país es requerido para documentos internacionales.');
        }
        const createdClient = await clientsService.create(clientDataToProcess);
        return createdClient;
      }
      const existingClient = await clientsService.findByDocument(
        clientDataToProcess.doc_number
      );
      if (existingClient) {
        const updateData = {
          name: clientDataToProcess.name,
          address: clientDataToProcess.address_line,
          email: clientDataToProcess.email,
          phone: clientDataToProcess.phone,
          country_code: clientDataToProcess.country_code,
          ...(clientDataToProcess.department && { department: clientDataToProcess.department }),
          ...(clientDataToProcess.province && { province: clientDataToProcess.province }),
          ...(clientDataToProcess.district && { district: clientDataToProcess.district }),
        };
        const updatedClient = await clientsService.update(existingClient.id, updateData);
        return updatedClient;
      }
      if (!clientDataToProcess.name?.trim()) {
        throw new Error('El nombre es requerido para crear un nuevo cliente.');
      }
      const createdClient = await clientsService.create(clientDataToProcess);
      return createdClient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error) => {
      toast.error(`Error al procesar el cliente: ${error.message}`);
    },
  });

  return {
    findOrCreateClient: clientMutation.mutateAsync,
    isProcessingClient: clientMutation.isPending,
  };
};
