// src/features/dashboard/pages/DashboardPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { UserMetrics } from '../components/UserMetrics';
import { RevenueMetrics } from '../components/RevenueMetrics';
import { MonthlySalesChart } from '../components/MonthlySalesChart';
import { BranchSalesChart } from '../components/BranchSalesChart';
import { BranchSalesLineChart } from '../components/BranchSalesLineChart';
import { TopSellersByBranch } from '../components/TopSellersByBranch';
import { BarChart3 } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';

export const DashboardPage: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Mostrar loading mientras se carga la información del usuario
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Solo administradores pueden acceder al dashboard analítico
  const isAdmin = user?.role?.name?.toLowerCase() === 'admin' || 
                  user?.role_name?.toLowerCase() === 'admin';
  
  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600 mb-4">
            El Dashboard General está disponible únicamente para administradores del sistema.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  // Para administradores, mostrar el dashboard analítico completo
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard de Rendimiento</h1>

      {/* Métricas Clave */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UserMetrics />
        <RevenueMetrics />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MonthlySalesChart />
        <BranchSalesChart />
      </div>

      {/* Nuevo gráfico de barras de ventas por sucursal */}
      <div className="grid grid-cols-1 gap-6">
        <BranchSalesLineChart />
      </div>

      {/* Top vendedores por sucursal */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        <TopSellersByBranch />
      </div>

      {/* Enlaces a reportes y estadísticas */}
      <div className="grid grid-cols-1 gap-4">
        <Link
          to="/reports"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          <BarChart3 className="w-5 h-5" />
          Ver Reportes Detallados
        </Link>
      </div>
    </div>
  );
};
