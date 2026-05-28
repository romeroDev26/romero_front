import React from 'react';
import { ProductService } from '../../../types';

interface ServiceSelectorProps {
  selectedService: ProductService | null;
  serviceOptions: ProductService[];
  onServiceSelect: (service: ProductService) => void;
  loading?: boolean;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedService,
  serviceOptions,
  onServiceSelect,
  loading = false
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-dm-text-secondary mb-2">
        Tipo de Servicio *
      </label>
      <select
        value={selectedService ? selectedService.id : ''}
        onChange={(e) => {
          const selected = serviceOptions.find(s => s.id === Number(e.target.value));
          if (selected) onServiceSelect(selected);
        }}
        disabled={loading}
        className="w-full border border-dm-border-primary rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-dm-bg-secondary disabled:cursor-not-allowed"
      >
        <option value="">
          {loading ? 'Cargando servicios...' : 'Seleccionar servicio...'}
        </option>
        {serviceOptions.map(service => (
          <option key={service.id} value={service.id}>
            {service.name}
          </option>
        ))}
      </select>
      {selectedService && (
        <p className="mt-1 text-xs text-dm-text-muted">
          Código: {selectedService.internal_code || 'N/A'} | 
          Unidad: {selectedService.unit_code}
        </p>
      )}
    </div>
  );
};
