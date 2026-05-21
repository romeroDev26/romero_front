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
import { Modal } from '../../../components/common/Modal';
import { useExportReport } from '../../../hooks/useExportReport';
import { DateRangeFilter, DateFilterOption } from '../components/DateRangeFilter';
import { TripsCalendarReport } from '../components/TripsCalendarReport';

export const ReportsPage: React.FC = () => {
  // Inicializar con la fecha de hoy
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [startDate, setStartDate] = useState<Date>(today);
  const [endDate, setEndDate] = useState<Date>(today);
  const [filterOption, setFilterOption] = useState<DateFilterOption>('today');
  const [showTripsReport, setShowTripsReport] = useState<boolean>(false);

  // Convertir a formato string para la API
  const dateRange = {
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
  };

  const [syncExporting, setSyncExporting] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [showAccountantFormatModal, setShowAccountantFormatModal] = useState(false);

  // Hook para exportaciones
  const {
    requestExport,
  } = useExportReport({
    onSuccess: () => {
      // Opcional: mostrar notificación de éxito
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

  const handleDateChange = (newStartDate: Date | null, newEndDate: Date | null) => {
    if (newStartDate) setStartDate(newStartDate);
    if (newEndDate) setEndDate(newEndDate);
  };

  const handleExportExcel = async () => {
    setShowFormatModal(true);
  };

  const handleFormatSelection = async (format: 'excel' | 'pdf') => {
    setShowFormatModal(false);
    setSyncExporting(true);
    
    try {
      await requestExport({
        category: 'branch_global',
        format: format,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        filters: {
          include_vessel_data: false
        },
        metadata: {
          report_title: `Reporte Global por Sucursal.${format === 'excel' ? 'xlsx' : 'pdf'}`
        },
        sync: true
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setSyncExporting(false);
    }
  };

  const handleExportAccountant = async () => {
    // Abrir modal para elegir formato (igual que Detallado)
    setShowAccountantFormatModal(true);
  };

  const handleAccountantFormatSelection = async (format: 'excel' | 'pdf') => {
    setShowAccountantFormatModal(false);
    setSyncExporting(true);

    try {
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];

      const month = monthNames[startDate.getMonth()];
      const year = startDate.getFullYear();

      await requestExport({
        category: 'accountant_series',
        format: format,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        metadata: {
          report_title: `Reporte Contable - ${month} ${year}.${format === 'excel' ? 'xlsx' : 'pdf'}`
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
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                Error al cargar los reportes
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                No se pudieron cargar los datos de ventas. Por favor, intenta nuevamente.
              </div>
              <div className="mt-4">
                <button
                  onClick={() => refetch()}
                  className="bg-red-100 dark:bg-red-900/40 hover:bg-red-200 text-red-800 dark:text-red-300 px-3 py-2 rounded-md text-sm font-medium"
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
    <div className="min-h-screen bg-dm-bg-secondary">
      {/* Header minimalista estilo Tremor */}
      <div className="bg-dm-bg-primary border-b border-dm-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center text-sm text-dm-text-muted hover:text-dm-text-secondary transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
                  Dashboard
                </Link>
                <div className="h-4 w-px bg-dm-border-primary"></div>
                <h1 className="text-2xl font-semibold text-dm-text-primary">Reportes</h1>
              </div>
            </div>
            
            {/* Filtros y acciones en una fila limpia */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onDateChange={handleDateChange}
                selectedOption={filterOption}
                onOptionChange={setFilterOption}
              />
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportAccountant}
                  disabled={syncExporting || isLoading}
                  className="inline-flex items-center px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-dm-text-muted disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  <DocumentArrowDownIcon className="w-4 h-4 mr-1.5" />
                  {syncExporting ? 'Exportando...' : 'Contable'}
                </button>
                <button
                  onClick={handleExportExcel}
                  disabled={syncExporting || isLoading}
                  className="inline-flex items-center px-3 py-2 border border-dm-border-primary bg-dm-bg-primary text-dm-text-secondary rounded-md hover:bg-dm-bg-hover disabled:bg-dm-bg-secondary disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  <DocumentArrowDownIcon className="w-4 h-4 mr-1.5" />
                  {syncExporting ? 'Exportando...' : 'Detallado'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Skeleton de carga */}
        {isLoading && (
          <div className="space-y-6 animate-pulse">
            {/* Skeleton: tarjetas de resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-dm-bg-primary rounded-xl border border-dm-border-primary p-5 space-y-3">
                  <div className="h-3 bg-dm-bg-secondary rounded w-2/3"></div>
                  <div className="h-7 bg-dm-bg-secondary rounded w-1/2"></div>
                  <div className="h-2 bg-dm-bg-secondary rounded w-full"></div>
                </div>
              ))}
            </div>
            {/* Skeleton: gráficos principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-dm-bg-primary rounded-xl border border-dm-border-primary p-6 space-y-4">
                  <div className="h-4 bg-dm-bg-secondary rounded w-1/3"></div>
                  <div className="h-48 bg-dm-bg-secondary rounded-lg"></div>
                </div>
              ))}
            </div>
            {/* Skeleton: gráfico ancho */}
            <div className="bg-dm-bg-primary rounded-xl border border-dm-border-primary p-6 space-y-4">
              <div className="h-4 bg-dm-bg-secondary rounded w-1/4"></div>
              <div className="h-40 bg-dm-bg-secondary rounded-lg"></div>
            </div>
          </div>
        )}

        {/* Resumen de ventas - Prioridad Alta */}
        {report && report.resumenEjecutivo && report.categorias && (
          <SalesSummary summary={report.resumenEjecutivo} metrics={report.categorias} isLoading={isLoading} />
        )}

        {/* Sección: Métodos de Pago (Alta Prioridad) y Estado SUNAT (Muy Importante) */}
        {report && report.categorias && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PaymentMethodsChart 
              paymentMethods={report.categorias.metodosPago}
              isLoading={isLoading} 
            />
            <SunatStatusChart 
              sunatStatus={report.categorias.estadoSunat} 
              isLoading={isLoading} 
            />
          </div>
        )}

        {/* Destinos Populares - Muy Importante */}
        {report && report.categorias && report.categorias.rutas && (
          <PopularRoutesChart 
            routes={report.categorias.rutas} 
            isLoading={isLoading} 
          />
        )}

        {/* Top Vendedores - Segundo Plano */}
        {report && report.categorias && report.categorias.vendedores && (
          <div className="mt-8">
            <TopSellersChart 
              sellers={report.categorias.vendedores}
              isLoading={isLoading} 
            />
          </div>
        )}

        {/* Botón para cargar Reporte de Ventas por Viaje */}
        <div className="mt-8 pt-8 border-t border-dm-border-primary">
          {!showTripsReport ? (
            <div className="text-center">
              <button
                onClick={() => setShowTripsReport(true)}
                className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Ver Reporte de Ventas por Viaje
              </button>
              <p className="text-xs text-dm-text-muted mt-2">
                Carga el reporte detallado de ventas por viaje con calendario interactivo
              </p>
            </div>
          ) : (
            <TripsCalendarReport />
          )}
        </div>
      </div>

      {/* Modal de selección de formato */}
      <Modal
        isOpen={showFormatModal}
        onClose={() => setShowFormatModal(false)}
        title="Seleccionar formato de reporte"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-dm-text-secondary mb-6">
            Elige el formato en el que deseas descargar el reporte global por sucursal.
          </p>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleFormatSelection('excel')}
              disabled={syncExporting}
              className="flex items-center justify-center px-6 py-4 bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 hover:border-green-300 dark:hover:border-green-700 disabled:bg-dm-bg-secondary disabled:border-dm-border-primary disabled:text-dm-text-muted disabled:cursor-not-allowed transition-all duration-200 group"
            >
              <DocumentArrowDownIcon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="font-semibold">Excel (.xlsx)</div>
                <div className="text-sm opacity-75">Compatible con Microsoft Excel</div>
              </div>
            </button>

            <button
              onClick={() => handleFormatSelection('pdf')}
              disabled={syncExporting}
              className="flex items-center justify-center px-6 py-4 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 hover:border-red-300 dark:hover:border-red-700 disabled:bg-dm-bg-secondary disabled:border-dm-border-primary disabled:text-dm-text-muted disabled:cursor-not-allowed transition-all duration-200 group"
            >
              <DocumentArrowDownIcon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="font-semibold">PDF (.pdf)</div>
                <div className="text-sm opacity-75">Formato de documento portable</div>
              </div>
            </button>
          </div>

          <div className="flex justify-end pt-4 border-t border-dm-border-primary">
            <button
              onClick={() => setShowFormatModal(false)}
              className="px-4 py-2 text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-bg-hover rounded-md transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de selección de formato para Contable */}
      <Modal
        isOpen={showAccountantFormatModal}
        onClose={() => setShowAccountantFormatModal(false)}
        title="Seleccionar formato - Reporte Contable"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-dm-text-secondary mb-6">
            Elige el formato en el que deseas descargar el reporte contable.
          </p>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleAccountantFormatSelection('excel')}
              disabled={syncExporting}
              className="flex items-center justify-center px-6 py-4 bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 hover:border-green-300 dark:hover:border-green-700 disabled:bg-dm-bg-secondary disabled:border-dm-border-primary disabled:text-dm-text-muted disabled:cursor-not-allowed transition-all duration-200 group"
            >
              <DocumentArrowDownIcon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="font-semibold">Excel (.xlsx)</div>
                <div className="text-sm opacity-75">Archivo Excel con series contables</div>
              </div>
            </button>

            <button
              onClick={() => handleAccountantFormatSelection('pdf')}
              disabled={syncExporting}
              className="flex items-center justify-center px-6 py-4 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 hover:border-red-300 dark:hover:border-red-700 disabled:bg-dm-bg-secondary disabled:border-dm-border-primary disabled:text-dm-text-muted disabled:cursor-not-allowed transition-all duration-200 group"
            >
              <DocumentArrowDownIcon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="font-semibold">PDF (.pdf)</div>
                <div className="text-sm opacity-75">Documento PDF del reporte contable</div>
              </div>
            </button>
          </div>

          <div className="flex justify-end pt-4 border-t border-dm-border-primary">
            <button
              onClick={() => setShowAccountantFormatModal(false)}
              className="px-4 py-2 text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-bg-hover rounded-md transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Mensaje de error si la estructura no es la esperada */}
      {report && !report.categorias && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Estructura de datos no compatible
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  El backend aún no está retornando la estructura optimizada. 
                  Por favor, verifica que el backend esté actualizado con los endpoints optimizados.
                </div>
                <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                  Se esperaba: report.categorias.metodosPago, report.resumenEjecutivo, etc.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};