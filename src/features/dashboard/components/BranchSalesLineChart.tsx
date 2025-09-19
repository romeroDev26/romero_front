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
import { adminReportsService, SalesByBranchResponse } from '../../../services/adminReports.service';

// Función para obtener datos de ventas por sucursal
const getBranchSalesData = async (
  periodGrouping: string,
  includeSellerDetails: boolean
): Promise<{ name: string; ventas: number; facturas: number; descuento: number; impuesto: number }[]> => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  const endDate = now.toISOString().split('T')[0];

  const report: SalesByBranchResponse = await adminReportsService.getSalesByBranch({
    start_date: startDate,
    end_date: endDate,
    period_grouping: periodGrouping as 'daily' | 'weekly' | 'monthly' | 'yearly',
    include_seller_details: includeSellerDetails,
  });

  // Procesar datos para gráfico de barras
  const processedData = report.items.map((item) => ({
    name: item.branch_office_name,
    ventas: parseFloat(item.total_amount) || 0,
    facturas: item.total_invoices,
    descuento: parseFloat(item.total_discount) || 0,
    impuesto: parseFloat(item.total_tax) || 0,
  }));

  return processedData;
};

export const BranchSalesLineChart: React.FC = () => {
  const [periodGrouping, setPeriodGrouping] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [includeSellerDetails, setIncludeSellerDetails] = useState(false);

  const { data: branchData, isLoading, error } = useQuery({
    queryKey: ['branch-sales-chart', periodGrouping, includeSellerDetails],
    queryFn: () => getBranchSalesData(periodGrouping, includeSellerDetails),
    staleTime: 1000 * 60 * 30, // 30 minutos
  });

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriodGrouping(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly');
  };

  const handleSellerDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeSellerDetails(e.target.checked);
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
        <h3 className="text-lg font-semibold text-gray-900">Ventas por Sucursal</h3>

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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="include-sellers"
              checked={includeSellerDetails}
              onChange={handleSellerDetailsChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="include-sellers" className="text-sm font-medium text-gray-700">
              Incluir detalles de vendedores
            </label>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={branchData || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value, name) => {
            if (name === 'ventas') return [`S/ ${value}`, 'Ventas'];
            if (name === 'facturas') return [value, 'Facturas'];
            if (name === 'descuento') return [`S/ ${value}`, 'Descuento'];
            if (name === 'impuesto') return [`S/ ${value}`, 'Impuesto'];
            return [value, name];
          }} />
          <Legend />
          <Bar dataKey="ventas" fill="#8884d8" name="Ventas" />
          <Bar dataKey="facturas" fill="#82ca9d" name="Facturas" />
          <Bar dataKey="descuento" fill="#ffc658" name="Descuento" />
          <Bar dataKey="impuesto" fill="#ff7300" name="Impuesto" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};