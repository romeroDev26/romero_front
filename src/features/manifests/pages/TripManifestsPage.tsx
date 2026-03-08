import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  UsersIcon,
  CubeIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  TruckIcon,
  EyeIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { manifestService } from '../services/manifest.service';
import { Manifest } from '../types/manifest.types';

export const TripManifestsPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'passenger' | 'cargo'>('passenger');

  // Query para obtener manifiestos del trip específico
  const { 
    data: manifests = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['trip-manifests', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      try {
        const selectedBranch = localStorage.getItem('selectedSalesBranch');
        if (!selectedBranch) throw new Error('No hay sucursal seleccionada');
        const branchData = JSON.parse(selectedBranch);

        const cached = queryClient.getQueryData<any[]>(['manifests', branchData.id]);
        if (cached && Array.isArray(cached)) {
          return cached.filter(m => m.trip_id === parseInt(tripId));
        }

        const branchManifests = await manifestService.getManifestsByBranchOffice(branchData.id);
        return branchManifests.filter(m => m.trip_id === parseInt(tripId));
      } catch (error) {
        console.error('Error al obtener manifiestos por viaje usando lista de sucursal:', error);
        return [];
      }
    },
    enabled: !!tripId,
    staleTime: 1000 * 60 * 5,
    retry: false
  });

  const passengerManifest = manifests.find(m => m.manifest_type === 'PASSENGER');
  const cargoManifest = manifests.find(m => m.manifest_type === 'CARGO');
  const tripInfo = manifests[0];
  const activeManifest: Manifest | undefined = activeTab === 'passenger' ? passengerManifest : cargoManifest;

  const handleDownloadPDF = (pdfUrl: string, manifestNumber: string) => {
    if (!pdfUrl) { toast.error('PDF no disponible'); return; }
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${manifestNumber}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Estados de carga / error ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-slate-500">Cargando manifiestos del viaje...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-red-800 font-medium">Error al cargar manifiestos</h3>
          <p className="text-red-600 text-sm mt-1">{error instanceof Error ? error.message : 'Error desconocido'}</p>
        </div>
      </div>
    );
  }

  if (!tripInfo) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="text-yellow-800 font-semibold mb-1">No se encontraron manifiestos</h3>
          <p className="text-yellow-700 text-sm">
            No existen manifiestos para el viaje solicitado. Asegúrate de haber seleccionado una sucursal y de que el viaje tenga manifiestos generados.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => navigate('/fluvial/operations/manifests')}
              className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Volver a la lista
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Recargar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const statusBadge = (status?: string) => {
    if (!status) return null;
    const map: Record<string, string> = {
      GENERATED: 'bg-green-100 text-green-700',
      DRAFT:     'bg-yellow-100 text-yellow-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    const label: Record<string, string> = {
      GENERATED: 'Completado',
      DRAFT:     'Borrador',
      CANCELLED: 'Cancelado',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
        {label[status] ?? status}
      </span>
    );
  };

  const departureDatetime = tripInfo.departure_datetime ? new Date(tripInfo.departure_datetime) : null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="-mx-6 -mt-6">

      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            {/* Breadcrumb */}
            <nav className="flex text-sm font-medium text-slate-500 mb-2">
              <button
                onClick={() => navigate('/fluvial/operations/manifests')}
                className="hover:text-primary transition-colors"
              >
                Manifiestos
              </button>
              <span className="mx-2">/</span>
              <span className="text-slate-900">Detalle del Viaje</span>
            </nav>

            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg text-white">
                <TruckIcon className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  {activeManifest
                    ? `Manifiesto #${activeManifest.manifest_number}`
                    : `Viaje #${tripId}`}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 mt-0.5">
                  {tripInfo.vessel_name && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <TruckIcon className="h-3.5 w-3.5" />
                      <span className="font-medium">{tripInfo.vessel_name}</span>
                    </div>
                  )}
                  {tripInfo.route_name && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <MapPinIcon className="h-3.5 w-3.5" />
                      <span>{tripInfo.route_name}</span>
                    </div>
                  )}
                  {departureDatetime && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <CalendarDaysIcon className="h-3.5 w-3.5" />
                      <span>
                        {departureDatetime.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {' '}
                        <ClockIcon className="h-3 w-3 inline -mt-0.5" />
                        {' '}
                        {departureDatetime.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => navigate('/fluvial/operations/manifests')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Volver
            </button>
            {activeManifest?.pdf_file_path && (
              <button
                onClick={() => handleDownloadPDF(activeManifest.pdf_file_path!, activeManifest.manifest_number)}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                Descargar PDF
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── Sidebar ── */}
          <aside className="lg:col-span-4 space-y-6">

            {/* Info card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
                Detalles del Documento
              </h3>
              <div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">ID de Manifiesto</span>
                  <span className="text-sm font-bold text-slate-900">
                    #{activeManifest?.manifest_number ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Fecha Emisión</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {activeManifest
                      ? new Date(activeManifest.created_at).toLocaleDateString('es-PE')
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Hora de Salida</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {departureDatetime
                      ? departureDatetime.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Generado por</span>
                  <span className="text-sm font-semibold text-slate-900 text-right max-w-[55%] truncate">
                    {activeManifest?.generated_by_user?.full_name
                      ?? activeManifest?.generated_by_name
                      ?? activeManifest?.generated_by
                      ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">
                    {activeTab === 'passenger' ? 'Pasajeros' : 'Peso total'}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {activeTab === 'passenger'
                      ? (activeManifest?.total_passengers ?? '—')
                      : (activeManifest?.total_cargo_weight_kg ?? '—')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-slate-500">Estado</span>
                  {statusBadge(activeManifest?.status)}
                </div>
              </div>

              {activeManifest?.observations && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Observaciones</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{activeManifest.observations}</p>
                </div>
              )}
            </div>

            {/* Action card */}
            {activeManifest?.pdf_file_path && (
              <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <EyeIcon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-primary">Previsualización</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Este manifiesto ha sido verificado electrónicamente. Puede ver el documento completo o descargarlo para su impresión.
                </p>
                <button
                  onClick={() => window.open(activeManifest.pdf_file_path!, '_blank')}
                  className="w-full py-2.5 text-sm font-bold text-primary border border-primary/20 rounded-lg hover:bg-primary hover:text-white transition-all"
                >
                  Ver Pantalla Completa
                </button>
              </div>
            )}
          </aside>

          {/* ── Contenido principal ── */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Tabs — píldoras */}
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
              <button
                onClick={() => setActiveTab('passenger')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-bold rounded-lg transition-all ${
                  activeTab === 'passenger'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <UsersIcon className="h-4 w-4" />
                Manifiesto de Pasajeros
                {passengerManifest && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === 'passenger' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {passengerManifest.total_passengers}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('cargo')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-bold rounded-lg transition-all ${
                  activeTab === 'cargo'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <CubeIcon className="h-4 w-4" />
                Manifiesto de Carga
                {cargoManifest && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === 'cargo' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
                  }`}>
                    {cargoManifest.total_cargo_weight_kg}
                  </span>
                )}
              </button>
            </div>

            {/* PDF / empty states */}
            {activeManifest ? (
              activeManifest.pdf_file_path ? (
                <div
                  className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex-1"
                  style={{ minHeight: '700px' }}
                >
                  <iframe
                    src={activeManifest.pdf_file_path}
                    className="w-full"
                    style={{ height: '80vh', minHeight: '700px' }}
                    title={`PDF ${activeTab === 'passenger' ? 'Pasajeros' : 'Carga'}`}
                  />
                </div>
              ) : (
                <div
                  className="bg-white rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center"
                  style={{ minHeight: '400px' }}
                >
                  <div className="text-center p-8">
                    <DocumentTextIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-base font-semibold text-slate-600 mb-1">PDF no disponible</h3>
                    <p className="text-sm text-slate-400">El manifiesto fue generado pero aún no tiene PDF asociado.</p>
                  </div>
                </div>
              )
            ) : (
              <div
                className="bg-white rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center"
                style={{ minHeight: '400px' }}
              >
                <div className="text-center p-8">
                  {activeTab === 'passenger'
                    ? <UsersIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    : <CubeIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />}
                  <h3 className="text-base font-semibold text-slate-600 mb-1">
                    {activeTab === 'passenger' ? 'Manifiesto de Pasajeros' : 'Manifiesto de Carga'} no generado
                  </h3>
                  <p className="text-sm text-slate-400">No existe manifiesto de este tipo para el viaje.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
