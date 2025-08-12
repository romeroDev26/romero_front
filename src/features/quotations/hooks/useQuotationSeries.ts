// src/features/quotations/hooks/useQuotationSeries.ts
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { documentSeriesService } from '../../../services/documentSeries.service';
import { authService } from '../../../services/auth.service';
import { DocumentSeries, User } from '../../../types';

export const useQuotationSeries = (branchOfficeId?: number) => {
  const [selectedSeries, setSelectedSeries] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener el usuario actual para obtener company_id y branch_office por defecto
  const { data: currentUser } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: () => authService.getProfile(),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1
  });

  // Determinar qué branch office usar
  const targetBranchOfficeId = branchOfficeId || currentUser?.default_branch_office_id;
  const companyId = currentUser?.company_id;

  // Obtener todas las series de documentos para filtrar las de cotización
  const { data: allSeries = [], isLoading: isLoadingSeries, error: seriesError } = useQuery({
    queryKey: ['documentSeries', companyId],
    queryFn: () => documentSeriesService.getAllByCompany(companyId!),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5 // 5 minutos
  });

  // Filtrar series de cotización para la sucursal específica
  const quotationSeries = useMemo(() => {
    if (!allSeries.length || !targetBranchOfficeId) return [];
    
    return allSeries.filter(series => 
      series.document_type_code === 'COT' && 
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
      setError('No se pudo determinar la compañía o sucursal');
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const newSeries = await documentSeriesService.createQuotationSeries(companyId, targetBranchOfficeId);
      // La query se invalidará automáticamente, actualizando quotationSeries
      return newSeries;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear serie de cotización';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
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
    loading: isLoadingSeries || loading,
    error: seriesError?.message || error,
    currentUser,
    targetBranchOfficeId,
    handleSeriesChange,
    createQuotationSeries
  };
};
