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
          color: 'bg-green-100 text-green-800',
          text: 'Aceptado',
          iconColor: 'text-green-500'
        };
      case 'REJECTED':
        return {
          icon: XCircleIcon,
          color: 'bg-red-100 text-red-800',
          text: 'Rechazado',
          iconColor: 'text-red-500'
        };
      case 'PENDING':
        return {
          icon: ClockIcon,
          color: 'bg-yellow-100 text-yellow-800',
          text: 'Procesando',
          iconColor: 'text-yellow-500'
        };
      case 'SENT':
        return {
          icon: ExclamationTriangleIcon,
          color: 'bg-blue-100 text-blue-800',
          text: 'Enviado',
          iconColor: 'text-blue-500'
        };
      case 'OBSERVED':
        return {
          icon: ExclamationTriangleIcon,
          color: 'bg-orange-100 text-orange-800',
          text: 'Observado',
          iconColor: 'text-orange-500'
        };
      default:
        return {
          icon: ClockIcon,
          color: 'bg-gray-100 text-gray-800',
          text: status,
          iconColor: 'text-gray-500'
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