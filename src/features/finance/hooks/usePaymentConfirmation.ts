// src/features/finance/hooks/usePaymentConfirmation.ts

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { paymentService } from '../services/payment.service';
import { PaymentConfirmationData } from '../types/payment.types';
import { ReceivablesItem } from '../types/receivables.types';

/**
 * Hook personalizado para gestionar la confirmación de pagos de encomiendas
 * 
 * Maneja el estado del modal, la lógica de confirmación y la comunicación con el backend
 */
export const usePaymentConfirmation = () => {
  // Estado del modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReceivablesItem | null>(null);

  // Query client para invalidar cache
  const queryClient = useQueryClient();

  // Mutation para confirmar pago
  const confirmPaymentMutation = useMutation({
    mutationFn: (data: PaymentConfirmationData) => paymentService.confirmPayment(data),
    onSuccess: (response) => {
      // Mostrar mensaje de éxito
      toast.success(response.message || 'Pago confirmado exitosamente');
      
      // Invalidar queries para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
      
      // Cerrar modal
      closeModal();
    },
    onError: (error: any) => {
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
   * Cierra el modal y limpia el estado
   */
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedItem(null);
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
    } catch (error) {
      // Error ya manejado por el mutation
      return false;
    }
  }, [selectedItem, confirmPaymentMutation]);

  return {
    // Estado
    isModalOpen,
    selectedItem,
    isConfirming: confirmPaymentMutation.isPending,

    // Acciones
    openModal,
    closeModal,
    confirmPayment,
  };
};
