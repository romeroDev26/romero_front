import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  DocumentArrowDownIcon,
  PlusIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useTripManifests } from '../hooks/useTripManifests';

export const TripManifestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'cargo' ? 'cargo' : 'passenger';
  const [activeTab, setActiveTab] = useState<'passenger' | 'cargo'>(initialTab);
  const returnDate = searchParams.get('date');
  const backUrl = returnDate
    ? `/fluvial/operations/manifests?date=${returnDate}`
    : '/fluvial/operations/manifests';

  const {
    tripId,
    passengerManifest,
    cargoManifest,
    tripInfo,
    isLoading,
    error,
    isGenerating,
    isGeneratingPDF,
    generateManifest,
    regeneratePDF,
    handleDownloadPDF,
    statusLabel,
    statusColor,
  } = useTripManifests();

  const activeManifest = activeTab === 'passenger' ? passengerManifest : cargoManifest;
  const departureDatetime = tripInfo?.departure_datetime
    ? new Date(tripInfo.departure_datetime)
    : null;

  // ── Estados de carga / error ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1F4690] mx-auto mb-4" />
          <p className="text-[15px] text-[#828282]">Cargando manifiestos del viaje...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-6">
          <h3 className="text-[15px] font-medium text-[#202020]">Error al cargar manifiestos</h3>
          <p className="text-[13px] text-[#4d4d4d] mt-1">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
        </div>
      </div>
    );
  }

  if (!tripInfo) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-[#efefef] rounded-[20px] p-10 text-center">
          <div className="w-16 h-16 bg-[#f5f5f5] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <DocumentTextIcon className="w-8 h-8 text-[#828282]" strokeWidth={1.5} />
          </div>
          <h2
            className="text-[24px] font-medium text-[#202020] tracking-[-0.48px] leading-[1.19]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            No se encontraron manifiestos
          </h2>
          <p className="mt-3 text-[15px] text-[#4d4d4d] leading-[1.33]">
            No existen manifiestos para el viaje solicitado. Asegúrate de haber seleccionado una
            sucursal y de que el viaje tenga manifiestos generados.
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            <button
              onClick={() => navigate(backUrl)}
              className="px-5 py-2.5 text-[15px] font-medium text-[#202020] bg-white border border-[#e8e8e8] rounded-[20px] hover:bg-[#f5f5f5] transition-colors"
            >
              Volver a la lista
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 text-[15px] font-medium text-white bg-[#1F4690] rounded-[20px] hover:bg-[#163672] transition-colors"
            >
              Recargar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const colorClasses = statusColor(activeManifest?.status);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <nav className="flex text-[13px] font-medium text-[#828282] mb-2">
            <button
              onClick={() => navigate(backUrl)}
              className="hover:text-[#1F4690] transition-colors"
            >
              Manifiestos
            </button>
            <span className="mx-2 text-[#c4c4c4]">/</span>
            <span className="text-[#202020]">Detalle del Viaje</span>
          </nav>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1F4690] rounded-xl flex items-center justify-center text-white shrink-0">
              <TruckIcon className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <h1
                className="text-[28px] font-medium text-[#202020] tracking-[-0.56px] leading-[1.19]"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {activeManifest
                  ? `Manifiesto #${activeManifest.manifest_number}`
                  : `Viaje #${tripId}`}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#4d4d4d] mt-0.5">
                {tripInfo.vessel_name && (
                  <div className="flex items-center gap-1.5 text-[13px]">
                    <TruckIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span className="font-medium">{tripInfo.vessel_name}</span>
                  </div>
                )}
                {tripInfo.route_name && (
                  <div className="flex items-center gap-1.5 text-[13px]">
                    <MapPinIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span>{tripInfo.route_name}</span>
                  </div>
                )}
                {departureDatetime && (
                  <div className="flex items-center gap-1.5 text-[13px]">
                    <CalendarDaysIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span>
                      {departureDatetime.toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <ClockIcon className="h-3 w-3" strokeWidth={1.5} />
                    <span>
                      {departureDatetime.toLocaleTimeString('es-PE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
            onClick={() => navigate(backUrl)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium bg-white border border-[#e8e8e8] rounded-[20px] text-[#202020] hover:bg-[#f5f5f5] transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" strokeWidth={1.5} />
            Volver
          </button>
          {activeManifest && (
            <button
              onClick={() =>
                generateManifest(activeTab === 'passenger' ? 'PASSENGER' : 'CARGO')
              }
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium bg-amber-600 text-white rounded-[20px] hover:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowPathIcon className="h-4 w-4" strokeWidth={1.5} />
              )}
              Regenerar Manifiesto
            </button>
          )}
          {activeManifest?.pdf_file_path && (
            <button
              onClick={() =>
                handleDownloadPDF(activeManifest.pdf_file_path!, activeManifest.manifest_number)
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium bg-[#1F4690] text-white rounded-[20px] hover:bg-[#163672] transition-colors"
            >
              <DocumentArrowDownIcon className="h-4 w-4" strokeWidth={1.5} />
              Descargar PDF
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Sidebar ── */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Info card */}
          <div className="bg-white rounded-[12px] border border-[#e8e8e8] p-6">
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[#828282] mb-5">
              Detalles del Documento
            </h3>
            <div className="space-y-0">
              <div className="flex justify-between items-center py-3 border-b border-[#f0f0f0]">
                <span className="text-[13px] text-[#828282]">ID de Manifiesto</span>
                <span className="text-[13px] font-semibold text-[#202020]">
                  #{activeManifest?.manifest_number ?? '—'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#f0f0f0]">
                <span className="text-[13px] text-[#828282]">Fecha Emisión</span>
                <span className="text-[13px] font-semibold text-[#202020]">
                  {activeManifest
                    ? new Date(activeManifest.created_at).toLocaleDateString('es-PE')
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#f0f0f0]">
                <span className="text-[13px] text-[#828282]">Hora de Salida</span>
                <span className="text-[13px] font-semibold text-[#202020]">
                  {departureDatetime
                    ? departureDatetime.toLocaleTimeString('es-PE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#f0f0f0]">
                <span className="text-[13px] text-[#828282]">Generado por</span>
                <span className="text-[13px] font-semibold text-[#202020] text-right max-w-[55%] truncate">
                  {activeManifest?.generated_by_user?.full_name ??
                    activeManifest?.generated_by_name ??
                    activeManifest?.generated_by ??
                    '—'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#f0f0f0]">
                <span className="text-[13px] text-[#828282]">
                  {activeTab === 'passenger' ? 'Pasajeros' : 'Peso total'}
                </span>
                <span className="text-[13px] font-semibold text-[#202020]">
                  {activeTab === 'passenger'
                    ? (activeManifest?.total_passengers ?? '—')
                    : (activeManifest?.total_cargo_weight_kg ?? '—')}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-[13px] text-[#828282]">Estado</span>
                {activeManifest ? (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium ${colorClasses.bg} ${colorClasses.text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${colorClasses.text}`} />
                    {statusLabel(activeManifest.status)}
                  </span>
                ) : (
                  <span className="text-[13px] text-[#828282]">—</span>
                )}
              </div>
            </div>

            {activeManifest?.observations && (
              <div className="mt-5 pt-4 border-t border-[#f0f0f0]">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-[#828282] mb-2">
                  Observaciones
                </p>
                <p className="text-[13px] text-[#4d4d4d] leading-relaxed">
                  {activeManifest.observations}
                </p>
              </div>
            )}
          </div>

          {/* Action card */}
          {activeManifest?.pdf_file_path && (
            <div className="bg-[#f5f5f5] rounded-[12px] border border-[#e8e8e8] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#1F4690] shrink-0">
                  <EyeIcon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="text-[14px] font-semibold text-[#202020]">Previsualización</h3>
              </div>
              <p className="text-[13px] text-[#4d4d4d] leading-relaxed mb-5">
                Este manifiesto ha sido verificado electrónicamente. Puede ver el documento completo
                o descargarlo para su impresión.
              </p>
              <button
                onClick={() => window.open(activeManifest.pdf_file_path!, '_blank')}
                className="w-full py-2.5 text-[14px] font-medium text-[#1F4690] bg-white border border-[#e8e8e8] rounded-[12px] hover:bg-[#1F4690] hover:text-white hover:border-[#1F4690] transition-all"
              >
                Ver Pantalla Completa
              </button>
            </div>
          )}
        </aside>

        {/* ── Contenido principal ── */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Tabs */}
          <div className="flex bg-white p-1 rounded-[12px] border border-[#e8e8e8]">
            <button
              onClick={() => setActiveTab('passenger')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-[14px] font-medium rounded-[10px] transition-all ${
                activeTab === 'passenger'
                  ? 'bg-[#1F4690] text-white'
                  : 'text-[#828282] hover:text-[#202020] hover:bg-[#f5f5f5]'
              }`}
            >
              <UsersIcon className="h-4 w-4" strokeWidth={1.5} />
              Manifiesto de Pasajeros
              {passengerManifest && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    activeTab === 'passenger'
                      ? 'bg-white/20 text-white'
                      : 'bg-[#1F4690]/10 text-[#1F4690]'
                  }`}
                >
                  {passengerManifest.total_passengers}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('cargo')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-[14px] font-medium rounded-[10px] transition-all ${
                activeTab === 'cargo'
                  ? 'bg-[#1F4690] text-white'
                  : 'text-[#828282] hover:text-[#202020] hover:bg-[#f5f5f5]'
              }`}
            >
              <CubeIcon className="h-4 w-4" strokeWidth={1.5} />
              Manifiesto de Carga
              {cargoManifest && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    activeTab === 'cargo'
                      ? 'bg-white/20 text-white'
                      : 'bg-[#36D399]/10 text-[#15803d]'
                  }`}
                >
                  {cargoManifest.total_cargo_weight_kg}
                </span>
              )}
            </button>
          </div>

          {/* PDF / empty states */}
          {activeManifest ? (
            activeManifest.pdf_file_path ? (
              <div className="bg-white rounded-[12px] border border-[#e8e8e8] overflow-hidden flex-1 min-h-[400px] md:min-h-[700px]">
                <iframe
                  src={activeManifest.pdf_file_path}
                  className="w-full h-[50vh] md:h-[80vh] min-h-[400px] md:min-h-[700px]"
                  title={`PDF ${activeTab === 'passenger' ? 'Pasajeros' : 'Carga'}`}
                />
              </div>
            ) : (
              <div className="bg-white rounded-[12px] border-2 border-dashed border-[#e8e8e8] flex items-center justify-center min-h-[300px] md:min-h-[400px]">
                <div className="text-center p-8 max-w-sm">
                  <DocumentTextIcon
                    className="h-12 w-12 text-[#c4c4c4] mx-auto mb-4"
                    strokeWidth={1.5}
                  />
                  <h3 className="text-[18px] font-medium text-[#202020] mb-2">PDF no disponible</h3>
                  <p className="text-[14px] text-[#828282] mb-6">
                    El manifiesto fue generado pero aún no tiene PDF asociado. Puedes generarlo
                    ahora.
                  </p>
                  <button
                    onClick={() => regeneratePDF(activeManifest)}
                    disabled={isGeneratingPDF}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#1F4690] hover:bg-[#163672] text-white text-[14px] font-medium rounded-[20px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generando PDF...
                      </>
                    ) : (
                      <>
                        <ArrowPathIcon className="h-4 w-4" strokeWidth={2} />
                        Generar PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="bg-white rounded-[12px] border-2 border-dashed border-[#e8e8e8] flex items-center justify-center min-h-[300px] md:min-h-[400px]">
              <div className="text-center p-8 max-w-sm">
                {activeTab === 'passenger' ? (
                  <UsersIcon
                    className="h-12 w-12 text-[#c4c4c4] mx-auto mb-4"
                    strokeWidth={1.5}
                  />
                ) : (
                  <CubeIcon
                    className="h-12 w-12 text-[#c4c4c4] mx-auto mb-4"
                    strokeWidth={1.5}
                  />
                )}
                <h3 className="text-[18px] font-medium text-[#202020] mb-2">
                  {activeTab === 'passenger'
                    ? 'Manifiesto de Pasajeros'
                    : 'Manifiesto de Carga'}{' '}
                  no generado
                </h3>
                <p className="text-[14px] text-[#828282] mb-6">
                  No existe manifiesto de este tipo para el viaje. Puedes generarlo ahora
                  directamente desde esta pantalla.
                </p>
                <button
                  onClick={() =>
                    generateManifest(activeTab === 'passenger' ? 'PASSENGER' : 'CARGO')
                  }
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1F4690] hover:bg-[#163672] text-white text-[14px] font-medium rounded-[20px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-4 w-4" strokeWidth={2} />
                      Generar{' '}
                      {activeTab === 'passenger' ? 'Manifiesto de Pasajeros' : 'Manifiesto de Carga'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
