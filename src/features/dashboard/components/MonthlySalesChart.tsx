import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { VentasMensuales } from '../../../types/dashboard';

// Tooltip personalizado estilo Tremor
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-3 py-2 shadow-md rounded-lg border border-gray-100">
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-semibold text-gray-900">
          S/ {Number(payload[0].value).toLocaleString('es-PE')}
        </p>
        {payload[0].payload.facturas && (
          <p className="text-xs text-gray-500 mt-0.5">
            {payload[0].payload.facturas} facturas
          </p>
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
      <div className="bg-white p-5 rounded-xl border border-gray-100">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-100 rounded w-1/4 mb-4"></div>
          <div className="h-56 bg-gray-50 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Transformar los datos del backend al formato del grafico
  const chartData = data?.ultimos_6_meses.map(item => ({
    name: item.mes,
    value: item.total_ventas,
    facturas: item.cantidad_facturas,
  })) || [];

  // Calcular el total para mostrar en el header
  const total = chartData.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Ventas Mensuales</h3>
          <p className="text-xl font-semibold text-gray-900 mt-1">
            S/ {total.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
        <span className="text-xs text-gray-400">Ultimos 6 meses</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart 
          data={chartData}
          margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="#e5e7eb"
            opacity={0.5}
          />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value/1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value/1000).toFixed(1)}k`;
              return value.toString();
            }}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Area 
            type="monotone"
            dataKey="value" 
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#areaGradient)"
            dot={false}
            activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};