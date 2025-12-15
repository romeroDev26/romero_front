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
        // Limpiar el número de documento (quitar espacios) antes de enviar
        const cleanDocNumber = debouncedDocNumber?.trim() || '';
        onFilterChange({
            status: status ? [status] : undefined,
            // Enviar el documento completo sin truncar, mínimo 3 caracteres para buscar
            customer_doc_number: cleanDocNumber.length >= 3 ? cleanDocNumber : undefined,
        });
    }, [status, debouncedDocNumber, onFilterChange]);

    return (
        <div className="bg-white p-3 lg:p-4 rounded-lg shadow-sm border mb-4 lg:mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700">Sucursal Activa</label>
                    <p className="font-semibold text-sm lg:text-base text-blue-600 mt-1">{selectedBranch?.name || 'Ninguna'}</p>
                </div>
                <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700">Filtrar por Estado</label>
                    <select onChange={(e) => setStatus(e.target.value)} className="w-full p-2 text-sm border border-gray-300 rounded-md mt-1">
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
          <div className="text-sm font-bold text-blue-700">{item.trip_name || `Viaje #${item.trip_id}`}</div>
          <div className="text-sm font-semibold text-gray-900">Asiento: {item.seat_number}</div>
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
    <div className="p-4 lg:p-6">
      <h1 className="text-xl lg:text-2xl font-bold text-gray-800 mb-3 lg:mb-4">Gestionar Reservas</h1>

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

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-3">
        {isLoading && (
          <div className="text-center py-8 text-gray-500">Cargando reservas...</div>
        )}
        {error && (
          <div className="text-center py-8 text-red-500">Error al cargar reservas</div>
        )}
        {!isLoading && !error && reservations.length === 0 && (
          <div className="text-center py-8 text-gray-500">No se encontraron reservas con los filtros actuales.</div>
        )}
        {!isLoading && !error && reservations.map((reservation) => (
          <div key={reservation.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            {/* Header con Viaje, Asiento y Estado */}
            <div className="flex items-start justify-between mb-3 pb-3 border-b">
              <div>
                <div className="text-sm font-bold text-blue-700">{reservation.trip_name || `Viaje #${reservation.trip_id}`}</div>
                <div className="text-sm font-semibold text-gray-900">Asiento: {reservation.seat_number}</div>
              </div>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shrink-0 ${
                reservation.status === 'RESERVED' ? 'bg-yellow-100 text-yellow-800' :
                reservation.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {reservation.status}
              </span>
            </div>

            {/* Información del Cliente */}
            <div className="space-y-2 mb-3">
              <div>
                <div className="text-xs text-gray-500">Cliente</div>
                <div className="text-sm font-medium text-gray-900">{reservation.customer_name}</div>
                <div className="text-xs text-gray-500">{reservation.customer_doc_type}: {reservation.customer_doc_number}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-gray-500">Embarque</div>
                  <div className="text-xs font-medium text-gray-900">{reservation.boarding_stop?.port?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Adelanto</div>
                  <div className="text-sm font-semibold text-green-700">
                    {new Intl.NumberFormat('es-PE', { style: 'currency', currency: reservation.currency_code }).format(reservation.advance_amount)}
                  </div>
                </div>
              </div>

              {reservation.expires_at && (
                <div>
                  <div className="text-xs text-gray-500">Expira</div>
                  <div className="text-xs font-medium text-gray-900">
                    {format(new Date(reservation.expires_at), 'dd MMM yyyy, hh:mm a', { locale: es })}
                  </div>
                </div>
              )}
            </div>

            {/* Acciones */}
            {reservation.status === 'RESERVED' && (
              <div className="flex gap-2 pt-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleConfirmReservation(reservation)} 
                  className="flex-1 justify-center"
                >
                  <CheckCircleIcon className="h-4 w-4 text-green-600 mr-1"/>
                  <span className="text-xs">Confirmar</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleCancelReservation(reservation)}
                  className="flex-1 justify-center"
                >
                  <XCircleIcon className="h-4 w-4 text-red-600 mr-1"/>
                  <span className="text-xs">Cancelar</span>
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
