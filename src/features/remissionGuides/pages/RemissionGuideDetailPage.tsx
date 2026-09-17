// src/features/remissionGuides/pages/RemissionGuideDetailPage.tsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  UserIcon,
  TruckIcon,
  CalendarIcon,
  MapPinIcon,
  CubeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { SunatStatusBadge } from '../../accounting/components/SunatStatusBadge';
import { RemissionGuideActions } from '../components/RemissionGuideActions';
import { RemissionGuidePDFButton } from '../components/RemissionGuidePDFButton';
import { useRemissionGuide } from '../hooks/useRemissionGuides';
import { useBranchOfficesData } from '../../fluvial/hooks/useBranchOfficesData';
import { readGuideAddress } from '../../../types';

export const RemissionGuideDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedBranch] = useState(() => {
    const saved = localStorage.getItem('selectedSalesBranch');
    return saved ? JSON.parse(saved) : null;
  });

  const { data: branches } = useBranchOfficesData();
  const companyId = selectedBranch?.company_id || branches?.[0]?.company_id;

  const { 
    data: guide, 
    isLoading, 
    error,
    refetch 
  } = useRemissionGuide(id ? parseInt(id) : null, companyId);

  const handleEdit = () => {
    navigate(`/remission-guides/${id}/edit`);
  };

  const handleView = () => {
    // Ya estamos en la vista de detalles
    refetch();
  };

  if (isLoading) {
    return (
      <div className="-mx-4 flex min-h-[calc(100vh-10rem)] w-full items-center justify-center lg:-mx-6">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-dm-text-secondary">Cargando guía de remisión...</p>
        </div>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="-mx-4 flex min-h-[calc(100vh-10rem)] w-full items-center justify-center lg:-mx-6">
        <div className="text-center">
          <DocumentTextIcon className="h-16 w-16 text-dm-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-dm-text-primary mb-2">
            Guía de Remisión no encontrada
          </h2>
          <p className="text-dm-text-secondary mb-6">
            La guía de remisión solicitada no existe o no tienes permisos para verla.
          </p>
          <Button onClick={() => navigate('/remission-guides')}>
            Volver a la lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-4 w-full min-h-[calc(100vh-10rem)] lg:-mx-6">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 pb-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/remission-guides')}
                className="flex items-center"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Volver
              </Button>
              
              <div>
                <h1 className="text-3xl font-bold text-dm-text-primary">
                  Guía de Remisión {guide.series}-{String(guide.number).padStart(8, '0')}
                </h1>
                <p className="text-dm-text-secondary mt-1">
                  Emitida el {format(parseISO(guide.issue_date), 'dd/MM/yyyy', { locale: es })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <SunatStatusBadge status={guide.sunat_status} />
              
              {/* Botón PDF */}
              <RemissionGuidePDFButton 
                guide={guide} 
                variant="both" 
                size="sm" 
                showLabels={false}
              />
              
              {companyId && (
                <RemissionGuideActions
                  guide={guide}
                  companyId={companyId}
                  onView={handleView}
                  onEdit={handleEdit}
                  showLabels={true}
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Información del transporte */}
            <div className="bg-dm-bg-primary rounded-xl shadow-sm border border-dm-border-primary">
              <div className="border-b border-dm-border-primary px-6 py-4">
                <h2 className="text-lg font-semibold text-dm-text-primary flex items-center">
                  <TruckIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Información del Transporte
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-dm-text-primary mb-3">Detalles del Traslado</h3>
                    <div className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-dm-text-muted">Fecha de Inicio de Traslado</dt>
                        <dd className="text-sm text-dm-text-primary flex items-center mt-1">
                          <CalendarIcon className="h-4 w-4 mr-2 text-dm-text-muted" />
                          {format(parseISO(guide.transfer_start_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-dm-text-muted">Peso Total</dt>
                        <dd className="text-sm text-dm-text-primary flex items-center mt-1">
                          <CubeIcon className="h-4 w-4 mr-2 text-dm-text-muted" />
                          {guide.gross_total_weight} KGM
                        </dd>
                      </div>
                      {guide.number_of_packages && (
                        <div>
                          <dt className="text-sm font-medium text-dm-text-muted">Número de Paquetes</dt>
                          <dd className="text-sm text-dm-text-primary flex items-center mt-1">
                            <CubeIcon className="h-4 w-4 mr-2 text-dm-text-muted" />
                            {guide.number_of_packages}
                          </dd>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-dm-text-primary mb-3">Conductor y Vehículo</h3>
                    <div className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-dm-text-muted">Conductor</dt>
                        <dd className="text-sm text-dm-text-primary">{guide.driver_name || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-dm-text-muted">Documento del Conductor</dt>
                        <dd className="text-sm text-dm-text-primary">{guide.driver_doc_type} - {guide.driver_doc_number}</dd>
                      </div>
                      {guide.driver_license && (
                        <div>
                          <dt className="text-sm font-medium text-dm-text-muted">Licencia de Conducir</dt>
                          <dd className="text-sm text-dm-text-primary">{guide.driver_license}</dd>
                        </div>
                      )}
                      {guide.vessel?.name && (
                        <div>
                          <dt className="text-sm font-medium text-dm-text-muted">Embarcación</dt>
                          <dd className="text-sm text-dm-text-primary">{guide.vessel.name}</dd>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direcciones */}
                <div className="border-t pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-dm-text-primary mb-3 flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                        Dirección de Origen
                      </h3>
                      <p className="text-sm text-dm-text-primary">{readGuideAddress(guide.origin_address).address}</p>
                      <p className="text-xs text-dm-text-muted mt-1">Ubigeo: {readGuideAddress(guide.origin_address).ubigeo_code}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-dm-text-primary mb-3 flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-2 text-red-600 dark:text-red-400" />
                        Dirección de Destino
                      </h3>
                      <p className="text-sm text-dm-text-primary">{readGuideAddress(guide.destination_address).address}</p>
                      <p className="text-xs text-dm-text-muted mt-1">Ubigeo: {readGuideAddress(guide.destination_address).ubigeo_code}</p>
                    </div>
                  </div>
                </div>

                {/* Observaciones */}
                {guide.observation && (
                  <div className="border-t pt-6">
                    <h3 className="font-medium text-dm-text-primary mb-3 flex items-center">
                      <InformationCircleIcon className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                      Observaciones
                    </h3>
                    <p className="text-sm text-dm-text-secondary bg-dm-bg-secondary p-3 rounded-lg">
                      {guide.observation}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Items de la guía */}
            <div className="bg-dm-bg-primary rounded-xl shadow-sm border border-dm-border-primary">
              <div className="border-b border-dm-border-primary px-6 py-4">
                <h2 className="text-lg font-semibold text-dm-text-primary flex items-center">
                  <CubeIcon className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                  Items Transportados ({guide.items?.length || 0})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-dm-border-primary">
                  <thead className="bg-dm-bg-secondary">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                        Unidad
                      </th>
                      {guide.items?.some(item => item.internal_code) && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                          Código Interno
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-dm-bg-primary divide-y divide-dm-border-primary">
                    {guide.items?.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-dm-bg-primary' : 'bg-dm-bg-secondary'}>
                        <td className="px-6 py-4 text-sm text-dm-text-primary">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 text-sm text-dm-text-primary">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-sm text-dm-text-primary">
                          {item.unit_code}
                        </td>
                        {guide.items?.some(item => item.internal_code) && (
                          <td className="px-6 py-4 text-sm text-dm-text-muted">
                            {item.internal_code || '-'}
                          </td>
                        )}
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-dm-text-muted">
                          No se encontraron items en esta guía
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Columna lateral */}
          <div className="lg:col-span-1 space-y-6">
            {/* Remitente */}
            <div className="bg-dm-bg-primary rounded-xl shadow-sm border border-dm-border-primary">
              <div className="border-b border-dm-border-primary px-6 py-4">
                <h3 className="font-semibold text-dm-text-primary flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Remitente
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <dt className="text-sm font-medium text-dm-text-muted">Razón Social</dt>
                  <dd className="text-sm text-dm-text-primary">{guide.sender.business_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-dm-text-muted">Documento</dt>
                  <dd className="text-sm text-dm-text-primary">{guide.sender.document_type_code} - {guide.sender.document_number}</dd>
                </div>
              </div>
            </div>

            {/* Destinatario */}
            <div className="bg-dm-bg-primary rounded-xl shadow-sm border border-dm-border-primary">
              <div className="border-b border-dm-border-primary px-6 py-4">
                <h3 className="font-semibold text-dm-text-primary flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                  Destinatario
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <dt className="text-sm font-medium text-dm-text-muted">Razón Social</dt>
                  <dd className="text-sm text-dm-text-primary">{guide.receiver.business_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-dm-text-muted">Documento</dt>
                  <dd className="text-sm text-dm-text-primary">{guide.receiver.document_type_code} - {guide.receiver.document_number}</dd>
                </div>
              </div>
            </div>

            {/* Información de la empresa */}
            {guide.company && (
              <div className="bg-dm-bg-primary rounded-xl shadow-sm border border-dm-border-primary">
                <div className="border-b border-dm-border-primary px-6 py-4">
                  <h3 className="font-semibold text-dm-text-primary">Empresa Emisora</h3>
                </div>
                <div className="p-6 space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-dm-text-muted">Razón Social</dt>
                    <dd className="text-sm text-dm-text-primary">{guide.company.business_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-dm-text-muted">RUC</dt>
                    <dd className="text-sm text-dm-text-primary">{guide.company.ruc}</dd>
                  </div>
                </div>
              </div>
            )}

            {/* Información del viaje asociado */}
            {guide.trip && (
              <div className="bg-dm-bg-primary rounded-xl shadow-sm border border-dm-border-primary">
                <div className="border-b border-dm-border-primary px-6 py-4">
                  <h3 className="font-semibold text-dm-text-primary flex items-center">
                    <TruckIcon className="h-5 w-5 mr-2 text-purple-600" />
                    Viaje Asociado
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-dm-text-muted">Viaje</dt>
                    <dd className="text-sm text-dm-text-primary">{guide.trip.trip_name}</dd>
                  </div>
                  {guide.trip.vessel && (
                    <div>
                      <dt className="text-sm font-medium text-dm-text-muted">Embarcación</dt>
                      <dd className="text-sm text-dm-text-primary">{guide.trip.vessel.name}</dd>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
