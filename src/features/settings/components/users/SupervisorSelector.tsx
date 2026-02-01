// src/features/settings/components/users/SupervisorSelector.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersService } from '../../../../services/users.service';

interface SupervisorSelectorProps {
  value?: string;
  onChange: (supervisorId: string | null) => void;
  error?: string;
  currentUserId?: string; // Para evitar que un usuario sea su propio supervisor
}

// Traducciones de roles
const ROLE_TRANSLATIONS: Record<string, string> = {
  'admin': 'Administrador',
  'sales': 'Ventas',
  'warehouse': 'Almacén',
  'supervisor': 'Supervisor',
  'accountant': 'Contador',
  'dispatcher': 'Despachador',
  'driver': 'Conductor',
};

// Función para obtener el nombre traducido del rol
const getRoleDisplayName = (roleName: string): string => {
  return ROLE_TRANSLATIONS[roleName.toLowerCase()] || roleName.charAt(0).toUpperCase() + roleName.slice(1);
};

export const SupervisorSelector: React.FC<SupervisorSelectorProps> = ({
  value,
  onChange,
  error,
  currentUserId,
}) => {
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getAll(),
  });

  // Filtrar solo usuarios activos con rol "supervisor"
  // Excluir al usuario actual para evitar auto-asignación
  const availableSupervisors = users?.filter(
    user => 
      user.is_active && 
      user.id !== currentUserId &&
      (user.role_name?.toLowerCase() === 'supervisor' || user.role?.name?.toLowerCase() === 'supervisor')
  ) || [];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue === '' ? null : selectedValue);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Supervisor
      </label>
      <select
        value={value || ''}
        onChange={handleChange}
        disabled={isLoading}
        className={`
          mt-1 block w-full rounded-md shadow-sm p-2 pr-8
          ${error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }
          disabled:bg-gray-100 disabled:cursor-not-allowed
          focus:ring-2
        `}
      >
        <option value="">Sin supervisor asignado</option>
        {availableSupervisors.map((user) => (
          <option key={user.id} value={user.id}>
            {user.full_name} - {user.role_name ? getRoleDisplayName(user.role_name) : ''}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      <p className="mt-1 text-xs text-gray-500">
        Opcional: Asignar un supervisor para este usuario
      </p>
    </div>
  );
};
