// src/features/quotations/components/QuotationTripStep.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { Spinner } from '../../../components/common/Spinner';
import { BranchOffice } from '../../../types';
import { AvailableTripByPort } from '../../../services/trips.service';
import { useAvailableTripsCalendar } from '../../fluvial/hooks/useAvailableTripsCalendar';
import { TripCalendar } from '../../fluvial/components/sales-point/TripCalendar';

interface QuotationTripStepProps {
  branch: BranchOffice;
  onTripSelect: (trip: AvailableTripByPort) => void;
  onChangeBranch: () => void;
}

const TripCard: React.FC<{ trip: AvailableTripByPort; onSelect: () => void }> = ({
  trip,
  onSelect,
}) => {
  const departureTime = trip.departure_datetime || trip.estimated_departure_time;
  const formattedTime = departureTime
    ? format(parseISO(departureTime), 'hh:mm a')
    : 'Hora no definida';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-primary/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="bg-primary/10 p-3 rounded-lg shrink-0">
          <svg
            className="h-5 w-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{trip.trip_name}</p>
          <p className="text-sm text-slate-600 truncate">{trip.vessel_name}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span>Salida: {formattedTime}</span>
            {trip.route_name && <span>Ruta: {trip.route_name}</span>}
            {trip.available_seats !== undefined && (
              <span>{trip.available_seats} asientos disponibles</span>
            )}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onSelect}
        className="w-full sm:w-auto px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shrink-0"
      >
        Seleccionar viaje
      </button>
    </div>
  );
};

export const QuotationTripStep: React.FC<QuotationTripStepProps> = ({
  branch,
  onTripSelect,
  onChangeBranch,
}) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: tripsByDate = {}, isLoading, error } = useAvailableTripsCalendar({
    portId: branch.port_id,
    currentMonth,
  });

  const trips = useMemo(() => tripsByDate[selectedDate] || [], [tripsByDate, selectedDate]);

  return (
    <div className="-mx-6 -mt-6">
      {/* Cabecera sticky */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg text-white">
              <DocumentTextIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">Nueva Cotizacion</h1>
              <p className="text-sm text-slate-500">
                Paso 2 de 3 - Selecciona el viaje
                <span className="ml-2 inline-flex items-center gap-1 text-primary font-medium">
                  <MapPinIcon className="h-3.5 w-3.5" />
                  {branch.name}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onChangeBranch}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Cambiar sucursal
            </button>
            <button
              type="button"
              onClick={() => navigate('/sales/quotations')}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </header>

      <div className="px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendario */}
          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-3">Selecciona la fecha</h2>
            <TripCalendar
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              tripsByDate={tripsByDate}
              isLoading={isLoading}
            />
          </div>

          {/* Lista de viajes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800">
                Viajes para {format(parseISO(selectedDate), 'dd/MM/yyyy')}
              </h2>
              {trips.length > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  {trips.length} viaje{trips.length !== 1 ? 's' : ''} disponible{trips.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Spinner />
                  <p className="text-sm text-slate-500">Cargando viajes...</p>
                </div>
              )}

              {!isLoading && error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                  Error al cargar los viajes: {error.message}
                </div>
              )}

              {!isLoading && !error && trips.length === 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                  <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <p className="font-medium text-slate-700">Sin viajes para esta fecha</p>
                  <p className="text-sm text-slate-500 mt-1">
                    No hay viajes programados desde {branch.port?.name || branch.name} para el dia seleccionado.
                  </p>
                </div>
              )}

              {!isLoading && !error && trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onSelect={() => onTripSelect(trip)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
