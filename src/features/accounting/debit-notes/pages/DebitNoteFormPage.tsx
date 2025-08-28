// src/features/accounting/debit-notes/pages/DebitNoteFormPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller, SubmitHandler, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';

import { Button } from '../../../../components/common/Button';
import { Modal } from '../../../../components/common/Modal';
import { useCreateDebitNote } from '../hooks/useDebitNotes';
import { DebitNoteCreateData } from '../../types';
import { useServicesData } from '../../../fluvial/hooks/useProductsServicesData';

// Catálogo de motivos de nota de débito (SUNAT catálogo 10)
const DEBIT_NOTE_REASONS = [
  { code: '01', description: 'Intereses por mora' },
  { code: '02', description: 'Aumento en el valor' },
  { code: '03', description: 'Penalidades/otros conceptos' },
  { code: '11', description: 'Ajustes de operaciones de exportación' },
  { code: '12', description: 'Ajustes afectos al IVAP' },
];

// Valores por defecto para nuevos items
const DEFAULT_ITEM = {
  product_id: 0,
  quantity: 1,
  unit_code: 'NIU',
  unit_price: 0,
  price_with_tax: 0,
  price_type_code: '01',
  tax_category_code: '10', // Por defecto gravado, se cambiará según el switch
};

const debitNoteSchema = z.object({
  client_id: z.number().min(1, 'ID de cliente requerido'),
  series: z.string().min(1, 'Serie requerida'),
  affected_document_type_code: z.string().min(1, 'Tipo de documento afectado requerido'),
  affected_document_series_number: z.string().min(1, 'Número de serie del documento afectado requerido'),
  debit_note_type_code: z.string().min(1, 'Tipo de nota de débito requerido'),
  reason: z.string().min(5, 'Razón debe tener al menos 5 caracteres'),
  items: z.array(z.object({
    product_id: z.number(),
    quantity: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
    unit_code: z.string().min(1, 'Código de unidad requerido'),
    unit_price: z.number().min(0, 'Precio unitario debe ser mayor o igual a 0'),
    price_with_tax: z.number().min(0, 'Precio con impuesto debe ser mayor o igual a 0'),
    price_type_code: z.string().min(1, 'Código de tipo de precio requerido'),
    tax_category_code: z.string().min(1, 'Código de categoría de impuesto requerido'),
  })).min(1, 'Debe incluir al menos un ítem'),
});

type DebitNoteFormData = z.infer<typeof debitNoteSchema>;

export const DebitNoteFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { affectedInvoice: initialAffectedInvoice } = (location.state as { affectedInvoice?: any }) || {};

  // Intentar obtener desde sessionStorage si no viene en el state
  const getAffectedInvoice = () => {
    if (initialAffectedInvoice && (initialAffectedInvoice.client_id || initialAffectedInvoice.client?.id)) {
      return initialAffectedInvoice;
    }
    
    // Intentar desde sessionStorage
    const stored = sessionStorage.getItem('debitNoteAffectedInvoice');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // Validar que los datos sean válidos
        if (parsed.client_id && parsed.client_id !== 0) {
          return parsed;
        } else {
          sessionStorage.removeItem('debitNoteAffectedInvoice'); // Limpiar datos inválidos
        }
      } catch (error) {
        sessionStorage.removeItem('debitNoteAffectedInvoice'); // Limpiar datos corruptos
      }
    }
    
    return initialAffectedInvoice;
  };

  const finalAffectedInvoice = getAffectedInvoice();

  // Función para obtener client_id válido de múltiples fuentes
  const getValidClientId = (affectedInvoice: any) => {
    // Prioridad: client_id directo > client.id > 0 como fallback
    if (affectedInvoice?.client_id && affectedInvoice.client_id !== 0) {
      return affectedInvoice.client_id;
    }
    if (affectedInvoice?.client?.id && affectedInvoice.client.id !== 0) {
      return affectedInvoice.client.id;
    }
    console.warn('No valid client_id found in affected invoice:', affectedInvoice);
    return 0;
  };

  // Función para limpiar datos de sessionStorage si son inválidos
  const clearInvalidSessionData = () => {
    try {
      const stored = sessionStorage.getItem('debitNoteAffectedInvoice');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.client_id || parsed.client_id === 0) {
          sessionStorage.removeItem('debitNoteAffectedInvoice');
        }
      }
    } catch (error) {
      sessionStorage.removeItem('debitNoteAffectedInvoice');
    }
  };

  // Limpiar datos inválidos al montar el componente
  useEffect(() => {
    clearInvalidSessionData();
  }, []);

  const [companyId] = useState(1);
  const { mutate: createDebitNote, isPending } = useCreateDebitNote();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [preparedPayload, setPreparedPayload] = useState<DebitNoteCreateData | null>(null);
  const [igvEnabled, setIgvEnabled] = useState(true); // Estado para controlar IGV

  const { control, handleSubmit, setValue, formState: { errors }, trigger } = useForm<DebitNoteFormData>({
    resolver: zodResolver(debitNoteSchema),
    defaultValues: {
      client_id: getValidClientId(finalAffectedInvoice),
      series: 'FD01',
      affected_document_type_code: finalAffectedInvoice?.document_type_code || '01',
      affected_document_series_number: finalAffectedInvoice ? `${finalAffectedInvoice.series}-${String(finalAffectedInvoice.number).padStart(8,'0')}` : '',
      debit_note_type_code: '02',
      reason: finalAffectedInvoice ? `Cargo adicional sobre ${finalAffectedInvoice.series}-${String(finalAffectedInvoice.number).padStart(8,'0')}` : '',
      items: [{ ...DEFAULT_ITEM }],
    }
  });

  // Debug: verificar el state recibido y actualizar client_id si es necesario
  useEffect(() => {
    if (finalAffectedInvoice) {
      // Actualizar client_id en el formulario si tenemos una factura válida
      const validClientId = getValidClientId(finalAffectedInvoice);
      setValue('client_id', validClientId);
      
      // También actualizar otros campos si es necesario
      if (finalAffectedInvoice.document_type_code) {
        setValue('affected_document_type_code', finalAffectedInvoice.document_type_code);
      }
      if (finalAffectedInvoice.series && finalAffectedInvoice.number) {
        const seriesNumber = `${finalAffectedInvoice.series}-${String(finalAffectedInvoice.number).padStart(8,'0')}`;
        setValue('affected_document_series_number', seriesNumber);
        setValue('reason', `Cargo adicional sobre ${seriesNumber}`);
      }
    }
  }, [location.state, initialAffectedInvoice, finalAffectedInvoice, setValue]);

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = useWatch({ control, name: 'items' }) as any[] || [];
  const { data: availableServices = [], isLoading: isLoadingServices } = useServicesData({ is_active: true });

  // Crear opciones para el select de servicios
  const serviceOptions = availableServices.map(service => ({
    value: service.id,
    label: `${service.name} - S/ ${Number(service.sale_price).toFixed(2)}`,
    service: service
  }));

  const originalAmount = finalAffectedInvoice ? parseFloat(String(finalAffectedInvoice.total_payable || 0)) : 0;
  const additionalTotal = watchedItems.reduce((acc, it) => acc + ((parseFloat(String(it?.price_with_tax || 0)) || 0) * (parseFloat(String(it?.quantity || 1)) || 1)), 0);
  const newTotal = originalAmount + additionalTotal;

  // Calcular IGV aplicado en los cargos adicionales
  const igvAmount = igvEnabled ? watchedItems.reduce((acc, it) => {
    const unitPrice = parseFloat(String(it?.unit_price || 0)) || 0;
    const quantity = parseFloat(String(it?.quantity || 1)) || 1;
    return acc + (unitPrice * quantity * 0.18);
  }, 0) : 0;

  const onSubmit: SubmitHandler<DebitNoteFormData> = async (data) => {
    // Verificar si tenemos la información necesaria
    if (!finalAffectedInvoice) {
      return;
    }

    // Corregir el client_id antes de la validación
    let validClientId = data.client_id;
    
    // Intentar obtener un client_id válido de diferentes fuentes
    if (data.client_id === 0 || !data.client_id) {
      if (finalAffectedInvoice.client_id && finalAffectedInvoice.client_id !== 0) {
        validClientId = finalAffectedInvoice.client_id;
      } else if (finalAffectedInvoice.client?.id && finalAffectedInvoice.client.id !== 0) {
        validClientId = finalAffectedInvoice.client.id;
      } else {
        alert('Error: No se pudo obtener un ID de cliente válido. Verifique que la factura seleccionada tenga un cliente asociado.');
        return;
      }
      
      // Actualizar el valor en el formulario
      setValue('client_id', validClientId);
      data.client_id = validClientId;
    }
    
    // Verificar si hay errores de validación después de corregir el client_id
    const isValid = await trigger();
    
    if (!isValid) {
      return;
    }
    
    // Validar que todos los campos requeridos estén presentes
    if (!data.client_id || data.client_id === 0) {
      alert('Error: No se pudo obtener un ID de cliente válido. Verifique la factura seleccionada.');
      return;
    }

    if (!data.series) {
      alert('Error: La serie es requerida.');
      return;
    }

    if (!data.items || data.items.length === 0) {
      alert('Error: Debe agregar al menos un ítem.');
      return;
    }

    // Validar que todos los items tengan datos válidos
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!item.quantity || item.quantity <= 0) {
        alert(`Error: El ítem ${i + 1} debe tener una cantidad mayor a 0.`);
        return;
      }
      if (!item.unit_price || item.unit_price < 0) {
        alert(`Error: El ítem ${i + 1} debe tener un precio unitario válido.`);
        return;
      }
      if (!item.price_with_tax || item.price_with_tax < 0) {
        alert(`Error: El ítem ${i + 1} debe tener un precio con impuesto válido.`);
        return;
      }
    }

    // Obtener fecha y hora actuales
    const now = new Date();
    const issue_date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const issue_time = now.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS

    const payload: DebitNoteCreateData = {
      company_id: companyId,
      client_id: data.client_id,
      document_type_code: '08', // Siempre 08 para notas de débito
      series: data.series,
      issue_date,
      issue_time,
      currency_code: 'PEN',
      affected_document_type_code: data.affected_document_type_code,
      affected_document_series_number: data.affected_document_series_number,
      debit_note_type_code: data.debit_note_type_code,
      reason: data.reason,
      items: data.items.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_code: i.unit_code,
        unit_price: i.unit_price,
        price_with_tax: i.price_with_tax,
        price_type_code: i.price_type_code,
        tax_category_code: igvEnabled ? '10' : '20', // 10=Gravado, 20=Exonerado
      })),
    };

    setPreparedPayload(payload);
    setShowConfirmModal(true);
  };

  const confirmCreate = () => {
    if (!preparedPayload) {
      return;
    }
    
    createDebitNote(preparedPayload, {
      onSuccess: (_data) => {
        setShowConfirmModal(false);
        navigate('/accounting/debit-notes');
      },
      onError: (_error) => {
        setShowConfirmModal(false);
      }
    });
  };
  // Valores formateados para mostrar en el modal (evita expresiones complejas dentro del JSX)
  const formattedAdditionalTotal = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(additionalTotal);
  const affectedSeriesNumber = preparedPayload?.affected_document_series_number ?? '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" onClick={() => navigate('/accounting/debit-notes')} className="mr-4">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nueva Nota de Débito</h1>
            <p className="text-gray-600">Agregar cargos adicionales a un comprobante existente</p>
          </div>
        </div>
      </div>

      {!finalAffectedInvoice ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error: No se encontró el comprobante</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>No se pudo encontrar la información del comprobante para generar la nota de débito. Por favor, regrese a la lista de comprobantes y seleccione uno válido.</p>
              </div>
              <div className="mt-4">
                <Button variant="outline" onClick={() => navigate('/accounting/debit-notes/new')}>
                  Seleccionar Comprobante
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : !getValidClientId(finalAffectedInvoice) || getValidClientId(finalAffectedInvoice) === 0 ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error: Cliente no válido</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>El comprobante seleccionado no tiene un cliente válido asociado. No se puede generar una nota de débito sin esta información.</p>
                <p className="mt-1">Comprobante: {finalAffectedInvoice.series}-{String(finalAffectedInvoice.number).padStart(8,'0')}</p>
                <p>Cliente detectado: {finalAffectedInvoice.client_name || 'No disponible'}</p>
              </div>
              <div className="mt-4">
                <Button variant="outline" onClick={() => navigate('/accounting/debit-notes/new')}>
                  Seleccionar Otro Comprobante
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Mostrar errores de validación */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error en el formulario</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc list-inside space-y-1">
                      {Object.entries(errors).map(([field, error]) => (
                        <li key={field}>
                          <strong>{field}:</strong> {error?.message || 'Error de validación'}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Affected invoice summary */}
            {finalAffectedInvoice && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-2">Comprobante seleccionado</h2>
                <div className="text-sm text-gray-700">
                  <div><strong>{finalAffectedInvoice.series}-{String(finalAffectedInvoice.number).padStart(8,'0')}</strong> — {finalAffectedInvoice.client_name}</div>
                  <div>Fecha: {new Date(finalAffectedInvoice.issue_date).toLocaleDateString('es-PE')}</div>
                  <div>Monto Original: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(parseFloat(String(finalAffectedInvoice.total_payable || 0)))}</div>
                  <div className="mt-2 text-xs text-gray-500">
                    <div>Client ID: {finalAffectedInvoice.client_id || 'No disponible'}</div>
                    <div>Client from obj: {finalAffectedInvoice.client?.id || 'No disponible'}</div>
                    <div>Company ID: {finalAffectedInvoice.company_id || 'No disponible'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Main form blocks */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Información del Cargo</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serie ND</label>
                  <Controller name="series" control={control} render={({ field }) => (
                    <input {...field} className="w-full p-2 border rounded" />
                  )} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                  <Controller name="debit_note_type_code" control={control} render={({ field }) => (
                    <select {...field} className="w-full p-2 border rounded">
                      {DEBIT_NOTE_REASONS.map(r => <option key={r.code} value={r.code}>{r.description}</option>)}
                    </select>
                  )} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Sustento</label>
                  <Controller name="reason" control={control} render={({ field }) => (
                    <textarea {...field} rows={3} className="w-full p-2 border rounded" />
                  )} />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="igvEnabled"
                      checked={igvEnabled}
                      onChange={(e) => setIgvEnabled(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="igvEnabled" className="ml-2 block text-sm text-gray-900">
                      Aplicar IGV (18%) - {igvEnabled ? 'Activado' : 'Desactivado'}
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {igvEnabled ? 'Se aplicará IGV 18% sobre el precio base' : 'Precio sin IGV (región amazónica exonerada)'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Cargos Adicionales a Incluir</h2>
                <Button type="button" variant="outline" onClick={() => append({ 
                  ...DEFAULT_ITEM, 
                  tax_category_code: igvEnabled ? '10' : '20' 
                })}>
                  <PlusIcon className="h-4 w-4 mr-2" />Agregar Cargo
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((f, idx) => (
                  <div key={f.id} className="border rounded p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-medium">Cargo #{idx + 1}</div>
                      <div>
                        {fields.length > 1 && <Button type="button" variant="outline" size="sm" onClick={() => remove(idx)}><TrashIcon className="h-4 w-4" /></Button>}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Servicio</label>
                        <Controller name={`items.${idx}.product_id`} control={control} render={({ field }) => (
                          <Select
                            {...field}
                            options={serviceOptions}
                            isLoading={isLoadingServices}
                            placeholder="Seleccione un servicio..."
                            noOptionsMessage={() => 'No se encontraron servicios'}
                            value={serviceOptions.find(opt => opt.value === field.value) || null}
                            onChange={(option) => {
                              field.onChange(option?.value || 0);
                              // Auto-poblar otros campos cuando se selecciona un servicio
                              if (option?.service) {
                                const service = option.service;
                                const unitPrice = Number(service.sale_price);
                                setValue(`items.${idx}.unit_code`, service.unit_code);
                                setValue(`items.${idx}.unit_price`, unitPrice);
                                setValue(`items.${idx}.price_with_tax`, igvEnabled ? unitPrice * 1.18 : unitPrice);
                                setValue(`items.${idx}.price_type_code`, '01');
                                setValue(`items.${idx}.tax_category_code`, igvEnabled ? '10' : '20'); // 10=Gravado, 20=Exonerado
                              }
                            }}
                            className="react-select-container"
                            classNamePrefix="react-select"
                          />
                        )} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Cantidad</label>
                        <Controller name={`items.${idx}.quantity`} control={control} render={({ field }) => (
                          <input {...field} type="number" step="0.01" className="w-full p-2 border rounded" />
                        )} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Código Unidad</label>
                        <Controller name={`items.${idx}.unit_code`} control={control} render={({ field }) => (
                          <input {...field} className="w-full p-2 border rounded" placeholder="NIU" />
                        )} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Precio Unitario</label>
                        <Controller name={`items.${idx}.unit_price`} control={control} render={({ field }) => (
                          <input {...field} type="number" step="0.01" className="w-full p-2 border rounded" />
                        )} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          {igvEnabled ? 'Precio con IGV' : 'Precio Final'}
                        </label>
                        <Controller name={`items.${idx}.price_with_tax`} control={control} render={({ field }) => (
                          <input {...field} type="number" step="0.01" className="w-full p-2 border rounded" />
                        )} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Tipo Precio</label>
                        <Controller name={`items.${idx}.price_type_code`} control={control} render={({ field }) => (
                          <input {...field} className="w-full p-2 border rounded" placeholder="01" />
                        )} />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-sm text-gray-700 mb-1">Categoría Impuesto</label>
                        <Controller name={`items.${idx}.tax_category_code`} control={control} render={({ field }) => (
                          <input {...field} className="w-full p-2 border rounded" placeholder="S" />
                        )} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Información</h2>
              <div className="text-sm text-gray-600">
                <p>Las notas de débito aumentan el valor de la deuda y se enviarán a SUNAT automáticamente.</p>
                <p className="mt-2"><strong>Nota:</strong> Puede activar/desactivar el IGV según la región (amazónica exonerada).</p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho con totales y acción principal */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-start-3">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div>
                <h3 className="text-sm text-gray-500">Monto Original</h3>
                <div className="text-xl font-medium">{new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(originalAmount)}</div>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Cargos Adicionales (Base)</h3>
                <div className="text-lg font-medium">{new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(additionalTotal - igvAmount)}</div>
              </div>
              {igvEnabled && (
                <div>
                  <h3 className="text-sm text-gray-500">IGV (18%)</h3>
                  <div className="text-lg font-medium">{new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(igvAmount)}</div>
                </div>
              )}
              <div>
                <h3 className="text-sm text-gray-500">Total Cargos Adicionales</h3>
                <div className="text-xl font-medium">{new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(additionalTotal)}</div>
              </div>
              <div className="border-t pt-3">
                <h3 className="text-sm text-gray-500">Nuevo Monto Total</h3>
                <div className="text-2xl font-bold">{new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(newTotal)}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {igvEnabled ? 'Incluye IGV 18%' : 'Sin IGV (exonerado)'}
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/accounting/debit-notes')}>Cancelar</Button>
                <Button
                  type="submit"
                  isLoading={isPending}
                >
                  Generar Nota de Débito
                </Button>
              </div>
            </div>
          </div>
        </div>
        </form>
      )}

      {/* Modal de confirmación */}
      {showConfirmModal && preparedPayload && (
        <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Confirmar generación de Nota de Débito">
          <div className="space-y-4">
            <p>
              Se generará una Nota de Débito por <strong>{formattedAdditionalTotal}</strong>
              {affectedSeriesNumber ? ` asociada al comprobante ${affectedSeriesNumber}.` : '.'}
            </p>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <p><strong>Estado IGV:</strong> {igvEnabled ? 'Activado (18%)' : 'Desactivado (exonerado)'}</p>
              {igvEnabled && (
                <p><strong>IGV aplicado:</strong> {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(igvAmount)}</p>
              )}
              <p><strong>Categoría de impuesto:</strong> {igvEnabled ? 'Gravado (10)' : 'Exonerado (20)'}</p>
            </div>
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setShowConfirmModal(false)}>Cancelar</Button>
              <Button 
                type="button" 
                onClick={() => {
                  confirmCreate();
                }} 
                isLoading={isPending}
              >
                Confirmar y Enviar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
