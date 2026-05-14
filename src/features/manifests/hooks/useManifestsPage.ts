import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { toast } from 'react-toastify';
import { manifestService } from '../services/manifest.service';
import { generatePassengerManifestPDF } from '../services/manifestPdfGeneration.service';
import { ManifestFormData, DailyTripManifestItem } from '../types/manifest.types';
import { TripManifestGroup } from '../types/ui.types';
import { useBranchOfficesData } from '../../fluvial/hooks/useBranchOfficesData';
import { BranchOffice } from '../../../types';
import { getPeruDate, formatPeruDate } from '../utils/dateUtils';

function getManifestDateInPeru(manifest: { departure_datetime?: string; created_at?: string }): string {
  const iso = manifest.departure_datetime || manifest.created_at;
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

interface ApiError {
  response?: {
    status?: number;
    data?: {
      detail?: string;
      message?: string;
    };
  };
  message?: string;
}

function mapDailyItemToGroup(item: DailyTripManifestItem): TripManifestGroup {
  return {
    id: item.id,
    departure_datetime: item.departure_datetime,
    trip_name: item.trip_name,
    route_name: item.trip_name,
    origin_port_name: item.origin_port_name,
    destination_port_name: item.destination_port_name,
    vessel_name: item.vessel_name,
    status: item.status,
    passengerManifest: item.passenger_manifest
      ? {
          id: item.passenger_manifest.id,
          trip_id: item.id,
          manifest_number: item.passenger_manifest.manifest_number,
          generation_date: item.passenger_manifest.generation_date || '',
          generated_by: '',
          status: item.passenger_manifest.status,
          total_passengers: item.passenger_manifest.total_passengers,
          total_cargo_weight_kg: 0,
          manifest_type: 'PASSENGER',
          pdf_file_path: item.passenger_manifest.pdf_file_path,
          created_at: '',
          updated_at: '',
          items: [],
        }
      : undefined,
    cargoManifest: item.cargo_manifest
      ? {
          id: item.cargo_manifest.id,
          trip_id: item.id,
          manifest_number: item.cargo_manifest.manifest_number,
          generation_date: item.cargo_manifest.generation_date || '',
          generated_by: '',
          status: item.cargo_manifest.status,
          total_passengers: 0,
          total_cargo_weight_kg: item.cargo_manifest.total_cargo_weight_kg,
          manifest_type: 'CARGO',
          pdf_file_path: item.cargo_manifest.pdf_file_path,
          created_at: '',
          updated_at: '',
          items: [],
        }
      : undefined,
  };
}

export const useManifestsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedBranch, setSelectedBranch] = useState<BranchOffice | null>(() => {
    const savedBranch = localStorage.getItem('selectedSalesBranch');
    if (savedBranch) {
      try {
        return JSON.parse(savedBranch) as BranchOffice;
      } catch {
        localStorage.removeItem('selectedSalesBranch');
        return null;
      }
    }
    return null;
  });
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const branchSelectorRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDateParam = searchParams.get('date');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (initialDateParam) {
      const parsed = new Date(`${initialDateParam}T05:00:00Z`);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return getPeruDate();
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!showBranchSelector) return;
      if (branchSelectorRef.current && !branchSelectorRef.current.contains(event.target as Node)) {
        setShowBranchSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBranchSelector]);

  const { data: branches, isLoading: isLoadingBranches } = useBranchOfficesData();

  const dateStr = useMemo(() => formatPeruDate(selectedDate), [selectedDate]);

  // Rango del mes actual para traer solo los manifiestos necesarios para el calendario
  const monthRange = useMemo(() => {
    const start = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
    const end = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
    return { start, end };
  }, [selectedDate]);



  // 1. Manifiestos del mes (solo para calcular fechas con manifiestos en el calendario)
  const {
    data: monthManifests = [],
    isLoading: isLoadingManifests,
  } = useQuery({
    queryKey: ['manifests-month', selectedBranch?.id, monthRange.start, monthRange.end],
    queryFn: async () => {
      if (!selectedBranch?.id) return [];
      try {
        return await manifestService.getManifestsByBranchOffice(selectedBranch.id, {
          date_from: monthRange.start,
          date_to: monthRange.end,
        });
      } catch (error: any) {
        // Si el endpoint falla, devolver array vacío para no romper la UI del calendario
        console.error('Error al obtener manifiestos del mes:', error);
        return [];
      }
    },
    enabled: !!selectedBranch?.id,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  // Fechas únicas que tienen manifiestos
  const datesWithManifests = useMemo(() => {
    const set = new Set<string>();
    monthManifests.forEach((m) => {
      const d = getManifestDateInPeru(m);
      if (d) set.add(d);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [monthManifests]);

  // 2. Vista diaria unificada: viajes + manifiestos ya filtrados por sucursal y fecha
  const {
    data: dailyView,
    isLoading: isLoadingDailyView,
    error: dailyViewError,
  } = useQuery({
    queryKey: ['manifests-daily-view', selectedBranch?.id, dateStr],
    queryFn: async () => {
      if (!selectedBranch?.id) return { trips: [] };
      return manifestService.getDailyManifestView(selectedBranch.id, dateStr);
    },
    enabled: !!selectedBranch?.id && !!dateStr,
    staleTime: 1000 * 60 * 1,
    retry: 1,
  });

  // 3. Mapear trips del endpoint unificado al grupo de UI
  const tripGroups: TripManifestGroup[] = useMemo(() => {
    const trips = dailyView?.trips || [];
    return trips
      .map(mapDailyItemToGroup)
      .sort((a, b) => {
        const ta = a.departure_datetime || '';
        const tb = b.departure_datetime || '';
        return ta.localeCompare(tb);
      });
  }, [dailyView]);

  const generateMutation = useMutation({
    mutationFn: async (data: ManifestFormData) => manifestService.createOrRegenerateManifest(data),
    onSuccess: async (result) => {
      const action = result.isRegeneration ? 'regenerado' : 'generado';
      toast.success(`Manifiesto ${action} exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['manifests-daily-view'] });
      queryClient.invalidateQueries({ queryKey: ['manifests-month'] });
      queryClient.invalidateQueries({ queryKey: ['trip-manifests'] });

      // Generar y subir PDF automáticamente tras crear/regenerar el manifiesto
      if (result.data) {
        try {
          const { blob } = await generatePassengerManifestPDF(result.data);
          const file = new File([blob], `manifiesto-${result.data.id}.pdf`, {
            type: 'application/pdf',
          });
          await manifestService.uploadManifestPDF(result.data.id, file, 'a4');
          toast.success('PDF generado y subido correctamente');
          // Refrescar para mostrar el pdf_file_path actualizado
          queryClient.invalidateQueries({ queryKey: ['manifests-daily-view'] });
          queryClient.invalidateQueries({ queryKey: ['manifests-month'] });
          queryClient.invalidateQueries({ queryKey: ['trip-manifests'] });
        } catch (pdfError: unknown) {
          const err = pdfError as ApiError;
          console.error('Error al generar/subir PDF:', err);
          toast.error('El manifiesto se creó pero no se pudo generar el PDF automáticamente');
        }
      }
    },
    onError: (error: unknown) => {
      const err = error as ApiError;
      console.error('Error al generar manifiesto:', err);

      if (err.response?.status === 403) {
        toast.error(err.response.data?.detail || 'No tienes permisos para generar manifiestos');
      } else if (err.response?.status === 401) {
        toast.error('No se puede generar el manifiesto: no hay datos registrados para este viaje');
      } else if (err.response?.status === 400 || err.response?.status === 422) {
        const msg =
          err.response.data?.message ||
          err.response.data?.detail ||
          'No hay datos suficientes para generar el manifiesto';
        toast.error(msg);
      } else {
        toast.error(err.message || 'Error al generar el manifiesto');
      }
    },
  });

  const handleGenerateManifest = (tripId: number, manifestType: 'PASSENGER' | 'CARGO') => {
    generateMutation.mutate({ trip_id: tripId, manifest_type: manifestType });
  };

  const handleDownloadPDF = (pdfUrl: string | null | undefined, manifestNumber: string) => {
    if (!pdfUrl) {
      toast.error('PDF no disponible');
      return;
    }
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${manifestNumber}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBranchChange = (branch: BranchOffice) => {
    setSelectedBranch(branch);
    localStorage.setItem('selectedSalesBranch', JSON.stringify(branch));
    setShowBranchSelector(false);
  };

  const navigateToTrip = (tripId: number, manifestType?: 'PASSENGER' | 'CARGO') => {
    const params = new URLSearchParams();
    if (manifestType) params.set('tab', manifestType.toLowerCase());
    params.set('date', dateStr);
    navigate(`/fluvial/operations/manifests/trip/${tripId}?${params.toString()}`);
  };

  const isLoading = isLoadingManifests || isLoadingDailyView;

  return {
    selectedBranch,
    showBranchSelector,
    setShowBranchSelector,
    branchSelectorRef,
    selectedDate,
    setSelectedDate,
    branches,
    isLoadingBranches,
    handleBranchChange,
    dateStr,
    tripGroups,
    datesWithManifests,
    isLoading,
    isGenerating: generateMutation.isPending,
    handleGenerateManifest,
    handleDownloadPDF,
    navigateToTrip,
    dailyViewError,
  };
};
