// src/features/accounting/pages/InvoiceDetailPage.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon, 
  PrinterIcon, 
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { MessageCircle, Tag } from 'lucide-react';

// Importamos los servicios reales
import { invoicesService } from '../../../services/invoices.service';
import { cancellationRequestsService } from '../services/cancellationRequests.service';

import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { InvoiceStatusBadge } from '../../accounting/components/InvoiceStatusBadge';
import { WhatsAppSendModal } from '../../fluvial/components/sales-point/WhatsAppSendModal';
import { BackendInvoiceData } from '../../fluvial/components/sales-point/tickets/types/backend.types';
import { usePermissions } from '../../../hooks/usePermissions';
import { getCurrencySymbol } from '../../../utils/currency';
import { EditSeatModal } from '../components/EditSeatModal';
import SellerCancellationRequestModal from '../components/SellerCancellationRequestModal';
import { authService } from '../../../services/auth.service';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPdfError, setShowPdfError] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showEditSeatModal, setShowEditSeatModal] = useState(false);
  const [showRequestCancellationModal, setShowRequestCancellationModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'ticket80mm' | 'a4' | 'sticker100x100'>('ticket80mm');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isGeneratingSticker, setIsGeneratingSticker] = useState(false);
  // Estado de validez real de la URL del PDF (puede ser 404 aunque el campo no sea null)
  const [pdfUrlStatus, setPdfUrlStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const pdfIframeRef = useRef<HTMLIFrameElement>(null);
  const { hasPermission } = usePermissions();
  const currentUser = authService.getCurrentUser();

  const invoiceId = Number(id);

  // Usamos el servicio real para obtener los datos
  const { data: invoice, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => invoicesService.getById(invoiceId),
    enabled: !isNaN(invoiceId), // Solo ejecuta si el ID es un número válido
    staleTime: 1000 * 30, // Cache por 30 segundos
  });

  // Obtener las solicitudes del vendedor para esta factura
  const { data: vendorRequests = [] } = useQuery({
    queryKey: ['my-cancellation-requests'],
    queryFn: () => cancellationRequestsService.getMyRequests({ limit: 200 }),
    enabled: currentUser?.role_name?.toLowerCase() === 'sales',
    staleTime: 1000 * 30,
  });

  // Encontrar la solicitud más reciente para esta factura
  const requestForThisInvoice = vendorRequests.find(req => req.invoice_id === invoiceId);
  
  // Determinar si el botón debe estar habilitado
  const canRequestCancellation = invoice && 
    currentUser?.role_name?.toLowerCase() === 'sales' &&
    invoice.sunat_status === 'ACCEPTED' &&
    currentUser?.supervisor_id &&
    (!requestForThisInvoice || requestForThisInvoice.status === 'REJECTED');

  // Determinar el mensaje de tooltip
  const getRequestCancellationTooltip = (): string => {
    if (invoice?.sunat_status !== 'ACCEPTED') {
      return 'Solo se pueden solicitar anulaciones de facturas ACEPTADAS';
    }
    if (!currentUser?.supervisor_id) {
      return 'No tienes supervisor asignado';
    }
    if (requestForThisInvoice?.status === 'PENDING') {
      return 'Ya existe una solicitud pendiente para este comprobante';
    }
    if (requestForThisInvoice?.status === 'APPROVED') {
      return 'Este comprobante ya fue anulado satisfactoriamente';
    }
    return 'Solicitar anulación al supervisor';
  };

  const handleAnular = () => {
    if (!invoice) return;

    if (invoice.sunat_status !== 'ACCEPTED') {
      toast.warn(`No se puede anular una factura con estado "${invoice.sunat_status}".`);
      return;
    }

    // Navegamos al formulario de la Nota de Crédito, pasando la factura completa en el state
    navigate('/accounting/credit-notes/annul', {
      state: {
        affectedInvoice: invoice,
      },
    });
  };

  const handlePrint = () => {
    if (pdfIframeRef.current) {
      try {
        // Intentar imprimir directamente desde el iframe visible
        const iframeWindow = pdfIframeRef.current.contentWindow;
        if (iframeWindow) {
          iframeWindow.print();
        } else {
          throw new Error('No se puede acceder al contenido del iframe');
        }
      } catch (error) {
        console.warn('Error al imprimir desde iframe:', error);
        // Fallback: abrir en nueva ventana
        try {
          const basePdfUrl = activeTab === 'sticker100x100'
            ? invoice?.pdf_sticker_100x100_file_path
            : activeTab === 'ticket80mm' ? invoice?.pdf_ticket_file_path : invoice?.pdf_a4_file_path;
          const backendTimestamp = invoice?.updated_at ? new Date(invoice.updated_at).getTime() : 0;
          const cacheBuster = `${backendTimestamp}_${Date.now()}`;
          const pdfUrl = basePdfUrl ? `${basePdfUrl}?v=${cacheBuster}` : basePdfUrl;
          const printWindow = window.open(pdfUrl ?? undefined, '_blank', 'width=800,height=600');
          if (printWindow) {
            printWindow.onload = () => {
              try {
                printWindow.print();
              } catch (fallbackError) {
                toast.info('Haz clic en "Imprimir" en la ventana que se abrió');
              }
            };
          } else {
            toast.error('El navegador bloqueó la ventana emergente');
          }
        } catch (fallbackError) {
          toast.error('Error al abrir el PDF para imprimir');
        }
      }
    } else {
      toast.error('El visor PDF no está disponible');
    }
  };

  const handleDownload = () => {
    let basePdfUrl: string | null | undefined;
    let fileName: string;

    if (activeTab === 'sticker100x100') {
      basePdfUrl = invoice?.pdf_sticker_100x100_file_path;
      fileName = `sticker-100x100-${invoice?.series}-${String(invoice?.number).padStart(8, '0')}.pdf`;
    } else {
      basePdfUrl = activeTab === 'ticket80mm' ? invoice?.pdf_ticket_file_path : invoice?.pdf_a4_file_path;
      fileName = activeTab === 'ticket80mm'
        ? `ticket-${invoice?.series}-${String(invoice?.number).padStart(8, '0')}.pdf`
        : `ticket-a4-${invoice?.series}-${String(invoice?.number).padStart(8, '0')}.pdf`;
    }

    const backendTimestamp = invoice?.updated_at ? new Date(invoice.updated_at).getTime() : 0;
    const cacheBuster = `${backendTimestamp}_${Date.now()}`;
    const pdfUrl = basePdfUrl ? `${basePdfUrl}?v=${cacheBuster}` : basePdfUrl;
    
    if (pdfUrl) {
      // Crear enlace de descarga
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const label = activeTab === 'ticket80mm' ? '80mm' : activeTab === 'a4' ? 'A4' : '100x100';
      toast.error(`No hay ticket ${label} disponible para descargar`);
    }
  };

  /**
   * Genera o regenera el sticker de encomienda 100x100mm
   */
  const handleGenerateSticker100x100 = async () => {
    if (!invoice || isGeneratingSticker) return;

    setIsGeneratingSticker(true);
    try {
      await invoicesService.generateSticker100x100(invoiceId);
      await queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      toast.success('Sticker 100x100 generado exitosamente');
    } catch (error) {
      console.error('Error generando sticker 100x100:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error al generar el sticker.'
      );
    } finally {
      setIsGeneratingSticker(false);
    }
  };

  const handleWhatsAppClick = () => {
    setShowWhatsAppModal(true);
  };

  /**
   * Regenera ambos PDFs (80mm y A4) desde el backend
   * Útil cuando los tickets no se generaron correctamente o se perdió la conexión
   */
  const handleRegeneratePdfs = async () => {
    if (!invoice || isRegenerating) return;
    
    setIsRegenerating(true);
    setShowPdfError(false);
    
    try {
      // Llamar al servicio para regenerar ambos PDFs
      await invoicesService.generateBothPdfs(invoiceId);
      
      // Invalidar y refetch la query para obtener las nuevas URLs
      await queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      
      toast.success('Tickets regenerados exitosamente');
    } catch (error) {
      console.error('Error regenerando tickets:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Error al regenerar los tickets. Por favor, intente nuevamente.'
      );
      setShowPdfError(true);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Spinner size="lg" /></div>;
  if (error) return <div className="p-6 text-center text-red-600">Error al cargar la factura: {error instanceof Error ? error.message : 'Error desconocido'}</div>;
  if (!invoice) return <div className="p-6 text-center text-gray-500">No se encontró la factura.</div>;

  const hasTicketPdf = invoice.pdf_ticket_file_path && invoice.pdf_ticket_file_path.trim() !== '';
  const hasA4Pdf = invoice.pdf_a4_file_path && invoice.pdf_a4_file_path.trim() !== '';
  const hasStickerPdf = Boolean(invoice.pdf_sticker_100x100_file_path && invoice.pdf_sticker_100x100_file_path.trim() !== '');
  const hasAnyPdf = hasTicketPdf || hasA4Pdf ||
                    (invoice.pdf_file_path && invoice.pdf_file_path.trim() !== '');

  // Detectar si es una encomienda/cargo
  const isCargoInvoice = Boolean(
    invoice.items?.some((item: any) =>
      item.parcel_number != null ||
      item.product_name?.toLowerCase().includes('encomienda') ||
      item.item_description?.toLowerCase().includes('encomienda')
    ) || hasStickerPdf
  );
  
  // Usar invoice.updated_at del backend como cache buster principal
  const backendTimestamp = invoice.updated_at ? new Date(invoice.updated_at).getTime() : 0;
  const cacheBuster = `${backendTimestamp}_${dataUpdatedAt}`;
  
  // Determinar el PDF actual según el tab activo
  let basePdfUrl: string | null | undefined;
  if (activeTab === 'sticker100x100') {
    basePdfUrl = invoice.pdf_sticker_100x100_file_path;
  } else {
    basePdfUrl = activeTab === 'ticket80mm' ? invoice.pdf_ticket_file_path : invoice.pdf_a4_file_path;
  }
  const currentPdfUrl = basePdfUrl ? `${basePdfUrl}?v=${cacheBuster}` : basePdfUrl;
  const hasCurrentPdf = activeTab === 'ticket80mm' ? hasTicketPdf
    : activeTab === 'a4' ? hasA4Pdf
    : hasStickerPdf;

  // ─── Verificación real de la URL del PDF ─────────────────────────────────
  // El onError del iframe NO se dispara cuando Bunny CDN devuelve una página
  // HTML de 404 con status 200. Por eso hacemos un HEAD request proactivo.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    let cancelled = false;
    if (!basePdfUrl) {
      setPdfUrlStatus('error');
      return;
    }
    setPdfUrlStatus('checking');
    setShowPdfError(false);

    fetch(basePdfUrl, { method: 'HEAD', cache: 'no-store' })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setPdfUrlStatus('ok');
        } else {
          // 404, 403, etc. → el archivo no existe realmente en el CDN
          setPdfUrlStatus('error');
          setShowPdfError(true);
        }
      })
      .catch(() => {
        if (cancelled) return;
        // Error de red o CORS → tratamos como error para mostrar el botón
        setPdfUrlStatus('error');
        setShowPdfError(true);
      });

    return () => { cancelled = true; };
  // Recalcular cuando cambia el tab, el invoice o el cacheBuster
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePdfUrl]);
  // ─────────────────────────────────────────────────────────────────────────

  // Formatea la fecha de emisión tal como viene del backend (YYYY-MM-DD)
  const formatIssueDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con información básica */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/accounting/invoices')}
                className="flex items-center"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Volver a Facturas
              </Button>
              <div className="border-l-0 md:border-l pl-0 md:pl-4 mt-4 md:mt-0">
                <h1 className="text-xl font-bold text-gray-900">
                  {invoice.document_type_code === '01' ? 'Factura' : 'Boleta'} {invoice.series}-{String(invoice.number).padStart(8, '0')}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <InvoiceStatusBadge 
                    sunatStatus={invoice.sunat_status} 
                    businessStatus={invoice.business_status}
                  />
                  <span className="text-sm text-gray-500">
                    {formatIssueDate(invoice.issue_date)}
                  </span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-900 font-medium">
                    {getCurrencySymbol(invoice.currency_code)} {Number(invoice.total_payable).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
              {(hasTicketPdf || hasA4Pdf) && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    disabled={isRegenerating}
                    className="flex items-center"
                  >
                    <PrinterIcon className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    disabled={isRegenerating}
                    className="flex items-center"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </>
              )}
              
              {/* Botón WhatsApp - disponible si hay cualquier tipo de PDF */}
              {hasAnyPdf && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWhatsAppClick}
                  className="flex items-center text-green-600 border-green-300 hover:bg-green-50"
                  title="Enviar por WhatsApp"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              )}

              {/* Botón Editar asiento - solo para boletas/facturas de pasajeros, no encomiendas */}
              {!isCargoInvoice && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditSeatModal(true)}
                  className="flex items-center text-blue-600 border-blue-300 hover:bg-blue-50"
                  title="Editar asiento del pasajero"
                  disabled={!hasPermission('accounting', 'invoices', 'sales')}
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
              
              {currentUser?.role_name?.toLowerCase() === 'sales' && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowRequestCancellationModal(true)}
                  disabled={!canRequestCancellation}
                  title={getRequestCancellationTooltip()}
                >
                  Solicitar Anulación
                </Button>
              )}
              
              <Button
                variant="danger"
                size="sm"
                onClick={handleAnular}
                disabled={
                  invoice.sunat_status !== 'ACCEPTED' ||
                  !hasPermission('accounting', 'invoices', 'sales') ||
                  (currentUser?.role_name?.toLowerCase() === 'sales' &&
                    (requestForThisInvoice?.status === 'PENDING' || requestForThisInvoice?.status === 'APPROVED'))
                }
                title={
                  invoice.sunat_status !== 'ACCEPTED'
                    ? 'Solo se pueden anular facturas ACEPTADAS'
                    : !hasPermission('accounting', 'invoices', 'sales')
                    ? 'No tienes permisos para anular facturas'
                    : requestForThisInvoice?.status === 'PENDING'
                    ? 'Ya tienes una solicitud pendiente — usa el botón "Solicitar Anulación"'
                    : requestForThisInvoice?.status === 'APPROVED'
                    ? 'Este comprobante ya fue aprobado para anulación'
                    : 'Anular este comprobante'
                }
              >
                Anular
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {(hasTicketPdf || hasA4Pdf || hasStickerPdf) ? (
          <div className="bg-white rounded-lg shadow-sm border">
            {/* Header del visor PDF */}
            <div className="px-6 py-4 border-b bg-gray-50 rounded-t-lg">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                <div className="flex items-center space-x-2 mb-2 md:mb-0">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                  <h2 className="font-semibold text-gray-900">Ticket de Venta</h2>
                  {/* Indicador de estado de verificación de la URL */}
                  {pdfUrlStatus === 'checking' && hasCurrentPdf && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <ArrowPathIcon className="h-3 w-3 animate-spin" />
                      Verificando archivo...
                    </span>
                  )}
                  {pdfUrlStatus === 'error' && hasCurrentPdf && (
                    <span className="text-xs text-amber-600 flex items-center gap-1">
                      <ExclamationTriangleIcon className="h-3 w-3" />
                      Archivo no disponible en CDN
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {/* Botón regenerar SIEMPRE visible cuando hay algún PDF del tab activo */}
                  {hasCurrentPdf && activeTab !== 'sticker100x100' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegeneratePdfs}
                      disabled={isRegenerating}
                      className="flex items-center text-amber-600 border-amber-300 hover:bg-amber-50"
                      title="Regenerar tickets si el archivo da error 404"
                    >
                      <ArrowPathIcon className={`h-4 w-4 mr-1.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                      {isRegenerating ? 'Regenerando...' : 'Regenerar'}
                    </Button>
                  )}
                  {hasCurrentPdf && activeTab === 'sticker100x100' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateSticker100x100}
                      disabled={isGeneratingSticker}
                      className="flex items-center text-amber-600 border-amber-300 hover:bg-amber-50"
                      title="Regenerar sticker 100x100 si el archivo da error"
                    >
                      <ArrowPathIcon className={`h-4 w-4 mr-1.5 ${isGeneratingSticker ? 'animate-spin' : ''}`} />
                      {isGeneratingSticker ? 'Regenerando...' : 'Regenerar'}
                    </Button>
                  )}
                  <div className="text-sm text-gray-500">
                    Cliente: {invoice.client?.name}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs para seleccionar formato */}
            {(hasTicketPdf || hasA4Pdf) && (
              <div className="px-6 pt-4">
                <div className="flex border-b border-gray-200">
                  {hasTicketPdf && (
                    <button
                      onClick={() => {
                        setActiveTab('ticket80mm');
                        setShowPdfError(false);
                      }}
                      className={`px-6 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'ticket80mm'
                          ? 'border-b-2 border-blue-600 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Ticket 80mm (Térmico)
                    </button>
                  )}
                  {hasA4Pdf && (
                    <button
                      onClick={() => {
                        setActiveTab('a4');
                        setShowPdfError(false);
                      }}
                      className={`px-6 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'a4'
                          ? 'border-b-2 border-blue-600 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Ticket A4 (Corporativo)
                    </button>
                  )}
                  {isCargoInvoice && (
                    <button
                      onClick={() => {
                        setActiveTab('sticker100x100');
                        setShowPdfError(false);
                      }}
                      className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-1 ${
                        activeTab === 'sticker100x100'
                          ? 'border-b-2 border-orange-500 text-orange-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Tag className="h-3.5 w-3.5" />
                      Sticker 100x100
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Visor PDF */}
            <div className="p-6">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '600px' }}>
                {/* Overlay de verificación mientras se comprueba la URL */}
                {pdfUrlStatus === 'checking' && hasCurrentPdf && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10">
                    <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin mb-3" />
                    <p className="text-sm text-gray-500">Verificando disponibilidad del archivo...</p>
                  </div>
                )}

                {/* Estado OK: mostramos el iframe */}
                {pdfUrlStatus === 'ok' && !showPdfError && hasCurrentPdf && (
                  <iframe
                    ref={pdfIframeRef}
                    key={`${activeTab}-${cacheBuster}`}
                    src={`${currentPdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="w-full h-full border-0"
                    style={{ minHeight: '600px' }}
                    title={`Ticket ${
                      activeTab === 'ticket80mm' ? '80mm' : activeTab === 'a4' ? 'A4' : 'Sticker 100x100'
                    } ${invoice.series}-${String(invoice.number).padStart(8, '0')}`}
                    onError={() => setShowPdfError(true)}
                  />
                )}

                {/* Estado ERROR: URL nula, 404 de CDN, o error del iframe */}
                {(pdfUrlStatus === 'error' || showPdfError || !hasCurrentPdf) && pdfUrlStatus !== 'checking' && (
                  <div className="flex flex-col items-center justify-center h-full min-h-96 text-gray-500 py-16">
                    <div className="bg-amber-50 border border-amber-200 rounded-full p-4 mb-4">
                      <ExclamationTriangleIcon className="h-10 w-10 text-amber-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {activeTab === 'sticker100x100'
                        ? 'Sticker 100x100 no disponible'
                        : `Ticket ${activeTab === 'ticket80mm' ? '80mm' : 'A4'} no disponible`}
                    </h3>
                    <p className="text-sm text-center text-gray-500 mb-2 max-w-sm">
                      {!hasCurrentPdf
                        ? 'El PDF no fue generado o la URL no está registrada.'
                        : 'El archivo no se encontró en el servidor de almacenamiento (posiblemente un error de subida al CDN).'}
                    </p>
                    <p className="text-xs text-center text-gray-400 mb-6 max-w-sm">
                      Usa el botón "Regenerar" para solicitar al servidor que vuelva a generar y subir el archivo.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      {activeTab === 'sticker100x100' ? (
                        <Button
                          variant="primary"
                          size="md"
                          onClick={handleGenerateSticker100x100}
                          disabled={isGeneratingSticker}
                          className="flex items-center"
                        >
                          <ArrowPathIcon className={`h-5 w-5 mr-2 ${isGeneratingSticker ? 'animate-spin' : ''}`} />
                          {isGeneratingSticker ? 'Generando sticker...' : 'Generar / Regenerar Sticker'}
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="md"
                          onClick={handleRegeneratePdfs}
                          disabled={isRegenerating}
                          className="flex items-center"
                        >
                          <ArrowPathIcon className={`h-5 w-5 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                          {isRegenerating ? 'Regenerando tickets...' : 'Regenerar Tickets (80mm y A4)'}
                        </Button>
                      )}
                      {hasCurrentPdf && pdfUrlStatus === 'ok' && (
                        <Button
                          variant="outline"
                          size="md"
                          onClick={() => window.open(currentPdfUrl ?? undefined, '_blank')}
                          className="flex items-center"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                          Abrir en nueva ventana
                        </Button>
                      )}
                    </div>
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
              <p className="text-gray-500 mb-4">
                No se encontró el archivo PDF del ticket para esta factura.
              </p>
              
              {/* Botón para regenerar tickets */}
              <Button
                variant="primary"
                size="md"
                onClick={handleRegeneratePdfs}
                disabled={isRegenerating}
                className="flex items-center mx-auto mb-6"
              >
                <ArrowPathIcon className={`h-5 w-5 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? 'Regenerando tickets...' : 'Regenerar Tickets'}
              </Button>
              
              {/* Mostrar información básica de la factura */}
              <div className="max-w-2xl mx-auto text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Cliente</h4>
                    <p className="text-gray-900">{invoice.client?.name}</p>
                    <p className="text-gray-600">{invoice.client?.doc_type === '6' ? 'RUC' : 'DNI'}: {invoice.client?.doc_number}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Totales</h4>
                    <p className="text-gray-600">Subtotal: S/ {Number(invoice.total_taxable).toFixed(2)}</p>
                    <p className="text-gray-600">IGV: S/ {Number(invoice.total_igv).toFixed(2)}</p>
                    <p className="text-lg font-bold text-gray-900">Total: {getCurrencySymbol(invoice.currency_code)} {Number(invoice.total_payable).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de WhatsApp */}
      {showWhatsAppModal && invoice && (
        <WhatsAppSendModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          backendData={invoice as unknown as BackendInvoiceData}
          initialPhoneNumber={invoice.client?.phone || ''}
          isFromInvoiceList={true}
          preferredPdfType={activeTab === 'a4' ? 'a4' : 'ticket'}
        />
      )}

      {/* Modal de solicitud de anulación al supervisor */}
      {showRequestCancellationModal && invoice && (
        <SellerCancellationRequestModal
          invoiceId={invoice.id}
          invoiceSeries={invoice.series}
          invoiceNumber={invoice.number}
          onClose={() => setShowRequestCancellationModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
            queryClient.invalidateQueries({ queryKey: ['my-cancellation-requests'] });
          }}
        />
      )}

      {/* Modal de Editar Asiento */}
      {showEditSeatModal && invoice && (
        <EditSeatModal
          isOpen={showEditSeatModal}
          onClose={() => setShowEditSeatModal(false)}
          onSuccess={() => {
            // Refrescar la factura después de editar
            queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
          }}
          invoiceSeries={invoice.series}
          invoiceNumber={invoice.number}
          invoiceId={invoiceId}
        />
      )}
    </div>
  );
};