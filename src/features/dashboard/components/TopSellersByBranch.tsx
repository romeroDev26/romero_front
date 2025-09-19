import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminReportsService, SalesByBranchResponse } from '../../../services/adminReports.service';
import { TrophyIcon, UserIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

// Función para obtener datos de ventas por sucursal
const getBranchSalesData = async (
  periodGrouping: string,
  includeSellerDetails: boolean
): Promise<SalesByBranchResponse> => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  const endDate = now.toISOString().split('T')[0];

  const report: SalesByBranchResponse = await adminReportsService.getSalesByBranch({
    start_date: startDate,
    end_date: endDate,
    period_grouping: periodGrouping as 'daily' | 'weekly' | 'monthly' | 'yearly',
    include_seller_details: includeSellerDetails,
  });

  return report;
};

export const TopSellersByBranch: React.FC = () => {
  const [periodGrouping, setPeriodGrouping] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [includeSellerDetails, setIncludeSellerDetails] = useState(false);

  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ['top-sellers-by-branch', periodGrouping, includeSellerDetails],
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
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="text-red-500">Error al cargar datos de top vendedores</div>
      </div>
    );
  }

  const branchData = reportData?.items || [];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <TrophyIcon className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">Top Vendedores por Sucursal</h3>
        </div>

        {/* Controles */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="period-grouping-top" className="text-sm font-medium text-gray-700">
              Período:
            </label>
            <select
              id="period-grouping-top"
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
              id="include-sellers-top"
              checked={includeSellerDetails}
              onChange={handleSellerDetailsChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="include-sellers-top" className="text-sm font-medium text-gray-700">
              Detalles completos
            </label>
          </div>
        </div>
      </div>

      {/* Grid de sucursales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branchData.map((branch, index) => (
          <div
            key={branch.branch_office_id}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 text-sm">{branch.branch_office_name}</h4>
              <div className="flex items-center gap-1">
                <TrophyIcon className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-medium text-gray-600">#{index + 1}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">{branch.top_seller_name}</span>
              </div>

              <div className="flex items-center gap-2">
                <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">
                  S/ {parseFloat(branch.top_seller_amount).toLocaleString('es-PE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            </div>

            {/* Información adicional de la sucursal */}
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="text-xs text-gray-600 space-y-1">
                <div>Total facturas: <span className="font-medium">{branch.total_invoices}</span></div>
                <div>Ventas totales: <span className="font-medium">S/ {parseFloat(branch.total_amount).toLocaleString('es-PE')}</span></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen general */}
      {reportData?.summary && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Resumen General</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total sucursales:</span>
              <span className="font-medium ml-1">{reportData.summary.total_branches}</span>
            </div>
            <div>
              <span className="text-gray-600">Total facturas:</span>
              <span className="font-medium ml-1">{reportData.summary.total_invoices}</span>
            </div>
            <div>
              <span className="text-gray-600">Ventas totales:</span>
              <span className="font-medium ml-1">S/ {parseFloat(reportData.summary.total_amount).toLocaleString('es-PE')}</span>
            </div>
            <div>
              <span className="text-gray-600">Top sucursal:</span>
              <span className="font-medium ml-1">{reportData.summary.top_branch_name}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};