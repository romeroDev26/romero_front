import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { TopVendedoresPorSucursal } from '../../../types/dashboard';

interface TopSellersByBranchProps {
  data?: TopVendedoresPorSucursal;
  isLoading?: boolean;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  includeSellerDetails?: boolean;
  onPeriodChange?: (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => void;
  onSellerDetailsChange?: (include: boolean) => void;
}

// Colores para las barras de progreso por sucursal
const BRANCH_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const TopSellersByBranch: React.FC<TopSellersByBranchProps> = ({ 
  data,
  isLoading = false,
  period = 'daily',
  onPeriodChange,
}) => {
  // Usar 'all' para expandir todas las sucursales por defecto, o un ID específico para expandir solo una
  const [expandedBranches, setExpandedBranches] = useState<'all' | Set<number>>('all');

  const getComponentTitle = () => {
    switch (period) {
      case 'daily': return 'Rendimiento del Dia';
      case 'weekly': return 'Rendimiento Semanal';
      case 'monthly': return 'Rendimiento Mensual';
      case 'yearly': return 'Rendimiento Anual';
      default: return 'Rendimiento';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-gray-100">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-100 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-50 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const branchData = data?.sucursales || [];
  const maxSales = Math.max(...branchData.map(b => b.total_ventas), 1);

  // Función para verificar si una sucursal está expandida
  const isBranchExpanded = (branchId: number): boolean => {
    if (expandedBranches === 'all') return true;
    return expandedBranches.has(branchId);
  };

  // Función para alternar el estado de una sucursal
  const toggleBranch = (branchId: number) => {
    if (expandedBranches === 'all') {
      // Si todas están expandidas, crear un Set con todas menos la que se clickeó
      const newSet = new Set(branchData.map(b => b.sucursal_id).filter(id => id !== branchId));
      setExpandedBranches(newSet);
    } else {
      const newSet = new Set(expandedBranches);
      if (newSet.has(branchId)) {
        newSet.delete(branchId);
      } else {
        newSet.add(branchId);
      }
      // Si todas están expandidas nuevamente, volver a 'all'
      if (newSet.size === branchData.length) {
        setExpandedBranches('all');
      } else {
        setExpandedBranches(newSet);
      }
    }
  };

  if (!isLoading && (!branchData || branchData.length === 0)) {
    return (
      <div className="bg-white p-5 rounded-xl border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-gray-500">{getComponentTitle()}</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-gray-400">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  // Obtener todos los top vendedores de todas las sucursales
  const allTopSellers = branchData
    .filter(b => b.vendedores && b.vendedores.length > 0)
    .map(b => ({
      ...b.vendedores[0],
      sucursal_nombre: b.sucursal_nombre
    }))
    .sort((a, b) => b.total_ventas - a.total_ventas)
    .slice(0, 5);

  const maxSellerSales = Math.max(...allTopSellers.map(s => s.total_ventas), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Tabla de Sucursales */}
      <div className="bg-white p-5 rounded-xl border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Ventas por Sucursal</h3>
            <p className="text-lg font-semibold text-gray-900 mt-0.5">
              S/ {data?.resumen_general?.total_ventas.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}
            </p>
          </div>
          {onPeriodChange && (
            <select
              value={period}
              onChange={(e) => onPeriodChange(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
              className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="daily">Hoy</option>
              <option value="weekly">Semana</option>
              <option value="monthly">Mes</option>
              <option value="yearly">Anual</option>
            </select>
          )}
        </div>

        <div className="space-y-1">
          {branchData.map((branch, index) => {
            const isExpanded = isBranchExpanded(branch.sucursal_id);
            const percentage = (branch.total_ventas / maxSales) * 100;
            const color = BRANCH_COLORS[index % BRANCH_COLORS.length];

            return (
              <div key={branch.sucursal_id}>
                <button
                  onClick={() => toggleBranch(branch.sucursal_id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {branch.vendedores && branch.vendedores.length > 0 ? (
                        isExpanded ? (
                          <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        )
                      ) : (
                        <div className="w-3.5" />
                      )}
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm text-gray-700 truncate">{branch.sucursal_nombre}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-24 text-right">
                        S/ {branch.total_ventas.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-xs text-gray-400 w-10 text-right hidden sm:block">
                        {branch.total_facturas}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Vendedores expandidos */}
                {isExpanded && branch.vendedores && branch.vendedores.length > 0 && (
                  <div className="ml-8 pl-3 border-l border-gray-100 py-1 space-y-0.5">
                    {branch.vendedores.slice(0, 5).map((seller, sIndex) => (
                      <div 
                        key={seller.vendedor_id}
                        className="flex items-center justify-between py-1.5 px-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-4 text-center font-medium ${sIndex === 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                            {sIndex + 1}
                          </span>
                          <span className="text-gray-600">{seller.vendedor_nombre}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">
                            S/ {seller.total_ventas.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-gray-400 w-8 text-right">
                            {seller.porcentaje_ventas_sucursal.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer con totales */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">Total {branchData.length} sucursales</span>
          <span className="text-xs text-gray-400">{data?.resumen_general?.total_facturas || 0} facturas</span>
        </div>
      </div>

      {/* Top Vendedores Global */}
      <div className="bg-white p-5 rounded-xl border border-gray-100">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500">Top Vendedores</h3>
          <p className="text-lg font-semibold text-gray-900 mt-0.5">Ranking General</p>
        </div>

        {allTopSellers.length > 0 ? (
          <div className="space-y-3">
            {allTopSellers.map((seller, index) => {
              const percentage = (seller.total_ventas / maxSellerSales) * 100;
              const isTop = index === 0;
              
              return (
                <div key={seller.vendedor_id} className="group">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium ${
                      isTop ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 truncate">{seller.vendedor_nombre}</span>
                        <span className="text-sm font-semibold text-gray-900 flex-shrink-0 ml-2">
                          S/ {seller.total_ventas.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${isTop ? 'bg-amber-400' : 'bg-blue-400'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0 w-20 truncate">
                          {seller.sucursal_nombre.replace('Sucursal ', '')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">Sin datos de vendedores</p>
          </div>
        )}

        {/* Top sucursal destacada */}
        {data?.resumen_general && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Sucursal lider</p>
                <p className="text-sm font-medium text-gray-900">{data.resumen_general.top_sucursal_nombre}</p>
              </div>
              <p className="text-sm font-semibold text-blue-600">
                S/ {data.resumen_general.top_sucursal_ventas.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
