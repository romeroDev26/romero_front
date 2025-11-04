import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign } from 'lucide-react';
import { reportsService } from '../../../services/reports.service';
import { MetricCard } from './MetricCard';

export const RevenueMetrics: React.FC = () => {
  const { data: report, isLoading } = useQuery({
    queryKey: ['revenue-summary'],
    queryFn: () => reportsService.getDailySalesCurrentMonth(),
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  const totalRevenue = report?.resumenEjecutivo?.totalVentas?.toFixed(2) || "0";

  return (
    <MetricCard
      title="Ingresos Totales"
      value={isLoading ? "..." : `S/ ${totalRevenue}`}
      icon={DollarSign}
      change="+0% desde el mes pasado"
      changeType="neutral"
    />
  );
};