import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Ship, Users } from 'lucide-react';
import { reportsService } from '../../../services/reports.service';
import { VesselReportItem } from '../../../types/tripSalesReport';
import { DateRangeFilter, DateFilterOption } from './DateRangeFilter';
import { OperationsIncomeSummary } from './OperationsIncomeSummary';

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

function getMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}

function getOccupancyColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-600 dark:text-green-400';
  if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

export const VesselsRangeReport: React.FC = () => {
  const initialRange = getMonthRange();
  const [startDate, setStartDate] = useState<Date>(initialRange.start);
  const [endDate, setEndDate] = useState<Date>(initialRange.end);
  const [filterOption, setFilterOption] = useState<DateFilterOption>('thisMonth');

  const dateRange = useMemo(
    () => ({
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    }),
    [startDate, endDate],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['vessels-report', dateRange.start_date, dateRange.end_date],
    queryFn: () => reportsService.getVesselsList(dateRange),
    enabled: Boolean(startDate && endDate),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const totals = useMemo(() => {
    const items = data?.items ?? [];
    return {
      trip_count: items.reduce((sum, item) => sum + item.operations.trip_count, 0),
      passengers_count: items.reduce((sum, item) => sum + item.operations.passengers_count, 0),
      total_revenue: items.reduce((sum, item) => sum + item.sales.total_revenue, 0),
    };
  }, [data]);

  const handleDateChange = (newStartDate: Date | null, newEndDate: Date | null) => {
    if (newStartDate) setStartDate(newStartDate);
    if (newEndDate) setEndDate(newEndDate);
  };

  return (
    <div className="space-y-6">
      <div className="bg-dm-bg-primary rounded-xl shadow-lg border border-dm-border-primary overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-700 to-blue-700 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Ship className="h-6 w-6" />
            Reporte por Embarcación
          </h2>
          <p className="text-cyan-100 text-sm mt-1">
            Ventas y ocupación agregadas por lancha en el período seleccionado
          </p>
        </div>

        <div className="px-6 py-4 bg-dm-bg-secondary border-b border-dm-border-primary">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onDateChange={handleDateChange}
            selectedOption={filterOption}
            onOptionChange={setFilterOption}
          />
        </div>

        {data?.income_summary && <OperationsIncomeSummary summary={data.income_summary} />}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-b border-dm-border-primary bg-dm-bg-secondary/40">
          <SummaryCard label="Viajes operados" value={String(totals.trip_count)} />
          <SummaryCard label="Pasajeros vendidos" value={String(totals.passengers_count)} />
          <SummaryCard
            label="Ingresos en viajes"
            value={formatCurrency(totals.total_revenue)}
            highlight
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          No se pudo cargar el reporte por embarcación.
        </div>
      )}

      {!isLoading && !error && (data?.items.length ?? 0) === 0 && (
        <div className="rounded-xl border border-dm-border-primary bg-dm-bg-primary px-6 py-12 text-center text-dm-text-muted">
          No hay operaciones de embarcaciones en este período.
        </div>
      )}

      {!isLoading && !error && (data?.items.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {data!.items.map((item) => (
            <VesselCard key={item.vessel.vessel_id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

function SummaryCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-dm-border-primary bg-dm-bg-primary px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-dm-text-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold ${highlight ? 'text-green-600 dark:text-green-400' : 'text-dm-text-primary'}`}>
        {value}
      </p>
    </div>
  );
}

function VesselCard({ item }: { item: VesselReportItem }) {
  const breakdown = item.sales.service_breakdown;

  return (
    <div className="rounded-xl border border-dm-border-primary bg-dm-bg-primary p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-dm-text-primary">{item.vessel.vessel_name}</h3>
          <p className="text-sm text-dm-text-muted mt-1">
            {item.operations.trip_count} viaje{item.operations.trip_count === 1 ? '' : 's'} en el período
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatCurrency(item.sales.total_revenue)}
          </p>
          <p className="text-xs text-dm-text-muted">Ingresos totales</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Metric
          icon={<Users className="h-4 w-4" />}
          label="Ocupación prom."
          value={`${item.operations.avg_occupancy.toFixed(1)}%`}
          valueClass={getOccupancyColor(item.operations.avg_occupancy)}
        />
        <Metric
          icon={<Users className="h-4 w-4" />}
          label="Pasajeros"
          value={String(item.operations.passengers_count)}
        />
        <Metric
          icon={<DollarSign className="h-4 w-4" />}
          label="Ticket prom."
          value={formatCurrency(item.operations.average_ticket)}
        />
      </div>

      <div className="rounded-lg bg-dm-bg-secondary/60 border border-dm-border-primary p-3 space-y-2">
        <BreakdownRow label="Pasajes" count={breakdown.PASAJES.count} revenue={breakdown.PASAJES.revenue} />
        <BreakdownRow label="Encomiendas" count={breakdown.ENCOMIENDAS.count} revenue={breakdown.ENCOMIENDAS.revenue} />
        <BreakdownRow label="Carga" count={breakdown.CARGA_GENERAL.count} revenue={breakdown.CARGA_GENERAL.revenue} />
        {breakdown.EXCESO_EQUIPAJE.count > 0 && (
          <BreakdownRow
            label="Exceso equipaje"
            count={breakdown.EXCESO_EQUIPAJE.count}
            revenue={breakdown.EXCESO_EQUIPAJE.revenue}
          />
        )}
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  valueClass = 'text-dm-text-primary',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border border-dm-border-primary bg-dm-bg-secondary/50 px-3 py-2">
      <div className="flex items-center gap-1 text-dm-text-muted mb-1">{icon}<span className="text-[11px]">{label}</span></div>
      <p className={`text-sm font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

function BreakdownRow({
  label,
  count,
  revenue,
}: {
  label: string;
  count: number;
  revenue: number;
}) {
  if (count === 0 && revenue === 0) return null;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-dm-text-secondary">{label} ({count})</span>
      <span className="font-medium text-dm-text-primary">{formatCurrency(revenue)}</span>
    </div>
  );
}
