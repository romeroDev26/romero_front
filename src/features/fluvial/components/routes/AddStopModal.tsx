import React, { useState, useEffect } from 'react';
import {
  MapPinIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Modal } from '../../../../components/common/Modal';
import { SearchableSelect } from '../../../../components/common/SearchableSelect';
import { Port, RouteStop } from '../../../../types';
import { routeHelpers } from '../../hooks/useVesselsRoutesData';

interface AddStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStop: (stopData: Partial<RouteStop>) => void;
  ports: Port[];
  existingStops: Partial<RouteStop>[];
  insertPosition: number; // Posición donde se insertará la parada
}

interface StopFormData {
  port_id: number;
  estimated_duration_hours: number | string;
  estimated_duration_minutes: number | string;
  notes: string;
  is_boarding_allowed: boolean;
  is_disembarking_allowed: boolean;
}

export const AddStopModal: React.FC<AddStopModalProps> = ({
  isOpen,
  onClose,
  onAddStop,
  ports,
  existingStops,
  insertPosition
}) => {
  const [formData, setFormData] = useState<StopFormData>({
    port_id: 0,
    estimated_duration_hours: 0,
    estimated_duration_minutes: 0,
    notes: '',
    is_boarding_allowed: true,
    is_disembarking_allowed: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resetear formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        port_id: 0,
        estimated_duration_hours: 0,
        estimated_duration_minutes: 0,
        notes: '',
        is_boarding_allowed: true,
        is_disembarking_allowed: true
      });
      setErrors({});
    }
  }, [isOpen]);

  // Obtener puertos disponibles (excluir los ya utilizados)
  const availablePorts = ports.filter(port => 
    !existingStops.some(stop => stop.port_id === port.id)
  );

  // Convertir puertos disponibles a formato de opciones para SearchableSelect
  const portOptions = availablePorts.map(port => ({
    value: port.id,
    label: port.name
  }));

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.port_id || formData.port_id === 0) {
      newErrors.port_id = 'Debe seleccionar un puerto';
    }

    const hoursNum = Number(formData.estimated_duration_hours) || 0;
    const minutesNum = Number(formData.estimated_duration_minutes) || 0;

    if (hoursNum < 0 || minutesNum < 0) {
      newErrors.duration = 'La duración no puede ser negativa';
    }

    if (minutesNum >= 60) {
      newErrors.duration = 'Los minutos deben ser menores a 60';
    }

    // Validar que la duración sea mayor que la parada anterior
    if (insertPosition > 1) {
      const previousStop = existingStops[insertPosition - 1];
      if (previousStop?.estimated_duration_from_origin) {
        const previousHours = routeHelpers.isoStringToHours(previousStop.estimated_duration_from_origin);
        const currentHours = hoursNum + (minutesNum / 60);
        
        if (currentHours <= previousHours) {
          newErrors.duration = `La duración debe ser mayor a ${previousHours.toFixed(1)} horas (parada anterior)`;
        }
      }
    }

    // Validar que la duración sea menor que la parada siguiente (si existe)
    if (insertPosition < existingStops.length - 1) {
      const nextStop = existingStops[insertPosition];
      if (nextStop?.estimated_duration_from_origin) {
        const nextHours = routeHelpers.isoStringToHours(nextStop.estimated_duration_from_origin);
        const currentHours = hoursNum + (minutesNum / 60);
        
        if (currentHours >= nextHours) {
          newErrors.duration = `La duración debe ser menor a ${nextHours.toFixed(1)} horas (parada siguiente)`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const totalHours = Number(formData.estimated_duration_hours || 0) + (Number(formData.estimated_duration_minutes || 0) / 60);
      const selectedPort = ports.find(p => p.id === formData.port_id);

      const newStop: Partial<RouteStop> = {
        port_id: formData.port_id,
        port: selectedPort,
        stop_order: insertPosition + 1,
        estimated_duration_from_origin: routeHelpers.hoursToISOString(totalHours),
        is_boarding_allowed: formData.is_boarding_allowed,
        is_disembarking_allowed: formData.is_disembarking_allowed,
        notes: formData.notes.trim() || undefined
      };

      onAddStop(newStop);
      onClose();
    } catch (error) {
      console.error('Error al agregar parada:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = <K extends keyof StopFormData>(
    field: K,
    value: StopFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar Nueva Parada"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Información de posición */}
        <div className="bg-[#1F4690]/5 border border-[#1F4690]/10 rounded-[12px] p-4">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-5 w-5 text-[#1F4690]" strokeWidth={1.5} />
            <span className="text-[14px] font-medium text-[#1F4690]">
              Esta parada se insertará en la posición {insertPosition + 1} de la ruta
            </span>
          </div>
        </div>

        {/* Selección de puerto */}
        <div className="space-y-2">
          <label className="block text-[13px] font-medium text-dm-text-secondary">
            Puerto de la parada *
          </label>
          <SearchableSelect
            value={formData.port_id || null}
            onChange={(value) => handleInputChange('port_id', value as number)}
            options={portOptions}
            placeholder="Buscar puerto..."
          />
          {errors.port_id && (
            <p className="text-[13px] text-[#cf1322] flex items-center gap-1">
              <ExclamationTriangleIcon className="h-4 w-4" strokeWidth={1.5} />
              <span>{errors.port_id}</span>
            </p>
          )}
          {availablePorts.length === 0 && (
            <p className="text-[13px] text-[#d48806] flex items-center gap-1">
              <ExclamationTriangleIcon className="h-4 w-4" strokeWidth={1.5} />
              <span>Todos los puertos disponibles ya están en uso en esta ruta</span>
            </p>
          )}
        </div>

        {/* Duración estimada */}
        <div className="space-y-2">
          <label className="block text-[13px] font-medium text-dm-text-secondary">
            <ClockIcon className="h-4 w-4 inline mr-1" strokeWidth={1.5} />
            Tiempo estimado desde el origen
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-[12px] text-dm-text-muted mb-1">Horas</label>
              <input
                type="number"
                value={formData.estimated_duration_hours}
                onChange={(e) => handleInputChange('estimated_duration_hours', e.target.value === '' ? '' : parseInt(e.target.value))}
                onFocus={() => { if (formData.estimated_duration_hours === 0) handleInputChange('estimated_duration_hours', ''); }}
                onBlur={() => { if (formData.estimated_duration_hours === '') handleInputChange('estimated_duration_hours', 0); }}
                className={`w-full px-3 py-2.5 bg-dm-bg-secondary border rounded-[12px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all ${
                  errors.duration ? 'border-[#cf1322]' : 'border-dm-border-primary'
                }`}
                min="0"
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[12px] text-dm-text-muted mb-1">Minutos</label>
              <input
                type="number"
                value={formData.estimated_duration_minutes}
                onChange={(e) => handleInputChange('estimated_duration_minutes', e.target.value === '' ? '' : parseInt(e.target.value))}
                onFocus={() => { if (formData.estimated_duration_minutes === 0) handleInputChange('estimated_duration_minutes', ''); }}
                onBlur={() => { if (formData.estimated_duration_minutes === '') handleInputChange('estimated_duration_minutes', 0); }}
                className={`w-full px-3 py-2.5 bg-dm-bg-secondary border rounded-[12px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all ${
                  errors.duration ? 'border-[#cf1322]' : 'border-dm-border-primary'
                }`}
                min="0"
                max="59"
                placeholder="0"
              />
            </div>
          </div>
          {errors.duration && (
            <p className="text-[13px] text-[#cf1322] flex items-center gap-1">
              <ExclamationTriangleIcon className="h-4 w-4" strokeWidth={1.5} />
              <span>{errors.duration}</span>
            </p>
          )}
          <p className="text-[12px] text-dm-text-muted">
            Tiempo total: {Number(formData.estimated_duration_hours || 0)}h {Number(formData.estimated_duration_minutes || 0)}m
          </p>
        </div>

        {/* Operaciones permitidas */}
        <div className="space-y-3">
          <label className="block text-[13px] font-medium text-dm-text-secondary">
            Operaciones permitidas
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_boarding_allowed}
                onChange={(e) => handleInputChange('is_boarding_allowed', e.target.checked)}
                className="rounded border-dm-border-primary text-[#1F4690] focus:ring-[#1F4690]/20 h-4 w-4"
              />
              <span className="text-[14px] text-dm-text-primary">Permitir embarque de pasajeros</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_disembarking_allowed}
                onChange={(e) => handleInputChange('is_disembarking_allowed', e.target.checked)}
                className="rounded border-dm-border-primary text-[#1F4690] focus:ring-[#1F4690]/20 h-4 w-4"
              />
              <span className="text-[14px] text-dm-text-primary">Permitir desembarque de pasajeros</span>
            </label>
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <label className="block text-[13px] font-medium text-dm-text-secondary">
            <DocumentTextIcon className="h-4 w-4 inline mr-1" strokeWidth={1.5} />
            Notas adicionales (opcional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="w-full px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all resize-none"
            rows={3}
            placeholder="Información adicional sobre esta parada..."
          />
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-dm-border-secondary">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-[14px] font-medium text-dm-text-primary bg-dm-bg-primary border border-dm-border-primary rounded-[10px] hover:bg-dm-bg-secondary disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || availablePorts.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[14px] font-medium text-white bg-[#1F4690] rounded-[10px] hover:bg-[#163672] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Agregando...</span>
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" strokeWidth={1.5} />
                <span>Agregar Parada</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};