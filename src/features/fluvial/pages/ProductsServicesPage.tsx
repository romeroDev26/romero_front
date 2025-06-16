// src/features/fluvial/pages/ProductsServicesPage.tsx
import React, { useState, useMemo } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import {
  useProductsServicesData,
  useCreateProductService,
  useUpdateProductService,
  useDeleteProductService
} from '../hooks/useProductsServicesData';
import {
  ProductServiceFilters,
  ITEM_TYPE_OPTIONS,
  SERVICE_CATEGORY_OPTIONS,
  ProductServiceFormData
} from '../types/products-services-ui.types';
import { ProductService } from '../../../types';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';
import { DataTable, Column } from '../../../components/common/DataTable';
import { Spinner } from '../../../components/common/Spinner';
import { ProductServiceFormModal } from '../components/ProductServiceFormModal';
import { useDebounce } from '../../../hooks/useDebounce';

export const ProductsServicesPage: React.FC = () => {
  const [filters, setFilters] = useState<Omit<ProductServiceFilters, 'name'>>({
    item_type: '',
    is_active: true,
    service_category: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProductService | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const queryFilters = useMemo(() => ({
    name: debouncedSearch || undefined,
    item_type: filters.item_type || undefined,
    is_active: filters.is_active,
    service_category: filters.service_category || undefined,
  }), [debouncedSearch, filters]);

  const { data: productsServices, isLoading, error, refetch } = useProductsServicesData(queryFilters);
  const createMutation = useCreateProductService();
  const updateMutation = useUpdateProductService();
  const deleteMutation = useDeleteProductService();

  const handleFormSubmit = (data: ProductServiceFormData) => {
    if (selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, data }, {
        onSuccess: () => {
          setIsModalOpen(false);
          setSelectedItem(null);
          refetch();
        }
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsModalOpen(false);
          refetch();
        }
      });
    }
  };

  const openCreateModal = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: ProductService) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (selectedItem) {
      deleteMutation.mutate(selectedItem.id, {
        onSuccess: () => {
          setShowDeleteModal(false);
          setSelectedItem(null);
          refetch();
        }
      });
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleFilterChange = (key: keyof ProductServiceFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const columns: Column<ProductService>[] = useMemo(() => [
    {
      key: 'internal_code',
      header: 'Código',
      accessor: (item) => item.internal_code || '',
      className: 'text-left'
    },
    {
      key: 'name',
      header: 'Nombre',
      accessor: (item) => item.name,
      className: 'text-left'
    },
    {
      key: 'item_type',
      header: 'Tipo',
      accessor: (item) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          item.item_type === 'SERVICE'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {item.item_type === 'SERVICE' ? 'Servicio' : 'Producto'}
        </span>
      ),
      className: 'text-left'
    },
    {
      key: 'service_category',
      header: 'Categoría',
      accessor: (item) => item.service_category || '-',
      className: 'text-left'
    },
    {
      key: 'sale_price',
      header: 'Precio Venta',
      accessor: (item) => 
        `${item.currency_code} ${Number(item.sale_price).toFixed(2)}`,
      className: 'text-left'
    },
    {
      key: 'is_active',
      header: 'Estado',
      accessor: (item) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          item.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {item.is_active ? 'Activo' : 'Inactivo'}
        </span>
      ),
      className: 'text-left'
    },
    {
      key: 'actions',
      header: 'Acciones',
      accessor: (item) => (
        <div className="flex space-x-2">
          <button
            onClick={() => { setSelectedItem(item); setShowViewModal(true); }}
            className="text-gray-500 hover:text-blue-700"
            title="Ver"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => openEditModal(item)}
            className="text-gray-500 hover:text-yellow-700"
            title="Editar"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setSelectedItem(item); setShowDeleteModal(true); }}
            className="text-gray-500 hover:text-red-700"
            title="Eliminar"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      ),
      className: 'text-left'
    },
  ], []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-600">Error al cargar productos y servicios</p>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos y Servicios</h1>
          <p className="text-gray-600">Gestiona los productos y servicios disponibles</p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />
          Nuevo
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
              </div>
              <Input
                placeholder="Buscar productos/servicios..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <FunnelIcon className="w-4 h-4" />
            Filtros
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={filters.item_type}
                onChange={(e) => handleFilterChange('item_type', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                {ITEM_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                value={filters.service_category}
                onChange={(e) => handleFilterChange('service_category', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Todas</option>
                {SERVICE_CATEGORY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filters.is_active ? 'true' : 'false'}
                onChange={(e) => handleFilterChange('is_active', e.target.value === 'true')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <DataTable
          data={productsServices || []}
          columns={columns}
          isLoading={isLoading}
          keyExtractor={(item) => item.id.toString()}
        />
      </div>

      <ProductServiceFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
        }}
        onSubmit={handleFormSubmit}
        item={selectedItem}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar eliminación"
      >
        <div className="space-y-4">
          <p>
            ¿Estás seguro de que deseas eliminar el{' '}
            {selectedItem?.item_type === 'SERVICE' ? 'servicio' : 'producto'}{' '}
            <strong>"{selectedItem?.name}"</strong>?
          </p>
          <p className="text-sm text-gray-600">
            Esta acción desactivará el elemento pero no lo eliminará permanentemente.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDelete} 
              isLoading={deleteMutation.isPending}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles del Producto/Servicio"
        maxWidth="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Código Interno</label>
                <p className="text-sm text-gray-900">{selectedItem.internal_code || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <p className="text-sm text-gray-900">
                  {selectedItem.item_type === 'SERVICE' ? 'Servicio' : 'Producto'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <p className="text-sm text-gray-900">{selectedItem.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Categoría</label>
                <p className="text-sm text-gray-900">{selectedItem.service_category || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Precio de Compra</label>
                <p className="text-sm text-gray-900">
                  {selectedItem.currency_code} {Number(selectedItem.purchase_price).toFixed(2)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Precio de Venta</label>
                <p className="text-sm text-gray-900">
                  {selectedItem.currency_code} {Number(selectedItem.sale_price).toFixed(2)}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <p className="text-sm text-gray-900">{selectedItem.description || '-'}</p>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowViewModal(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};