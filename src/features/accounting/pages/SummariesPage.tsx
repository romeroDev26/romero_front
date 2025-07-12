// src/features/accounting/pages/SummariesPage.tsx

import React, { useState } from 'react';
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ArrowPathIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useSunatSummaries, useCreateSunatSummary, useCheckSummaryStatus } from '../hooks/useSunatSummaries';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { SunatStatusBadge } from '../components/SunatStatusBadge';

export const SummariesPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  
  // TODO: Obtener company_id del contexto de autenticación
  const companyId = 1;
  
  const { data: summaries = [], isLoading, refetch } = useSunatSummaries(companyId);
  const createSummary = useCreateSunatSummary();
  const checkStatus = useCheckSummaryStatus();

  const handleCreateSummary = () => {
    if (!selectedDate) {
      alert('Por favor seleccione una fecha');
      return;
    }

    createSummary.mutate({
      company_id: companyId,
      issue_date: selectedDate
    }, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        setSelectedDate('');
      }
    });
  };

  const handleCheckStatus = (id: number) => {
    checkStatus.mutate(id);
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resúmenes Diarios</h1>
          <p className="text-gray-600">Gestionar resúmenes de boletas enviados a SUNAT</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Generar Resumen
        </Button>
      </div>

      {/* Tabla de Resúmenes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Resúmenes Generados</h2>
            <button
              onClick={() => refetch()}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando resúmenes...</p>
          </div>
        ) : summaries.length === 0 ? (
          <div className="p-6 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay resúmenes generados</p>
            <p className="text-sm text-gray-400 mt-1">Cree un resumen diario para comenzar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lote
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summaries.map((summary) => (
                  <tr key={summary.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {summary.batch_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(summary.issue_date).toLocaleDateString('es-ES')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SunatStatusBadge status={summary.sunat_status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {summary.sunat_ticket || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(summary.sunat_status === 'PENDING' || summary.sunat_status === 'SENT') && (
                        <Button
                          onClick={() => handleCheckStatus(summary.id)}
                          disabled={checkStatus.isPending}
                          className="text-sm bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {checkStatus.isPending ? 'Consultando...' : 'Consultar Estado'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Crear Resumen */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Generar Resumen Diario"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha del Resumen
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              max={new Date().toISOString().split('T')[0]}
            />
            <p className="mt-1 text-sm text-gray-500">
              Seleccione la fecha para la cual desea generar el resumen de boletas
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <DocumentTextIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Información</h4>
                <p className="text-sm text-blue-700 mt-1">
                  El sistema buscará automáticamente todas las boletas y notas de crédito/débito 
                  de la fecha seleccionada y las incluirá en el resumen diario.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <Button
            onClick={() => setIsCreateModalOpen(false)}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateSummary}
            disabled={!selectedDate || createSummary.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {createSummary.isPending ? 'Generando...' : 'Generar Resumen'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
