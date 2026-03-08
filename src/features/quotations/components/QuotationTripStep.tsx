// src/features/quotations/components/QuotationTripStep.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  MapPinIcon,
  ClockIcon,
  ChevronRightIcon,
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
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            ID VIAJE: #{trip.id}
          </span>
          <p className="font-bold text-slate-800 truncate">{trip.trip_name}</p>
          <p className="text-xs text-slate-500 truncate">{trip.vessel_name}</p>
        </div>
        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 shrink-0">
          Disponible
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <ClockIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-500">Salida</span>
            <p className="text-sm font-semibold text-slate-800 truncate">{formattedTime}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <MapPinIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-500">Ruta</span>
            <p className="text-sm font-semibold text-slate-800 truncate">{trip.route_name || 'No definida'}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500 truncate">
          {trip.available_seats !== undefined
            ? `${trip.available_seats} asientos disponibles`
            : 'Disponibilidad por confirmar'}
        </div>
        <button
          type="button"
          onClick={onSelect}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shrink-0"
        >
          Seleccionar
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
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
    <div className="w-full overflow-x-hidden bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center px-4 py-3 justify-between gap-3">
          <button
            type="button"
            onClick={onChangeBranch}
            className="text-slate-600 hover:text-slate-800 transition-colors"
            aria-label="Cambiar sucursal"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <DocumentTextIcon className="h-5 w-5 text-primary shrink-0" />
            <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">Nueva Cotizacion</h1>
          </div>

          <button
            type="button"
            onClick={() => navigate('/sales/quotations')}
            className="text-primary text-xs sm:text-sm font-bold shrink-0"
          >
            Cancelar
          </button>
        </div>

        <div className="flex w-full flex-row items-center justify-center gap-3 py-2.5">
          <div className="h-2 w-2 rounded-full bg-primary/30" />
          <div className="h-2.5 w-6 rounded-full bg-primary" />
          <div className="h-2 w-2 rounded-full bg-primary/30" />
        </div>

        <p className="text-center text-xs font-medium text-slate-500 pb-2">
          Paso 2 de 3: Fecha y Horario
        </p>

        <div className="px-4 pb-3 flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
            <MapPinIcon className="h-3.5 w-3.5" />
            {branch.name}
          </span>
        </div>
      </header>

      <main className="px-4 pt-4 pb-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-3">Selecciona la fecha</h2>
            <TripCalendar
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              tripsByDate={tripsByDate}
              isLoading={isLoading}
            />
          </section>

          <section>
            <div className="flex items-center justify-between mb-3 gap-2">
              <h2 className="text-base font-bold text-gray-900">
                Viajes para {format(parseISO(selectedDate), 'dd/MM/yyyy')}
              </h2>
              {trips.length > 0 && (
                <span className="text-[11px] bg-primary/10 text-primary px-2.5 py-1 rounded-full shrink-0">
                  {trips.length} disponible{trips.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
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
          </section>
        </div>
      </main>

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={onChangeBranch}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Cambiar sucursal
        </button>
      </div>

      <div className="hidden sm:block px-4 pb-6">
        <button
          type="button"
          onClick={() => navigate('/sales/quotations')}
          className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
        >
          Volver a cotizaciones
        </button>
      </div>
    </div>
  );
};
