import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { VentasPorSucursal } from '../../../types/dashboard';

// Colores modernos elegantes para el gráfico de pastel
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

// Tooltip personalizado elegante
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white px-4 py-3 shadow-lg rounded-lg border border-gray-100">
        <p className="text-sm font-medium text-gray-900 mb-2">{data.name}</p>
        <div className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: data.color }}
          />
          <span className="text-gray-600">Ventas:</span>
          <span className="font-semibold text-gray-900">
            S/ {Number(data.value).toLocaleString('es-PE')}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm mt-1">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <span className="text-gray-600">Porcentaje:</span>
          <span className="font-semibold text-gray-900">
            {data.porcentaje.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// Etiqueta personalizada para el pie
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, porcentaje, name }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.3;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (porcentaje < 5) return null; // No mostrar etiquetas muy pequeñas

  return (
    <text 
      x={x} 
      y={y} 
      fill="#374151" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-xs"
    >
      {`${porcentaje.toFixed(1)}%`}
    </text>
  );
};

interface BranchSalesChartProps {
  data?: VentasPorSucursal;
  isLoading?: boolean;
}

export const BranchSalesChart: React.FC<BranchSalesChartProps> = ({ data, isLoading = false }) => {
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
  const chartData = data?.resumen.map((item, index) => ({
    name: item.sucursal_nombre,
    value: item.total_ventas,
    color: COLORS[index % COLORS.length],
    porcentaje: item.porcentaje_total,
  })) || [];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Ventas por Sucursales</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <defs>
            {COLORS.map((color, index) => (
              <linearGradient key={`pieGradient-${index}`} id={`pieGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={1} />
                <stop offset="100%" stopColor={color} stopOpacity={0.8} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={90}
            innerRadius={40}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#pieGradient-${index % COLORS.length})`}
                style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
            iconType="circle"
            iconSize={10}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};