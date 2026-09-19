import React from 'react';
import { todayInLima } from '../../utils/yapeSearchTime';

interface YapeSearchTimeFieldsProps {
  date: string;
  time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export const YapeSearchTimeFields: React.FC<YapeSearchTimeFieldsProps> = ({
  date,
  time,
  onDateChange,
  onTimeChange,
  disabled = false,
  compact = false,
}) => {
  const labelClass = compact
    ? 'block text-[11px] font-medium uppercase tracking-wider text-dm-text-muted mb-1 ml-0.5'
    : 'block text-xs font-medium text-dm-text-secondary mb-1';
  const inputClass = compact
    ? 'w-full rounded-lg border border-dm-border-primary bg-dm-bg-primary px-3 py-2 text-sm text-dm-text-primary disabled:bg-dm-bg-secondary'
    : 'w-full p-2 border border-dm-border-primary rounded-md disabled:bg-dm-bg-secondary text-sm text-dm-text-primary';
  const helpClass = compact ? 'text-[10px] text-dm-text-muted mt-1' : 'text-xs text-dm-text-muted mt-1';

  return (
    <div className="mt-2 space-y-2">
      <p className={helpClass}>
        Si el pago no es de ahora, indica la <strong>hora de la foto del Yape/Plin</strong>. Buscamos
        ±3 min alrededor de esa hora. Para pagos de ayer u otro día, elige la fecha.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>Fecha del pago (opc.)</label>
          <input
            type="date"
            value={date}
            max={todayInLima()}
            onChange={(e) => onDateChange(e.target.value)}
            disabled={disabled}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Hora del pago (opc.)</label>
          <input
            type="time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            disabled={disabled}
            className={inputClass}
            step={60}
          />
        </div>
      </div>
    </div>
  );
};

export default YapeSearchTimeFields;
