// src/features/dashboard/components/SellerRanking.tsx
import React, { useState } from 'react';
import { useSellerRanking } from '../../../hooks/useSellerRanking';
import { ChartBarIcon } from '@heroicons/react/24/outline';

type RankingPeriod = 'today' | 'week' | 'month' | 'year';

const periodLabels: Record<RankingPeriod, string> = {
  today: 'Hoy',
  week: 'Semana',
  month: 'Mes',
  year: 'Año',
};

export const SellerRanking: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<RankingPeriod>('today');
  const { data, isLoading, error } = useSellerRanking({ period: selectedPeriod });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-red-600 py-4">
          Error al cargar el ranking de vendedores
        </div>
      </div>
    );
  }

  if (!data || !data.top_vendedores_por_sucursal.sucursales.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <ChartBarIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Ranking de Vendedores</h3>
        </div>
        <div className="text-center text-gray-500 py-4">
          No hay datos disponibles para el período seleccionado
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header con selector de período */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ChartBarIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Ranking de Vendedores</h3>
        </div>
        
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(Object.keys(periodLabels) as RankingPeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedPeriod === period
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {periodLabels[period]}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de sucursales y vendedores */}
      <div className="space-y-6">
        {data.top_vendedores_por_sucursal.sucursales.map((sucursal) => (
          <div key={sucursal.sucursal_id}>
            {/* Nombre de la sucursal */}
            <h4 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
              {sucursal.sucursal_nombre}
            </h4>

            {/* Lista de vendedores */}
            <div className="space-y-3">
              {sucursal.vendedores.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Sin ventas en este período</p>
              ) : (
                sucursal.vendedores.map((vendedor) => (
                  <div key={vendedor.vendedor_id} className="space-y-1.5">
                    {/* Información del vendedor */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs">
                          {vendedor.posicion_ranking}
                        </span>
                        <span className="font-medium text-gray-800">
                          {vendedor.vendedor_nombre}
                        </span>
                      </div>
                      <div className="text-gray-600 text-xs">
                        {vendedor.total_facturas} facturas · {vendedor.total_pasajeros} pasajeros
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${vendedor.porcentaje_relativo}%` }}
                      />
                    </div>
                    
                    {/* Porcentaje */}
                    <div className="text-right">
                      <span className="text-xs font-medium text-blue-600">
                        {vendedor.porcentaje_relativo.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
