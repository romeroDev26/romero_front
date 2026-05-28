import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  MapPinIcon,
  UsersIcon,
  CubeIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { manifestService } from '../services/manifest.service';
import { ManifestFormData, Trip, Manifest } from '../types/manifest.types';

interface ManifestFormProps {
  onSubmit: (data: ManifestFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ManifestForm: React.FC<ManifestFormProps> = ({ 
  onSubmit, 
  onCancel, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState<ManifestFormData>({
    trip_id: 0,
    manifest_type: 'PASSENGER',
    observations: ''
  });
  
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [existingManifest, setExistingManifest] = useState<Manifest | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);

  // Query para obtener viajes disponibles
  const { 
    data: availableTrips = [], 
    isLoading: isLoadingTrips,
    error: tripsError
  } = useQuery({
    queryKey: ['available-trips-for-manifests'],
    queryFn: manifestService.getAvailableTrips,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  // Función para verificar si existe un manifiesto
  const checkExistingManifest = async (tripId: number, manifestType: 'PASSENGER' | 'CARGO') => {
    if (!tripId) return;
    
    setCheckingExisting(true);
    try {
      const existing = await manifestService.checkExistingManifest(tripId, manifestType);
      setExistingManifest(existing);
    } catch (error) {
      console.error('Error checking existing manifest:', error);
      setExistingManifest(null);
    } finally {
      setCheckingExisting(false);
    }
  };

  // Efecto para verificar manifiesto existente cuando cambia el viaje o tipo
  useEffect(() => {
    if (formData.trip_id && formData.manifest_type) {
      checkExistingManifest(formData.trip_id, formData.manifest_type);
    } else {
      setExistingManifest(null);
    }
  }, [formData.trip_id, formData.manifest_type]);

  const handleTripChange = (tripId: string) => {
    const tripIdNum = parseInt(tripId);
    const trip = availableTrips.find(t => t.id === tripIdNum);
    
    setSelectedTrip(trip || null);
    setFormData(prev => ({
      ...prev,
      trip_id: tripIdNum
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.trip_id) {
      alert('Debe seleccionar un viaje');
      return;
    }

    await onSubmit(formData);
  };

  const getManifestTypeInfo = (type: 'PASSENGER' | 'CARGO') => {
    return type === 'PASSENGER' 
      ? {
          icon: UsersIcon,
          title: 'Manifiesto de Pasajeros',
          description: 'Incluye la lista de todos los pasajeros del viaje con sus datos personales y asientos asignados.',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-950/30',
          borderColor: 'border-blue-200 dark:border-blue-800/50'
        }
      : {
          icon: CubeIcon,
          title: 'Manifiesto de Carga',
          description: 'Incluye la lista de toda la carga y encomiendas transportadas en el viaje.',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-950/30',
          borderColor: 'border-green-200 dark:border-green-800/50'
        };
  };

  if (tripsError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
          <h3 className="text-red-800 dark:text-red-300 font-medium">Error al cargar viajes</h3>
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">
            No se pudieron cargar los viajes disponibles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Selección de Viaje */}
      <div>
        <label className="block text-sm font-medium text-dm-text-secondary mb-2">
          Seleccionar Viaje *
        </label>
        {isLoadingTrips ? (
          <div className="animate-pulse h-10 bg-dm-bg-secondary rounded-lg"></div>
        ) : availableTrips.length === 0 ? (
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-4">
            <div className="flex items-start">
              <InformationCircleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="text-yellow-800 dark:text-yellow-300 font-medium text-sm">
                  No hay viajes disponibles
                </h4>
                <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                  No existen viajes programados sin manifiesto generado. 
                  Primero debe programar un viaje desde el módulo de operaciones.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <select
            value={formData.trip_id}
            onChange={(e) => handleTripChange(e.target.value)}
            className="w-full px-3 py-2 border border-dm-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Seleccione un viaje...</option>
            {availableTrips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.route.origin_port.name} → {trip.route.destination_port.name} - {trip.departure_date} {trip.departure_time} - {trip.vessel.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Información del viaje seleccionado */}
      {selectedTrip && (
        <div className="bg-dm-bg-secondary border border-dm-border-primary rounded-lg p-4">
          <h4 className="font-medium text-dm-text-primary mb-3">Información del Viaje</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <MapPinIcon className="w-4 h-4 text-dm-text-muted mr-2" />
                <span className="text-dm-text-secondary">Ruta:</span>
                <span className="font-medium ml-1">
                  {selectedTrip.route.origin_port.name} → {selectedTrip.route.destination_port.name}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <CalendarDaysIcon className="w-4 h-4 text-dm-text-muted mr-2" />
                <span className="text-dm-text-secondary">Fecha:</span>
                <span className="font-medium ml-1">{selectedTrip.departure_date}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <ClockIcon className="w-4 h-4 text-dm-text-muted mr-2" />
                <span className="text-dm-text-secondary">Hora:</span>
                <span className="font-medium ml-1">{selectedTrip.departure_time}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-dm-text-secondary">Embarcación:</span>
                <span className="font-medium ml-1">{selectedTrip.vessel.name}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tipo de Manifiesto */}
      <div>
        <label className="block text-sm font-medium text-dm-text-secondary mb-3">
          Tipo de Manifiesto *
        </label>

        {/* Indicador de manifiesto existente */}
        {checkingExisting && (
          <div className="mb-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-blue-800 dark:text-blue-300 text-sm">Verificando manifiesto existente...</span>
            </div>
          </div>
        )}

        {existingManifest && (
          <div className="mb-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-amber-800 dark:text-amber-300 font-medium text-sm">
                  Manifiesto existente encontrado
                </h4>
                <p className="text-amber-700 dark:text-amber-300 text-xs mt-1 mb-2">
                  Ya existe un manifiesto {existingManifest.manifest_type === 'PASSENGER' ? 'de pasajeros' : 'de carga'} 
                  para este viaje (N° {existingManifest.manifest_number}).
                </p>
                <div className="text-xs text-amber-600 dark:text-amber-400">
                  <p>Creado: {new Date(existingManifest.created_at).toLocaleString()}</p>
                  {existingManifest.updated_at !== existingManifest.created_at && (
                    <p>Actualizado: {new Date(existingManifest.updated_at).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['PASSENGER', 'CARGO'] as const).map((type) => {
            const info = getManifestTypeInfo(type);
            const Icon = info.icon;
            
            return (
              <div key={type} className="relative">
                <input
                  type="radio"
                  id={`manifest-type-${type}`}
                  name="manifest_type"
                  value={type}
                  checked={formData.manifest_type === type}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    manifest_type: e.target.value as 'PASSENGER' | 'CARGO'
                  }))}
                  className="sr-only"
                />
                <label
                  htmlFor={`manifest-type-${type}`}
                  className={`block cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    formData.manifest_type === type
                      ? `${info.borderColor} ${info.bgColor}`
                      : 'border-dm-border-primary bg-dm-bg-primary hover:bg-dm-bg-hover'
                  }`}
                >
                  <div className="flex items-start">
                    <Icon className={`w-6 h-6 mr-3 mt-0.5 ${
                      formData.manifest_type === type ? info.color : 'text-dm-text-muted'
                    }`} />
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        formData.manifest_type === type ? info.color : 'text-dm-text-primary'
                      }`}>
                        {info.title}
                      </h3>
                      <p className="text-sm text-dm-text-secondary mt-1">
                        {info.description}
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-sm font-medium text-dm-text-secondary mb-2">
          Observaciones (Opcional)
        </label>
        <textarea
          value={formData.observations}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            observations: e.target.value
          }))}
          rows={3}
          className="w-full px-3 py-2 border border-dm-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ingrese observaciones adicionales sobre el manifiesto..."
        />
        <p className="text-xs text-dm-text-muted mt-1">
          Máximo 500 caracteres
        </p>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-dm-border-primary">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        
        {existingManifest ? (
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !formData.trip_id || availableTrips.length === 0}
            className="min-w-[140px] bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            {isLoading ? 'Regenerando...' : 'Regenerar Manifiesto'}
          </Button>
        ) : (
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !formData.trip_id || availableTrips.length === 0}
            className="min-w-[120px]"
          >
            {isLoading ? 'Generando...' : 'Generar Manifiesto'}
          </Button>
        )}
      </div>
    </form>
  );
};

export default ManifestForm;
