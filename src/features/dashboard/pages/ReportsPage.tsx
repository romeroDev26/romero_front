// src/features/dashboard/pages/ReportsPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { reportsService } from '../../../services/reports.service';
import { DailySalesReportResponse } from '../../../types/reports';
import { SalesSummary } from '../components/SalesSummary';
import { PaymentMethodsChart } from '../components/PaymentMethodsChart';
import { TopSellersChart } from '../components/TopSellersChart';
import { PopularRoutesChart } from '../components/PopularRoutesChart';
import { SunatStatusChart } from '../components/SunatStatusChart';
import { useExportReport } from '../../../hooks/useExportReport';

export const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  const [syncExporting, setSyncExporting] = useState(false);

  // Hook para exportaciones
  const {
    requestExport,
    requestCashGeneral,
  } = useExportReport({
    onSuccess: () => {
      // Opcional: mostrar notificación de éxito
      console.log('Export completed successfully!');
    },
    onError: (error) => {
      console.error('Export failed:', error);
    },
  });

  const { data: report, isLoading, error, refetch } = useQuery<DailySalesReportResponse>({
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

  const handleExportExcel = async () => {
    setSyncExporting(true);
    try {
      await requestExport({
        category: 'branch_global',
        format: 'excel',
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        filters: {
          branch_id: 3, // TODO: Obtener del contexto de usuario
          include_vessel_data: false
        },
        metadata: {
          report_title: `Reporte Global por Sucursal ${dateRange.start_date} - ${dateRange.end_date}.xlsx`
        },
        sync: true
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setSyncExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setSyncExporting(true);
    try {
      await requestCashGeneral({
        format: 'pdf',
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        filters: {
          branch_id: 3, // TODO: Obtener del contexto de usuario
          include_payment_breakdown: true
        },
        metadata: {
          report_title: `Caja General ${dateRange.start_date} - ${dateRange.end_date}.pdf`
        },
        sync: true
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setSyncExporting(false);
    }
  };

  const handleExportCashDetailed = async () => {
    setSyncExporting(true);
    try {
      await requestExport({
        category: 'seller_detailed',
        format: 'excel',
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        filters: {
          user_id: 'c1b8b7da-3ec2-4b48-90d0-9f4c9d74da54', // TODO: Obtener del contexto de usuario
          branch_id: 3,
          include_cancelled: false
        },
        metadata: {
          report_title: `Caja Detallada - ${dateRange.start_date}.xlsx`
        },
        sync: true
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setSyncExporting(false);
    }
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

        {/* Botones de Exportación */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Exportar reportes completos con descarga directa
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportExcel}
              disabled={syncExporting || isLoading}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              {syncExporting ? 'Exportando...' : 'Excel Global'}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={syncExporting || isLoading}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              {syncExporting ? 'Exportando...' : 'PDF Caja General'}
            </button>
            <button
              onClick={handleExportCashDetailed}
              disabled={syncExporting || isLoading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              {syncExporting ? 'Exportando...' : 'Excel Caja Detallada'}
            </button>
          </div>
        </div>
      </div>

      {/* Mensaje de error si la estructura no es la esperada */}
      {report && !report.categorias && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Estructura de datos no compatible
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                El backend aún no está retornando la estructura optimizada. 
                Por favor, verifica que el backend esté actualizado con los endpoints optimizados.
              </div>
              <div className="mt-2 text-xs text-yellow-600">
                Se esperaba: report.categorias.metodosPago, report.resumenEjecutivo, etc.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumen */}
      {report && report.resumenEjecutivo && report.categorias && (
        <SalesSummary summary={report.resumenEjecutivo} metrics={report.categorias} isLoading={isLoading} />
      )}

      {/* Gráficos de análisis */}
      {report && report.categorias && report.categorias.metodosPago && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <PaymentMethodsChart 
            paymentMethods={report.categorias.metodosPago}
            isLoading={isLoading} 
          />
          <TopSellersChart 
            sellers={report.categorias.vendedores}
            isLoading={isLoading} 
          />
        </div>
      )}

      {/* Rutas populares y estado SUNAT */}
      {report && report.categorias && report.categorias.rutas && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <PopularRoutesChart 
            routes={report.categorias.rutas} 
            isLoading={isLoading} 
          />
          <SunatStatusChart 
            sunatStatus={report.categorias.estadoSunat} 
            isLoading={isLoading} 
          />
        </div>
      )}
    </div>
  );
};