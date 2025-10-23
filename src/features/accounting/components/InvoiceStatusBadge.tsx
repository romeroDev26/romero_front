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
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'GENERATED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'SIGNED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'SENT':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'ACCEPTED':
      case 'RECEIVED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'OBSERVED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'VOIDED':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'ERROR':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
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
      ? 'bg-red-50 text-red-700 border-red-200'
      : 'bg-yellow-50 text-yellow-700 border-yellow-200';
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
