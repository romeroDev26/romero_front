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
      <div className="bg-white px-4 py-3 shadow-lg rounded-lg border border-gray-100">
        <p className="text-sm font-medium text-gray-900 mb-2">{data.name}</p>
        <div className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: data.color }}
          />
          <span className="text-gray-600">Monto:</span>
          <span className="font-semibold text-gray-900">
            S/ {Number(data.value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm mt-1">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <span className="text-gray-600">Transacciones:</span>
          <span className="font-semibold text-gray-900">{data.count}</span>
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
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        Métodos de Pago Utilizados
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico circular */}
        <div>
          <ResponsiveContainer width="100%" height={280}>
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
                outerRadius={100}
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
                    style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Lista detallada */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 mb-3">Detalle por Método</h4>
          {chartData.map((item, index) => (
            <div key={item.originalKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: MODERN_COLORS[index % MODERN_COLORS.length] }}
                />
                <span className="font-medium text-gray-800">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  S/ {item.value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-500">
                  {((item.value / total) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
          
          {/* Total */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center font-semibold text-gray-900">
              <span>Total</span>
              <span>S/ {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};