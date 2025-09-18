import React from 'react';
import { DailySalesSummary } from '../../../services/reports.service';

interface SalesSummaryProps {
  summary: DailySalesSummary;
  isLoading?: boolean;
}

export const SalesSummary: React.FC<SalesSummaryProps> = ({ summary, isLoading = false }) => {
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Ventas</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{summary.total_invoices}</div>
          <div className="text-sm text-gray-600">Total Facturas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">S/ {summary.total_amount}</div>
          <div className="text-sm text-gray-600">Monto Total</div>
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

      {/* Resumen por método de pago */}
      <div className="mt-6">
        <h4 className="text-md font-medium text-gray-900 mb-2">Métodos de Pago</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(summary.payment_methods_summary).map(([method, amount]) => (
            <div key={method} className="text-sm">
              <span className="font-medium">{method}:</span> S/ {String(amount)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};