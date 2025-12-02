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
import { VentasMensuales } from '../../../types/dashboard';

// Tooltip personalizado elegante
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 shadow-lg rounded-lg border border-gray-100">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-indigo-500" />
          <span className="text-gray-600">Ventas:</span>
          <span className="font-semibold text-gray-900">
            S/ {Number(payload[0].value).toLocaleString('es-PE')}
          </span>
        </div>
        {payload[0].payload.facturas && (
          <div className="flex items-center gap-2 text-sm mt-1">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-gray-600">Facturas:</span>
            <span className="font-semibold text-gray-900">
              {payload[0].payload.facturas}
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

interface MonthlySalesChartProps {
  data?: VentasMensuales;
  isLoading?: boolean;
}

export const MonthlySalesChart: React.FC<MonthlySalesChartProps> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Transformar los datos del backend al formato del gráfico
  const chartData = data?.ultimos_6_meses.map(item => ({
    name: item.mes,
    value: item.total_ventas,
    facturas: item.cantidad_facturas,
  })) || [];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Ventas Mensuales</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="#f0f0f0"
          />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
            dx={-5}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }} />
          <Bar 
            dataKey="value" 
            fill="url(#monthlyGradient)" 
            radius={[6, 6, 0, 0]}
            maxBarSize={50}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};