// src/features/accounting/components/SunatStatusBadge.tsx

import React from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface SunatStatusBadgeProps {
  status: 'PENDING' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'OBSERVED' | string;
  showIcon?: boolean;
  className?: string;
}

export const SunatStatusBadge: React.FC<SunatStatusBadgeProps> = ({ 
  status, 
  showIcon = true,
  className = ''
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return {
          icon: CheckCircleIcon,
          color: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
          text: 'Aceptado',
          iconColor: 'text-green-500'
        };
      case 'REJECTED':
        return {
          icon: XCircleIcon,
          color: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
          text: 'Rechazado',
          iconColor: 'text-red-500 dark:text-red-400'
        };
      case 'PENDING':
        return {
          icon: ClockIcon,
          color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
          text: 'Procesando',
          iconColor: 'text-yellow-500'
        };
      case 'SENT':
        return {
          icon: ExclamationTriangleIcon,
          color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300',
          text: 'Enviado',
          iconColor: 'text-blue-500'
        };
      case 'OBSERVED':
        return {
          icon: ExclamationTriangleIcon,
          color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300',
          text: 'Observado',
          iconColor: 'text-orange-500'
        };
      default:
        return {
          icon: ClockIcon,
          color: 'bg-dm-bg-secondary text-dm-text-primary',
          text: status,
          iconColor: 'text-dm-text-muted'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className={`inline-flex items-center ${config.color} px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {showIcon && (
        <config.icon className={`h-3 w-3 mr-1.5 ${config.iconColor}`} />
      )}
      {config.text}
    </div>
  );
}; 