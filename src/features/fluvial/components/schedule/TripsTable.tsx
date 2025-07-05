// src/features/fluvial/components/schedule/TripsTable.tsx
import React, { useMemo } from 'react';
import { DataTable, Column } from '../../../../components/common/DataTable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { UnifiedTripViewItem } from '../../hooks/useTripsView';

interface TripsTableProps {
  trips: UnifiedTripViewItem[];
  onEdit: (trip: UnifiedTripViewItem) => void;
  onCancel: (trip: UnifiedTripViewItem) => void;
}

// Componente para el estado visual
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'SCHEDULED':
        return { label: 'Programado', color: 'text-blue-700 bg-blue-50' };
      case 'BOARDING':
        return { label: 'Embarcando', color: 'text-yellow-700 bg-yellow-50' };
      case 'DEPARTED':
        return { label: 'En Ruta', color: 'text-purple-700 bg-purple-50' };
      case 'ARRIVED':
        return { label: 'Arribado', color: 'text-green-700 bg-green-50' };
      case 'COMPLETED':
        return { label: 'Completado', color: 'text-gray-700 bg-gray-50' };
      case 'CANCELLED':
        return { label: 'Cancelado', color: 'text-red-700 bg-red-50' };
      default:
        return { label: 'Desconocido', color: 'text-gray-700 bg-gray-50' };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
};

export const TripsTable: React.FC<TripsTableProps> = ({
  trips,
  onEdit,
  onCancel,
}) => {
  const columns: Column<UnifiedTripViewItem>[] = useMemo(
    () => [
      {
        key: 'trip',
        header: 'Viaje',
        accessor: (trip) => (
          <div>
            <p className="font-semibold text-gray-800">
              {trip.trip_name || `Viaje #${trip.trip_id}`}
            </p>
            <p className="text-sm text-gray-500">{trip.vessel_name}</p>
          </div>
        ),
      },
      {
        key: 'route',
        header: 'Origen → Destino',
        accessor: (trip) =>
          `${trip.origin_port_name || 'N/A'} → ${trip.destination_port_name || 'N/A'}`,
      },
      {
        key: 'departure',
        header: 'Salida',
        accessor: (trip) => (
          <div>
            <p className="font-medium">
              {format(new Date(trip.departure_datetime), 'dd MMM yyyy', {
                locale: es,
              })}
            </p>
            <p className="text-sm text-gray-500">
              {format(new Date(trip.departure_datetime), 'HH:mm')}
            </p>
          </div>
        ),
      },
      {
        key: 'availability',
        header: 'Disponibilidad',
        accessor: (trip) => {
          if (trip.available_seats === null || trip.total_seats === null) {
            return <span className="text-gray-500">No especificada</span>;
          }
          return (
            <span className="font-medium">{`${trip.available_seats} / ${trip.total_seats}`}</span>
          );
        },
      },
      {
        key: 'status',
        header: 'Estado',
        accessor: (trip) => <StatusBadge status={trip.status} />,
      },
      {
        key: 'sales',
        header: 'Ventas',
        accessor: () => (
          <Button variant="outline" size="sm">
            <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
            Consultar
          </Button>
        ),
      },
      {
        key: 'actions',
        header: 'Acciones',
        accessor: (trip) => (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onEdit(trip)}
              className="text-gray-500 hover:text-blue-600"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onCancel(trip)}
              className="text-gray-500 hover:text-red-600"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ),
      },
    ],
    [onEdit, onCancel]
  );

  return (
    <DataTable
      columns={columns}
      data={trips}
      keyExtractor={(trip) => trip.trip_id}
      emptyMessage="No se encontraron viajes para los filtros seleccionados."
    />
  );
};
