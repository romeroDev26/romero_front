import React from 'react';
import {
  UsersIcon,
  CubeIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  EyeIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import { Ship } from 'lucide-react';
import { TripManifestGroup } from '../types/ui.types';
import { Manifest } from '../types/manifest.types';
import { formatTimeFromISO } from '../utils/dateUtils';

interface TripManifestCardProps {
  trip: TripManifestGroup;
  isGenerating: boolean;
  onGenerate: (tripId: number, type: 'PASSENGER' | 'CARGO') => void;
  onDownloadPDF: (url: string | null | undefined, manifestNumber: string) => void;
  onNavigateToTrip: (tripId: number) => void;
}

function getTripStatusLabel(status?: string): { label: string; className: string } {
  const map: Record<string, { label: string; className: string }> = {
    SCHEDULED: { label: 'Programado', className: 'bg-blue-50 text-blue-700' },
    BOARDING: { label: 'Embarcando', className: 'bg-amber-50 text-amber-700' },
    DEPARTED: { label: 'Zarpado', className: 'bg-emerald-50 text-emerald-700' },
    COMPLETED: { label: 'Completado', className: 'bg-gray-100 text-gray-600' },
    CANCELLED: { label: 'Cancelado', className: 'bg-red-50 text-red-700' },
  };
  return map[status ?? ''] || { label: status || 'Desconocido', className: 'bg-gray-100 text-gray-600' };
}

export const TripManifestCard: React.FC<TripManifestCardProps> = ({
  trip,
  isGenerating,
  onGenerate,
  onDownloadPDF,
  onNavigateToTrip,
}) => {
  const status = getTripStatusLabel(trip.status);
  const hasPassenger = !!trip.passengerManifest;
  const hasCargo = !!trip.cargoManifest;

  return (
    <div className="bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-5 border-b border-[#f0f0f0]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-center min-w-[56px]">
              <div className="text-[22px] font-bold text-[#1F4690] leading-none">
                {formatTimeFromISO(trip.departure_datetime)}
              </div>
              <div className="text-[10px] font-semibold text-[#828282] uppercase tracking-wider mt-1">
                Salida
              </div>
            </div>
            <div className="h-8 w-px bg-[#e8e8e8] hidden sm:block" />
            <div>
              <div className="text-[15px] font-semibold text-[#202020]">
                {trip.route_name || 'Sin ruta'}
              </div>
              <div className="flex items-center gap-1.5 text-[13px] text-[#828282] mt-0.5">
                <Ship className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>{trip.vessel_name || 'Sin embarcación'}</span>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[11px] text-[#828282]">Viaje #{trip.id}</div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold mt-1 ${status.className}`}
            >
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* Body: Pasajeros + Carga */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#f0f0f0]">
        {/* Pasajeros */}
        <ManifestSection
          title="Pasajeros"
          icon={<UsersIcon className="w-4 h-4" strokeWidth={1.5} />}
          manifest={trip.passengerManifest}
          countValue={trip.passengerManifest?.total_passengers}
          countUnit="registrados"
          isGenerating={isGenerating}
          onGenerate={() => onGenerate(trip.id, 'PASSENGER')}
          onDownloadPDF={onDownloadPDF}
          onNavigateToTrip={() => onNavigateToTrip(trip.id)}
          activeColor="blue"
        />

        {/* Carga */}
        <ManifestSection
          title="Carga"
          icon={<CubeIcon className="w-4 h-4" strokeWidth={1.5} />}
          manifest={trip.cargoManifest}
          countValue={trip.cargoManifest?.total_cargo_weight_kg}
          countUnit="Unidad"
          isGenerating={isGenerating}
          onGenerate={() => onGenerate(trip.id, 'CARGO')}
          onDownloadPDF={onDownloadPDF}
          onNavigateToTrip={() => onNavigateToTrip(trip.id)}
          activeColor="emerald"
        />
      </div>
    </div>
  );
};

// Sub-componente para cada sección de manifiesto
interface ManifestSectionProps {
  title: string;
  icon: React.ReactNode;
  manifest?: Manifest;
  countValue?: number | null;
  countUnit?: string;
  isGenerating: boolean;
  onGenerate: () => void;
  onDownloadPDF: (url: string | null | undefined, manifestNumber: string) => void;
  onNavigateToTrip: () => void;
  activeColor: 'blue' | 'emerald';
}

const ManifestSection: React.FC<ManifestSectionProps> = ({
  title,
  icon,
  manifest,
  countValue,
  countUnit,
  isGenerating,
  onGenerate,
  onDownloadPDF,
  onNavigateToTrip,
  activeColor,
}) => {
  const hasManifest = !!manifest;
  const bgColor = activeColor === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600';
  const bgHover = activeColor === 'blue' ? 'hover:border-blue-500 hover:text-blue-600' : 'hover:border-emerald-500 hover:text-emerald-600';

  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasManifest ? bgColor : 'bg-gray-100 text-gray-400'}`}>
          {icon}
        </div>
        <span className="text-[13px] font-semibold text-[#202020]">{title}</span>
      </div>

      {hasManifest ? (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[24px] font-bold text-[#202020] leading-none">
              {countValue ?? '—'}
            </span>
            <span className="text-[12px] text-[#828282]">
              {countUnit}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-600">
            <CheckCircleIcon className="w-3.5 h-3.5" strokeWidth={2} />
            Manifiesto generado
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {manifest!.pdf_file_path && (
              <button
                onClick={() => onDownloadPDF(manifest!.pdf_file_path, manifest!.manifest_number)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1F4690] hover:bg-[#163672] text-white text-[12px] font-medium rounded-lg transition-colors"
              >
                <DocumentArrowDownIcon className="w-3.5 h-3.5" strokeWidth={2} />
                Descargar PDF
              </button>
            )}
            <button
              onClick={onNavigateToTrip}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e8e8e8] hover:bg-[#f5f5f5] text-[#202020] text-[12px] font-medium rounded-lg transition-colors"
            >
              <EyeIcon className="w-3.5 h-3.5" strokeWidth={2} />
              Ver detalle
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-[13px] text-[#828282]">Manifiesto sin generar</div>
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e8e8e8] ${bgHover} text-[#4d4d4d] text-[12px] font-medium rounded-lg transition-colors disabled:opacity-50`}
          >
            {isGenerating ? (
              <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <PlusIcon className="w-3.5 h-3.5" strokeWidth={2} />
            )}
            Generar manifiesto
          </button>
        </div>
      )}
    </div>
  );
};
