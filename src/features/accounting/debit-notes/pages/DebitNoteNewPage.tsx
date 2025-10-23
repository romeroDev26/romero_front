// src/features/accounting/debit-notes/pages/DebitNoteNewPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { useVoidableInvoices } from '../../credit-notes/hooks/useCreditNotes';
import { VoidableInvoice } from '../../types';

export const DebitNoteNewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [companyId] = useState(1); // TODO: Obtener del contexto de usuario
  const [searchTerm, setSearchTerm] = useState('');
  
  // Verificar si se pasó un invoice_id específico
  const invoiceIdParam = searchParams.get('invoice_id');
  
  const { data: voidableInvoices, isLoading } = useVoidableInvoices(companyId);

  // Si se pasó un invoice_id específico, navegar directamente al formulario
  useEffect(() => {
    if (invoiceIdParam && voidableInvoices) {
      const selectedInvoice = voidableInvoices.find(inv => inv.id === parseInt(invoiceIdParam));
      if (selectedInvoice) {
        handleSelectInvoice(selectedInvoice);
      }
    }
  }, [invoiceIdParam, voidableInvoices]);

  const filteredInvoices = voidableInvoices?.filter((invoice) =>
    invoice.series.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.number.toString().includes(searchTerm) ||
    invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSelectInvoice = (invoice: VoidableInvoice) => {
    // Validar que tenemos los datos necesarios
    if (!invoice.client_id || invoice.client_id === 0) {
      alert('Error: La factura seleccionada no tiene un cliente válido asociado. No se puede crear una nota de débito.');
      return;
    }

    // Usar los datos que ya tenemos disponibles
    const affectedInvoice = {
      id: invoice.id,
      series: invoice.series,
      number: invoice.number,
      document_type_code: invoice.document_type_code,
      company_id: companyId,
      client: {
        id: invoice.client_id,
        name: invoice.client_name,
        doc_number: '', // Este campo puede estar vacío por ahora
      },
      client_id: invoice.client_id,
      client_name: invoice.client_name, // Agregar este campo para compatibilidad
      total_payable: parseFloat(invoice.total_payable),
      issue_date: invoice.issue_date,
    };

    // Usar sessionStorage como backup
    sessionStorage.setItem('debitNoteAffectedInvoice', JSON.stringify(affectedInvoice));
    
    navigate('/accounting/debit-notes/create', { 
      state: { affectedInvoice } 
    });
  };  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => navigate('/accounting/debit-notes')}
            className="mr-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nueva Nota de Débito</h1>
            <p className="text-gray-600">Selecciona la factura para agregar cargos adicionales</p>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar factura
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por serie, número o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Facturas */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Facturas Disponibles para Agregar Cargos
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Solo se muestran facturas que pueden recibir cargos adicionales
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando facturas...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center">
            {voidableInvoices?.length === 0 ? (
              <div>
                <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay facturas disponibles
                </h3>
                <p className="text-gray-600">
                  No se encontraron facturas disponibles para generar notas de débito.
                </p>
              </div>
            ) : (
              <div>
                <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron resultados
                </h3>
                <p className="text-gray-600">
                  No hay facturas que coincidan con tu búsqueda.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => {
              const isCancelled = invoice.business_status === 'CANCELLED';
              
              return (
                <div
                  key={invoice.id}
                  className={`p-6 transition-colors ${
                    isCancelled 
                      ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                      : 'hover:bg-gray-50 cursor-pointer'
                  }`}
                  onClick={() => !isCancelled && handleSelectInvoice(invoice)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className={`text-sm font-medium ${isCancelled ? 'text-gray-500' : 'text-gray-900'}`}>
                            {invoice.series}-{String(invoice.number).padStart(8, '0')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {invoice.document_type_code === '01' ? 'Factura' : 'Boleta'}
                            {isCancelled && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                CANCELADO
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${isCancelled ? 'text-gray-500' : 'text-gray-900'}`}>
                            {invoice.client_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Emitida el {formatDate(invoice.issue_date)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${isCancelled ? 'text-gray-500' : 'text-gray-900'}`}>
                            {formatCurrency(invoice.total_payable)}
                          </div>
                          <div className="text-sm text-gray-500">Total</div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6">
                      <Button 
                        size="sm" 
                        className={`bg-orange-600 hover:bg-orange-700 ${isCancelled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isCancelled}
                      >
                        {isCancelled ? 'No disponible' : 'Agregar Cargos'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-orange-800">
              Información sobre Notas de Débito
            </h3>
            <div className="mt-2 text-sm text-orange-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Las notas de débito se utilizan para aplicar cargos adicionales a una factura existente</li>
                <li>Las facturas marcadas como "CANCELADO" no pueden recibir cargos adicionales</li>
                <li>Puedes incluir intereses por mora, penalidades, recargos u otros conceptos no incluidos inicialmente</li>
                <li>El documento será enviado automáticamente a SUNAT para su procesamiento</li>
                <li>Podrás descargar el PDF una vez que SUNAT lo procese</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
