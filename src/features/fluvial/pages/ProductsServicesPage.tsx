// src/features/fluvial/pages/ProductsServicesPage.tsx
import React, { useState, useMemo } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import {
  useProductsServicesData,
  useCreateProductService,
  useUpdateProductService
} from '../hooks/useProductsServicesData';
import {
  ProductServiceFilters,
  ITEM_TYPE_OPTIONS,
  SERVICE_CATEGORY_OPTIONS,
  ProductServiceFormData,
  getTaxCategoryLabel
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
  // deleteMutation removed: deletion disabled from UI

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

  // handleDelete removed: deletion disabled from UI

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
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
            : 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
        }`}>
          {item.item_type === 'SERVICE' ? 'Servicio' : 'Producto'}
        </span>
      ),
      className: 'text-left'
    },
    {
      key: 'sale_price',
      header: 'Precio Venta',
      accessor: (item) =>
        `${item.currency_code} ${Number(item.sale_price).toFixed(2)}`,
      className: 'text-right'
    },
    {
      key: 'tax_category_code',
      header: 'Afectación IGV',
      accessor: (item) => getTaxCategoryLabel(item.tax_category_code),
      className: 'text-left'
    },
    {
      key: 'is_active',
      header: 'Estado',
      accessor: (item) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          item.is_active
            ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
            : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
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
            className="text-dm-text-muted hover:text-blue-700 dark:text-blue-300"
            title="Ver"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => openEditModal(item)}
            className="text-dm-text-muted hover:text-yellow-700 dark:text-yellow-300"
            title="Editar"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          {/* Delete action removed - deletion disabled in UI */}
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
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-md p-4">
        <p className="text-red-600 dark:text-red-400">Error al cargar productos y servicios</p>
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
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl font-bold text-dm-text-primary">Productos y Servicios</h1>
          <p className="text-dm-text-secondary">Gestiona los productos y servicios disponibles</p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2 w-full sm:w-auto justify-center">
          <PlusIcon className="w-4 h-4" />
          Nuevo
        </Button>
      </div>

      {/* Search and Filters - Responsive */}
      <div className="bg-dm-bg-primary p-4 rounded-lg shadow space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
          <div className="flex-1 w-full sm:max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-dm-text-muted" />
              </div>
              <Input
                placeholder="Buscar productos/servicios..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 justify-center w-full sm:w-auto"
          >
            <FunnelIcon className="w-4 h-4" />
            Filtros
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-dm-border-primary">
            <div>
              <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                Tipo
              </label>
              <select
                value={filters.item_type}
                onChange={(e) => handleFilterChange('item_type', e.target.value)}
                className="w-full border border-dm-border-primary rounded-md px-3 py-2 text-sm"
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
              <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                Categoría
              </label>
              <select
                value={filters.service_category}
                onChange={(e) => handleFilterChange('service_category', e.target.value)}
                className="w-full border border-dm-border-primary rounded-md px-3 py-2 text-sm"
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
              <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                Estado
              </label>
              <select
                value={filters.is_active ? 'true' : 'false'}
                onChange={(e) => handleFilterChange('is_active', e.target.value === 'true')}
                className="w-full border border-dm-border-primary rounded-md px-3 py-2 text-sm"
              >
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4">
        {(productsServices || []).map((item) => (
          <div key={item.id} className="bg-dm-bg-primary rounded-lg shadow-sm border border-dm-border-primary p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-dm-text-primary">{item.name}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    item.item_type === 'SERVICE'
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                      : 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                  }`}>
                    {item.item_type === 'SERVICE' ? 'Servicio' : 'Producto'}
                  </span>
                </div>
                {item.internal_code && (
                  <p className="text-sm text-dm-text-muted">Código: {item.internal_code}</p>
                )}
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                item.is_active
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
              }`}>
                {item.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <span className="block text-xs text-dm-text-muted">Precio Venta</span>
                <span className="font-medium text-dm-text-primary">
                  {item.currency_code} {Number(item.sale_price).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="block text-xs text-dm-text-muted">IGV</span>
                <span className="font-medium text-dm-text-primary">
                  {getTaxCategoryLabel(item.tax_category_code)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-dm-border-secondary">
              <button
                onClick={() => { setSelectedItem(item); setShowViewModal(true); }}
                className="flex items-center text-dm-text-secondary hover:text-blue-800 dark:text-blue-300 text-sm font-medium"
              >
                <EyeIcon className="h-4 w-4 mr-1" /> Ver
              </button>
              <button
                onClick={() => openEditModal(item)}
                className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-300 text-sm font-medium"
              >
                <PencilIcon className="h-4 w-4 mr-1" /> Editar
              </button>
            </div>
          </div>
        ))}
        
        {(!productsServices || productsServices.length === 0) && (
          <div className="bg-dm-bg-primary rounded-lg shadow-sm p-6 text-center text-dm-text-muted">
            No se encontraron productos o servicios.
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-dm-bg-primary rounded-lg shadow overflow-x-auto">
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

  {/* Delete confirmation modal removed - deletion disabled in UI */}

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
                <label className="block text-sm font-medium text-dm-text-secondary">Código Interno</label>
                <p className="text-sm text-dm-text-primary">{selectedItem.internal_code || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-dm-text-secondary">Tipo</label>
                <p className="text-sm text-dm-text-primary">
                  {selectedItem.item_type === 'SERVICE' ? 'Servicio' : 'Producto'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-dm-text-secondary">Nombre</label>
                <p className="text-sm text-dm-text-primary">{selectedItem.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-dm-text-secondary">Categoría</label>
                <p className="text-sm text-dm-text-primary">{selectedItem.service_category || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-dm-text-secondary">Precio de Compra</label>
                <p className="text-sm text-dm-text-primary">
                  {selectedItem.currency_code} {Number(selectedItem.purchase_price).toFixed(2)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-dm-text-secondary">Precio de Venta</label>
                <p className="text-sm text-dm-text-primary">
                  {selectedItem.currency_code} {Number(selectedItem.sale_price).toFixed(2)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-dm-text-secondary">Afectación IGV</label>
                <p className="text-sm text-dm-text-primary">
                  {getTaxCategoryLabel(selectedItem.tax_category_code)}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dm-text-secondary">Descripción</label>
              <p className="text-sm text-dm-text-primary">{selectedItem.description || '-'}</p>
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
