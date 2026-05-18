// src/features/settings/components/users/RoleSelector.tsx
import React, { useState, useEffect } from 'react';
import { toast } from '@/utils/sileo-toast';
import { Spinner } from '../../../../components/common/Spinner';
import { Role } from '../../../../types';
import { rolesService } from '../../../../services/roles.service';

interface RoleSelectorProps {
  value: number | undefined;
  onChange: (value: number) => void;
  error?: string;
  disabled?: boolean;
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

// Roles por defecto que se usarán en caso de error
const DEFAULT_ROLES: Role[] = [
  {
    id: 1, name: 'admin', description: 'Administrador del Sistema',
    is_active: false
  },
  {
    id: 2, name: 'sales', description: 'Personal de Ventas',
    is_active: false
  },
  {
    id: 3, name: 'warehouse', description: 'Personal de Almacén',
    is_active: false
  }
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({ 
  value, 
  onChange, 
  error,
  disabled = false
}) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Cargar roles desde la API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        const data = await rolesService.getAll();
        
        // Verificar si se obtuvo una respuesta válida
        if (Array.isArray(data) && data.length > 0) {
          setRoles(data);
        } else {
          console.warn('La respuesta de roles no tiene el formato esperado, usando valores por defecto');
          setRoles(DEFAULT_ROLES);
          setHasError(true);
        }
      } catch (err) {
        console.error('Error al cargar roles:', err);
        // Notificar solo una vez y de manera menos intrusiva
        if (!hasError) {
          toast.warning('Usando roles por defecto debido a un problema de conexión', {
            autoClose: 3000
          });
        }
        // Usar roles por defecto en caso de error
        setRoles(DEFAULT_ROLES);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRoles();
  }, [hasError]);
  
  // Selección correcta de valor inicial
  useEffect(() => {
    // Si no hay valor seleccionado, hay roles disponibles y no estamos en modo deshabilitado
    if ((!value || value === 0) && roles.length > 0 && !disabled && !isLoading) {
      // Sugerir seleccionar un valor pero no forzar una selección automática
      console.log('Roles disponibles para selección:', roles.map(r => `${r.id}: ${r.name}`).join(', '));
    }
  }, [value, roles, disabled, isLoading]);
  
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
      {hasError && (
        <div className="text-xs text-amber-600 mb-1">
          Usando información de roles almacenada localmente
        </div>
      )}
      <select
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className={`mt-1 block w-full rounded-md shadow-sm p-2 pr-8 border ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100' : ''} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
      >
        <option value="">Seleccione un rol</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {getRoleDisplayName(role.name)}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};