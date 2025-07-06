// src/features/fluvial/hooks/useInvoices.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { invoicesService, InvoiceCreateData } from '../../../services/invoices.service';
import { Invoice } from '../../../types'; // Asegúrate de importar Invoice

// La mutación ahora recibirá un objeto con los datos de la factura y el tripId
interface CreateInvoiceParams {
  invoiceData: InvoiceCreateData;
  tripId: number;
}

export const useCreateInvoice = () => {
    const queryClient = useQueryClient();

    // La mutación ahora trabaja con el tipo CreateInvoiceParams
    return useMutation<Invoice, Error, CreateInvoiceParams>({
        mutationFn: ({ invoiceData }) => invoicesService.create(invoiceData),

        // El callback onSuccess recibe la respuesta de la API y las variables que se pasaron a la mutación
        onSuccess: (newInvoice, variables) => {
            toast.success(`Comprobante ${newInvoice.series}-${String(newInvoice.number).padStart(8, '0')} creado.`);

            // Invalidamos la query del seat-map para el viaje que acabamos de afectar.
            // React Query automáticamente volverá a solicitar los datos para esa query.
            console.log(`Invalidando query del seat-map para el tripId: ${variables.tripId}`);
            queryClient.invalidateQueries({ queryKey: ['seatMap', variables.tripId] });

            // También es buena idea invalidar los resúmenes de viajes si muestran disponibilidad
            queryClient.invalidateQueries({ queryKey: ['tripsView'] });
            queryClient.invalidateQueries({ queryKey: ['tripDetails', variables.tripId] });
        },
        onError: (error: any) => {
            const message = error.response?.data?.detail || "Error al crear el comprobante.";
            toast.error(message);
        }
    });
};
