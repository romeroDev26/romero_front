import React from 'react';


// El tipo de servicio debe coincidir con el objeto usado en QuotationNewPage
export interface ServiceOption {
  id: number;
  internal_code: string;
  name: string;
  description: string;
  item_type: string;
  service_category: string;
  unit_code: string;
  purchase_price: string;
  sale_price: string;
  currency_code: string;
  tax_category_code: string;
  unspcs_code: string | null;
  specific_route_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ServiceSelectorProps {
  selectedService: ServiceOption | null;
  serviceOptions: ServiceOption[];
  onServiceSelect: (service: ServiceOption) => void;
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
        value={selectedService ? selectedService.id : ''}
        onChange={(e) => {
          const selected = serviceOptions.find(s => s.id === Number(e.target.value));
          if (selected) onServiceSelect(selected);
        }}
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
