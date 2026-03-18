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
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
        <p className="mb-2 text-sm font-semibold text-slate-900">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.stroke || entry.color }}
            />
            <span className="text-slate-600">{entry.name}:</span>
            <span className="font-semibold text-slate-900">
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/3 rounded bg-slate-200" />
          <div className="h-64 rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="py-8 text-center text-red-500">
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="py-8 text-center text-slate-500">
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
    <section className="flex h-full flex-col rounded-xl bg-white p-8 shadow-sm">
      {/* Header con título y controles */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Mi Rendimiento de Ventas</h2>
          <p className="text-sm text-slate-500">Evolución histórica de métricas clave</p>
        </div>

        {/* Period Toggle Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('7days')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              period === '7days'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            7 Días
          </button>
          <button
            onClick={() => setPeriod('12months')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              period === '12months'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            12 Meses
          </button>
        </div>
      </div>

      {/* Gráfico de Área Elegante */}
      <div className="relative h-[300px] w-full overflow-hidden rounded-lg border border-slate-100 bg-slate-50 p-4">
        <ResponsiveContainer width="100%" height={240}>
        <AreaChart
          data={chartData}
          margin={{ top: 8, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            {/* Gradiente para Ingresos Totales */}
            <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
            </linearGradient>
            {/* Gradiente para Ventas por Pasajes */}
            <linearGradient id="gradientTickets" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
            {/* Gradiente para Encomiendas */}
            <linearGradient id="gradientCargo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#64748b' }}
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
            stroke="#4f46e5"
            strokeWidth={2.2}
            fill="url(#gradientRevenue)"
            dot={false}
            activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
          />

          {/* Área de Ventas por Pasajes */}
          <Area
            type="monotone"
            dataKey="tickets_revenue"
            name="Ventas por Pasajes"
            stroke="#3b82f6"
            strokeWidth={2.2}
            fill="url(#gradientTickets)"
            dot={false}
            activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
          />

          {/* Área de Encomiendas */}
          <Area
            type="monotone"
            dataKey="cargo_revenue"
            name="Encomiendas"
            stroke="#f59e0b"
            strokeWidth={2.2}
            fill="url(#gradientCargo)"
            dot={false}
            activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
          <div className="rounded bg-white/90 px-2 py-1 text-slate-600">Ventas: {totalSales.toLocaleString('es-PE')}</div>
          <div className="rounded bg-white/90 px-2 py-1 text-slate-600">Ingresos: S/ {totalRevenue.toLocaleString('es-PE')}</div>
          <div className="rounded bg-white/90 px-2 py-1 text-slate-600">Pasajes: S/ {totalTickets.toLocaleString('es-PE')}</div>
          <div className="rounded bg-white/90 px-2 py-1 text-slate-600">Encomiendas: S/ {totalCargo.toLocaleString('es-PE')}</div>
        </div>
      </div>

      {/* Leyenda personalizada */}
      <div className="mt-6 flex flex-wrap gap-6 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-indigo-500" />
          <span className="text-xs font-medium text-slate-600">Ingresos Totales</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-xs font-medium text-slate-600">Ventas por Pasajes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="text-xs font-medium text-slate-600">Encomiendas</span>
        </div>
      </div>
    </section>
  );
};

export default UserSalesChart;