import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/common/Modal';
import { Input } from '../../../../components/common/Input';
import { Button } from '../../../../components/common/Button';
import { Spinner } from '../../../../components/common/Spinner';
import { useVessels } from '../../hooks/useVesselsData';
import { useRoutes } from '../../hooks/useVesselsRoutesData';
import { useTripDetails } from '../../hooks/useTrips';
import { useCaptains } from '../../hooks/useUsersData';
import { Trip } from '../../../../types';
import { format, set } from 'date-fns';
import { UnifiedTripViewItem } from '../../hooks/useTripsView';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trip: UnifiedTripViewItem | null;
  onSave: (data: any) => void;
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

export const TripFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  trip,
  onSave,
  isLoading = false,
  initialDate,
}) => {
  const { data: vessels = [], isLoading: isLoadingVessels } = useVessels();
  const { data: routes = [], isLoading: isLoadingRoutes } = useRoutes();
  const tripIdToFetch = trip ? trip.trip_id : null;
  const { data: tripDetails, isLoading: isLoadingDetails } = useTripDetails(tripIdToFetch);
  const { captains, isLoading: isLoadingCaptains } = useCaptains();

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

  const [errors, setErrors] = useState<any>({});
  const [datePart, setDatePart] = useState('');
  const [timePart, setTimePart] = useState('08:00');

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
      }
      setErrors({});
    }
  }, [isOpen, trip, tripDetails, initialDate]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: any = {};
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

    const dataToSave: any = {
      vessel_id: formData.vessel_id,
      departure_datetime: combinedDateTime,
      can_sell_tickets: formData.can_sell_tickets,
      trip_name: formData.trip_name.trim() ? formData.trip_name.trim() : undefined,
      captain_user_id: formData.captain_user_id || undefined,
    };

    if (trip) {
      dataToSave.status = formData.status;
      dataToSave.actual_departure_datetime = formData.actual_departure_datetime ? new Date(formData.actual_departure_datetime).toISOString() : undefined;
      dataToSave.actual_arrival_datetime = formData.actual_arrival_datetime ? new Date(formData.actual_arrival_datetime).toISOString() : undefined;
    } else {
      dataToSave.route_id = formData.route_id;
    }

    onSave(dataToSave);
  };

  const isFormLoading = isLoading || isLoadingDetails || isLoadingRoutes || isLoadingVessels || isLoadingCaptains;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={trip ? 'Editar Viaje' : 'Nuevo Viaje'}
      maxWidth="lg"
    >
      {isFormLoading && !formData.departure_datetime ? (
        <div className="p-6 h-64 flex items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!trip && (
            <div>
              <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                Ruta <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <select
                value={formData.route_id}
                onChange={(e) => handleChange('route_id', parseInt(e.target.value))}
                className={`w-full rounded-md shadow-sm p-2 border ${
                  errors.route_id ? 'border-red-500' : 'border-dm-border-primary'
                } focus:border-primary focus:ring focus:ring-primary/20`}
                disabled={isLoadingRoutes}
              >
                <option value={0}>Seleccione una ruta</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name} ({route.origin_port?.name} → {route.destination_port?.name})
                  </option>
                ))}
              </select>
              {errors.route_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.route_id}</p>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-dm-text-secondary mb-1">
              Embarcación <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <select
              value={formData.vessel_id}
              onChange={(e) => handleChange('vessel_id', parseInt(e.target.value))}
              className={`w-full rounded-md shadow-sm p-2 border ${
                errors.vessel_id ? 'border-red-500' : 'border-dm-border-primary'
              } focus:border-primary focus:ring focus:ring-primary/20`}
              disabled={isLoadingVessels}
            >
              <option value={0}>Seleccione una embarcación</option>
              {vessels.map((vessel) => (
                <option key={vessel.id} value={vessel.id}>
                  {vessel.name} - {vessel.registration_number}
                </option>
              ))}
            </select>
            {errors.vessel_id && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.vessel_id}</p>
            )}
          </div>
          <Input
            label="Nombre del Viaje (Opcional)"
            value={formData.trip_name}
            onChange={(e) => handleChange('trip_name', e.target.value)}
            placeholder="Ej: Viaje Especial Navidad"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                Fecha de Salida
              </label>
              <input
                type="date"
                value={datePart}
                onChange={(e) => setDatePart(e.target.value)}
                className="w-full p-2 border border-dm-border-primary rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                Hora de Salida
              </label>
              <input
                type="time"
                value={timePart}
                onChange={(e) => setTimePart(e.target.value)}
                className="w-full p-2 border border-dm-border-primary rounded-md"
                required
              />
            </div>
          </div>
          {trip && (
            <div>
              <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full rounded-md border-dm-border-primary shadow-sm p-2 border focus:border-primary focus:ring focus:ring-primary/20"
              >
                {TRIP_STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-dm-text-secondary mb-1">
              Capitán (Opcional)
            </label>
            <select
              value={formData.captain_user_id}
              onChange={(e) => handleChange('captain_user_id', e.target.value)}
              className="w-full rounded-md border-dm-border-primary shadow-sm p-2 border focus:border-primary focus:ring focus:ring-primary/20"
              disabled={isLoadingCaptains}
            >
              <option value="">Seleccione un capitán</option>
              {captains.map((captain) => (
                <option key={captain.id} value={captain.id}>
                  {captain.full_name}
                </option>
              ))}
            </select>
            {isLoadingCaptains && <p className="text-xs text-dm-text-muted mt-1">Cargando capitanes...</p>}
          </div>
          {trip && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="datetime-local"
                label="Salida Real (Opcional)"
                value={formData.actual_departure_datetime}
                onChange={(e) => handleChange('actual_departure_datetime', e.target.value)}
              />
              <Input
                type="datetime-local"
                label="Llegada Real (Opcional)"
                value={formData.actual_arrival_datetime}
                onChange={(e) => handleChange('actual_arrival_datetime', e.target.value)}
              />
            </div>
          )}
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.can_sell_tickets}
              onChange={(e) => handleChange('can_sell_tickets', e.target.checked)}
              className="rounded border-dm-border-primary text-primary focus:ring-primary"
            />
            <span className="ml-2 text-sm text-dm-text-secondary">
              Permitir venta de tickets
            </span>
          </label>
          {!trip && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Este viaje se creará como un viaje único (no recurrente). Para viajes que se repiten
                semanalmente, use las plantillas de viaje.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isFormLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isFormLoading}
              isLoading={isLoading}
            >
              {trip ? 'Actualizar' : 'Crear'} Viaje
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
