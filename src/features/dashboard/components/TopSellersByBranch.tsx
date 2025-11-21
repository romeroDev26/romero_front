import React from 'react';
import { TrophyIcon, UserIcon } from '@heroicons/react/24/outline';
import { TopVendedoresPorSucursal } from '../../../types/dashboard';

interface TopSellersByBranchProps {
  data?: TopVendedoresPorSucursal;
  isLoading?: boolean;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  includeSellerDetails?: boolean;
  onPeriodChange?: (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => void;
  onSellerDetailsChange?: (include: boolean) => void;
}

export const TopSellersByBranch: React.FC<TopSellersByBranchProps> = ({ 
  data,
  isLoading = false,
  period = 'daily',
  includeSellerDetails = true,
  onPeriodChange,
  onSellerDetailsChange
}) => {
  // Título dinámico según el período
  const getComponentTitle = () => {
    switch (period) {
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

  const branchData = data?.sucursales || [];

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
    <div className="bg-white p-4 lg:p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
        <div className="flex items-center gap-2">
          <TrophyIcon className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">{getComponentTitle()}</h3>
        </div>

        {/* Controles - solo mostrar si se proporcionan los handlers */}
        {(onPeriodChange || onSellerDetailsChange) && (
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {onPeriodChange && (
              <div className="flex items-center gap-2">
                <label htmlFor="period-grouping-top" className="text-sm font-medium text-gray-700">
                  Período:
                </label>
                <select
                  id="period-grouping-top"
                  value={period}
                  onChange={(e) => onPeriodChange(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
            )}

            {onSellerDetailsChange && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="include-sellers-top"
                  checked={includeSellerDetails}
                  onChange={(e) => onSellerDetailsChange(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="include-sellers-top" className="text-sm font-medium text-gray-700">
                  Detalles completos
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid de sucursales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {branchData.map((branch, index) => (
          <div
            key={branch.sucursal_id}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 hover:shadow-lg transition-all duration-200"
          >
            {/* Header de la sucursal */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-gray-900 text-lg">{branch.sucursal_nombre}</h4>
                <p className="text-sm text-gray-600">{branch.sucursal_direccion}</p>
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
                  <span className="font-bold ml-2">{branch.total_facturas}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold ml-2 text-green-700">
                    S/ {branch.total_ventas.toLocaleString('es-PE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Promedio:</span>
                  <span className="font-bold ml-2">
                    S/ {branch.ticket_promedio.toLocaleString('es-PE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Vendedores:</span>
                  <span className="font-bold ml-2">{branch.vendedores?.length || 0}</span>
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
                  <p className="font-bold text-gray-900">{branch.top_vendedor_nombre}</p>
                  <p className="text-sm text-gray-600">
                    S/ {branch.top_vendedor_ventas.toLocaleString('es-PE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
                {branch.vendedores && branch.vendedores.length > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-green-700 font-semibold">
                      {branch.vendedores[0].porcentaje_ventas_sucursal.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-600">de participación</p>
                  </div>
                )}
              </div>
            </div>

            {/* Lista de vendedores si están incluidos los detalles */}
            {includeSellerDetails && branch.vendedores && branch.vendedores.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">Ranking de Vendedores:</h5>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {branch.vendedores.map((seller, sellerIndex) => (
                    <div
                      key={seller.vendedor_id}
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
                          #{seller.posicion_ranking}
                        </span>
                        <UserIcon className={`w-3 h-3 ${
                          sellerIndex === 0 ? 'text-yellow-600' : 'text-gray-500'
                        }`} />
                        <div>
                          <p className={`font-medium ${
                            sellerIndex === 0 ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {seller.vendedor_nombre}
                          </p>
                          <p className="text-gray-500 text-xs">{seller.total_facturas} facturas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          sellerIndex === 0 ? 'text-green-700' : 'text-green-600'
                        }`}>
                          S/ {seller.total_ventas.toLocaleString('es-PE')}
                        </p>
                        <p className={`text-xs ${
                          sellerIndex === 0 ? 'text-yellow-700' : 'text-gray-500'
                        }`}>
                          {seller.porcentaje_ventas_sucursal.toFixed(1)}%
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
      {data?.resumen_general && (
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-lg border border-gray-200 mt-6">
          <h4 className="font-bold text-gray-900 mb-4 text-lg">Resumen General</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.resumen_general.total_sucursales}</div>
              <div className="text-sm text-gray-600">Sucursales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.resumen_general.total_facturas}</div>
              <div className="text-sm text-gray-600">Total Facturas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                S/ {data.resumen_general.total_ventas.toLocaleString('es-PE', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}
              </div>
              <div className="text-sm text-gray-600">Ventas Totales</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{data.resumen_general.top_sucursal_nombre}</div>
              <div className="text-sm text-gray-600">Top Sucursal</div>
              <div className="text-sm font-medium text-purple-700">
                S/ {data.resumen_general.top_sucursal_ventas.toLocaleString('es-PE')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
