// src/features/dashboard/components/WelcomeContent.tsx
import React from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { UserGroupIcon, CubeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Ship } from 'lucide-react';
import { SalesPointSelector } from './SalesPointSelector';
import { ThreeBackground } from './ThreeBackground';

interface WelcomeContentProps {
  showHeader?: boolean;
}

export const WelcomeContent: React.FC<WelcomeContentProps> = ({ showHeader = false }) => {
  const { user } = useAuth();

  const features = [
    {
      icon: Ship,
      title: 'Transporte Fluvial',
      description: 'Sistema especializado en transporte de pasajeros por vía fluvial'
    },
    {
      icon: UserGroupIcon,
      title: 'Gestión de Pasajeros',
      description: 'Reservas, asignación de asientos y control de embarque'
    },
    {
      icon: CubeIcon,
      title: 'Logística de Carga',
      description: 'Administración de carga y mercancías'
    },
    {
      icon: DocumentTextIcon,
      title: 'Documentación Fiscal',
      description: 'Emisión de boletas, facturas y documentos fiscales'
    }
  ];

  return (
    <div className={showHeader ? "relative min-h-screen bg-slate-900 overflow-hidden font-sans" : ""}>
      {/* 3D Background Layer */}
      {showHeader && (
        <div className="absolute inset-0 z-0">
           <ThreeBackground />
        </div>
      )}

      {/* Overlay Gradient */}
      {showHeader && (
        <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-r from-slate-900/60 via-slate-900/20 to-transparent"></div>
      )}
      
      <main className={showHeader ? "relative z-10 w-full h-screen flex flex-col lg:flex-row items-center justify-center p-8 gap-8 box-border" : "space-y-8"}>
        
        {/* Left Panel */}
        <div className={showHeader ? "flex-1 flex flex-col justify-center max-w-lg text-white" : "hidden"}>
            <div className="mb-4 inline-block">
                <span className="bg-blue-600/30 text-blue-200 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/30 animate-fade-in">
                    ● SISTEMA OPERATIVO
                </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-2 leading-tight animate-slide-up" style={{ animationDelay: '0.2s' }}>
                Navegación <br />
                <span className="text-blue-400">Inteligente</span>
            </h1>
            
            <p className="text-blue-100/70 mb-10 text-lg animate-slide-up" style={{ animationDelay: '0.3s' }}>
                Bienvenido, <span className="font-semibold text-white">{user?.full_name || user?.first_name || 'Usuario'}</span>.<br/>
                Gestiona tu flota y pasajeros con la precisión y elegancia que el río exige.
            </p>

            {/* Modules Grid */}
            <div className="grid grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl cursor-pointer group hover:-translate-y-0.5 hover:bg-white/15 transition-all duration-200"
                >
                  <div className="bg-blue-500/20 w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-blue-300 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm mb-1 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-blue-100/60">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
        </div>
          
        {/* Right Panel: Sales Point Selector */}
        <div className={showHeader ? "flex-1 flex justify-center items-center w-full animate-slide-up" : "w-full"} style={{ animationDelay: '0.6s' }}>
             <SalesPointSelector className={showHeader ? "bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto border-none" : ""} />
        </div>

        {/* Footer (Only visible if not showHeader or adapted) */}
        {!showHeader && (
          <div className="mt-8 border-t border-slate-200/60 pt-6 text-center lg:text-left">
            <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">
              Transportes Romero &copy; {new Date().getFullYear()} • Soporte Técnico
            </p>
          </div>
        )}
      </main>
    </div>
  );
};