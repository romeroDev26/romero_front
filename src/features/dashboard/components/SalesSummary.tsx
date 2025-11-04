import React from 'react';
import { ReportSummary, ReportMetrics } from '../../../types/reports';

interface SalesSummaryProps {
  summary: ReportSummary;
  metrics: ReportMetrics; // Mantenido por compatibilidad, aunque no se usa actualmente
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
          <div className="text-2xl font-bold text-blue-600">{summary.totalDocumentos}</div>
          <div className="text-sm text-gray-600">Total Documentos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            S/ {summary.totalVentas.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Ventas Totales</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            S/ {summary.totalDescuentos.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Descuentos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            S/ {summary.totalIGV.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">IGV</div>
        </div>
      </div>
    </div>
  );
};