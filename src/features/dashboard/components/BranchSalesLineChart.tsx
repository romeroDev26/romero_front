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

// Colores modernos con estilo elegante para cada sucursal
const BRANCH_COLORS = {
  'Sucursal NAUTA': '#6366f1',      // Indigo moderno
  'Sucursal YURIMAGUAS': '#10b981', // Esmeralda
  'Sucursal IQUITOS': '#f59e0b',    // Ámbar
  'Sucursal REQUENA': '#ef4444',    // Rojo coral
  'Sucursal CONTAMANA': '#06b6d4',  // Cyan
  'Sin Sucursal': '#8b5cf6'         // Violeta
};

// Tooltip personalizado elegante
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 shadow-lg rounded-lg border border-gray-100">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-semibold text-gray-900">
              S/ {Number(entry.value).toLocaleString('es-PE')}
            </span>
          </div>
        ))}
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
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Ventas del Día por Sucursal</h3>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart 
          data={chartData} 
          barCategoryGap="20%"
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            {branchNames.map((branch) => (
              <linearGradient key={`gradient-${branch}`} id={`gradient-${branch.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={getBranchColor(branch)} stopOpacity={1} />
                <stop offset="100%" stopColor={getBranchColor(branch)} stopOpacity={0.8} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="#f0f0f0"
          />
          <XAxis 
            dataKey="date" 
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
          <Legend 
            wrapperStyle={{ paddingTop: 20 }}
            formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
          />
          {branchNames.map((branch) => (
            <Bar
              key={branch}
              dataKey={branch}
              fill={`url(#gradient-${branch.replace(/\s/g, '')})`}
              name={branch}
              radius={[6, 6, 0, 0]}
              maxBarSize={50}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};