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
      {/* Sección izquierda - Efecto Espacial */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-gradient-to-b from-slate-900 via-blue-900 to-blue-600">
        {/* Estrellas Geométricas Dispersas - Espaciado Elegante */}
        <div className="absolute inset-0">
          {/* Sección Superior - Espaciado y Elegante */}
          <div className="absolute top-12 left-20 w-64 h-8 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full transform rotate-45 opacity-60 animate-pulse"></div>
          <div className="absolute top-32 left-80 w-48 h-6 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full transform rotate-45 opacity-50 animate-pulse delay-800"></div>
          <div className="absolute top-8 right-32 w-56 h-7 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transform rotate-45 opacity-55 animate-pulse delay-400"></div>
          
          {/* Medio Superior - Bien Espaciado */}
          <div className="absolute top-56 left-32 w-40 h-5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transform rotate-45 opacity-45 animate-pulse delay-1200"></div>
          <div className="absolute top-48 right-48 w-36 h-5 bg-gradient-to-r from-cyan-300 to-blue-300 rounded-full transform rotate-45 opacity-50 animate-pulse delay-600"></div>
          <div className="absolute top-72 left-96 w-32 h-4 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full transform rotate-45 opacity-40 animate-pulse delay-1600"></div>
          
          {/* Área Central - Elementos Mínimos */}
          <div className="absolute top-96 left-24 w-52 h-6 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full transform rotate-45 opacity-45 animate-pulse delay-1000"></div>
          <div className="absolute top-88 right-24 w-44 h-5 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full transform rotate-45 opacity-40 animate-pulse delay-1800"></div>
          <div className="absolute top-112 left-72 w-28 h-3 bg-gradient-to-r from-pink-300 to-rose-300 rounded-full transform rotate-45 opacity-35 animate-pulse delay-2200"></div>
          
          {/* Sección Inferior - Más Ligero y Menos Elementos */}
          <div className="absolute bottom-64 left-16 w-48 h-6 bg-gradient-to-r from-blue-300 to-cyan-300 rounded-full transform rotate-45 opacity-50 animate-pulse delay-500"></div>
          <div className="absolute bottom-48 right-40 w-40 h-5 bg-gradient-to-r from-cyan-300 to-teal-300 rounded-full transform rotate-45 opacity-45 animate-pulse delay-1400"></div>
          <div className="absolute bottom-32 left-64 w-36 h-4 bg-gradient-to-r from-teal-300 to-emerald-300 rounded-full transform rotate-45 opacity-40 animate-pulse delay-900"></div>
          <div className="absolute bottom-16 right-16 w-32 h-4 bg-gradient-to-r from-emerald-300 to-green-300 rounded-full transform rotate-45 opacity-35 animate-pulse delay-2000"></div>
          
          {/* Círculos de Acento Flotantes - Mínimos */}
          <div className="absolute top-40 left-112 w-8 h-8 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full opacity-30 animate-pulse delay-2400"></div>
          <div className="absolute top-80 right-80 w-6 h-6 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full opacity-25 animate-pulse delay-2800"></div>
          <div className="absolute bottom-80 left-40 w-10 h-10 bg-gradient-to-br from-cyan-300 to-blue-300 rounded-full opacity-35 animate-pulse delay-3200"></div>
          <div className="absolute bottom-40 right-72 w-7 h-7 bg-gradient-to-br from-indigo-300 to-purple-300 rounded-full opacity-30 animate-pulse delay-3600"></div>
          
          {/* Micro Elementos Sutiles */}
          <div className="absolute top-64 left-56 w-16 h-2 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full transform rotate-45 opacity-25 animate-pulse delay-4000"></div>
          <div className="absolute top-104 right-56 w-14 h-2 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full transform rotate-45 opacity-20 animate-pulse delay-4400"></div>
          <div className="absolute bottom-56 left-88 w-18 h-2 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full transform rotate-45 opacity-25 animate-pulse delay-4800"></div>
        </div>

        {/* Contenido */}
        <div className="relative z-10 flex flex-col justify-center items-center px-20 text-white text-center">
          <h1 className="text-7xl font-bold mb-8 leading-tight">
            Transportes Romero
          </h1>
          <p className="text-xl opacity-90 max-w-lg leading-relaxed">
            Sistema integrado de gestión y facturación electrónica. 
            Administre sus operaciones de transporte de manera eficiente y moderna.
          </p>
        </div>
      </div>

      {/* Sección derecha - Formulario de Login */}
      <div className="w-full lg:w-2/5 flex flex-col items-center justify-center p-8 bg-gray-50">
        {/* Logo de la empresa encima del formulario */}
        <div className="mb-6">
          <img 
            src="/icon_romero.png" 
            alt="Logo Transportes Romero" 
            className="w-48 h-48 mx-auto"
          />
        </div>
        
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Bienvenido</h2>
              <p className="text-gray-600">Ingrese sus credenciales para continuar</p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Campo de Email */}
              <div className="relative">
                <Input
                  label="Correo Electrónico"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  error={errors.email?.message}
                  className="bg-gray-50 pl-10"
                  {...register('email')}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none top-6">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              {/* Campo de Contraseña */}
              <div className="relative">
                <Input
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  error={errors.password?.message}
                  className="bg-gray-50 pl-10 pr-12"
                  {...register('password')}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none top-6">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors top-6"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Botón de Login */}
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Header para móviles */}
      <div className="lg:hidden absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-500 p-4 z-10">
        <div className="flex items-center justify-center">
          <img 
            src="/icon_romero.png" 
            alt="Logo Transportes Romero" 
            className="w-10 h-10 mr-3"
          />
          <h1 className="text-white text-xl font-bold">Transportes Romero</h1>
        </div>
      </div>
    </div>
  );
};