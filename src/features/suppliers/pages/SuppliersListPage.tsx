// src/features/suppliers/pages/SuppliersListPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { Supplier, DocType } from '../../../types';
import { usePermissions } from '../../../hooks/usePermissions';

// Este servicio tendría que ser implementado
// import { suppliersService } from '../../../services/suppliers.service';

// Función helper para obtener el texto del tipo de documento
const getDocTypeDisplay = (type: DocType): string => {
  switch (type) {
    case '1': return 'DNI';
    case '4': return 'Carnet de Extranjería';
    case '6': return 'RUC';
    case '7': return 'Pasaporte';
    case '0': return 'Otros';
    default: return 'Desconocido';
  }
};

export const SuppliersListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDocType, setFilterDocType] = useState<DocType | 'ALL'>('ALL');
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  
  // En un proyecto real, estos datos vendrían de una API
  // const { data: suppliers, isLoading } = useQuery(['suppliers'], suppliersService.getAll);
  
  // Datos simulados para el ejemplo
  const suppliers: Supplier[] = [
    { 
      id: 1, 
      doc_type: '6',
      doc_number: '20555444333',
      name: 'Transportes del Oriente S.A.C.',
      address: 'Av. Industrial 567, Iquitos',
      ubigeo: '160101',
      email: 'ventas@transportesoriente.com',
      phone: '065-234567',
      is_active: true,
      created_at: '2025-01-01T00:00:00-05:00',
      updated_at: '2025-01-01T00:00:00-05:00'
    },
    { 
      id: 2, 
      doc_type: '1',
      doc_number: '45678912',
      name: 'Carlos Mendoza Ruiz',
      address: 'Jr. Comercio 234, Tarapoto',
      ubigeo: '220601',
      email: 'carlos.mendoza@email.com',
      phone: '965987321',
      is_active: true,
      created_at: '2025-01-02T00:00:00-05:00',
      updated_at: '2025-01-02T00:00:00-05:00'
    },
    { 
      id: 3, 
      doc_type: '6',
      doc_number: '20123987654',
      name: 'Combustibles Amazonía S.A.C.',
      address: 'Av. Aeropuerto 890, Pucallpa',
      ubigeo: '250101',
      email: 'administracion@combustiblesamazonia.com',
      phone: '061-598765',
      is_active: false,
      created_at: '2025-01-03T00:00:00-05:00',
      updated_at: '2025-01-03T00:00:00-05:00'
    },
    { 
      id: 4, 
      doc_type: '6',
      doc_number: '20456789012',
      name: 'Repuestos y Servicios del Norte E.I.R.L.',
      address: 'Calle Progreso 123, Yurimaguas',
      ubigeo: '160701',
      email: 'repuestos@rsnorte.com',
      phone: '065-352741',
      is_active: true,
      created_at: '2025-01-04T00:00:00-05:00',
      updated_at: '2025-01-04T00:00:00-05:00'
    }
  ];
  
  const isLoading = false;
  
  // Filtrar proveedores según criterios
  let filteredSuppliers = suppliers;
  
  // Filtrar por tipo de documento
  if (filterDocType !== 'ALL') {
    filteredSuppliers = filteredSuppliers.filter(supplier => supplier.doc_type === filterDocType);
  }
  
  // Filtrar por estado
  if (filterActive !== 'ALL') {
    filteredSuppliers = filteredSuppliers.filter(
      supplier => filterActive === 'ACTIVE' ? supplier.is_active : !supplier.is_active
    );
  }
  
  // Filtrar por búsqueda
  if (searchTerm) {
    filteredSuppliers = filteredSuppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.doc_number.includes(searchTerm) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.phone && supplier.phone.includes(searchTerm))
    );
  }
  
  const handleDelete = (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este proveedor?')) {
      // En un proyecto real, llamarías a una API
      // suppliersService.delete(id);
      console.log('Eliminando proveedor:', id);
    }
  };
  
  if (isLoading) return <Spinner />;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-dm-text-primary">Proveedores</h1>
        <Button
          onClick={() => navigate('/suppliers/new')}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Proveedor
        </Button>
      </div>
      
      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-dm-text-muted" />
          </div>
          <input
            type="text"
            className="pl-10 block w-full rounded-md border-dm-border-primary shadow-sm p-2 border"
            placeholder="Buscar por nombre, documento, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <select
            className="rounded-md border-dm-border-primary shadow-sm p-2 border"
            value={filterDocType}
            onChange={(e) => setFilterDocType(e.target.value as DocType | 'ALL')}
          >
            <option value="ALL">Todos los documentos</option>
            <option value="6">RUC</option>
            <option value="1">DNI</option>
            <option value="4">Carnet de Extranjería</option>
            <option value="7">Pasaporte</option>
            <option value="0">Otros</option>
          </select>
          
          <select
            className="rounded-md border-dm-border-primary shadow-sm p-2 border"
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
        </div>
      </div>
      
      {/* Tabla de proveedores */}
      <div className="bg-dm-bg-primary rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-dm-border-primary">
          <thead className="bg-dm-bg-secondary">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Tipo Doc.
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Número Doc.
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Nombre / Razón Social
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Teléfono
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-dm-bg-primary divide-y divide-dm-border-primary">
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-dm-bg-secondary">
                <td className="px-6 py-4 whitespace-nowrap">
                  {getDocTypeDisplay(supplier.doc_type as DocType)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {supplier.doc_number}
                </td>
                <td className="px-6 py-4">
                  <div className="text-dm-text-primary">{supplier.name}</div>
                  {supplier.address && (
                    <div className="text-dm-text-muted text-sm">{supplier.address}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {supplier.email || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {supplier.phone || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    supplier.is_active ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                  }`}>
                    {supplier.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => navigate(`/suppliers/${supplier.id}`)}
                    className="text-primary hover:text-primary/80 mr-4"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  {hasPermission('inventory', 'suppliers', 'warehouse') && (
                    <button
                      onClick={() => handleDelete(supplier.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-200"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            
            {filteredSuppliers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-dm-text-muted">
                  No se encontraron proveedores
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
