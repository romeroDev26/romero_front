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
const CustomTooltip = ({ active, payload, label }: any) => {
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
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          Rutas Más Populares
        </h3>
        <div className="text-center py-8 text-gray-500">
          No hay datos de rutas disponibles
        </div>
      </div>
    );
  }

  const totalRevenue = popularRoutes.reduce((sum, route) => sum + route.total_amount, 0);

  // Datos para el gráfico
  const chartData = popularRoutes.map(route => ({
    name: route.route_name.length > 18 ? route.route_name.substring(0, 18) + '...' : route.route_name,
    fullName: route.route_name,
    value: route.total_amount,
  }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        Rutas Más Populares
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
        >
          <defs>
            <linearGradient id="routesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false}
            stroke="#f0f0f0"
          />
          <XAxis 
            dataKey="name"
            tick={{ fontSize: 10, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }} />
          <Bar 
            dataKey="value" 
            fill="url(#routesGradient)"
            radius={[6, 6, 0, 0]}
            maxBarSize={45}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Estadísticas resumen */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-emerald-600">
              {popularRoutes.length}
            </div>
            <div className="text-xs text-gray-600">Rutas Activas</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-blue-600">
              S/ {totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-gray-600">Total Ingresos</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-purple-600">
              S/ {Math.round(totalRevenue / popularRoutes.length).toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Promedio/Ruta</div>
          </div>
        </div>
      </div>
    </div>
  );
};