// src/features/fluvial/hooks/useClientManager.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsService } from '../../../services/clients.service';
import { Client, CreateClientData } from '../../../types';
import { SunatDocType } from '../types/sunat.types';
import { toast } from 'react-toastify';

/**
 * Determina si un tipo de documento requiere creación directa sin búsqueda previa
 * (documentos internacionales/especiales)
 */
const isInternationalDocument = (docType: string): boolean => {
  return [
    SunatDocType.CARNET_EXTRANJERIA,  // '4' - Carnet de Extranjería
    SunatDocType.PASAPORTE,           // '7' - Pasaporte
    SunatDocType.CEDULA_DIPLOMATICA,  // 'A' - Cédula Diplomática  
    SunatDocType.OTROS,               // '0' - Otros (Sin RUC)
  ].includes(docType as SunatDocType);
};

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
      
      // Para documentos internacionales/especiales, crear directamente sin buscar
      if (isInternationalDocument(clientDataToProcess.doc_type)) {
        if (!clientDataToProcess.name?.trim()) {
          throw new Error("El nombre es requerido para crear un nuevo cliente.");
        }
        
        // Validar que tenga los campos requeridos para documentos internacionales
        if (!clientDataToProcess.country_code?.trim()) {
          throw new Error("El país es requerido para documentos internacionales.");
        }
        
        const createdClient = await clientsService.create(clientDataToProcess);
        return createdClient;
      }
      
      // Para documentos peruanos (DNI/RUC), usar el flujo original de búsqueda + creación
      
      // 1. Intentar buscar el cliente existente
      const existingClient = await clientsService.findByDocument(
        clientDataToProcess.doc_number
      );
      
      // 2. Si el cliente ya existe, actualizamos sus datos con la información del formulario
      if (existingClient) {
        // Preparar datos para actualización (el backend espera "address" no "address_line")
        const updateData = {
          name: clientDataToProcess.name,
          address: clientDataToProcess.address_line, // Mapear address_line -> address
          email: clientDataToProcess.email,
          phone: clientDataToProcess.phone,
          country_code: clientDataToProcess.country_code,
          // Solo incluir campos que tienen valor
          ...(clientDataToProcess.department && { department: clientDataToProcess.department }),
          ...(clientDataToProcess.province && { province: clientDataToProcess.province }),
          ...(clientDataToProcess.district && { district: clientDataToProcess.district }),
        };
        
        const updatedClient = await clientsService.update(existingClient.id, updateData);
        return updatedClient;
      }
      
      // 3. Si no existe, lo creamos.
      if (!clientDataToProcess.name?.trim()) {
        throw new Error("El nombre es requerido para crear un nuevo cliente.");
      }
      
      const createdClient = await clientsService.create(clientDataToProcess);
      return createdClient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      // Toast eliminado para evitar múltiples mensajes de éxito
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