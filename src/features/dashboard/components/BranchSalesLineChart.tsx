import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { getLocalDateString } from '../../../utils/dateUtils';

// Colores fijos para cada sucursal para mantener consistencia
const BRANCH_COLORS = {
  'Sucursal NAUTA': '#8884d8',
  'Sucursal YURIMAGUAS': '#82ca9d',
  'Sucursal IQUITOS': '#ffc658',
  'Sucursal REQUENA': '#ff7c7c',
  'Sucursal CONTAMANA': '#8dd1e1',
  'Sin Sucursal': '#d084d0'
};

// Función para obtener datos de ventas por sucursal usando datos reales del backend
const getBranchSalesData = async (
  periodGrouping: string
): Promise<{ date: string; [key: string]: number | string }[]> => {
  const now = new Date();
  let startDate: Date;

  // Definir rango de fechas según el período
  switch (periodGrouping) {
    case 'daily':
      // Para diario, solo el día de hoy
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
      startDate = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000); // 8 semanas
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1); // 6 meses
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear() - 3, 0, 1); // 3 años
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const endDate = now;

  // Para período diario, usar adminReportsService que devuelve totales por sucursal
  if (periodGrouping === 'daily') {
    const { adminReportsService } = await import('../../../services/adminReports.service');
    
    const todayStr = getLocalDateString(now);
    const report = await adminReportsService.getSalesByBranch({
      start_date: todayStr,
      end_date: todayStr,
      period_grouping: 'daily',
      include_seller_details: false
    });

    // Para el período diario, crear un solo punto con todas las sucursales
    const todayFormatted = formatDateForDisplay(todayStr, 'daily');
    const chartData: { date: string; [key: string]: number | string }[] = [{ date: todayFormatted }];

    // Agregar datos de cada sucursal
    report.items.forEach(branch => {
      chartData[0][branch.branch_office_name] = parseFloat(branch.total_amount);
    });

    return chartData;
  }

  // Para otros períodos, usar el servicio de reportes diarios para obtener datos históricos
  const { reportsService } = await import('../../../services/reports.service');
  
  const report = await reportsService.getDailySales({
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
  });

  // Procesar datos reales para gráfico de líneas: agrupar por fecha y sucursal
  const dataMap: { [date: string]: { [branch: string]: number } } = {};
  const allBranchNames = new Set<string>();

  report.items.forEach(item => {
    let date = item.issue_date.split('T')[0]; // YYYY-MM-DD
    const branch = item.branch_office_name || 'Sin Sucursal';
    const amount = parseFloat(item.total_amount) || 0;
    
    // Agrupar por período si no es diario
    if (periodGrouping !== 'daily') {
      const dateObj = new Date(date);
      switch (periodGrouping) {
        case 'weekly':
          // Agrupar por semana (lunes de la semana)
          const monday = new Date(dateObj);
          monday.setDate(dateObj.getDate() - dateObj.getDay() + 1);
          date = monday.toISOString().split('T')[0];
          break;
        case 'monthly':
          // Agrupar por mes
          date = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-01`;
          break;
        case 'yearly':
          // Agrupar por año
          date = `${dateObj.getFullYear()}-01-01`;
          break;
      }
    }

    allBranchNames.add(branch);

    if (!dataMap[date]) {
      dataMap[date] = {};
    }
    dataMap[date][branch] = (dataMap[date][branch] || 0) + amount;
  });

  // Convertir a formato de gráfico: array de objetos con date y ventas por sucursal
  const processedData: { date: string; [key: string]: number | string }[] = [];

  Object.keys(dataMap).sort().forEach(date => {
    const entry: { date: string; [key: string]: number | string } = { 
      date: formatDateForDisplay(date, periodGrouping)
    };
    
    // Inicializar todas las sucursales con 0
    allBranchNames.forEach(branchName => {
      entry[branchName] = dataMap[date][branchName] || 0;
    });
    
    processedData.push(entry);
  });

  return processedData;
};

// Función auxiliar para formatear fechas según el período
const formatDateForDisplay = (date: string, periodGrouping: string): string => {
  const dateObj = new Date(date);
  
  switch (periodGrouping) {
    case 'daily':
      return dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    case 'weekly':
      return `Sem ${Math.ceil(dateObj.getDate() / 7)} ${dateObj.toLocaleDateString('es-ES', { month: 'short' })}`;
    case 'monthly':
      return dateObj.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    case 'yearly':
      return dateObj.getFullYear().toString();
    default:
      return date;
  }
};

export const BranchSalesLineChart: React.FC = () => {
  const [periodGrouping, setPeriodGrouping] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  const { data: branchData, isLoading, error } = useQuery({
    queryKey: ['branch-sales-line-chart', periodGrouping],
    queryFn: () => getBranchSalesData(periodGrouping),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriodGrouping(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly');
  };

  // Título dinámico según el período
  const getChartTitle = () => {
    switch (periodGrouping) {
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

  // Obtener todas las sucursales únicas para generar colores consistentes
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

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="text-red-500">Error al cargar datos de ventas por sucursal</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{getChartTitle()}</h3>

        {/* Controles */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="period-grouping" className="text-sm font-medium text-gray-700">
              Período:
            </label>
            <select
              id="period-grouping"
              value={periodGrouping}
              onChange={handlePeriodChange}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
              <option value="yearly">Anual</option>
            </select>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={branchData || []}>
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
          {/* Generar barras dinámicamente para cada sucursal con colores consistentes */}
          {branchData && branchData.length > 0 && Object.keys(branchData[0])
            .filter(key => key !== 'date')
            .map((branch) => (
              <Bar
                key={branch}
                dataKey={branch}
                fill={getBranchColor(branch)}
                name={branch}
              />
            ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};