// src/features/dashboard/components/WelcomeContent.tsx
import React, { useState } from 'react';
import { UserGroupIcon, CubeIcon, DocumentTextIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { Ship } from 'lucide-react';
import { SalesPointSelector } from './SalesPointSelector';
import { ThreeBackground } from './ThreeBackground';
import { useCompanyInfo } from '../../../hooks/useCompanyInfo';
import { useExportReport } from '../../../hooks/useExportReport';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';

interface WelcomeContentProps {
  showHeader?: boolean;
}

export const WelcomeContent: React.FC<WelcomeContentProps> = ({ showHeader = false }) => {
  const { data: company } = useCompanyInfo();
  const businessName = company?.business_name || '';
  const tradeName = company?.trade_name || '';

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
  const today = new Date();
  const dateRange = {
    start_date: today.toISOString().split('T')[0],
    end_date: today.toISOString().split('T')[0],
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

  const features = [
    {
      icon: Ship,
      title: 'Transporte Fluvial',
      description: 'Sistema especializado en transporte de pasajeros por vía fluvial'
    },
    {
      icon: UserGroupIcon,
      title: 'Gestión de Pasajeros',
      description: 'Reservas, asignación de asientos y control de embarque'
    },
    {
      icon: CubeIcon,
      title: 'Logística de Carga',
      description: 'Administración de carga y mercancías'
    },
    {
      icon: DocumentTextIcon,
      title: 'Documentación Fiscal',
      description: 'Emisión de boletas, facturas y documentos fiscales'
    }
  ];

  return (
    <div className={showHeader ? "relative min-h-screen bg-slate-900 overflow-hidden font-sans" : ""}>
      
      {showHeader && (
        <>
          {/* Banner Section with 3D Background */}
          <div className="relative h-[35vh] min-h-[250px] w-full overflow-hidden">
            {/* 3D Background Layer */}
            <div className="absolute inset-0 z-0">
              <ThreeBackground />
            </div>
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-slate-900"></div>
            
            {/* Optional: Title overlay on banner */}
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                  Transportes <span className="text-blue-400">{tradeName}</span>
                </h1>
                <p className="text-blue-200/70 mt-2 text-sm">Sistema de Gestión Fluvial</p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="relative z-30 bg-slate-900 px-6 pb-6 -mt-8">
            <div className="w-full max-w-7xl mx-auto">
              {/* Features Grid - 4 columns */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl cursor-pointer group hover:-translate-y-0.5 hover:bg-white/15 transition-all duration-200"
                  >
                    <div className="bg-blue-500/20 w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-blue-300 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm mb-1 text-white">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-blue-100/60">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Sales Point Selector - Full Width */}
              <div className="w-full animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <SalesPointSelector className="bg-white/95 backdrop-blur-xl shadow-2xl border-white/20" />
              </div>

              {/* Export Button */}
              <div className="mt-4 flex justify-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <button
                  onClick={handleExportClick}
                  disabled={syncExporting}
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                  {syncExporting ? 'Exportando...' : 'Exportar Reporte a Excel/PDF'}
                </button>
              </div>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-blue-200/40 text-xs uppercase tracking-wider font-medium">
                  {businessName} &copy; {new Date().getFullYear()} • BUGBUSTERS
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
            <SalesPointSelector className="" />
          </div>
          <div className="mt-8 border-t border-slate-200/60 pt-6 text-center lg:text-left">
            <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">
              {businessName} &copy; {new Date().getFullYear()} • Soporte Técnico
            </p>
          </div>
        </div>
      )}

      {/* Modal de selección de formato */}
      <Modal
        isOpen={showFormatModal}
        onClose={() => setShowFormatModal(false)}
        title="Seleccionar formato de exportación"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Selecciona el formato en el que deseas exportar el reporte:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handleFormatSelection('excel')}
              variant="primary"
              className="bg-green-600 hover:bg-green-700"
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              Excel (.xlsx)
            </Button>
            <Button
              onClick={() => handleFormatSelection('pdf')}
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              PDF (.pdf)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};