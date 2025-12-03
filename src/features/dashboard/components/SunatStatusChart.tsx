import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { SunatStatusMetric } from '../../../types/reports';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Colores modernos para cada estado
const STATUS_COLORS = {
  ACCEPTED: '#10b981',
  REJECTED: '#ef4444',
  PENDING: '#f59e0b',
  ERROR: '#f97316',
};

// Tooltip personalizado elegante
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white px-4 py-3 shadow-lg rounded-lg border border-gray-100">
        <p className="text-sm font-medium text-gray-900 mb-2">{data.label}</p>
        <div className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: data.fill }}
          />
          <span className="text-gray-600">Documentos:</span>
          <span className="font-semibold text-gray-900">{data.count}</span>
        </div>
        <div className="flex items-center gap-2 text-sm mt-1">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <span className="text-gray-600">Monto:</span>
          <span className="font-semibold text-gray-900">
            S/ {data.amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

interface SunatStatusChartProps {
  sunatStatus: SunatStatusMetric;
  isLoading?: boolean;
}

export const SunatStatusChart: React.FC<SunatStatusChartProps> = ({ 
  sunatStatus, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Configuración de estados con colores e iconos
  const statusConfig: Record<string, { 
    label: string; 
    color: string; 
    bgColor: string; 
    icon: React.ComponentType<any>;
  }> = {
    'ACCEPTED': {
      label: 'Aceptados',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-100',
      icon: CheckCircleIcon
    },
    'REJECTED': {
      label: 'Rechazados',
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-100',
      icon: XCircleIcon
    },
    'PENDING': {
      label: 'Pendientes',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 border-amber-100',
      icon: ClockIcon
    },
    'ERROR': {
      label: 'Con Error',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-100',
      icon: ExclamationTriangleIcon
    }
  };

  // Convertir datos para el gráfico de pie
  const chartData = Object.entries(sunatStatus || {}).map(([status, data]) => ({
    name: status,
    label: statusConfig[status]?.label || status,
    count: data.cantidad,
    amount: data.monto,
    fill: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6b7280',
  }));

  const totalDocuments = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        Estado de Documentos SUNAT
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de pie */}
        <div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <defs>
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <linearGradient key={`sunatGradient-${status}`} id={`sunatGradient-${status}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={1} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.75} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={85}
                innerRadius={45}
                dataKey="count"
                paddingAngle={3}
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#sunatGradient-${entry.name})`}
                    style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Cards de estado */}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(statusConfig).map(([status, config]) => {
            const data = sunatStatus?.[status] || { cantidad: 0, monto: 0 };
            const percentage = totalDocuments > 0 ? (data.cantidad / totalDocuments) * 100 : 0;
            const Icon = config.icon;

            return (
              <div key={status} className={`p-3 rounded-lg border ${config.bgColor}`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${config.color}`} />
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.color} bg-white`}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
                
                <div className="space-y-0.5">
                  <div className={`text-xl font-bold ${config.color}`}>
                    {data.cantidad}
                  </div>
                  <div className="text-xs text-gray-600">
                    {config.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumen y alertas */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xl font-bold text-gray-900">
              {totalDocuments}
            </div>
            <div className="text-xs text-gray-600">Total Docs</div>
          </div>
          
          <div className="bg-emerald-50 rounded-lg p-3">
            <div className="text-xl font-bold text-emerald-600">
              {totalDocuments > 0 ? (((sunatStatus?.['ACCEPTED']?.cantidad || 0) / totalDocuments) * 100).toFixed(0) : 0}%
            </div>
            <div className="text-xs text-gray-600">Aceptación</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xl font-bold text-gray-900">
              {Object.keys(sunatStatus || {}).length}
            </div>
            <div className="text-xs text-gray-600">Estados</div>
          </div>
        </div>
      </div>

      {/* Alertas si hay problemas */}
      {((sunatStatus?.['REJECTED']?.cantidad || 0) > 0 || (sunatStatus?.['ERROR']?.cantidad || 0) > 0) && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
            <span className="font-medium text-amber-800 text-sm">Atención Requerida</span>
          </div>
          <div className="text-xs text-amber-700">
            {(sunatStatus?.['REJECTED']?.cantidad || 0) > 0 && (
              <div>• {sunatStatus['REJECTED'].cantidad} docs rechazados</div>
            )}
            {(sunatStatus?.['ERROR']?.cantidad || 0) > 0 && (
              <div>• {sunatStatus['ERROR'].cantidad} docs con errores</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};