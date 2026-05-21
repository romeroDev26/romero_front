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
      case 'daily': return 'Rendimiento del Día';
      case 'weekly': return 'Rendimiento Semanal';
      case 'monthly': return 'Rendimiento Mensual';
      case 'yearly': return 'Rendimiento Anual';
      default: return 'Rendimiento';
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-dm-border-primary bg-dm-bg-primary p-5 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-1/4 rounded bg-dm-bg-secondary" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-dm-bg-secondary" />
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
      <div className="rounded-xl border border-dm-border-primary bg-dm-bg-primary p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-dm-text-primary">{getComponentTitle()}</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-dm-text-muted">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  // Obtener todos los top vendedores de todas las sucursales
  const allTopSellers = branchData
    .filter(b => b.vendedores && b.vendedores.length > 0)
    .map(b => ({
      ...b.vendedores[0],
      sucursal_nombre: b.sucursal_nombre,
      sucursal_id: b.sucursal_id,
    }))
    .sort((a, b) => b.total_ventas - a.total_ventas)
    .slice(0, 5);

  const maxSellerSales = Math.max(...allTopSellers.map(s => s.total_ventas), 1);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Tabla de Sucursales */}
      <div className="rounded-xl border border-dm-border-primary bg-dm-bg-primary p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-dm-text-primary">{getComponentTitle()}</h3>
            <p className="text-lg font-bold tabular-nums text-dm-text-primary">
              S/ {data?.resumen_general?.total_ventas.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}
            </p>
          </div>
          {onPeriodChange && (
            <select
              value={period}
              onChange={(e) => onPeriodChange(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
              className="rounded-lg border border-dm-border-primary bg-dm-bg-primary px-3 py-1.5 text-xs font-medium text-dm-text-secondary shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                  <div className="flex items-center gap-3 rounded-lg py-2 px-2 hover:bg-dm-bg-hover transition-colors">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {branch.vendedores && branch.vendedores.length > 0 ? (
                        isExpanded ? (
                          <ChevronDownIcon className="w-4 h-4 text-dm-text-muted flex-shrink-0" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4 text-dm-text-muted flex-shrink-0" />
                        )
                      ) : (
                        <div className="w-4" />
                      )}
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm font-medium text-dm-text-secondary truncate">{branch.sucursal_nombre}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-20 h-1.5 bg-dm-bg-secondary rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-dm-text-primary w-20 text-right">
                        S/ {branch.total_ventas.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-xs tabular-nums text-dm-text-muted w-8 text-right hidden sm:block">
                        {branch.total_facturas}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Vendedores expandidos */}
                {isExpanded && branch.vendedores && branch.vendedores.length > 0 && (
                  <div className="ml-8 pl-3 border-l border-dm-border-primary py-1 space-y-0.5">
                    {branch.vendedores.slice(0, 5).map((seller, sIndex) => (
                      <div
                        key={`${branch.sucursal_id}-${seller.vendedor_id}-${sIndex}`}
                        className="flex items-center justify-between py-1.5 px-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-4 text-center font-medium ${sIndex === 0 ? 'text-amber-500 dark:text-amber-400' : 'text-dm-text-muted'}`}>
                            {sIndex + 1}
                          </span>
                          <span className="text-dm-text-secondary">{seller.vendedor_nombre}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium tabular-nums text-dm-text-secondary">
                            S/ {seller.total_ventas.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                          <span className="tabular-nums text-dm-text-muted w-8 text-right">
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
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-dm-border-secondary">
          <span className="text-xs text-dm-text-muted">Total {branchData.length} sucursales</span>
          <span className="text-xs text-dm-text-muted">{data?.resumen_general?.total_facturas || 0} facturas</span>
        </div>
      </div>

      {/* Top Vendedores Global */}
      <div className="rounded-xl border border-dm-border-primary bg-dm-bg-primary p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-dm-text-primary">Top Vendedores</h3>
          <p className="text-sm text-dm-text-muted">Ranking general</p>
        </div>

        {allTopSellers.length > 0 ? (
          <div className="space-y-4">
            {allTopSellers.map((seller, index) => {
              const percentage = (seller.total_ventas / maxSellerSales) * 100;
              const isTop = index === 0;

              return (
                <div key={`${seller.vendedor_id}-${seller.sucursal_id}`} className="group">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
                      isTop ? 'bg-amber-100 text-amber-700 dark:text-amber-300' : 'bg-dm-bg-secondary text-dm-text-muted'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-dm-text-primary truncate">{seller.vendedor_nombre}</span>
                        <span className="text-sm font-semibold tabular-nums text-dm-text-primary flex-shrink-0 ml-2">
                          S/ {seller.total_ventas.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-dm-bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${isTop ? 'bg-amber-400' : 'bg-indigo-400'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-dm-text-muted flex-shrink-0 w-20 truncate">
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
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-dm-text-muted">Sin datos de vendedores</p>
          </div>
        )}

        {/* Top sucursal destacada */}
        {data?.resumen_general && (
          <div className="mt-4 pt-4 border-t border-dm-border-secondary">
            <div className="flex items-center justify-between rounded-lg bg-indigo-50 dark:bg-indigo-950/30/50 p-3">
              <div>
                <p className="text-xs text-dm-text-muted">Sucursal líder</p>
                <p className="text-sm font-semibold text-dm-text-primary">{data.resumen_general.top_sucursal_nombre}</p>
              </div>
              <p className="text-sm font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                S/ {data.resumen_general.top_sucursal_ventas.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
