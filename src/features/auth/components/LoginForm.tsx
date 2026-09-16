// src/features/auth/components/LoginForm.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Eye, EyeOff, AtSign } from 'lucide-react'
import { authNotify } from '@/utils/sileo-toast'
import { useLockoutCountdown } from '@/hooks/useLockoutCountdown'
import { authService } from '../../../services/auth.service'

const loginSchema = z.object({
  email: z.string().email('Ingrese un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

/** Forma del error que puede devolver authService.login (error HTTP de axios o fallo de red). */
interface AuthRequestError {
  message?: string
  request?: unknown
  response?: {
    status?: number
    data?: {
      detail?: string | { message?: string; retry_after_seconds?: number | string }
    }
  }
}

const REMEMBER_KEY = 'tr_remembered_email'

export const LoginForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [lockoutMessage, setLockoutMessage] = useState<string>('Demasiados intentos fallidos. Cuenta bloqueada temporalmente.')
  
  const { isLocked, formattedTime, lockFromSeconds, clearLock } = useLockoutCountdown()
  const navigate = useNavigate()

  const extractLockoutInfo = (err: AuthRequestError): { message: string; retryAfter: number } | null => {
    if (err.response?.status !== 429) return null
    const detail = err.response?.data?.detail
    if (detail && typeof detail === 'object') {
      return {
        message: detail.message || 'Cuenta bloqueada temporalmente.',
        retryAfter: Number(detail.retry_after_seconds) || 300,
      }
    }
    return null
  }

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

      if (data.rememberMe) {
        localStorage.setItem(REMEMBER_KEY, data.email)
      } else {
        localStorage.removeItem(REMEMBER_KEY)
      }

      authNotify.success('Inicio de sesión exitoso', 'Redirigiendo al panel de control...')
      clearLock()
      navigate('/')
    } catch (caught: unknown) {
      const err = caught as AuthRequestError
      const lockoutInfo = extractLockoutInfo(err)
      if (lockoutInfo) {
        lockFromSeconds(lockoutInfo.retryAfter)
        setLockoutMessage(lockoutInfo.message)
        setLoginError(null)
        authNotify.error('Cuenta bloqueada temporalmente', lockoutInfo.message)
      } else if (err.response) {
        if (err.response.status === 401) {
          const msg = 'Credenciales incorrectas'
          setLoginError('Credenciales incorrectas. Verifique su email y contraseña.')
          authNotify.error(msg, 'Verifique su email y contraseña e intente de nuevo.')
        } else {
          const status = err.response.status
          const rawDetail = err.response?.data?.detail
          // El backend puede devolver `detail` como string o como objeto {message, ...}
          const detail =
            (typeof rawDetail === 'string' ? rawDetail : rawDetail?.message) || 'Error en el servidor'
          const msg = `Error ${status}: ${detail}`
          setLoginError(msg)
          authNotify.error('Error del servidor', detail)
        }
      } else if (err.request) {
        const msg = 'No se pudo conectar con el servidor. Verifique su conexión a internet.'
        setLoginError(msg)
        authNotify.error('Sin conexión', 'Verifique su conexión a internet e intente de nuevo.')
      } else {
        const msg = `Error al iniciar sesión: ${err.message}`
        setLoginError(msg)
        authNotify.error('Error inesperado', err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="flex flex-col gap-5 w-full max-w-[400px]" onSubmit={handleSubmit(onSubmit)} noValidate>
      
      {/* Estado Bloqueado */}
      {isLocked && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl px-4 py-3 flex items-start gap-3 transition-colors duration-300">
          <div className="mt-0.5 shrink-0 text-red-500 dark:text-red-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <div className="text-[13px] font-semibold text-red-700 dark:text-red-400">Cuenta bloqueada</div>
            <div className="mt-1 text-[12px] text-red-600 dark:text-red-300 leading-relaxed">
              {lockoutMessage} Reintente en <span className="font-mono font-bold">{formattedTime}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error de Login */}
      {loginError && !isLocked && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl px-4 py-3 flex items-start justify-between transition-colors duration-300">
          <div className="mr-3 text-[13px] leading-relaxed text-red-700 dark:text-red-300">{loginError}</div>
          <button
            type="button"
            className="text-red-500 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors text-xs shrink-0 mt-0.5"
            onClick={() => setLoginError(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Correo */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[13px] font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
          Correo electrónico
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <AtSign className="h-4 w-4 text-gray-400 dark:text-gray-500 transition-colors duration-300" />
          </div>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="block w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#131B2F] border border-gray-200 dark:border-gray-800 rounded-xl text-[14px] placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300"
            placeholder="usuario@ejemplo.com"
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-[12px] text-red-500 dark:text-red-400 pl-1">{errors.email.message}</p>
        )}
      </div>

      {/* Input Contraseña */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-[13px] font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
          Contraseña
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Lock className="h-4 w-4 text-gray-400 dark:text-gray-500 transition-colors duration-300" />
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className="block w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-[#131B2F] border border-gray-200 dark:border-gray-800 rounded-xl text-[14px] placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300"
            placeholder="••••••••"
            {...register('password')}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-[12px] text-red-500 dark:text-red-400 pl-1">{errors.password.message}</p>
        )}
      </div>

      {/* Recordarme */}
      <div className="flex items-center mt-2">
        <button
          type="button"
          onClick={() => {
            if (isLocked) return
            const el = document.getElementById('rememberMe') as HTMLInputElement | null
            if (el) el.click()
          }}
          className={`w-9 h-5 rounded-full relative transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#0A0F1C] focus:ring-blue-500 ${
            rememberMeChecked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
          } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`absolute left-[2px] top-[2px] w-3.5 h-3.5 rounded-full bg-white transition-transform duration-300 ease-in-out shadow-sm ${
              rememberMeChecked ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
        <input
          id="rememberMe"
          type="checkbox"
          className="sr-only"
          disabled={isLocked}
          {...register('rememberMe')}
        />
        <span className="ml-3 text-[13px] text-gray-600 dark:text-gray-400 transition-colors duration-300 cursor-pointer" onClick={() => {
            if (isLocked) return
            const el = document.getElementById('rememberMe') as HTMLInputElement | null
            if (el) el.click()
          }}>
          Recordarme en este dispositivo
        </span>
      </div>

      {/* Botón Login */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-[15px] font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#0A0F1C] focus:ring-blue-500 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed mt-4 active:scale-[0.98]"
      >
        {isLoading ? 'Autenticando...' : 'Iniciar Sesión'}
      </button>
    </form>
  )
}
