// src/features/products/pages/ProductsListPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';

// Este servicio tendría que ser implementado
// import { productsService } from '../../../services/products.service';

export const ProductsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [filterActive, setFilterActive] = useState('ALL');
  
  // En un proyecto real, estos datos vendrían de una API
  // const { data: products, isLoading } = useQuery(['products'], productsService.getAll);
  
  // Datos simulados para el ejemplo
  const products = [
    { 
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
      is_active: true
    },
    { 
      id: 2, 
      internal_code: 'ST002', 
      name: 'Servicio de Transporte Interprovincial', 
      item_type: 'SERVICE',
      description: 'Transporte entre diferentes provincias',
      unit_code: 'ZZ',
      sale_price: 850.00,
      purchase_price: 0,
      currency_code: 'PEN',
      tax_category_code: '10',
      is_active: true
    },
    { 
      id: 3, 
      internal_code: 'ST003', 
      name: 'Servicio de Transporte de Carga', 
      item_type: 'SERVICE',
      description: 'Transporte de carga a nivel nacional',
      unit_code: 'ZZ',
      sale_price: 450.00,
      purchase_price: 0,
      currency_code: 'PEN',
      tax_category_code: '10',
      is_active: true
    },
    { 
      id: 4, 
      internal_code: 'ST004', 
      name: 'Servicio de Alquiler de Vehículo', 
      item_type: 'SERVICE',
      description: 'Alquiler de vehículo por día',
      unit_code: 'ZZ',
      sale_price: 300.00,
      purchase_price: 0,
      currency_code: 'PEN',
      tax_category_code: '10',
      is_active: false
    },
    { 
      id: 5, 
      internal_code: 'PR001', 
      name: 'Casco de Seguridad', 
      item_type: 'PRODUCT',
      description: 'Casco de seguridad para personal',
      unit_code: 'NIU',
      sale_price: 45.00,
      purchase_price: 30.00,
      currency_code: 'PEN',
      tax_category_code: '10',
      is_active: true
    }
  ];
  
  const isLoading = false;
  
  // Aplicar filtros a la lista de productos
  let filteredProducts = products;
  
  if (filterType !== 'ALL') {
    filteredProducts = filteredProducts.filter(product => product.item_type === filterType);
  }
  
  if (filterActive !== 'ALL') {
    filteredProducts = filteredProducts.filter(
      product => filterActive === 'ACTIVE' ? product.is_active : !product.is_active
    );
  }
  
  // Aplicar búsqueda
  if (searchTerm) {
    filteredProducts = filteredProducts.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.internal_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }
  
  // Obtener texto para tipo de ítem
  const getItemTypeText = (type: string) => {
    return type === 'PRODUCT' ? 'Producto' : 'Servicio';
  };
  
  // Obtener texto para categoría de impuesto
  const getTaxCategoryText = (code: string) => {
    switch (code) {
      case '10': return 'Gravado';
      case '20': return 'Exonerado';
      case '30': return 'Inafecto';
      default: return code;
    }
  };
  
  if (isLoading) return <Spinner />;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Productos y Servicios</h1>
        <Button
          onClick={() => navigate('/products/new')}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Producto/Servicio
        </Button>
      </div>
      
      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            placeholder="Buscar por nombre, código o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center"
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
          Filtros
        </Button>
      </div>
      
      {/* Panel de filtros */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="ALL">Todos</option>
                <option value="PRODUCT">Productos</option>
                <option value="SERVICE">Servicios</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
              >
                <option value="ALL">Todos</option>
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabla de productos */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unidad
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio Venta
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Impuesto
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-primary">
                    {product.internal_code}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-900">{product.name}</div>
                  {product.description && (
                    <div className="text-gray-500 text-sm">{product.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getItemTypeText(product.item_type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.unit_code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.currency_code === 'PEN' ? 'S/ ' : '$ '}
                  {product.sale_price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getTaxCategoryText(product.tax_category_code)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
            
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No se encontraron productos o servicios
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
