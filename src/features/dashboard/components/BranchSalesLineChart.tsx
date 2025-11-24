import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { EvolucionVentasSucursales } from '../../../types/dashboard';

// Colores fijos para cada sucursal para mantener consistencia
const BRANCH_COLORS = {
  'Sucursal NAUTA': '#8884d8',
  'Sucursal YURIMAGUAS': '#82ca9d',
  'Sucursal IQUITOS': '#ffc658',
  'Sucursal REQUENA': '#ff7c7c',
  'Sucursal CONTAMANA': '#8dd1e1',
  'Sin Sucursal': '#d084d0'
};

interface BranchSalesLineChartProps {
  data?: EvolucionVentasSucursales;
  isLoading?: boolean;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  onPeriodChange?: (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => void;
}

export const BranchSalesLineChart: React.FC<BranchSalesLineChartProps> = ({ 
  data, 
  isLoading = false,
  period = 'daily',
  onPeriodChange 
}) => {
  // Título dinámico según el período
  const getChartTitle = () => {
    switch (period) {
      case 'daily':
        return 'Ventas del Día por Sucursal';
      case 'weekly':
        return 'Evolución Semanal de Ventas por Sucursal';
      case 'monthly':
        return 'Evolución Mensual de Ventas por Sucursal';
      case 'yearly':
        return 'Evolución Anual de Ventas por Sucursal';
      default:
        return 'Ventas por Sucursal';
    }
  };

  // Obtener color para una sucursal
  const getBranchColor = (branchName: string): string => {
    if (BRANCH_COLORS[branchName as keyof typeof BRANCH_COLORS]) {
      return BRANCH_COLORS[branchName as keyof typeof BRANCH_COLORS];
    }
    
    // Para sucursales no definidas, generar color basado en hash del nombre
    let hash = 0;
    for (let i = 0; i < branchName.length; i++) {
      const char = branchName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32bit
    }
    
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

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

  // Transformar datos del backend al formato del gráfico
  const chartData = data?.datos.map(item => ({
    date: item.fecha_formateada,
    ...item.sucursales
  })) || [];

  // Obtener nombres de sucursales únicas
  const branchNames = data?.datos.length ? 
    Object.keys(data.datos[0].sucursales) : [];

  return (
    <div className="bg-white p-4 lg:p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{getChartTitle()}</h3>

        {/* Controles - solo mostrar si se proporciona el handler */}
        {onPeriodChange && (
          <div className="flex gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label htmlFor="period-grouping" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Período:
              </label>
              <select
                id="period-grouping"
                value={period}
                onChange={(e) => onPeriodChange(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                className="flex-1 sm:flex-none px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `S/ ${value.toLocaleString()}`}
          />
          <Tooltip 
            formatter={(value, name) => [`S/ ${Number(value).toLocaleString('es-PE')}`, name]} 
            labelFormatter={(label) => `Fecha: ${label}`}
          />
          <Legend />
          {/* Generar líneas dinámicamente para cada sucursal con colores consistentes */}
          {branchNames.map((branch) => (
            <Line
              key={branch}
              type="monotone"
              dataKey={branch}
              stroke={getBranchColor(branch)}
              name={branch}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};