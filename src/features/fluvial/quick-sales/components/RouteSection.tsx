// src/features/fluvial/quick-sales/components/RouteSection.tsx

import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';

interface RouteSectionProps {
  origin: string;
  destination: string;
  onOriginChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  originSuggestions: string[];
  destinationSuggestions: string[];
  disabled?: boolean;
}

export const RouteSection: React.FC<RouteSectionProps> = ({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  originSuggestions,
  destinationSuggestions,
  disabled = false,
}) => {
  const [originPreview, setOriginPreview] = useState('');
  const [destinationPreview, setDestinationPreview] = useState('');

  // Obtener la primera sugerencia que coincida
  const getPreview = (value: string, suggestions: string[]): string => {
    if (!value.trim()) return '';
    const match = suggestions.find(s => s.toLowerCase().startsWith(value.toLowerCase()));
    return match ? match.slice(value.length) : '';
  };

  // Actualizar preview cuando cambia el valor
  useEffect(() => {
    setOriginPreview(getPreview(origin, originSuggestions));
  }, [origin, originSuggestions]);

  useEffect(() => {
    setDestinationPreview(getPreview(destination, destinationSuggestions));
  }, [destination, destinationSuggestions]);

  // Manejar tecla Tab o flecha derecha para autocompletar
  const handleOriginKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && originPreview) {
      e.preventDefault();
      onOriginChange(origin + originPreview);
      setOriginPreview('');
    }
  };

  const handleDestinationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && destinationPreview) {
      e.preventDefault();
      onDestinationChange(destination + destinationPreview);
      setDestinationPreview('');
    }
  };

  return (
    <div className="bg-dm-bg-primary p-6 rounded-lg shadow-sm border border-dm-border-primary">
      <h3 className="font-semibold text-lg text-dm-text-primary mb-4 flex items-center">
        <FileText className="h-5 w-5 mr-2 text-dm-text-secondary" />
        Ruta (Opcional)
      </h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Origen */}
        <div>
          <label className="block text-sm font-medium text-dm-text-secondary mb-2">
            Origen
          </label>
          <div className="relative">
            <input
              type="text"
              value={origin}
              onChange={(e) => onOriginChange(e.target.value)}
              onKeyDown={handleOriginKeyDown}
              placeholder="Ej: Nauta, Iquitos..."
              disabled={disabled}
              className="w-full px-4 py-2 border border-dm-border-primary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-dm-bg-secondary relative z-10 bg-transparent"
            />
            {/* Preview en gris */}
            {originPreview && (
              <div className="absolute left-0 top-0 w-full px-4 py-2 pointer-events-none flex items-center">
                <span className="invisible">{origin}</span>
                <span className="text-dm-text-muted">{originPreview}</span>
              </div>
            )}
          </div>
          {originSuggestions.length > 0 && origin && (
            <p className="text-xs text-dm-text-muted mt-1">
              Presiona Tab o → para autocompletar
            </p>
          )}
        </div>

        {/* Destino */}
        <div>
          <label className="block text-sm font-medium text-dm-text-secondary mb-2">
            Destino
          </label>
          <div className="relative">
            <input
              type="text"
              value={destination}
              onChange={(e) => onDestinationChange(e.target.value)}
              onKeyDown={handleDestinationKeyDown}
              placeholder="Ej: Yurimaguas, Requena..."
              disabled={disabled}
              className="w-full px-4 py-2 border border-dm-border-primary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-dm-bg-secondary relative z-10 bg-transparent"
            />
            {/* Preview en gris */}
            {destinationPreview && (
              <div className="absolute left-0 top-0 w-full px-4 py-2 pointer-events-none flex items-center">
                <span className="invisible">{destination}</span>
                <span className="text-dm-text-muted">{destinationPreview}</span>
              </div>
            )}
          </div>
          {destinationSuggestions.length > 0 && destination && (
            <p className="text-xs text-dm-text-muted mt-1">
              Presiona Tab o → para autocompletar
            </p>
          )}
        </div>
      </div>
      
      {origin.trim() && destination.trim() && (
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 rounded-lg">
          <p className="text-sm text-purple-800">
            <span className="font-medium">Ruta seleccionada:</span>{' '}
            {origin.trim()} {'>'} {destination.trim()}
          </p>
        </div>
      )}
    </div>
  );
};
