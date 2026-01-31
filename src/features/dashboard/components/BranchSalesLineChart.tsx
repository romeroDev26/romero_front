import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { EvolucionVentasSucursales } from '../../../types/dashboard';

// Colores modernos estilo Tremor
const BRANCH_COLORS = {
  'Sucursal NAUTA': '#3b82f6',
  'Sucursal YURIMAGUAS': '#10b981',
  'Sucursal IQUITOS': '#f59e0b',
  'Sucursal REQUENA': '#ef4444',
  'Sucursal CONTAMANA': '#06b6d4',
  'Sin Sucursal': '#8b5cf6'
};

// Tooltip estilo Tremor
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((acc: number, entry: any) => acc + (entry.value || 0), 0);
    return (
      <div className="bg-white px-3 py-2 shadow-md rounded-lg border border-gray-100">
        <p className="text-xs font-medium text-gray-500 mb-1.5">{label}</p>
        <p className="text-sm font-semibold text-gray-900 mb-2">
          Total: S/ {total.toLocaleString('es-PE')}
        </p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600">{entry.name}</span>
              </div>
              <span className="font-medium text-gray-900">
                S/ {Number(entry.value).toLocaleString('es-PE')}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

interface BranchSalesLineChartProps {
  data?: EvolucionVentasSucursales;
  isLoading?: boolean;
}

export const BranchSalesLineChart: React.FC<BranchSalesLineChartProps> = ({ 
  data, 
  isLoading = false
}) => {

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
    return `hsl(${hue}, 70%, 55%)`;
  };

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

  // Transformar datos del backend al formato del grafico
  const chartData = data?.datos.map(item => ({
    date: item.fecha_formateada,
    ...item.sucursales
  })) || [];

  // Obtener nombres de sucursales unicas
  const branchNames = data?.datos.length ? 
    Object.keys(data.datos[0].sucursales) : [];

  // Calcular total del periodo
  const totalPeriod = chartData.reduce((acc, item) => {
    return acc + branchNames.reduce((sum, branch) => sum + (item[branch] || 0), 0);
  }, 0);

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Evolucion de Ventas por Sucursal</h3>
          <p className="text-xl font-semibold text-gray-900 mt-1">
            S/ {totalPeriod.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
        <span className="text-xs text-gray-400">{chartData.length} dias</span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart 
          data={chartData} 
          barCategoryGap="15%"
          margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="#f3f4f6"
          />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }} />
          <Legend 
            wrapperStyle={{ paddingTop: 16 }}
            formatter={(value) => <span className="text-xs text-gray-500">{value}</span>}
            iconType="circle"
            iconSize={8}
          />
          {branchNames.map((branch) => (
            <Bar
              key={branch}
              dataKey={branch}
              fill={getBranchColor(branch)}
              name={branch}
              radius={[3, 3, 0, 0]}
              maxBarSize={40}
              opacity={0.9}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};