// src/features/settings/components/users/RoleSelector.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Spinner } from '../../../../components/common/Spinner';
import { Role } from '../../../../types';
import { rolesService } from '../../../../services/roles.service';

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
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Cargar roles desde la API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoading(true);
        const data = await rolesService.getAll();
        setRoles(data);
      } catch (err) {
        console.error('Error al cargar roles:', err);
        toast.error('No se pudieron cargar los roles');
        // Usar roles por defecto en caso de error
        setRoles([
          { id: 1, name: 'admin', description: 'Administrador del Sistema' },
          { id: 2, name: 'sales', description: 'Personal de Ventas' },
          { id: 3, name: 'warehouse', description: 'Personal de Almacén' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRoles();
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Spinner size="sm" />
        <span className="text-gray-500">Cargando roles...</span>
      </div>
    );
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
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.description || role.name}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};