import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  progress?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  subtitle,
  progress,
}) => {
  const changeConfig = {
    positive: {
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      icon: TrendingUp,
    },
    negative: {
      color: 'text-red-600',
      bg: 'bg-red-50',
      icon: TrendingDown,
    },
    neutral: {
      color: 'text-gray-500',
      bg: 'bg-gray-50',
      icon: Minus,
    },
  }[changeType];

  const TrendIcon = changeConfig.icon;

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4 text-gray-400" />
            <p className="text-sm font-medium text-gray-500">{title}</p>
          </div>
          <p className="text-2xl font-semibold text-gray-900 tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        {change && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${changeConfig.bg}`}>
            <TrendIcon className={`w-3 h-3 ${changeConfig.color}`} />
            <span className={`text-xs font-medium ${changeConfig.color}`}>{change}</span>
          </div>
        )}
      </div>
      {progress !== undefined && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>Progreso</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};