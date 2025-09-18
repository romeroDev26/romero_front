import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { usersService } from '../../../services/users.service';
import { MetricCard } from './MetricCard';

export const UserMetrics: React.FC = () => {
  const { data: users, isLoading } = useQuery({
    queryKey: ['users-count'],
    queryFn: () => usersService.search({ limit: 1000 }),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const totalUsers = users?.length || 0;

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