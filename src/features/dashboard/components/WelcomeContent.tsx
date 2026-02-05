// src/features/dashboard/components/WelcomeContent.tsx
import React, { useState } from 'react';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { SalesPointSelector } from './SalesPointSelector';
import { SellerRanking } from './SellerRanking';
import { useExportReport } from '../../../hooks/useExportReport';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';

interface WelcomeContentProps {
  showHeader?: boolean;
}

export const WelcomeContent: React.FC<WelcomeContentProps> = ({ showHeader = false }) => {
  const [syncExporting, setSyncExporting] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);

  // Hook para exportaciones
  const { requestExport } = useExportReport({
    onSuccess: () => {
      console.log('Export completed successfully!');
    },
    onError: (error) => {
      console.error('Export failed:', error);
    },
  });

  // Calcular rango de fechas (día actual)
  // Calcular rango de fechas (día actual) en zona horaria de Perú (America/Lima)
  const getPeruDateString = (): string => {
    try {
      // 'en-CA' produce el formato YYYY-MM-DD en la mayoría de entornos
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
    } catch (e) {
      // Fallback: usar ISO local si Intl no está disponible
      return new Date().toISOString().split('T')[0];
    }
  };

  const peruDate = getPeruDateString();
  const dateRange = {
    start_date: peruDate,
    end_date: peruDate,
  };

  const handleExportClick = () => {
    setShowFormatModal(true);
  };

  const handleFormatSelection = async (format: 'excel' | 'pdf') => {
    setShowFormatModal(false);
    setSyncExporting(true);
    
    try {
      await requestExport({
        category: 'branch_global',
        format: format,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        filters: {
          include_vessel_data: false
        },
        metadata: {
          report_title: `Reporte Global por Sucursal.${format === 'excel' ? 'xlsx' : 'pdf'}`
        },
        sync: true
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setSyncExporting(false);
    }
  };

  return (
    <div className={showHeader ? "relative w-full bg-white font-sans" : ""}>
      
      {showHeader && (
        <>
          {/* Banner Section */}
          <div className="relative py-6 md:py-12 w-full bg-white">
            {/* Title Section */}
            <div className="flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-gray-800">
                  <span className="text-blue-600">Sistema de Transportes</span>
                </h1>
                <p className="text-gray-500 mt-2 text-sm">Sistema de Gestión Fluvial</p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="relative bg-white px-0 sm:px-4 md:px-6 pb-6">
            <div className="w-full max-w-7xl mx-auto">
              {/* Sales Point Selector - Full Width */}
              <div className="w-full animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <SalesPointSelector />
              </div>

              {/* Export Button */}
              <div className="mt-4 flex justify-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <button
                  onClick={handleExportClick}
                  disabled={syncExporting}
                  className="w-full md:w-auto justify-center inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                  {syncExporting ? 'Exportando...' : 'Exportar Reporte a Excel'}
                </button>
              </div>

              {/* Ranking de Vendedores */}
              <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
                <SellerRanking />
              </div>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">
                  Sistema de Transportes &copy; {new Date().getFullYear()} • BUGBUSTERS
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Non-header mode */}
      {!showHeader && (
        <div className="space-y-8">
          <div className="w-full">
            <SalesPointSelector />
          </div>
          <div className="mt-8 border-t border-slate-200/60 pt-6 text-center lg:text-left">
            <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">
              Sistema de Transportes &copy; {new Date().getFullYear()} • Soporte Técnico
            </p>
          </div>
        </div>
      )}

      {/* Modal de confirmación de exportación */}
      <Modal
        isOpen={showFormatModal}
        onClose={() => setShowFormatModal(false)}
        title="Exportar a Excel"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Deseas exportar el reporte a Excel?
          </p>
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setShowFormatModal(false)}
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => handleFormatSelection('excel')}
              variant="primary"
              className="bg-green-600 hover:bg-green-700"
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              Exportar a Excel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};