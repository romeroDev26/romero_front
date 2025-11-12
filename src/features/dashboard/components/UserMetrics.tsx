import React from 'react';
import { Users } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { MetricasGenerales } from '../../../types/dashboard';

interface UserMetricsProps {
  data?: MetricasGenerales;
  isLoading?: boolean;
}

export const UserMetrics: React.FC<UserMetricsProps> = ({ data, isLoading = false }) => {
  const totalUsers = data?.total_usuarios || 0;

  return (
    <MetricCard
      title="Total de Usuarios"
      value={isLoading ? "..." : totalUsers.toString()}
      icon={Users}
      change="+0% desde el mes pasado"
      changeType="neutral"
    />
  );
};