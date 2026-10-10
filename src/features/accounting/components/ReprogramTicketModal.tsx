import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDaysIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { tripsService } from '../../../services/trips.service';
import { reprogrammingService } from '../../../services/reprogramming.service';
import { authService } from '../../../services/auth.service';
import { toast } from '@/utils/sileo-toast';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Ship, CheckCircle2 } from 'lucide-react';
import { TripCalendar } from '../../fluvial/components/sales-point/TripCalendar';
import { tripDateTime } from '../../../utils/tripDateTime';

interface Props { invoiceId: number; label: string; open: boolean; onClose: () => void; }
const inputClass = 'w-full rounded-lg border border-dm-border-primary bg-dm-bg-primary p-3 text-dm-text-primary';

export default function ReprogramTicketModal({ invoiceId, label, open, onClose }: Props) {
  const [mode, setMode] = useState<'schedule' | 'pending'>('schedule');
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });
  const [travelDate, setTravelDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => parseISO(today));
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(travelDate) && travelDate >= today;
  const [tripId, setTripId] = useState('');
  const [boarding, setBoarding] = useState('');
  const [disembarking, setDisembarking] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const qc = useQueryClient();
  const user = authService.getCurrentUser();
  const companyId = user?.company_id || 1;
  const calendar = useQuery({
    queryKey: ['reprogramming-dates', companyId, format(currentMonth, 'yyyy-MM')],
    enabled: open && mode === 'schedule',
    queryFn: () => tripsService.getReprogrammingDates({ company_id: companyId, start_date: format(startOfMonth(currentMonth), 'yyyy-MM-dd'), end_date: format(endOfMonth(currentMonth), 'yyyy-MM-dd') }),
    staleTime: 5 * 60 * 1000,
  });
  const pending = useQuery({ queryKey: ['reprogramming', invoiceId], queryFn: () => reprogrammingService.status(invoiceId), enabled: open });
  const trips = useQuery({
    queryKey: ['reprogramming-trips', companyId, travelDate], enabled: open && mode === 'schedule' && validDate,
    staleTime: 60 * 1000,
    queryFn: () => tripsService.search({ company_id: companyId, status: ['SCHEDULED', 'RESCHEDULED'], start_date: travelDate, end_date: travelDate, limit: 500 }),
  });
  const detail = useQuery({ queryKey: ['reprogramming-trip', tripId], queryFn: () => tripsService.getById(Number(tripId)), enabled: open && !!tripId });
  const futureTrips = (trips.data || []).filter(t => { const departure = tripDateTime(t.departure_datetime); return departure.getTime() > Date.now() && departure.toLocaleDateString('sv-SE', { timeZone: 'America/Lima' }) === travelDate; }).sort((a, b) => tripDateTime(a.departure_datetime).getTime() - tripDateTime(b.departure_datetime).getTime());
  const stops = [...(detail.data?.stops || [])].sort((a, b) => a.stop_order - b.stop_order);
  useEffect(() => {
    if (open) { setMode('schedule'); setCurrentMonth(parseISO(today)); setTravelDate(''); setTripId(''); setBoarding(''); setDisembarking(''); setReason(''); setError(''); }
  }, [open, invoiceId]);

  function chooseDate(value: string) {
    setTravelDate(value); setTripId(''); setBoarding(''); setDisembarking(''); setError('');
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) setCurrentMonth(parseISO(value));
  }

  async function submit() {
    setError('');
    if (mode === 'pending' && reason.trim().length < 5) { setError('Escribe el motivo (al menos 5 caracteres).'); return; }
    if (mode === 'schedule' && !validDate) { setError('Elige una fecha de viaje desde hoy.'); return; }
    if (mode === 'schedule' && !futureTrips.some(t => String(t.id) === tripId)) { setError('Elige el nuevo viaje.'); return; }
    setBusy(true);
    try {
      if (mode === 'pending') await reprogrammingService.postpone(invoiceId, reason.trim());
      else await reprogrammingService.schedule(invoiceId, { new_trip_id: Number(tripId),
        ...(boarding ? { new_boarding_port_id: Number(boarding) } : {}),
        ...(disembarking ? { new_disembarking_port_id: Number(disembarking) } : {}),
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['invoice', invoiceId] }),
        qc.invalidateQueries({ queryKey: ['reprogramming'] }),
        qc.invalidateQueries({ queryKey: ['pending-reprogramming'] }),
        qc.invalidateQueries({ queryKey: ['invoices'] }),
        qc.invalidateQueries({ queryKey: ['trips'] }),
        qc.invalidateQueries({ queryKey: ['trip'] }),
        qc.invalidateQueries({ queryKey: ['tripDetails'] }),
        qc.invalidateQueries({ queryKey: ['tripsView'] }),
        qc.invalidateQueries({ queryKey: ['manifests'] }),
        qc.invalidateQueries({ queryKey: ['seatMap'] }),
        qc.invalidateQueries({ queryKey: ['seatAssignments'] }),
        qc.invalidateQueries({ queryKey: ['reprogramming-dates'] }),
        qc.invalidateQueries({ queryKey: ['reprogramming-trips'] }),
      ]);
      toast.success(mode === 'pending' ? 'Pasajes pendientes de nueva fecha. Asientos liberados.' : 'Pasajes reprogramados. Se está actualizando el ticket.');
      onClose();
    } catch (e) {
      const message = axios.isAxiosError(e) && typeof e.response?.data?.detail === 'string' ? e.response.data.detail : 'No se pudo guardar la reprogramación. Inténtalo nuevamente.';
      setError(message);
    } finally { setBusy(false); }
  }

  return <Dialog open={open} onClose={() => { if (!busy) onClose(); }} className="relative z-50">
    <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
    <div className="fixed inset-0 overflow-y-auto p-4 flex items-center justify-center">
      <Dialog.Panel className={`w-full ${mode === 'schedule' ? 'max-w-4xl' : 'max-w-xl'} rounded-2xl bg-dm-bg-primary border border-dm-border-primary shadow-xl p-4 sm:p-5 space-y-3 max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-start justify-between"><div><Dialog.Title className="text-xl font-bold text-dm-text-primary">Reprogramar pasajes</Dialog.Title><p className="text-dm-text-muted">{label}</p></div><button disabled={busy} onClick={onClose} aria-label="Cerrar"><XMarkIcon className="h-6 w-6" /></button></div>
        <p className="text-sm text-dm-text-secondary">Conserva el pago, el comprobante y el importe. Se reprograman todos sus pasajeros.</p>
        <p className="text-sm text-dm-text-muted">El cargo por reprogramación se cobra aparte, con otra boleta o factura.</p>
        {pending.data && <p className="rounded-lg p-3 bg-amber-100 text-amber-900">Pendiente de nueva fecha: {pending.data.reason}</p>}
        {!pending.data && <div className="grid grid-cols-2 gap-3">
          {[{ value: 'schedule', title: 'Ya tiene fecha', Icon: CalendarDaysIcon }, { value: 'pending', title: 'Aún no tiene fecha', Icon: ClockIcon }].map(({ value, title, Icon }) => <button key={value} disabled={busy || pending.isLoading} onClick={() => setMode(value as 'schedule' | 'pending')} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm text-dm-text-primary ${mode === value ? 'border-primary bg-primary/10' : 'border-dm-border-primary'}`}><Icon className="h-5 w-5 shrink-0" />{title}</button>)}
        </div>}
        {mode === 'pending' ? <>
          <p className="rounded-lg bg-amber-100 p-3 text-sm text-amber-900">Los asientos quedarán libres y los pasajeros dejarán de aparecer en el manifiesto del viaje actual. Podrás asignarles un viaje desde Reprogramaciones pendientes.</p>
          <label className="block text-sm text-dm-text-primary">Motivo<textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={1000} rows={3} className={inputClass} placeholder="El pasajero viajará en otra fecha, aún por confirmar." /></label>
        </> : <>
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.15fr)] gap-4">
            <section className="space-y-3" aria-label="Calendario de reprogramación">
              <h3 className="font-semibold text-dm-text-primary">1. Elige la fecha</h3>
              <TripCalendar compact selectedDate={travelDate} currentMonth={currentMonth} onMonthChange={setCurrentMonth} onDateSelect={chooseDate} availableDates={calendar.data || []} todayDate={today} disabled={busy} isLoading={calendar.isLoading} />
              {calendar.isError && <p role="alert" className="text-sm text-red-600">No se pudieron cargar los indicadores del calendario. Puedes elegir una fecha igualmente. <button onClick={() => calendar.refetch()} className="underline">Reintentar</button></p>}
            </section>
            <section className="space-y-3" aria-label="Viajes de la fecha elegida">
              <div className="flex justify-between items-center gap-2"><h3 className="font-semibold text-dm-text-primary">2. Elige el viaje{validDate ? ` · ${travelDate.split('-').reverse().join('/')}` : ''}</h3>{validDate && !trips.isFetching && <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">{futureTrips.length} disponibles</span>}</div>
              {!travelDate && <div className="rounded-xl border border-dashed border-dm-border-primary p-5 text-center text-sm text-dm-text-muted"><CalendarDaysIcon className="h-7 w-7 mx-auto mb-2 text-primary" /><p>Primero elige la fecha. Verás únicamente los viajes disponibles de ese día.</p></div>}
              {travelDate && !validDate && <p role="alert" className="text-red-600">Elige una fecha desde hoy.</p>}
              {validDate && trips.isFetching && <p className="text-sm text-dm-text-secondary">Cargando viajes de esa fecha…</p>}
              {validDate && trips.isError && <p role="alert" className="text-red-600">No se pudieron cargar los viajes. <button onClick={() => trips.refetch()}>Reintentar</button></p>}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {futureTrips.map(t => <button key={t.id} type="button" aria-label={`Elegir ${t.trip_name || t.route_name || t.route?.name || `Viaje ${t.id}`}`} aria-pressed={tripId === String(t.id)} disabled={busy || trips.isFetching} onClick={() => { setTripId(String(t.id)); setBoarding(''); setDisembarking(''); setError(''); }} className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${tripId === String(t.id) ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-dm-border-primary hover:border-primary/60 bg-dm-bg-primary'}`}>
                  <span className="rounded-lg p-2 bg-primary/10 text-primary"><Ship className="h-5 w-5" /></span>
                  <span className="flex-1 min-w-0"><span className="block font-semibold text-sm text-dm-text-primary">{t.trip_name || t.route_name || t.route?.name || `Viaje ${t.id}`}</span><span className="block text-sm text-dm-text-secondary">{t.vessel_name || t.vessel?.name}</span><span className="block text-xs text-dm-text-muted">Salida: {tripDateTime(t.departure_datetime).toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' })}</span></span>
                  {tripId === String(t.id) ? <CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> : <span className="text-xs font-semibold text-primary">Elegir</span>}
                </button>)}
              </div>
              {validDate && !trips.isFetching && !trips.isError && !futureTrips.length && <p className="rounded-xl bg-dm-bg-secondary p-4 text-sm text-dm-text-muted">No hay viajes disponibles en esa fecha. Elige otro día o deja el pasaje pendiente de nueva fecha.</p>}
              {detail.isError && <p role="alert" className="text-red-600">No se pudieron cargar las paradas. <button onClick={() => detail.refetch()}>Reintentar</button></p>}
              {tripId && <div className="rounded-xl border border-dm-border-primary p-3 space-y-2"><h4 className="text-sm font-semibold text-dm-text-primary">3. Revisa los puertos</h4><div className="grid grid-cols-2 gap-3">{[{ title: 'Embarque', value: boarding, set: setBoarding }, { title: 'Desembarque', value: disembarking, set: setDisembarking }].map(field => <label key={field.title} className="text-sm text-dm-text-primary">{field.title}<select disabled={busy || detail.isLoading} className={`${inputClass} !p-2`} value={field.value} onChange={e => field.set(e.target.value)}><option value="">Mantener puerto si existe</option>{stops.map(stop => <option key={stop.id} value={stop.port_id}>{stop.port?.name || `Puerto ${stop.port_id}`}</option>)}</select></label>)}</div></div>}
            </section>
          </div>
          <p className="rounded-lg p-3 bg-amber-100 text-amber-900 text-sm">Solo otra fecha con el mismo destino o un destino equivalente y la misma tarifa. El importe original no cambia. Verifica los puertos; el cargo de reprogramación se cobra aparte en Venta Rápida.</p>
          <p className="text-sm text-dm-text-muted">Se intentará mantener el número de asiento; si está ocupado, se asignará otro disponible del mismo tipo. Revisa y entrega el ticket actualizado.</p>
        </>}
        {error && <p role="alert" className="rounded-lg bg-red-50 text-red-700 p-3">{error}</p>}
        <div className="sticky bottom-0 z-10 flex justify-end gap-3 border-t border-dm-border-primary bg-dm-bg-primary pt-3 pb-1"><button disabled={busy} onClick={onClose} className="px-4 py-2 text-dm-text-secondary">Cancelar</button><button disabled={busy || pending.isLoading || pending.isError || (mode === 'schedule' && (!validDate || !tripId || trips.isFetching || trips.isError || detail.isLoading || detail.isError))} onClick={submit} className="px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50">{busy ? 'Guardando…' : mode === 'pending' ? 'Dejar pendiente y liberar asientos' : 'Confirmar reprogramación'}</button></div>
        {pending.isError && <p role="alert" className="text-red-600 text-sm">No se pudo comprobar si hay una reprogramación pendiente. <button onClick={() => pending.refetch()}>Reintentar</button></p>}
      </Dialog.Panel>
    </div>
  </Dialog>;
}
