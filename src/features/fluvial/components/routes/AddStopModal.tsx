import React, { useState, useEffect } from 'react';
import {
  MapPinIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { Modal } from '../../../../components/common/Modal';
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
  estimated_duration_hours: number;
  estimated_duration_minutes: number;
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.port_id || formData.port_id === 0) {
      newErrors.port_id = 'Debe seleccionar un puerto';
    }

    if (formData.estimated_duration_hours < 0 || formData.estimated_duration_minutes < 0) {
      newErrors.duration = 'La duración no puede ser negativa';
    }

    if (formData.estimated_duration_minutes >= 60) {
      newErrors.duration = 'Los minutos deben ser menores a 60';
    }

    // Validar que la duración sea mayor que la parada anterior
    if (insertPosition > 1) {
      const previousStop = existingStops[insertPosition - 1];
      if (previousStop?.estimated_duration_from_origin) {
        const previousHours = routeHelpers.isoStringToHours(previousStop.estimated_duration_from_origin);
        const currentHours = formData.estimated_duration_hours + (formData.estimated_duration_minutes / 60);
        
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
        const currentHours = formData.estimated_duration_hours + (formData.estimated_duration_minutes / 60);
        
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
      const totalHours = formData.estimated_duration_hours + (formData.estimated_duration_minutes / 60);
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

  const handleInputChange = (field: keyof StopFormData, value: any) => {
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <MapPinIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Esta parada se insertará en la posición {insertPosition + 1} de la ruta
            </span>
          </div>
        </div>

        {/* Selección de puerto */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Puerto de la parada *
          </label>
          <select
            value={formData.port_id}
            onChange={(e) => handleInputChange('port_id', parseInt(e.target.value))}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.port_id ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value={0}>Seleccionar puerto...</option>
            {availablePorts.map(port => (
              <option key={port.id} value={port.id}>
                {port.name} - {port.city?.name || 'Ciudad no especificada'}
              </option>
            ))}
          </select>
          {errors.port_id && (
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>{errors.port_id}</span>
            </p>
          )}
          {availablePorts.length === 0 && (
            <p className="text-sm text-amber-600 flex items-center space-x-1">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>Todos los puertos disponibles ya están en uso en esta ruta</span>
            </p>
          )}
        </div>

        {/* Duración estimada */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <ClockIcon className="h-4 w-4 inline mr-1" />
            Tiempo estimado desde el origen
          </label>
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Horas</label>
              <input
                type="number"
                value={formData.estimated_duration_hours}
                onChange={(e) => handleInputChange('estimated_duration_hours', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.duration ? 'border-red-300' : 'border-gray-300'
                }`}
                min="0"
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Minutos</label>
              <input
                type="number"
                value={formData.estimated_duration_minutes}
                onChange={(e) => handleInputChange('estimated_duration_minutes', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.duration ? 'border-red-300' : 'border-gray-300'
                }`}
                min="0"
                max="59"
                placeholder="0"
              />
            </div>
          </div>
          {errors.duration && (
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>{errors.duration}</span>
            </p>
          )}
          <p className="text-xs text-gray-500">
            Tiempo total: {formData.estimated_duration_hours}h {formData.estimated_duration_minutes}m
          </p>
        </div>

        {/* Operaciones permitidas */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Operaciones permitidas
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_boarding_allowed}
                onChange={(e) => handleInputChange('is_boarding_allowed', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Permitir embarque de pasajeros</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_disembarking_allowed}
                onChange={(e) => handleInputChange('is_disembarking_allowed', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Permitir desembarque de pasajeros</span>
            </label>
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <DocumentTextIcon className="h-4 w-4 inline mr-1" />
            Notas adicionales (opcional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Información adicional sobre esta parada..."
          />
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || availablePorts.length === 0}
            className="flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Agregando...</span>
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" />
                <span>Agregar Parada</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};