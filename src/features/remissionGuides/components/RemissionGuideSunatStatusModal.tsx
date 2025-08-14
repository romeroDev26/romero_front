// src/features/remissionGuides/components/RemissionGuideSunatStatusModal.tsx

import React from 'react';
import { 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { RemissionGuideTransportista } from '../../../types';
import { useRemissionGuideSunatStatus } from '../hooks/useRemissionGuides';

interface RemissionGuideSunatStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  guide: RemissionGuideTransportista;
  companyId: number;
}

export const RemissionGuideSunatStatusModal: React.FC<RemissionGuideSunatStatusModalProps> = ({
  isOpen,
  onClose,
  guide,
  companyId
}) => {
  const { 
    data: sunatStatus, 
    isLoading, 
    error,
    refetch 
  } = useRemissionGuideSunatStatus(guide.id, companyId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
      case 'RECEIVED':
        return <CheckCircleIcon className="h-8 w-8 text-green-600" />;
      case 'REJECTED':
        return <XCircleIcon className="h-8 w-8 text-red-600" />;
      case 'SENT':
        return <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />;
      case 'PENDING':
      case 'GENERATED':
      case 'SIGNED':
        return <ClockIcon className="h-8 w-8 text-blue-600" />;
      default:
        return <InformationCircleIcon className="h-8 w-8 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
      case 'RECEIVED':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'REJECTED':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'SENT':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'PENDING':
      case 'GENERATED':
      case 'SIGNED':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'PENDING': 'Pendiente',
      'GENERATED': 'XML Generado',
      'SIGNED': 'XML Firmado',
      'SENT': 'Enviado a SUNAT',
      'ACCEPTED': 'Aceptado por SUNAT',
      'RECEIVED': 'CDR Recibido',
      'REJECTED': 'Rechazado por SUNAT',
      'ERROR': 'Error'
    };
    return statusMap[status] || status;
  };

  if (error) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Estado SUNAT">
        <div className="text-center py-6">
          <XCircleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar estado</h3>
          <p className="text-sm text-gray-600 mb-4">
            No se pudo obtener el estado SUNAT de la guía
          </p>
          <Button onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Estado SUNAT - Guía de Remisión" maxWidth="lg">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-600">Consultando estado...</span>
        </div>
      ) : sunatStatus ? (
        <div className="space-y-6">
          {/* Estado principal */}
          <div className="flex items-center justify-center space-x-4 p-6 rounded-xl bg-gray-50">
            {getStatusIcon(sunatStatus.sunat_status)}
            <div className="text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(sunatStatus.sunat_status)}`}>
                {getStatusText(sunatStatus.sunat_status)}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {sunatStatus.status_description}
              </p>
            </div>
          </div>

          {/* Información detallada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b pb-2">Información General</h4>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Guía de Remisión</dt>
                <dd className="text-sm text-gray-900">{guide.series}-{String(guide.number).padStart(8, '0')}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Estado Actual</dt>
                <dd className="text-sm text-gray-900">{getStatusText(sunatStatus.sunat_status)}</dd>
              </div>

              {sunatStatus.sunat_ticket && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ticket SUNAT</dt>
                  <dd className="text-sm text-gray-900 font-mono">{sunatStatus.sunat_ticket}</dd>
                </div>
              )}
            </div>

            {/* Respuesta de SUNAT */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b pb-2">Respuesta SUNAT</h4>
              
              {sunatStatus.sunat_response_code && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Código de Respuesta</dt>
                  <dd className="text-sm text-gray-900">{sunatStatus.sunat_response_code}</dd>
                </div>
              )}

              {sunatStatus.sunat_response_description && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                  <dd className="text-sm text-gray-900">{sunatStatus.sunat_response_description}</dd>
                </div>
              )}

              {sunatStatus.sunat_reception_date && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Fecha de Recepción</dt>
                  <dd className="text-sm text-gray-900">
                    {format(parseISO(sunatStatus.sunat_reception_date), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                  </dd>
                </div>
              )}
            </div>
          </div>

          {/* Observaciones de SUNAT */}
          {sunatStatus.sunat_observations && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-semibold text-orange-900 mb-2 flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                Observaciones SUNAT
              </h4>
              <p className="text-sm text-orange-800">{sunatStatus.sunat_observations}</p>
            </div>
          )}

          {/* Enlaces de archivos */}
          {(sunatStatus.xml_file_path || sunatStatus.zip_file_path || sunatStatus.cdr_file_path) && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Archivos Disponibles</h4>
              <div className="flex flex-wrap gap-2">
                {sunatStatus.xml_file_path && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(sunatStatus.xml_file_path, '_blank')}
                    className="flex items-center"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    Descargar XML
                  </Button>
                )}
                
                {sunatStatus.zip_file_path && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(sunatStatus.zip_file_path, '_blank')}
                    className="flex items-center"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    Descargar ZIP
                  </Button>
                )}
                
                {sunatStatus.cdr_file_path && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(sunatStatus.cdr_file_path, '_blank')}
                    className="flex items-center"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    Descargar CDR
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Hash del ZIP */}
          {sunatStatus.zip_hash && (
            <div className="text-xs text-gray-500 border-t pt-3">
              <span className="font-medium">Hash ZIP:</span> {sunatStatus.zip_hash}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Estado no disponible</h3>
          <p className="text-sm text-gray-600">
            No se encontró información de estado SUNAT para esta guía
          </p>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center"
        >
          <ClockIcon className="h-4 w-4 mr-2" />
          Actualizar Estado
        </Button>
        
        <Button variant="primary" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Modal>
  );
};

export default RemissionGuideSunatStatusModal;
