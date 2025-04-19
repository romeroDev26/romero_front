import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';

const loginSchema = z.object({
  email: z.string().email('Ingrese un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
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
    setIsLoading(true);
    
    // TODO: Implementar autenticación en el futuro
    // try {
    //   const response = await api.post('/auth/login', data);
    //   localStorage.setItem('authToken', response.data.token);
    //   localStorage.setItem('user', JSON.stringify(response.data.user));
    // } catch (err: any) {
    //   setError(err.response?.data?.message || 'Error al iniciar sesión');
    //   return;
    // }

    // Por ahora, solo simulamos un pequeño delay y redireccionamos
    setTimeout(() => {
      setIsLoading(false);
      navigate('/');
    }, 500);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sección izquierda - Decorativa */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 to-primary/30 items-center justify-center p-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-6">Transportes Romero</h1>
          <div className="max-w-md">
            <p className="text-gray-700 text-lg mb-8">
              Sistema integrado de gestión y facturación electrónica.
            </p>
            <img 
              src="/icon_romero.png" 
              alt="Logo Transportes Romero" 
              className="w-48 h-48 mx-auto mb-8"
            />
          </div>
        </div>
      </div>

      {/* Sección derecha - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-800">Bienvenido</h2>
            <p className="text-gray-600 mt-2">Ingrese sus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Correo Electrónico"
              type="email"
              placeholder="correo@ejemplo.com"
              error={errors.email?.message}
              className="bg-gray-50"
              {...register('email')}
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="********"
              error={errors.password?.message}
              className="bg-gray-50"
              {...register('password')}
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full py-2.5"
            >
              Iniciar Sesión
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-8">
            ©{new Date().getFullYear()} Transportes Romero. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};
