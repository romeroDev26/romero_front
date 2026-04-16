// src/features/finance/components/payment/ViewTicketModal.tsx

import React from 'react';
import { FileText, Receipt } from 'lucide-react';
import { Modal } from '../../../../components/common/Modal';

interface ViewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  ticketType: '80mm' | '58mm' | null;
  invoiceItemId: number;
}

/**
 * Modal simple para visualizar el PDF de una encomienda ya pagada
 * No requiere metadatos del pago, solo necesita la URL del PDF
 */
export const ViewTicketModal: React.FC<ViewTicketModalProps> = ({
  isOpen,
  onClose,
  pdfUrl,
  ticketType,
  invoiceItemId,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Comprobante - Encomienda #${invoiceItemId}`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* PDF */}
        {pdfUrl ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">
                  Ticket de Pago
                </span>
                {ticketType && (
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                    {ticketType}
                  </span>
                )}
              </div>
            </div>
            <div className="h-[600px] bg-gray-50">
              <iframe
                src={pdfUrl}
                className="h-full w-full border-0"
                title={`Ticket Encomienda #${invoiceItemId}`}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-16">
            <FileText className="mb-3 h-14 w-14 text-gray-300" />
            <p className="text-sm font-medium text-gray-400">Ticket no disponible</p>
            <p className="text-xs text-gray-400">El comprobante no se pudo cargar</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
