import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { reportsService } from '../../../services/reports.service';

// Función para obtener datos de ventas mensuales
const getMonthlySalesData = async () => {
  const months = [];
  const now = new Date();

  // Generar datos para los últimos 6 meses
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    try {
      const report = await reportsService.getDailySales({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      });

      months.push({
        name: date.toLocaleDateString('es-ES', { month: 'short' }),
        value: report.resumenEjecutivo?.totalVentas || 0,
      });
    } catch (error) {
      months.push({
        name: date.toLocaleDateString('es-ES', { month: 'short' }),
        value: 0,
      });
    }
  }

  return months;
};

export const MonthlySalesChart: React.FC = () => {
  const { data: monthlyData, isLoading } = useQuery({
    queryKey: ['monthly-sales-chart'],
    queryFn: getMonthlySalesData,
    staleTime: 1000 * 60 * 30, // 30 minutos
  });

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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas Mensuales</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={monthlyData || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => [`S/ ${value}`, 'Ventas']} />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};