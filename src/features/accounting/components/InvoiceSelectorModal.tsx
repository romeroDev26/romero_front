// src/features/accounting/components/InvoiceSelectorModal.tsx

import React, { useState } from 'react';
import { format } from 'date-fns';
import { toast } from '@/utils/sileo-toast';
// Icon imports removed (no usados)
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
// Input import removed (no usado)
import { useNavigate } from 'react-router-dom';
import { invoicesService } from '../../../services/invoices.service';
// Importamos el hook desde su nueva ubicación
import { useVoidableInvoices } from '../hooks/useSunatVoids';
import { VoidableInvoice } from '../types';
import type { Invoice } from '../../../types';
import type { VoidDocumentItem } from '../types';

interface InvoiceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: number | null;
  // El modal solo devuelve los identificadores de los documentos elegidos,
  // no la razon de la baja: la agrega quien lo consume.
  onSubmit: (items: Omit<VoidDocumentItem, 'reason'>[]) => void; // El modal solo devuelve los ítems, no la razón
  isSubmitting: boolean;
  /** Si true, al hacer click en una factura navegamos a la página de anulación */
  redirectToAnnulOnSelect?: boolean;
}

export const InvoiceSelectorModal: React.FC<InvoiceSelectorModalProps> = ({
  isOpen,
  onClose,
  companyId,
  onSubmit,
  isSubmitting,
  redirectToAnnulOnSelect = false,
}) => {
  const { data: voidableInvoices = [], isLoading } = useVoidableInvoices(companyId);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<number>>(new Set());
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [confirmInvoice, setConfirmInvoice] = useState<Invoice | null>(null);
  const navigate = useNavigate();

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

  const handleInvoiceClick = async (invoice: VoidableInvoice) => {
    if (redirectToAnnulOnSelect) {
      // En lugar de navegar inmediatamente, cargamos detalle y mostramos confirmación
      try {
        setLoadingDetail(true);
        const invoiceDetail = await invoicesService.getById(invoice.id);
        setConfirmInvoice(invoiceDetail);
      } catch (error) {
        console.error('Error al cargar detalle de factura:', error);
        toast.error('No se pudo cargar la factura seleccionada');
      } finally {
        setLoadingDetail(false);
      }
      return;
    }

    // Modo multi-selección habitual
    handleToggleSelection(invoice.id);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Seleccionar Facturas para Anular" maxWidth="3xl">
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8"><Spinner /></div>
          ) : voidableInvoices.length === 0 ? (
            <div className="text-center p-8 border rounded-md bg-dm-bg-secondary">
              <p className="text-dm-text-secondary">No hay facturas disponibles para dar de baja.</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <div className="space-y-2 p-3">
                {voidableInvoices.map(inv => (
                  <div
                    key={inv.id}
                    onClick={() => handleInvoiceClick(inv)}
                    className="p-3 hover:bg-dm-bg-hover cursor-pointer border rounded-md transition-colors flex justify-between items-start"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{inv.series}-{String(inv.number).padStart(8, '0')} <span className="ml-2 text-sm text-dm-text-muted">({inv.document_type_code === '01' ? 'Factura' : 'Boleta'})</span></div>
                      <div className="text-sm text-dm-text-secondary mt-1">{inv.client_name}</div>
                      <div className="text-xs text-dm-text-muted mt-1">Emitida: {format(new Date(inv.issue_date), 'dd/MM/yyyy')}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">S/ {inv.total_payable}</div>
                      {redirectToAnnulOnSelect ? (
                        loadingDetail && <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Cargando detalles...</div>
                      ) : (
                        <input
                          type="checkbox"
                          checked={selectedInvoices.has(inv.id)}
                          onChange={() => handleToggleSelection(inv.id)}
                          className="ml-3"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>
                  </div>
                ))}
                {voidableInvoices.length === 0 && (
                  <div className="text-center py-8 text-dm-text-muted">
                    <div>No hay facturas disponibles para anular</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-3">
            <div className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Nota:</strong> Solo se muestran facturas que pueden ser afectadas por notas de crédito.
              Al seleccionar una factura, se cargarán automáticamente todos sus datos y productos.
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            {!redirectToAnnulOnSelect && (
              <Button variant="danger" onClick={handleSubmit} isLoading={isSubmitting} disabled={isLoading || voidableInvoices.length === 0}>
                Añadir a la Comunicación de Baja
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal de confirmación para anulación simplificada (fuera del modal principal) */}
      {confirmInvoice && (
        <Modal isOpen={!!confirmInvoice} onClose={() => setConfirmInvoice(null)} title="Confirmar anulación">
          <div className="space-y-4">
            <div>
              <div className="font-medium">{confirmInvoice.series}-{String(confirmInvoice.number).padStart(8, '0')}</div>
              <div className="text-sm text-dm-text-secondary">Cliente: {confirmInvoice.client?.name || confirmInvoice.client_name}</div>
              <div className="text-sm text-dm-text-secondary">Doc: {confirmInvoice.client?.doc_number || ''}</div>
              {confirmInvoice.client?.address && (
                <div className="text-sm text-dm-text-secondary">Dirección: {confirmInvoice.client?.address}</div>
              )}
              <div className="text-sm text-dm-text-secondary">Total: {new Intl.NumberFormat('es-PE',{style: 'currency', currency: 'PEN'}).format(confirmInvoice.total_payable)}</div>
            </div>

            {confirmInvoice.items && confirmInvoice.items.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <div className="text-sm font-medium text-dm-text-secondary mb-1">Servicios / Ítems incluidos</div>
                <ul className="text-sm text-dm-text-secondary list-disc pl-5 space-y-1">
                  {confirmInvoice.items.slice(0,5).map((it, idx) => (
                    <li key={idx}>{it.item_description || it.product_name || 'Servicio'} — {it.quantity || ''} x {new Intl.NumberFormat('es-PE',{style: 'currency', currency: 'PEN'}).format(it.unit_price || it.price_with_tax || 0)}</li>
                  ))}
                  {confirmInvoice.items.length > 5 && <li className="text-xs text-dm-text-muted">+{confirmInvoice.items.length - 5} más</li>}
                </ul>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setConfirmInvoice(null)}>Cancelar</Button>
              <Button onClick={() => { onClose(); setConfirmInvoice(null); navigate('/accounting/credit-notes/annul', { state: { affectedInvoice: confirmInvoice, simplifiedAnnul: true } }); }}>
                Anular
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};