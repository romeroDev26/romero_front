// src/features/fluvial/components/schedule/TripsTable.tsx
import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InboxStackIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { UnifiedTripViewItem } from '../../hooks/useTripsView';

interface TripsTableProps {
  trips: UnifiedTripViewItem[];
  onEdit: (trip: UnifiedTripViewItem) => void;
  onCancel: (trip: UnifiedTripViewItem) => void;
  onGenerateManifest?: (trip: UnifiedTripViewItem) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

// ─── Status Badge ────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'SCHEDULED':
        return { label: 'Programado', className: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 ring-blue-600/20' };
      case 'BOARDING':
        return { label: 'Embarcando', className: 'text-yellow-700 dark:text-yellow-300 bg-yellow-50 ring-yellow-600/20' };
      case 'DEPARTED':
        return { label: 'En Ruta', className: 'text-purple-700 bg-purple-50 ring-purple-600/20' };
      case 'ARRIVED':
        return { label: 'Arribado', className: 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30 ring-green-600/20' };
      case 'COMPLETED':
        return { label: 'Completado', className: 'text-dm-text-secondary bg-dm-bg-secondary ring-dm-text-muted/20' };
      case 'CANCELLED':
        return { label: 'Cancelado', className: 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30 ring-red-600/20' };
      default:
        return { label: 'Desconocido', className: 'text-dm-text-secondary bg-dm-bg-secondary ring-dm-text-muted/20' };
    }
  };

  const config = getStatusConfig();
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${config.className}`}
    >
      {config.label}
    </span>
  );
};

// ─── Availability Bar ─────────────────────────────────────────────────────────
const AvailabilityBar: React.FC<{ available: number | null; total: number | null }> = ({
  available,
  total,
}) => {
  if (available === null || total === null || total === 0) {
    return <span className="text-dm-text-muted text-sm">N/A</span>;
  }
  const pct = Math.round(((total - available) / total) * 100);
  const barColor = pct >= 90 ? 'bg-red-400' : pct >= 60 ? 'bg-yellow-400' : 'bg-green-400';
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-dm-bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-dm-text-secondary whitespace-nowrap font-medium">
        {available}/{total}
      </span>
    </div>
  );
};

// ─── Pagination Controls ──────────────────────────────────────────────────────
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PaginationControls: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const start = Math.max(1, currentPage - 1);
      const end = Math.min(totalPages, currentPage + 1);
      if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }
    }
    return pages;
  };

  if (totalPages <= 1 && totalItems <= PAGE_SIZE_OPTIONS[0]) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 bg-dm-bg-primary border-t border-dm-border-secondary gap-3">
      <div className="flex items-center gap-3 text-sm text-dm-text-secondary">
        <span>
          Mostrando <span className="font-semibold text-dm-text-primary">{startItem}–{endItem}</span> de{' '}
          <span className="font-semibold text-dm-text-primary">{totalItems}</span> viajes
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-dm-text-muted hidden sm:inline">|</span>
          <label className="hidden sm:inline text-dm-text-muted">Por página:</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="pl-2 pr-6 py-1 text-xs border border-dm-border-primary rounded-md bg-dm-bg-secondary focus:outline-none focus:ring-1 focus:ring-indigo-500 text-dm-text-secondary cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-md border border-dm-border-primary text-dm-text-muted hover:bg-dm-bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-dm-text-muted text-sm">…</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-colors border ${
                currentPage === page
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'border-dm-border-primary text-dm-text-secondary hover:bg-dm-bg-hover'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-md border border-dm-border-primary text-dm-text-muted hover:bg-dm-bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const TripsTable: React.FC<TripsTableProps> = ({
  trips,
  onEdit,
  onCancel,
  onGenerateManifest,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.max(1, Math.ceil(trips.length / pageSize));

  // Reset page when trips change (e.g. filter applied)
  const stableTripsLength = trips.length;
  React.useEffect(() => {
    setCurrentPage(1);
  }, [stableTripsLength]);

  const paginatedTrips = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return trips.slice(start, start + pageSize);
  }, [trips, currentPage, pageSize]);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  if (!trips.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-dm-text-muted">
        <InboxStackIcon className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm font-medium">No se encontraron viajes</p>
        <p className="text-xs mt-1">Intenta cambiar los filtros o crear un nuevo viaje.</p>
      </div>
    );
  }

  return (
    <div className="bg-dm-bg-primary rounded-xl border border-dm-border-secondary shadow-sm overflow-hidden">
      {/* ── Mobile Card View ── */}
      <div className="block lg:hidden divide-y divide-gray-100">
        {paginatedTrips.map((trip) => {
          const canGenerateManifest = ['SCHEDULED', 'BOARDING'].includes(trip.status);
          return (
            <div key={trip.trip_id} className="p-4 hover:bg-dm-bg-hover transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-dm-text-primary truncate">
                    {trip.trip_name || `Viaje #${trip.trip_id}`}
                  </h3>
                  <p className="text-xs text-dm-text-muted mt-0.5">{trip.vessel_name}</p>
                </div>
                <StatusBadge status={trip.status} />
              </div>

              <div className="space-y-2 text-sm mb-3">
                <div>
                  <span className="text-xs text-dm-text-muted uppercase tracking-wide">Ruta</span>
                  <p className="font-medium text-dm-text-primary mt-0.5">
                    {trip.origin_port_name || 'N/A'} → {trip.destination_port_name || 'N/A'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-dm-text-muted uppercase tracking-wide">Fecha</span>
                    <p className="font-medium text-dm-text-primary mt-0.5">
                      {format(new Date(trip.departure_datetime), 'dd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-dm-text-muted uppercase tracking-wide">Hora</span>
                    <p className="font-medium text-dm-text-primary font-mono mt-0.5">
                      {format(new Date(trip.departure_datetime), 'HH:mm')}
                    </p>
                  </div>
                </div>
                {trip.available_seats !== null && trip.total_seats !== null && (
                  <div>
                    <span className="text-xs text-dm-text-muted uppercase tracking-wide">Disponibilidad</span>
                    <div className="mt-1.5">
                      <AvailabilityBar available={trip.available_seats} total={trip.total_seats} />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-dm-border-secondary">
                <Button
                  variant={canGenerateManifest ? 'outline' : 'secondary'}
                  onClick={canGenerateManifest ? () => onGenerateManifest?.(trip) : undefined}
                  disabled={!canGenerateManifest}
                  className="flex items-center justify-center text-sm w-full"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  {canGenerateManifest ? 'Generar Manifiesto' : 'Manifiesto N/A'}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onEdit(trip)}
                    className="flex items-center justify-center text-sm flex-1"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onCancel(trip)}
                    className="flex items-center justify-center text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:text-red-300 flex-1"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" /> Cancelar
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Desktop Table View ── */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-dm-border-secondary bg-dm-bg-secondary">
              {['Viaje', 'Ruta', 'Salida', 'Disponibilidad', 'Estado', 'Manifiesto', 'Acciones'].map(
                (header) => (
                  <th
                    key={header}
                    className="px-5 py-3 text-left text-xs font-semibold text-dm-text-muted uppercase tracking-wider"
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedTrips.map((trip) => {
              const canGenerateManifest = ['SCHEDULED', 'BOARDING'].includes(trip.status);
              return (
                <tr key={trip.trip_id} className="hover:bg-dm-bg-hover/70 transition-colors">
                  {/* Viaje */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <p className="font-semibold text-sm text-dm-text-primary">
                      {trip.trip_name || `Viaje #${trip.trip_id}`}
                    </p>
                    <p className="text-xs text-dm-text-muted mt-0.5">{trip.vessel_name}</p>
                  </td>

                  {/* Ruta */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-sm text-dm-text-secondary">
                      {trip.origin_port_name || 'N/A'}
                    </span>
                    <span className="mx-1.5 text-dm-text-muted">→</span>
                    <span className="text-sm text-dm-text-secondary">
                      {trip.destination_port_name || 'N/A'}
                    </span>
                  </td>

                  {/* Salida */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-dm-text-primary">
                      {format(new Date(trip.departure_datetime), 'dd MMM yyyy', { locale: es })}
                    </p>
                    <p className="text-xs text-dm-text-muted font-mono mt-0.5">
                      {format(new Date(trip.departure_datetime), 'HH:mm')}
                    </p>
                  </td>

                  {/* Disponibilidad */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <AvailabilityBar
                      available={trip.available_seats}
                      total={trip.total_seats}
                    />
                  </td>

                  {/* Estado */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <StatusBadge status={trip.status} />
                  </td>

                  {/* Manifiesto */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <Button
                      variant={canGenerateManifest ? 'outline' : 'secondary'}
                      size="sm"
                      onClick={canGenerateManifest ? () => onGenerateManifest?.(trip) : undefined}
                      disabled={!canGenerateManifest}
                      title={
                        canGenerateManifest
                          ? 'Generar manifiesto'
                          : 'No disponible para este estado'
                      }
                      className="flex items-center gap-1.5"
                    >
                      <DocumentTextIcon className="h-3.5 w-3.5" />
                      {canGenerateManifest ? 'Generar' : 'N/A'}
                    </Button>
                  </td>

                  {/* Acciones */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(trip)}
                        className="p-1.5 rounded-md text-dm-text-muted hover:text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:bg-indigo-950/30 transition-colors"
                        title="Editar viaje"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onCancel(trip)}
                        className="p-1.5 rounded-md text-dm-text-muted hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-950/30 transition-colors"
                        title="Cancelar viaje"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={trips.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};
