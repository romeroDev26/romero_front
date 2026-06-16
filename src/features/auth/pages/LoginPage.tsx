// src/features/auth/pages/LoginPage.tsx
import React, { useEffect } from 'react'
import { Ship, Sun, Moon } from 'lucide-react'
import { useThemeTransition } from '@/hooks/useThemeTransition'
import { authNotify } from '@/utils/sileo-toast'
import { LoginForm } from '../components/LoginForm'

export const LoginPage: React.FC = () => {
  const { toggleTheme, resolvedTheme } = useThemeTransition()

  useEffect(() => {
    const reason = sessionStorage.getItem('logoutReason')
    if (reason === 'inactivity') {
      // Un pequeño retraso asegura que el contenedor de Toasts ya esté montado en el DOM tras la recarga
      setTimeout(() => {
        authNotify.error(
          'Sesión expirada',
          'Su sesión fue cerrada de forma segura por inactividad.'
        )
      }, 300)
      sessionStorage.removeItem('logoutReason')
    }
  }, [])

  return (
    <div className="flex w-full min-h-screen bg-white dark:bg-[#0A0F1C] transition-colors duration-500 font-sans">
      
      {/* Botón de Cambio de Tema Global */}
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-6 right-6 lg:right-10 z-50 p-3 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/20 hover:scale-110 transition-all duration-300 shadow-sm backdrop-blur-md"
        aria-label="Cambiar tema"
        title={resolvedTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {/* Mitad Izquierda: Contenido y Formulario */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 xl:px-32 py-12 relative z-10 transition-colors duration-500">
        <div className="w-full max-w-[400px] mx-auto flex flex-col items-center">
          
          {/* Cabecera / Branding */}
          <div className="mb-10 flex flex-col items-center text-center">
            {/* Logo Minimalista Tipográfico */}
            <div className="w-12 h-12 rounded-xl bg-blue-600 dark:bg-blue-600/20 flex items-center justify-center mb-5 shadow-md shadow-blue-600/20 border border-transparent dark:border-blue-500/30 transition-all duration-500">
              <span className="text-white dark:text-blue-400 font-bold text-lg tracking-wider" style={{ fontFamily: 'var(--font-dotdigital, monospace)' }}>
                TR
              </span>
            </div>
            
            <h1 className="text-[28px] sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-3 transition-colors duration-500">
              Bienvenido de nuevo
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors duration-500">
              Ingresa tus credenciales para acceder a la plataforma de Transportes Romero.
            </p>
          </div>

          {/* Formulario Modularizado */}
          <div className="w-full">
            <LoginForm />
          </div>

          {/* Footer minimalista sin el texto sobrante */}
          <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 transition-colors duration-500">
            <p className="text-gray-400 dark:text-gray-500 text-xs">
              © {new Date().getFullYear()} Transportes Romero. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Mitad Derecha: Panel Visual Inmersivo */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-50 dark:bg-[#070B14] transition-colors duration-500 items-center justify-center">
        
        {/* Efectos de Gradiente Dinámico */}
        <div className="absolute inset-0 z-0">
          {/* Círculo Principal (Azul Profundo) */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[100px] transition-all duration-1000 ease-in-out"
            style={{
              background: resolvedTheme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)'
            }}
          />
          {/* Acento Secundario (Cian/Morado) */}
          <div 
            className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] transition-all duration-1000 ease-in-out"
            style={{
              background: resolvedTheme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(96, 165, 250, 0.05)'
            }}
          />
        </div>

        {/* Patrón de Malla (Grid) */}
        <div 
          className="absolute inset-0 z-10 opacity-[0.03] dark:opacity-[0.04] transition-opacity duration-500"
          style={{
            backgroundImage: `
              linear-gradient(${resolvedTheme === 'dark' ? '#fff' : '#000'} 1px, transparent 1px),
              linear-gradient(90deg, ${resolvedTheme === 'dark' ? '#fff' : '#000'} 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            backgroundPosition: 'center center'
          }}
        />

        {/* Elemento Gráfico Central (Glassmorphism Card Flotante) */}
        <div className="relative z-20 w-[65%] max-w-[500px] rounded-[32px] border border-white/60 dark:border-white/10 bg-white/40 dark:bg-[#131B2F]/40 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col p-8 transition-all duration-500 group">
          
          <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent dark:from-blue-600/10 dark:to-transparent opacity-50 pointer-events-none" />
          
          <div className="relative z-30 transform group-hover:-translate-y-1 transition-transform duration-500 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 rounded-full border-2 border-blue-500 flex items-center justify-center bg-white/50 dark:bg-[#0A0F1C]/50 shadow-sm transition-colors duration-500">
                <Ship className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              {/* Decoración geométrica */}
              <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="w-2 h-2 rounded-full bg-blue-400 opacity-50"></span>
                <span className="w-2 h-2 rounded-full bg-blue-300 opacity-20"></span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-500">
              Sistema Inteligente
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-8 transition-colors duration-500">
              Optimice sus rutas fluviales, controle la carga y administre la facturación en un entorno centralizado y seguro.
            </p>

            {/* Elegant Abstract UI Wireframe to fill space */}
            <div className="mt-4 flex flex-col gap-3 opacity-70 dark:opacity-40 transition-opacity duration-500 pointer-events-none">
              <div className="w-full h-28 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 flex flex-col p-4 justify-between transition-colors duration-500">
                <div className="flex justify-between items-center w-full">
                  <div className="w-1/3 h-2.5 rounded-full bg-blue-500/20 dark:bg-blue-400/20" />
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 dark:bg-blue-400/10" />
                </div>
                <div className="flex gap-3">
                  <div className="w-full h-10 rounded-xl bg-blue-500/10 dark:bg-blue-400/10" />
                  <div className="w-full h-10 rounded-xl bg-blue-500/10 dark:bg-blue-400/10" />
                  <div className="w-full h-10 rounded-xl bg-blue-500/10 dark:bg-blue-400/10" />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-1/2 h-20 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 p-4 flex flex-col justify-between transition-colors duration-500">
                   <div className="w-1/2 h-2 rounded-full bg-blue-500/20 dark:bg-blue-400/20" />
                   <div className="w-3/4 h-3 rounded-full bg-blue-500/30 dark:bg-blue-400/30" />
                </div>
                <div className="w-1/2 h-20 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 p-4 flex flex-col justify-between transition-colors duration-500">
                   <div className="w-1/2 h-2 rounded-full bg-blue-500/20 dark:bg-blue-400/20" />
                   <div className="w-3/4 h-3 rounded-full bg-blue-500/30 dark:bg-blue-400/30" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}

