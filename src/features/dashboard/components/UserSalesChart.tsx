// src/features/dashboard/components/UserSalesChart.tsx
import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useLast7DaysStatistics, useLast12MonthsStatistics } from '../../../hooks/useUserStatistics';
import { parseLocalDate } from '../../../utils/dateUtils';

type ChartPeriod = '7days' | '12months';
type ChartType = 'line' | 'bar';

interface ChartData {
  date: string;
  total_revenue: number;
  total_sales: number;
  tickets_revenue: number;
  cargo_revenue: number;
}

const UserSalesChart: React.FC = () => {
  const [period, setPeriod] = useState<ChartPeriod>('7days');
  const [chartType, setChartType] = useState<ChartType>('line');

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
      // Usar parseLocalDate para evitar problemas de zona horaria
      const dateObj = parseLocalDate(item.date);
      const formattedDate = period === '7days' 
        ? dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
        : dateObj.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });

      return {
        date: formattedDate,
        total_revenue: item.total_revenue || 0,
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

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriod(e.target.value as ChartPeriod);
  };

  const handleChartTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setChartType(e.target.value as ChartType);
  };

  const getChartTitle = () => {
    const periodText = period === '7days' ? 'Últimos 7 Días' : 'Últimos 12 Meses';
    return `Mi Rendimiento de Ventas - ${periodText}`;
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      width: '100%',
      height: 300,
    };

    if (chartType === 'line') {
      return (
        <ResponsiveContainer {...commonProps}>
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
              formatter={(value, name) => {
                if (name === 'total_sales') {
                  return [Number(value).toLocaleString('es-PE'), 'Ventas Totales'];
                }
                return [`S/ ${Number(value).toLocaleString('es-PE')}`, getTooltipLabel(name as string)];
              }}
              labelFormatter={(label) => `Fecha: ${label}`}
            />
            <Legend formatter={getLegendLabel} />
            <Line
              type="monotone"
              dataKey="total_revenue"
              stroke="#8884d8"
              name="total_revenue"
              strokeWidth={3}
              dot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="tickets_revenue"
              stroke="#82ca9d"
              name="tickets_revenue"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="cargo_revenue"
              stroke="#ffc658"
              name="cargo_revenue"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer {...commonProps}>
          <BarChart data={chartData}>
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
              formatter={(value, name) => {
                if (name === 'total_sales') {
                  return [Number(value).toLocaleString('es-PE'), 'Ventas Totales'];
                }
                return [`S/ ${Number(value).toLocaleString('es-PE')}`, getTooltipLabel(name as string)];
              }}
              labelFormatter={(label) => `Fecha: ${label}`}
            />
            <Legend formatter={getLegendLabel} />
            <Bar
              dataKey="tickets_revenue"
              fill="#82ca9d"
              name="tickets_revenue"
            />
            <Bar
              dataKey="cargo_revenue"
              fill="#ffc658"
              name="cargo_revenue"
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };

  const getLegendLabel = (value: string) => {
    const labels: { [key: string]: string } = {
      'total_revenue': 'Ingresos Totales',
      'tickets_revenue': 'Ingresos Pasajes',
      'cargo_revenue': 'Ingresos Encomiendas',
      'total_sales': 'Ventas Totales'
    };
    return labels[value] || value;
  };

  const getTooltipLabel = (name: string) => {
    const labels: { [key: string]: string } = {
      'total_revenue': 'Ingresos Totales',
      'tickets_revenue': 'Ingresos Pasajes',
      'cargo_revenue': 'Ingresos Encomiendas',
      'total_sales': 'Ventas Totales'
    };
    return labels[name] || name;
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="text-red-500 text-center py-8">
          <div className="mb-2">Error al cargar estadísticas de ventas</div>
          <div className="text-sm text-red-400">
            {error.message || 'No se pudieron obtener los datos'}
          </div>
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h3 className="text-lg font-semibold text-gray-900">{getChartTitle()}</h3>

        {/* Controles */}
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex items-center gap-3">
            <label htmlFor="period" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Período:
            </label>
            <select
              id="period"
              value={period}
              onChange={handlePeriodChange}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
            >
              <option value="7days">Últimos 7 Días</option>
              <option value="12months">Últimos 12 Meses</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="chart-type" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Tipo:
            </label>
            <select
              id="chart-type"
              value={chartType}
              onChange={handleChartTypeChange}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[100px]"
            >
              <option value="line">Líneas</option>
              <option value="bar">Barras</option>
            </select>
          </div>
        </div>
      </div>

      {/* Métricas resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-600">
            {chartData.reduce((sum, item) => sum + item.total_sales, 0)}
          </div>
          <div className="text-xs text-gray-600">Total Ventas</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">
            S/ {chartData.reduce((sum, item) => sum + item.total_revenue, 0).toLocaleString('es-PE')}
          </div>
          <div className="text-xs text-gray-600">Total Ingresos</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-lg font-bold text-purple-600">
            S/ {chartData.reduce((sum, item) => sum + item.tickets_revenue, 0).toLocaleString('es-PE')}
          </div>
          <div className="text-xs text-gray-600">Pasajes</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-lg font-bold text-orange-600">
            S/ {chartData.reduce((sum, item) => sum + item.cargo_revenue, 0).toLocaleString('es-PE')}
          </div>
          <div className="text-xs text-gray-600">Encomiendas</div>
        </div>
      </div>

      {/* Gráfico */}
      {renderChart()}
    </div>
  );
};

export default UserSalesChart;