import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/sileo-toast';
import { manifestService } from '../services/manifest.service';
import { generatePassengerManifestPDF } from '../services/manifestPdfGeneration.service';
import { Manifest, ManifestFormData } from '../types/manifest.types';
import { asApiError, detailToString } from '../../../utils/errorHandler';

export function useTripManifests() {
  const { tripId } = useParams<{ tripId: string }>();
  const queryClient = useQueryClient();
  const numericTripId = tripId ? parseInt(tripId, 10) : 0;

  const {
    data: manifests = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['trip-manifests', tripId],
    queryFn: async () => {
      if (!numericTripId) return [];
      try {
        const selectedBranch = localStorage.getItem('selectedSalesBranch');
        if (!selectedBranch) throw new Error('No hay sucursal seleccionada');
        const branchData = JSON.parse(selectedBranch);

        const cached = queryClient.getQueryData<Manifest[]>(['manifests', branchData.id]);
        if (cached && Array.isArray(cached)) {
          return cached.filter((m) => m.trip_id === numericTripId);
        }

        const branchManifests = await manifestService.getManifestsByBranchOffice(branchData.id);
        return branchManifests.filter((m) => m.trip_id === numericTripId);
      } catch (err) {
        console.error('Error al obtener manifiestos por viaje:', err);
        return [];
      }
    },
    enabled: !!numericTripId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const passengerManifest = useMemo(
    () => manifests.find((m) => m.manifest_type === 'PASSENGER'),
    [manifests]
  );

  const cargoManifest = useMemo(
    () => manifests.find((m) => m.manifest_type === 'CARGO'),
    [manifests]
  );

  const tripInfo = useMemo(() => manifests[0], [manifests]);

  // Generar y subir PDF automáticamente tras crear/regenerar un manifiesto
  const generateAndUploadPDF = useCallback(
    async (manifest: Manifest) => {
      try {
        const { blob } = await generatePassengerManifestPDF(manifest);
        const file = new File([blob], `manifiesto-${manifest.id}.pdf`, {
          type: 'application/pdf',
        });
        await manifestService.uploadManifestPDF(manifest.id, file, 'a4');
        toast.success('PDF generado y subido correctamente');
        queryClient.invalidateQueries({ queryKey: ['trip-manifests', tripId] });
        queryClient.invalidateQueries({ queryKey: ['manifests'] });
      } catch (err: any) {
        console.error('Error al generar/subir PDF:', err);
        toast.error('El manifiesto se creó pero no se pudo generar el PDF automáticamente');
      }
    },
    [queryClient, tripId]
  );

  const generateMutation = useMutation({
    mutationFn: async (data: ManifestFormData) => {
      return manifestService.createOrRegenerateManifest(data);
    },
    onSuccess: async (result) => {
      const action = result.isRegeneration ? 'regenerado' : 'generado';
      toast.success(`Manifiesto ${action} exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['trip-manifests', tripId] });
      queryClient.invalidateQueries({ queryKey: ['manifests'] });

      // Generar y subir PDF automáticamente
      if (result.data) {
        await generateAndUploadPDF(result.data);
      }
    },
    onError: (error) => {
      const apiError = asApiError(error);
      console.error('Error al generar manifiesto:', error);

      if (apiError.response?.status === 403) {
        toast.error(detailToString(apiError.response.data?.detail) || 'No tienes permisos para generar manifiestos');
      } else if (apiError.response?.status === 401) {
        toast.error('No se puede generar el manifiesto: no hay datos registrados para este viaje');
      } else if (apiError.response?.status === 400 || apiError.response?.status === 422) {
        const msg =
          apiError.response.data?.message ||
          detailToString(apiError.response.data?.detail) ||
          'No hay datos suficientes para generar el manifiesto';
        toast.error(msg);
      } else {
        toast.error(error.message || 'Error al generar el manifiesto');
      }
    },
  });

  const generateManifest = useCallback(
    (manifestType: 'PASSENGER' | 'CARGO', observations?: string) => {
      if (!numericTripId) return;
      generateMutation.mutate({
        trip_id: numericTripId,
        manifest_type: manifestType,
        observations: observations?.trim() || undefined,
      });
    },
    [numericTripId, generateMutation]
  );

  // Mutación para regenerar el PDF de un manifiesto existente manualmente
  const pdfMutation = useMutation({
    mutationFn: async (manifest: Manifest) => {
      const { blob } = await generatePassengerManifestPDF(manifest);
      const file = new File([blob], `manifiesto-${manifest.id}.pdf`, {
        type: 'application/pdf',
      });
      await manifestService.uploadManifestPDF(manifest.id, file, 'a4');
      return manifest;
    },
    onSuccess: () => {
      toast.success('PDF regenerado y subido correctamente');
      queryClient.invalidateQueries({ queryKey: ['trip-manifests', tripId] });
      queryClient.invalidateQueries({ queryKey: ['manifests'] });
    },
    onError: (error) => {
      console.error('Error al regenerar PDF:', error);
      toast.error(error.message || 'Error al regenerar el PDF');
    },
  });

  const regeneratePDF = useCallback(
    (manifest: Manifest) => {
      pdfMutation.mutate(manifest);
    },
    [pdfMutation]
  );

  const handleDownloadPDF = useCallback(
    (pdfUrl: string | null | undefined, manifestNumber: string) => {
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
    },
    []
  );

  const statusLabel = useCallback((status?: string) => {
    const map: Record<string, string> = {
      GENERATED: 'Completado',
      DRAFT: 'Borrador',
      CANCELLED: 'Cancelado',
    };
    return map[status ?? ''] ?? status ?? '—';
  }, []);

  const statusColor = useCallback((status?: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      GENERATED: { bg: 'bg-[#e6f7e6]', text: 'text-[#237804]' },
      DRAFT: { bg: 'bg-[#fffbe6]', text: 'text-[#ad6800]' },
      CANCELLED: { bg: 'bg-[#fff1f0]', text: 'text-[#cf1322]' },
    };
    return map[status ?? ''] ?? { bg: 'bg-[#f5f5f5]', text: 'text-[#4d4d4d]' };
  }, []);

  return {
    tripId: numericTripId,
    manifests,
    passengerManifest,
    cargoManifest,
    tripInfo,
    isLoading,
    error,
    isGenerating: generateMutation.isPending,
    isGeneratingPDF: pdfMutation.isPending || generateMutation.isPending,
    generateManifest,
    regeneratePDF,
    handleDownloadPDF,
    statusLabel,
    statusColor,
  };
}
