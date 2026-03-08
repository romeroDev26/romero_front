// src/features/dashboard/components/WelcomeContent.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  DocumentArrowDownIcon,
  ShoppingCartIcon,
  ArchiveBoxIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useBranchOfficesData } from '../../fluvial/hooks/useBranchOfficesData';
import { useAllUserStatistics } from '../../../hooks/useUserStatistics';
import { SellerRanking } from './SellerRanking';
import UserSalesChart from './UserSalesChart';
import { useExportReport } from '../../../hooks/useExportReport';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { DateRangeFilter, DateFilterOption } from './DateRangeFilter';
import { toast } from 'react-toastify';
import type { ExportRequest } from '../../../types/exports';

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

const ACTION_CARDS = [
  {
    action: 'sales-point',
    label: 'Punto de Ventas',
    description: 'Emisión de pasajes, cambios de fecha y gestión de pasajeros en tiempo real.',
    Icon: ShoppingCartIcon,
    borderColor: 'border-t-primary',
    iconBg: 'bg-primary/10 group-hover:bg-primary',
    iconColor: 'text-primary group-hover:text-white',
  },
  {
    action: 'cargo',
    label: 'Encomiendas',
    description: 'Control de envíos, manifiestos de carga y seguimiento de paquetería fluvial.',
    Icon: ArchiveBoxIcon,
    borderColor: 'border-t-cyan-500',
    iconBg: 'bg-cyan-500/10 group-hover:bg-cyan-500',
    iconColor: 'text-cyan-600 group-hover:text-white',
  },
  {
    action: 'reservations',
    label: 'Reservas',
    description: 'Administración de cupos preventa y gestión de convenios corporativos.',
    Icon: CalendarDaysIcon,
    borderColor: 'border-t-indigo-500',
    iconBg: 'bg-indigo-500/10 group-hover:bg-indigo-500',
    iconColor: 'text-indigo-600 group-hover:text-white',
  },
];

export const WelcomeContent: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const handleQuickAction = (action: string) => {
    if (!selectedBranch) {
      toast.warning('Por favor selecciona una sucursal primero');
      return;
    }
    switch (action) {
      case 'sales-point': navigate('/fluvial/operations/sales-point'); break;
      case 'cargo': navigate('/fluvial/operations/cargo-sale'); break;
      case 'reservations': navigate('/fluvial/operations/reservations'); break;
    }
  };

  const handleRefreshStatistics = async () => {
    await queryClient.invalidateQueries({ queryKey: ['userStatistics'] });
    toast.success('Estadísticas actualizadas');
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
        metadata: { report_title: `Reporte Global por Sucursal.${format === 'excel' ? 'xlsx' : 'pdf'}` },
        sync: true,
      };
      await requestExport(payload);
    } finally {
      setSyncExporting(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
            Bienvenido al{' '}
            <span className="text-primary">Centro de Control Fluvial</span>
          </h1>
          <p className="text-slate-500 text-base lg:text-lg">
            Optimizando cada trayecto • Gestión centralizada de transporte fluvial
          </p>
        </div>

        {/* Branch selector */}
        <div className="w-full md:w-72 flex-shrink-0">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Sucursal</label>
          {branchesLoading ? (
            <div className="h-12 w-full rounded-xl bg-slate-100 animate-pulse" />
          ) : (
            <select
              value={selectedBranch}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all shadow-sm text-sm"
            >
              <option value="">Seleccionar Sucursal</option>
              {branches?.map((b) => (
                <option key={b.id} value={b.id.toString()}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      {/* ── Action Cards ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ACTION_CARDS.map(({ action, label, description, Icon, borderColor, iconBg, iconColor }) => (
          <button
            key={action}
            onClick={() => handleQuickAction(action)}
            disabled={!selectedBranch}
            className={`group bg-white/70 backdrop-blur-sm border border-white/30 p-8 rounded-xl shadow-sm hover:shadow-md transition-all text-left border-t-4 ${borderColor} ${
              !selectedBranch ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div
              className={`w-14 h-14 rounded-lg flex items-center justify-center mb-6 transition-colors ${iconBg}`}
            >
              <Icon className={`w-7 h-7 transition-colors ${iconColor}`} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-900">{label}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
          </button>
        ))}
      </section>

      {/* ── Stats section ── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-1 gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <ChartBarIcon className="w-5 h-5 text-primary" />
            Resumen de Operaciones
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshStatistics}
              disabled={statisticsLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <ArrowPathIcon className={`w-4 h-4 ${statisticsLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              onClick={() => setShowFormatModal(true)}
              disabled={syncExporting}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 text-sm"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              {syncExporting ? 'Exportando...' : 'Exportar a Excel'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ventas Hoy */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 font-medium mb-4">Ventas Hoy</p>
            <div className="flex items-end gap-2">
              {statisticsLoading ? (
                <div className="animate-pulse h-9 bg-slate-100 rounded w-24" />
              ) : (
                <>
                  <span className="text-3xl font-black text-slate-900">{todaySales}</span>
                  <span className="text-slate-400 mb-1">Tickets</span>
                </>
              )}
            </div>
          </div>

          {/* Ingresos Hoy */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 font-medium mb-4">Ingresos Hoy</p>
            <div className="flex items-end gap-2">
              {statisticsLoading ? (
                <div className="animate-pulse h-9 bg-slate-100 rounded w-36" />
              ) : (
                <>
                  <span className="text-3xl font-black text-slate-900">
                    S/ {todayRevenue.toLocaleString('es-PE')}
                  </span>
                  <span className="text-slate-400 mb-1">Total</span>
                </>
              )}
            </div>
          </div>

          {/* Ventas del Mes */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 font-medium mb-4">Ventas del Mes</p>
            <div className="flex items-end gap-2">
              {statisticsLoading ? (
                <div className="animate-pulse h-9 bg-slate-100 rounded w-24" />
              ) : (
                <>
                  <span className="text-3xl font-black text-slate-900">{monthSales}</span>
                  <span className="text-slate-400 mb-1">Tickets</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Chart + Ranking grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <UserSalesChart />
        </div>
        <div className="lg:col-span-1">
          <SellerRanking />
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 pt-6 text-center">
        <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">
          Sistema de Transportes &copy; {new Date().getFullYear()} • BUGBUSTERS
        </p>
      </footer>

      {/* ── Export Modal ── */}
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
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
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
                  Desde {startDate ? startDate.toISOString().split('T')[0] : '--'} hasta{' '}
                  {endDate ? endDate.toISOString().split('T')[0] : '--'}
                </div>
              </div>
            </button>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button onClick={() => setShowFormatModal(false)} variant="secondary">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};