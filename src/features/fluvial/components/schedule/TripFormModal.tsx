import React, { useState, useEffect } from 'react';
import {
  MapPinIcon,
  GlobeAltIcon,
  TagIcon,
  CalendarIcon,
  ClockIcon,
  SignalIcon,
  UserCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  TicketIcon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/common/Button';
import { Spinner } from '../../../../components/common/Spinner';
import { useVessels } from '../../hooks/useVesselsData';
import { useRoutes } from '../../hooks/useVesselsRoutesData';
import { useTripDetails } from '../../hooks/useTrips';
import type { CreateTripData, UpdateTripData } from '../../../../services/trips.service';
import { useCaptains } from '../../hooks/useUsersData';
import { format, set } from 'date-fns';
import { UnifiedTripViewItem } from '../../hooks/useTripsView';

/**
 * Payload que emite el formulario de viaje: al crear lleva los campos de
 * CreateTripData (sin company_id, que agrega la pagina) y al editar los de
 * UpdateTripData.
 */
export type TripFormPayload = Partial<Omit<CreateTripData, 'company_id'>> &
  UpdateTripData;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trip: UnifiedTripViewItem | null;
  onSave: (data: TripFormPayload) => void;
  onPreviewVesselChange?: (
    tripId: number,
    newVesselId: number,
    data: TripFormPayload
  ) => void;
  isLoading?: boolean;
  initialDate?: Date | null;
}

const TRIP_STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Programado' },
  { value: 'BOARDING', label: 'Embarcando' },
  { value: 'DEPARTED', label: 'En Ruta' },
  { value: 'ARRIVED', label: 'Arribado' },
  { value: 'COMPLETED', label: 'Completado' },
];

const inputWrapperClass = 'relative';
const iconLeftClass = 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dm-text-muted pointer-events-none';
const selectBaseClass =
  'w-full rounded-xl border bg-dm-bg-secondary text-dm-text-secondary py-2.5 pl-10 pr-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer';
const nativeInputBaseClass =
  'w-full rounded-xl border bg-dm-bg-secondary text-dm-text-secondary py-2.5 pl-10 pr-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
const dateTimeInputClass =
  '[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer';
const errorTextClass = 'mt-1.5 text-xs text-red-600 dark:text-red-400';
const labelClass = 'block text-xs font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5';

const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
  const input = ref.current;
  if (!input) return;
  // showPicker existe en los navegadores actuales pero no esta en los tipos
  // del DOM que usa el proyecto, de ahi el estrechamiento puntual.
  const withPicker = input as HTMLInputElement & { showPicker?: () => void };
  if (typeof withPicker.showPicker === 'function') {
    try { withPicker.showPicker(); } catch { input.focus(); }
  } else {
    input.focus();
  }
};

export const TripFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  trip,
  onSave,
  onPreviewVesselChange,
  isLoading = false,
  initialDate,
}) => {
  const { data: vessels = [], isLoading: isLoadingVessels } = useVessels();
  const { data: routes = [], isLoading: isLoadingRoutes } = useRoutes();
  const tripIdToFetch = trip ? trip.trip_id : null;
  const { data: tripDetails, isLoading: isLoadingDetails } = useTripDetails(tripIdToFetch);
  const { captains, isLoading: isLoadingCaptains } = useCaptains();

  const dateRef = React.useRef<HTMLInputElement>(null);
  const timeRef = React.useRef<HTMLInputElement>(null);
  const departureRef = React.useRef<HTMLInputElement>(null);
  const arrivalRef = React.useRef<HTMLInputElement>(null);

  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [departureOpen, setDepartureOpen] = useState(false);
  const [arrivalOpen, setArrivalOpen] = useState(false);

  const [formData, setFormData] = useState({
    route_id: 0,
    vessel_id: 0,
    trip_name: '',
    departure_datetime: '',
    can_sell_tickets: true,
    status: 'SCHEDULED',
    actual_departure_datetime: '',
    actual_arrival_datetime: '',
    captain_user_id: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [datePart, setDatePart] = useState('');
  const [timePart, setTimePart] = useState('08:00');
  const [originalVesselId, setOriginalVesselId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (trip && tripDetails) {
        const departure = new Date(tripDetails.departure_datetime);
        setDatePart(format(departure, 'yyyy-MM-dd'));
        setTimePart(format(departure, 'HH:mm'));

        setFormData({
          route_id: tripDetails.route_id,
          vessel_id: tripDetails.vessel_id || 0,
          trip_name: tripDetails.trip_name || '',
          departure_datetime: format(new Date(tripDetails.departure_datetime), "yyyy-MM-dd'T'HH:mm"),
          can_sell_tickets: tripDetails.can_sell_tickets,
          status: tripDetails.status,
          actual_departure_datetime: tripDetails.actual_departure_datetime
            ? format(new Date(tripDetails.actual_departure_datetime), "yyyy-MM-dd'T'HH:mm")
            : '',
          actual_arrival_datetime: tripDetails.actual_arrival_datetime
            ? format(new Date(tripDetails.actual_arrival_datetime), "yyyy-MM-dd'T'HH:mm")
            : '',
          captain_user_id: tripDetails.captain_user_id || '',
        });
        setOriginalVesselId(tripDetails.vessel_id || null);
      } else if (!trip) {
        const defaultDate = initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        setDatePart(defaultDate);
        setTimePart('08:00');

        const defaultDateTime = initialDate ? set(initialDate, { hours: 8, minutes: 0 }) : new Date();
        setFormData({
          route_id: 0,
          vessel_id: 0,
          trip_name: '',
          departure_datetime: format(defaultDateTime, "yyyy-MM-dd'T'HH:mm"),
          can_sell_tickets: true,
          status: 'SCHEDULED',
          actual_departure_datetime: '',
          actual_arrival_datetime: '',
          captain_user_id: '',
        });
        setOriginalVesselId(null);
      }
      setErrors({});
    }
  }, [isOpen, trip, tripDetails, initialDate]);

  const handleChange = (field: string, value: string | number | boolean | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!trip && (!formData.route_id || formData.route_id === 0)) {
      newErrors.route_id = 'Debe seleccionar una ruta.';
    }
    if (!formData.vessel_id || formData.vessel_id === 0) {
      newErrors.vessel_id = 'Debe seleccionar una embarcación.';
    }
    if (!datePart || !timePart) {
      newErrors.departure_datetime = 'La fecha y hora de salida es requerida.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const combinedDateTime = `${datePart}T${timePart}:00`;

    // El modal manda los campos de creacion o los de actualizacion segun si
    // hay `trip`. Se expresa como interseccion parcial para que cada campo
    // conserve su tipo sin fingir que ambos juegos van siempre juntos.
    const dataToSave: TripFormPayload = {
      vessel_id: formData.vessel_id,
      departure_datetime: combinedDateTime,
      can_sell_tickets: formData.can_sell_tickets,
      trip_name: formData.trip_name.trim() ? formData.trip_name.trim() : undefined,
      captain_user_id: formData.captain_user_id || undefined,
    };

    if (trip) {
      dataToSave.status = formData.status;
      dataToSave.actual_departure_datetime = formData.actual_departure_datetime
        ? new Date(formData.actual_departure_datetime).toISOString()
        : undefined;
      dataToSave.actual_arrival_datetime = formData.actual_arrival_datetime
        ? new Date(formData.actual_arrival_datetime).toISOString()
        : undefined;
    } else {
      dataToSave.route_id = formData.route_id;
    }

    // Si estamos editando y cambió la embarcación, primero previsualizar
    if (trip && originalVesselId !== null && formData.vessel_id !== originalVesselId && onPreviewVesselChange) {
      onPreviewVesselChange(trip.trip_id, formData.vessel_id, dataToSave);
      return;
    }

    onSave(dataToSave);
  };

  const isFormLoading = isLoading || isLoadingDetails || isLoadingRoutes || isLoadingVessels || isLoadingCaptains;

  const sectionTitle = trip ? 'Editar Viaje' : 'Nuevo Viaje';
  const sectionSubtitle = trip
    ? `Modificando viaje #${trip.trip_id}${trip.trip_name ? ` — ${trip.trip_name}` : ''}`
    : 'Complete los datos para programar un nuevo viaje.';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="lg">
      {isFormLoading && !formData.departure_datetime ? (
        <div className="p-6 h-64 flex items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
          {/* ── Header visual ── */}
          <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-dm-border-secondary">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                  <GlobeAltIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-dm-text-primary">{sectionTitle}</h2>
                  <p className="text-xs text-dm-text-muted mt-0.5">{sectionSubtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-dm-text-muted hover:text-dm-text-secondary hover:bg-dm-bg-hover transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* ── Body scrolleable ── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Ruta (solo al crear) */}
            {!trip && (
              <div>
                <label className={labelClass}>
                  Ruta <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <div className={inputWrapperClass}>
                  <MapPinIcon className={iconLeftClass} />
                  <select
                    value={formData.route_id}
                    onChange={(e) => handleChange('route_id', parseInt(e.target.value))}
                    className={`${selectBaseClass} ${errors.route_id ? 'border-red-500' : 'border-dm-border-primary'}`}
                    disabled={isLoadingRoutes}
                  >
                    <option value={0}>Seleccione una ruta</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name} ({route.origin_port?.name} → {route.destination_port?.name})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.route_id && <p className={errorTextClass}>{errors.route_id}</p>}
              </div>
            )}

            {/* Embarcación */}
            <div>
              <label className={labelClass}>
                Embarcación <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <div className={inputWrapperClass}>
                <GlobeAltIcon className={iconLeftClass} />
                <select
                  value={formData.vessel_id}
                  onChange={(e) => handleChange('vessel_id', parseInt(e.target.value))}
                  className={`${selectBaseClass} ${errors.vessel_id ? 'border-red-500' : 'border-dm-border-primary'}`}
                  disabled={isLoadingVessels}
                >
                  <option value={0}>Seleccione una embarcación</option>
                  {vessels.map((vessel) => (
                    <option key={vessel.id} value={vessel.id}>
                      {vessel.name} — {vessel.registration_number}
                    </option>
                  ))}
                </select>
              </div>
              {errors.vessel_id && <p className={errorTextClass}>{errors.vessel_id}</p>}
            </div>

            {/* Nombre del viaje */}
            <div>
              <label className={labelClass}>Nombre del Viaje (Opcional)</label>
              <div className={inputWrapperClass}>
                <TagIcon className={iconLeftClass} />
                <input
                  type="text"
                  value={formData.trip_name}
                  onChange={(e) => handleChange('trip_name', e.target.value)}
                  placeholder="Ej: Viaje Especial Navidad"
                  className={`${nativeInputBaseClass} border-dm-border-primary placeholder:text-dm-text-muted/70`}
                />
              </div>
            </div>

            {/* Fecha y hora de salida */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Fecha de Salida</label>
                <div className={inputWrapperClass}>
                  <CalendarIcon className={iconLeftClass} />
                  <input
                    type="date"
                    value={datePart}
                    onChange={(e) => setDatePart(e.target.value)}
                    ref={dateRef}
                    onFocus={() => setDateOpen(true)}
                    onBlur={() => setDateOpen(false)}
                    className={`${nativeInputBaseClass} ${dateTimeInputClass} pr-10 border-dm-border-primary`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => openPicker(dateRef)}
                    onPointerDown={(e) => e.preventDefault()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-dm-text-muted hover:text-dm-text-secondary transition-colors"
                    tabIndex={-1}
                  >
                    <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${dateOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>Hora de Salida</label>
                <div className={inputWrapperClass}>
                  <ClockIcon className={iconLeftClass} />
                  <input
                    type="time"
                    value={timePart}
                    onChange={(e) => setTimePart(e.target.value)}
                    ref={timeRef}
                    onFocus={() => setTimeOpen(true)}
                    onBlur={() => setTimeOpen(false)}
                    className={`${nativeInputBaseClass} ${dateTimeInputClass} pr-10 border-dm-border-primary`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => openPicker(timeRef)}
                    onPointerDown={(e) => e.preventDefault()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-dm-text-muted hover:text-dm-text-secondary transition-colors"
                    tabIndex={-1}
                  >
                    <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${timeOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Estado (solo edición) */}
            {trip && (
              <div>
                <label className={labelClass}>Estado</label>
                <div className={inputWrapperClass}>
                  <SignalIcon className={iconLeftClass} />
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className={`${selectBaseClass} border-dm-border-primary`}
                  >
                    {TRIP_STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Capitán */}
            <div>
              <label className={labelClass}>Capitán (Opcional)</label>
              <div className={inputWrapperClass}>
                <UserCircleIcon className={iconLeftClass} />
                <select
                  value={formData.captain_user_id}
                  onChange={(e) => handleChange('captain_user_id', e.target.value)}
                  className={`${selectBaseClass} border-dm-border-primary`}
                  disabled={isLoadingCaptains}
                >
                  <option value="">Seleccione un capitán</option>
                  {captains.map((captain) => (
                    <option key={captain.id} value={captain.id}>
                      {captain.full_name}
                    </option>
                  ))}
                </select>
              </div>
              {isLoadingCaptains && (
                <p className="mt-1 text-xs text-dm-text-muted">Cargando capitanes…</p>
              )}
            </div>

            {/* Fechas reales (solo edición) */}
            {trip && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Salida Real (Opcional)</label>
                  <div className={inputWrapperClass}>
                    <ArrowRightIcon className={iconLeftClass} />
                    <input
                      type="datetime-local"
                      value={formData.actual_departure_datetime}
                      onChange={(e) => handleChange('actual_departure_datetime', e.target.value)}
                      ref={departureRef}
                      onFocus={() => setDepartureOpen(true)}
                      onBlur={() => setDepartureOpen(false)}
                      className={`${nativeInputBaseClass} ${dateTimeInputClass} pr-10 border-dm-border-primary`}
                    />
                    <button
                      type="button"
                      onClick={() => openPicker(departureRef)}
                      onPointerDown={(e) => e.preventDefault()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-dm-text-muted hover:text-dm-text-secondary transition-colors"
                      tabIndex={-1}
                    >
                      <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${departureOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Llegada Real (Opcional)</label>
                  <div className={inputWrapperClass}>
                    <ArrowLeftIcon className={iconLeftClass} />
                    <input
                      type="datetime-local"
                      value={formData.actual_arrival_datetime}
                      onChange={(e) => handleChange('actual_arrival_datetime', e.target.value)}
                      ref={arrivalRef}
                      onFocus={() => setArrivalOpen(true)}
                      onBlur={() => setArrivalOpen(false)}
                      className={`${nativeInputBaseClass} ${dateTimeInputClass} pr-10 border-dm-border-primary`}
                    />
                    <button
                      type="button"
                      onClick={() => openPicker(arrivalRef)}
                      onPointerDown={(e) => e.preventDefault()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-dm-text-muted hover:text-dm-text-secondary transition-colors"
                      tabIndex={-1}
                    >
                      <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${arrivalOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Checkbox venta de tickets */}
            <label className="flex items-center gap-3 rounded-xl border border-dm-border-primary bg-dm-bg-secondary/50 px-4 py-3 cursor-pointer hover:bg-dm-bg-hover transition-colors">
              <TicketIcon className="h-5 w-5 text-dm-text-muted flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm font-medium text-dm-text-secondary">Permitir venta de tickets</span>
                <p className="text-xs text-dm-text-muted">Los agentes podrán vender pasajes para este viaje.</p>
              </div>
              <input
                type="checkbox"
                checked={formData.can_sell_tickets}
                onChange={(e) => handleChange('can_sell_tickets', e.target.checked)}
                className="h-4 w-4 rounded border-dm-border-primary text-primary focus:ring-primary flex-shrink-0"
              />
            </label>

            {/* Info box (solo creación) */}
            {!trip && (
              <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <svg
                      className="h-5 w-5 text-blue-600 dark:text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                    Este viaje se creará como un viaje único (no recurrente). Para viajes que se repiten
                    semanalmente, use las <strong>plantillas de viaje</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer con acciones ── */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-dm-border-secondary bg-dm-bg-primary/50">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isFormLoading}
                className="min-w-[100px]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isFormLoading}
                isLoading={isLoading}
                className="min-w-[140px]"
              >
                {trip ? 'Actualizar' : 'Crear'} Viaje
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};
