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

const getBadgeColors = (position: number) => {
  if (position === 1) return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
  if (position === 2) return 'bg-slate-100 text-slate-700 border border-slate-300';
  if (position === 3) return 'bg-orange-100 text-orange-700 border border-orange-300';
  return 'bg-blue-100 text-blue-700';
};

const getProgressBarColors = (position: number) => {
  if (position === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
  if (position === 2) return 'bg-gradient-to-r from-slate-400 to-slate-500';
  if (position === 3) return 'bg-gradient-to-r from-orange-400 to-orange-500';
  return 'bg-gradient-to-r from-blue-500 to-blue-600';
};

const getPercentageColor = (position: number) => {
  if (position === 1) return 'text-yellow-600';
  if (position === 2) return 'text-slate-600';
  if (position === 3) return 'text-orange-600';
  return 'text-blue-600';
};

export const SellerRanking: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<RankingPeriod>('today');
  const { data, isLoading, error } = useSellerRanking({ period: selectedPeriod });

  const header = (
    <div className="p-5 border-b border-gray-200 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-gray-500" />
          <h3 className="text-base font-bold text-gray-800 leading-snug">
            Ranking de<br />Vendedores
          </h3>
        </div>
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          {(Object.keys(periodLabels) as RankingPeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 text-xs font-medium transition-colors border-r border-gray-200 last:border-r-0 ${
                selectedPeriod === period
                  ? 'bg-white text-blue-600'
                  : 'bg-gray-50 text-gray-500 hover:bg-white hover:text-gray-800'
              }`}
            >
              {periodLabels[period]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
        {header}
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
        {header}
        <div className="flex-grow flex items-center justify-center p-6 text-sm text-red-500 text-center">
          Error al cargar el ranking de vendedores
        </div>
      </div>
    );
  }

  if (!data || !data.top_vendedores_por_sucursal.sucursales.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
        {header}
        <div className="flex-grow flex items-center justify-center p-6 text-sm text-gray-500 text-center">
          No hay datos disponibles para el período seleccionado
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
      {header}

      {/* Lista scrollable */}
      <div className="flex-grow overflow-y-auto ranking-scroll p-5 space-y-6">
        {data.top_vendedores_por_sucursal.sucursales.map((sucursal) => (
          <div key={sucursal.sucursal_id}>
            <h4 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">
              {sucursal.sucursal_nombre}
            </h4>

            <div className="space-y-3">
              {sucursal.vendedores.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Sin ventas en este período</p>
              ) : (
                sucursal.vendedores.map((vendedor) => (
                  <div key={vendedor.vendedor_id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex items-center justify-center w-6 h-6 rounded-full font-semibold text-xs ${getBadgeColors(vendedor.posicion_ranking)}`}
                        >
                          {vendedor.posicion_ranking}
                        </span>
                        <span className="font-medium text-gray-800">{vendedor.vendedor_nombre}</span>
                      </div>
                      <span className="text-gray-500 text-xs">
                        {vendedor.total_facturas} facturas · {vendedor.total_pasajeros} pasajeros
                      </span>
                    </div>

                    <div className="relative w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${getProgressBarColors(vendedor.posicion_ranking)}`}
                        style={{ width: `${vendedor.porcentaje_relativo}%` }}
                      />
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-medium ${getPercentageColor(vendedor.posicion_ranking)}`}>
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
