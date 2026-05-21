// src/features/dashboard/components/TripSalesDetailReport.tsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import { es } from 'date-fns/locale';
import { 
  ArrowLeftIcon,
  TruckIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { reportsService } from '../../../services/reports.service';
import { TripSalesReportResponse, ComparativeTrip } from '../../../types/tripSalesReport';
import { AnimatedCounter } from '../../../components/common/AnimatedCounter';

type ComparativeRange = 'last_month' | 'last_3_months' | 'last_6_months' | 'custom';

// Colores para los métodos de pago
const PAYMENT_COLORS: Record<string, string> = {
  'YAPE': '#6D28D9',
  'PLIN': '#10B981',
  'EFECTIVO': '#F59E0B',
  'TRANSFERENCIA': '#3B82F6',
  'TARJETA': '#EF4444',
  'SIN_ESPECIFICAR': '#6B7280',
};

const getPaymentColor = (method: string): string => {
  return PAYMENT_COLORS[method] || PAYMENT_COLORS['SIN_ESPECIFICAR'];
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface TripSalesDetailReportProps {
  tripId: number;
  onBack: () => void;
}

// Calcular fechas por defecto (último mes)
const getDefaultDates = () => {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 1);
  return { start, end };
};

export const TripSalesDetailReport: React.FC<TripSalesDetailReportProps> = ({ tripId, onBack }) => {
  const defaultDates = useMemo(() => getDefaultDates(), []);
  
  const [selectedRange, setSelectedRange] = useState<ComparativeRange>('last_month');
  const [customStartDate, setCustomStartDate] = useState<Date>(defaultDates.start);
  const [customEndDate, setCustomEndDate] = useState<Date>(defaultDates.end);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Calcular fechas según el rango seleccionado
  const compareDates = useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    switch (selectedRange) {
      case 'last_month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'last_3_months':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'last_6_months':
        start.setMonth(start.getMonth() - 6);
        break;
      case 'custom':
        return {
          start: customStartDate.toISOString().split('T')[0],
          end: customEndDate.toISOString().split('T')[0],
        };
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }, [selectedRange, customStartDate, customEndDate]);

  const { data: report, isLoading, error, refetch } = useQuery<TripSalesReportResponse>({
    queryKey: ['trip-sales', tripId, compareDates.start, compareDates.end],
    queryFn: () => reportsService.getTripSales({ 
      trip_id: tripId,
      compare_start_date: compareDates.start,
      compare_end_date: compareDates.end,
    }),
    enabled: !!tripId,
  });

  const handleRangeChange = (range: ComparativeRange) => {
    setSelectedRange(range);
    if (range === 'custom') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
    }
  };

  const handleCustomDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    if (start) setCustomStartDate(start);
    if (end) setCustomEndDate(end);
    if (start && end) {
      setShowCustomPicker(false);
    }
  };

  // Calcular promedios de viajes comparativos
  const getComparativeStats = (trips: ComparativeTrip[]) => {
    if (!trips || trips.length === 0) return null;
    
    const avgOccupancy = trips.reduce((sum, t) => sum + t.occupancy_percentage, 0) / trips.length;
    const avgRevenue = trips.reduce((sum, t) => sum + t.total_revenue, 0) / trips.length;
    const avgTicket = trips.reduce((sum, t) => sum + t.average_ticket, 0) / trips.length;
    
    return { avgOccupancy, avgRevenue, avgTicket };
  };

  return (
    <div className="bg-dm-bg-primary rounded-xl shadow-lg border border-dm-border-primary overflow-hidden">
      {/* Header con botón de volver y filtros de fecha */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Título y botón volver */}
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-dm-bg-primary/20 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-white" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TruckIcon className="w-6 h-6" />
                Detalle del Viaje
              </h2>
              <p className="text-indigo-100 text-sm mt-1">
                Viaje ID: {tripId}
              </p>
            </div>
          </div>

          {/* Filtro de rango de fechas para comparativas */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-indigo-100 text-sm mr-2 hidden sm:inline">Comparar con:</span>
            <button
              onClick={() => handleRangeChange('last_month')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                selectedRange === 'last_month'
                  ? 'bg-dm-bg-primary text-indigo-600 dark:text-indigo-400 font-medium'
                  : 'bg-dm-bg-primary/20 text-white hover:bg-dm-bg-primary/30'
              }`}
            >
              Último mes
            </button>
            <button
              onClick={() => handleRangeChange('last_3_months')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                selectedRange === 'last_3_months'
                  ? 'bg-dm-bg-primary text-indigo-600 dark:text-indigo-400 font-medium'
                  : 'bg-dm-bg-primary/20 text-white hover:bg-dm-bg-primary/30'
              }`}
            >
              3 meses
            </button>
            <button
              onClick={() => handleRangeChange('last_6_months')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                selectedRange === 'last_6_months'
                  ? 'bg-dm-bg-primary text-indigo-600 dark:text-indigo-400 font-medium'
                  : 'bg-dm-bg-primary/20 text-white hover:bg-dm-bg-primary/30'
              }`}
            >
              6 meses
            </button>
            <div className="relative">
              <button
                onClick={() => handleRangeChange('custom')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                  selectedRange === 'custom'
                    ? 'bg-dm-bg-primary text-indigo-600 dark:text-indigo-400 font-medium'
                    : 'bg-dm-bg-primary/20 text-white hover:bg-dm-bg-primary/30'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                {selectedRange === 'custom' 
                  ? `${customStartDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} - ${customEndDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}`
                  : 'Personalizado'
                }
              </button>
              {showCustomPicker && (
                <>
                  {/* Overlay para cerrar al hacer clic fuera */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowCustomPicker(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-50 bg-dm-bg-primary rounded-xl shadow-2xl border border-dm-border-primary p-4">
                    <div className="custom-datepicker-wrapper">
                      <DatePicker
                        selected={customStartDate}
                        onChange={handleCustomDateChange}
                        startDate={customStartDate}
                        endDate={customEndDate}
                        selectsRange
                        inline
                        monthsShown={2}
                        maxDate={new Date()}
                        locale={es}
                        calendarClassName="custom-datepicker"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 mr-3" />
              <div>
                <h4 className="text-red-800 dark:text-red-300 font-medium">Error al cargar el reporte</h4>
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                  No se pudo obtener la información del viaje.
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-3 text-red-700 dark:text-red-300 hover:text-red-800 text-sm font-medium"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Resultados */}
        {report && !isLoading && (
          <div className="space-y-6">
            {/* Info del viaje */}
            <div className="bg-dm-bg-secondary rounded-lg p-5 border border-dm-border-primary">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-dm-text-primary">{report.trip.trip_name}</h3>
                  <p className="text-dm-text-secondary mt-1">
                    {report.trip.route.route_name}
                  </p>
                  <p className="text-dm-text-muted text-sm mt-1">
                    {formatDateTime(report.trip.departure_datetime)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    report.trip.status === 'PROGRAMADO' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' :
                    report.trip.status === 'EN_CURSO' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300' :
                    report.trip.status === 'COMPLETADO' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' :
                    'bg-dm-bg-secondary text-dm-text-primary'
                  }`}>
                    {report.trip.status}
                  </span>
                  {report.trip.vessel.changed && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300">
                      Embarcación cambiada
                    </span>
                  )}
                </div>
              </div>

              {/* Embarcación */}
              <div className="mt-4 pt-4 border-t border-dm-border-primary">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-dm-text-muted">Embarcación programada:</span>
                    <span className="ml-2 font-medium text-dm-text-primary">
                      {report.trip.vessel.scheduled.vessel_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-dm-text-muted">Embarcación actual:</span>
                    <span className={`ml-2 font-medium ${report.trip.vessel.changed ? 'text-orange-600 dark:text-orange-400' : 'text-dm-text-primary'}`}>
                      {report.trip.vessel.actual.vessel_name}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* KPIs principales */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Ocupación */}
              <div className="bg-dm-bg-primary rounded-lg p-4 border border-dm-border-primary shadow-sm">
                <div className="flex items-center justify-between">
                  <UserGroupIcon className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    report.sales.occupancy_percentage >= 80 ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' :
                    report.sales.occupancy_percentage >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300' :
                    'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                  }`}>
                    {report.sales.occupancy_percentage >= 80 ? 'Alta' : 
                     report.sales.occupancy_percentage >= 50 ? 'Media' : 'Baja'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-dm-text-primary mt-3">
                  <AnimatedCounter
                    value={report.sales.occupancy_percentage}
                    suffix="%"
                    minimumFractionDigits={1}
                    maximumFractionDigits={1}
                    durationMs={1100}
                  />
                </p>
                <p className="text-sm text-dm-text-muted">Ocupación</p>
                <p className="text-xs text-dm-text-muted mt-1">
                  {report.sales.sold_seats} / {report.trip.capacity.total_seats} asientos
                </p>
              </div>

              {/* Ingresos */}
              <div className="bg-dm-bg-primary rounded-lg p-4 border border-dm-border-primary shadow-sm">
                <div className="flex items-center justify-between">
                  <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-dm-text-primary mt-3">
                  <AnimatedCounter
                    value={report.sales.total_revenue}
                    prefix="S/ "
                    minimumFractionDigits={2}
                    maximumFractionDigits={2}
                    durationMs={1200}
                  />
                </p>
                <p className="text-sm text-dm-text-muted">Ingresos Totales</p>
              </div>

              {/* Asientos vendidos */}
              <div className="bg-dm-bg-primary rounded-lg p-4 border border-dm-border-primary shadow-sm">
                <div className="flex items-center justify-between">
                  <ChartBarIcon className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-dm-text-primary mt-3">
                  <AnimatedCounter
                    value={report.sales.sold_seats}
                    minimumFractionDigits={0}
                    maximumFractionDigits={0}
                    durationMs={950}
                  />
                </p>
                <p className="text-sm text-dm-text-muted">Asientos Vendidos</p>
                <p className="text-xs text-dm-text-muted mt-1">
                  {report.trip.capacity.confirmed_seats} confirmados
                </p>
              </div>

              {/* Ticket promedio */}
              <div className="bg-dm-bg-primary rounded-lg p-4 border border-dm-border-primary shadow-sm">
                <div className="flex items-center justify-between">
                  <CurrencyDollarIcon className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-dm-text-primary mt-3">
                  <AnimatedCounter
                    value={report.sales.average_ticket}
                    prefix="S/ "
                    minimumFractionDigits={2}
                    maximumFractionDigits={2}
                    durationMs={1100}
                  />
                </p>
                <p className="text-sm text-dm-text-muted">Ticket Promedio</p>
              </div>
            </div>

            {/* Métodos de pago */}
            {report.sales.payment_breakdown && report.sales.payment_breakdown.length > 0 && (
              <div className="bg-dm-bg-primary rounded-lg p-5 border border-dm-border-primary shadow-sm">
                <h4 className="text-lg font-semibold text-dm-text-primary mb-4">
                  Desglose por Método de Pago
                </h4>
                <div className="space-y-3">
                  {report.sales.payment_breakdown.map((payment) => {
                    const percentage = (payment.amount / report.sales.total_revenue) * 100;
                    return (
                      <div key={payment.payment_method} className="flex items-center">
                        <div className="w-28 text-sm font-medium text-dm-text-secondary">
                          {payment.payment_method}
                        </div>
                        <div className="flex-1 mx-4">
                          <div className="h-4 bg-dm-bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: getPaymentColor(payment.payment_method),
                              }}
                            />
                          </div>
                        </div>
                        <div className="w-24 text-right text-sm font-semibold text-dm-text-primary">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="w-16 text-right text-sm text-dm-text-muted">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Desglose por Servicio */}
            {report.sales.service_breakdown && Object.keys(report.sales.service_breakdown).length > 0 && (
              <div className="bg-dm-bg-primary rounded-lg p-5 border border-dm-border-primary shadow-sm">
                <h4 className="text-lg font-semibold text-dm-text-primary mb-4">
                  Desglose por Tipo de Servicio
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(report.sales.service_breakdown)
                    .filter(([key]) => key !== 'categories' && typeof report.sales.service_breakdown[key] === 'object')
                    .map(([serviceType, data]) => {
                      if (!data || typeof data !== 'object') return null;
                      const percentage = (data.revenue / report.sales.total_revenue) * 100;
                      return (
                        <div key={serviceType} className="bg-dm-bg-secondary rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-dm-text-primary text-sm">{serviceType}</h5>
                            <span className="text-xs text-dm-text-muted bg-dm-bg-primary px-2 py-0.5 rounded-full">
                              {data.count} items
                            </span>
                          </div>
                          <p className="text-xl font-bold text-dm-text-primary mb-1">
                            {formatCurrency(data.revenue)}
                          </p>
                          <div className="w-full bg-dm-bg-secondary rounded-full h-1.5 mb-2">
                            <div
                              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-dm-text-muted">
                            <span>{percentage.toFixed(1)}% del total</span>
                            <span>
                              {formatCurrency(data.average_ticket || data.average_item_amount || 0)} prom.
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Comparativa con otros viajes */}
            <div className="bg-dm-bg-primary rounded-lg p-5 border border-dm-border-primary shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h4 className="text-lg font-semibold text-dm-text-primary flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                  Comparativa con Viajes de la Misma Ruta
                </h4>
                {report.comparatives && (
                  <span className="text-sm text-dm-text-muted bg-dm-bg-secondary px-3 py-1 rounded-full">
                    {formatDate(report.comparatives.start_date)} - {formatDate(report.comparatives.end_date)}
                  </span>
                )}
              </div>

              {/* Mensaje cuando no hay viajes comparativos */}
              {(!report.comparatives || !report.comparatives.trips || report.comparatives.trips.length === 0) && (
                <div className="bg-dm-bg-secondary rounded-lg p-6 text-center">
                  <ChartBarIcon className="w-12 h-12 text-dm-text-muted mx-auto mb-3" />
                  <p className="text-dm-text-muted text-sm">
                    No se encontraron viajes comparativos en este rango de fechas.
                  </p>
                  <p className="text-dm-text-muted text-xs mt-1">
                    Intenta ampliar el rango de fechas para ver más datos.
                  </p>
                </div>
              )}

              {/* Estadísticas comparativas */}
              {report.comparatives && report.comparatives.trips && report.comparatives.trips.length > 0 && (() => {
                const stats = getComparativeStats(report.comparatives.trips);
                if (!stats) return null;
                  
                  const occupancyDiff = report.sales.occupancy_percentage - stats.avgOccupancy;
                  const revenueDiff = report.sales.total_revenue - stats.avgRevenue;
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-dm-bg-secondary rounded-lg p-4">
                        <p className="text-sm text-dm-text-muted">vs Ocupación Promedio</p>
                        <div className="flex items-center mt-1">
                          <span className={`text-lg font-bold ${occupancyDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {occupancyDiff >= 0 ? '+' : ''}{occupancyDiff.toFixed(1)}%
                          </span>
                          {occupancyDiff >= 0 ? (
                            <ArrowTrendingUpIcon className="w-5 h-5 text-green-500 ml-2" />
                          ) : (
                            <ArrowTrendingDownIcon className="w-5 h-5 text-red-500 dark:text-red-400 ml-2" />
                          )}
                        </div>
                        <p className="text-xs text-dm-text-muted mt-1">
                          Promedio: {stats.avgOccupancy.toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-dm-bg-secondary rounded-lg p-4">
                        <p className="text-sm text-dm-text-muted">vs Ingresos Promedio</p>
                        <div className="flex items-center mt-1">
                          <span className={`text-lg font-bold ${revenueDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {revenueDiff >= 0 ? '+' : ''}{formatCurrency(revenueDiff)}
                          </span>
                          {revenueDiff >= 0 ? (
                            <ArrowTrendingUpIcon className="w-5 h-5 text-green-500 ml-2" />
                          ) : (
                            <ArrowTrendingDownIcon className="w-5 h-5 text-red-500 dark:text-red-400 ml-2" />
                          )}
                        </div>
                        <p className="text-xs text-dm-text-muted mt-1">
                          Promedio: {formatCurrency(stats.avgRevenue)}
                        </p>
                      </div>
                      <div className="bg-dm-bg-secondary rounded-lg p-4">
                        <p className="text-sm text-dm-text-muted">Ticket Promedio Ruta</p>
                        <p className="text-lg font-bold text-dm-text-primary mt-1">
                          {formatCurrency(stats.avgTicket)}
                        </p>
                        <p className="text-xs text-dm-text-muted mt-1">
                          Basado en {report.comparatives.trips.length} viajes
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Tabla de viajes comparativos */}
                {report.comparatives && report.comparatives.trips && report.comparatives.trips.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-dm-bg-secondary">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-dm-text-secondary">Fecha</th>
                          <th className="px-4 py-3 text-center font-medium text-dm-text-secondary">Capacidad</th>
                          <th className="px-4 py-3 text-center font-medium text-dm-text-secondary">Vendidos</th>
                          <th className="px-4 py-3 text-center font-medium text-dm-text-secondary">Ocupación</th>
                          <th className="px-4 py-3 text-right font-medium text-dm-text-secondary">Ingresos</th>
                          <th className="px-4 py-3 text-right font-medium text-dm-text-secondary">Ticket Prom.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dm-border-primary">
                        {report.comparatives.trips.map((trip) => (
                          <tr key={trip.trip_id} className="hover:bg-dm-bg-hover">
                            <td className="px-4 py-3 text-dm-text-primary">
                              {formatDateTime(trip.departure_datetime)}
                            </td>
                            <td className="px-4 py-3 text-center text-dm-text-secondary">
                              {trip.capacity}
                            </td>
                            <td className="px-4 py-3 text-center text-dm-text-secondary">
                              {trip.sold_seats}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                trip.occupancy_percentage >= 80 ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' :
                                trip.occupancy_percentage >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300' :
                                'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                              }`}>
                                {trip.occupancy_percentage.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-dm-text-primary">
                              {formatCurrency(trip.total_revenue)}
                            </td>
                            <td className="px-4 py-3 text-right text-dm-text-secondary">
                              {formatCurrency(trip.average_ticket)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
