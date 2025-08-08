// src/hooks/useAccountingDocumentSeries.ts
import { useMemo } from 'react';
import { useDocumentSeries } from './useDocumentSeries';
import { SunatInvoiceType } from '../features/fluvial/types/sunat.types';
import { DocumentSeries } from '../types';

// Hook para obtener series de documentos de contabilidad por branch office
export const useAccountingDocumentSeriesForBranch = (branchId: number | null, companyId: number) => {

  const { data: allSeries = [], isLoading, error } = useDocumentSeries(companyId);

  const branchSeries = useMemo(() => {
    if (allSeries.length === 0) {
      return {
        availableCreditNoteSeries: [] as DocumentSeries[],
        availableDebitNoteSeries: [] as DocumentSeries[],
      };
    }

    let activeBranchSeries;
    if (!branchId) {
      // Si no hay branchId, usar todas las series activas
      activeBranchSeries = allSeries.filter(s => s.is_active);
    } else {
      // Filtrar por branch office específico
      activeBranchSeries = allSeries.filter(
        s => s.branch_office_id === branchId && s.is_active
      );
    }

    // Filtrar por tipo de documento
    const creditNotes = activeBranchSeries.filter(s => s.document_type_code === SunatInvoiceType.NOTA_CREDITO);
    const debitNotes = activeBranchSeries.filter(s => s.document_type_code === SunatInvoiceType.NOTA_DEBITO);

    return {
      availableCreditNoteSeries: creditNotes,
      availableDebitNoteSeries: debitNotes,
    };
  }, [allSeries, branchId]);

  return {
    ...branchSeries,
    isLoading,
    error,
  };
};
