import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { DailySalesItem } from '../../../services/reports.service';
import { getPaymentMethodName, getPaymentMethodColor } from '../../../utils/paymentMethods';

interface PaymentMethodsChartProps {
  paymentMethodsSummary?: Record<string, string>; // Opcional, ya no lo usamos
  items?: DailySalesItem[];
  isLoading?: boolean;
}

export const PaymentMethodsChart: React.FC<PaymentMethodsChartProps> = ({ 
  items = [],
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Recalcular métodos de pago incluyendo TODAS las transacciones
  // (Facturas, Boletas, Notas de Crédito y Notas de Débito)
  // Las notas de crédito vienen con valores negativos, por lo que se restan automáticamente
  const paymentMethodsTotals = items
    .reduce((acc, item) => {
      const method = item.payment_method || 'SIN_ESPECIFICAR';
      const amount = parseFloat(item.total_amount || '0');
      
      if (!acc[method]) {
        acc[method] = 0;
      }
      
      // Sumar todos los montos (las notas de crédito ya vienen con signo negativo)
      acc[method] += amount;
      
      return acc;
    }, {} as Record<string, number>);

  // Convertir el objeto a formato de datos para el gráfico
  const chartData = Object.entries(paymentMethodsTotals).map(([method, amount]) => ({
    name: getPaymentMethodName(method),
    value: amount,
    originalKey: method,
    color: getPaymentMethodColor(method)
  }));

  // Ordenar por valor descendente
  chartData.sort((a, b) => b.value - a.value);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Métodos de Pago Utilizados
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico circular */}
        <div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => 
                  percent > 5 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`S/ ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, 'Monto']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Lista detallada */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 mb-3">Detalle por Método</h4>
          {chartData.map((item) => (
            <div key={item.originalKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-gray-900">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  S/ {item.value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-600">
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