import React from 'react';
import { Banknote } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { MetricasGenerales } from '../../../types/dashboard';

interface RevenueMetricsProps {
  data?: MetricasGenerales;
  isLoading?: boolean;
}

export const RevenueMetrics: React.FC<RevenueMetricsProps> = ({ data, isLoading = false }) => {
  // El backend ya formatea el valor con simbolo de moneda
  const totalRevenue = data?.ingresos_totales_formateado || "S/ 0.00";
  
  // Preparar el texto de cambio con la comparacion del mes anterior
  const changePercent = data?.comparacion_mes_anterior?.porcentaje || 0;
  const changeTrend = data?.comparacion_mes_anterior?.tendencia || 'neutral';
  const changeText = `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`;
  
  // Mapear tendencia a valores validos para MetricCard
  const changeTypeMap: Record<string, 'positive' | 'negative' | 'neutral'> = {
    'up': 'positive',
    'down': 'negative',
    'neutral': 'neutral'
  };
  const changeType = changeTypeMap[changeTrend] || 'neutral';

  return (
    <MetricCard
      title="Ingresos Totales"
      value={isLoading ? "--" : totalRevenue}
      icon={Banknote}
      change={changeText}
      changeType={changeType}
      subtitle="vs. mes anterior"
    />
  );
};