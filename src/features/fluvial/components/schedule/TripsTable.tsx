// src/features/fluvial/components/schedule/TripsTable.tsx
import React from 'react';
import { DataTable, Column } from '../../../../components/common/DataTable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ClockIcon,
  TicketIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
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
  CONSULTAR: {
    color: 'text-gray-700 bg-gray-50',
    icon: TicketIcon,
  }
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
          <p className="text-sm font-medium capitalize"> {/* Añadido capitalize */}
            {format(new Date(item.departure_datetime), 'dd MMM yyyy', { locale: es })}
          </p>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <ClockIcon className="h-4 w-4" />
            {format(new Date(item.departure_datetime), 'HH:mm')}
          </p>
        </div>
      ),
    },
    // Eliminamos 'Llegada Estimada' para simplificar la vista como en la imagen original
    // Puedes volver a añadirla si la necesitas
    {
      key: 'vessel',
      header: 'Embarcación',
      accessor: (item) => <span className="text-sm">{item.vessel_name}</span>,
    },
    {
      key: 'availability',
      header: 'Disponibilidad',
      // ===================================================================
      // AQUÍ ESTÁ EL CAMBIO PRINCIPAL
      // ===================================================================
      accessor: (item) => {
        // Verifica si total_available_seats es un número (puede ser null o undefined)
        const hasAvailableSeatsInfo = typeof item.total_available_seats === 'number';
        const hasCapacityInfo = typeof item.total_capacity === 'number' && item.total_capacity > 0;

        return (
          <div className="space-y-1 text-sm">
            {hasAvailableSeatsInfo ? (
              // Si tenemos el número de asientos disponibles (endpoint /upcoming)
              <div>
                <p className="font-bold text-gray-800">
                  {item.total_available_seats} asientos disponibles
                </p>
                {hasCapacityInfo && (
                  <p className="text-xs text-gray-500">
                    de {item.total_capacity} en total
                  </p>
                )}
              </div>
            ) : hasCapacityInfo ? (
              // Si no tenemos disponibilidad pero sí capacidad (ej. vista de historial)
              <div>
                <p className="text-gray-500">
                    Capacidad: {item.total_capacity}
                </p>
                <p className="text-xs text-gray-500">
                    Estado: CONSULTAR
                </p>
              </div>
            ) : (
              // Si no tenemos ninguna información
              <p className="text-gray-500">No especificada</p>
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
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config?.color || 'bg-gray-100 text-gray-800'}`}>
            {config?.label || item.status}
          </span>
        );
      },
    },
    {
      key: 'sales_status',
      header: 'Ventas',
      accessor: (item) => {
        // Aseguramos un valor por defecto si sales_status es null
        const salesStatus = item.sales_status || 'CONSULTAR';
        const config = STATUS_CONFIG[salesStatus as keyof typeof STATUS_CONFIG];
        const Icon = config?.icon || TicketIcon;

        // Se muestra 'Consultar' en vez del estado de ventas
        // para coincidir con la imagen.
        return (
          <button
            onClick={() => console.log('Consultar ventas para el viaje:', item.trip_id)}
            className="text-primary hover:text-primary-dark font-medium text-sm flex items-center"
          >
            <Icon className="h-4 w-4 mr-1"/>
            CONSULTAR
          </button>
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
      onDelete={onCancel} // onDelete del DataTable ahora llama a onCancel de tus props
      emptyMessage="No hay viajes programados que coincidan con los criterios de búsqueda"
    />
  );
};