// src/features/sales/pages/QuotationFormPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale';

import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';

// Estos servicios tendrían que ser implementados
// import { clientsService } from '../../../services/clients.service';
// import { productsService } from '../../../services/products.service';
// import { quotationsService } from '../../../services/quotations.service';

const quotationItemSchema = z.object({
  product_id: z.number({
    required_error: 'Producto es requerido',
  }),
  description: z.string().min(3, 'Descripción es requerida'),
  quantity: z.number().positive('Cantidad debe ser mayor a 0'),
  unit_price: z.number().positive('Precio unitario debe ser mayor a 0'),
  discount: z.number().min(0, 'Descuento no puede ser negativo').default(0),
  subtotal: z.number().optional(),
  tax_amount: z.number().optional(),
  total_line: z.number().optional(),
});

const quotationSchema = z.object({
  client_id: z.number({
    required_error: 'Cliente es requerido',
  }),
  series: z.string().min(1, 'Serie es requerida'),
  issue_date: z.date({
    required_error: 'Fecha de emisión es requerida',
  }),
  expiry_date: z.date().optional(),
  currency_code: z.string().default('PEN'),
  items: z.array(quotationItemSchema).min(1, 'Debe agregar al menos un ítem'),
  notes: z.string().optional(),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

export const QuotationFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id && id !== 'new';
  
  const [showPreview, setShowPreview] = useState(false);
  const [calculatedTotals, setCalculatedTotals] = useState({
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0,
  });
  
  // En un proyecto real, estos datos vendrían de una API
  // const { data: clients, isLoading: isLoadingClients } = useQuery(['clients'], clientsService.getAll);
  // const { data: products, isLoading: isLoadingProducts } = useQuery(['products'], productsService.getAll);
  // const { data: quotation, isLoading: isLoadingQuotation } = useQuery(
  //   ['quotation', id],
  //   () => quotationsService.getById(Number(id)),
  //   { enabled: isEditing }
  // );
  
  // Datos simulados para el ejemplo
  const clients = [
    { id: 1, name: 'Empresa ABC S.A.C.', doc_number: '20123456789', doc_type: '6' },
    { id: 2, name: 'Distribuidora XYZ E.I.R.L.', doc_number: '20987654321', doc_type: '6' },
    { id: 3, name: 'Juan Pérez', doc_number: '12345678', doc_type: '1' },
  ];
  
  const products = [
    { id: 1, name: 'Servicio de Transporte Local', internal_code: 'ST001', unit_code: 'ZZ', sale_price: 350.00 },
    { id: 2, name: 'Servicio de Transporte Interprovincial', internal_code: 'ST002', unit_code: 'ZZ', sale_price: 850.00 },
    { id: 3, name: 'Servicio de Transporte de Carga', internal_code: 'ST003', unit_code: 'ZZ', sale_price: 450.00 },
    { id: 4, name: 'Servicio de Alquiler de Vehículo', internal_code: 'ST004', unit_code: 'ZZ', sale_price: 300.00 },
  ];
  
  const quotation = isEditing ? {
    id: 1,
    series: 'COT',
    number: 1001,
    client_id: 1,
    issue_date: '2025-04-15',
    expiry_date: '2025-04-30',
    currency_code: 'PEN',
    total_amount: 1250.50,
    status: 'DRAFT',
    notes: 'Cotización para servicio mensual',
    items: [
      {
        id: 1,
        product_id: 1,
        description: 'Servicio de Transporte Local',
        quantity: 2,
        unit_price: 350.00,
        discount: 0,
        subtotal: 700.00,
        tax_amount: 126.00,
        total_line: 826.00
      },
      {
        id: 2,
        product_id: 4,
        description: 'Servicio de Alquiler de Vehículo',
        quantity: 1,
        unit_price: 300.00,
        discount: 0,
        subtotal: 300.00,
        tax_amount: 54.00,
        total_line: 354.00
      }
    ]
  } : null;
  
  const isLoadingClients = false;
  const isLoadingProducts = false;
  const isLoadingQuotation = false;
  
  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      series: 'COT',
      issue_date: new Date(),
      expiry_date: new Date(new Date().setDate(new Date().getDate() + 15)),
      currency_code: 'PEN',
      items: [{
        product_id: 0,
        description: '',
        quantity: 1,
        unit_price: 0,
        discount: 0,
        subtotal: 0,
        tax_amount: 0,
        total_line: 0,
      }],
    },
  });
  
  // Field array para manejar los items
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });
  
  // Cargar datos para edición
  useEffect(() => {
    if (isEditing && quotation) {
      reset({
        client_id: quotation.client_id,
        series: quotation.series,
        issue_date: new Date(quotation.issue_date),
        expiry_date: quotation.expiry_date ? new Date(quotation.expiry_date) : undefined,
        currency_code: quotation.currency_code,
        notes: quotation.notes,
        items: quotation.items.map(item => ({
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          subtotal: item.subtotal,
          tax_amount: item.tax_amount,
          total_line: item.total_line,
        })),
      });
    }
  }, [isEditing, quotation, reset]);
  
  // Observar cambios en items para recalcular totales
  const items = watch('items');
  const currencyCode = watch('currency_code');
  
  // Calcular totales al cambiar los items
  useEffect(() => {
    let subtotal = 0;
    let tax_amount = 0;
    let total_amount = 0;
    
    items.forEach((item, index) => {
      if (!item.quantity || !item.unit_price) return;
      
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unit_price);
      const discount = Number(item.discount) || 0;
      
      // Calcular subtotal de línea
      const itemSubtotal = quantity * unitPrice - discount;
      setValue(`items.${index}.subtotal`, Number(itemSubtotal.toFixed(2)));
      
      // Calcular IGV
      const itemTax = itemSubtotal * 0.18;
      setValue(`items.${index}.tax_amount`, Number(itemTax.toFixed(2)));
      
      // Calcular total de línea
      const itemTotal = itemSubtotal + itemTax;
      setValue(`items.${index}.total_line`, Number(itemTotal.toFixed(2)));
      
      // Acumular totales
      subtotal += itemSubtotal;
      tax_amount += itemTax;
      total_amount += itemTotal;
    });
    
    setCalculatedTotals({
      subtotal: Number(subtotal.toFixed(2)),
      tax_amount: Number(tax_amount.toFixed(2)),
      total_amount: Number(total_amount.toFixed(2)),
    });
  }, [items, setValue]);
  
  // Manejar selección de producto
  const handleProductSelection = (index: number, productId: number) => {
    if (!products) return;
    
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      setValue(`items.${index}.description`, selectedProduct.name);
      setValue(`items.${index}.unit_price`, selectedProduct.sale_price);
    }
  };
  
  // Agregar nuevo item
  const handleAddItem = () => {
    append({
      product_id: 0,
      description: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
      subtotal: 0,
      tax_amount: 0,
      total_line: 0,
    });
  };
  
  // Enviar formulario
  const onSubmit = (data: QuotationFormData) => {
    const completeData = {
      ...data,
      total_amount: calculatedTotals.total_amount,
    };
    
    // En un proyecto real, llamarías a una API
    // if (isEditing) {
    //   quotationsService.update(Number(id), completeData);
    // } else {
    //   quotationsService.create(completeData);
    // }
    
    console.log('Guardando cotización:', completeData);
    navigate('/sales/quotations');
  };
  
  // Mostrar loading si se están cargando datos
  if (isLoadingClients || isLoadingProducts || (isEditing && isLoadingQuotation)) {
    return <Spinner />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Cotización' : 'Nueva Cotización'}
        </h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Sección de cabecera */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Serie-Número */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número
              </label>
              <div className="flex">
                <input
                  type="text"
                  {...register('series')}
                  className="w-20 rounded-l-md border-gray-300 shadow-sm p-2 border"
                  readOnly={isEditing}
                />
                <span className="px-3 inline-flex items-center border-t border-b border-gray-300 bg-gray-50 text-gray-500">
                  -
                </span>
                <input
                  type="text"
                  value={isEditing ? quotation?.number.toString().padStart(4, '0') : 'NUEVO'}
                  className="rounded-r-md border-gray-300 shadow-sm p-2 border bg-gray-50"
                  readOnly
                />
              </div>
            </div>
            
            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente *
              </label>
              <select
                {...register('client_id', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                disabled={isEditing}
              >
                <option value="">Seleccione un cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.doc_number}
                  </option>
                ))}
              </select>
              {errors.client_id && (
                <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>
              )}
            </div>
            
            {/* Moneda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moneda
              </label>
              <select
                {...register('currency_code')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              >
                <option value="PEN">PEN - Soles</option>
                <option value="USD">USD - Dólares</option>
              </select>
            </div>
            
            {/* Fecha de Emisión */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Emisión *
              </label>
              <Controller
                control={control}
                name="issue_date"
                render={({ field }) => (
                  <DatePicker
                    selected={field.value}
                    onChange={(date) => field.onChange(date)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    dateFormat="dd/MM/yyyy"
                    locale={es}
                  />
                )}
              />
              {errors.issue_date && (
                <p className="mt-1 text-sm text-red-600">{errors.issue_date.message}</p>
              )}
            </div>
            
            {/* Fecha de Expiración */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Vencimiento
              </label>
              <Controller
                control={control}
                name="expiry_date"
                render={({ field }) => (
                  <DatePicker
                    selected={field.value}
                    onChange={(date) => field.onChange(date)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    dateFormat="dd/MM/yyyy"
                    locale={es}
                  />
                )}
              />
              {errors.expiry_date && (
                <p className="mt-1 text-sm text-red-600">{errors.expiry_date.message}</p>
              )}
            </div>
          </div>
          
          {/* Sección de items */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Detalle de Cotización</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio Unit.
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descuento
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IGV
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fields.map((field, index) => (
                    <tr key={field.id}>
                      {/* Producto */}
                      <td className="px-3 py-2">
                        <select
                          {...register(`items.${index}.product_id`, { 
                            valueAsNumber: true,
                            onChange: (e) => handleProductSelection(index, parseInt(e.target.value)) 
                          })}
                          className="block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                        >
                          <option value="">Seleccione</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.internal_code} - {product.name}
                            </option>
                          ))}
                        </select>
                        {errors.items?.[index]?.product_id && (
                          <p className="text-xs text-red-600">{errors.items[index]?.product_id?.message}</p>
                        )}
                      </td>
                      
                      {/* Descripción */}
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          {...register(`items.${index}.description`)}
                          className="block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                        />
                        {errors.items?.[index]?.description && (
                          <p className="text-xs text-red-600">{errors.items[index]?.description?.message}</p>
                        )}
                      </td>
                      
                      {/* Cantidad */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                          className="block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                        />
                        {errors.items?.[index]?.quantity && (
                          <p className="text-xs text-red-600">{errors.items[index]?.quantity?.message}</p>
                        )}
                      </td>
                      
                      {/* Precio Unitario */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                          className="block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                        />
                        {errors.items?.[index]?.unit_price && (
                          <p className="text-xs text-red-600">{errors.items[index]?.unit_price?.message}</p>
                        )}
                      </td>
                      
                      {/* Descuento */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`items.${index}.discount`, { valueAsNumber: true })}
                          className="block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                        />
                      </td>
                      
                      {/* Subtotal (calculado) */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          disabled
                          value={watch(`items.${index}.subtotal`) || 0}
                          className="block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm p-2 border text-sm"
                        />
                      </td>
                      
                      {/* IGV (calculado) */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          disabled
                          value={watch(`items.${index}.tax_amount`) || 0}
                          className="block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm p-2 border text-sm"
                        />
                      </td>
                      
                      {/* Total (calculado) */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          disabled
                          value={watch(`items.${index}.total_line`) || 0}
                          className="block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm p-2 border text-sm"
                        />
                      </td>
                      
                      {/* Acciones */}
                      <td className="px-3 py-2">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddItem}
              >
                Agregar Ítem
              </Button>
            </div>
          </div>
          
          {/* Sección de Totales */}
          <div className="mt-6 flex justify-end">
            <div className="w-72 bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between py-1">
                <span>Subtotal:</span>
                <span className="font-medium">
                  {currencyCode === 'PEN' ? 'S/ ' : '$ '}
                  {calculatedTotals.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>IGV (18%):</span>
                <span className="font-medium">
                  {currencyCode === 'PEN' ? 'S/ ' : '$ '}
                  {calculatedTotals.tax_amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-t border-gray-300 mt-1 pt-2">
                <span className="font-semibold">TOTAL:</span>
                <span className="font-bold">
                  {currencyCode === 'PEN' ? 'S/ ' : '$ '}
                  {calculatedTotals.total_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Sección de Notas */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              placeholder="Notas adicionales para la cotización"
            ></textarea>
          </div>
          
          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/sales/quotations')}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPreview(true)}
            >
              Vista Previa
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
            >
              {isEditing ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
      
      {/* Modal de Vista Previa */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Vista Previa de Cotización"
        maxWidth="lg"
      >
        <div className="p-6">
          {/* Aquí iría el contenido de la vista previa */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">COTIZACIÓN</h2>
            <p className="text-lg">{watch('series')}-{isEditing ? quotation?.number.toString().padStart(4, '0') : 'NUEVO'}</p>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">Cliente:</p>
                <p>{clients.find(c => c.id === watch('client_id'))?.name}</p>
                <p>RUC/DNI: {clients.find(c => c.id === watch('client_id'))?.doc_number}</p>
              </div>
              <div>
                <p><span className="font-semibold">Fecha de Emisión:</span> {watch('issue_date')?.toLocaleDateString()}</p>
                <p><span className="font-semibold">Válido hasta:</span> {watch('expiry_date')?.toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200 mb-6">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio Unit.
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {watch('items').map((item, index) => (
                <tr key={index}>
                  <td className="px-3 py-2">{item.description}</td>
                  <td className="px-3 py-2 text-right">{item.quantity}</td>
                  <td className="px-3 py-2 text-right">
                    {watch('currency_code') === 'PEN' ? 'S/ ' : '$ '}
                    {Number(item.unit_price).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {watch('currency_code') === 'PEN' ? 'S/ ' : '$ '}
                    {Number(item.subtotal).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="flex justify-end mb-6">
            <div className="w-64">
              <div className="flex justify-between py-1">
                <span>Subtotal:</span>
                <span>
                  {watch('currency_code') === 'PEN' ? 'S/ ' : '$ '}
                  {calculatedTotals.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>IGV (18%):</span>
                <span>
                  {watch('currency_code') === 'PEN' ? 'S/ ' : '$ '}
                  {calculatedTotals.tax_amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 font-bold border-t border-gray-300 mt-1 pt-1">
                <span>TOTAL:</span>
                <span>
                  {watch('currency_code') === 'PEN' ? 'S/ ' : '$ '}
                  {calculatedTotals.total_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          {watch('notes') && (
            <div className="mt-4">
              <p className="font-semibold">Observaciones:</p>
              <p>{watch('notes')}</p>
            </div>
          )}
          
          <div className="text-center text-sm text-gray-500 mt-6 border-t border-gray-200 pt-4">
            <p>Transportes Romero S.A.C. - RUC 20123456789</p>
            <p>Av. Principal 123, Iquitos - Teléfono: 065-234567</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
