import React from 'react';
import { PeriodIncomeSummary } from '../../../types/tripSalesReport';

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

interface OperationsIncomeSummaryProps {
  summary: PeriodIncomeSummary;
}

export const OperationsIncomeSummary: React.FC<OperationsIncomeSummaryProps> = ({ summary }) => {
  return (
    <div className="border-b border-dm-border-primary bg-dm-bg-secondary/30 px-6 py-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-dm-text-muted">
        Panorama de ingresos del período
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryTile
          label="Ventas totales"
          hint="Por fecha de emisión (como reporte global)"
          value={formatCurrency(summary.total_sales_in_period)}
          highlight
        />
        <SummaryTile
          label="En viajes del período"
          hint="Ventas ligadas a salidas en estas fechas"
          value={formatCurrency(summary.trip_operations_revenue)}
        />
        <SummaryTile
          label="Venta rápida / sin viaje"
          hint="Oficina, lancha u otros sin itinerario programado"
          value={formatCurrency(summary.quick_sales_revenue)}
        />
        {summary.other_sales_revenue > 0 && (
          <SummaryTile
            label="Otras ventas con viaje"
            hint="Emitidas en el período pero con salida en otra fecha"
            value={formatCurrency(summary.other_sales_revenue)}
          />
        )}
      </div>
    </div>
  );
};

function SummaryTile({
  label,
  hint,
  value,
  highlight = false,
}: {
  label: string;
  hint: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-dm-border-primary bg-dm-bg-primary px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-dm-text-muted">{label}</p>
      <p
        className={`mt-1 text-lg font-bold ${
          highlight ? 'text-green-600 dark:text-green-400' : 'text-dm-text-primary'
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-dm-text-muted">{hint}</p>
    </div>
  );
}
