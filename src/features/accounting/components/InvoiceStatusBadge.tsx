// src/features/accounting/components/InvoiceStatusBadge.tsx

import React from 'react';
import { SunatDocumentStatus } from '../../../types';

interface InvoiceStatusBadgeProps {
  sunatStatus: SunatDocumentStatus;
  businessStatus?: 'ACTIVE' | 'CANCELLED' | 'INCREASED';
}

export const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({
  sunatStatus,
  businessStatus,
}) => {
  const getSunatStatusColor = (status: SunatDocumentStatus): string => {
    switch (status) {
      case 'PENDING':
        return 'bg-dm-bg-secondary text-dm-text-primary border-dm-border-primary';
      case 'GENERATED':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-300';
      case 'SIGNED':
        return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 border-indigo-300';
      case 'SENT':
        return 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'ACCEPTED':
      case 'RECEIVED':
        return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-300';
      case 'REJECTED':
        return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-300';
      case 'OBSERVED':
        return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border-yellow-300';
      case 'VOIDED':
        return 'bg-dm-bg-secondary text-dm-text-primary border-dm-border-primary';
      case 'ERROR':
        return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-300';
      default:
        return 'bg-dm-bg-secondary text-dm-text-primary border-dm-border-primary';
    }
  };

  const getSunatStatusText = (status: SunatDocumentStatus): string => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'GENERATED':
        return 'Generado';
      case 'SIGNED':
        return 'Firmado';
      case 'SENT':
        return 'Enviado';
      case 'ACCEPTED':
        return 'Aceptado';
      case 'RECEIVED':
        return 'Recibido';
      case 'REJECTED':
        return 'Rechazado';
      case 'OBSERVED':
        return 'Observado';
      case 'VOIDED':
        return 'Anulado';
      case 'ERROR':
        return 'Error';
      default:
        return status;
    }
  };

  // Si el documento está cancelado o aumentado, mostramos ambos estados en línea
  if (businessStatus === 'CANCELLED' || businessStatus === 'INCREASED') {
    const businessStatusColor = businessStatus === 'CANCELLED' 
      ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200'
      : 'bg-yellow-50 text-yellow-700 dark:text-yellow-300 border-yellow-200';
    const businessStatusText = businessStatus === 'CANCELLED' ? 'Cancelado' : 'Aumentado';
    
    return (
      <div className="flex items-center gap-2">
        {/* Estado SUNAT */}
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSunatStatusColor(
            sunatStatus
          )}`}
        >
          {getSunatStatusText(sunatStatus)}
        </span>
        {/* Estado del Negocio */}
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${businessStatusColor}`}>
          {businessStatusText}
        </span>
      </div>
    );
  }

  // Si está activo, solo mostramos el estado SUNAT (diseño original)
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSunatStatusColor(
        sunatStatus
      )}`}
    >
      {getSunatStatusText(sunatStatus)}
    </span>
  );
};
