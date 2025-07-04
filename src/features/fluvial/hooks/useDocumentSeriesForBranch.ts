// src/features/fluvial/hooks/useDocumentSeriesForBranch.ts
import { useMemo } from 'react';
import { useDocumentSeries } from '../../../hooks/useDocumentSeries';
import { routeHelpers } from '../../../services/routes.service';
import { SunatInvoiceType } from '../types/sunat.types';
import { DocumentSeries } from '../../../types'; // Asegúrate de importar el tipo completo

export const useDocumentSeriesForBranch = (branchId: number | null) => {
  const companyId = routeHelpers.getCurrentCompanyId();
  const { data: allSeries = [], isLoading, error } = useDocumentSeries(companyId);

  const branchSeries = useMemo(() => {
    if (!branchId || allSeries.length === 0) {
      return {
        availableBoletaSeries: [] as DocumentSeries[],
        availableFacturaSeries: [] as DocumentSeries[],
      };
    }

    const activeBranchSeries = allSeries.filter(
      s => s.branch_office_id === branchId && s.is_active
    );

    // Devolvemos los arrays completos para cada tipo
    const boletas = activeBranchSeries.filter(s => s.document_type_code === SunatInvoiceType.BOLETA);
    const facturas = activeBranchSeries.filter(s => s.document_type_code === SunatInvoiceType.FACTURA);

    return {
      availableBoletaSeries: boletas,
      availableFacturaSeries: facturas,
    };
  }, [allSeries, branchId]);

  return {
    ...branchSeries,
    isLoading,
    error,
  };
};