// src/features/products/pages/ProductFormPage.tsx
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';

import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';

// Este servicio tendría que ser implementado
// import { productsService } from '../../../services/products.service';

const productSchema = z.object({
  internal_code: z.string().optional(),
  name: z.string().min(3, 'Nombre es requerido'),
  description: z.string().optional(),
  item_type: z.enum(['PRODUCT', 'SERVICE'], {
    errorMap: () => ({ message: 'Tipo de ítem es requerido' }),
  }),
  unit_code: z.string().min(1, 'Unidad de medida es requerida'),
  purchase_price: z.number().min(0, 'Precio de compra no puede ser negativo'),
  sale_price: z.number().positive('Precio de venta debe ser mayor a 0'),
  currency_code: z.string().min(1, 'Moneda es requerida'),
  tax_category_code: z.string().min(1, 'Categoría de impuesto es requerida'),
  unspcs_code: z.string().optional(),
  is_active: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

export const ProductFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id && id !== 'new';
  
  // En un proyecto real, estos datos vendrían de una API
  // const { data: product, isLoading: isLoadingProduct } = useQuery(
  //   ['product', id],
  //   () => productsService.getById(Number(id)),
  //   { enabled: isEditing }
  // );
  
  // Datos simulados para el ejemplo
  const product = isEditing ? {
    id: 1,
    internal_code: 'ST001',
    name: 'Servicio de Transporte Local',
    item_type: 'SERVICE',
    description: 'Transporte local dentro de la ciudad',
    unit_code: 'ZZ',
    sale_price: 350.00,
    purchase_price: 0,
    currency_code: 'PEN',
    tax_category_code: '10',
    unspcs_code: '',
    is_active: true,
  } : null;
  
  const isLoadingProduct = false;
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
        item_type: 'SERVICE', // Por defecto para una empresa de transporte
        unit_code: 'ZZ', // Servicio
        currency_code: 'PEN',
        tax_category_code: '10', // Gravado
        purchase_price: 0,
        sale_price: 0, // Add a default value for sale_price
        is_active: true,
      },
  });
  
  // Cargar datos para edición
  useEffect(() => {
    if (isEditing && product) {
      reset({
        internal_code: product.internal_code,
        name: product.name,
        description: product.description,
        item_type: product.item_type as 'PRODUCT' | 'SERVICE',
        unit_code: product.unit_code,
        purchase_price: product.purchase_price,
        sale_price: product.sale_price,
        currency_code: product.currency_code,
        tax_category_code: product.tax_category_code,
        unspcs_code: product.unspcs_code,
        is_active: product.is_active,
      });
    }
  }, [isEditing, product, reset]);
  
  // Observar cambio de tipo para actualizar unidad de medida
  const itemType = watch('item_type');
  
  useEffect(() => {
    if (itemType === 'SERVICE' && !isEditing) {
      setValue('unit_code', 'ZZ'); // Unidad estándar para servicios
    } else if (itemType === 'PRODUCT' && !isEditing) {
      setValue('unit_code', 'NIU'); // Unidad estándar para productos
    }
  }, [itemType, setValue, isEditing]);
  
  // Enviar formulario
  const onSubmit = async (data: ProductFormData) => {
    // En un proyecto real, llamarías a una API
    // if (isEditing) {
    //   productsService.update(Number(id), data);
    // } else {
    //   productsService.create(data);
    // }
    
    console.log('Guardando producto/servicio:', data);
    navigate('/products');
  };
  
  // Mostrar loading si se están cargando datos
  if (isLoadingProduct) {
    return <Spinner />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Producto/Servicio' : 'Nuevo Producto/Servicio'}
        </h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo de Ítem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Ítem *
              </label>
              <select
                {...register('item_type')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                disabled={isEditing} // No permitir cambiar el tipo en edición
              >
                <option value="SERVICE">Servicio</option>
                <option value="PRODUCT">Producto</option>
              </select>
              {errors.item_type && (
                <p className="mt-1 text-sm text-red-600">{errors.item_type.message}</p>
              )}
            </div>
            
            {/* Código Interno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código Interno
              </label>
              <input
                type="text"
                {...register('internal_code')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                placeholder="Código interno del producto/servicio"
              />
              {errors.internal_code && (
                <p className="mt-1 text-sm text-red-600">{errors.internal_code.message}</p>
              )}
            </div>
            
            {/* Nombre */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                {...register('name')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                placeholder="Nombre del producto/servicio"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            
            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                placeholder="Descripción detallada"
              ></textarea>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
            
            {/* Unidad de Medida */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad de Medida *
              </label>
              <select
                {...register('unit_code')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              >
                {itemType === 'SERVICE' ? (
                  <option value="ZZ">ZZ - Servicio</option>
                ) : (
                  <>
                    <option value="NIU">NIU - Unidad</option>
                    <option value="KGM">KGM - Kilogramo</option>
                    <option value="MTR">MTR - Metro</option>
                    <option value="LTR">LTR - Litro</option>
                    <option value="TNE">TNE - Tonelada</option>
                    <option value="ZZ">ZZ - Servicio</option>
                  </>
                )}
              </select>
              {errors.unit_code && (
                <p className="mt-1 text-sm text-red-600">{errors.unit_code.message}</p>
              )}
            </div>
            
            {/* Código Producto SUNAT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código Producto SUNAT
              </label>
              <input
                type="text"
                {...register('unspcs_code')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                placeholder="Código de 8 dígitos"
              />
              {errors.unspcs_code && (
                <p className="mt-1 text-sm text-red-600">{errors.unspcs_code.message}</p>
              )}
            </div>
            
            {/* Precio de Compra */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio de Compra
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">
                    {watch('currency_code') === 'PEN' ? 'S/ ' : '$ '}
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('purchase_price', { valueAsNumber: true })}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  placeholder="0.00"
                />
              </div>
              {errors.purchase_price && (
                <p className="mt-1 text-sm text-red-600">{errors.purchase_price.message}</p>
              )}
            </div>
            
            {/* Precio de Venta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio de Venta *
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">
                    {watch('currency_code') === 'PEN' ? 'S/ ' : '$ '}
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('sale_price', { valueAsNumber: true })}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  placeholder="0.00"
                />
              </div>
              {errors.sale_price && (
                <p className="mt-1 text-sm text-red-600">{errors.sale_price.message}</p>
              )}
            </div>
            
            {/* Moneda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moneda *
              </label>
              <select
                {...register('currency_code')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              >
                <option value="PEN">PEN - Soles</option>
                <option value="USD">USD - Dólares</option>
              </select>
              {errors.currency_code && (
                <p className="mt-1 text-sm text-red-600">{errors.currency_code.message}</p>
              )}
            </div>
            
            {/* Afectación IGV */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Afectación IGV *
              </label>
              <select
                {...register('tax_category_code')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              >
                <option value="10">10 - Gravado - Op. Onerosa</option>
                <option value="20">20 - Exonerado</option>
                <option value="30">30 - Inafecto</option>
              </select>
              {errors.tax_category_code && (
                <p className="mt-1 text-sm text-red-600">{errors.tax_category_code.message}</p>
              )}
            </div>
            
            {/* Estado */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                {...register('is_active')}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                Producto/Servicio Activo
              </label>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/products')}
            >
              Cancelar
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
    </div>
  );
};
