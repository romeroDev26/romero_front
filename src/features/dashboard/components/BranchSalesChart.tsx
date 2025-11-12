import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { VentasPorSucursal } from '../../../types/dashboard';

// Colores predefinidos para el gráfico de pastel
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface BranchSalesChartProps {
  data?: VentasPorSucursal;
  isLoading?: boolean;
}

export const BranchSalesChart: React.FC<BranchSalesChartProps> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
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
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas por Sucursales</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, porcentaje }) => `${name} ${porcentaje.toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`S/ ${value}`, 'Ventas']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};