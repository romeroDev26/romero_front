// src/features/dashboard/components/WelcomeContent.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { FileSpreadsheet } from 'lucide-react';
import { useBranchOfficesData } from '../../fluvial/hooks/useBranchOfficesData';
import { useAllUserStatistics } from '../../../hooks/useUserStatistics';
import UserSalesChart from './UserSalesChart';
import { SellerRanking } from './SellerRanking';
import { useExportReport } from '../../../hooks/useExportReport';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { DateRangeFilter, DateFilterOption } from './DateRangeFilter';
import { toast } from '@/utils/sileo-toast';
import type { ExportRequest } from '../../../types/exports';
import {
  WelcomeHero,
  QuickActions,
  KpiCards,
  AnalyticsSection,
  WelcomeFooter,
  type QuickActionKey,
} from './welcome';

const getPeruDateString = (): string => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

const getPeruTodayDate = (): Date => {
  const parts = getPeruDateString().split('-').map((p) => parseInt(p, 10));
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

export const WelcomeContent: React.FC = () => {
  const navigate = useNavigate();

  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [syncExporting, setSyncExporting] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(getPeruTodayDate());
  const [endDate, setEndDate] = useState<Date | null>(getPeruTodayDate());
  const [filterOption, setFilterOption] = useState<DateFilterOption>('today');

  const { data: branches, isLoading: branchesLoading } = useBranchOfficesData();
  const { today, currentMonth, isLoading: statisticsLoading } = useAllUserStatistics();
  const { requestExport } = useExportReport({ onSuccess: () => {}, onError: () => {} });

  // Cargar sucursal guardada
  useEffect(() => {
    const saved = localStorage.getItem('selectedSalesBranch');
    if (saved) {
      try {
        const branch = JSON.parse(saved);
        setSelectedBranch(branch.id?.toString() || '');
      } catch {
        // ignore
      }
    }
  }, []);

  const todaySales = today.data?.total_sales || 0;
  const todayRevenue = today.data?.total_revenue_net ?? today.data?.total_revenue ?? 0;
  const monthSales = currentMonth.data?.total_sales || 0;

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId);
    if (branchId && branches) {
      const branch = branches.find((b) => b.id.toString() === branchId);
      if (branch) {
        localStorage.setItem('selectedSalesBranch', JSON.stringify(branch));
        toast.success(`Sucursal ${branch.name} seleccionada`);
      }
    }
  };

  const handleQuickAction = (action: QuickActionKey) => {
    if (!selectedBranch) {
      toast.warning('Por favor selecciona una sucursal primero');
      return;
    }
    switch (action) {
      case 'sales-point':
        navigate('/fluvial/operations/sales-point');
        break;
      case 'cargo':
        navigate('/fluvial/operations/cargo-sale');
        break;
      case 'quick-sale':
        navigate('/fluvial/operations/quick-sales');
        break;
      case 'reservations':
        navigate('/fluvial/operations/reservations');
        break;
      case 'manifests':
        navigate('/fluvial/operations/manifests');
        break;
    }
  };

  const canExportDates = filterOption !== 'custom' || (startDate && endDate);

  const handleFormatSelection = async (format: 'excel') => {
    if (!startDate || !endDate) return;
    setShowFormatModal(false);
    setSyncExporting(true);
    try {
      const payload: ExportRequest = {
        category: 'branch_global',
        format,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        filters: { include_vessel_data: false },
        metadata: {
          report_title: `Reporte Global por Sucursal.${format === 'excel' ? 'xlsx' : 'pdf'}`,
        },
        sync: true,
      };
      await requestExport(payload);
    } finally {
      setSyncExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 px-1 md:px-2">
      <WelcomeHero
        branchesLoading={branchesLoading}
        branches={branches}
        selectedBranch={selectedBranch}
        onBranchChange={handleBranchChange}
      />

      <QuickActions selectedBranch={selectedBranch} onActionClick={handleQuickAction} />

      <KpiCards
        statisticsLoading={statisticsLoading}
        todaySales={todaySales}
        todayRevenue={todayRevenue}
        monthSales={monthSales}
      />

      <AnalyticsSection
        chart={(
          <div className="space-y-4">
            <UserSalesChart />
            <div className="mx-auto w-full max-w-xl flex flex-col items-center gap-3 text-center pt-4 border-t border-dm-border-primary">
              <p className="text-sm text-dm-text-secondary max-w-lg">
                Exporta tu rendimiento de ventas en formato Excel para seguimiento y análisis.
              </p>
              <button
                onClick={() => setShowFormatModal(true)}
                disabled={syncExporting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#217346] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1a5c38] disabled:opacity-60"
              >
                <FileSpreadsheet className="h-4 w-4" />
                {syncExporting ? 'Exportando...' : 'Exportar a Excel'}
              </button>
            </div>
          </div>
        )}
        ranking={<SellerRanking />}
      />

      <WelcomeFooter />

      {/* ── Export Modal ── */}
      <Modal
        isOpen={showFormatModal}
        onClose={() => setShowFormatModal(false)}
        title="Exportar Reporte"
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <p className="text-dm-text-secondary">
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
              className="flex items-center justify-center w-full max-w-md px-6 py-4 bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 hover:border-green-300 dark:hover:border-green-700 disabled:bg-dm-bg-secondary disabled:border-dm-border-primary disabled:text-dm-text-muted disabled:cursor-not-allowed transition-all duration-200 group"
            >
              <DocumentArrowDownIcon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="font-semibold">Excel (.xlsx)</div>
                <div className="text-sm opacity-75">
                  Desde {startDate ? startDate.toISOString().split('T')[0] : '--'} hasta{' '}
                  {endDate ? endDate.toISOString().split('T')[0] : '--'}
                </div>
              </div>
            </button>
          </div>
          <div className="flex justify-end pt-4 border-t border-dm-border-primary">
            <Button onClick={() => setShowFormatModal(false)} variant="secondary">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
