import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useFieldArray, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { useCreateCreditNote } from '../hooks/useCreditNotes';
import { CreditNoteCreateData } from '../types';
import { useAccountingDocumentSeriesForBranch } from '../../../hooks/useAccountingDocumentSeries';
import { clientsService } from '../../../services/clients.service';
import { productsServicesService } from '../../../services/products-services.service';
import { authService } from '../../../services/auth.service';
import { Client, ProductService, User } from '../../../types';

// Catálogo 09 de SUNAT para motivos de Nota de Crédito (completo según backend)
const CREDIT_NOTE_REASONS = [
  { code: '01', description: 'Anulación de la operación' },
  { code: '02', description: 'Anulación por error en el RUC' },
  { code: '03', description: 'Corrección por error en la descripción' },
  { code: '04', description: 'Descuento global' },
  { code: '05', description: 'Descuento por ítem' },
  { code: '06', description: 'Devolución total' },
  { code: '07', description: 'Devolución por ítem' },
  { code: '09', description: 'Disminución en el valor' },
];

// Esquema de validación según estructura del backend
const creditNoteSchema = z.object({
  client_id: z.number().min(1, "Debe seleccionar un cliente."),
  series: z.string().min(1, "La serie es requerida."),
  currency_code: z.string().min(1, "La moneda es requerida."),
  affected_document_type_code: z.string().min(1, "Tipo de documento afectado requerido."),
  affected_document_series_number: z.string().min(1, "Serie y número del documento afectado requeridos."),
  credit_note_type_code: z.string().min(1, "Debe seleccionar un motivo."),
  reason: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  items: z.array(z.object({
    product_id: z.number().min(1, "Debe seleccionar un producto."),
    quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0."),
    unit_code: z.string().min(1, "El código de unidad es requerido."),
    unit_price: z.number().min(0, "El precio unitario no puede ser negativo."),
    price_with_tax: z.number().min(0, "El precio con impuesto no puede ser negativo."),
    price_type_code: z.string().min(1, "El código de precio es requerido."),
    tax_category_code: z.string().min(1, "La categoría del impuesto es requerida."),
    description: z.string().min(1, "La descripción es requerida."),
  })).min(1, "Debe agregar al menos un item."),
});

type CreditNoteFormData = z.infer<typeof creditNoteSchema>;

export const CreditNoteFullFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { mutate: createCreditNote, isPending } = useCreateCreditNote();
  
  // Estados locales para modales
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(-1);
  const [clientSearch, setClientSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  
  // Hook de usuario actual
  const { data: currentUser } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<User> => {
      const data = await authService.getProfile();
      return data;
    },
    staleTime: 1000 * 60 * 5,
    retry: 1
  });
  
  // Cargar datos reales
  const { data: clients = [], isLoading: loadingClients } = useQuery<Client[]>({
    queryKey: ['clients', currentUser?.company_id],
    queryFn: () => clientsService.getAll(),
    enabled: !!currentUser?.company_id,
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery<ProductService[]>({
    queryKey: ['products-services', currentUser?.company_id],
    queryFn: () => productsServicesService.getActive(),
    enabled: !!currentUser?.company_id,
  });

  // Series de documentos contables
  const { availableCreditNoteSeries, isLoading: loadingSeries } = useAccountingDocumentSeriesForBranch(
    currentUser?.default_branch_office_id || null, 
    currentUser?.company_id || 0
  );

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<CreditNoteFormData>({
    resolver: zodResolver(creditNoteSchema),
    defaultValues: {
      client_id: 0,
      series: '',
      currency_code: 'PEN',
      affected_document_type_code: '01',
      affected_document_series_number: '',
      credit_note_type_code: '01',
      reason: '',
      items: [{
        product_id: 0,
        quantity: 1,
        unit_code: 'NIU',
        unit_price: 0,
        price_with_tax: 0,
        price_type_code: '01',
        tax_category_code: '10',
        description: '',
      }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  // Seleccionar serie por defecto
  useEffect(() => {
    if (availableCreditNoteSeries.length > 0) {
      const savedSeries = localStorage.getItem('lastUsedCreditNoteSeries');
      const seriesExists = availableCreditNoteSeries.find(s => s.series_code === savedSeries);
      if (seriesExists && savedSeries) {
        setValue('series', savedSeries);
      } else {
        setValue('series', availableCreditNoteSeries[0].series_code);
      }
    }
  }, [availableCreditNoteSeries, setValue]);

  const onSubmit: SubmitHandler<CreditNoteFormData> = (data) => {
    if (!currentUser?.company_id) {
      toast.error("No se pudo obtener la información de la empresa");
      return;
    }

    // Guardar serie usada
    localStorage.setItem('lastUsedCreditNoteSeries', data.series);

    const payload: CreditNoteCreateData = {
      company_id: currentUser.company_id,
      client_id: data.client_id,
      series: data.series,
      currency_code: data.currency_code,
      issue_date: new Date().toISOString().split('T')[0],
      issue_time: new Date().toTimeString().split(' ')[0],
      affected_document_type_code: data.affected_document_type_code,
      affected_document_series_number: data.affected_document_series_number,
      credit_note_type_code: data.credit_note_type_code,
      reason: data.reason,
      items: data.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_code: item.unit_code,
        unit_price: item.unit_price,
        price_with_tax: item.price_with_tax,
        price_type_code: item.price_type_code,
        tax_category_code: item.tax_category_code,
        description: item.description,
      })),
    };

    createCreditNote(payload, {
      onSuccess: () => {
        navigate('/accounting/credit-notes');
      }
    });
  };

  const addItem = () => {
    append({
      product_id: 0,
      quantity: 1,
      unit_code: 'NIU',
      unit_price: 0,
      price_with_tax: 0,
      price_type_code: '01',
      tax_category_code: '10',
      description: '',
    });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const selectClient = (client: Client) => {
    setValue('client_id', client.id);
    setShowClientModal(false);
    setClientSearch('');
  };

  const selectProduct = (product: ProductService) => {
    if (selectedItemIndex >= 0) {
      setValue(`items.${selectedItemIndex}.product_id`, product.id);
      setValue(`items.${selectedItemIndex}.description`, product.name);
      setValue(`items.${selectedItemIndex}.unit_price`, product.sale_price || 0);
      // Calcular precio con IGV (18%)
      const priceWithTax = (product.sale_price || 0) * 1.18;
      setValue(`items.${selectedItemIndex}.price_with_tax`, priceWithTax);
    }
    setShowProductModal(false);
    setProductSearch('');
    setSelectedItemIndex(-1);
  };

  const openProductModal = (index: number) => {
    setSelectedItemIndex(index);
    setShowProductModal(true);
  };

  // Filtros para modales
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.doc_number?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectedClient = clients.find(c => c.id === watch('client_id'));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => navigate('/accounting/credit-notes')}
            className="mr-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nueva Nota de Crédito</h1>
            <p className="text-gray-600">Crear una nota de crédito detallada con items</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Datos del Cliente */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente*</label>
                  <div className="flex">
                    <div className="flex-1 p-2 border border-gray-300 rounded-l-md bg-gray-50">
                      {selectedClient ? (
                        <div>
                          <div className="font-medium">{selectedClient.name}</div>
                          <div className="text-sm text-gray-500">{selectedClient.doc_number}</div>
                        </div>
                      ) : (
                        <div className="text-gray-400">Seleccionar cliente...</div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowClientModal(true)}
                      className="rounded-l-none"
                    >
                      <MagnifyingGlassIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  {errors.client_id && <p className="text-sm text-red-600 mt-1">{errors.client_id.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serie NC*</label>
                  <Controller
                    name="series"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="w-full p-2 border border-gray-300 rounded-md">
                        {loadingSeries ? (
                          <option>Cargando series...</option>
                        ) : (
                          <>
                            <option value="">Seleccionar serie...</option>
                            {availableCreditNoteSeries.map(series => (
                              <option key={series.id} value={series.series_code}>
                                {series.series_code}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    )}
                  />
                  {errors.series && <p className="text-sm text-red-600 mt-1">{errors.series.message}</p>}
                </div>
              </div>
            </div>

            {/* Documento Afectado */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Documento Afectado</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo*</label>
                  <Controller
                    name="affected_document_type_code"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="w-full p-2 border border-gray-300 rounded-md">
                        <option value="01">01 - Factura</option>
                        <option value="03">03 - Boleta</option>
                      </select>
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serie-Número*</label>
                  <Controller
                    name="affected_document_series_number"
                    control={control}
                    render={({ field }) => (
                      <input 
                        {...field} 
                        placeholder="F001-00000123"
                        className="w-full p-2 border border-gray-300 rounded-md" 
                      />
                    )}
                  />
                  {errors.affected_document_series_number && <p className="text-sm text-red-600 mt-1">{errors.affected_document_series_number.message}</p>}
                </div>
              </div>
            </div>

            {/* Motivo */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Motivo de la Nota de Crédito</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo*</label>
                  <Controller
                    name="credit_note_type_code"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="w-full p-2 border border-gray-300 rounded-md">
                        {CREDIT_NOTE_REASONS.map(reason => (
                          <option key={reason.code} value={reason.code}>
                            {reason.code} - {reason.description}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.credit_note_type_code && <p className="text-sm text-red-600 mt-1">{errors.credit_note_type_code.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción*</label>
                  <Controller
                    name="reason"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Ej: Devolución total de productos por defecto de calidad"
                      />
                    )}
                  />
                  {errors.reason && <p className="text-sm text-red-600 mt-1">{errors.reason.message}</p>}
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Items de la Nota de Crédito</h2>
                <Button type="button" variant="outline" onClick={addItem}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Agregar Item
                </Button>
              </div>
              
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-gray-900">Item #{index + 1}</h3>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Producto/Servicio*</label>
                        <div className="flex">
                          <div className="flex-1 p-2 border border-gray-300 rounded-l-md bg-gray-50">
                            <Controller
                              name={`items.${index}.description`}
                              control={control}
                              render={({ field }) => (
                                <div className="text-sm">
                                  {field.value || 'Seleccionar producto/servicio...'}
                                </div>
                              )}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => openProductModal(index)}
                            className="rounded-l-none"
                          >
                            <MagnifyingGlassIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad*</label>
                        <Controller
                          name={`items.${index}.quantity`}
                          control={control}
                          render={({ field }) => (
                            <input 
                              {...field} 
                              type="number"
                              step="0.01"
                              min="0"
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="w-full p-2 border border-gray-300 rounded-md" 
                            />
                          )}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio Unitario*</label>
                        <Controller
                          name={`items.${index}.unit_price`}
                          control={control}
                          render={({ field }) => (
                            <input 
                              {...field} 
                              type="number"
                              step="0.01"
                              min="0"
                              onChange={(e) => {
                                const unitPrice = parseFloat(e.target.value) || 0;
                                field.onChange(unitPrice);
                                // Auto-calcular precio con IGV
                                const priceWithTax = unitPrice * 1.18;
                                setValue(`items.${index}.price_with_tax`, parseFloat(priceWithTax.toFixed(2)));
                              }}
                              className="w-full p-2 border border-gray-300 rounded-md" 
                            />
                          )}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio con IGV*</label>
                        <Controller
                          name={`items.${index}.price_with_tax`}
                          control={control}
                          render={({ field }) => (
                            <input 
                              {...field} 
                              type="number"
                              step="0.01"
                              min="0"
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="w-full p-2 border border-gray-300 rounded-md" 
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.items && <p className="text-sm text-red-600 mt-2">{errors.items.message}</p>}
            </div>
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Importante</h2>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="font-medium text-blue-800 mb-1">Información</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Las notas de crédito reducen la deuda del cliente</li>
                    <li>• Se enviarán automáticamente a SUNAT</li>
                    <li>• Verificar todos los datos antes de crear</li>
                    <li>• El documento afectado debe existir y estar válido</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={() => navigate('/accounting/credit-notes')}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isPending}>
            Crear Nota de Crédito
          </Button>
        </div>
      </form>

      {/* Modal de Selección de Cliente */}
      <Modal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        title="Seleccionar Cliente"
      >
        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {loadingClients ? (
              <div className="text-center py-4">Cargando clientes...</div>
            ) : (
              <div className="space-y-2">
                {filteredClients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => selectClient(client)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border rounded-md"
                  >
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-gray-500">{client.doc_number}</div>
                  </div>
                ))}
                {filteredClients.length === 0 && (
                  <div className="text-center py-4 text-gray-500">No se encontraron clientes</div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal de Selección de Producto */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title="Seleccionar Producto/Servicio"
      >
        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Buscar producto/servicio..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {loadingProducts ? (
              <div className="text-center py-4">Cargando productos...</div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => selectProduct(product)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border rounded-md"
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">S/ {product.sale_price?.toFixed(2) || '0.00'}</div>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="text-center py-4 text-gray-500">No se encontraron productos</div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
