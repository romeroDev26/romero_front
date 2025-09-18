import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { reportsService } from '../../../services/reports.service';

// Función para procesar datos de ventas por sucursal
const getBranchSalesData = async () => {
  const report = await reportsService.getDailySalesLast30Days();

  // Agrupar ventas por sucursal
  const branchData: { [key: string]: number } = {};

  report.items.forEach(item => {
    const branch = item.branch_office_name || 'Sin Sucursal';
    const amount = parseFloat(item.total_amount) || 0;
    branchData[branch] = (branchData[branch] || 0) + amount;
  });

  // Convertir a formato de gráfico
  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  return Object.entries(branchData).map(([name, value], index) => ({
    name,
    value,
    color: colors[index % colors.length],
  }));
};

export const BranchSalesChart: React.FC = () => {
  const { data: branchData, isLoading } = useQuery({
    queryKey: ['branch-sales-chart'],
    queryFn: getBranchSalesData,
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

  const data = branchData || [];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas por Sucursales</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`S/ ${value}`, 'Ventas']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};