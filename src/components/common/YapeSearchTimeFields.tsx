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

  return (
    <div className="mt-2 space-y-2">
      <p className="text-xs leading-relaxed text-dm-text-muted">
        <strong>Opcional:</strong> si el nombre no coincide, pon la hora que sale en la foto del
        Yape (1 min antes, 10 min después). Solo si el pago fue otro día, cambia la fecha.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>Fecha del Yape (opc.)</label>
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
          <label className={labelClass}>Hora del Yape (opc.)</label>
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
