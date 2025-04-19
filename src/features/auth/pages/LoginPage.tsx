import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import api from '../../../config/api';

const loginSchema = z.object({
  email: z.string().email('Ingrese un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.post('/auth/login', data);
      
      // Guardar token en localStorage
      localStorage.setItem('authToken', response.data.token);
      
      // Guardar información del usuario si es necesario
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redireccionar al dashboard
      navigate('/');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Error al iniciar sesión. Por favor, intente nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">Transportes Romero</h1>
          <p className="text-gray-600 mt-2">Sistema de Facturación Electrónica</p>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="correo@ejemplo.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Contraseña"
            type="password"
            placeholder="********"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full"
          >
            Iniciar Sesión
          </Button>
        </form>
      </div>
    </div>
  );
};
