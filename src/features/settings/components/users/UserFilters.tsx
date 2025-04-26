// src/features/settings/components/users/UserFilters.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { rolesService } from '../../../../services/roles.service';
import { Role } from '../../../../types';

interface UserFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  roleFilter: number | 'ALL';
  setRoleFilter: (roleId: number | 'ALL') => void;
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE';
  setStatusFilter: (status: 'ALL' | 'ACTIVE' | 'INACTIVE') => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  showAdvancedFilters,
  setShowAdvancedFilters,
}) => {
  // Obtener roles desde la API
  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
          Filtros
        </button>
      </div>
      
      {showAdvancedFilters && (
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={roleFilter === 'ALL' ? 'ALL' : roleFilter}
                onChange={(e) => setRoleFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                disabled={isLoading}
              >
                <option value="ALL">Todos los roles</option>
                {roles && roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.description || role.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
              >
                <option value="ALL">Todos los estados</option>
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};