import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { es } from 'date-fns/locale';
import { format, parse } from 'date-fns';
import { todayInLima } from '../../utils/yapeSearchTime';

const DATE_FORMAT = 'yyyy-MM-dd';

const toDate = (value: string): Date | null =>
  value ? parse(value, DATE_FORMAT, new Date()) : null;

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
    ? 'w-full rounded-lg border border-dm-border-primary bg-dm-bg-primary px-3 py-2 text-sm text-dm-text-primary disabled:bg-dm-bg-secondary dark:[color-scheme:dark]'
    : 'w-full p-2 border border-dm-border-primary rounded-md bg-dm-bg-primary disabled:bg-dm-bg-secondary text-sm text-dm-text-primary dark:[color-scheme:dark]';
  const helpClass = compact ? 'text-[10px] text-dm-text-muted mt-1' : 'text-xs text-dm-text-muted mt-1';

  return (
    <div className="mt-2 space-y-2">
      <p className={helpClass}>
        Sin fecha ni hora buscamos en <strong>todo el día de hoy</strong>. Si quieres precisión (o fue
        otro día), indica la <strong>hora de la foto</strong> (±3 min) y la fecha si no es hoy.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>Fecha del pago (opc.)</label>
          {/* Popper fixed, no portal: dentro del Dialog de Headless UI un portal cuenta como clic afuera y cierra el modal */}
          <DatePicker
            selected={toDate(date)}
            onChange={(d: Date | null) => onDateChange(d ? format(d, DATE_FORMAT) : '')}
            maxDate={toDate(todayInLima()) ?? undefined}
            dateFormat="dd/MM/yyyy"
            placeholderText="Hoy"
            locale={es}
            isClearable={!disabled && Boolean(date)}
            disabled={disabled}
            className={inputClass}
            wrapperClassName="w-full"
            calendarClassName="custom-datepicker text-sm"
            popperClassName="custom-datepicker-popper z-[60]"
            popperProps={{ strategy: 'fixed' }}
            popperPlacement="bottom-start"
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
