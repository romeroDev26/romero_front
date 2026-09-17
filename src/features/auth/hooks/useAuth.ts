// src/features/auth/hooks/useAuth.ts
import { useQuery } from '@tanstack/react-query';
import { authService } from '../../../services/auth.service';
import { User } from '../../../types';

export const useAuth = () => {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<User> => {
      try {
        const data = await authService.getProfile();
        return data;
      } catch (error) {
        console.error('Error al obtener el perfil del usuario:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1
  });

  const isAuthenticated = authService.isAuthenticated();

  return {
    user,
    isLoading,
    error,
    isAuthenticated
  };
};