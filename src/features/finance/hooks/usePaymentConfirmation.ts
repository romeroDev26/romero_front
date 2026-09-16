// src/features/finance/hooks/usePaymentConfirmation.ts

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/sileo-toast';
import { paymentService } from '../services/payment.service';
import { PaymentConfirmationData, PaymentTicketData } from '../types/payment.types';
import { ReceivablesItem } from '../types/receivables.types';

/**
 * Hook personalizado para gestionar la confirmación de pagos de encomiendas
 * 
 * Maneja el estado del modal, la lógica de confirmación y la comunicación con el backend
 */
export const usePaymentConfirmation = () => {
  // Estado del modal de confirmación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReceivablesItem | null>(null);
  
  // Estado del modal de ticket pagado
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [paymentTicketData, setPaymentTicketData] = useState<PaymentTicketData | null>(null);

  // Query client para invalidar cache
  const queryClient = useQueryClient();

  // Mutation para confirmar pago
  const confirmPaymentMutation = useMutation({
    mutationFn: (data: PaymentConfirmationData) => paymentService.confirmPayment(data),
    onSuccess: (response) => {
      // Cerrar modal de confirmación
      closeModal();
      
      // Guardar datos del ticket para mostrar en el modal
      if (response.success && response.data) {
        const ticketData = {
          invoice_item_id: response.data.invoice_item_id,
          invoice_id: response.data.invoice_id,
          series: response.data.series,
          number: response.data.number,
          total_payable: response.data.total_payable,
          payment_method_code: response.data.payment_method_code,
          payment_operation_code: response.data.payment_operation_code,
          payment_amount_1: response.data.payment_amount_1,
          payment_method_code_2: response.data.payment_method_code_2,
          payment_operation_code_2: response.data.payment_operation_code_2,
          payment_amount_2: response.data.payment_amount_2,
          confirmed_at: response.data.confirmed_at,
          pdf_ticket_file_path: response.data.pdf_ticket_file_path,
          pdf_ticket58_file_path: response.data.pdf_ticket58_file_path,
        };
        
        setPaymentTicketData(ticketData);
        
        // Abrir modal del ticket
        setIsTicketModalOpen(true);
      }
      
      // Mostrar mensaje de éxito
      toast.success(response.message || 'Pago confirmado exitosamente');
      
      // Pequeño delay antes de invalidar para dar tiempo al backend/CDN
      setTimeout(() => {
        // Invalidar queries para refrescar los datos
        queryClient.invalidateQueries({ queryKey: ['receivables'] });
        // Invalidar cache de facturas para que se actualicen los estados de pago
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['invoice'] });
      }, 1000); // 1 segundo de delay
    },
    onError: (error) => {
      // Mostrar mensaje de error
      toast.error(error.message || 'Error al confirmar el pago');
    },
  });

  /**
   * Abre el modal de confirmación para una encomienda específica
   */
  const openModal = useCallback((item: ReceivablesItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  }, []);

  /**
   * Cierra el modal de confirmación y limpia el estado
   */
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedItem(null);
  }, []);

  /**
   * Cierra el modal del ticket
   */
  const closeTicketModal = useCallback(() => {
    setIsTicketModalOpen(false);
    setPaymentTicketData(null);
  }, []);

  /**
   * Confirma el pago con los datos del formulario
   */
  const confirmPayment = useCallback(async (paymentData: Omit<PaymentConfirmationData, 'invoice_item_id'>) => {
    if (!selectedItem) {
      toast.error('No hay encomienda seleccionada');
      return false;
    }

    try {
      await confirmPaymentMutation.mutateAsync({
        invoice_item_id: selectedItem.invoice_item_id,
        ...paymentData
      });
      return true;
    } catch {
      // Error ya manejado por el mutation
      return false;
    }
  }, [selectedItem, confirmPaymentMutation]);

  return {
    // Estado del modal de confirmación
    isModalOpen,
    selectedItem,
    isConfirming: confirmPaymentMutation.isPending,

    // Estado del modal de ticket
    isTicketModalOpen,
    paymentTicketData,

    // Acciones
    openModal,
    closeModal,
    closeTicketModal,
    confirmPayment,
  };
};
