// src/features/dashboard/components/WelcomeContent.tsx
import React, { useState } from 'react';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { SalesPointSelector } from './SalesPointSelector';
import { SellerRanking } from './SellerRanking';
import { useExportReport } from '../../../hooks/useExportReport';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { DateRangeFilter, DateFilterOption } from './DateRangeFilter';
import type { ExportRequest } from '../../../types/exports';

interface WelcomeContentProps {
  showHeader?: boolean;
}

export const WelcomeContent: React.FC<WelcomeContentProps> = ({ showHeader = false }) => {
  const [syncExporting, setSyncExporting] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);

  // Hook para exportaciones
  const { requestExport } = useExportReport({
    onSuccess: () => {},
    onError: () => {},
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
  // Inicializar fechas como objetos Date en zona de Perú (00:00)
  const getPeruTodayDate = () => {
    const parts = peruDate.split('-').map((p) => parseInt(p, 10));
    // parts: [YYYY, MM, DD]
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  const [startDate, setStartDate] = React.useState<Date | null>(getPeruTodayDate());
  const [endDate, setEndDate] = React.useState<Date | null>(getPeruTodayDate());
  const [filterOption, setFilterOption] = React.useState<DateFilterOption>('today');

  const canExportDates = filterOption !== 'custom' || (startDate && endDate);

  const handleExportClick = () => {
    setShowFormatModal(true);
  };

  const handleFormatSelection = async (format: 'excel') => {
    if (!startDate || !endDate) {
      return;
    }

    setShowFormatModal(false);
    setSyncExporting(true);
    
    try {
      const payload: ExportRequest = {
        category: 'branch_global',
        format: format,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        filters: {
          include_vessel_data: false,
        },
        metadata: {
          report_title: `Reporte Global por Sucursal.${format === 'excel' ? 'xlsx' : 'pdf'}`,
        },
        sync: true,
      };

      await requestExport(payload);
    } catch (error) {
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
        title="Exportar Reporte"
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Selecciona el rango de fechas y el formato para exportar el reporte.
          </p>

          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => {
              setStartDate(s);
              setEndDate(e);
            }}
            selectedOption={filterOption}
            onOptionChange={(opt) => setFilterOption(opt)}
          />

          <div className="flex justify-center">
            <button
              onClick={() => handleFormatSelection('excel')}
              disabled={syncExporting || !canExportDates}
              className="flex items-center justify-center w-full max-w-md px-6 py-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg hover:bg-green-100 hover:border-green-300 disabled:bg-gray-50 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200 group"
            >
              <DocumentArrowDownIcon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="font-semibold">Excel (.xlsx)</div>
                <div className="text-sm opacity-75">
                  Desde {startDate ? startDate.toISOString().split('T')[0] : '--'} hasta {endDate ? endDate.toISOString().split('T')[0] : '--'}
                </div>
              </div>
            </button>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button onClick={() => setShowFormatModal(false)} variant="secondary">Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};