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
  // Datos simulados para el ejemplo
  const simulatedRoles: Role[] = [
    { id: 1, name: 'admin', description: 'Administrador del Sistema' },
    { id: 2, name: 'sales', description: 'Personal de Ventas y Pasajes' },
    { id: 3, name: 'warehouse', description: 'Personal de Almacén/Recepción Carga' },
    { id: 4, name: 'dispatcher', description: 'Personal de Despacho/Encomiendas' },
    { id: 5, name: 'accountant', description: 'Contador' },
    { id: 6, name: 'driver', description: 'Conductor/Tripulante' }
  ];
  
  // Configuración de React Query para obtener roles
  const { data: roles, isLoading, isError } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      try {
        return await rolesService.getAll();
      } catch (error) {
        console.error('Error al cargar roles:', error);
        return simulatedRoles; // Fallback a datos simulados en caso de error
      }
    },
    retry: 1, // Intentar una vez más en caso de fallo
    staleTime: 5 * 60 * 1000, // Datos considerados frescos por 5 minutos
    gcTime: 30 * 60 * 1000, // Mantener en caché por 30 minutos (antes cacheTime)
  });
  
  // Usar roles simulados por ahora
  const availableRoles = roles || simulatedRoles;
  
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
        {availableRoles && availableRoles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.description || role.name}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};