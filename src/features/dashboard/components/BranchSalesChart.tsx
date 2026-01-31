import React from 'react';
import { VentasPorSucursal } from '../../../types/dashboard';

// Colores modernos estilo Tremor
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface BranchSalesChartProps {
  data?: VentasPorSucursal;
  isLoading?: boolean;
}

export const BranchSalesChart: React.FC<BranchSalesChartProps> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-gray-100">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-100 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-50 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Transformar los datos del backend
  const chartData = data?.resumen.map((item, index) => ({
    name: item.sucursal_nombre,
    value: item.total_ventas,
    color: COLORS[index % COLORS.length],
    porcentaje: item.porcentaje_total,
  })) || [];

  // Calcular el total
  const total = chartData.reduce((acc, item) => acc + item.value, 0);

  // Ordenar por valor descendente
  const sortedData = [...chartData].sort((a, b) => b.value - a.value);

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Ventas por Sucursal</h3>
          <p className="text-xl font-semibold text-gray-900 mt-1">
            S/ {total.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
        <span className="text-xs text-gray-400">{sortedData.length} sucursales</span>
      </div>
      
      <div className="space-y-3">
        {sortedData.map((item, index) => (
          <div key={item.name} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-700">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900">
                  S/ {item.value.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <span className="text-xs text-gray-400 w-12 text-right">
                  {item.porcentaje.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                style={{ 
                  width: `${item.porcentaje}%`,
                  backgroundColor: item.color
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};