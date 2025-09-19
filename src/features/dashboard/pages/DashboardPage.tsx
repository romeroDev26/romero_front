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

export const DashboardPage: React.FC = () => {
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
      <div className="grid grid-cols-1 gap-6">
        <TopSellersByBranch />
      </div>

      {/* Enlace a reportes detallados */}
      <div className="flex justify-center">
        <Link
          to="/reports"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          <BarChart3 className="w-5 h-5 mr-2" />
          Ver Reportes Detallados
        </Link>
      </div>
    </div>
  );
};
