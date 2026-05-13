import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { manifestService } from '../services/manifest.service';
import { generatePassengerManifestPDF } from '../services/manifestPdfGeneration.service';
import { Manifest, ManifestFormData } from '../types/manifest.types';
import { TripManifestGroup } from '../types/ui.types';
import { tripsService } from '../../../services/trips.service';
import { useBranchOfficesData } from '../../fluvial/hooks/useBranchOfficesData';
import { BranchOffice } from '../../../types';
import { routeHelpers } from '../../../services/routes.service';
import { getPeruDate, formatPeruDate } from '../utils/dateUtils';

function getManifestDateInPeru(manifest: Manifest): string {
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

function getTripDateInPeru(trip: { departure_datetime?: string }): string {
  const iso = trip.departure_datetime;
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

export const useManifestsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const companyId = routeHelpers.getCurrentCompanyId();

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
  const [selectedDate, setSelectedDate] = useState<Date>(getPeruDate());

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

  // 1. TODOS los manifiestos de la sucursal
  const {
    data: allManifests = [],
    isLoading: isLoadingManifests,
  } = useQuery({
    queryKey: ['manifests', selectedBranch?.id],
    queryFn: async () => {
      if (!selectedBranch?.id) return [];
      return manifestService.getManifestsByBranchOffice(selectedBranch.id);
    },
    enabled: !!selectedBranch?.id,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  // Fechas únicas que tienen manifiestos
  const datesWithManifests = useMemo(() => {
    const set = new Set<string>();
    allManifests.forEach((m) => {
      const d = getManifestDateInPeru(m);
      if (d) set.add(d);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [allManifests]);

  // 2. Viajes de la semana completa (sin filtro de estado, para no perder viajes pasados)
  const weekStart = useMemo(
    () => format(startOfWeek(selectedDate, { locale: es }), 'yyyy-MM-dd'),
    [selectedDate]
  );
  const weekEnd = useMemo(
    () => format(endOfWeek(selectedDate, { locale: es }), 'yyyy-MM-dd'),
    [selectedDate]
  );

  const {
    data: tripsForWeek = [],
    isLoading: isLoadingTrips,
  } = useQuery({
    queryKey: ['trips-for-manifests-week', companyId, weekStart, weekEnd],
    queryFn: async () => {
      const result = await tripsService.search({
        company_id: companyId,
        start_date: weekStart,
        end_date: weekEnd,
      });
      return result;
    },
    enabled: !!companyId && !!selectedBranch,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  // Filtrar viajes de la semana para quedarnos solo con los del día seleccionado
  const tripsForDate = useMemo(() => {
    return tripsForWeek.filter((trip) => getTripDateInPeru(trip) === dateStr);
  }, [tripsForWeek, dateStr]);

  // 3. Construir grupos combinando manifiestos + viajes del día
  const tripGroups: TripManifestGroup[] = useMemo(() => {
    const groups = new Map<number, TripManifestGroup>();

    const manifestsForDate = allManifests.filter((m) => getManifestDateInPeru(m) === dateStr);

    manifestsForDate.forEach((m) => {
      if (!groups.has(m.trip_id)) {
        groups.set(m.trip_id, {
          id: m.trip_id,
          departure_datetime: m.departure_datetime,
          route_name: m.route_name,
          vessel_name: m.vessel_name,
          status: m.trip_status,
        });
      }
      const g = groups.get(m.trip_id)!;
      if (m.manifest_type === 'PASSENGER') g.passengerManifest = m;
      else if (m.manifest_type === 'CARGO') g.cargoManifest = m;
    });

    tripsForDate.forEach((trip) => {
      if (!groups.has(trip.id)) {
        groups.set(trip.id, {
          id: trip.id,
          departure_datetime: trip.departure_datetime,
          route_name: trip.trip_name || trip.route?.name,
          vessel_name: trip.vessel_name || trip.vessel?.name,
          status: trip.status,
        });
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      const ta = a.departure_datetime || '';
      const tb = b.departure_datetime || '';
      return ta.localeCompare(tb);
    });
  }, [allManifests, tripsForDate, dateStr]);

  const generateMutation = useMutation({
    mutationFn: async (data: ManifestFormData) => manifestService.createOrRegenerateManifest(data),
    onSuccess: async (result) => {
      const action = result.isRegeneration ? 'regenerado' : 'generado';
      toast.success(`Manifiesto ${action} exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['manifests'] });
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
          queryClient.invalidateQueries({ queryKey: ['manifests'] });
          queryClient.invalidateQueries({ queryKey: ['trip-manifests'] });
        } catch (pdfError: any) {
          console.error('Error al generar/subir PDF:', pdfError);
          toast.error('El manifiesto se creó pero no se pudo generar el PDF automáticamente');
        }
      }
    },
    onError: (error: any) => {
      console.error('Error al generar manifiesto:', error);

      if (error.response?.status === 403) {
        toast.error(error.response.data?.detail || 'No tienes permisos para generar manifiestos');
      } else if (error.response?.status === 401) {
        toast.error('No se puede generar el manifiesto: no hay datos registrados para este viaje');
      } else if (error.response?.status === 400 || error.response?.status === 422) {
        const msg =
          error.response.data?.message ||
          error.response.data?.detail ||
          'No hay datos suficientes para generar el manifiesto';
        toast.error(msg);
      } else {
        toast.error(error.message || 'Error al generar el manifiesto');
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

  const navigateToTrip = (tripId: number) => {
    navigate(`/fluvial/operations/manifests/trip/${tripId}`);
  };

  const isLoading = isLoadingTrips || isLoadingManifests;

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
  };
};
