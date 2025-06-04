// src/features/fluvial/pages/FluvialDashboardPage.tsx
import React from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  TruckIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Datos simulados para el dashboard
const dashboardStats = {
  today: {
    trips: 8,
    passengers: 156,
    revenue: 13250.00,
    occupancy: 78
  },
  thisMonth: {
    trips: 240,
    passengers: 4680,
    revenue: 398750.00,
    occupancy: 72
  }
};

const todayTrips = [
  {
    id: 1,
    name: 'Expreso Amazonas',
    route: 'Iquitos - Yurimaguas',
    departure: '06:00',
    status: 'EN_VIAJE',
    passengers: 28,
    capacity: 35,
    revenue: 2380.00
  },
  {
    id: 2,
    name: 'Río Grande',
    route: 'Nauta - Contamana',
    departure: '08:30',
    status: 'PROGRAMADO',
    passengers: 18,
    capacity: 25,
    revenue: 1530.00
  },
  {
    id: 3,
    name: 'Selva Express',
    route: 'Yurimaguas - Pucallpa',
    departure: '14:00',
    status: 'EMBARCANDO',
    passengers: 31,
    capacity: 40,
    revenue: 2635.00
  },
  {
    id: 4,
    name: 'Amazonía I',
    route: 'Contamana - Iquitos',
    departure: '16:30',
    status: 'PROGRAMADO',
    passengers: 22,
    capacity: 30,
    revenue: 1870.00
  }
];

const alerts = [
  {
    id: 1,
    type: 'warning',
    message: 'Embarcación "Río Grande" requiere mantenimiento en 5 días',
    time: 'Hace 2 horas'
  },
  {
    id: 2,
    type: 'info',
    message: 'Nueva reserva para viaje Iquitos-Yurimaguas del 15/06',
    time: 'Hace 1 hora'
  },
  {
    id: 3,
    type: 'success',
    message: 'Manifiesto del viaje matutino Nauta-Contamana enviado exitosamente',
    time: 'Hace 30 min'
  }
];

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}> = ({ title, value, subtitle, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        {trend && (
          <div className="flex items-center mt-2">
            <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-sm text-gray-500 ml-1">vs mes anterior</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

const TripStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig = {
    'PROGRAMADO': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Programado' },
    'EMBARCANDO': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Embarcando' },
    'EN_VIAJE': { bg: 'bg-green-100', text: 'text-green-800', label: 'En Viaje' },
    'COMPLETADO': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Completado' },
    'CANCELADO': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PROGRAMADO'];
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

const AlertIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'warning':
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    case 'success':
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    default:
      return <ClockIcon className="h-5 w-5 text-blue-500" />;
  }
};

export const FluvialDashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Fluvial</h1>
          <p className="text-gray-600">Resumen de operaciones de transporte fluvial</p>
        </div>
        <div className="text-sm text-gray-500">
          Última actualización: {new Date().toLocaleString('es-PE')}
        </div>
      </div>

      {/* Estadísticas del día */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Operaciones de Hoy</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Viajes Programados"
            value={dashboardStats.today.trips}
            icon={TruckIcon}
            color="bg-blue-500"
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            title="Pasajeros"
            value={dashboardStats.today.passengers}
            icon={UserGroupIcon}
            color="bg-green-500"
            trend={{ value: 8.3, isPositive: true }}
          />
          <StatCard
            title="Ingresos"
            value={`S/ ${dashboardStats.today.revenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
            icon={CurrencyDollarIcon}
            color="bg-purple-500"
            trend={{ value: 15.2, isPositive: true }}
          />
          <StatCard
            title="Ocupación Promedio"
            value={`${dashboardStats.today.occupancy}%`}
            icon={ChartBarIcon}
            color="bg-orange-500"
            trend={{ value: 5.1, isPositive: true }}
          />
        </div>
      </div>

      {/* Estadísticas del mes */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Operaciones del Mes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Viajes"
            value={dashboardStats.thisMonth.trips}
            icon={TruckIcon}
            color="bg-blue-600"
          />
          <StatCard
            title="Total Pasajeros"
            value={dashboardStats.thisMonth.passengers.toLocaleString('es-PE')}
            icon={UserGroupIcon}
            color="bg-green-600"
          />
          <StatCard
            title="Ingresos Totales"
            value={`S/ ${dashboardStats.thisMonth.revenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
            icon={CurrencyDollarIcon}
            color="bg-purple-600"
          />
          <StatCard
            title="Ocupación Promedio"
            value={`${dashboardStats.thisMonth.occupancy}%`}
            icon={ChartBarIcon}
            color="bg-orange-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Viajes de hoy */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Viajes de Hoy</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {todayTrips.map((trip) => (
                  <div key={trip.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <TruckIcon className="h-6 w-6 text-blue-600" />
                      </div>
                        <h3 className="font-semibold text-gray-900">{trip.name}</h3>
                        <p className="text-sm text-gray-600">{trip.route}</p>
                        <p className="text-xs text-gray-500">Salida: {trip.departure}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <TripStatusBadge status={trip.status} />
                      <p className="text-sm text-gray-600 mt-1">
                        {trip.passengers}/{trip.capacity} pax
                      </p>
                      <p className="text-sm font-medium text-green-600">
                        S/ {trip.revenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Alertas y notificaciones */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Alertas Recientes</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3">
                    <AlertIcon type={alert.type} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Ver todas las alertas →
                </button>
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Acciones Rápidas</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">Nueva Venta</div>
                  <div className="text-sm text-gray-600">Vender pasaje de transporte</div>
                </button>
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">Programar Viaje</div>
                  <div className="text-sm text-gray-600">Crear nuevo viaje</div>
                </button>
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">Ver Manifiestos</div>
                  <div className="text-sm text-gray-600">Gestionar manifiestos</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};