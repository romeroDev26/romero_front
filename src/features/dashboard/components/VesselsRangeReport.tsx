import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, DollarSign, Ship, Users } from 'lucide-react';
import { reportsService } from '../../../services/reports.service';
import {
  VesselAuditDocument,
  VesselDocumentSummary,
  VesselNamedBreakdownItem,
  VesselPaymentMethodItem,
  VesselReportItem,
  VesselReportSummaryItem,
  VesselServiceBreakdownItem,
  VesselTripReportItem,
} from '../../../types/tripSalesReport';
import { DateRangeFilter, DateFilterOption } from './DateRangeFilter';
import { OperationsIncomeSummary } from './OperationsIncomeSummary';

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

const formatDate = (value?: string | null): string => {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function getLast7DaysRange(): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  return { start, end };
}

function getOccupancyColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-600 dark:text-green-400';
  if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

export const VesselsRangeReport: React.FC = () => {
  const initialRange = getLast7DaysRange();
  const [startDate, setStartDate] = useState<Date>(initialRange.start);
  const [endDate, setEndDate] = useState<Date>(initialRange.end);
  const [filterOption, setFilterOption] = useState<DateFilterOption>('last7days');
  const [expandedVesselId, setExpandedVesselId] = useState<number | null>(null);

  const dateRange = useMemo(
    () => ({
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    }),
    [startDate, endDate],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['vessels-report-summary', dateRange.start_date, dateRange.end_date],
    queryFn: () => reportsService.getVesselsList(dateRange),
    enabled: Boolean(startDate && endDate),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const {
    data: vesselDetail,
    isLoading: vesselDetailLoading,
    isFetching: vesselDetailFetching,
    error: vesselDetailError,
  } = useQuery({
    queryKey: ['vessel-reconciliation', expandedVesselId, dateRange.start_date, dateRange.end_date],
    queryFn: () => reportsService.getVesselReconciliation(expandedVesselId!, dateRange),
    enabled: expandedVesselId !== null,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const detailBusy = vesselDetailLoading || vesselDetailFetching;

  const totals = useMemo(() => {
    if (data?.summary) return data.summary;
    const items = data?.items ?? [];
    return {
      trip_count: items.reduce((sum, item) => sum + item.operations.trip_count, 0),
      passengers_count: items.reduce((sum, item) => sum + item.operations.passengers_count, 0),
      gross_sales: items.reduce((sum, item) => sum + (item.sales.gross_sales ?? item.sales.total_revenue), 0),
      credit_notes_amount: items.reduce((sum, item) => sum + (item.sales.credit_notes_amount ?? 0), 0),
      net_revenue: items.reduce((sum, item) => sum + item.sales.total_revenue, 0),
      collection: {
        total_amount: items.reduce((sum, item) => sum + item.collection.total_amount, 0),
        collected_amount: items.reduce((sum, item) => sum + item.sales.collected_revenue, 0),
        pending_amount: items.reduce((sum, item) => sum + item.sales.pending_revenue, 0),
      },
    };
  }, [data]);

  const handleDateChange = (newStartDate: Date | null, newEndDate: Date | null) => {
    if (newStartDate) setStartDate(newStartDate);
    if (newEndDate) setEndDate(newEndDate);
    setExpandedVesselId(null);
  };

  const handleToggleVessel = (vesselId: number) => {
    if (detailBusy && expandedVesselId !== vesselId) return;
    setExpandedVesselId((current) => (current === vesselId ? null : vesselId));
  };

  return (
    <div className="space-y-6">
      <div className="bg-dm-bg-primary rounded-xl shadow-lg border border-dm-border-primary overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-700 to-blue-700 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Ship className="h-6 w-6" />
            Cuadre por Embarcación
          </h2>
          <p className="text-cyan-100 text-sm mt-1">
            Viajes que salieron en el período y todas sus ventas (incluye anticipos)
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 p-6 border-b border-dm-border-primary bg-dm-bg-secondary/40">
          <SummaryCard label="Viajes operados" value={String(totals.trip_count)} />
          <SummaryCard label="Pasajeros vendidos" value={String(totals.passengers_count)} />
          <SummaryCard label="Ventas brutas" value={formatCurrency(totals.gross_sales)} />
          <SummaryCard label="Notas de crédito" value={formatCurrency(totals.credit_notes_amount)} warn />
          <SummaryCard label="Neto / Cobrado" value={formatCurrency(totals.net_revenue)} highlight />
          <SummaryCard label="Por cobrar" value={formatCurrency(totals.collection.pending_amount)} warn />
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
        <div className="space-y-4">
          {data!.items.map((item) => (
            <VesselCard
              key={item.vessel.vessel_id}
              summary={item}
              dateRange={dateRange}
              expanded={expandedVesselId === item.vessel.vessel_id}
              detail={expandedVesselId === item.vessel.vessel_id ? vesselDetail : undefined}
              detailLoading={expandedVesselId === item.vessel.vessel_id && detailBusy}
              detailError={
                expandedVesselId === item.vessel.vessel_id && vesselDetailError
                  ? 'No se pudo cargar el detalle de esta embarcación.'
                  : null
              }
              toggleBlocked={detailBusy && expandedVesselId !== item.vessel.vessel_id}
              onToggle={() => handleToggleVessel(item.vessel.vessel_id)}
            />
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
  warn = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg border border-dm-border-primary bg-dm-bg-primary px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-dm-text-muted">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${
          warn
            ? 'text-amber-600 dark:text-amber-400'
            : highlight
              ? 'text-green-600 dark:text-green-400'
              : 'text-dm-text-primary'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function VesselCard({
  summary,
  dateRange,
  expanded,
  detail,
  detailLoading,
  detailError,
  toggleBlocked,
  onToggle,
}: {
  summary: VesselReportSummaryItem;
  dateRange: { start_date: string; end_date: string };
  expanded: boolean;
  detail?: VesselReportItem;
  detailLoading: boolean;
  detailError: string | null;
  toggleBlocked: boolean;
  onToggle: () => void;
}) {
  const [exporting, setExporting] = useState(false);
  const documentCount = summary.document_count ?? detail?.documents?.length ?? 0;

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await reportsService.exportVesselReconciliationExcel(
        summary.vessel.vessel_id,
        dateRange,
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cuadre_${summary.vessel.vessel_name}_${dateRange.start_date}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="rounded-xl border border-dm-border-primary bg-dm-bg-primary shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        disabled={toggleBlocked}
        className={`w-full text-left p-5 transition-colors ${
          toggleBlocked
            ? 'cursor-not-allowed opacity-60'
            : 'hover:bg-dm-bg-hover/40'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-dm-text-primary">{summary.vessel.vessel_name}</h3>
            <p className="text-sm text-dm-text-muted mt-1">
              {summary.operations.trip_count} viaje{summary.operations.trip_count === 1 ? '' : 's'} ·{' '}
              {documentCount} comprobante{documentCount === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-right">
              <p className="text-lg font-bold text-dm-text-primary">
                {formatCurrency(summary.sales.net_revenue ?? summary.sales.total_revenue)}
              </p>
              <p className="text-xs text-dm-text-muted">
                Bruto {formatCurrency(summary.sales.gross_sales ?? summary.sales.total_revenue)}
                {summary.sales.credit_notes_amount < 0 && (
                  <> · NC {formatCurrency(summary.sales.credit_notes_amount)}</>
                )}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Cobrado {formatCurrency(summary.sales.collected_revenue)}
              </p>
              {summary.sales.pending_revenue > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Pendiente {formatCurrency(summary.sales.pending_revenue)}
                </p>
              )}
            </div>
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-dm-text-muted mt-1" />
            ) : (
              <ChevronDown className="h-5 w-5 text-dm-text-muted mt-1" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <Metric
            icon={<Users className="h-4 w-4" />}
            label="Ocupación prom."
            value={`${summary.operations.avg_occupancy.toFixed(1)}%`}
            valueClass={getOccupancyColor(summary.operations.avg_occupancy)}
          />
          <Metric
            icon={<Users className="h-4 w-4" />}
            label="Pasajeros"
            value={String(summary.operations.passengers_count)}
          />
          <Metric
            icon={<DollarSign className="h-4 w-4" />}
            label="Ticket prom."
            value={formatCurrency(summary.operations.average_ticket)}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-dm-border-primary px-5 pb-5 space-y-5">
          {detailLoading && (
            <div className="flex items-center justify-center gap-3 py-10 text-dm-text-muted">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <span>Cargando detalle de la embarcación...</span>
            </div>
          )}

          {detailError && !detailLoading && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200 mt-4">
              {detailError}
            </div>
          )}

          {detail && !detailLoading && (
            <>
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting}
                  className="rounded-lg bg-[#217346] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a5c38] disabled:opacity-60"
                >
                  {exporting ? 'Exportando...' : 'Exportar cuadre Excel'}
                </button>
              </div>
              <DocumentSummarySection summary={detail.document_summary} />
              <ServiceBreakdownSection breakdown={detail.sales.service_breakdown} />
              <PaymentMethodsSection methods={detail.payment_methods} />
              <NamedBreakdownSection title="Vendedores" items={detail.sellers} />
              <NamedBreakdownSection title="Sucursales / series" items={detail.branches} />
              <TripsSection trips={detail.trips} />
              <DocumentsSection documents={detail.documents} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ServiceBreakdownSection({
  breakdown,
}: {
  breakdown: VesselReportItem['sales']['service_breakdown'];
}) {
  const rows = [
    ['Pasajes', breakdown.PASAJES],
    ['Encomiendas', breakdown.ENCOMIENDAS],
    ['Carga', breakdown.CARGA_GENERAL],
    ['Exceso equipaje', breakdown.EXCESO_EQUIPAJE],
  ] as const;

  return (
    <Section title="Por servicio (cobrado / pendiente)">
      <div className="space-y-2">
        {rows.map(([label, row]) => (
          <ServiceRow key={label} label={label} row={row} />
        ))}
      </div>
    </Section>
  );
}

function ServiceRow({ label, row }: { label: string; row: VesselServiceBreakdownItem }) {
  if (row.count === 0 && row.revenue === 0) return null;
  return (
    <div className="flex items-center justify-between rounded-lg border border-dm-border-primary bg-dm-bg-secondary/50 px-3 py-2 text-sm">
      <span className="text-dm-text-secondary">{label} ({row.count})</span>
      <div className="text-right">
        <p className="font-medium text-dm-text-primary">{formatCurrency(row.revenue)}</p>
        <p className="text-xs text-dm-text-muted">
          Cobrado {formatCurrency(row.collected)} · Pendiente {formatCurrency(row.pending)}
        </p>
      </div>
    </div>
  );
}

function DocumentSummarySection({ summary }: { summary?: VesselDocumentSummary }) {
  if (!summary) return null;
  return (
    <Section title="Resumen de comprobantes">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <SummaryPill label="Boletas" count={summary.boletas.count} amount={summary.boletas.amount} />
        <SummaryPill label="Facturas" count={summary.facturas.count} amount={summary.facturas.amount} />
        <SummaryPill label="Notas crédito" count={summary.notas_credito.count} amount={summary.notas_credito.amount} />
        <SummaryPill label="Total docs" count={summary.total_documents} amount={0} hideAmount />
      </div>
    </Section>
  );
}

function SummaryPill({
  label,
  count,
  amount,
  hideAmount = false,
}: {
  label: string;
  count: number;
  amount: number;
  hideAmount?: boolean;
}) {
  return (
    <div className="rounded-lg border border-dm-border-primary bg-dm-bg-secondary/50 px-3 py-2">
      <p className="text-xs text-dm-text-muted">{label}</p>
      <p className="font-semibold text-dm-text-primary">{count}</p>
      {!hideAmount && <p className="text-xs text-dm-text-secondary">{formatCurrency(amount)}</p>}
    </div>
  );
}

function NamedBreakdownSection({
  title,
  items,
}: {
  title: string;
  items?: VesselNamedBreakdownItem[];
}) {
  if (!items?.length) return null;
  return (
    <Section title={title}>
      <div className="space-y-2">
        {items.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center justify-between rounded-lg border border-dm-border-primary bg-dm-bg-secondary/50 px-3 py-2 text-sm"
          >
            <span className="text-dm-text-secondary">{entry.name} ({entry.count})</span>
            <div className="text-right">
              <p className="font-medium text-dm-text-primary">{formatCurrency(entry.amount)}</p>
              <p className="text-xs text-dm-text-muted">
                Cobrado {formatCurrency(entry.collected)} · Pendiente {formatCurrency(entry.pending)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function PaymentMethodsSection({ methods }: { methods: VesselPaymentMethodItem[] }) {
  if (methods.length === 0) return null;
  return (
    <Section title="Métodos de pago">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {methods.map((method) => (
          <div
            key={method.method}
            className="rounded-lg border border-dm-border-primary bg-dm-bg-secondary/50 px-3 py-2 text-sm"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-dm-text-primary">{method.method}</span>
              <span className="font-semibold text-dm-text-primary">{formatCurrency(method.total)}</span>
            </div>
            <p className="text-xs text-dm-text-muted mt-1">
              Cobrado {formatCurrency(method.collected)} · Pendiente {formatCurrency(method.pending)}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function TripsSection({ trips }: { trips: VesselTripReportItem[] }) {
  return (
    <Section title={`Viajes del período (${trips.length})`}>
      <div className="space-y-3">
        {trips.map((trip) => (
          <div key={trip.trip_id} className="rounded-lg border border-dm-border-primary bg-dm-bg-secondary/40 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-dm-text-primary">
                  {trip.route.route_name || trip.trip_name || `Viaje #${trip.trip_id}`}
                </p>
                <p className="text-xs text-dm-text-muted">
                  {formatDateTime(trip.departure_datetime)} · {trip.operations.passengers_count} pasajeros ·{' '}
                  {trip.operations.occupancy_percentage.toFixed(1)}% ocupación
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold text-dm-text-primary">
                  {formatCurrency(trip.collection.total_amount)}
                </p>
                <p className="text-xs text-dm-text-muted">
                  Cobrado {formatCurrency(trip.collection.collected_amount)} · Pendiente{' '}
                  {formatCurrency(trip.collection.pending_amount)}
                </p>
              </div>
            </div>
            {trip.payment_methods.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {trip.payment_methods.map((method) => (
                  <span
                    key={`${trip.trip_id}-${method.method}`}
                    className="rounded-full bg-dm-bg-primary px-2 py-1 text-[11px] text-dm-text-secondary border border-dm-border-primary"
                  >
                    {method.method}: {formatCurrency(method.total)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

function DocumentsSection({ documents }: { documents: VesselAuditDocument[] }) {
  return (
    <Section title={`Comprobantes (${documents.length})`}>
      <div className="overflow-x-auto rounded-lg border border-dm-border-primary">
        <table className="min-w-full text-sm">
          <thead className="bg-dm-bg-secondary text-dm-text-muted">
            <tr>
              <th className="px-3 py-2 text-left">Comprobante</th>
              <th className="px-3 py-2 text-left">Emisión</th>
              <th className="px-3 py-2 text-left">Cliente</th>
              <th className="px-3 py-2 text-left">Pago</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-right">Cobrado</th>
              <th className="px-3 py-2 text-right">Pendiente</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.invoice_id} className="border-t border-dm-border-primary">
                <td className="px-3 py-2 text-dm-text-primary">
                  {doc.document_type} {doc.series}-{doc.number}
                  <p className="text-[11px] text-dm-text-muted">Viaje #{doc.trip_id}</p>
                </td>
                <td className="px-3 py-2 text-dm-text-secondary">{formatDate(doc.issue_date)}</td>
                <td className="px-3 py-2 text-dm-text-secondary">{doc.client_name || '-'}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${
                      doc.payment_status === 'pendiente'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                    }`}
                  >
                    {doc.payment_status}
                  </span>
                  <p className="text-[11px] text-dm-text-muted mt-1">{doc.payment_method}</p>
                </td>
                <td className="px-3 py-2 text-right font-medium">{formatCurrency(doc.total_amount)}</td>
                <td className="px-3 py-2 text-right text-green-600 dark:text-green-400">
                  {formatCurrency(doc.collected_amount)}
                </td>
                <td className="px-3 py-2 text-right text-amber-600 dark:text-amber-400">
                  {formatCurrency(doc.pending_amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-dm-text-primary mb-2">{title}</h4>
      {children}
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
      <div className="flex items-center gap-1 text-dm-text-muted mb-1">
        {icon}
        <span className="text-[11px]">{label}</span>
      </div>
      <p className={`text-sm font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}
