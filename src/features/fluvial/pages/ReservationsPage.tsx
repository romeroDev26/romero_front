// src/features/fluvial/pages/ReservationsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DataTable, Column } from '../../../components/common/DataTable';
import { useSearchReservations, useUpdateReservation } from '../hooks/useReservations';
import { SeatReservation, BranchOffice } from '../../../types';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { useDebounce } from '../../../hooks/useDebounce';

// Componente para los filtros
const ReservationFilters = ({ onFilterChange, selectedBranch }: { onFilterChange: (filters: any) => void, selectedBranch: BranchOffice | null }) => {
    const [status, setStatus] = useState('');
    const [docNumber, setDocNumber] = useState('');
    const debouncedDocNumber = useDebounce(docNumber, 500);

    useEffect(() => {
        onFilterChange({
            status: status ? [status] : undefined,
            customer_doc_number: debouncedDocNumber || undefined,
        });
    }, [status, debouncedDocNumber, onFilterChange]);

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Sucursal Activa</label>
                <p className="font-semibold text-blue-600 mt-1">{selectedBranch?.name || 'Ninguna'}</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Filtrar por Estado</label>
                <select onChange={(e) => setStatus(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md mt-1">
                    <option value="">Todos</option>
                    <option value="RESERVED">Reservado</option>
                    <option value="CONFIRMED">Confirmado</option>
                    <option value="CANCELLED">Cancelado</option>
                    <option value="EXPIRED">Expirado</option>
                </select>
            </div>
            <div>
                <Input
                    label="Buscar por DNI/RUC de Cliente"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="Ingrese documento..."
                />
            </div>
        </div>
    );
};

export const ReservationsPage: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState<BranchOffice | null>(null);
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const savedBranchJson = localStorage.getItem('selectedSalesBranch');
    if (savedBranchJson) {
      setSelectedBranch(JSON.parse(savedBranchJson));
    }
  }, []);

  const { data: reservations = [], isLoading, error } = useSearchReservations({
    branch_office_id: selectedBranch?.id,
    ...filters
  });

  const { mutate: updateReservation } = useUpdateReservation();

  const handleCancelReservation = (reservation: SeatReservation) => {
    if (window.confirm(`¿Está seguro de que desea CANCELAR la reserva del asiento ${reservation.seat_number} para ${reservation.customer_name}?`)) {
      updateReservation({
        reservationId: reservation.id,
        tripId: reservation.trip_id,
        data: { status: 'CANCELLED' }
      });
    }
  };

  const handleConfirmReservation = (reservation: SeatReservation) => {
    navigate(`/fluvial/operations/sales-point`, {
        state: {
            tripId: reservation.trip_id,
            reservationToConfirm: reservation
        }
    });
  };

  const columns: Column<SeatReservation>[] = [
    {
      key: 'details',
      header: 'Viaje / Asiento',
      accessor: (item) => (
        <div>
          <div className="text-sm font-bold text-gray-900">Asiento: {item.seat_number}</div>
          <div className="text-xs text-gray-500">Viaje ID: {item.trip_id}</div>
          <div className="text-xs text-gray-500">Embarque: {item.boarding_stop?.port?.name || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'customer',
      header: 'Cliente',
      accessor: (item) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{item.customer_name}</div>
          <div className="text-xs text-gray-500">{item.customer_doc_type}: {item.customer_doc_number}</div>
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Adelanto',
      accessor: (item) => (
        <span className="text-sm text-green-700">
          {new Intl.NumberFormat('es-PE', { style: 'currency', currency: item.currency_code }).format(item.advance_amount)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Estado',
      accessor: (item) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          item.status === 'RESERVED' ? 'bg-yellow-100 text-yellow-800' :
          item.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {item.status}
        </span>
      )
    },
    {
      key: 'expires_at',
      header: 'Expira',
      accessor: (item) => item.expires_at
        ? format(new Date(item.expires_at), 'dd MMM yyyy, hh:mm a', { locale: es })
        : 'N/A'
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Gestionar Reservas</h1>

      <ReservationFilters onFilterChange={setFilters} selectedBranch={selectedBranch} />

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
                <Button variant="outline" size="sm" onClick={() => handleConfirmReservation(item)} title="Confirmar Venta">
                  <CheckCircleIcon className="h-5 w-5 text-green-600"/>
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleCancelReservation(item)} title="Cancelar Reserva">
                  <XCircleIcon className="h-5 w-5 text-red-600"/>
                </Button>
              </>
            )}
          </div>
        )}
      />
    </div>
  );
};
