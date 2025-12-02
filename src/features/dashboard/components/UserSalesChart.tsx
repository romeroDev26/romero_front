// src/features/dashboard/components/UserSalesChart.tsx
import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useLast7DaysStatistics, useLast12MonthsStatistics } from '../../../hooks/useUserStatistics';
import { parseLocalDate } from '../../../utils/dateUtils';

type ChartPeriod = '7days' | '12months';

interface ChartData {
  date: string;
  total_revenue: number;
  total_revenue_net?: number;
  total_revenue_gross?: number;
  total_credit_notes?: number;
  total_debit_notes?: number;
  total_sales: number;
  tickets_revenue: number;
  cargo_revenue: number;
}

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
              style={{ backgroundColor: entry.stroke || entry.color }}
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

const UserSalesChart: React.FC = () => {
  const [period, setPeriod] = useState<ChartPeriod>('7days');

  // Hooks para obtener datos
  const { 
    data: last7DaysData, 
    isLoading: isLoading7Days, 
    error: error7Days
  } = useLast7DaysStatistics({ enabled: period === '7days' });

  const { 
    data: last12MonthsData, 
    isLoading: isLoading12Months, 
    error: error12Months
  } = useLast12MonthsStatistics({ enabled: period === '12months' });

  // Función para formatear datos para el gráfico
  const formatChartData = (data: any[]): ChartData[] => {
    if (!data || data.length === 0) return [];

    return data.map(item => {
      const dateObj = parseLocalDate(item.date);
      const formattedDate = period === '7days' 
        ? dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
        : dateObj.toLocaleDateString('es-ES', { month: 'short' });

      const netRevenue = item.total_revenue_net ?? item.total_revenue ?? 0;

      return {
        date: formattedDate,
        total_revenue: netRevenue,
        total_revenue_net: item.total_revenue_net,
        total_revenue_gross: item.total_revenue_gross,
        total_credit_notes: item.total_credit_notes,
        total_debit_notes: item.total_debit_notes,
        total_sales: item.total_sales || 0,
        tickets_revenue: parseFloat(item.breakdown?.tickets?.revenue || '0'),
        cargo_revenue: parseFloat(item.breakdown?.cargo?.revenue || '0'),
      };
    });
  };

  // Obtener datos según el período seleccionado
  const currentData = period === '7days' ? last7DaysData : last12MonthsData;
  const isLoading = period === '7days' ? isLoading7Days : isLoading12Months;
  const error = period === '7days' ? error7Days : error12Months;

  const chartData = formatChartData(currentData || []);

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

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="text-red-500 text-center py-8">
          <div className="mb-2">Error al cargar estadísticas</div>
          <div className="text-sm text-red-400">
            {error.message || 'No se pudieron obtener los datos'}
          </div>
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="text-gray-500 text-center py-8">
          <div className="mb-2">No hay datos de ventas disponibles</div>
          <div className="text-sm">
            {period === '7days' 
              ? 'No se encontraron ventas en los últimos 7 días'
              : 'No se encontraron ventas en los últimos 12 meses'
            }
          </div>
        </div>
      </div>
    );
  }

  // Calcular totales para las métricas
  const totalSales = chartData.reduce((sum, item) => sum + item.total_sales, 0);
  const totalRevenue = chartData.reduce((sum, item) => sum + item.total_revenue, 0);
  const totalTickets = chartData.reduce((sum, item) => sum + item.tickets_revenue, 0);
  const totalCargo = chartData.reduce((sum, item) => sum + item.cargo_revenue, 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      {/* Header con título y controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Mi Rendimiento de Ventas</h3>
          <p className="text-sm text-gray-500">Evolución de ingresos por período</p>
        </div>

        {/* Period Toggle Buttons */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setPeriod('7days')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              period === '7days'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            7 Días
          </button>
          <button
            onClick={() => setPeriod('12months')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              period === '12months'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            12 Meses
          </button>
        </div>
      </div>

      {/* Métricas resumen compactas */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="text-center p-3 bg-indigo-50 rounded-lg">
          <div className="text-lg font-bold text-indigo-600">{totalSales}</div>
          <div className="text-xs text-gray-500">Ventas</div>
        </div>
        <div className="text-center p-3 bg-emerald-50 rounded-lg">
          <div className="text-lg font-bold text-emerald-600">
            S/ {totalRevenue >= 1000 ? `${(totalRevenue/1000).toFixed(1)}k` : totalRevenue.toLocaleString('es-PE')}
          </div>
          <div className="text-xs text-gray-500">Ingresos</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-600">
            S/ {totalTickets >= 1000 ? `${(totalTickets/1000).toFixed(1)}k` : totalTickets.toLocaleString('es-PE')}
          </div>
          <div className="text-xs text-gray-500">Pasajes</div>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded-lg">
          <div className="text-lg font-bold text-amber-600">
            S/ {totalCargo >= 1000 ? `${(totalCargo/1000).toFixed(1)}k` : totalCargo.toLocaleString('es-PE')}
          </div>
          <div className="text-xs text-gray-500">Encomiendas</div>
        </div>
      </div>

      {/* Gráfico de Área Elegante */}
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart 
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            {/* Gradiente para Ingresos Totales */}
            <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
            </linearGradient>
            {/* Gradiente para Pasajes */}
            <linearGradient id="gradientTickets" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="#f0f0f0"
          />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
            dx={-5}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Área de Ingresos Totales */}
          <Area
            type="monotone"
            dataKey="total_revenue"
            name="Ingresos Totales"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#gradientRevenue)"
            dot={false}
            activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
          />
          
          {/* Área de Pasajes */}
          <Area
            type="monotone"
            dataKey="tickets_revenue"
            name="Pasajes"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#gradientTickets)"
            dot={false}
            activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Leyenda personalizada */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          <span className="text-sm text-gray-600">Ingresos Totales</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm text-gray-600">Pasajes</span>
        </div>
      </div>
    </div>
  );
};

export default UserSalesChart;