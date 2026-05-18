// src/features/auth/pages/LoginPage.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Ship, Lock, Eye, EyeOff, AtSign } from 'lucide-react'
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
    <div className="relative min-h-screen w-full bg-[#11245E] font-sans overflow-hidden flex items-center justify-center">

      {/* Fondo Ondulado - Visible solo en escritorio */}
      <svg
        className="absolute inset-0 w-full h-full object-cover hidden lg:block z-0 pointer-events-none"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <rect width="1440" height="900" fill="#11245E" />
        <path
          d="M0,0 L780,0 C650,220 850,550 680,900 L0,900 Z"
          fill="#F2F6FA"
        />
      </svg>

      {/* Contenedor Principal */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto h-full min-h-screen flex flex-col lg:flex-row">

        {/* ================= SECCIÓN IZQUIERDA (Ilustración) ================= */}
        <div className="hidden lg:flex w-[55%] flex-col justify-between p-12 xl:p-16 relative">

          {/* Ilustración SVG Central Customizada */}
          <div className="flex-1 flex items-center justify-center relative w-full mt-10">
             <div className="w-full max-w-[650px] aspect-square relative">
                <svg viewBox="0 0 800 800" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  {/* Formas orgánicas de fondo (Blobs) */}
                  <path d="M150,400 C100,200 300,100 500,150 C700,200 750,450 650,600 C550,750 250,750 150,600 Z" fill="#E2EDFD" opacity="0.6"/>
                  <path d="M200,450 C180,300 350,200 550,250 C700,300 720,500 600,650 C450,800 250,700 200,450 Z" fill="#D0E3FC" opacity="0.7"/>
                  <path d="M250,500 C250,350 400,280 580,320 C680,350 680,550 550,650 C400,750 250,650 250,500 Z" fill="#A8C8F9" opacity="0.5"/>

                  {/* Pájaros */}
                  <path d="M250,380 Q255,375 260,380 Q265,375 270,380" fill="none" stroke="#6895D2" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M280,390 Q285,385 290,390 Q295,385 300,390" fill="none" stroke="#6895D2" strokeWidth="2" strokeLinecap="round"/>

                  {/* Montañas de fondo */}
                  <polygon points="100,550 300,450 450,550" fill="#99BCF5" opacity="0.6"/>
                  <polygon points="350,550 500,420 650,550" fill="#88B0F2" opacity="0.6"/>
                  <polygon points="550,550 680,480 800,550" fill="#A4C4F7" opacity="0.5"/>

                  {/* Agua / Río */}
                  <rect x="50" y="550" width="700" height="200" fill="#82ADEF" opacity="0.4" rx="20"/>
                  <path d="M100,600 Q200,610 300,600 T500,600 T700,600" fill="none" stroke="#6597EB" strokeWidth="2" opacity="0.5"/>
                  <path d="M150,630 Q250,640 350,630 T550,630 T750,630" fill="none" stroke="#6597EB" strokeWidth="3" opacity="0.3"/>
                  <path d="M100,660 Q200,670 300,660 T500,660 T700,660" fill="none" stroke="#4B86E8" strokeWidth="2" opacity="0.4"/>

                  {/* Barco Principal */}
                  <g transform="translate(180, 500) scale(0.85)">
                    {/* Reflejo en el agua */}
                    <path d="M40,120 L380,120 L350,140 L80,140 Z" fill="#4B86E8" opacity="0.3"/>

                    {/* Casco del barco */}
                    <path d="M20,60 L350,60 L380,100 L40,120 Z" fill="#0E215C"/>
                    <path d="M20,60 L350,60 L345,65 L25,65 Z" fill="#25439C"/> {/* Borde superior casco */}

                    {/* Cabina */}
                    <rect x="40" y="10" width="80" height="50" fill="#FFFFFF" rx="4"/>
                    <rect x="45" y="20" width="15" height="15" fill="#A8C8F9" rx="2"/>
                    <rect x="65" y="20" width="15" height="15" fill="#A8C8F9" rx="2"/>
                    <rect x="85" y="20" width="15" height="15" fill="#A8C8F9" rx="2"/>
                    <rect x="50" y="-10" width="60" height="20" fill="#E2EDFD" rx="2"/> {/* Techo */}
                    <rect x="70" y="-25" width="6" height="15" fill="#0E215C"/> {/* Chimenea */}

                    {/* Contenedores */}
                    {/* Fila 1 */}
                    <rect x="140" y="25" width="45" height="35" fill="#183685" rx="2"/>
                    <rect x="187" y="25" width="45" height="35" fill="#1C3D96" rx="2"/>
                    <rect x="234" y="25" width="45" height="35" fill="#183685" rx="2"/>
                    <rect x="281" y="25" width="45" height="35" fill="#1C3D96" rx="2"/>
                    {/* Fila 2 */}
                    <rect x="140" y="-12" width="45" height="35" fill="#2145A6" rx="2"/>
                    <rect x="187" y="-12" width="45" height="35" fill="#1C3D96" rx="2"/>
                    <rect x="234" y="-12" width="45" height="35" fill="#2145A6" rx="2"/>
                    <rect x="281" y="-12" width="45" height="35" fill="#183685" rx="2"/>

                    {/* Detalles contenedores (líneas) */}
                    <line x1="155" y1="-10" x2="155" y2="20" stroke="#0E215C" strokeWidth="1" opacity="0.5"/>
                    <line x1="170" y1="-10" x2="170" y2="20" stroke="#0E215C" strokeWidth="1" opacity="0.5"/>
                    <line x1="202" y1="27" x2="202" y2="58" stroke="#0E215C" strokeWidth="1" opacity="0.5"/>
                    <line x1="217" y1="27" x2="217" y2="58" stroke="#0E215C" strokeWidth="1" opacity="0.5"/>
                  </g>

                  {/* Elemento Volador (Drone/Plataforma con contenedor) */}
                  <g transform="translate(500, 250) scale(0.6)">
                    <polygon points="50,40 150,10 250,40 150,70" fill="#4B5E87" opacity="0.8"/> {/* Plataforma */}
                    <polygon points="50,40 150,70 150,80 50,50" fill="#2D3B5C"/> {/* Grosor plataforma */}
                    <polygon points="250,40 150,70 150,80 250,50" fill="#1A243D"/>
                    {/* Hélices / Soportes */}
                    <circle cx="50" cy="40" r="15" fill="#E2EDFD" opacity="0.7"/>
                    <circle cx="250" cy="40" r="15" fill="#E2EDFD" opacity="0.7"/>
                    <circle cx="150" cy="10" r="10" fill="#E2EDFD" opacity="0.7"/>
                    <circle cx="150" cy="70" r="15" fill="#E2EDFD" opacity="0.7"/>
                    {/* Contenedor */}
                    <polygon points="110,30 190,10 230,25 150,45" fill="#2B5CD1"/> {/* Techo */}
                    <polygon points="110,30 150,45 150,85 110,70" fill="#1C44A6"/> {/* Frente */}
                    <polygon points="150,45 230,25 230,65 150,85" fill="#13307D"/> {/* Lado */}
                  </g>

                  {/* Boya flotante (Abajo izquierda) */}
                  <g transform="translate(140, 650) scale(0.8)">
                    <path d="M30,80 C10,80 10,60 30,60 C50,60 50,80 30,80 Z" fill="#0E215C"/> {/* Base */}
                    <polygon points="20,60 40,60 35,20 25,20" fill="#1C3D96"/> {/* Cuerpo central */}
                    <circle cx="30" cy="15" r="8" fill="#2B5CD1"/> {/* Esfera superior */}
                    <line x1="30" y1="20" x2="30" y2="60" stroke="#0E215C" strokeWidth="2"/>
                    <ellipse cx="30" cy="80" rx="25" ry="5" fill="#4B86E8" opacity="0.5"/> {/* Sombra agua */}
                  </g>

                  {/* Hojas decorativas (Abajo izquierda) */}
                  <g transform="translate(200, 680) scale(0.9)">
                    <path d="M20,40 C10,20 30,0 40,10 C50,20 40,40 20,40 Z" fill="#4B86E8"/>
                    <path d="M45,45 C30,30 50,10 65,15 C80,20 60,50 45,45 Z" fill="#2B5CD1"/>
                  </g>

                  {/* Círculos decorativos flotantes */}
                  <circle cx="120" cy="300" r="15" fill="#E2EDFD" opacity="0.5"/>
                  <circle cx="650" cy="650" r="25" fill="#E2EDFD" opacity="0.4"/>
                  <circle cx="700" cy="400" r="10" fill="#E2EDFD" opacity="0.6"/>
                </svg>
             </div>
          </div>

          {/* Footer Izquierdo */}
          <div className="mt-8">
            <p className="text-[#4B5E87] text-sm font-medium">© {new Date().getFullYear()} Transportes Romero</p>
            <p className="text-[#6B7C9D] text-sm">Todos los derechos reservados.</p>
          </div>
        </div>

        {/* ================= SECCIÓN DERECHA (Formulario de Login) ================= */}
        <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-16 md:px-24 lg:px-20 xl:px-32 py-12 lg:py-0 z-10 bg-[#11245E] lg:bg-transparent min-h-screen lg:min-h-0">

          <div className="w-full max-w-md mx-auto lg:mx-0">
            {/* Icono Cabecera */}
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 border border-white/5 shadow-inner">
              <Ship className="text-white w-6 h-6" />
            </div>

            {/* Títulos */}
            <h2 className="text-3xl font-bold text-white mb-2 tracking-wide">Bienvenido</h2>
            <p className="text-[#A4B5D6] text-sm mb-10 font-light">Ingrese sus credenciales para continuar</p>

            {/* Formulario */}
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>

              {/* Bloqueo */}
              {isLocked && (
                <div
                  className="bg-[#fef2f2] border border-[#fecaca] rounded-[10px] px-4 py-3 flex items-start gap-3"
                  role="alert"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <svg className="h-4 w-4 text-[#c22b10]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-[#991b1b]">
                      Cuenta bloqueada temporalmente
                    </div>
                    <div className="mt-0.5 text-[12px] text-[#b91c1c] leading-[1.4]">
                      {lockoutMessage} Intente nuevamente en{' '}
                      <span className="font-mono font-semibold tabular-nums">{formattedTime}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error genérico */}
              {loginError && (
                <div
                  className="bg-white/10 border border-[#c22b10]/30 rounded-[10px] px-4 py-3 flex items-start justify-between"
                  role="alert"
                >
                  <div className="mr-3 text-[13px] leading-[1.5] text-[#fca5a5]">{loginError}</div>
                  <button
                    type="button"
                    className="text-[#A4B5D6] hover:text-white transition-colors text-[11px] flex-shrink-0 mt-0.5"
                    onClick={() => setLoginError(null)}
                    aria-label="Cerrar mensaje de error"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Input Correo */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <AtSign className="h-5 w-5 text-[#64748B]" />
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  disabled={isLocked}
                  className="block w-full pl-12 pr-4 py-4 bg-white border border-transparent rounded-xl text-sm placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Correo electrónico"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-[12px] text-[#fca5a5] ml-1">{errors.email.message}</p>
              )}

              {/* Input Contraseña */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#64748B]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={isLocked}
                  className="block w-full pl-12 pr-12 py-4 bg-white border border-transparent rounded-xl text-sm placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Contraseña"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#64748B] hover:text-[#3B82F6] transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[12px] text-[#fca5a5] ml-1">{errors.password.message}</p>
              )}

              {/* Recordarme */}
              <div className="flex items-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (isLocked) return
                    const el = document.getElementById('rememberMe') as HTMLInputElement | null
                    if (el) el.click()
                  }}
                  className={`w-10 h-5 rounded-full relative transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#11245E] focus:ring-[#3B82F6] ${
                    rememberMeChecked ? 'bg-[#3B82F6]' : 'bg-white/20'
                  } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`absolute left-[2px] top-[2px] w-4 h-4 rounded-full bg-white transition-transform duration-300 ease-in-out ${
                      rememberMeChecked ? 'translate-x-5' : 'translate-x-0'
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
                <span className="ml-3 text-sm text-[#A4B5D6]">Recordarme</span>
              </div>

              {/* Botón Login */}
              <button
                type="submit"
                disabled={isLoading || isLocked}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-900/20 text-sm font-semibold text-white bg-[#2A65E6] hover:bg-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#11245E] focus:ring-[#2A65E6] transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Iniciando sesión...' : isLocked ? `Bloqueado (${formattedTime})` : 'Iniciar Sesión'}
              </button>
            </form>

            {/* Separador y Sistema de Gestión */}
            <div className="mt-16 pt-8 border-t border-white/10">
              <h3 className="text-xl font-bold text-white mb-3">Sistema de Gestión</h3>
              <p className="text-[#A4B5D6] text-xs leading-relaxed max-w-sm">
                Plataforma integrada de gestión y facturación electrónica.<br/>
                Administre sus operaciones de manera eficiente y moderna.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
