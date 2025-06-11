// src/features/auth/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { authService } from '../../../services/auth.service';

const loginSchema = z.object({
  email: z.string().email('Ingrese un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    
    try {
      await authService.login(data);
      toast.success('Inicio de sesión exitoso');
      navigate('/');
    } catch (err: any) {
      // Mostrar mensaje específico según el tipo de error
      if (err.response) {
        if (err.response.status === 401) {
          toast.error('Credenciales incorrectas. Verifique su email y contraseña.');
        } else {
          toast.error(`Error ${err.response.status}: ${err.response?.data?.detail || 'Error en el servidor'}`);
        }
      } else if (err.request) {
        toast.error('No se pudo conectar con el servidor. Verifique su conexión a internet.');
      } else {
        toast.error(`Error al iniciar sesión: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
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

            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                placeholder="********"
                error={errors.password?.message}
                className="bg-gray-50"
                {...register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>

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