// src/features/accounting/components/InvoiceSelectorModal.tsx

import React, { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { Input } from '../../../components/common/Input';
// Importamos el hook desde su nueva ubicación
import { useVoidableInvoices } from '../hooks/useSunatVoids';
import { VoidableInvoice, VoidItem } from '../types';

interface InvoiceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: number | null;
  onSubmit: (items: Omit<VoidItem, 'reason'>[]) => void; // El modal solo devuelve los ítems, no la razón
  isSubmitting: boolean;
}

export const InvoiceSelectorModal: React.FC<InvoiceSelectorModalProps> = ({
  isOpen,
  onClose,
  companyId,
  onSubmit,
  isSubmitting,
}) => {
  const { data: voidableInvoices = [], isLoading } = useVoidableInvoices(companyId);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<number>>(new Set());

  const handleToggleSelection = (invoiceId: number) => {
    setSelectedInvoices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) newSet.delete(invoiceId);
      else newSet.add(invoiceId);
      return newSet;
    });
  };

  const handleSubmit = () => {
    if (selectedInvoices.size === 0) {
      toast.warn('Debe seleccionar al menos una factura.');
      return;
    }

    const itemsToVoid = voidableInvoices
      .filter(inv => selectedInvoices.has(inv.id))
      .map(inv => ({
        document_type_code: inv.document_type_code,
        series: inv.series,
        number: inv.number,
      }));
    
    onSubmit(itemsToVoid);
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Seleccionar Facturas para Anular" maxWidth="3xl">
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-8"><Spinner /></div>
        ) : voidableInvoices.length === 0 ? (
          <div className="text-center p-8 border rounded-md bg-gray-50">
            <p className="text-gray-600">No hay facturas disponibles para dar de baja.</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              {/* ... (código de la tabla sin cambios) ... */}
            </table>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" onClick={handleSubmit} isLoading={isSubmitting} disabled={isLoading || voidableInvoices.length === 0}>
            Añadir a la Comunicación de Baja
          </Button>
        </div>
      </div>
    </Modal>
  );
};