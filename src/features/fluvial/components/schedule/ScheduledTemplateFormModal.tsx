// src/features/fluvial/components/schedule/ScheduledTemplateFormModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/common/Modal';
import { Input } from '../../../../components/common/Input';
import { Button } from '../../../../components/common/Button';
import { useVessels } from '../../hooks/useVesselsData';
import { useRoutes } from '../../hooks/useVesselsRoutesData';
import { ScheduledRouteTemplate } from '../../../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  template: ScheduledRouteTemplate | null;
  onSave: (data: any) => void;
  isLoading?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

export const ScheduledTemplateFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  template,
  onSave,
  isLoading = false,
}) => {
  const { data: vessels = [], isLoading: isLoadingVessels } = useVessels();
  const { data: routes = [], isLoading: isLoadingRoutes } = useRoutes();
  const [formData, setFormData] = useState({
    template_name: '',
    route_id: 0,
    day_of_week: 1,
    departure_time: '',
    vessel_id: 0,
    is_active: true,
    auto_generate_trips: true,
    generate_weeks_ahead: 4 as number | string,
  });

  const [errors, setErrors] = useState<any>({});

  const isEditing = !!template;

  useEffect(() => {
    if (template) {
      setFormData({
        template_name: template.template_name,
        route_id: template.route_id,
        day_of_week: template.day_of_week,
        departure_time: template.departure_time?.substring(0, 5) || '',
        vessel_id: template.vessel_id || 0,
        is_active: template.is_active,
        auto_generate_trips: template.auto_generate_trips,
        generate_weeks_ahead: template.generate_weeks_ahead as number | string,
      });
    } else {
      setFormData({
        template_name: '',
        route_id: 0,
        day_of_week: 1,
        departure_time: '',
        vessel_id: 0,
        is_active: true,
        auto_generate_trips: true,
        generate_weeks_ahead: 4 as number | string,
      });
    }
    setErrors({});
  }, [template]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formData.template_name.trim()) {
      newErrors.template_name = 'El nombre es requerido';
    }
    if (!formData.route_id) {
      newErrors.route_id = 'Debe seleccionar una ruta';
    }
    if (!formData.departure_time) {
      newErrors.departure_time = 'La hora de salida es requerida';
    }
    if (!isEditing && (!formData.vessel_id || formData.vessel_id === 0)) {
      newErrors.vessel_id = 'Debe seleccionar una embarcación';
    }
    const weeksNum = Number(formData.generate_weeks_ahead) || 0;
    if (weeksNum < 1 || weeksNum > 52) {
      newErrors.generate_weeks_ahead = 'Debe ser entre 1 y 52 semanas';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const departureTimeParts = formData.departure_time.split(':');
    const timeWithSeconds = `${departureTimeParts[0]}:${departureTimeParts[1]}:00`;
    const dataToSave = {
      template_name: formData.template_name,
      route_id: formData.route_id,
      day_of_week: formData.day_of_week,
      departure_time: timeWithSeconds,
      is_active: formData.is_active,
      auto_generate_trips: formData.auto_generate_trips,
      generate_weeks_ahead: Number(formData.generate_weeks_ahead || 0),
      vessel_id: formData.vessel_id > 0 ? formData.vessel_id : undefined,
    };
    onSave(dataToSave);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Plantilla de Viaje' : 'Nueva Plantilla de Viaje'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Input
          label="Nombre de la Plantilla"
          value={formData.template_name}
          onChange={(e) => handleChange('template_name', e.target.value)}
          error={errors.template_name}
          placeholder="Ej: Expreso Matutino a Yurimaguas"
          required
        />

        <div>
          <label className="block text-sm font-medium text-dm-text-secondary mb-1">
            Ruta <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <select
            value={formData.route_id}
            onChange={(e) => handleChange('route_id', parseInt(e.target.value))}
            className={`w-full rounded-md shadow-sm p-2 border bg-dm-bg-secondary text-dm-text-secondary ${
              errors.route_id ? 'border-red-500' : 'border-dm-border-primary'
            } focus:border-primary focus:ring focus:ring-primary/20 transition-colors disabled:bg-dm-bg-secondary disabled:cursor-not-allowed disabled:text-dm-text-muted`}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dm-text-secondary mb-1">
              Día de la Semana
            </label>
            <select
              value={formData.day_of_week}
              onChange={(e) => handleChange('day_of_week', parseInt(e.target.value))}
              className="w-full rounded-md border-dm-border-primary shadow-sm p-2 border bg-dm-bg-secondary text-dm-text-secondary focus:border-primary focus:ring focus:ring-primary/20 transition-colors disabled:bg-dm-bg-secondary disabled:cursor-not-allowed disabled:text-dm-text-muted"
            >
              {DAYS_OF_WEEK.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            type="time"
            label="Hora de Salida"
            value={formData.departure_time}
            onChange={(e) => handleChange('departure_time', e.target.value)}
            error={errors.departure_time}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dm-text-secondary mb-1">
            Embarcación {!isEditing && <span className="text-red-500 dark:text-red-400">*</span>}
          </label>
          <select
            value={formData.vessel_id}
            onChange={(e) => handleChange('vessel_id', parseInt(e.target.value))}
            className="w-full rounded-md border-dm-border-primary shadow-sm p-2 border bg-dm-bg-secondary text-dm-text-secondary focus:border-primary focus:ring focus:ring-primary/20 disabled:text-dm-text-muted"
            disabled={isLoadingVessels}
          >
            <option value={0}>Seleccione una embarcación</option>
            {vessels.map((vessel) => (
              <option key={vessel.id} value={vessel.id}>
                {vessel.name}
              </option>
            ))}
          </select>
          {errors.vessel_id && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.vessel_id}</p>
          )}
        </div>

        <Input
          type="number"
          label="Generar viajes con anticipación (semanas)"
          value={formData.generate_weeks_ahead}
          onChange={(e) => handleChange('generate_weeks_ahead', e.target.value === '' ? '' : parseInt(e.target.value))}
          onFocus={() => { if (Number(formData.generate_weeks_ahead) === 0) handleChange('generate_weeks_ahead', ''); }}
          onBlur={() => { if (formData.generate_weeks_ahead === '') handleChange('generate_weeks_ahead', 0); }}
          error={errors.generate_weeks_ahead}
          min={1}
          max={52}
        />

        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              className="rounded border-dm-border-primary text-primary focus:ring-primary"
            />
            <span className="ml-2 text-sm text-dm-text-secondary">
              Plantilla activa
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.auto_generate_trips}
              onChange={(e) => handleChange('auto_generate_trips', e.target.checked)}
              className="rounded border-dm-border-primary text-primary focus:ring-primary"
            />
            <span className="ml-2 text-sm text-dm-text-secondary">
              Generar viajes automáticamente
            </span>
          </label>
        </div>

        {!isEditing && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-md p-3">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Los viajes se generarán automáticamente según la configuración establecida.
              Puede modificar o cancelar los viajes individuales después de su creación.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || isLoadingRoutes || isLoadingVessels}
            isLoading={isLoading}
          >
            {isEditing ? 'Actualizar' : 'Crear'} Plantilla
          </Button>
        </div>
      </form>
    </Modal>
  );
};
