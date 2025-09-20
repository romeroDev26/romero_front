// src/features/dashboard/pages/ReportsPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { reportsService, DailySalesReport } from '../../../services/reports.service';
import { SalesSummary } from '../components/SalesSummary';
import { DailySalesTable } from '../components/DailySalesTable';
import { PaymentMethodsChart } from '../components/PaymentMethodsChart';
import { TopSellersChart } from '../components/TopSellersChart';
import { PopularRoutesChart } from '../components/PopularRoutesChart';
import { SunatStatusChart } from '../components/SunatStatusChart';

export const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  const { data: report, isLoading, error, refetch } = useQuery<DailySalesReport>({
    queryKey: ['daily-sales', dateRange],
    queryFn: () => reportsService.getDailySales(dateRange),
    enabled: true,
  });

  const handleDateChange = (field: 'start_date' | 'end_date', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleQuickFilter = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    setDateRange({
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    });
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error al cargar los reportes
              </h3>
              <div className="mt-2 text-sm text-red-700">
                No se pudieron cargar los datos de ventas. Por favor, intenta nuevamente.
              </div>
              <div className="mt-4">
                <button
                  onClick={() => refetch()}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Reportes de Ventas</h1>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => handleDateChange('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => handleDateChange('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2 flex items-end space-x-2">
            <button
              onClick={() => handleQuickFilter(7)}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium"
            >
              Últimos 7 días
            </button>
            <button
              onClick={() => handleQuickFilter(30)}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium"
            >
              Últimos 30 días
            </button>
            <button
              onClick={() => handleQuickFilter(90)}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium"
            >
              Últimos 90 días
            </button>
          </div>
        </div>
      </div>

      {/* Resumen */}
      {report && <SalesSummary summary={report.summary} isLoading={isLoading} />}

      {/* Gráficos de análisis */}
      {report && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <PaymentMethodsChart 
            paymentMethodsSummary={report.summary.payment_methods_summary} 
            isLoading={isLoading} 
          />
          <TopSellersChart 
            sellersSummary={report.summary.sellers_summary} 
            isLoading={isLoading} 
          />
        </div>
      )}

      {/* Rutas populares y estado SUNAT */}
      {report && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <PopularRoutesChart 
            items={report.items} 
            isLoading={isLoading} 
          />
          <SunatStatusChart 
            items={report.items} 
            isLoading={isLoading} 
          />
        </div>
      )}

      {/* Tabla de ventas */}
      {report && <DailySalesTable items={report.items} isLoading={isLoading} />}
    </div>
  );
};