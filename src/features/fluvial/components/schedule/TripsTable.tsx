// src/features/fluvial/components/schedule/TripsTable.tsx
import React from 'react';
import { DataTable, Column } from '../../../../components/common/DataTable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ClockIcon,
  TicketIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { UnifiedTripViewItem } from '../../hooks/useTripsView';

interface Props {
  trips: UnifiedTripViewItem[];
  onEdit: (trip: UnifiedTripViewItem) => void;
  onCancel: (trip: UnifiedTripViewItem) => void;
}

const STATUS_CONFIG = {
  DISPONIBLE: {
    color: 'text-green-700 bg-green-50',
    icon: TicketIcon,
  },
  URGENTE: {
    color: 'text-orange-700 bg-orange-50',
    icon: ExclamationTriangleIcon,
  },
  AGOTADO: {
    color: 'text-red-700 bg-red-50',
    icon: XCircleIcon,
  },
  CERRADO: {
    color: 'text-gray-700 bg-gray-50',
    icon: XCircleIcon,
  },
};

const TRIP_STATUS_CONFIG = {
  SCHEDULED: { label: 'Programado', color: 'text-blue-700 bg-blue-50' },
  BOARDING: { label: 'Embarcando', color: 'text-yellow-700 bg-yellow-50' },
  DEPARTED: { label: 'En Ruta', color: 'text-purple-700 bg-purple-50' },
  ARRIVED: { label: 'Arribado', color: 'text-green-700 bg-green-50' },
  COMPLETED: { label: 'Completado', color: 'text-gray-700 bg-gray-50' },
  CANCELLED: { label: 'Cancelado', color: 'text-red-700 bg-red-50' },
};

export const TripsTable: React.FC<Props> = ({ trips, onEdit, onCancel }) => {
  const columns: Column<UnifiedTripViewItem>[] = [
    {
      key: 'trip_info',
      header: 'Viaje',
      accessor: (item) => (
        <div>
          <p className="font-medium text-gray-900">
            {item.trip_name || `Viaje #${item.trip_id}`}
          </p>
          <p className="text-sm text-gray-600">{item.route_name}</p>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Origen → Destino',
      accessor: (item) => (
        <div>
          <p className="text-sm">
            {item.origin_city || 'N/A'} → {item.destination_city || 'N/A'}
          </p>
        </div>
      ),
    },
    {
      key: 'departure',
      header: 'Salida',
      accessor: (item) => (
        <div>
          <p className="text-sm font-medium">
            {format(new Date(item.departure_datetime), 'dd MMM yyyy', { locale: es })}
          </p>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <ClockIcon className="h-4 w-4" />
            {format(new Date(item.departure_datetime), 'HH:mm')}
          </p>
        </div>
      ),
    },
    {
      key: 'arrival',
      header: 'Llegada Estimada',
      accessor: (item) => (
        <div>
          {item.estimated_arrival_datetime ? (
            <>
              <p className="text-sm font-medium">
                {format(new Date(item.estimated_arrival_datetime), 'dd MMM yyyy', { locale: es })}
              </p>
              <p className="text-sm text-gray-600">
                {format(new Date(item.estimated_arrival_datetime), 'HH:mm')}
              </p>
            </>
          ) : (
            <span className="text-sm text-gray-500">No especificada</span>
          )}
        </div>
      ),
    },
    {
      key: 'vessel',
      header: 'Embarcación',
      accessor: (item) => <span className="text-sm">{item.vessel_name}</span>,
    },
    {
      key: 'availability',
      header: 'Disponibilidad',
      accessor: (item) => {
        const totalSeats = item.total_available_seats || 0;

        return (
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {totalSeats} asientos disponibles
            </p>
            {item.sales_status && (
              <p className="text-xs text-gray-600">
                Estado: {item.sales_status}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Estado',
      accessor: (item) => {
        const config = TRIP_STATUS_CONFIG[item.status as keyof typeof TRIP_STATUS_CONFIG];
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config?.color || ''}`}>
            {config?.label || item.status}
          </span>
        );
      },
    },
    {
      key: 'sales_status',
      header: 'Ventas',
      accessor: (item) => {
        const config = STATUS_CONFIG[item.sales_status as keyof typeof STATUS_CONFIG];
        const Icon = config?.icon || TicketIcon;

        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config?.color || ''}`}>
            <Icon className="h-3 w-3" />
            {item.sales_status}
          </span>
        );
      },
    },
  ];

  return (
    <DataTable
      data={trips}
      columns={columns}
      keyExtractor={(item) => item.trip_id}
      onEdit={onEdit}
      onDelete={onCancel}
      emptyMessage="No hay viajes programados para los criterios seleccionados"
      customActions={(item) => (
        <>
          {item.status === 'SCHEDULED' && (
            <button
              onClick={() => onCancel(item)}
              className="text-red-600 hover:text-red-900 text-sm"
              title="Cancelar viaje"
            >
              Cancelar
            </button>
          )}
        </>
      )}
    />
  );
};
