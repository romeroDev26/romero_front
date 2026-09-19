import React from 'react';
import { AlertCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { PagoYape, ValidarCodigoOperacionResponse, ValidarYapeAsistidoResponse } from '../../services/yapePayment.service';

function formatPagoTime(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

interface YapeAssistPanelProps {
  loading: boolean;
  montoDigital: number;
  customerName?: string;
  referenceTimeLabel?: string | null;
  /** 'sale' = venta POS; 'collection' = cobranza encomienda */
  context?: 'sale' | 'collection';
  assist: ValidarYapeAsistidoResponse | null;
  codigoInfo: ValidarCodigoOperacionResponse | null;
  selectedPagoId: string | null;
  onRefresh: () => void;
  onSelectPago: (pago: PagoYape) => void;
}

export const YapeAssistPanel: React.FC<YapeAssistPanelProps> = ({
  loading,
  montoDigital,
  customerName,
  referenceTimeLabel,
  context = 'sale',
  assist,
  codigoInfo,
  selectedPagoId,
  onRefresh,
  onSelectPago,
}) => {
  const estado = assist?.estado_sugerido;
  const tone =
    estado === 'VERIFICADO_AUTO'
      ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
      : estado === 'REVISION_MANUAL'
        ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
        : 'border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/30';

  const pagos = assist?.pago
    ? [assist.pago, ...(assist.sugeridos || []).filter((p) => p.id !== assist.pago?.id)]
    : assist?.sugeridos || [];

  return (
    <div className={`mt-3 rounded-lg border p-3 ${tone}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {estado === 'VERIFICADO_AUTO' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          ) : estado === 'REVISION_MANUAL' ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          ) : (
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
          )}
          <div>
            <p className="text-xs font-semibold text-dm-text-primary">
              Verificación Yape / Plin (no bloquea {context === 'collection' ? 'el cobro' : 'la venta'})
            </p>
            <p className="mt-0.5 text-[11px] text-dm-text-secondary">
              Buscamos S/ {montoDigital.toFixed(2)}
              {customerName?.trim() ? ` · cliente: ${customerName.trim()}` : ''}
              {referenceTimeLabel
                ? ` · alrededor de ${referenceTimeLabel} (±3 min)`
                : ' · pagos de hoy con ese monto'}.
              Si lo pagó un familiar, compara el nombre y la hora con la foto.
            </p>
            {assist?.mensaje && (
              <p className="mt-1 text-[11px] text-dm-text-primary">{assist.mensaje}</p>
            )}
            {assist?.match && assist.pago && (
              <p className="mt-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                Pago encontrado: {assist.pago.canal} S/ {Number(assist.pago.monto).toFixed(2)} ·{' '}
                {assist.pago.nombre_emisor} · {formatPagoTime(assist.pago.fecha_hora)}
                {assist.pago.codigo_operacion ? ` · op. ${assist.pago.codigo_operacion}` : ''}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-dm-text-secondary hover:bg-white/60"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Buscar
        </button>
      </div>

      {codigoInfo?.warning && (
        <p className="mt-2 text-[11px] font-medium text-amber-800 dark:text-amber-300">
          Código: {codigoInfo.warning}
        </p>
      )}

      {pagos.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {pagos.map((pago) => {
            const selected = selectedPagoId === pago.id;
            return (
              <li key={pago.id}>
                <button
                  type="button"
                  onClick={() => onSelectPago(pago)}
                  className={`w-full rounded-md border px-2.5 py-2 text-left text-[11px] ${
                    selected
                      ? 'border-emerald-500 bg-white dark:bg-emerald-950/40'
                      : 'border-dm-border-primary bg-white/70 dark:bg-dm-bg-primary'
                  }`}
                >
                  <div className="flex justify-between gap-2 font-semibold">
                    <span>
                      {pago.canal} S/ {Number(pago.monto).toFixed(2)} · {pago.nombre_emisor}
                    </span>
                    {selected && <span className="text-emerald-600">Usar este</span>}
                  </div>
                  <div className="mt-0.5 text-dm-text-muted">
                    {formatPagoTime(pago.fecha_hora)}
                    {pago.codigo_operacion ? ` · op. ${pago.codigo_operacion}` : ''}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default YapeAssistPanel;
