import React from 'react';
import { DailySalesItem } from '../../../services/reports.service';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface SunatStatusChartProps {
  items: DailySalesItem[];
  isLoading?: boolean;
}

export const SunatStatusChart: React.FC<SunatStatusChartProps> = ({ 
  items, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Agrupar documentos por estado SUNAT
  const statusStats = items.reduce((acc, item) => {
    const status = item.sunat_status || 'UNKNOWN';
    
    if (!acc[status]) {
      acc[status] = {
        count: 0,
        amount: 0
      };
    }
    
    acc[status].count += 1;
    acc[status].amount += parseFloat(item.total_amount) || 0;
    
    return acc;
  }, {} as Record<string, { count: number; amount: number }>);

  // Configuración de estados con colores e iconos
  const statusConfig: Record<string, { 
    label: string; 
    color: string; 
    bgColor: string; 
    icon: React.ComponentType<any>;
  }> = {
    'ACCEPTED': {
      label: 'Aceptados',
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      icon: CheckCircleIcon
    },
    'REJECTED': {
      label: 'Rechazados',
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
      icon: XCircleIcon
    },
    'PENDING': {
      label: 'Pendientes',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 border-yellow-200',
      icon: ClockIcon
    },
    'ERROR': {
      label: 'Con Error',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-200',
      icon: ExclamationTriangleIcon
    }
  };

  const totalDocuments = items.length;
  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Estado de Documentos SUNAT
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(statusConfig).map(([status, config]) => {
          const stats = statusStats[status] || { count: 0, amount: 0 };
          const percentage = totalDocuments > 0 ? (stats.count / totalDocuments) * 100 : 0;
          const Icon = config.icon;

          return (
            <div key={status} className={`p-4 rounded-lg border ${config.bgColor}`}>
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-6 h-6 ${config.color}`} />
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${config.color} bg-white`}>
                  {percentage.toFixed(1)}%
                </span>
              </div>
              
              <div className="space-y-1">
                <div className={`text-2xl font-bold ${config.color}`}>
                  {stats.count}
                </div>
                <div className="text-sm text-gray-600">
                  {config.label}
                </div>
                <div className="text-xs text-gray-500">
                  S/ {stats.amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {totalDocuments}
          </div>
          <div className="text-sm text-gray-600">Total Documentos</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            S/ {totalAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-gray-600">Monto Total</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {totalDocuments > 0 ? ((statusStats['ACCEPTED']?.count || 0) / totalDocuments * 100).toFixed(1) : 0}%
          </div>
          <div className="text-sm text-gray-600">Tasa de Aceptación</div>
        </div>
      </div>

      {/* Alertas si hay problemas */}
      {(statusStats['REJECTED']?.count > 0 || statusStats['ERROR']?.count > 0) && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
            <span className="font-medium text-amber-800">Atención Requerida</span>
          </div>
          <div className="text-sm text-amber-700">
            {statusStats['REJECTED']?.count > 0 && (
              <div>• {statusStats['REJECTED'].count} documentos rechazados requieren revisión</div>
            )}
            {statusStats['ERROR']?.count > 0 && (
              <div>• {statusStats['ERROR'].count} documentos con errores necesitan corrección</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};