// src/features/accounting/pages/InvoiceDetailPage.tsx

import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/sileo-toast';
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
import { EditPaymentMethodsModal } from '../components/EditPaymentMethodsModal';
import { SaleInfoPanel } from '../components/SaleInfoPanel';
import SellerCancellationRequestModal from '../components/SellerCancellationRequestModal';
import { authService } from '../../../services/auth.service';
import { invoiceToSplitPaymentData, getInvoicePaymentSummary } from '../../../utils/invoicePaymentMapper';
import { getSaleKind } from '../../../utils/getSaleKind';
import { formatIssueDate } from '../../../utils/formatDateTime';
import ReprogramTicketModal from '../components/ReprogramTicketModal';
import { reprogrammingService } from '../../../services/reprogramming.service';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPdfError, setShowPdfError] = useState(false);
  const [showReprogramModal, setShowReprogramModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showEditSeatModal, setShowEditSeatModal] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [showRequestCancellationModal, setShowRequestCancellationModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'ticket80mm' | 'a4' | 'sticker100x100'>('ticket80mm');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isGeneratingSticker, setIsGeneratingSticker] = useState(false);
  const pdfIframeRef = useRef<HTMLIFrameElement>(null);
  const { hasPermission } = usePermissions();
  const currentUser = authService.getCurrentUser();

  const invoiceId = Number(id);
  const reprogramRole = ['admin', 'supervisor', 'sales', 'seller'].includes(currentUser?.role_name?.toLowerCase() || '');
  const { data: pendingReprogram } = useQuery({
    queryKey: ['reprogramming', invoiceId], queryFn: () => reprogrammingService.status(invoiceId),
    enabled: reprogramRole && Number.isFinite(invoiceId), retry: false,
  });

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
              } catch {
                toast.info('Haz clic en "Imprimir" en la ventana que se abrió');
              }
            };
          } else {
            toast.error('El navegador bloqueó la ventana emergente');
          }
        } catch {
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
  // FUNCIONALIDAD SIN CONECTAR: nada en el JSX llama a este handler, asi que
  // hoy el sticker 100x100 solo se puede ver o descargar si ya existe, no
  // generar. El endpoint (invoicesService.generateSticker100x100), el tab
  // 'sticker100x100' y el estado isGeneratingSticker ya estan listos: falta el
  // boton que lo dispare, como los que tienen handleRegenerateCurrentPdf y
  // handleRegeneratePdfs. No se elimina para no perder la implementacion.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      // force=true para sobreescribir el archivo aunque ya exista en el CDN
      await invoicesService.generateBothPdfs(invoiceId, true);
      
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

  /**
   * Regenera SOLO el PDF del tab activo (80mm, A4 o 100x100).
   * Útil cuando Bunny CDN no almacenó el archivo a tiempo.
   */
  const handleRegenerateCurrentPdf = async () => {
    if (!invoice || isRegenerating) return;
    setIsRegenerating(true);
    setShowPdfError(false);
    try {
      let size: '80mm' | 'a4' | '100x100';
      if (activeTab === 'sticker100x100') {
        size = '100x100';
      } else if (activeTab === 'a4') {
        size = 'a4';
      } else {
        size = '80mm';
      }
      // force=true para sobreescribir el archivo aunque ya exista en el CDN
      await invoicesService.generatePdf(invoiceId, size, true);
      await queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      toast.success(`Ticket ${activeTab === 'ticket80mm' ? '80mm' : activeTab === 'a4' ? 'A4' : '100x100'} regenerado exitosamente`);
    } catch (error) {
      console.error('Error regenerando PDF:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al regenerar el ticket. Por favor, intente nuevamente.'
      );
      setShowPdfError(true);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Spinner size="lg" /></div>;
  if (error) return <div className="p-6 text-center text-red-600 dark:text-red-400">Error al cargar la factura: {error instanceof Error ? error.message : 'Error desconocido'}</div>;
  if (!invoice) return <div className="p-6 text-center text-dm-text-muted">No se encontró la factura.</div>;

  const hasTicketPdf = invoice.pdf_ticket_file_path && invoice.pdf_ticket_file_path.trim() !== '';
  const hasA4Pdf = invoice.pdf_a4_file_path && invoice.pdf_a4_file_path.trim() !== '';
  const hasStickerPdf = Boolean(invoice.pdf_sticker_100x100_file_path && invoice.pdf_sticker_100x100_file_path.trim() !== '');
  const hasAnyPdf = hasTicketPdf || hasA4Pdf ||
                    (invoice.pdf_file_path && invoice.pdf_file_path.trim() !== '');

  // Detectar si es una encomienda/cargo (heurística centralizada en getSaleKind;
  // el chequeo de sticker PDF se mantiene aquí para conservar el mismo resultado)
  const isCargoInvoice = getSaleKind(invoice) === 'encomienda' || hasStickerPdf;

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

  return (
    <div className="min-h-screen bg-dm-bg-secondary">
      {/* Header con información básica */}
      <div className="bg-dm-bg-primary shadow-sm border-b border-dm-border-primary">
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
                <h1 className="text-xl font-bold text-dm-text-primary">
                  {invoice.document_type_code === '01' ? 'Factura' : 'Boleta'} {invoice.series}-{String(invoice.number).padStart(8, '0')}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <InvoiceStatusBadge 
                    sunatStatus={invoice.sunat_status} 
                    businessStatus={invoice.business_status}
                  />
                  <span className="text-sm text-dm-text-muted">
                    {formatIssueDate(invoice.issue_date)}
                  </span>
                  <span className="text-sm text-dm-text-muted">•</span>
                  <span className="text-sm text-dm-text-primary font-medium">
                    {getCurrencySymbol(invoice.currency_code)} {Number(invoice.total_payable).toFixed(2)}
                  </span>
                  <span className="text-sm text-dm-text-muted">•</span>
                  <span className="text-sm text-dm-text-secondary">
                    {getInvoicePaymentSummary(invoice)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
              {/* Botón Imprimir / Descargar - solo si hay PDF del tab activo */}
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

              {/* Botón Regenerar ─ siempre visible para forzar regeneración del tab activo */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateCurrentPdf}
                disabled={isRegenerating}
                className="flex items-center text-amber-600 dark:text-amber-400 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                title={`Regenerar ticket ${
                  activeTab === 'ticket80mm' ? '80mm' :
                  activeTab === 'a4' ? 'A4' : '100x100'
                } (usar si el archivo da error o no cargó)`}
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating
                  ? 'Regenerando...'
                  : `Regenerar ${
                      activeTab === 'ticket80mm' ? '80mm' :
                      activeTab === 'a4' ? 'A4' : '100x100'
                    }`}
              </Button>
              
              {/* Botón WhatsApp - disponible si hay cualquier tipo de PDF */}
              {hasAnyPdf && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWhatsAppClick}
                  className="flex items-center text-green-600 dark:text-green-400 border-green-300 hover:bg-green-50 dark:hover:bg-green-950/30"
                  title="Enviar por WhatsApp"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              )}

              {!isCargoInvoice && reprogramRole && invoice.business_status !== 'CANCELLED' && !['REJECTED', 'VOIDED', 'CANCELLED'].includes(invoice.sunat_status) && (
                <Button variant="outline" size="sm" onClick={() => setShowReprogramModal(true)}>Reprogramar pasajes</Button>
              )}
              {pendingReprogram && <p className="rounded-lg bg-amber-100 text-amber-900 p-3 text-sm">Pendiente de nueva fecha. Estos pasajeros no están en el manifiesto; sus asientos fueron liberados. {pendingReprogram.reason}</p>}
              {/* Botón Editar asiento - solo para boletas/facturas de pasajeros, no encomiendas */}
              {!isCargoInvoice && !pendingReprogram && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditSeatModal(true)}
                  className="flex items-center text-blue-600 dark:text-blue-400 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30"
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
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-4">
          {/* Columna izquierda: panel de información de la venta */}
          <div>
            <SaleInfoPanel
              invoice={invoice}
              onEditPayment={() => setShowEditPaymentModal(true)}
              canEditPayment={hasPermission('accounting', 'invoices', 'sales')}
            />
          </div>

          {/* Columna derecha: preview del ticket (movida tal cual, sin cambios de lógica) */}
          <div>
        {/* Sección principal del visor:
             - Siempre se muestra para facturas que no son 100% encomienda
             - También se muestra si hay cualquier PDF disponible */}
        {(!isCargoInvoice || hasTicketPdf || hasA4Pdf || hasStickerPdf) ? (
          <div className="bg-dm-bg-primary rounded-lg shadow-sm border border-dm-border-primary">
            {/* Header del visor PDF */}
            <div className="px-6 py-4 border-b border-dm-border-primary bg-dm-bg-secondary rounded-t-lg">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="font-semibold text-dm-text-primary">Ticket de Venta</h2>
                </div>
                <div
                  className="text-sm text-dm-text-muted min-w-0 truncate"
                  title={invoice.client?.name ?? undefined}
                >
                  Cliente: {invoice.client?.name}
                </div>
              </div>
            </div>

            {/* Tabs para seleccionar formato
                 - Para facturas normales: siempre se muestran 80mm y A4
                   (aunque el PDF no exista aún, para que el usuario pueda regenerarlo)
                 - Sticker 100x100: solo si es encomienda */}
            <div className="px-4 sm:px-6 pt-4">
              <div className="flex border-b border-dm-border-primary overflow-x-auto">
                {/* Tab 80mm: siempre visible para facturas/boletas normales */}
                {!isCargoInvoice && (
                  <button
                    onClick={() => {
                      setActiveTab('ticket80mm');
                      setShowPdfError(false);
                    }}
                    className={`px-4 sm:px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                      activeTab === 'ticket80mm'
                        ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'text-dm-text-muted hover:text-dm-text-secondary'
                    }`}
                  >
                    <span className="hidden sm:inline">Ticket 80mm (Térmico)</span>
                    <span className="sm:hidden">80mm</span>
                  </button>
                )}
                {/* Tab 80mm para encomiendas (solo si existe) */}
                {isCargoInvoice && hasTicketPdf && (
                  <button
                    onClick={() => {
                      setActiveTab('ticket80mm');
                      setShowPdfError(false);
                    }}
                    className={`px-4 sm:px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                      activeTab === 'ticket80mm'
                        ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'text-dm-text-muted hover:text-dm-text-secondary'
                    }`}
                  >
                    <span className="hidden sm:inline">Ticket 80mm (Térmico)</span>
                    <span className="sm:hidden">80mm</span>
                  </button>
                )}
                {/* Tab A4: siempre visible para facturas/boletas normales */}
                {!isCargoInvoice && (
                  <button
                    onClick={() => {
                      setActiveTab('a4');
                      setShowPdfError(false);
                    }}
                    className={`px-4 sm:px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                      activeTab === 'a4'
                        ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'text-dm-text-muted hover:text-dm-text-secondary'
                    }`}
                  >
                    <span className="hidden sm:inline">Ticket A4 (Corporativo)</span>
                    <span className="sm:hidden">A4</span>
                  </button>
                )}
                {/* Tab A4 para encomiendas (solo si existe) */}
                {isCargoInvoice && hasA4Pdf && (
                  <button
                    onClick={() => {
                      setActiveTab('a4');
                      setShowPdfError(false);
                    }}
                    className={`px-4 sm:px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                      activeTab === 'a4'
                        ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'text-dm-text-muted hover:text-dm-text-secondary'
                    }`}
                  >
                    <span className="hidden sm:inline">Ticket A4 (Corporativo)</span>
                    <span className="sm:hidden">A4</span>
                  </button>
                )}
                {isCargoInvoice && (
                  <button
                    onClick={() => {
                      setActiveTab('sticker100x100');
                      setShowPdfError(false);
                    }}
                    className={`px-4 sm:px-6 py-3 text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                      activeTab === 'sticker100x100'
                        ? 'border-b-2 border-orange-500 text-orange-600 dark:text-orange-400'
                        : 'text-dm-text-muted hover:text-dm-text-secondary'
                    }`}
                  >
                    <Tag className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">Sticker 100x100</span>
                    <span className="sm:hidden">100x100</span>
                  </button>
                )}
              </div>
            </div>

            {/* Visor PDF */}
            <div className="p-4 sm:p-6">
              <div className="relative bg-dm-bg-secondary rounded-lg overflow-hidden min-h-[300px] md:min-h-[600px]">
                {!showPdfError && hasCurrentPdf ? (
                  activeTab === 'sticker100x100' ? (
                    <div className="flex justify-center p-3 sm:p-4">
                      <div className="w-full max-w-[420px]">
                        <iframe
                          ref={pdfIframeRef}
                          key={`${activeTab}-${cacheBuster}`}
                          src={`${currentPdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                          className="w-full border-0 rounded-lg shadow-sm min-h-[300px] md:min-h-[420px]"
                          title={`Sticker 100x100 ${invoice.series}-${String(invoice.number).padStart(8, '0')}`}
                          onError={() => setShowPdfError(true)}
                        />
                      </div>
                    </div>
                  ) : (
                    <iframe
                      ref={pdfIframeRef}
                      key={`${activeTab}-${cacheBuster}`}
                      src={`${currentPdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                      className="w-full h-full border-0 min-h-[350px] md:min-h-[600px]"
                      title={`Ticket ${
                        activeTab === 'ticket80mm' ? '80mm' : 'A4'
                      } ${invoice.series}-${String(invoice.number).padStart(8, '0')}`}
                      onError={() => setShowPdfError(true)}
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[300px] md:min-h-[600px] text-dm-text-muted">
                    <ExclamationTriangleIcon className="h-12 w-12 mb-4 text-amber-400" />
                    <h3 className="text-lg font-medium mb-2 text-dm-text-primary">
                      {activeTab === 'sticker100x100'
                        ? 'Sticker 100x100 no disponible'
                        : `Ticket ${activeTab === 'ticket80mm' ? '80mm' : 'A4'} no disponible`}
                    </h3>
                    <p className="text-sm text-center text-dm-text-muted max-w-sm">
                      El archivo no se encontró o no se generó correctamente.
                      Usa el botón <strong>Regenerar</strong> en la barra superior para solicitarlo de nuevo al servidor.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Fallback: mostrar información básica si no hay PDF
          <div className="bg-dm-bg-primary rounded-lg shadow-sm border border-dm-border-primary p-6">
            <div className="text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-dm-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-dm-text-primary mb-2">
                Ticket no disponible
              </h3>
              <p className="text-dm-text-muted mb-4">
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
                    <h4 className="font-semibold text-dm-text-secondary mb-2">Cliente</h4>
                    <p className="text-dm-text-primary">{invoice.client?.name}</p>
                    <p className="text-dm-text-secondary">{invoice.client?.doc_type === '6' ? 'RUC' : 'DNI'}: {invoice.client?.doc_number}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-dm-text-secondary mb-2">Totales</h4>
                    <p className="text-dm-text-secondary">Subtotal: S/ {Number(invoice.total_taxable).toFixed(2)}</p>
                    <p className="text-dm-text-secondary">IGV: S/ {Number(invoice.total_igv).toFixed(2)}</p>
                    <p className="text-lg font-bold text-dm-text-primary">Total: {getCurrencySymbol(invoice.currency_code)} {Number(invoice.total_payable).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>

      {showReprogramModal && <ReprogramTicketModal invoiceId={invoiceId} label={`${invoice.series}-${invoice.number}`} open onClose={() => setShowReprogramModal(false)} />}
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

      {/* Modal de Editar Métodos de Pago */}
      {showEditPaymentModal && invoice && (
        <EditPaymentMethodsModal
          isOpen={showEditPaymentModal}
          onClose={() => setShowEditPaymentModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
          }}
          invoiceId={invoiceId}
          invoiceSeries={invoice.series}
          invoiceNumber={invoice.number}
          totalPayable={Number(invoice.total_payable)}
          currencyCode={invoice.currency_code}
          initialPaymentData={invoiceToSplitPaymentData(invoice)}
        />
      )}
    </div>
  );
};
