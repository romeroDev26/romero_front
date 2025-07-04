// src/features/fluvial/hooks/useInvoices.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { invoicesService, InvoiceCreateData } from '../../../services/invoices.service';

export const useCreateInvoice = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: InvoiceCreateData) => invoicesService.create(data),
        onSuccess: (newInvoice) => {
            toast.success(`Comprobante ${newInvoice.series}-${String(newInvoice.number).padStart(8, '0')} creado exitosamente.`);
            // Invalidar queries para que se refresque la disponibilidad de asientos
            queryClient.invalidateQueries({ queryKey: ['tripDetails', newInvoice.items?.[0]?.trip_id] });
            queryClient.invalidateQueries({ queryKey: ['availableTrips'] });
        },
        onError: (error: any) => {
            const message = error.response?.data?.detail || "Error al crear el comprobante. Verifique los datos.";
            toast.error(message);
        }
    });
};