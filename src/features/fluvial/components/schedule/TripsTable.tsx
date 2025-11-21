// src/features/fluvial/components/schedule/TripsTable.tsx
import React, { useMemo } from 'react';
import { DataTable, Column } from '../../../../components/common/DataTable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { UnifiedTripViewItem } from '../../hooks/useTripsView';

interface TripsTableProps {
  trips: UnifiedTripViewItem[];
  onEdit: (trip: UnifiedTripViewItem) => void;
  onCancel: (trip: UnifiedTripViewItem) => void;
  onGenerateManifest?: (trip: UnifiedTripViewItem) => void;
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
  onGenerateManifest,
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
        key: 'manifests',
        header: 'Manifiestos',
        accessor: (trip) => {
          // Solo mostrar el bot\u00f3n si el viaje est\u00e1 programado o en embarque
          const canGenerateManifest = ['SCHEDULED', 'BOARDING'].includes(trip.status);
          
          return (
            <Button 
              variant={canGenerateManifest ? "outline" : "secondary"}
              size="sm"
              onClick={canGenerateManifest ? () => onGenerateManifest?.(trip) : undefined}
              disabled={!canGenerateManifest}
              title={canGenerateManifest ? "Generar manifiesto para este viaje" : "No se puede generar manifiesto para este estado"}
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              {canGenerateManifest ? 'Generar' : 'N/A'}
            </Button>
          );
        },
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
    [onEdit, onCancel, onGenerateManifest]
  );

  if (!trips.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No se encontraron viajes para los filtros seleccionados.
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4 mt-4">
        {trips.map((trip) => {
          const canGenerateManifest = ['SCHEDULED', 'BOARDING'].includes(trip.status);
          
          return (
            <div key={trip.trip_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">
                    {trip.trip_name || `Viaje #${trip.trip_id}`}
                  </h3>
                  <p className="text-sm text-gray-500">{trip.vessel_name}</p>
                </div>
                <StatusBadge status={trip.status} />
              </div>

              <div className="space-y-2 text-sm mb-3">
                <div>
                  <span className="block text-xs text-gray-500">Ruta</span>
                  <span className="font-medium text-gray-900">
                    {trip.origin_port_name || 'N/A'} → {trip.destination_port_name || 'N/A'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-xs text-gray-500">Fecha Salida</span>
                    <span className="font-medium text-gray-900">
                      {format(new Date(trip.departure_datetime), 'dd MMM yyyy', { locale: es })}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Hora Salida</span>
                    <span className="font-medium text-gray-900 font-mono">
                      {format(new Date(trip.departure_datetime), 'HH:mm')}
                    </span>
                  </div>
                </div>
                {trip.available_seats !== null && trip.total_seats !== null && (
                  <div>
                    <span className="block text-xs text-gray-500">Disponibilidad</span>
                    <span className="font-medium text-gray-900">
                      {trip.available_seats} / {trip.total_seats} asientos
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                <Button
                  variant={canGenerateManifest ? "outline" : "secondary"}
                  onClick={canGenerateManifest ? () => onGenerateManifest?.(trip) : undefined}
                  disabled={!canGenerateManifest}
                  className="flex items-center justify-center text-sm w-full"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  {canGenerateManifest ? 'Generar Manifiesto' : 'No disponible'}
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
                    className="flex items-center justify-center text-sm text-red-600 hover:text-red-800 flex-1"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" /> Cancelar
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <DataTable
          columns={columns}
          data={trips}
          keyExtractor={(trip) => trip.trip_id}
          emptyMessage="No se encontraron viajes para los filtros seleccionados."
        />
      </div>
    </>
  );
};
