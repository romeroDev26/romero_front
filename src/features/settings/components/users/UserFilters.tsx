// src/features/settings/components/users/UserFilters.tsx
import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { rolesService } from '../../../../services/roles.service';
import { Role } from '../../../../types';
import { toast } from '@/utils/sileo-toast';

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
  const [roles, setRoles] = useState<Role[]>([]);
  
  // Cargar roles para filtrar
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await rolesService.getAll();
        setRoles(data);
      } catch (err) {
        console.error('Error al cargar roles para filtros:', err);
        // Si falla, usar unos valores por defecto
        setRoles([
          {
            id: 1, name: 'admin', description: 'Administrador del Sistema',
            is_active: false
          },
          {
            id: 2, name: 'sales', description: 'Personal de Ventas',
            is_active: false
          },
          { id: 3, name: 'warehouse', description: 'Personal de Almacén', is_active: false }
        ]);
      }
    };
    
    fetchRoles();
  }, []);
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-dm-text-muted" />
          </div>
          <input
            type="text"
            className="pl-10 block w-full rounded-md border-dm-border-primary shadow-sm p-2 border"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center justify-center px-4 py-2 border border-dm-border-primary rounded-md shadow-sm text-sm font-medium text-dm-text-secondary bg-dm-bg-primary hover:bg-dm-bg-hover"
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
          Filtros
        </button>
      </div>
      
      {showAdvancedFilters && (
        <div className="bg-dm-bg-secondary p-4 rounded-md border border-dm-border-primary">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                Rol
              </label>
              <select
                className="block w-full rounded-md border-dm-border-primary shadow-sm p-2 border"
                value={roleFilter === 'ALL' ? 'ALL' : roleFilter}
                onChange={(e) => setRoleFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              >
                <option value="ALL">Todos los roles</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.description || role.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                Estado
              </label>
              <select
                className="block w-full rounded-md border-dm-border-primary shadow-sm p-2 border"
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