// src/features/fluvial/hooks/useClientManager.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsService } from '../../../services/clients.service';
import { Client, CreateClientData } from '../../../types';
import { toast } from 'react-toastify';

/**
 * Hook para buscar o crear un cliente.
 */
export const useClientManager = () => {
  const queryClient = useQueryClient();

  const clientMutation = useMutation<Client, Error, CreateClientData>({
    mutationFn: async (clientDataToProcess: CreateClientData): Promise<Client> => {
      if (!clientDataToProcess.doc_number?.trim()) {
        throw new Error("El número de documento es requerido.");
      }
      
      // 1. Intentar buscar el cliente existente usando el método actualizado
      const existingClient = await clientsService.findByDocument(
        clientDataToProcess.doc_number
      );
      
      // 2. Si el cliente ya existe, lo devolvemos.
      if (existingClient) {
        return existingClient;
      }
      
      // 3. Si no existe, lo creamos.
      if (!clientDataToProcess.name?.trim()) {
        throw new Error("El nombre es requerido para crear un nuevo cliente.");
      }
      
      toast.info(`Registrando nuevo cliente: ${clientDataToProcess.name}`);
      const createdClient = await clientsService.create(clientDataToProcess);
      return createdClient;
    },
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(`Cliente ${client.name} procesado correctamente.`);
    },
    onError: (error) => {
      toast.error(`Error al procesar el cliente: ${error.message}`);
    }
  });

  return {
    findOrCreateClient: clientMutation.mutateAsync,
    isProcessingClient: clientMutation.isPending,
  };
};