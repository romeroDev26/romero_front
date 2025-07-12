// src/features/accounting/pages/VoidsPage.tsx

import React, { useState } from 'react';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useSunatVoids, useCreateSunatVoid, useCheckVoidStatus } from '../hooks/useSunatVoids';
import { useVoidableInvoices } from '../hooks/useCreditNotes';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { SunatStatusBadge } from '../components/SunatStatusBadge';
import { VoidableInvoice } from '../types';

export const VoidsPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [generalReason, setGeneralReason] = useState('');
  
  // TODO: Obtener company_id del contexto de autenticación
  const companyId = 1;
  
  const { data: voids = [], isLoading, refetch } = useSunatVoids(companyId);
  const { data: voidableInvoices = [], isLoading: loadingInvoices } = useVoidableInvoices(companyId);
  const createVoid = useCreateSunatVoid();
  const checkStatus = useCheckVoidStatus();

  const handleCreateVoid = () => {
    if (selectedInvoices.length === 0) {
      alert('Por favor seleccione al menos una factura');
      return;
    }

    if (!generalReason.trim()) {
      alert('Por favor ingrese un motivo general');
      return;
    }

    const selectedInvoiceData = voidableInvoices.filter(invoice => 
      selectedInvoices.includes(invoice.id)
    );

    const voidItems = selectedInvoiceData.map(invoice => ({
      document_type_code: invoice.document_type_code,
      series: invoice.series,
      number: invoice.number,
      reason: generalReason
    }));

    createVoid.mutate({
      company_id: companyId,
      items: voidItems
    }, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        setSelectedInvoices([]);
        setGeneralReason('');
      }
    });
  };

  const handleCheckStatus = (id: number) => {
    checkStatus.mutate(id);
  };

  const handleInvoiceSelection = (invoiceId: number) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };



  const getDocumentTypeText = (code: string) => {
    switch (code) {
      case '01':
        return 'Factura';
      case '03':
        return 'Boleta';
      default:
        return code;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comunicaciones de Baja</h1>
          <p className="text-gray-600">Gestionar anulaciones de documentos enviados a SUNAT</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Comunicación
        </Button>
      </div>

      {/* Tabla de Comunicaciones de Baja */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Comunicaciones Generadas</h2>
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando comunicaciones...</p>
          </div>
        ) : voids.length === 0 ? (
          <div className="p-6 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay comunicaciones de baja generadas</p>
            <p className="text-sm text-gray-400 mt-1">Cree una nueva comunicación para comenzar</p>
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
                    Documentos
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
                {voids.map((voidItem) => (
                  <tr key={voidItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {voidItem.batch_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(voidItem.generation_date).toLocaleDateString('es-ES')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {voidItem.items.length} documento(s)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SunatStatusBadge status={voidItem.sunat_status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {voidItem.sunat_ticket || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(voidItem.sunat_status === 'PENDING' || voidItem.sunat_status === 'SENT') && (
                        <Button
                          onClick={() => handleCheckStatus(voidItem.id)}
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

      {/* Modal para Crear Comunicación de Baja */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nueva Comunicación de Baja"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo General
            </label>
            <textarea
              value={generalReason}
              onChange={(e) => setGeneralReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
              placeholder="Ej: Error en la emisión, operación no concretada..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Documentos a Anular
            </label>
            {loadingInvoices ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Cargando documentos...</p>
              </div>
            ) : voidableInvoices.length === 0 ? (
              <div className="text-center py-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No hay documentos disponibles para anular</p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.length === voidableInvoices.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvoices(voidableInvoices.map(inv => inv.id));
                            } else {
                              setSelectedInvoices([]);
                            }
                          }}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Documento</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Cliente</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Monto</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {voidableInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedInvoices.includes(invoice.id)}
                            onChange={() => handleInvoiceSelection(invoice.id)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {getDocumentTypeText(invoice.document_type_code)} {invoice.series}-{invoice.number}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {invoice.client_name}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          S/ {invoice.total_amount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {new Date(invoice.issue_date).toLocaleDateString('es-ES')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Advertencia</h4>
                <p className="text-sm text-red-700 mt-1">
                  Esta acción anulará permanentemente los documentos seleccionados. 
                  Asegúrese de que los documentos no hayan sido entregados al cliente.
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
            onClick={handleCreateVoid}
            disabled={selectedInvoices.length === 0 || !generalReason.trim() || createVoid.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {createVoid.isPending ? 'Creando...' : 'Crear Comunicación'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
