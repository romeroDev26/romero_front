// src/features/auth/pages/LoginPage.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from '@/utils/sileo-toast'
import { authService } from '../../../services/auth.service'

// Esquema de validación con el campo opcional 'rememberMe'
const loginSchema = z.object({
  email: z.string().email('Ingrese un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

const REMEMBER_KEY = 'tr_remembered_email'

export const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const navigate = useNavigate()

  const rememberedEmail = typeof window !== 'undefined' ? localStorage.getItem(REMEMBER_KEY) : null

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: rememberedEmail || '',
      rememberMe: !!rememberedEmail,
    },
  })

  const rememberMeChecked = watch('rememberMe')

  const onSubmit = async (data: LoginFormData) => {
    setLoginError(null)
    setIsLoading(true)
    try {
      await authService.login(data)

      // Persistir o limpiar email según "Recordarme"
      if (data.rememberMe) {
        localStorage.setItem(REMEMBER_KEY, data.email)
      } else {
        localStorage.removeItem(REMEMBER_KEY)
      }

      toast.success('Inicio de sesión exitoso')
      navigate('/')
    } catch (err: any) {
      if (err.response) {
        if (err.response.status === 401) {
          const msg = 'Credenciales incorrectas. Verifique su email y contraseña.'
          setLoginError(msg)
          toast.error(msg)
        } else {
          const msg = `Error ${err.response.status}: ${err.response?.data?.detail || 'Error en el servidor'}`
          setLoginError(msg)
          toast.error(msg)
        }
      } else if (err.request) {
        const msg = 'No se pudo conectar con el servidor. Verifique su conexión a internet.'
        setLoginError(msg)
        toast.error(msg)
      } else {
        const msg = `Error al iniciar sesión: ${err.message}`
        setLoginError(msg)
        toast.error(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sección Izquierda: Formulario */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[460px] bg-[#efefef] rounded-[20px] p-8 sm:p-10">
          {/* Brand mark */}
          <div className="mb-10">
            <div className="w-10 h-10 bg-[#1F4690] rounded-lg flex items-center justify-center mb-6">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 17h1m16 0h1M5.5 17l1.5-8h10l1.5 8M5.5 17h13M8 9V6a1 1 0 011-1h2a1 1 0 011 1v3M12 9V4" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 20.5c1.5-1 3-1.5 4.5-1.5s3 .5 4.5 1.5c1.5-1 3-1.5 4.5-1.5s3 .5 4.5 1.5" />
              </svg>
            </div>
            <h1
              className="text-[32px] font-medium text-[#202020] tracking-[-0.64px] leading-[1.19]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Bienvenido
            </h1>
            <p className="mt-2 text-[15px] text-[#4d4d4d] leading-[1.33]">
              Ingrese sus credenciales para continuar
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {loginError && (
              <div
                className="bg-white border border-[#e8e8e8] text-[#202020] px-5 py-3.5 rounded-[12px] flex items-start justify-between"
                role="alert"
              >
                <div className="mr-4 text-[14px] leading-[1.33] text-[#cf1322]">{loginError}</div>
                <button
                  type="button"
                  className="text-[#828282] hover:text-[#202020] transition-colors text-[12px]"
                  onClick={() => setLoginError(null)}
                  aria-label="Cerrar mensaje de error"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-[#828282]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                </svg>
              </div>
              <input
                type="email"
                placeholder="Correo Electrónico"
                autoComplete="email"
                className="w-full px-4 py-3.5 rounded-[20px] bg-white border border-[#e8e8e8] focus:border-[#1F4690] focus:outline-none focus:ring-2 focus:ring-[#1F4690]/10 pl-11 text-[15px] text-[#202020] placeholder:text-[#828282] transition-all"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1.5 text-[13px] text-[#cf1322] ml-4">{errors.email.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-[#828282]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                autoComplete="current-password"
                className="w-full px-4 py-3.5 rounded-[20px] bg-white border border-[#e8e8e8] focus:border-[#1F4690] focus:outline-none focus:ring-2 focus:ring-[#1F4690]/10 pl-11 pr-11 text-[15px] text-[#202020] placeholder:text-[#828282] transition-all"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#828282] hover:text-[#4d4d4d] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
              {errors.password && (
                <p className="mt-1.5 text-[13px] text-[#cf1322] ml-4">{errors.password.message}</p>
              )}
            </div>

            {/* Recordarme */}
            <div className="flex items-center">
              <label htmlFor="rememberMe" className="flex items-center cursor-pointer select-none">
                <div className="relative">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    aria-label="Recordarme"
                    className="sr-only"
                    {...register('rememberMe')}
                  />
                  <div
                    className={`block w-12 h-7 rounded-full transition-colors ${rememberMeChecked ? 'bg-[#1F4690]' : 'bg-[#e8e8e8]'}`}
                  />
                  <div
                    className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform shadow-sm ${rememberMeChecked ? 'translate-x-[20px]' : 'translate-x-0'}`}
                  />
                </div>
                <span className="ml-3 text-[#4d4d4d] text-[15px]">Recordarme</span>
              </label>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#1F4690] hover:bg-[#163672] text-white font-medium rounded-[20px] transition-all duration-200 text-[16px] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>

      {/* Sección Derecha: Banner */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#1F4690] relative overflow-hidden items-end p-16">
        {/* Decorative analytical grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        {/* Decorative orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[420px] h-[420px] bg-white/[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] bg-white/[0.03] rounded-full blur-3xl" />

        <div className="relative z-10 text-white max-w-md">
          <h2
            className="text-[40px] font-medium leading-[1.13] tracking-[-0.8px]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Sistema de
            <br />
            Gestión
          </h2>
          <div className="w-12 h-[2px] bg-white/30 mt-6 mb-6" />
          <p className="text-[15px] text-white/60 leading-[1.5]">
            Plataforma integrada de gestión y facturación electrónica.
            Administre sus operaciones de manera eficiente y moderna.
          </p>
        </div>
      </div>
    </div>
  )
}
