// src/features/quotations/hooks/useQuotationSeriesByBranch.ts
import { useMemo, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { documentSeriesService, QUOTATION_DOCUMENT_TYPE_CODE } from '../../../services/documentSeries.service';
import { authService } from '../../../services/auth.service';
import { DocumentSeries, User } from '../../../types';
import { toast } from '@/utils/sileo-toast';

export const useQuotationSeriesByBranch = (branchOfficeId?: number) => {
  const [selectedSeries, setSelectedSeries] = useState<string>('');
  const queryClient = useQueryClient();

  // Obtener el usuario actual para obtener company_id y branch_office por defecto
  const { data: currentUser } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: () => authService.getProfile(),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1
  });

  // Obtener sucursal seleccionada desde localStorage (como en SalesPoint) o usar la del usuario
  const { targetBranchOfficeId, companyId } = useMemo(() => {
    // Primero intentar obtener la sucursal seleccionada en el punto de ventas
    const savedBranchJson = localStorage.getItem('selectedSalesBranch');
    if (savedBranchJson) {
      try {
        const savedBranch = JSON.parse(savedBranchJson);
        return {
          targetBranchOfficeId: savedBranch.id,
          companyId: savedBranch.company_id
        };
      } catch (e) {
        console.error('Error parsing saved branch office', e);
        localStorage.removeItem('selectedSalesBranch');
      }
    }
    // Si no hay sucursal guardada, usar la del parámetro o la por defecto del usuario
    const defaultBranch = branchOfficeId || currentUser?.default_branch_office_id;
    return {
      targetBranchOfficeId: defaultBranch,
      companyId: currentUser?.company_id
    };
  }, [branchOfficeId, currentUser?.default_branch_office_id, currentUser?.company_id]);


  // Obtener todas las series de documentos para filtrar las de cotización
  const { data: allSeries = [], isLoading, error, refetch } = useQuery({
    queryKey: ['documentSeries', companyId],
    queryFn: async () => {
      return documentSeriesService.getAllByCompany(companyId!);
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5 // 5 minutos
  });


  // Filtrar series de cotización para la sucursal específica
  const quotationSeries = useMemo(() => {
    if (!allSeries.length || !targetBranchOfficeId) {
      return [];
    }
    return allSeries.filter(series => 
      series.document_type_code === QUOTATION_DOCUMENT_TYPE_CODE && 
      series.branch_office_id === targetBranchOfficeId &&
      series.is_active
    );
  }, [allSeries, targetBranchOfficeId]);

  // Efecto para establecer la serie por defecto usando caché
  useEffect(() => {
    if (quotationSeries.length > 0 && !selectedSeries) {
      // Intentar recuperar la última serie usada desde localStorage
      const cacheKey = `lastUsedQuotationSeries_${targetBranchOfficeId}`;
      const cachedSeries = localStorage.getItem(cacheKey);
      
      if (cachedSeries && quotationSeries.some(s => s.series_code === cachedSeries)) {
        setSelectedSeries(cachedSeries);
      } else {
        // Si no hay caché o la serie no existe, usar la primera disponible
        setSelectedSeries(quotationSeries[0].series_code);
        localStorage.setItem(cacheKey, quotationSeries[0].series_code);
      }
    }
  }, [quotationSeries, selectedSeries, targetBranchOfficeId]);

  // Función para cambiar la serie seleccionada y guardar en caché
  const handleSeriesChange = (seriesCode: string) => {
    setSelectedSeries(seriesCode);
    if (targetBranchOfficeId) {
      const cacheKey = `lastUsedQuotationSeries_${targetBranchOfficeId}`;
      localStorage.setItem(cacheKey, seriesCode);
    }
  };

  // Función para crear una nueva serie de cotización para la sucursal
  const createQuotationSeries = async (): Promise<DocumentSeries | null> => {
    if (!companyId || !targetBranchOfficeId) {
      toast.error('No se pudo determinar la compañía o sucursal');
      return null;
    }

    try {
      const newSeries = await documentSeriesService.createQuotationSeries(companyId, targetBranchOfficeId);
      
      // Invalidar la query para refrescar las series
      await queryClient.invalidateQueries({ queryKey: ['documentSeries', companyId] });
      
      toast.success(`Serie ${newSeries.series_code} creada exitosamente`);
      return newSeries;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear serie de cotización';
      toast.error(errorMessage);
      return null;
    }
  };

  // Obtener la serie seleccionada completa
  const selectedSeriesData = useMemo(() => {
    return quotationSeries.find(s => s.series_code === selectedSeries) || null;
  }, [quotationSeries, selectedSeries]);

  return {
    quotationSeries,
    selectedSeries,
    selectedSeriesData,
    loading: isLoading,
    error: error?.message,
    currentUser,
    targetBranchOfficeId,
    handleSeriesChange,
    createQuotationSeries,
    refetch
  };
};
