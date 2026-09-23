import React from 'react';
import { AlertCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import {
  PagoYape,
  ValidarCodigoOperacionResponse,
  ValidarYapeAsistidoResponse,
  YapeVerificacionEstado,
} from '../../services/yapePayment.service';

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

function panelStyles(estado?: YapeVerificacionEstado) {
  switch (estado) {
    case 'VERIFICADO_AUTO':
      return {
        box: 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30',
        icon: <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />,
        message: 'border-emerald-200 bg-emerald-100/70 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
      };
    case 'REVISION_MANUAL':
      return {
        box: 'border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30',
        icon: <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />,
        message: 'border-amber-300 bg-amber-100/80 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100',
      };
    default:
      return {
        box: 'border-orange-400 bg-orange-50 dark:border-orange-700 dark:bg-orange-950/25',
        icon: <Clock className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />,
        message: 'border-orange-400 bg-orange-100 text-orange-950 dark:border-orange-600 dark:bg-orange-950/50 dark:text-orange-50',
      };
  }
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
  const styles = panelStyles(estado);
  const accion = context === 'collection' ? 'cobro' : 'venta';

  const pagos = assist?.pago
    ? [assist.pago, ...(assist.sugeridos || []).filter((p) => p.id !== assist.pago?.id)]
    : assist?.sugeridos || [];

  return (
    <div className={`mt-3 rounded-lg border p-3 ${styles.box}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {styles.icon}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-dm-text-primary">
              Ayuda para confirmar el Yape
            </p>
            <p className="mt-1 text-xs leading-relaxed text-dm-text-secondary">
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-200">
                Recomendado
              </span>{' '}
              Comprueba si el Yape de{' '}
              <strong>S/ {montoDigital.toFixed(2)}</strong>
              {customerName?.trim() ? (
                <>
                  {' '}
                  de <strong>{customerName.trim()}</strong>
                </>
              ) : null}{' '}
              ya llegó al celular de la empresa. Si el aviso tarda un momento, puedes terminar la{' '}
              {accion} igual.
            </p>
            <p className="mt-1.5 text-[11px] text-dm-text-muted">
              {referenceTimeLabel
                ? `Buscando cerca de las ${referenceTimeLabel} (1 min antes, 10 min después).`
                : 'Sin hora: solo coincide automático si el nombre del Yape es igual al del cliente hoy.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-dm-border-primary bg-white/80 px-2 py-1 text-[11px] font-medium text-dm-text-secondary hover:bg-white dark:bg-dm-bg-primary"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Buscar
        </button>
      </div>

      {assist?.mensaje && (
        <div className={`mt-3 rounded-md border px-3 py-2.5 text-xs font-medium leading-relaxed ${styles.message}`}>
          {assist.mensaje}
        </div>
      )}

      {assist?.match && assist.pago && (
        <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          Yape confirmado: S/ {Number(assist.pago.monto).toFixed(2)} · {assist.pago.nombre_emisor} ·{' '}
          {formatPagoTime(assist.pago.fecha_hora)}
          {assist.pago.codigo_operacion ? ` · op. ${assist.pago.codigo_operacion}` : ''}
          {assist.pago.codigo_seguridad ? ` · seg. ${assist.pago.codigo_seguridad}` : ''}
        </p>
      )}

      {codigoInfo?.warning && (
        <p className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-2 text-xs font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
          Código de operación: {codigoInfo.warning}
        </p>
      )}

      {pagos.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-semibold text-dm-text-secondary">
            Elige el Yape correcto (compara con la foto):
          </p>
          <ul className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
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
                        S/ {Number(pago.monto).toFixed(2)} · {pago.nombre_emisor}
                      </span>
                      {selected && <span className="text-emerald-600">Usar este</span>}
                    </div>
                    <div className="mt-0.5 text-dm-text-muted">
                      {formatPagoTime(pago.fecha_hora)}
                      {pago.codigo_operacion ? ` · op. ${pago.codigo_operacion}` : ''}
                      {pago.codigo_seguridad ? ` · seg. ${pago.codigo_seguridad}` : ''}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default YapeAssistPanel;
