// src/features/quotations/pages/QuotationDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { useQuotationPDFGeneration } from '../hooks/useQuotationPDFGeneration';
import { QuotationWhatsAppModal } from '../components/QuotationWhatsAppModal';
import { quotationsService } from '../services/quotations.service';
import { Quotation, QuotationStatus } from '../types';
import { toast } from 'react-toastify';

const statusLabels: Record<QuotationStatus, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Expirada',
  CONVERTED: 'Convertida'
};

const statusColors: Record<QuotationStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-yellow-100 text-yellow-800',
  CONVERTED: 'bg-purple-100 text-purple-800'
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
      console.log('🔄 Iniciando polling para PDF automático...');
      
      // Hacer polling para verificar si el PDF se generó automáticamente
      const pollForPDF = async () => {
        let attempts = 0;
        const maxAttempts = 20; // máximo 10 segundos (500ms * 20)
        
        const poll = async () => {
          try {
            console.log(`🔍 Polling intento ${attempts + 1}/${maxAttempts}`);
            
            // Refrescar los datos de la cotización primero
            const refreshedQuotation = await quotationsService.getById(quotation.id);
            
            if (refreshedQuotation.pdf_file_path && refreshedQuotation.pdf_file_path.trim() !== '') {
              console.log('✅ PDF detectado en cotización refrescada:', refreshedQuotation.pdf_file_path);
              setQuotation(refreshedQuotation);
              setPdfExists(true);
              setPdfUrl(refreshedQuotation.pdf_file_path);
              return true;
            }
            
            // Fallback: usar el servicio
            const token = localStorage.getItem('token') || '';
            const exists = await checkPDFExists(quotation.id, token);
            
            if (exists) {
              console.log('✅ PDF detectado vía servicio');
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
            console.error('❌ Error en polling:', error);
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
          console.log('⏰ Polling terminado sin encontrar PDF');
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
          const token = localStorage.getItem('token') || '';
          const exists = await checkPDFExists(quotation.id, token);
          setPdfExists(exists);
          
          // Si existe, obtener la URL
          if (exists) {
            const url = await getPDFUrl(quotation.id, token);
            setPdfUrl(url);
          }
        } catch (error) {
          console.error('Error checking PDF:', error);
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
      const token = localStorage.getItem('token') || '';
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
      console.log('🔄 Refrescando estado del PDF...');
      const updatedQuotation = await quotationsService.getById(quotation.id);
      setQuotation(updatedQuotation);
      
      if (updatedQuotation.pdf_file_path && updatedQuotation.pdf_file_path.trim() !== '') {
        setPdfExists(true);
        setPdfUrl(updatedQuotation.pdf_file_path);
        console.log('✅ PDF encontrado después de refrescar');
      } else {
        console.log('❌ PDF aún no disponible después de refrescar');
      }
    } catch (error) {
      console.error('Error al refrescar:', error);
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
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error: {error}</div>
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
        <div className="text-center text-gray-500">
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Cotización {quotation.series}-{quotation.number.toString().padStart(6, '0')}
          </h1>
        </div>
        <div className="flex space-x-2">
          {/* Botones de PDF - Solo mostrar "Generar PDF" si no existe */}
          {!pdfExists && (
            <>
              <Button 
                onClick={handleGenerateAndUploadPDF} 
                disabled={isProcessing}
                variant="outline"
              >
                {isGenerating && <Spinner />}
                {isGenerating ? 'Generando...' : isUploading ? 'Subiendo...' : 'Generar PDF'}
              </Button>
              
              {/* Botón de refrescar para verificar si el PDF ya está listo */}
              <Button 
                onClick={handleRefreshPDF}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                🔄 Refrescar
              </Button>
            </>
          )}
          
          {/* Botón de WhatsApp - Solo si hay PDF */}
          {pdfExists && pdfUrl && (
            <Button onClick={handleSendWhatsApp}>
              Enviar por WhatsApp
            </Button>
          )}
          
          {quotation.status === 'ACCEPTED' && (
            <Button onClick={handleConvertToInvoice}>
              Convertir a Factura
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => navigate('/sales/quotations')}
          >
            Volver
          </Button>
        </div>
      </div>

      {/* Información resumida de la cotización */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusColors[quotation.status]}`}>
                {statusLabels[quotation.status]}
              </span>
              {isExpired && quotation.status !== 'CONVERTED' && (
                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                  Expirada
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Cliente:</span> {quotation.client.name}</p>
              <p><span className="font-medium">Documento:</span> {quotation.client.doc_number}</p>
              <p><span className="font-medium">Fecha de emisión:</span> {new Date(quotation.issue_date).toLocaleDateString('es-ES')}</p>
              <p><span className="font-medium">Válida hasta:</span> {new Date(quotation.valid_until).toLocaleDateString('es-ES')}</p>
              <p><span className="font-medium">Vendedor:</span> {quotation.seller.full_name}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {quotation.currency_code} {parseFloat(quotation.total_payable).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 max-w-xs">
              {quotation.total_in_words}
            </p>
          </div>
        </div>
      </div>

      {/* Visor de PDF - Solo si existe PDF en el servidor */}
      {pdfExists && pdfUrl && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Vista Previa del PDF</h3>
              <Button
                variant="outline"
                onClick={() => window.open(pdfUrl, '_blank')}
              >
                Abrir en Nueva Pestaña
              </Button>
            </div>
          </div>
          <div className="p-6">
            <div className="border rounded-lg overflow-hidden" style={{ height: '800px' }}>
              <iframe
                src={pdfUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                title="Vista previa del PDF de la cotización"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mensaje si no hay PDF */}
      {!pdfExists && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6">
          <div className="text-yellow-800">
            <h3 className="font-medium mb-2">PDF no disponible</h3>
            <p className="text-sm">
              El PDF de esta cotización aún no está disponible. Haz clic en "Generar PDF" para crear el documento.
            </p>
          </div>
        </div>
      )}

      {/* Modal de WhatsApp */}
      <QuotationWhatsAppModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        quotation={quotation}
        pdfUrl={pdfUrl}
      />
    </div>
  );
};
