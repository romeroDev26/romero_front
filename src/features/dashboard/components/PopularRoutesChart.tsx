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
      <div className="bg-white px-4 py-3 shadow-lg rounded-lg border border-gray-100">
        <p className="text-sm font-medium text-gray-900 mb-2">{payload[0].payload.fullName}</p>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-gray-600">Ingresos:</span>
          <span className="font-semibold text-gray-900">
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
  isLoading?: boolean;
}

export const PopularRoutesChart: React.FC<PopularRoutesChartProps> = ({ 
  routes, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-6">
          Destinos Populares
        </h3>
        <div className="text-center py-12 text-gray-500 text-sm">
          No hay datos de rutas disponibles
        </div>
      </div>
    );
  }

  const totalRevenue = popularRoutes.reduce((sum, route) => sum + route.total_amount, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-gray-900">
          Destinos Populares
        </h3>
        <span className="text-xs text-gray-500">
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
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-700 truncate">
                    {route.route_name}
                  </span>
                  <span className="text-gray-500 flex-shrink-0">({route.count})</span>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <span className="font-semibold text-gray-900">
                    S/ {route.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              {/* Barra de progreso */}
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-emerald-500 to-emerald-400"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
        
        {/* Resumen */}
        <div className="pt-4 mt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Rutas</p>
            <p className="text-lg font-semibold text-gray-900">{popularRoutes.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Ingresos</p>
            <p className="text-lg font-semibold text-gray-900">
              S/ {totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};