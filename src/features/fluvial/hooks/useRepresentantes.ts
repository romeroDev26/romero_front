// src/features/fluvial/hooks/useRepresentantes.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { 
  representantesService, 
  CompanyInvoiceWithRepresentatives
} from '../../../services/representantes.service';

// Función local para manejar errores de API
const getErrorMessage = (error: any): string => {
  const detail = error.response?.data?.detail || error.message;
  
  switch (error.response?.status) {
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
    
    onSuccess: (data: any) => {
      const { invoice, representatives, summary } = data;
      
      toast.success(
        `Factura ${invoice.series}-${String(invoice.number).padStart(8, '0')} creada con ${representatives.length} representantes`,
        { 
          autoClose: 8000,
          position: "top-right"
        }
      );
      
      // Invalidar queries relacionadas para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['seatAssignments'] });
      
      // Log detallado para debugging
      console.log('Factura empresarial creada exitosamente:', {
        invoice_id: invoice.id,
        invoice_number: `${invoice.series}-${invoice.number}`,
        representatives_count: representatives.length,
        total_amount: invoice.total_amount,
        summary,
        timestamp: new Date().toISOString()
      });
    },
    
    onError: (error: any) => {
      const friendlyMessage = getErrorMessage(error);
      toast.error(`Error: ${friendlyMessage}`, { 
        autoClose: 10000,
        position: "top-right"
      });
      
      // Log detallado del error para debugging
      console.error('Error creando factura empresarial:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
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
