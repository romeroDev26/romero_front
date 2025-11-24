import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import { useBranchOfficesData } from '../../fluvial/hooks/useBranchOfficesData';
import { useAllUserStatistics } from '../../../hooks/useUserStatistics';
import { toast } from 'react-toastify';
import UserSalesChart from './UserSalesChart';

export const SalesPointSelector: React.FC<{ className?: string }> = ({ className }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  // Hook para obtener sucursales
  const { data: branches, isLoading: branchesLoading } = useBranchOfficesData();

  // Hook para obtener estadísticas del usuario
  const { 
    today, 
    currentMonth, 
    isLoading: statisticsLoading, 
    hasError: statisticsError
  } = useAllUserStatistics();

  const handleRefreshStatistics = async () => {
    // Invalidar todas las queries de estadísticas para forzar refetch
    await queryClient.invalidateQueries({ queryKey: ['userStatistics'] });
    toast.success('Estadísticas actualizadas');
  };

  // Cargar sucursal seleccionada desde localStorage
  useEffect(() => {
    const savedBranch = localStorage.getItem('selectedSalesBranch');
    if (savedBranch) {
      try {
        const branch = JSON.parse(savedBranch);
        setSelectedBranch(branch.id?.toString() || '');
      } catch (error) {
        console.warn('Error parsing saved branch:', error);
      }
    }
  }, []);

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId);
    
    if (branchId && branches) {
      const branch = branches.find(b => b.id.toString() === branchId);
      if (branch) {
        localStorage.setItem('selectedSalesBranch', JSON.stringify(branch));
        toast.success(`Sucursal ${branch.name} seleccionada`);
      }
    }
  };

  const handleQuickAction = (action: string) => {
    if (!selectedBranch) {
      toast.warning('Por favor selecciona una sucursal primero');
      return;
    }

    switch (action) {
      case 'sales-point':
        navigate('/fluvial/operations/sales-point');
        break;
      case 'cargo':
        navigate('/fluvial/operations/cargo-sale');
        break;
      case 'reservations':
        navigate('/fluvial/operations/reservations');
        break;
      default:
        toast.info('Funcionalidad en desarrollo');
    }
  };

  // Usar total_revenue_net si existe, sino usar total_revenue (compatibilidad)
  const todaySales = today.data?.total_sales || 0;
  const todayRevenue = today.data?.total_revenue_net ?? today.data?.total_revenue ?? 0;
  const todayHasAdjustments = (today.data?.total_credit_notes || 0) !== 0 || (today.data?.total_debit_notes || 0) !== 0;
  const monthSales = currentMonth.data?.total_sales || 0;

  return (
    <div className={`rounded-lg shadow-md border border-gray-200 p-6 ${className || 'bg-white'}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Punto de Venta
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Selecciona tu sucursal para comenzar a trabajar y ver tus estadísticas de ventas
        </p>
      </div>

      {/* Branch Office Selector */}
      <div className="max-w-md mx-auto mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Sucursal
        </label>
        {branchesLoading ? (
          <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
            <div className="animate-pulse h-5 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <select 
            value={selectedBranch} 
            onChange={(e) => handleBranchChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Seleccione una sucursal...</option>
            {branches?.map((branch) => (
              <option key={branch.id} value={branch.id.toString()}>
                {branch.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Quick Access Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button 
          onClick={() => handleQuickAction('sales-point')}
          className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:bg-gray-400"
          disabled={!selectedBranch}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Punto de Ventas
        </button>
        <button 
          onClick={() => handleQuickAction('cargo')}
          className="flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md disabled:bg-gray-400"
          disabled={!selectedBranch}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Encomiendas
        </button>
        <button 
          onClick={() => handleQuickAction('reservations')}
          className="flex items-center justify-center px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md disabled:bg-gray-400"
          disabled={!selectedBranch}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Reservas
        </button>
      </div>

      {/* Sales Statistics */}
      <div className="border-t pt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Mis Estadísticas de Ventas
          </h3>
          <button
            onClick={handleRefreshStatistics}
            disabled={statisticsLoading}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowPathIcon className={`w-4 h-4 ${statisticsLoading ? 'animate-spin' : ''}`} />
            {statisticsLoading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {statisticsLoading ? (
                <div className="animate-pulse h-8 bg-blue-200 rounded"></div>
              ) : (
                todaySales
              )}
            </div>
            <div className="text-sm text-gray-600">Ventas Hoy</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {statisticsLoading ? (
                <div className="animate-pulse h-8 bg-green-200 rounded"></div>
              ) : (
                `S/ ${todayRevenue.toLocaleString('es-PE')}`
              )}
            </div>
            <div className="text-sm text-gray-600">
              Ingresos Hoy {todayHasAdjustments && '(Neto)'}
            </div>
            {todayHasAdjustments && today.data && (
              <div className="text-xs text-gray-500 mt-1">
                {today.data.total_credit_notes !== 0 && (
                  <span className="text-red-600">
                    NC: S/ {Math.abs(today.data.total_credit_notes || 0).toFixed(2)}
                  </span>
                )}
                {today.data.total_credit_notes !== 0 && today.data.total_debit_notes !== 0 && ' | '}
                {today.data.total_debit_notes !== 0 && (
                  <span className="text-green-600">
                    ND: +S/ {(today.data.total_debit_notes || 0).toFixed(2)}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {statisticsLoading ? (
                <div className="animate-pulse h-8 bg-purple-200 rounded"></div>
              ) : (
                monthSales
              )}
            </div>
            <div className="text-sm text-gray-600">Ventas Este Mes</div>
          </div>
        </div>

        {/* Error message */}
        {statisticsError && !statisticsLoading && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-yellow-800 text-sm text-center">
              No se pudieron cargar todas las estadísticas. Las métricas mostradas pueden estar incompletas.
            </div>
          </div>
        )}

        {/* Sales Performance Chart */}
        <div className="mt-6">
          <UserSalesChart />
        </div>
      </div>
    </div>
  );
};