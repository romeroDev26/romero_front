import React from 'react';

import { SunatStatusMetric } from '../../../types/reports';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
      <div className="bg-dm-bg-primary rounded-lg border border-dm-border-primary p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-dm-bg-secondary rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-dm-bg-secondary rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Configuración de estados con colores e iconos
  const statusConfig: Record<string, { 
    label: string; 
    color: string; 
    bgColor: string; 
    icon: React.ComponentType<{ className?: string }>;
  }> = {
    'ACCEPTED': {
      label: 'Aceptados',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      icon: CheckCircleIcon
    },
    'REJECTED': {
      label: 'Rechazados',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      icon: XCircleIcon
    },
    'PENDING': {
      label: 'Pendientes',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      icon: ClockIcon
    },
    'ERROR': {
      label: 'Con Error',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      icon: ExclamationTriangleIcon
    }
  };

  const totalDocuments = Object.values(sunatStatus || {}).reduce((sum, data) => sum + data.cantidad, 0);

  return (
    <div className="bg-dm-bg-primary rounded-lg border border-dm-border-primary p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-dm-text-primary">
          Estado de Documentos
        </h3>
        <span className="text-xs text-dm-text-muted">
          {totalDocuments} documentos
        </span>
      </div>
      
      {/* Cards de estado estilo Tremor */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {Object.entries(statusConfig).map(([status, config]) => {
          const data = sunatStatus?.[status] || { cantidad: 0, monto: 0 };
          const percentage = totalDocuments > 0 ? (data.cantidad / totalDocuments) * 100 : 0;
          const Icon = config.icon;

          return (
            <div key={status} className={`${config.bgColor} rounded-lg p-4 border border-dm-border-primary`}>
              <div className="flex items-start justify-between mb-2">
                <Icon className={`w-5 h-5 ${config.color}`} />
                <span className={`text-xs font-semibold ${config.color}`}>
                  {percentage.toFixed(0)}%
                </span>
              </div>
              
              <div className="mt-3">
                <div className={`text-2xl font-bold ${config.color} mb-1`}>
                  {data.cantidad}
                </div>
                <div className="text-xs text-dm-text-secondary mb-2">
                  {config.label}
                </div>
                <div className="text-xs text-dm-text-muted">
                  S/ {data.monto.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra de progreso general */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-dm-text-secondary">
          <span>Estado general</span>
          <span className="font-medium">
            {totalDocuments > 0 ? (((sunatStatus?.['ACCEPTED']?.cantidad || 0) / totalDocuments) * 100).toFixed(1) : 0}% aceptados
          </span>
        </div>
        <div className="w-full bg-dm-bg-secondary rounded-full h-2.5 overflow-hidden flex">
          {Object.entries(statusConfig).map(([status, config]) => {
            const data = sunatStatus?.[status] || { cantidad: 0, monto: 0 };
            const percentage = totalDocuments > 0 ? (data.cantidad / totalDocuments) * 100 : 0;
            const bgColor = {
              'ACCEPTED': 'bg-emerald-500',
              'REJECTED': 'bg-red-500',
              'PENDING': 'bg-amber-500',
              'ERROR': 'bg-orange-500',
            }[status];
            
            return percentage > 0 ? (
              <div
                key={status}
                className={`${bgColor} h-2.5 transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
                style={{ width: `${percentage}%` }}
                title={`${config.label}: ${data.cantidad}`}
              />
            ) : null;
          })}
        </div>
      </div>

      {/* Alertas si hay problemas */}
      {((sunatStatus?.['REJECTED']?.cantidad || 0) > 0 || (sunatStatus?.['ERROR']?.cantidad || 0) > 0) && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-medium text-amber-900 dark:text-amber-200 text-sm block mb-1">Atención Requerida</span>
              <div className="text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
                {(sunatStatus?.['REJECTED']?.cantidad || 0) > 0 && (
                  <div>• {sunatStatus['REJECTED'].cantidad} documentos rechazados</div>
                )}
                {(sunatStatus?.['ERROR']?.cantidad || 0) > 0 && (
                  <div>• {sunatStatus['ERROR'].cantidad} documentos con errores</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};