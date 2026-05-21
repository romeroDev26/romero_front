// src/features/dashboard/components/TripSalesReport.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  MagnifyingGlassIcon, 
  TruckIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { reportsService } from '../../../services/reports.service';
import { TripSalesReportResponse, ComparativeTrip } from '../../../types/tripSalesReport';

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

export const TripSalesReport: React.FC = () => {
  const [tripId, setTripId] = useState<string>('');
  const [searchTripId, setSearchTripId] = useState<number | null>(null);

  const { data: report, isLoading, error, refetch } = useQuery<TripSalesReportResponse>({
    queryKey: ['trip-sales', searchTripId],
    queryFn: () => reportsService.getTripSales({ trip_id: searchTripId! }),
    enabled: !!searchTripId,
  });

  const handleSearch = () => {
    const id = parseInt(tripId);
    if (!isNaN(id) && id > 0) {
      setSearchTripId(id);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
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
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TruckIcon className="w-6 h-6" />
          Reporte de Ventas por Viaje
        </h2>
        <p className="text-indigo-100 text-sm mt-1">
          Consulta el rendimiento de ventas de un viaje específico
        </p>
      </div>

      {/* Buscador */}
      <div className="p-6 border-b border-dm-border-primary bg-dm-bg-secondary">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-dm-text-secondary mb-1">
              ID del Viaje
            </label>
            <div className="relative">
              <input
                type="number"
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ingresa el ID del viaje (ej: 123)"
                className="w-full px-4 py-3 border border-dm-border-primary rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={!tripId || isLoading}
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-dm-text-muted disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isLoading ? (
                <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
              )}
              {isLoading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        {/* Estado inicial */}
        {!searchTripId && !error && (
          <div className="text-center py-12">
            <TruckIcon className="w-16 h-16 mx-auto text-dm-text-muted mb-4" />
            <p className="text-dm-text-muted text-lg">
              Ingresa un ID de viaje para ver el reporte de ventas
            </p>
            <p className="text-dm-text-muted text-sm mt-2">
              Podrás ver ocupación, ingresos, métodos de pago y comparativas
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 mr-3" />
              <div>
                <h4 className="text-red-800 dark:text-red-300 font-medium">Error al cargar el reporte</h4>
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                  No se pudo obtener la información del viaje. Verifica que el ID sea correcto.
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-3 text-red-700 dark:text-red-300 hover:text-red-800 dark:text-red-300 text-sm font-medium"
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
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-5 border border-dm-border-primary">
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
                  {report.sales.occupancy_percentage.toFixed(1)}%
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
                  {formatCurrency(report.sales.total_revenue)}
                </p>
                <p className="text-sm text-dm-text-muted">Ingresos Totales</p>
              </div>

              {/* Asientos vendidos */}
              <div className="bg-dm-bg-primary rounded-lg p-4 border border-dm-border-primary shadow-sm">
                <div className="flex items-center justify-between">
                  <ChartBarIcon className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-dm-text-primary mt-3">
                  {report.sales.sold_seats}
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
                  {formatCurrency(report.sales.average_ticket)}
                </p>
                <p className="text-sm text-dm-text-muted">Ticket Promedio</p>
              </div>
            </div>

            {/* Desglose por Método de Pago */}
            {report.sales.payment_breakdown && report.sales.payment_breakdown.length > 0 && (
              <div className="bg-dm-bg-primary rounded-lg p-5 border border-dm-border-primary shadow-sm">
                <h4 className="text-lg font-semibold text-dm-text-primary mb-4">
                  Desglose por Método de Pago
                </h4>
                <div className="space-y-4">
                  {/* Barra de distribución visual */}
                  <div className="flex h-4 rounded-full overflow-hidden bg-dm-bg-secondary">
                    {report.sales.payment_breakdown.map((payment) => {
                      const percentage = (payment.amount / report.sales.total_revenue) * 100;
                      return (
                        <div
                          key={payment.payment_method}
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: getPaymentColor(payment.payment_method),
                          }}
                          title={`${payment.payment_method}: ${formatCurrency(payment.amount)} (${percentage.toFixed(1)}%)`}
                        />
                      );
                    })}
                  </div>

                  {/* Lista de métodos de pago */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {report.sales.payment_breakdown.map((payment) => {
                      const percentage = (payment.amount / report.sales.total_revenue) * 100;
                      return (
                        <div
                          key={payment.payment_method}
                          className="bg-dm-bg-secondary rounded-lg p-3 border border-dm-border-secondary"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getPaymentColor(payment.payment_method) }}
                            />
                            <span className="text-sm font-medium text-dm-text-secondary">
                              {payment.payment_method.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-lg font-bold text-dm-text-primary">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-xs text-dm-text-muted">
                            {percentage.toFixed(1)}% del total
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Desglose por Servicio */}
            {report.sales.service_breakdown && Object.keys(report.sales.service_breakdown).length > 0 && (
              <div className="bg-dm-bg-primary rounded-lg p-5 border border-dm-border-primary shadow-sm">
                <h4 className="text-lg font-semibold text-dm-text-primary mb-4">
                  Desglose por Tipo de Servicio
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(report.sales.service_breakdown)
                    .filter(([serviceType]) => serviceType !== 'categories')
                    .map(([serviceType, data]) => {
                    const percentage = (data.revenue / report.sales.total_revenue) * 100;
                    return (
                      <div key={serviceType} className="bg-dm-bg-secondary rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-dm-text-primary">{serviceType}</h5>
                          <span className="text-sm text-dm-text-muted">{data.count} items</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-dm-text-secondary">Ingresos:</span>
                            <span className="font-semibold text-dm-text-primary">{formatCurrency(data.revenue)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-dm-text-secondary">
                              {serviceType === 'PASAJES' ? 'Ticket prom.' : 'Monto prom.'}:
                            </span>
                            <span className="font-semibold text-dm-text-primary">
                              {formatCurrency(data.average_ticket || data.average_item_amount || 0)}
                            </span>
                          </div>
                          <div className="w-full bg-dm-bg-secondary rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-right text-xs text-dm-text-muted">
                            {percentage.toFixed(1)}% del total
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Comparativa con otros viajes */}
            {report.comparatives.trips.length > 0 && (
              <div className="bg-dm-bg-primary rounded-lg p-5 border border-dm-border-primary shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-dm-text-primary">
                    Comparativa con Viajes de la Misma Ruta
                  </h4>
                  <span className="text-sm text-dm-text-muted">
                    {formatDate(report.comparatives.start_date)} - {formatDate(report.comparatives.end_date)}
                  </span>
                </div>

                {/* Estadísticas comparativas */}
                {(() => {
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
                    <tbody className="divide-y divide-gray-200">
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
