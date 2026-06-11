import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { RouteMetric } from '../../../types/reports';

// Tooltip personalizado elegante
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dm-bg-primary px-4 py-3 shadow-lg rounded-lg border border-dm-border-secondary">
        <p className="text-sm font-medium text-dm-text-primary mb-2">{payload[0].payload.fullName}</p>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-dm-text-secondary">Ingresos:</span>
          <span className="font-semibold text-dm-text-primary">
            S/ {Number(payload[0].value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

interface PopularRoutesChartProps {
  routes: RouteMetric;
  totalVentas?: number;
  isLoading?: boolean;
}

export const PopularRoutesChart: React.FC<PopularRoutesChartProps> = ({ 
  routes, 
  totalVentas,
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="bg-dm-bg-primary p-6 rounded-xl shadow-sm border border-dm-border-secondary">
        <div className="animate-pulse">
          <div className="h-6 bg-dm-bg-secondary rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-dm-bg-secondary rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Convertir el diccionario a array y tomar el top 8 ordenados por monto
  const routesArray = Object.entries(routes || {}).map(([name, data]) => ({
    route_name: name,
    total_amount: data.monto,
    count: data.cantidad,
  }));
  
  const popularRoutes = routesArray
    .sort((a, b) => b.total_amount - a.total_amount)
    .slice(0, 8);

  if (popularRoutes.length === 0) {
    return (
      <div className="bg-dm-bg-primary rounded-lg border border-dm-border-primary p-6">
        <h3 className="text-base font-semibold text-dm-text-primary mb-6">
          Destinos Populares
        </h3>
        <div className="text-center py-12 text-dm-text-muted text-sm">
          No hay datos de rutas disponibles
        </div>
      </div>
    );
  }

  const computedTotal = popularRoutes.reduce((sum, route) => sum + route.total_amount, 0);
  const totalRevenue = totalVentas ?? computedTotal;

  return (
    <div className="bg-dm-bg-primary rounded-lg border border-dm-border-primary p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-dm-text-primary">
          Destinos Populares
        </h3>
        <span className="text-xs text-dm-text-muted">
          Top {popularRoutes.length}
        </span>
      </div>
      
      {/* Lista de rutas estilo Tremor */}
      <div className="space-y-4">
        {popularRoutes.slice(0, 6).map((route, index) => {
          const percentage = ((route.total_amount / totalRevenue) * 100);
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="font-medium text-dm-text-secondary truncate">
                    {route.route_name}
                  </span>
                  <span className="text-dm-text-muted flex-shrink-0">({route.count})</span>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <span className="font-semibold text-dm-text-primary">
                    S/ {route.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              {/* Barra de progreso */}
              <div className="w-full bg-dm-bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-emerald-500 to-emerald-400"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
        
        {/* Resumen */}
        <div className="pt-4 mt-4 border-t border-dm-border-primary grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-dm-text-muted mb-1">Total Rutas</p>
            <p className="text-lg font-semibold text-dm-text-primary">{popularRoutes.length}</p>
          </div>
          <div>
            <p className="text-xs text-dm-text-muted mb-1">Total Ingresos</p>
            <p className="text-lg font-semibold text-dm-text-primary">
              S/ {totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};