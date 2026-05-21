// src/features/quotations/pages/QuotationDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { useQuotationPDFGeneration } from '../hooks/useQuotationPDFGeneration';
import { QuotationWhatsAppModal } from '../components/QuotationWhatsAppModal';
import { quotationsService } from '../services/quotations.service';
import { Quotation, QuotationStatus } from '../types';
import { toast } from '@/utils/sileo-toast';

const statusLabels: Record<QuotationStatus, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Expirada',
  CONVERTED: 'Convertida'
};

const statusColors: Record<QuotationStatus, string> = {
  DRAFT: 'bg-dm-bg-secondary text-dm-text-secondary border-dm-border-primary',
  SENT: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200',
  ACCEPTED: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200',
  REJECTED: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200',
  EXPIRED: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-200',
  CONVERTED: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
};

export const QuotationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfExists, setPdfExists] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [activeView, setActiveView] = useState<'details' | 'preview'>('preview');

  const getAuthToken = (): string | undefined => {
    return localStorage.getItem('authToken') || localStorage.getItem('token') || undefined;
  };
  
  // Hook para manejo de PDFs
  const {
    generateAndUploadPDF,
    checkPDFExists,
    getPDFUrl,
    isGenerating,
    isUploading,
    isProcessing
  } = useQuotationPDFGeneration();

  useEffect(() => {
    if (id) {
      fetchQuotation(parseInt(id));
    }
  }, [id]);

  // Verificar PDF después de un delay cuando viene de creación (para dar tiempo a que se genere)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromCreation = urlParams.get('from') === 'creation';
    
    if (fromCreation && quotation && !pdfExists) {
      
      // Hacer polling para verificar si el PDF se generó automáticamente
      const pollForPDF = async () => {
        let attempts = 0;
        const maxAttempts = 20; // máximo 10 segundos (500ms * 20)
        
        const poll = async () => {
          try {
            
            // Refrescar los datos de la cotización primero
            const refreshedQuotation = await quotationsService.getById(quotation.id);
            
            if (refreshedQuotation.pdf_file_path && refreshedQuotation.pdf_file_path.trim() !== '') {
              setQuotation(refreshedQuotation);
              setPdfExists(true);
              setPdfUrl(refreshedQuotation.pdf_file_path);
              return true;
            }
            
            // Fallback: usar el servicio
            const token = getAuthToken();
            const exists = await checkPDFExists(quotation.id, token);
            
            if (exists) {
              const url = await getPDFUrl(quotation.id, token);
              setPdfExists(true);
              setPdfUrl(url);
              // Refrescar la cotización completa
              const updatedQuotation = await quotationsService.getById(quotation.id);
              setQuotation(updatedQuotation);
              return true;
            }
            
            return false;
          } catch (error) {
            return false;
          }
        };
        
        // Ejecutar polling
        while (attempts < maxAttempts) {
          const found = await poll();
          if (found) break;
          
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        if (attempts >= maxAttempts) {
          // No-op: se agotaron los intentos de polling.
        }
      };
      
      // Empezar el polling después de un pequeño delay
      setTimeout(pollForPDF, 1000);
    }
  }, [quotation, pdfExists, checkPDFExists, getPDFUrl]);

  // Verificar si existe PDF cuando se carga la cotización
  useEffect(() => {
    const checkPDF = async () => {
      if (quotation) {
        try {
          // Verificar si la cotización ya tiene pdf_file_path
          if (quotation.pdf_file_path && quotation.pdf_file_path.trim() !== '') {
            setPdfExists(true);
            setPdfUrl(quotation.pdf_file_path);
            return;
          }
          
          // Si no tiene pdf_file_path, usar el servicio para verificar
          const token = getAuthToken();
          const exists = await checkPDFExists(quotation.id, token);
          setPdfExists(exists);
          
          // Si existe, obtener la URL
          if (exists) {
            const url = await getPDFUrl(quotation.id, token);
            setPdfUrl(url);
          }
        } catch (error) {
        }
      }
    };

    checkPDF();
  }, [quotation, checkPDFExists, getPDFUrl]);

  const fetchQuotation = async (quotationId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await quotationsService.getById(quotationId);
      setQuotation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cotización');
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsApp = () => {
    setShowWhatsAppModal(true);
  };

  const handleConvertToInvoice = () => {
    if (quotation) {
      navigate(`/sales/quotations/${quotation.id}/convert-to-invoice`);
    }
  };

  // Funciones para manejo de PDF
  const handleGenerateAndUploadPDF = async () => {
    if (!quotation) return;
    
    try {
      const token = getAuthToken();
      const result = await generateAndUploadPDF(quotation, token);
      
      if (result.success) {
        setPdfExists(true);
        // Obtener la URL del PDF recién subido
        const url = await getPDFUrl(quotation.id, token);
        setPdfUrl(url);
        // Refrescar la cotización completa
        const updatedQuotation = await quotationsService.getById(quotation.id);
        setQuotation(updatedQuotation);
      }
    } catch (error) {
      toast.error('Error al generar PDF');
    }
  };
  
  // Función para refrescar manualmente
  const handleRefreshPDF = async () => {
    if (!quotation) return;
    
    try {
      const updatedQuotation = await quotationsService.getById(quotation.id);
      setQuotation(updatedQuotation);
      
      if (updatedQuotation.pdf_file_path && updatedQuotation.pdf_file_path.trim() !== '') {
        setPdfExists(true);
        setPdfUrl(updatedQuotation.pdf_file_path);
      } else {
      }
    } catch (error) {
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-md p-4">
          <div className="text-red-800 dark:text-red-300">Error: {error}</div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/sales/quotations')}
          className="mt-4"
        >
          Volver a la Lista
        </Button>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="p-6">
        <div className="text-center text-dm-text-muted">
          <p>Cotización no encontrada</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/sales/quotations')}
          className="mt-4"
        >
          Volver a la Lista
        </Button>
      </div>
    );
  }

  const isExpired = new Date(quotation.valid_until) < new Date();
  const issueDatetime = new Date(`${quotation.issue_date}T${quotation.issue_time || '00:00:00'}`);
  const formatCurrency = (value: string | number) => `${quotation.currency_code} ${parseFloat(String(value || 0)).toFixed(2)}`;

  return (
    <div className="-mx-6 -mt-6">
      <header className="bg-dm-bg-primary border-b border-dm-border-primary px-6 py-4 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <nav className="flex text-sm font-medium text-dm-text-muted mb-2">
              <button
                onClick={() => navigate('/sales/quotations')}
                className="hover:text-primary transition-colors"
              >
                Cotizaciones
              </button>
              <span className="mx-2">/</span>
              <span className="text-dm-text-primary">Detalle de Cotizacion</span>
            </nav>

            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg text-white">
                <DocumentTextIcon className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-dm-text-primary">
                  Cotizacion #{quotation.series}{quotation.number.toString().padStart(6, '0')}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-dm-text-secondary mt-0.5">
                  <div className="flex items-center gap-1.5 text-sm">
                    <UserIcon className="h-3.5 w-3.5" />
                    <span className="font-medium">{quotation.client.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <CalendarDaysIcon className="h-3.5 w-3.5" />
                    <span>
                      {issueDatetime.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' '}
                      <ClockIcon className="h-3 w-3 inline -mt-0.5" />
                      {' '}
                      {issueDatetime.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => navigate('/sales/quotations')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-dm-bg-primary border border-dm-border-primary rounded-lg text-dm-text-secondary hover:bg-dm-bg-hover transition-all shadow-sm"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Volver
            </button>
            <button
              onClick={handleGenerateAndUploadPDF}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              {isGenerating
                ? 'Generando...'
                : isUploading
                ? 'Subiendo...'
                : pdfExists
                ? 'Regenerar PDF'
                : 'Generar PDF'}
            </button>
          </div>
        </div>
      </header>

      <div className="px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-dm-bg-primary p-6 rounded-xl shadow-sm border border-dm-border-primary">
              <h3 className="text-xs font-bold uppercase tracking-wider text-dm-text-muted mb-6">
                Detalles del Documento
              </h3>
              <div>
                <div className="flex justify-between items-center py-3 border-b border-dm-border-secondary">
                  <span className="text-sm text-dm-text-muted">Nro de Cotizacion</span>
                  <span className="text-sm font-bold text-dm-text-primary">{quotation.series}-{quotation.number.toString().padStart(6, '0')}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-dm-border-secondary">
                  <span className="text-sm text-dm-text-muted">Fecha Emision</span>
                  <span className="text-sm font-semibold text-dm-text-primary">{new Date(quotation.issue_date).toLocaleDateString('es-PE')}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-dm-border-secondary">
                  <span className="text-sm text-dm-text-muted">Valida hasta</span>
                  <span className="text-sm font-semibold text-dm-text-primary">{new Date(quotation.valid_until).toLocaleDateString('es-PE')}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-dm-border-secondary">
                  <span className="text-sm text-dm-text-muted">Cliente</span>
                  <span className="text-sm font-semibold text-dm-text-primary text-right max-w-[55%] truncate">{quotation.client.doc_number}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-dm-border-secondary">
                  <span className="text-sm text-dm-text-muted">Vendedor</span>
                  <span className="text-sm font-semibold text-dm-text-primary text-right max-w-[55%] truncate">{quotation.seller.full_name}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-dm-border-secondary">
                  <span className="text-sm text-dm-text-muted">Total</span>
                  <span className="text-sm font-bold text-dm-text-primary">{formatCurrency(quotation.total_payable)}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-dm-text-muted">Estado</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColors[quotation.status]}`}>
                      {statusLabels[quotation.status]}
                    </span>
                    {isExpired && quotation.status !== 'CONVERTED' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200">
                        Expirada
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {(quotation.notes || quotation.internal_notes) && (
                <div className="mt-4 pt-4 border-t border-dm-border-secondary">
                  <p className="text-xs font-bold uppercase tracking-wider text-dm-text-muted mb-2">Observaciones</p>
                  {quotation.notes && <p className="text-sm text-dm-text-secondary leading-relaxed">{quotation.notes}</p>}
                  {quotation.internal_notes && <p className="text-sm text-dm-text-muted leading-relaxed mt-1">{quotation.internal_notes}</p>}
                </div>
              )}
            </div>

            <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <EyeIcon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-primary">Previsualizacion</h3>
              </div>
              <p className="text-xs text-dm-text-secondary leading-relaxed mb-4">
                Revise la cotizacion antes de compartirla. Puede abrir el PDF completo, refrescar el estado o enviarlo por WhatsApp.
              </p>
              <div className="space-y-2">
                <button
                  onClick={handleRefreshPDF}
                  className="w-full py-2.5 text-sm font-bold text-dm-text-secondary border border-dm-border-primary rounded-lg hover:bg-dm-bg-hover transition-all"
                >
                  Refrescar estado PDF
                </button>
                {pdfExists && pdfUrl ? (
                  <>
                    <button
                      onClick={() => window.open(pdfUrl, '_blank')}
                      className="w-full py-2.5 text-sm font-bold text-primary border border-primary/20 rounded-lg hover:bg-primary hover:text-white transition-all"
                    >
                      Ver pantalla completa
                    </button>
                    <button
                      onClick={handleSendWhatsApp}
                      className="w-full py-2.5 text-sm font-bold text-primary border border-primary/20 rounded-lg hover:bg-primary hover:text-white transition-all"
                    >
                      Enviar por WhatsApp
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-dm-text-muted">Aun no hay PDF disponible.</p>
                )}

                {quotation.status === 'ACCEPTED' && (
                  <Button onClick={handleConvertToInvoice} className="w-full">
                    Convertir a Factura
                  </Button>
                )}
              </div>
            </div>
          </aside>

          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex bg-dm-bg-primary p-1 rounded-xl shadow-sm border border-dm-border-primary">
              <button
                onClick={() => setActiveView('preview')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-bold rounded-lg transition-all ${
                  activeView === 'preview'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-dm-text-muted hover:bg-dm-bg-hover'
                }`}
              >
                <EyeIcon className="h-4 w-4" />
                Previsualizacion PDF
              </button>
              <button
                onClick={() => setActiveView('details')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-bold rounded-lg transition-all ${
                  activeView === 'details'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-dm-text-muted hover:bg-dm-bg-hover'
                }`}
              >
                <ClipboardDocumentListIcon className="h-4 w-4" />
                Detalle de Items
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeView === 'details' ? 'bg-dm-bg-primary/20 text-white' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                }`}>
                  {quotation.items?.length ?? 0}
                </span>
              </button>
            </div>

            {activeView === 'preview' ? (
              pdfExists && pdfUrl ? (
                <div
                  className="bg-dm-bg-primary rounded-xl shadow-xl border border-dm-border-primary overflow-hidden flex-1"
                  style={{ minHeight: '700px' }}
                >
                  <iframe
                    src={pdfUrl}
                    className="w-full"
                    style={{ height: '80vh', minHeight: '700px' }}
                    title="PDF de la cotizacion"
                  />
                </div>
              ) : (
                <div
                  className="bg-dm-bg-primary rounded-xl border-2 border-dashed border-dm-border-primary flex items-center justify-center"
                  style={{ minHeight: '500px' }}
                >
                  <div className="text-center p-8">
                    <DocumentTextIcon className="h-12 w-12 text-dm-text-muted mx-auto mb-4" />
                    <h3 className="text-base font-semibold text-dm-text-secondary mb-1">PDF no disponible</h3>
                    <p className="text-sm text-dm-text-muted">Use "Generar PDF" para crear la previsualizacion.</p>
                  </div>
                </div>
              )
            ) : (
              <div className="bg-dm-bg-primary p-6 rounded-xl shadow-sm border border-dm-border-primary">
                <h3 className="text-sm font-bold text-dm-text-secondary mb-4 flex items-center gap-2">
                  <ClipboardDocumentListIcon className="h-4 w-4" />
                  Items de la Cotizacion
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-dm-bg-secondary">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-dm-text-muted">N</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-dm-text-muted">Descripcion</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-dm-text-muted">Cantidad</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-dm-text-muted">P. Unitario</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-dm-text-muted">Descuento</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-dm-text-muted">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="bg-dm-bg-primary divide-y divide-slate-100">
                      {quotation.items?.map((item, index) => {
                        const subtotal = Number(item.quantity) * Number(item.unit_price) - Number(item.discount || 0);
                        return (
                          <tr key={`${quotation.id}-${index}`}>
                            <td className="px-4 py-3 text-sm font-semibold text-dm-text-primary">{index + 1}</td>
                            <td className="px-4 py-3 text-sm text-dm-text-secondary">{item.item_description}</td>
                            <td className="px-4 py-3 text-sm text-dm-text-secondary">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-dm-text-secondary">{formatCurrency(item.unit_price)}</td>
                            <td className="px-4 py-3 text-sm text-dm-text-secondary">{formatCurrency(item.discount || 0)}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-dm-text-primary">{formatCurrency(subtotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 bg-dm-bg-secondary rounded-xl p-4 border border-dm-border-primary">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-dm-text-muted mb-3 flex items-center gap-2">
                    <CurrencyDollarIcon className="h-4 w-4" />
                    Resumen de Totales
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <p className="text-dm-text-secondary">Subtotal gravado: <span className="font-semibold text-dm-text-primary">{formatCurrency(quotation.total_taxable)}</span></p>
                    <p className="text-dm-text-secondary">Exonerado: <span className="font-semibold text-dm-text-primary">{formatCurrency(quotation.total_exonerated)}</span></p>
                    <p className="text-dm-text-secondary">IGV: <span className="font-semibold text-dm-text-primary">{formatCurrency(quotation.total_igv)}</span></p>
                    <p className="text-dm-text-secondary">Descuento: <span className="font-semibold text-dm-text-primary">{formatCurrency(quotation.total_discount)}</span></p>
                    <p className="md:col-span-2 text-base text-dm-text-secondary">Total a pagar: <span className="font-bold text-dm-text-primary">{formatCurrency(quotation.total_payable)}</span></p>
                    <p className="md:col-span-2 text-xs text-dm-text-muted">{quotation.total_in_words}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <QuotationWhatsAppModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        quotation={quotation}
        pdfUrl={pdfUrl}
      />
    </div>
  );
};
