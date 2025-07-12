// src/features/invoices/pages/InvoiceDetailPage.tsx

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

// Importamos el servicio real
import { invoicesService } from '../../../services/invoices.service';

import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { SunatStatusBadge } from '../../accounting/components/SunatStatusBadge';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const invoiceId = Number(id);

  // Usamos el servicio real para obtener los datos
  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => invoicesService.getById(invoiceId),
    enabled: !isNaN(invoiceId), // Solo ejecuta si el ID es un número válido
  });

  const handleAnular = () => {
    if (!invoice) return;

    if (invoice.sunat_status !== 'ACCEPTED') {
      toast.warn(`No se puede anular una factura con estado "${invoice.sunat_status}".`);
      return;
    }

    // Navegamos al formulario de la Nota de Crédito, pasando la factura completa en el state
    navigate('/accounting/credit-notes/new', {
      state: {
        affectedInvoice: invoice,
      },
    });
  };

  if (isLoading) return <div className="flex justify-center p-8"><Spinner size="lg" /></div>;
  if (error) return <div className="p-6 text-center text-error">Error al cargar la factura: {error instanceof Error ? error.message : 'Error desconocido'}</div>;
  if (!invoice) return <div className="p-6 text-center text-gray-500">No se encontró la factura.</div>;

  return (
    <div className="p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-start mb-6 pb-4 border-b">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {invoice.document_type_code === '01' ? 'Factura Electrónica' : 'Boleta de Venta Electrónica'}
            </h1>
            <p className="text-lg text-primary font-semibold">{invoice.series}-{String(invoice.number).padStart(8, '0')}</p>
          </div>
          <div className="text-right">
            <SunatStatusBadge status={invoice.sunat_status} />
            <p className="text-sm text-gray-500 mt-1">
              Emitido: {format(new Date(invoice.issue_date), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Cliente</h3>
            <p className="text-gray-900">{invoice.client?.name}</p>
            <p className="text-gray-600">{invoice.client?.doc_type === '6' ? 'RUC' : 'DNI'}: {invoice.client?.doc_number}</p>
            <p className="text-gray-600">{invoice.client?.address_line}</p>
          </div>
          <div className="text-right">
            <Button 
              variant="danger"
              onClick={handleAnular}
              disabled={invoice.sunat_status !== 'ACCEPTED'}
              title={invoice.sunat_status !== 'ACCEPTED' ? 'Solo se pueden anular facturas ACEPTADAS' : 'Anular este comprobante'}
            >
              Anular / Nota de Crédito
            </Button>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-700 mb-4">Ítems</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Descripción</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Cantidad</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">P. Unitario</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice.items?.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.item_description}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">S/ {Number(item.unit_price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-semibold text-right">S/ {Number(item.total_line).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-end mt-6 pt-4 border-t">
          <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal:</span><span>S/ {Number(invoice.total_taxable).toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">IGV (18%):</span><span>S/ {Number(invoice.total_igv).toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold"><span className="text-gray-900">TOTAL:</span><span>S/ {Number(invoice.total_payable).toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};