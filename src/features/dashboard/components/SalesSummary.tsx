import React from 'react';
import { DailySalesSummary, DailySalesItem } from '../../../services/reports.service';
import { getPaymentMethodName } from '../../../utils/paymentMethods';

interface SalesSummaryProps {
  summary: DailySalesSummary;
  items?: DailySalesItem[];
  isLoading?: boolean;
}

export const SalesSummary: React.FC<SalesSummaryProps> = ({ summary, items = [], isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calcular estadísticas de notas de crédito y débito
  const creditNotes = items.filter(item => item.document_type === 'Nota de Crédito');
  const debitNotes = items.filter(item => item.document_type === 'Nota de Débito');
  const totalCreditAmount = creditNotes.reduce((sum, item) => sum + parseFloat(item.total_amount || '0'), 0);
  const totalDebitAmount = debitNotes.reduce((sum, item) => sum + parseFloat(item.total_amount || '0'), 0);

  // Agrupar notas de crédito por vendedor
  const creditNotesBySeller = creditNotes.reduce((acc, item) => {
    const seller = item.seller_name;
    if (!acc[seller]) {
      acc[seller] = { count: 0, amount: 0 };
    }
    acc[seller].count++;
    acc[seller].amount += parseFloat(item.total_amount || '0');
    return acc;
  }, {} as Record<string, { count: number; amount: number }>);

  // Agrupar notas de débito por vendedor
  const debitNotesBySeller = debitNotes.reduce((acc, item) => {
    const seller = item.seller_name;
    if (!acc[seller]) {
      acc[seller] = { count: 0, amount: 0 };
    }
    acc[seller].count++;
    acc[seller].amount += parseFloat(item.total_amount || '0');
    return acc;
  }, {} as Record<string, { count: number; amount: number }>);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Ventas</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{summary.total_invoices}</div>
          <div className="text-sm text-gray-600">Total Facturas/Boletas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">S/ {summary.total_amount}</div>
          <div className="text-sm text-gray-600">Monto Total Neto</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">S/ {summary.total_discount}</div>
          <div className="text-sm text-gray-600">Descuentos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">S/ {summary.total_tax}</div>
          <div className="text-sm text-gray-600">Impuestos</div>
        </div>
      </div>

      {/* Sección de Notas de Crédito y Débito */}
      {(creditNotes.length > 0 || debitNotes.length > 0) && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-3">Ajustes y Notas</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Notas de Crédito */}
            {creditNotes.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-semibold text-red-800">Notas de Crédito</h5>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                    {creditNotes.length} nota{creditNotes.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-2xl font-bold text-red-600 mb-3">
                  S/ {Math.abs(totalCreditAmount).toFixed(2)}
                </div>
                {Object.keys(creditNotesBySeller).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-red-700 mb-1">Por vendedor:</p>
                    {Object.entries(creditNotesBySeller).map(([seller, data]) => (
                      <div key={seller} className="flex justify-between text-xs text-red-700">
                        <span className="truncate mr-2">{seller}</span>
                        <span className="font-medium whitespace-nowrap">
                          {data.count} ({Math.abs(data.amount).toFixed(2)})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notas de Débito */}
            {debitNotes.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-semibold text-green-800">Notas de Débito</h5>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    {debitNotes.length} nota{debitNotes.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-2xl font-bold text-green-600 mb-3">
                  +S/ {totalDebitAmount.toFixed(2)}
                </div>
                {Object.keys(debitNotesBySeller).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-green-700 mb-1">Por vendedor:</p>
                    {Object.entries(debitNotesBySeller).map(([seller, data]) => (
                      <div key={seller} className="flex justify-between text-xs text-green-700">
                        <span className="truncate mr-2">{seller}</span>
                        <span className="font-medium whitespace-nowrap">
                          {data.count} (+{data.amount.toFixed(2)})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resumen por método de pago */}
      <div className="mt-6">
        <h4 className="text-md font-medium text-gray-900 mb-2">Métodos de Pago</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(summary.payment_methods_summary).map(([method, amount]) => (
            <div key={method} className="text-sm">
              <span className="font-medium">{getPaymentMethodName(method)}:</span> S/ {String(amount)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};