// src/features/quotations/pages/QuotationFormPage.tsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Breadcrumbs from '../../../components/common/Breadcrumbs';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { useQuotations } from '../hooks/useQuotations';
import { QuotationCreate, QuotationItemCreate } from '../types';

export const QuotationFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { createQuotation, loading } = useQuotations();

  const [formData, setFormData] = useState<QuotationCreate>({
    client_id: 0,
    document_type_code: 'COT',
    series: 'COT1',
    issue_date: new Date().toISOString().split('T')[0],
    issue_time: new Date().toISOString(),
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    operation_type_code: '0101',
    currency_code: 'PEN',
    exchange_rate: 1,
    payment_terms: 'Contado',
    payment_method_code: '001',
    notes: '',
    internal_notes: '',
    items: []
  });

  const [currentItem, setCurrentItem] = useState<QuotationItemCreate>({
    product_id: 0,
    quantity: 1,
    item_description: '',
    unit_code: 'NIU',
    unit_price: 0,
    price_type_code: '01',
    discount: 0,
    tax_category_code: '10'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      toast.error('Debe agregar al menos un item a la cotización');
      return;
    }

    // Formatear los datos para asegurar máximo 10 decimales
    const formattedData = {
      ...formData,
      items: formData.items.map(item => ({
        ...item,
        unit_price: parseFloat(item.unit_price.toFixed(10)),
        discount: parseFloat(item.discount.toFixed(10))
      }))
    };

    const result = await createQuotation(formattedData);
    if (result) {
      toast.success('Cotización creada exitosamente');
      navigate('/sales/quotations');
    }
  };

  const addItem = () => {
    if (!currentItem.item_description || currentItem.unit_price <= 0) {
      toast.error('Complete los datos del item');
      return;
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { ...currentItem }]
    }));

    setCurrentItem({
      product_id: 0,
      quantity: 1,
      item_description: '',
      unit_code: 'NIU',
      unit_price: 0,
      price_type_code: '01',
      discount: 0,
      tax_category_code: '10'
    });
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs />
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          {isEditing ? 'Editar Cotización' : 'Nueva Cotización'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Información Básica</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Serie"
              value={formData.series}
              onChange={(e) => setFormData(prev => ({ ...prev, series: e.target.value }))}
              required
            />
            <Input
              label="Fecha de Emisión"
              type="date"
              value={formData.issue_date}
              onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
              required
            />
            <Input
              label="Válida Hasta"
              type="date"
              value={formData.valid_until}
              onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moneda
              </label>
              <select
                value={formData.currency_code}
                onChange={(e) => setFormData(prev => ({ ...prev, currency_code: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="PEN">Soles (PEN)</option>
                <option value="USD">Dólares (USD)</option>
              </select>
            </div>
            <Input
              label="Términos de Pago"
              value={formData.payment_terms}
              onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
              placeholder="Ej: Contado, 30 días"
            />
          </div>
        </div>

        {/* Agregar items */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Agregar Item</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Descripción"
              value={currentItem.item_description}
              onChange={(e) => setCurrentItem(prev => ({ ...prev, item_description: e.target.value }))}
              placeholder="Descripción del servicio/producto"
            />
            <Input
              label="Cantidad"
              type="number"
              value={currentItem.quantity}
              onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
              min="1"
            />
            <Input
              label="Precio Unitario"
              type="number"
              step="0.01"
              value={currentItem.unit_price}
              onChange={(e) => setCurrentItem(prev => ({ ...prev, unit_price: Number(e.target.value) }))}
              min="0"
            />
            <Button type="button" onClick={addItem} className="self-end">
              Agregar Item
            </Button>
          </div>
        </div>

        {/* Lista de items */}
        {formData.items.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Items de la Cotización</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Descripción</th>
                    <th className="px-4 py-2 text-center">Cantidad</th>
                    <th className="px-4 py-2 text-right">Precio</th>
                    <th className="px-4 py-2 text-right">Subtotal</th>
                    <th className="px-4 py-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">{item.item_description}</td>
                      <td className="px-4 py-2 text-center">{item.quantity}</td>
                      <td className="px-4 py-2 text-right">{item.unit_price.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">
                        {(item.quantity * item.unit_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-red-600"
                        >
                          Eliminar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Notas */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Notas</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas para el Cliente
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Notas que aparecerán en la cotización"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas Internas
              </label>
              <textarea
                value={formData.internal_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, internal_notes: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Notas internas (no aparecen en la cotización)"
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/sales/quotations')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')} Cotización
          </Button>
        </div>
      </form>
    </div>
  );
};
