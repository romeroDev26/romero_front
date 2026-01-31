import React from 'react';
import { ReportSummary, ReportMetrics } from '../../../types/reports';
import { TrendingUp, FileText, Tag, Receipt } from 'lucide-react';

interface SalesSummaryProps {
  summary: ReportSummary;
  metrics: ReportMetrics;
  isLoading?: boolean;
}

export const SalesSummary: React.FC<SalesSummaryProps> = ({ summary, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: 'Total Documentos',
      value: summary.totalDocumentos.toLocaleString('es-PE'),
      icon: FileText,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      subtext: 'documentos emitidos',
    },
    {
      label: 'Ventas Totales',
      value: `S/ ${summary.totalVentas.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      subtext: 'ingresos generados',
    },
    {
      label: 'Descuentos',
      value: `S/ ${summary.totalDescuentos.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Tag,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-50',
      subtext: 'total descuentos',
    },
    {
      label: 'IGV',
      value: `S/ ${summary.totalIGV.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Receipt,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
      subtext: 'impuestos',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div 
            key={index}
            className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">
                {metric.label}
              </span>
              <div className={`${metric.iconBg} p-2 rounded-md`}>
                <Icon className={`w-4 h-4 ${metric.iconColor}`} />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-semibold text-gray-900">
                {metric.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {metric.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};