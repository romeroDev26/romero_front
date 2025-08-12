import React from 'react';

interface ServiceOption {
  id: string;
  name: string;
}

interface ServiceSelectorProps {
  selectedService: string;
  serviceOptions: ServiceOption[];
  onServiceSelect: (serviceId: string) => void;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedService,
  serviceOptions,
  onServiceSelect
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Servicio</label>
      <select
        value={selectedService}
        onChange={(e) => onServiceSelect(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Seleccionar...</option>
        {serviceOptions.map(service => (
          <option key={service.id} value={service.id}>{service.name}</option>
        ))}
      </select>
    </div>
  );
};
