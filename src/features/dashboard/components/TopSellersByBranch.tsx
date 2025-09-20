import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminReportsService, SalesByBranchResponse } from '../../../services/adminReports.service';
import { TrophyIcon, UserIcon } from '@heroicons/react/24/outline';

// Función para obtener datos de ventas por sucursal
const getBranchSalesData = async (
  periodGrouping: string,
  includeSellerDetails: boolean
): Promise<SalesByBranchResponse> => {
  const now = new Date();
  let startDate: Date;

  // Definir rango de fechas según el período seleccionado
  switch (periodGrouping) {
    case 'daily':
      // Para diario, solo el día de hoy
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
      // Para semanal, últimas 8 semanas
      startDate = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      // Para mensual, últimos 6 meses
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      break;
    case 'yearly':
      // Para anual, últimos 3 años
      startDate = new Date(now.getFullYear() - 3, 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const endDate = now;

  const report: SalesByBranchResponse = await adminReportsService.getSalesByBranch({
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    period_grouping: periodGrouping as 'daily' | 'weekly' | 'monthly' | 'yearly',
    include_seller_details: includeSellerDetails,
  });

  return report;
};

export const TopSellersByBranch: React.FC = () => {
  const [periodGrouping, setPeriodGrouping] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [includeSellerDetails, setIncludeSellerDetails] = useState(true); // Cambiar por defecto a true

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

  // Título dinámico según el período
  const getComponentTitle = () => {
    switch (periodGrouping) {
      case 'daily':
        return 'Top Vendedores del Día por Sucursal';
      case 'weekly':
        return 'Top Vendedores Semanales por Sucursal';
      case 'monthly':
        return 'Top Vendedores Mensuales por Sucursal';
      case 'yearly':
        return 'Top Vendedores Anuales por Sucursal';
      default:
        return 'Top Vendedores por Sucursal';
    }
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

  // Si no hay datos, mostrar mensaje
  if (!isLoading && (!branchData || branchData.length === 0)) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <TrophyIcon className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">{getComponentTitle()}</h3>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <TrophyIcon className="w-16 h-16 mx-auto mb-4" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No hay datos disponibles</h4>
          <p className="text-gray-600">No se encontraron ventas para el período seleccionado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <TrophyIcon className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">{getComponentTitle()}</h3>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {branchData.map((branch, index) => (
          <div
            key={branch.branch_office_id}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 hover:shadow-lg transition-all duration-200"
          >
            {/* Header de la sucursal */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-gray-900 text-lg">{branch.branch_office_name}</h4>
                <p className="text-sm text-gray-600">{branch.branch_office_address}</p>
              </div>
              <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
                <TrophyIcon className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-bold text-yellow-700">#{index + 1}</span>
              </div>
            </div>

            {/* Resumen de la sucursal */}
            <div className="bg-white rounded-lg p-4 mb-4 border border-blue-100">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Facturas:</span>
                  <span className="font-bold ml-2">{branch.total_invoices}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold ml-2 text-green-700">
                    S/ {parseFloat(branch.total_amount).toLocaleString('es-PE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Promedio:</span>
                  <span className="font-bold ml-2">
                    S/ {parseFloat(branch.average_ticket).toLocaleString('es-PE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Vendedores:</span>
                  <span className="font-bold ml-2">{branch.sellers?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Top Seller destacado */}
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-3 rounded-lg mb-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrophyIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Top Vendedor</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{branch.top_seller_name}</p>
                  <p className="text-sm text-gray-600">
                    S/ {parseFloat(branch.top_seller_amount).toLocaleString('es-PE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
                {branch.sellers && branch.sellers.length > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-green-700 font-semibold">
                      {branch.sellers[0].percentage_of_branch_sales}%
                    </p>
                    <p className="text-xs text-gray-600">de participación</p>
                  </div>
                )}
              </div>
            </div>

            {/* Lista de vendedores si están incluidos los detalles */}
            {includeSellerDetails && branch.sellers && branch.sellers.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">Ranking de Vendedores:</h5>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {branch.sellers.map((seller, sellerIndex) => (
                    <div
                      key={seller.seller_id}
                      className={`flex items-center justify-between p-2 rounded text-xs ${
                        sellerIndex === 0 
                          ? 'bg-yellow-50 border border-yellow-200' 
                          : 'bg-white border border-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${
                          sellerIndex === 0 ? 'text-yellow-700' : 'text-gray-600'
                        }`}>
                          #{seller.ranking_position}
                        </span>
                        <UserIcon className={`w-3 h-3 ${
                          sellerIndex === 0 ? 'text-yellow-600' : 'text-gray-500'
                        }`} />
                        <div>
                          <p className={`font-medium ${
                            sellerIndex === 0 ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {seller.seller_name}
                          </p>
                          <p className="text-gray-500 text-xs">{seller.total_invoices} facturas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          sellerIndex === 0 ? 'text-green-700' : 'text-green-600'
                        }`}>
                          S/ {parseFloat(seller.total_amount).toLocaleString('es-PE')}
                        </p>
                        <p className={`text-xs ${
                          sellerIndex === 0 ? 'text-yellow-700' : 'text-gray-500'
                        }`}>
                          {seller.percentage_of_branch_sales}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Resumen general */}
      {reportData?.summary && (
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-bold text-gray-900 mb-4 text-lg">Resumen General</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{reportData.summary.total_branches}</div>
              <div className="text-sm text-gray-600">Sucursales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{reportData.summary.total_invoices}</div>
              <div className="text-sm text-gray-600">Total Facturas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                S/ {parseFloat(reportData.summary.total_amount).toLocaleString('es-PE', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}
              </div>
              <div className="text-sm text-gray-600">Ventas Totales</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{reportData.summary.top_branch_name}</div>
              <div className="text-sm text-gray-600">Top Sucursal</div>
              <div className="text-sm font-medium text-purple-700">
                S/ {parseFloat(reportData.summary.top_branch_amount).toLocaleString('es-PE')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};