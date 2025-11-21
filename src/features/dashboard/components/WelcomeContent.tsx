// src/features/dashboard/components/WelcomeContent.tsx
import React from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { TruckIcon, UserGroupIcon, CubeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { SalesPointSelector } from './SalesPointSelector';

interface WelcomeContentProps {
  showHeader?: boolean;
}

export const WelcomeContent: React.FC<WelcomeContentProps> = ({ showHeader = false }) => {
  const { user } = useAuth();

  const features = [
    {
      icon: TruckIcon,
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
      title: 'Documentación',
      description: 'Emisión de boletas y documentos fiscales'
    }
  ];

  return (
    <div className={showHeader ? "min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50" : ""}>
      {/* Main Content */}
      <main className={showHeader ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12" : "space-y-6 lg:space-y-8"}>
        {/* Welcome Section */}
        <div className="text-center mb-8 lg:mb-12">
          <div className="mb-4 lg:mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 bg-blue-100 rounded-full mb-3 lg:mb-4">
              <TruckIcon className="w-8 h-8 lg:w-10 lg:h-10 text-blue-600" />
            </div>
          </div>
          
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 lg:mb-4">
            ¡Hola {user?.full_name || user?.first_name || 'Usuario'}!
          </h1>
          
          <p className="text-lg lg:text-xl text-gray-600 mb-6 max-w-3xl mx-auto leading-relaxed px-2">
            Te damos la bienvenida al <strong>Sistema de Gestión de Transportes Romero</strong>, 
            la plataforma integral para la administración de servicios de transporte fluvial 
            de pasajeros y carga en la región amazónica.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 lg:p-6 max-w-2xl mx-auto">
            <p className="text-blue-800 font-medium mb-2 text-sm lg:text-base">
              Tu acceso al sistema ha sido configurado exitosamente
            </p>
            <p className="text-blue-700 text-xs lg:text-sm">
              Contacta al administrador del sistema si necesitas acceso a funcionalidades adicionales
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-8 lg:mb-12">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 text-center mb-6 lg:mb-8">
            Características del Sistema
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-5 lg:p-6 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg mb-3 lg:mb-4">
                  <feature.icon className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                </div>
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Point Selector and Statistics */}
        <SalesPointSelector />

        {/* Contact Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs lg:text-sm">
            ¿Necesitas ayuda? Contacta al equipo de soporte técnico para asistencia.
          </p>
        </div>
      </main>
    </div>
  );
};