// src/features/fluvial/hooks/usePassengerService.ts
import { useQuery } from '@tanstack/react-query';
import { productsServicesService } from '../../../services/products-services.service';
import { ProductService } from '../../../types';

// ID o código interno del servicio de pasajes.
// Es mejor usar un código interno si lo tienes, ya que es más descriptivo que un ID.
// Por ahora, usaremos el ID como se mencionó.
const PASSENGER_SERVICE_ID = 1;

/**
 * Hook dedicado para obtener y cachear los datos del servicio de "Transporte de Pasajeros".
 * Este servicio contiene datos cruciales como el tax_category_code por defecto.
 */
export const usePassengerService = () => {
  return useQuery<ProductService | null, Error>({
    // La queryKey es específica para este único servicio.
    queryKey: ['passengerService', PASSENGER_SERVICE_ID],
    
    queryFn: async () => {
      try {
        // Usamos el servicio existente para buscar por ID.
        const service = await productsServicesService.getById(PASSENGER_SERVICE_ID);
        return service;
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.error(`Error crítico: El servicio de pasajes con ID ${PASSENGER_SERVICE_ID} no fue encontrado.`);
          // Devolvemos null si no se encuentra, para manejar el error en la UI.
          return null;
        }
        throw error;
      }
    },
    
    // Este dato es de configuración y rara vez cambia. Lo cacheamos "para siempre"
    // durante la sesión del usuario para evitar llamadas innecesarias a la API.
    staleTime: Infinity,
    retry: false, // No reintentar si falla, ya que es un dato de configuración esencial.
  });
};