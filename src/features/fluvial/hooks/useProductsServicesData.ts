// src/features/fluvial/hooks/useProductsServicesData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ProductService } from '../../../types';
import { 
  productsServicesService, 
  ProductServiceCreateRequest, 
  ProductServiceUpdateRequest, 
  ProductServiceFilters 
} from '../../../services/products-services.service';
import { ProductServiceFormData } from '../types/products-services-ui.types';

// Keys para React Query
export const PRODUCTS_SERVICES_QUERY_KEYS = {
  all: ['products-services'] as const,
  lists: () => [...PRODUCTS_SERVICES_QUERY_KEYS.all, 'list'] as const,
  list: (filters: ProductServiceFilters) => [...PRODUCTS_SERVICES_QUERY_KEYS.lists(), filters] as const,
  details: () => [...PRODUCTS_SERVICES_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...PRODUCTS_SERVICES_QUERY_KEYS.details(), id] as const,
  services: () => [...PRODUCTS_SERVICES_QUERY_KEYS.all, 'services'] as const,
  products: () => [...PRODUCTS_SERVICES_QUERY_KEYS.all, 'products'] as const,
  active: () => [...PRODUCTS_SERVICES_QUERY_KEYS.all, 'active'] as const,
  search: (term: string) => [...PRODUCTS_SERVICES_QUERY_KEYS.all, 'search', term] as const,
};

/**
 * Hook para obtener lista de productos y servicios
 */
export const useProductsServicesData = (filters: ProductServiceFilters = {}) => {
  return useQuery({
    queryKey: PRODUCTS_SERVICES_QUERY_KEYS.list(filters),
    queryFn: () => productsServicesService.getList(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para obtener un producto/servicio por ID
 */
export const useProductServiceById = (id: number) => {
  return useQuery({
    queryKey: PRODUCTS_SERVICES_QUERY_KEYS.detail(id),
    queryFn: () => productsServicesService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener solo servicios
 */
export const useServicesData = (filters: Omit<ProductServiceFilters, 'item_type'> = {}) => {
  return useQuery({
    queryKey: [...PRODUCTS_SERVICES_QUERY_KEYS.services(), filters],
    queryFn: () => productsServicesService.getServices(filters),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener solo productos
 */
export const useProductsData = (filters: Omit<ProductServiceFilters, 'item_type'> = {}) => {
  return useQuery({
    queryKey: [...PRODUCTS_SERVICES_QUERY_KEYS.products(), filters],
    queryFn: () => productsServicesService.getProducts(filters),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para crear un nuevo producto/servicio
 */
export const useCreateProductService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductServiceFormData) => {
      // Convertir de ProductServiceFormData a ProductServiceCreateRequest
      const requestData: ProductServiceCreateRequest = {
        internal_code: data.internal_code || undefined,
        name: data.name,
        description: data.description || undefined,
        item_type: data.item_type,
        service_category: data.service_category as any,
        unit_code: data.unit_code,
        purchase_price: data.purchase_price || 0,
        sale_price: data.sale_price,
        currency_code: data.currency_code,
        tax_category_code: data.tax_category_code,
        unspcs_code: data.unspcs_code || undefined,
        is_active: data.is_active,
        specific_route_id: data.specific_route_id || null,
      };
      
      return productsServicesService.create(requestData);
    },
    onSuccess: (newItem) => {
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ 
        queryKey: PRODUCTS_SERVICES_QUERY_KEYS.all 
      });
      
      toast.success(`${newItem.item_type === 'SERVICE' ? 'Servicio' : 'Producto'} "${newItem.name}" creado exitosamente`);
    },
    onError: (error: any) => {
      console.error('Error al crear producto/servicio:', error);
      const message = error.response?.data?.detail || 'Error al crear el elemento';
      toast.error(message);
    },
  });
};

/**
 * Hook para actualizar un producto/servicio
 */
export const useUpdateProductService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductServiceFormData }) => {
      // Convertir de ProductServiceFormData a ProductServiceUpdateRequest
      const requestData: ProductServiceUpdateRequest = {
        internal_code: data.internal_code || undefined,
        name: data.name,
        description: data.description || undefined,
        item_type: data.item_type,
        service_category: data.service_category as any,
        unit_code: data.unit_code,
        purchase_price: data.purchase_price || 0,
        sale_price: data.sale_price,
        currency_code: data.currency_code,
        tax_category_code: data.tax_category_code,
        unspcs_code: data.unspcs_code || undefined,
        is_active: data.is_active,
        specific_route_id: data.specific_route_id || null,
      };
      
      return productsServicesService.update(id, requestData);
    },
    onSuccess: (updatedItem) => {
      // Invalidar queries específicas
      queryClient.invalidateQueries({ 
        queryKey: PRODUCTS_SERVICES_QUERY_KEYS.all 
      });
      
      // Actualizar la cache del item específico
      queryClient.setQueryData(
        PRODUCTS_SERVICES_QUERY_KEYS.detail(updatedItem.id),
        updatedItem
      );
      
      toast.success(`${updatedItem.item_type === 'SERVICE' ? 'Servicio' : 'Producto'} "${updatedItem.name}" actualizado exitosamente`);
    },
    onError: (error: any) => {
      console.error('Error al actualizar producto/servicio:', error);
      const message = error.response?.data?.detail || 'Error al actualizar el elemento';
      toast.error(message);
    },
  });
};

/**
 * Hook para eliminar (desactivar) un producto/servicio
 */
export const useDeleteProductService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => productsServicesService.delete(id),
    onSuccess: (deletedItem) => {
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ 
        queryKey: PRODUCTS_SERVICES_QUERY_KEYS.all 
      });
      
      toast.success(`${deletedItem.item_type === 'SERVICE' ? 'Servicio' : 'Producto'} "${deletedItem.name}" desactivado exitosamente`);
    },
    onError: (error: any) => {
      console.error('Error al eliminar producto/servicio:', error);
      const message = error.response?.data?.detail || 'Error al desactivar el elemento';
      toast.error(message);
    },
  });
};

/**
 * Hook para buscar productos/servicios por nombre
 */
export const useSearchProductsServices = (searchTerm: string, filters: Omit<ProductServiceFilters, 'name'> = {}) => {
  return useQuery({
    queryKey: [...PRODUCTS_SERVICES_QUERY_KEYS.search(searchTerm), filters],
    queryFn: () => productsServicesService.searchByName(searchTerm, filters),
    enabled: searchTerm.length > 2, // Solo buscar si hay al menos 3 caracteres
    staleTime: 2 * 60 * 1000, // 2 minutos para búsquedas
  });
};

/**
 * Hook para obtener solo elementos activos
 */
export const useActiveProductsServices = (filters: Omit<ProductServiceFilters, 'is_active'> = {}) => {
  return useQuery({
    queryKey: [...PRODUCTS_SERVICES_QUERY_KEYS.active(), filters],
    queryFn: () => productsServicesService.getActive(filters),
    staleTime: 5 * 60 * 1000,
  });
};