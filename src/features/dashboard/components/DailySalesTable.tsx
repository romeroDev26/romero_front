import React, { useState } from 'react';
import { DailySalesItem } from '../../../services/reports.service';

interface DailySalesTableProps {
  items: DailySalesItem[];
  isLoading?: boolean;
}

export const DailySalesTable: React.FC<DailySalesTableProps> = ({ items, isLoading = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calcular estadísticas de notas
  const creditNotes = items.filter(item => item.document_type === 'Nota de Crédito');
  const debitNotes = items.filter(item => item.document_type === 'Nota de Débito');
  const totalCreditAmount = creditNotes.reduce((sum, item) => sum + parseFloat(item.total_amount || '0'), 0);
  const totalDebitAmount = debitNotes.reduce((sum, item) => sum + parseFloat(item.total_amount || '0'), 0);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Detalle de Ventas Diarias</h3>
        
        {/* Resumen de notas */}
        {(creditNotes.length > 0 || debitNotes.length > 0) && (
          <div className="flex gap-3 text-sm">
            {creditNotes.length > 0 && (
              <div className="px-3 py-1 bg-red-50 text-red-700 rounded-md border border-red-200">
                <span className="font-semibold">{creditNotes.length}</span> NC 
                <span className="ml-1 font-medium">S/ {totalCreditAmount.toFixed(2)}</span>
              </div>
            )}
            {debitNotes.length > 0 && (
              <div className="px-3 py-1 bg-green-50 text-green-700 rounded-md border border-green-200">
                <span className="font-semibold">{debitNotes.length}</span> ND 
                <span className="ml-1 font-medium">S/ {totalDebitAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Documento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ruta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendedor
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((item, index) => {
              const isCreditNote = item.document_type === 'Nota de Crédito';
              const isDebitNote = item.document_type === 'Nota de Débito';
              const isAdjustment = item.payment_method === 'AJUSTE';
              const amount = parseFloat(item.total_amount || '0');
              
              return (
                <tr 
                  key={`${item.invoice_id}-${index}`} 
                  className={`hover:bg-gray-50 ${isCreditNote ? 'bg-red-50/30' : isDebitNote ? 'bg-green-50/30' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(item.issue_date).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isCreditNote 
                        ? 'bg-red-100 text-red-800 border border-red-200' 
                        : isDebitNote 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isCreditNote ? 'NC' : isDebitNote ? 'ND' : item.document_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {item.series}-{item.correlative}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.client_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.origin_port && item.destination_port 
                      ? `${item.origin_port} → ${item.destination_port}` 
                      : item.service_description || '-'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    isCreditNote 
                      ? 'text-red-600' 
                      : isDebitNote 
                      ? 'text-green-600' 
                      : 'text-gray-900'
                  }`}>
                    {amount < 0 && !isCreditNote ? '-' : ''}S/ {Math.abs(amount).toFixed(2)}
                    {isCreditNote && <span className="ml-1 text-xs">(descuento)</span>}
                    {isDebitNote && <span className="ml-1 text-xs">(aumento)</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{item.seller_name}</span>
                      {isAdjustment && (
                        <span className="text-xs text-orange-600 font-semibold">AJUSTE</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700">
            Mostrando {startIndex + 1} a {Math.min(endIndex, items.length)} de {items.length} resultados
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};