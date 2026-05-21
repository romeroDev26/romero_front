import React from 'react';
import { ReportSummary, ReportMetrics } from '../../../types/reports';
import { TrendingUp, FileText, Tag, Receipt } from 'lucide-react';
import { AnimatedCounter } from '../../../components/common/AnimatedCounter';

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
          <div key={i} className="bg-dm-bg-primary rounded-lg border border-dm-border-primary p-5">
            <div className="animate-pulse">
              <div className="h-4 bg-dm-bg-secondary rounded w-24 mb-3"></div>
              <div className="h-8 bg-dm-bg-secondary rounded w-32 mb-2"></div>
              <div className="h-3 bg-dm-bg-secondary rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: 'Total Documentos',
      value: summary.totalDocumentos,
      icon: FileText,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-950/30',
      subtext: 'documentos emitidos',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    },
    {
      label: 'Ventas Totales',
      value: summary.totalVentas,
      icon: TrendingUp,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      subtext: 'ingresos generados',
      prefix: 'S/ ',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
    {
      label: 'Descuentos',
      value: summary.totalDescuentos,
      icon: Tag,
      iconColor: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-50 dark:bg-orange-950/30',
      subtext: 'total descuentos',
      prefix: 'S/ ',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
    {
      label: 'IGV',
      value: summary.totalIGV,
      icon: Receipt,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
      subtext: 'impuestos',
      prefix: 'S/ ',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div 
            key={index}
            className="bg-dm-bg-primary rounded-lg border border-dm-border-primary p-5 hover:border-dm-border-primary transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm font-medium text-dm-text-secondary">
                {metric.label}
              </span>
              <div className={`${metric.iconBg} p-2 rounded-md`}>
                <Icon className={`w-4 h-4 ${metric.iconColor}`} />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-semibold text-dm-text-primary">
                <AnimatedCounter
                  value={metric.value}
                  prefix={metric.prefix}
                  minimumFractionDigits={metric.minimumFractionDigits}
                  maximumFractionDigits={metric.maximumFractionDigits}
                />
              </p>
              <p className="text-xs text-dm-text-muted mt-1">
                {metric.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};