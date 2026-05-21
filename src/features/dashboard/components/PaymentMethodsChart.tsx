import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { PaymentMethodMetric } from '../../../types/reports';
import { getPaymentMethodName, getPaymentMethodColor } from '../../../utils/paymentMethods';

// Colores modernos elegantes
const MODERN_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

// Tooltip personalizado elegante
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-dm-bg-primary px-4 py-3 shadow-lg rounded-lg border border-dm-border-secondary">
        <p className="text-sm font-medium text-dm-text-primary mb-2">{data.name}</p>
        <div className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: data.color }}
          />
          <span className="text-dm-text-secondary">Monto:</span>
          <span className="font-semibold text-dm-text-primary">
            S/ {Number(data.value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm mt-1">
          <div className="w-3 h-3 rounded-full bg-dm-text-muted" />
          <span className="text-dm-text-secondary">Transacciones:</span>
          <span className="font-semibold text-dm-text-primary">{data.count}</span>
        </div>
      </div>
    );
  }
  return null;
};

interface PaymentMethodsChartProps {
  paymentMethods: PaymentMethodMetric;
  isLoading?: boolean;
}

export const PaymentMethodsChart: React.FC<PaymentMethodsChartProps> = ({ 
  paymentMethods,
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="bg-dm-bg-primary rounded-lg border border-dm-border-primary p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-dm-bg-secondary rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-dm-bg-secondary rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Convertir el diccionario del backend a array para el gráfico
  const chartData = Object.entries(paymentMethods || {}).map(([key, data], index) => ({
    name: getPaymentMethodName(key),
    value: data.monto,
    count: data.cantidad,
    originalKey: key,
    color: MODERN_COLORS[index % MODERN_COLORS.length],
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-dm-bg-primary rounded-lg border border-dm-border-primary p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-dm-text-primary">
          Métodos de Pago
        </h3>
        <span className="text-xs text-dm-text-muted">
          {chartData.length} métodos
        </span>
      </div>

      {/* Grid: Gráfico circular + Lista */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Circular */}
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <defs>
                {MODERN_COLORS.map((color, index) => (
                  <linearGradient key={`paymentGradient-${index}`} id={`paymentGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
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
                outerRadius={85}
                innerRadius={50}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
                stroke="none"
              >
                {chartData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#paymentGradient-${index % MODERN_COLORS.length})`}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      
        {/* Lista de métodos de pago */}
        <div className="space-y-4">
        {chartData.map((item, index) => {
          const percentage = ((item.value / total) * 100);
          return (
            <div key={item.originalKey} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: MODERN_COLORS[index % MODERN_COLORS.length] }}
                  />
                  <span className="font-medium text-dm-text-secondary">{item.name}</span>
                  <span className="text-dm-text-muted">({item.count})</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-dm-text-primary">
                    S/ {item.value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              {/* Barra de progreso */}
              <div className="w-full bg-dm-bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: MODERN_COLORS[index % MODERN_COLORS.length],
                  }}
                />
              </div>
            </div>
          );
        })}
        </div>
      </div>
        
      {/* Total */}
      <div className="pt-4 mt-4 border-t border-dm-border-primary">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-dm-text-primary">Total</span>
          <span className="text-base font-bold text-dm-text-primary">
            S/ {total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};