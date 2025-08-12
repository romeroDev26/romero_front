// src/features/quotations/hooks/useQuotations.ts
import { useState } from 'react';
import { quotationsService } from '../services/quotations.service';
import { 
  Quotation, 
  QuotationsListParams, 
  QuotationCreate,
  QuotationStatusUpdate,
  ConvertToInvoiceData,
  PaginationMeta
} from '../types';

export const useQuotations = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 15,
    total_pages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotations = async (params: QuotationsListParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await quotationsService.getList(params);
      setQuotations(response.data);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        total_pages: response.total_pages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cotizaciones');
    } finally {
      setLoading(false);
    }
  };

  const createQuotation = async (quotationData: QuotationCreate): Promise<Quotation | null> => {
    setLoading(true);
    setError(null);
    try {
      const newQuotation = await quotationsService.create(quotationData);
      setQuotations(prev => [newQuotation, ...prev]);
      return newQuotation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear cotización');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateQuotationStatus = async (
    quotationId: number, 
    statusData: QuotationStatusUpdate
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const updatedQuotation = await quotationsService.updateStatus(quotationId, statusData);
      setQuotations(prev => 
        prev.map(q => q.id === quotationId ? updatedQuotation : q)
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estado');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteQuotation = async (quotationId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await quotationsService.delete(quotationId);
      setQuotations(prev => prev.filter(q => q.id !== quotationId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar cotización');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const sendByEmail = async (quotationId: number, emailData: any = {}): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await quotationsService.sendByEmail(quotationId, emailData);
      // Actualizar estado local a SENT
      setQuotations(prev => 
        prev.map(q => q.id === quotationId ? { ...q, status: 'SENT' as const } : q)
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar por email');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const convertToInvoice = async (
    quotationId: number, 
    invoiceData: ConvertToInvoiceData
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await quotationsService.convertToInvoice(quotationId, invoiceData);
      // Actualizar estado local a CONVERTED
      setQuotations(prev => 
        prev.map(q => q.id === quotationId ? { ...q, status: 'CONVERTED' } : q)
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al convertir a factura');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    quotations,
    pagination,
    loading,
    error,
    fetchQuotations,
    createQuotation,
    updateQuotationStatus,
    deleteQuotation,
    sendByEmail,
    convertToInvoice
  };
};
