// src/features/fluvial/hooks/useUsersData.ts
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { usersService } from '../../../services/users.service';
import { rolesService } from '../../../services/roles.service';
import { User, Role } from '../../../types';

const ROLES_QUERY_KEY = 'roles';
const USERS_QUERY_KEY = 'users';

// Hook para obtener todos los roles
export const useRoles = (isActive = true) => {
  return useQuery<Role[]>({
    queryKey: [ROLES_QUERY_KEY, { isActive }],
    queryFn: () => rolesService.getAll(isActive),
    staleTime: 1000 * 60 * 15, // Cache de 15 minutos para roles
  });
};

// Hook para obtener usuarios, con opción de filtrar por rol
export const useUsers = (params: {
  role_id?: number;
  is_active?: boolean;
}) => {
  return useQuery<User[]>({
    queryKey: [USERS_QUERY_KEY, params],
    queryFn: () => {
      console.log('Buscando usuarios con params:', params); // Debug
      return usersService.search({ ...params, limit: 200 });
    },
    // La query solo se habilita si role_id es un número mayor que 0
    enabled: typeof params.role_id === 'number' && params.role_id > 0,
    staleTime: 1000 * 60 * 5,
  });
};

// Hook combinado para obtener específicamente los capitanes (usuarios con rol 'driver')
export const useCaptains = () => {
  // Obtenemos todos los roles para encontrar el ID del rol "driver"
  const { data: roles, isLoading: isLoadingRoles } = useRoles(true);

  // Buscamos el rol 'driver' (insensible a mayúsculas/minúsculas por seguridad)
  const driverRole = roles?.find(role => role.name.toLowerCase() === 'driver');
  const driverRoleId = driverRole?.id;

  // Debug
  useEffect(() => {
    if (!isLoadingRoles) {
      console.log("Roles cargados:", roles);
      console.log("Rol 'driver' encontrado:", driverRole);
      console.log("ID del rol 'driver':", driverRoleId);
    }
  }, [roles, isLoadingRoles, driverRole, driverRoleId]);

  // Usamos el ID del rol para buscar solo a los usuarios que son 'drivers'
  const {
    data: captains = [],
    isLoading: isLoadingCaptains,
    error
  } = useUsers({
    role_id: driverRoleId,
    is_active: true,
  });

  // Si los roles están cargando, el isLoading general debe ser true.
  const isLoading = isLoadingRoles || (!!driverRoleId && isLoadingCaptains);

  return {
    captains,
    isLoading,
    error,
  };
};
