// src/features/auth/pages/LoginPage.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { Button } from '../../../components/common/Button'
import { Input } from '../../../components/common/Input'
import { authService } from '../../../services/auth.service'

// Esquema de validación con el campo opcional 'rememberMe'
const loginSchema = z.object({
  email: z.string().email('Ingrese un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

export const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      // Tu lógica de login no cambia
      await authService.login(data)
      toast.success('Inicio de sesión exitoso')
      navigate('/')
    } catch (err: any) {
      if (err.response) {
        if (err.response.status === 401) {
          toast.error('Credenciales incorrectas. Verifique su email y contraseña.')
        } else {
          toast.error(`Error ${err.response.status}: ${err.response?.data?.detail || 'Error en el servidor'}`)
        }
      } else if (err.request) {
        toast.error('No se pudo conectar con el servidor. Verifique su conexión a internet.')
      } else {
        toast.error(`Error al iniciar sesión: ${err.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex justify-center items-center">
      <div className="max-w-screen-xl m-0 sm:m-10 bg-white shadow-xl sm:rounded-lg flex justify-center flex-1">
        
        {/* Sección Izquierda: Formulario de Login */}
        <div className="lg:w-1/2 xl:w-5/12 p-6 sm:p-12 flex flex-col justify-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 17h1m16 0h1M5.5 17l1.5-8h10l1.5 8M5.5 17h13M8 9V6a1 1 0 011-1h2a1 1 0 011 1v3M12 9V4" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 20.5c1.5-1 3-1.5 4.5-1.5s3 .5 4.5 1.5c1.5-1 3-1.5 4.5-1.5s3 .5 4.5 1.5" />
              </svg>
            </div>
          </div>
          <div className="w-full flex-1">
            <div className="mx-auto max-w-xs text-center">
              <h1 className="text-3xl font-semibold" style={{ fontFamily: "Montserrat, sans-serif" }}>Bienvenido</h1>
              <p className="text-gray-600 mt-2">
                Ingrese sus credenciales para continuar
              </p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 max-w-xs mx-auto space-y-5">
              {/* Campo de Email con tu label y placeholder */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                  </svg>
                </div>
                <Input
                  type="email"
                  placeholder="Correo Electrónico"
                  error={errors.email?.message}
                  className="w-full px-4 py-3 rounded-lg bg-gray-100 border border-gray-200 focus:border-indigo-500 focus:bg-white focus:ring-0 pl-10"
                  {...register('email')}
                />
              </div>

              {/* Campo de Contraseña con tu label, placeholder y toggle */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  error={errors.password?.message}
                  className="w-full px-4 py-3 rounded-lg bg-gray-100 border border-gray-200 focus:border-indigo-500 focus:bg-white focus:ring-0 pl-10 pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              
              {/* Remember me (puedes cambiar "Remember me" a "Recordarme") */}
              <div className="flex items-center">
                <label htmlFor="rememberMe" className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input id="rememberMe" type="checkbox" aria-label="Recordarme" className="sr-only" {...register('rememberMe')} />
                    <div className="block bg-gray-200 w-10 h-6 rounded-full"></div>
                    <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform"></div>
                  </div>
                  <div className="ml-3 text-gray-700 font-medium">Recordarme</div>
                </label>
              </div>

              {/* Botón de Login con tu texto original */}
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all duration-300 ease-in-out"
              >
                {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            {/* Enlace de registro eliminado intencionalmente */}
          </div>
        </div>

        {/* Sección Derecha: Banner */}
        <div className="flex-1 bg-gradient-to-br from-indigo-600 to-indigo-800 text-center hidden lg:flex rounded-r-lg">
          <div className="w-full h-full flex items-center justify-center p-12">
            <div className="text-white">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 17h1m16 0h1M5.5 17l1.5-8h10l1.5 8M5.5 17h13M8 9V6a1 1 0 011-1h2a1 1 0 011 1v3M12 9V4" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 20.5c1.5-1 3-1.5 4.5-1.5s3 .5 4.5 1.5c1.5-1 3-1.5 4.5-1.5s3 .5 4.5 1.5" />
                  </svg>
                </div>
              </div>
              <h1 className="text-4xl font-bold leading-tight">
                Sistema de Gestión
              </h1>
              <p className="mt-4 text-indigo-100 max-w-lg mx-auto text-lg">
                Plataforma integrada de gestión y facturación electrónica. 
                Administre sus operaciones de manera eficiente y moderna.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Estilos para el toggle 'Remember me' */}
      <style>{`
        input:checked ~ .dot {
          transform: translateX(100%);
          background-color: #4f46e5; /* indigo-600 */
        }
        input:checked ~ .block {
          background-color: #c7d2fe; /* indigo-200 */
        }
      `}</style>
    </div>
  );
};