// src/features/fluvial/hooks/useRepresentantes.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saleNotify } from '@/utils/sileo-toast';
import { 
  representantesService, 
  CompanyInvoiceWithRepresentatives
} from '../../../services/representantes.service';
import { asApiError, detailToString } from '../../../utils/errorHandler';

/**
 * Traduce los errores del endpoint de facturas empresariales a mensajes de
 * dominio. No reemplaza a getErrorMessage de utils: alli se extrae el mensaje
 * del backend, aqui se decide que decirle al vendedor segun el caso.
 */
const getRepresentanteErrorMessage = (error: unknown): string => {
  const apiError = asApiError(error);
  const detail = detailToString(apiError.response?.data?.detail) || apiError.message;

  switch (apiError.response?.status) {
    case 400:
      if (detail?.includes('representante')) {
        return 'Error en los datos del representante. Verifique la información.';
      } else if (detail?.includes('documento')) {
        return 'Número de documento inválido o duplicado.';
      }
      return 'Error en los datos enviados.';
      
    case 404:
      if (detail?.includes('trip') || detail?.includes('viaje')) {
        return 'El viaje seleccionado no existe o está inactivo.';
      } else if (detail?.includes('Parada')) {
        return 'Una o más paradas seleccionadas no son válidas.';
      }
      return 'Recurso no encontrado.';
      
    case 422:
      return `Error de datos: ${detail}`;
      
    case 500:
      return 'Error interno del servidor. Intente nuevamente en unos momentos.';
      
    default:
      return 'Error inesperado. Contacte al soporte técnico.';
  }
};

export function useRepresentantes() {
  const queryClient = useQueryClient();

  // NUEVA: Mutación única para crear factura empresarial completa
  const createCompanyInvoiceWithRepresentatives = useMutation({
    mutationFn: (data: CompanyInvoiceWithRepresentatives) => 
      representantesService.createCompanyInvoiceWithRepresentatives(data),
    
    onSuccess: (data) => {
      const { invoice, representatives } = data;
      
      saleNotify.success(
        'Factura empresarial creada',
        `${invoice.series}-${String(invoice.number).padStart(8, '0')} · ${representatives.length} representantes registrados`
      );
      
      // Invalidar queries relacionadas para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['seatAssignments'] });
    },
    
    onError: (error) => {
      const apiError = asApiError(error);
      const friendlyMessage = getRepresentanteErrorMessage(error);
      saleNotify.error('Error en factura empresarial', friendlyMessage);
      
      // Log detallado del error para debugging
      console.error('Error creando factura empresarial:', {
        error: error.message,
        response: apiError.response?.data,
        status: apiError.response?.status,
        timestamp: new Date().toISOString()
      });
    }
  });

  return {
    // NUEVO: Función principal simplificada
    createCompanyInvoiceWithRepresentatives: createCompanyInvoiceWithRepresentatives.mutateAsync,
    
    // Estados de la mutación
    isCreating: createCompanyInvoiceWithRepresentatives.isPending,
    error: createCompanyInvoiceWithRepresentatives.error,
    isSuccess: createCompanyInvoiceWithRepresentatives.isSuccess,
    
    // Resetear estado (útil para limpiar errores)
    reset: createCompanyInvoiceWithRepresentatives.reset
  };
}
