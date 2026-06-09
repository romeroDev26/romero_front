import React, { useState, useEffect, useMemo } from 'react';
import { toast } from '@/utils/sileo-toast';
import { Button } from '../../../components/common/Button';
import { ProductService } from '../../../types';
import { SimpleItem } from './QuotationItemsManager';

// Unidades de medida
const UNITS = [
  { code: 'NIU', name: 'Unidad' },
  { code: 'KGM', name: 'Kilogramo' },
  { code: 'TNE', name: 'Tonelada' },
  { code: 'M3', name: 'Metro Cúbico' },
  { code: 'LTR', name: 'Litro' },
  { code: 'KTM', name: 'Kilómetro' },
  { code: 'HUR', name: 'Hora' },
  { code: 'ZZ', name: 'Servicios' }
];

interface QuotationItemFormProps {
  serviceOptions: ProductService[];
  servicesLoading: boolean;
  onAddItem: (item: SimpleItem) => void;
  onCancel: () => void;
}

export const QuotationItemForm: React.FC<QuotationItemFormProps> = ({
  serviceOptions,
  servicesLoading,
  onAddItem,
  onCancel,
}) => {
  const [selectedService, setSelectedService] = useState<ProductService | null>(null);

  const [form, setForm] = useState({
    cantidad: '1',
    unidad: 'NIU',
    descripcion: '',
    precio_unitario: '',
    descuento: '',
  });

  const parseNumber = (value: string): number => {
    if (value.trim() === '') return 0;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const cantidad = parseNumber(form.cantidad);
  const precioUnitario = parseNumber(form.precio_unitario);
  const descuento = parseNumber(form.descuento);

  const importeTotal = useMemo(() => {
    return cantidad * precioUnitario - descuento;
  }, [cantidad, precioUnitario, descuento]);

  // Prellenar campos cuando cambia el servicio seleccionado
  useEffect(() => {
    if (selectedService) {
      setForm((prev) => ({
        ...prev,
        descripcion: selectedService.name,
        unidad: selectedService.unit_code,
      }));
    }
  }, [selectedService]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleServiceChange = (serviceId: string) => {
    const service = serviceOptions.find((s) => s.id === Number(serviceId)) || null;
    setSelectedService(service);
  };

  const handleSubmit = () => {
    if (!selectedService) {
      toast.error('Debe seleccionar un tipo de servicio');
      return;
    }
    if (!form.descripcion.trim()) {
      toast.error('Ingrese una descripción para el item');
      return;
    }
    if (precioUnitario <= 0) {
      toast.error('El precio unitario debe ser mayor a 0');
      return;
    }
    if (descuento < 0) {
      toast.error('El descuento no puede ser negativo');
      return;
    }
    if (descuento > cantidad * precioUnitario) {
      toast.error('El descuento no puede ser mayor al importe total');
      return;
    }

    onAddItem({
      cantidad,
      unidad: form.unidad,
      descripcion: form.descripcion.trim(),
      precio_unitario: precioUnitario,
      descuento,
      importe_total: importeTotal,
      service_id: selectedService.id,
      service_name: selectedService.name,
    });

    // Reset form manteniendo la última unidad como fallback
    setSelectedService(null);
    setForm({
      cantidad: '1',
      unidad: 'NIU',
      descripcion: '',
      precio_unitario: '',
      descuento: '',
    });
  };

  const isValid =
    selectedService !== null &&
    form.descripcion.trim().length > 0 &&
    precioUnitario > 0;

  return (
    <div className="px-6 py-4 bg-dm-bg-secondary border-b border-dm-border-secondary space-y-4">
      {/* Servicio */}
      <div>
        <label className="block text-xs font-medium text-dm-text-muted mb-1">
          Tipo de Servicio *
        </label>
        <select
          value={selectedService ? selectedService.id : ''}
          onChange={(e) => handleServiceChange(e.target.value)}
          disabled={servicesLoading || serviceOptions.length === 0}
          className="w-full border border-dm-border-primary rounded-lg px-3 py-2 text-sm bg-dm-bg-primary text-dm-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-dm-bg-secondary disabled:cursor-not-allowed"
        >
          <option value="">
            {servicesLoading ? 'Cargando servicios...' : 'Seleccionar servicio...'}
          </option>
          {serviceOptions.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
        {selectedService && (
          <p className="mt-1 text-xs text-dm-text-muted">
            Código: {selectedService.internal_code || 'N/A'} | Unidad: {selectedService.unit_code}
          </p>
        )}
      </div>

      {/* Campos numéricos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-dm-text-muted mb-1">Cantidad</label>
          <input
            type="number"
            min="1"
            step="1"
            value={form.cantidad}
            onChange={(e) => handleChange('cantidad', e.target.value)}
            className="w-full border border-dm-border-primary rounded-lg px-3 py-2 text-sm bg-dm-bg-primary text-dm-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-dm-text-muted mb-1">Unidad</label>
          <select
            value={form.unidad}
            onChange={(e) => handleChange('unidad', e.target.value)}
            className="w-full border border-dm-border-primary rounded-lg px-3 py-2 text-sm bg-dm-bg-primary text-dm-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {UNITS.map((unit) => (
              <option key={unit.code} value={unit.code}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-dm-text-muted mb-1">Precio Unitario (S/)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.precio_unitario}
            onChange={(e) => handleChange('precio_unitario', e.target.value)}
            className="w-full border border-dm-border-primary rounded-lg px-3 py-2 text-sm bg-dm-bg-primary text-dm-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-dm-text-muted mb-1">Descuento (S/)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.descuento}
            onChange={(e) => handleChange('descuento', e.target.value)}
            className="w-full border border-dm-border-primary rounded-lg px-3 py-2 text-sm bg-dm-bg-primary text-dm-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Descripción + Total + Botones */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-dm-text-muted mb-1">Descripción</label>
          <input
            type="text"
            value={form.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            placeholder="Descripción del producto o servicio..."
            className="w-full border border-dm-border-primary rounded-lg px-3 py-2 text-sm bg-dm-bg-primary text-dm-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="flex flex-col justify-end gap-1.5">
          <p className="text-xs text-dm-text-muted text-right">
            Total:{' '}
            <span className="font-semibold text-dm-text-primary">
              S/ {importeTotal.toFixed(2)}
            </span>
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid}
              size="sm"
              className="flex-1"
            >
              Agregar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
