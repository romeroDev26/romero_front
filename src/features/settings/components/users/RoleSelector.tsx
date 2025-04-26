// src/features/settings/components/users/RoleSelector.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Role } from '../../../../types';
import { rolesService } from '../../../../services/roles.service';
import { Spinner } from '../../../../components/common/Spinner';

interface RoleSelectorProps {
  value: number | undefined;
  onChange: (value: number) => void;
  error?: string;
  disabled?: boolean;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ 
  value, 
  onChange, 
  error,
  disabled = false
}) => {
  // Obtener roles desde la API
  const { data: roles, isLoading, isError } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Spinner size="sm" />
        <span className="text-gray-500">Cargando roles...</span>
      </div>
    );
  }
  
  if (isError) {
    return <p className="text-red-500">Error al cargar roles</p>;
  }
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Rol *
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className={`mt-1 block w-full rounded-md shadow-sm p-2 border ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100' : ''}`}
      >
        <option value="">Seleccione un rol</option>
        {roles && roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.description || role.name}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};