// src/features/auth/pages/LoginPage.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authNotify } from '@/utils/sileo-toast'
import { useLockoutCountdown } from '@/hooks/useLockoutCountdown'
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
  const [lockoutMessage, setLockoutMessage] = useState<string>('Demasiados intentos fallidos. Cuenta bloqueada temporalmente.')
  const { isLocked, formattedTime, lockFromSeconds, clearLock } = useLockoutCountdown()
  const navigate = useNavigate()

  const extractLockoutInfo = (err: any): { message: string; retryAfter: number } | null => {
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

      // Persistir o limpiar email según "Recordarme"
      if (data.rememberMe) {
        localStorage.setItem(REMEMBER_KEY, data.email)
      } else {
        localStorage.removeItem(REMEMBER_KEY)
      }

      authNotify.success('Inicio de sesión exitoso', 'Redirigiendo al panel de control...')
      clearLock()
      navigate('/')
    } catch (err: any) {
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
          const detail = err.response?.data?.detail || 'Error en el servidor'
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
    <div className="min-h-screen bg-white flex">
      {/* ═══════════════════════════════════════════════
          Panel Izquierda — Formulario
          ═══════════════════════════════════════════════ */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-5 sm:p-8 lg:p-12">
        <div className="w-full max-w-[440px]">
          {/* Card */}
          <div className="bg-[#f5f5f5] rounded-[24px] p-7 sm:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            {/* Brand */}
            <div className="mb-8">
              <div className="w-11 h-11 bg-[#1F4690] rounded-[14px] flex items-center justify-center mb-5 shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 17h1m16 0h1M5.5 17l1.5-8h10l1.5 8M5.5 17h13M8 9V6a1 1 0 011-1h2a1 1 0 011 1v3M12 9V4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 20.5c1.5-1 3-1.5 4.5-1.5s3 .5 4.5 1.5c1.5-1 3-1.5 4.5-1.5s3 .5 4.5 1.5" />
                </svg>
              </div>
              <h1
                className="text-[28px] sm:text-[30px] font-semibold text-[#111111] tracking-[-0.6px] leading-[1.15]"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Bienvenido
              </h1>
              <p className="mt-2 text-[15px] text-[#6b7280] leading-[1.45]">
                Ingrese sus credenciales para continuar
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Bloqueo */}
              {isLocked && (
                <div
                  className="bg-[#fef2f2] border border-[#fecaca] rounded-[16px] px-4 py-3.5 flex items-start gap-3"
                  role="alert"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <svg className="h-5 w-5 text-[#dc2626]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-[#991b1b]">
                      Cuenta bloqueada temporalmente
                    </div>
                    <div className="mt-0.5 text-[13px] text-[#b91c1c] leading-[1.4]">
                      {lockoutMessage} Intente nuevamente en{' '}
                      <span className="font-mono font-semibold tabular-nums">{formattedTime}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error genérico */}
              {loginError && (
                <div
                  className="bg-white border border-[#e5e7eb] rounded-[16px] px-4 py-3 flex items-start justify-between"
                  role="alert"
                >
                  <div className="mr-3 text-[13px] leading-[1.5] text-[#dc2626]">{loginError}</div>
                  <button
                    type="button"
                    className="text-[#9ca3af] hover:text-[#374151] transition-colors text-[12px] flex-shrink-0 mt-0.5"
                    onClick={() => setLoginError(null)}
                    aria-label="Cerrar mensaje de error"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Email */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-[18px] w-[18px] text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    placeholder="Correo Electrónico"
                    autoComplete="email"
                    disabled={isLocked}
                    className="w-full h-[52px] bg-white border border-[#e5e7eb] rounded-[16px] pl-11 pr-4 text-[15px] text-[#111111] placeholder:text-[#9ca3af] transition-all outline-none focus:border-[#1F4690] focus:ring-[3px] focus:ring-[#1F4690]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-[12px] text-[#dc2626] ml-1">{errors.email.message}</p>
                )}
              </div>

              {/* Contraseña */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-[18px] w-[18px] text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Contraseña"
                    autoComplete="current-password"
                    disabled={isLocked}
                    className="w-full h-[52px] bg-white border border-[#e5e7eb] rounded-[16px] pl-11 pr-11 text-[15px] text-[#111111] placeholder:text-[#9ca3af] transition-all outline-none focus:border-[#1F4690] focus:ring-[3px] focus:ring-[#1F4690]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#9ca3af] hover:text-[#4b5563] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-[12px] text-[#dc2626] ml-1">{errors.password.message}</p>
                )}
              </div>

              {/* Recordarme */}
              <div className="flex items-center justify-between">
                <label htmlFor="rememberMe" className="flex items-center cursor-pointer select-none gap-3">
                  <div className="relative">
                    <input
                      id="rememberMe"
                      type="checkbox"
                      aria-label="Recordarme"
                      className="sr-only"
                      disabled={isLocked}
                      {...register('rememberMe')}
                    />
                    <div
                      className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                        rememberMeChecked ? 'bg-[#1F4690]' : 'bg-[#d1d5db]'
                      } ${isLocked ? 'opacity-50' : ''}`}
                    />
                    <div
                      className={`absolute top-[2px] left-[2px] bg-white w-5 h-5 rounded-full transition-transform duration-200 shadow-sm ${
                        rememberMeChecked ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                  <span className="text-[14px] text-[#4b5563]">Recordarme</span>
                </label>
              </div>

              {/* Botón */}
              <button
                type="submit"
                disabled={isLoading || isLocked}
                className="w-full h-[52px] bg-[#1F4690] hover:bg-[#163672] active:scale-[0.98] text-white font-medium rounded-[16px] transition-all duration-200 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isLoading ? 'Iniciando sesión...' : isLocked ? `Bloqueado (${formattedTime})` : 'Iniciar Sesión'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-[13px] text-[#9ca3af]">
            © {new Date().getFullYear()} Transportes Romero
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          Panel Derecha — Brand (desktop only)
          Patrón abstracto de "rutas fluviales"
          ═══════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#1F4690] relative overflow-hidden items-end p-16">
        {/* Rutas fluviales animadas — solo pulsos de luz */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 800 800"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <style>{`
            @keyframes flow {
              0% { stroke-dashoffset: 3000; }
              100% { stroke-dashoffset: 0; }
            }
            @keyframes flowReturn {
              0% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: 3000; }
            }
            .route {
              fill: none;
              stroke-linecap: round;
            }
            .route-trace {
              stroke: white;
              stroke-dasharray: 50 3000;
              animation: flow linear infinite;
            }
            .route-trace-return {
              stroke: white;
              stroke-dasharray: 50 3000;
              animation: flowReturn linear infinite;
            }
            .route-bg {
              stroke: white;
              opacity: 0.035;
            }
            .v-slow { animation-duration: 22s; }
            .slow { animation-duration: 16s; }
            .medium { animation-duration: 11s; }
            .fast { animation-duration: 7s; }
            .d-0 { animation-delay: 0s; }
            .d-1 { animation-delay: 3.7s; }
            .d-2 { animation-delay: 8.2s; }
            .d-3 { animation-delay: 1.4s; }
            .d-4 { animation-delay: 12.5s; }
            .d-5 { animation-delay: 5.9s; }
            .d-6 { animation-delay: 15.1s; }
          `}</style>

          {/* Fondo de rutas sutiles (siempre visibles, muy tenue) */}
          <path className="route route-bg" d="M-100 600 C 150 550, 250 650, 400 500 S 700 400, 900 450" strokeWidth="1.5" />
          <path className="route route-bg" d="M-100 400 C 100 350, 300 450, 500 300 S 800 200, 900 250" strokeWidth="1" />
          <path className="route route-bg" d="M-100 700 C 200 650, 400 750, 600 600 S 900 500, 1000 550" strokeWidth="0.8" />
          <path className="route route-bg" d="M200 -100 C 250 150, 150 300, 350 400 S 600 500, 700 700" strokeWidth="0.8" />
          <path className="route route-bg" d="M500 -100 C 550 100, 450 250, 650 350 S 900 450, 950 700" strokeWidth="1" />
          <path className="route route-bg" d="M-50 200 C 150 250, 350 150, 550 250 S 850 350, 950 300" strokeWidth="0.6" />
          <path className="route route-bg" d="M100 800 C 200 650, 300 700, 500 550 S 750 450, 900 500" strokeWidth="0.6" />

          {/* Rutas animadas — pulsos de luz lentos y aleatorios */}
          <path
            className="route route-trace slow d-0"
            d="M-100 600 C 150 550, 250 650, 400 500 S 700 400, 900 450"
            strokeWidth="2"
            filter="drop-shadow(0 0 5px rgba(255,255,255,0.5))"
          />
          <path
            className="route route-trace-return medium d-1"
            d="M-100 400 C 100 350, 300 450, 500 300 S 800 200, 900 250"
            strokeWidth="1.5"
            filter="drop-shadow(0 0 4px rgba(255,255,255,0.4))"
          />
          <path
            className="route route-trace fast d-2"
            d="M-100 700 C 200 650, 400 750, 600 600 S 900 500, 1000 550"
            strokeWidth="1.5"
            filter="drop-shadow(0 0 4px rgba(255,255,255,0.4))"
          />
          <path
            className="route route-trace-return v-slow d-3"
            d="M200 -100 C 250 150, 150 300, 350 400 S 600 500, 700 700"
            strokeWidth="1.5"
            filter="drop-shadow(0 0 4px rgba(255,255,255,0.4))"
          />
          <path
            className="route route-trace slow d-4"
            d="M500 -100 C 550 100, 450 250, 650 350 S 900 450, 950 700"
            strokeWidth="1.5"
            filter="drop-shadow(0 0 4px rgba(255,255,255,0.4))"
          />
          <path
            className="route route-trace-return medium d-5"
            d="M-50 200 C 150 250, 350 150, 550 250 S 850 350, 950 300"
            strokeWidth="1.2"
            filter="drop-shadow(0 0 3px rgba(255,255,255,0.35))"
          />
          <path
            className="route route-trace v-slow d-6"
            d="M100 800 C 200 650, 300 700, 500 550 S 750 450, 900 500"
            strokeWidth="1.2"
            filter="drop-shadow(0 0 3px rgba(255,255,255,0.35))"
          />
        </svg>

        {/* Fondo azul sólido, sin elementos circulares */}

        <div className="relative z-10 text-white max-w-md">
          <h2
            className="text-[42px] font-semibold leading-[1.05] tracking-[-1.2px]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Sistema de
            <br />
            Gestión
          </h2>
          <div className="w-12 h-[2px] bg-white/20 mt-6 mb-6 rounded-full" />
          <p className="text-[15px] text-white/50 leading-[1.6]">
            Plataforma integrada de gestión y facturación electrónica.
            Administre sus operaciones de manera eficiente y moderna.
          </p>
        </div>
      </div>
    </div>
  )
}
