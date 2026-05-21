// src/features/fluvial/pages/ReservationsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarCheck, Check, Ban, MapPin, Clock, User, CreditCard } from 'lucide-react';
import { DataTable, Column } from '../../../components/common/DataTable';
import { useSearchReservations, useUpdateReservation } from '../hooks/useReservations';
import { SeatReservation, BranchOffice } from '../../../types';
import { Input } from '../../../components/common/Input';
import { useDebounce } from '../../../hooks/useDebounce';
import { BranchSelector } from '../components/sales-point/BranchSelector';

// ------------------------------------------------------------------
// Helpers visuales
// ------------------------------------------------------------------
const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  RESERVED: {
    label: 'Reservado',
    classes: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-100',
  },
  CONFIRMED: {
    label: 'Confirmado',
    classes: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100',
  },
  CANCELLED: {
    label: 'Cancelado',
    classes: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-100',
  },
  EXPIRED: {
    label: 'Expirado',
    classes: 'bg-dm-bg-secondary text-dm-text-secondary border border-dm-border-primary',
  },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.EXPIRED;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${config.classes}`}>
      {config.label}
    </span>
  );
};

// ------------------------------------------------------------------
// Filtros
// ------------------------------------------------------------------
const ReservationFilters = ({
  onFilterChange,
  selectedBranch,
}: {
  onFilterChange: (filters: any) => void;
  selectedBranch: BranchOffice | null;
}) => {
  const [status, setStatus] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const debouncedDocNumber = useDebounce(docNumber, 500);

  useEffect(() => {
    const cleanDocNumber = debouncedDocNumber?.trim() || '';
    onFilterChange({
      status: status ? [status] : undefined,
      customer_doc_number: cleanDocNumber.length >= 3 ? cleanDocNumber : undefined,
    });
  }, [status, debouncedDocNumber, onFilterChange]);

  return (
    <div className="rounded-xl border border-dm-border-primary/80 bg-dm-bg-primary p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Sucursal */}
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-dm-text-muted">
            Sucursal Activa
          </label>
          <div className="flex items-center gap-2 rounded-lg bg-dm-bg-secondary py-2.5 px-3.5">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-semibold text-dm-text-primary">
              {selectedBranch?.name || 'Ninguna'}
            </span>
          </div>
        </div>

        {/* Estado */}
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-dm-text-muted">
            Filtrar por Estado
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full appearance-none rounded-lg border border-dm-border-primary bg-dm-bg-secondary py-2.5 px-3.5 text-sm text-dm-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Todos</option>
            <option value="RESERVED">Reservado</option>
            <option value="CONFIRMED">Confirmado</option>
            <option value="CANCELLED">Cancelado</option>
            <option value="EXPIRED">Expirado</option>
          </select>
        </div>

        {/* Documento */}
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-dm-text-muted">
            Buscar por DNI / RUC
          </label>
          <input
            type="text"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            placeholder="Ingrese documento..."
            className="w-full rounded-lg border border-dm-border-primary bg-dm-bg-secondary py-2.5 px-3.5 text-sm text-dm-text-primary placeholder:text-dm-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Página principal
// ------------------------------------------------------------------
export const ReservationsPage: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState<BranchOffice | null>(null);
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();

  const handleBranchSelect = (branch: BranchOffice) => {
    setSelectedBranch(branch);
    localStorage.setItem('selectedSalesBranch', JSON.stringify(branch));
  };

  useEffect(() => {
    const savedBranchJson = localStorage.getItem('selectedSalesBranch');
    if (savedBranchJson) {
      setSelectedBranch(JSON.parse(savedBranchJson));
    }
  }, []);

  const { data: reservations = [], isLoading, error } = useSearchReservations({
    branch_office_id: selectedBranch?.id,
    ...filters,
  });

  const { mutate: updateReservation } = useUpdateReservation();

  const handleCancelReservation = (reservation: SeatReservation) => {
    if (
      window.confirm(
        `¿Está seguro de que desea CANCELAR la reserva del asiento ${reservation.seat_number} para ${reservation.customer_name}?`
      )
    ) {
      updateReservation({
        reservationId: reservation.id,
        tripId: reservation.trip_id,
        data: { status: 'CANCELLED' },
      });
    }
  };

  const handleConfirmReservation = (reservation: SeatReservation) => {
    navigate(`/fluvial/operations/sales-point`, {
      state: {
        tripId: reservation.trip_id,
        reservationToConfirm: reservation,
      },
    });
  };

  const columns: Column<SeatReservation>[] = [
    {
      key: 'details',
      header: 'Viaje / Asiento',
      accessor: (item) => (
        <div className="space-y-0.5">
          <div className="text-sm font-bold text-primary">{item.trip_name || `Viaje #${item.trip_id}`}</div>
          <div className="text-[13px] font-medium text-dm-text-primary">
            Asiento {item.seat_number}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-dm-text-muted">
            <MapPin className="h-3 w-3 shrink-0" />
            {item.boarding_stop?.port?.name || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Cliente',
      accessor: (item) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-sm font-medium text-dm-text-primary">
            <User className="h-3.5 w-3.5 shrink-0 text-dm-text-muted" />
            {item.customer_name}
          </div>
          <div className="text-[11px] text-dm-text-muted">
            {item.customer_doc_type} {item.customer_doc_number}
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Adelanto',
      accessor: (item) => (
        <div className="flex items-center gap-1.5 text-sm font-semibold text-dm-text-primary">
          <CreditCard className="h-3.5 w-3.5 shrink-0 text-dm-text-muted" />
          {new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: item.currency_code,
          }).format(item.advance_amount)}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      accessor: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'expires_at',
      header: 'Expira',
      accessor: (item) =>
        item.expires_at ? (
          <div className="flex items-center gap-1.5 text-[13px] text-dm-text-secondary">
            <Clock className="h-3.5 w-3.5 shrink-0 text-dm-text-muted" />
            {format(new Date(item.expires_at), 'dd MMM yyyy, hh:mm a', { locale: es })}
          </div>
        ) : (
          <span className="text-[13px] text-dm-text-muted">N/A</span>
        ),
    },
  ];

  if (!selectedBranch) {
    return (
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#dbe1ff]">
            <CalendarCheck className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-dm-text-primary">Gestionar Reservas</h1>
        </div>
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-dm-text-primary mb-2">Seleccione una sucursal</h2>
          <p className="text-dm-text-secondary">Elija la sucursal desde la cual gestionará las reservas.</p>
        </div>
        <BranchSelector onBranchSelect={handleBranchSelect} />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#dbe1ff]">
          <CalendarCheck className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-lg font-bold tracking-tight text-dm-text-primary">Gestionar Reservas</h1>
      </div>

      <ReservationFilters onFilterChange={setFilters} selectedBranch={selectedBranch} />

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <DataTable
          columns={columns}
          data={reservations}
          isLoading={isLoading}
          error={error}
          keyExtractor={(item) => item.id}
          emptyMessage="No se encontraron reservas con los filtros actuales."
          showActions={true}
          customActions={(item) => (
            <div className="flex items-center justify-end gap-2">
              {item.status === 'RESERVED' && (
                <>
                  <button
                    onClick={() => handleConfirmReservation(item)}
                    title="Confirmar venta"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-dm-text-muted transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:text-emerald-400"
                  >
                    <Check className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => handleCancelReservation(item)}
                    title="Cancelar reserva"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-dm-text-muted transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:text-red-400"
                  >
                    <Ban className="h-4 w-4" strokeWidth={2} />
                  </button>
                </>
              )}
            </div>
          )}
        />
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-3">
        {isLoading && (
          <div className="rounded-xl border border-dm-border-primary bg-dm-bg-primary p-8 text-center text-sm text-dm-text-muted">
            Cargando reservas…
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 p-8 text-center text-sm text-red-600 dark:text-red-400">
            Error al cargar reservas
          </div>
        )}
        {!isLoading && !error && reservations.length === 0 && (
          <div className="rounded-xl border border-dm-border-primary bg-dm-bg-primary p-8 text-center text-sm text-dm-text-muted">
            No se encontraron reservas con los filtros actuales.
          </div>
        )}
        {!isLoading &&
          !error &&
          reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="rounded-xl border border-dm-border-primary/80 bg-dm-bg-primary p-4 shadow-sm"
            >
              {/* Header: viaje + estado */}
              <div className="mb-3 flex items-start justify-between border-b border-dm-border-secondary pb-3">
                <div>
                  <div className="text-sm font-bold text-primary">
                    {reservation.trip_name || `Viaje #${reservation.trip_id}`}
                  </div>
                  <div className="text-[13px] font-medium text-dm-text-primary">
                    Asiento {reservation.seat_number}
                  </div>
                </div>
                <StatusBadge status={reservation.status} />
              </div>

              {/* Info */}
              <div className="mb-3 space-y-2">
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-wider text-dm-text-muted">
                    Cliente
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-dm-text-primary">
                    <User className="h-3.5 w-3.5 shrink-0 text-dm-text-muted" />
                    {reservation.customer_name}
                  </div>
                  <div className="text-[11px] text-dm-text-muted">
                    {reservation.customer_doc_type} {reservation.customer_doc_number}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-dm-text-muted">
                      Embarque
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-dm-text-primary">
                      <MapPin className="h-3 w-3 shrink-0 text-dm-text-muted" />
                      {reservation.boarding_stop?.port?.name || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-dm-text-muted">
                      Adelanto
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-dm-text-primary">
                      <CreditCard className="h-3 w-3 shrink-0 text-dm-text-muted" />
                      {new Intl.NumberFormat('es-PE', {
                        style: 'currency',
                        currency: reservation.currency_code,
                      }).format(reservation.advance_amount)}
                    </div>
                  </div>
                </div>

                {reservation.expires_at && (
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-dm-text-muted">
                      Expira
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-dm-text-secondary">
                      <Clock className="h-3 w-3 shrink-0 text-dm-text-muted" />
                      {format(new Date(reservation.expires_at), 'dd MMM yyyy, hh:mm a', {
                        locale: es,
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Acciones */}
              {reservation.status === 'RESERVED' && (
                <div className="flex gap-2 pt-3 border-t border-dm-border-secondary">
                  <button
                    onClick={() => handleConfirmReservation(reservation)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-100"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Confirmar
                  </button>
                  <button
                    onClick={() => handleCancelReservation(reservation)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 py-2 text-xs font-medium text-red-700 dark:text-red-300 transition-colors hover:bg-red-100 dark:bg-red-900/40"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};
