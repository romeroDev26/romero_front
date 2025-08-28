import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { DataTable, Column } from '../../../components/common/DataTable';
import { Input } from '../../../components/common/Input';
import { useSunatVoids, useCreateSunatVoid, useCheckVoidStatus, useVoidableInvoices } from '../hooks/useSunatVoids';
import { InvoiceSelectorModal } from '../components/InvoiceSelectorModal';
import { SunatStatusBadge } from '../components/SunatStatusBadge';
import { VoidDocument, VoidDocumentItem, VoidableInvoice } from '../types';

export const VoidsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemsToVoid, setItemsToVoid] = useState<Omit<VoidDocumentItem, 'reason'>[]>([]);
  const [reason, setReason] = useState('');
  const companyId = 1;

  const { data: voids = [], isLoading: isLoadingVoids, refetch } = useSunatVoids(companyId);
  const { data: voidableInvoices = [], isLoading: isLoadingVoidableInvoices } = useVoidableInvoices(companyId);
  const { mutate: createVoid, isPending: isCreatingVoid } = useCreateSunatVoid();
  const { mutate: checkStatus, isPending: isCheckingStatus } = useCheckVoidStatus();

  const handleSelectInvoices = (selectedItems: Omit<VoidDocumentItem, 'reason'>[]) => {
    setItemsToVoid(selectedItems);
    setIsModalOpen(false);
  };

  // Función para obtener el nombre del tipo de documento
  const getDocumentTypeName = (documentTypeCode: string) => {
    const documentTypes: Record<string, string> = {
      '01': 'Factura',
      '03': 'Boleta',
      '07': 'Nota de Crédito',
      '08': 'Nota de Débito'
    };
    return documentTypes[documentTypeCode] || documentTypeCode;
  };

  const handleCreateVoid = () => {
    if (itemsToVoid.length === 0) {
      toast.warn("Primero debe cargar las facturas a anular usando el botón 'Seleccionar Facturas'.");
      return;
    }
    if (!reason.trim()) {
      toast.warn("Debe ingresar un motivo para la baja.");
      return;
    }
    createVoid({
      company_id: companyId,
      generation_date: format(new Date(), 'yyyy-MM-dd'),
      items: itemsToVoid.map(item => ({ ...item, reason })),
    }, {
      onSuccess: () => {
        setItemsToVoid([]);
        setReason('');
        refetch();
      }
    });
  };

  const columns: Column<VoidDocument>[] = [
    {
      key: 'identifier',
      header: 'Lote',
      accessor: (item) => item.identifier,
    },
    {
      key: 'generation_date',
      header: 'Fecha',
      accessor: (item) => format(parseISO(item.generation_date), 'dd/MM/yyyy')
    },
    {
      key: 'documents',
      header: 'Documentos',
      accessor: (item) => `${item.items.length} documento(s)`
    },
    {
      key: 'sunat_status',
      header: 'Estado',
      accessor: (item) => <SunatStatusBadge status={item.sunat_status} />
    },
    {
      key: 'sunat_ticket',
      header: 'Ticket',
      accessor: (item) => item.sunat_ticket || '-'
    },
  ];

  // Columnas para la tabla de documentos anulables
  const voidableInvoicesColumns: Column<VoidableInvoice>[] = [
    {
      key: 'document_type',
      header: 'Tipo de Comprobante',
      accessor: (item) => getDocumentTypeName(item.document_type_code)
    },
    {
      key: 'series_number',
      header: 'Serie y Número',
      accessor: (item) => `${item.series}-${item.number}`
    },
    {
      key: 'client_name',
      header: 'Cliente',
      accessor: (item) => item.client_name
    },
    {
      key: 'issue_date',
      header: 'Fecha de Emisión',
      accessor: (item) => format(parseISO(item.issue_date), 'dd/MM/yyyy')
    },
    {
      key: 'total_payable',
      header: 'Total',
      accessor: (item) => `S/ ${item.total_payable}`
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Comunicaciones de Baja</h1>
        <p className="text-gray-500">Anulación de facturas informadas a SUNAT.</p>
      </div>
      {/* SECCIÓN PARA CREAR NUEVA COMUNICACIÓN */}
      <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
        <h2 className="text-lg font-semibold">Nueva Comunicación de Baja</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Motivo General de la Baja*"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Error en los datos del cliente"
            />
          </div>
          <div className="self-end">
            <Button variant="outline" onClick={() => setIsModalOpen(true)}>
              Seleccionar Facturas ({itemsToVoid.length})
            </Button>
          </div>
        </div>
        {itemsToVoid.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-2">Facturas a anular:</h3>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {itemsToVoid.map(item => (
                <li key={`${item.series}-${item.number}`}>{item.series}-{item.number}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-end">
          <Button variant="danger" onClick={handleCreateVoid} isLoading={isCreatingVoid} disabled={itemsToVoid.length === 0 || !reason.trim()}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Crear y Enviar Comunicación
          </Button>
        </div>
      </div>
      {/* SECCIÓN PARA LISTAR DOCUMENTOS ANULABLES */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Documentos Disponibles para Anulación</h2>
        <p className="text-gray-600 mb-4">Lista de documentos aceptados por SUNAT que pueden ser dados de baja.</p>
        <DataTable
          columns={voidableInvoicesColumns}
          data={voidableInvoices}
          isLoading={isLoadingVoidableInvoices}
          keyExtractor={(item) => item.id}
          emptyMessage="No hay documentos disponibles para anulación"
        />
      </div>

      {/* SECCIÓN PARA LISTAR COMUNICACIONES EXISTENTES */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Comunicaciones Generadas</h2>
        <DataTable
          columns={columns}
          data={voids}
          isLoading={isLoadingVoids}
          keyExtractor={(item) => item.id}
          customActions={(item) => (
            (item.sunat_status === 'PENDING' || item.sunat_status === 'SENT') && (
              <Button size="sm" variant="outline" onClick={() => checkStatus(item.id)} isLoading={isCheckingStatus}>
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Consultar
              </Button>
            )
          )}
        />
      </div>
      <InvoiceSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        companyId={companyId}
  onSubmit={handleSelectInvoices}
        isSubmitting={false}
  redirectToAnnulOnSelect={true}
      />
    </div>
  );
};
