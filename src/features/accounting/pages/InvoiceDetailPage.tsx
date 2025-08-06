// src/features/accounting/pages/InvoiceDetailPage.tsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon, 
  PrinterIcon, 
  ArrowDownTrayIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Importamos el servicio real
import { invoicesService } from '../../../services/invoices.service';

import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { SunatStatusBadge } from '../../accounting/components/SunatStatusBadge';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showPdfError, setShowPdfError] = useState(false);

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

  const handlePrint = () => {
    if (invoice?.pdf_ticket_file_path) {
      // Abrir en ventana nueva para imprimir
      const printWindow = window.open(invoice.pdf_ticket_file_path, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } else {
      toast.error('No hay ticket PDF disponible para imprimir');
    }
  };

  const handleDownload = () => {
    if (invoice?.pdf_ticket_file_path) {
      // Crear enlace de descarga
      const link = document.createElement('a');
      link.href = invoice.pdf_ticket_file_path;
      link.download = `ticket-${invoice.series}-${String(invoice.number).padStart(8, '0')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error('No hay ticket PDF disponible para descargar');
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Spinner size="lg" /></div>;
  if (error) return <div className="p-6 text-center text-red-600">Error al cargar la factura: {error instanceof Error ? error.message : 'Error desconocido'}</div>;
  if (!invoice) return <div className="p-6 text-center text-gray-500">No se encontró la factura.</div>;

  const hasTicketPdf = invoice.pdf_ticket_file_path && invoice.pdf_ticket_file_path.trim() !== '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con información básica */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/accounting/invoices')}
                className="flex items-center"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Volver a Facturas
              </Button>
              <div className="border-l pl-4">
                <h1 className="text-xl font-bold text-gray-900">
                  {invoice.document_type_code === '01' ? 'Factura' : 'Boleta'} {invoice.series}-{String(invoice.number).padStart(8, '0')}
                </h1>
                <div className="flex items-center space-x-4 mt-1">
                  <SunatStatusBadge status={invoice.sunat_status} />
                  <span className="text-sm text-gray-500">
                    {format(new Date(invoice.issue_date), 'dd/MM/yyyy')}
                  </span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-900 font-medium">
                    S/ {Number(invoice.total_payable).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {hasTicketPdf && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="flex items-center"
                  >
                    <PrinterIcon className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="flex items-center"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={handleAnular}
                disabled={invoice.sunat_status !== 'ACCEPTED'}
                title={invoice.sunat_status !== 'ACCEPTED' ? 'Solo se pueden anular facturas ACEPTADAS' : 'Anular este comprobante'}
              >
                Anular
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {hasTicketPdf ? (
          <div className="bg-white rounded-lg shadow-sm border">
            {/* Header del visor PDF */}
            <div className="px-6 py-4 border-b bg-gray-50 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                  <h2 className="font-semibold text-gray-900">Ticket de Venta</h2>
                </div>
                <div className="text-sm text-gray-500">
                  Cliente: {invoice.client?.name}
                </div>
              </div>
            </div>

            {/* Visor PDF */}
            <div className="p-6">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '600px' }}>
                {!showPdfError ? (
                  <iframe
                    src={`${invoice.pdf_ticket_file_path}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="w-full h-full border-0"
                    style={{ minHeight: '600px' }}
                    title={`Ticket ${invoice.series}-${String(invoice.number).padStart(8, '0')}`}
                    onError={() => setShowPdfError(true)}
                    onLoad={(e) => {
                      // Verificar si el iframe se cargó correctamente
                      try {
                        const iframe = e.target as HTMLIFrameElement;
                        if (!iframe.contentWindow) {
                          setShowPdfError(true);
                        }
                      } catch (error) {
                        setShowPdfError(true);
                      }
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                    <ExclamationTriangleIcon className="h-12 w-12 mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">No se pudo cargar el ticket</h3>
                    <p className="text-sm text-center mb-4">
                      El PDF no se puede mostrar en el navegador. 
                      Puedes descargarlo usando el botón de arriba.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => window.open(invoice.pdf_ticket_file_path, '_blank')}
                      className="flex items-center"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      Abrir en nueva ventana
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Fallback: mostrar información básica si no hay PDF
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ticket no disponible
              </h3>
              <p className="text-gray-500 mb-6">
                No se encontró el archivo PDF del ticket para esta factura.
              </p>
              
              {/* Mostrar información básica de la factura */}
              <div className="max-w-2xl mx-auto text-left">
                <div className="grid grid-cols-2 gap-8 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Cliente</h4>
                    <p className="text-gray-900">{invoice.client?.name}</p>
                    <p className="text-gray-600">{invoice.client?.doc_type === '6' ? 'RUC' : 'DNI'}: {invoice.client?.doc_number}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Totales</h4>
                    <p className="text-gray-600">Subtotal: S/ {Number(invoice.total_taxable).toFixed(2)}</p>
                    <p className="text-gray-600">IGV: S/ {Number(invoice.total_igv).toFixed(2)}</p>
                    <p className="text-lg font-bold text-gray-900">Total: S/ {Number(invoice.total_payable).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};