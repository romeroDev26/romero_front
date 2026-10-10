import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDaysIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { tripsService } from '../../../services/trips.service';
import { reprogrammingService } from '../../../services/reprogramming.service';
import { authService } from '../../../services/auth.service';
import { toast } from '@/utils/sileo-toast';
import axios from 'axios';
import { tripDateTime } from '../../../utils/tripDateTime';

interface Props { invoiceId: number; label: string; open: boolean; onClose: () => void; }
const inputClass = 'w-full rounded-lg border border-dm-border-primary bg-dm-bg-primary p-3 text-dm-text-primary';

export default function ReprogramTicketModal({ invoiceId, label, open, onClose }: Props) {
  const [mode, setMode] = useState<'schedule' | 'pending'>('schedule');
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [tripId, setTripId] = useState('');
  const [boarding, setBoarding] = useState('');
  const [disembarking, setDisembarking] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const qc = useQueryClient();
  const user = authService.getCurrentUser();
  const pending = useQuery({ queryKey: ['reprogramming', invoiceId], queryFn: () => reprogrammingService.status(invoiceId), enabled: open });
  const trips = useQuery({
    queryKey: ['reprogramming-trips', user?.company_id, startDate, endDate], enabled: open && !!startDate && (!endDate || endDate >= startDate),
    queryFn: () => tripsService.search({ company_id: user?.company_id || 1, status: ['SCHEDULED', 'RESCHEDULED'], start_date: startDate, ...(endDate ? { end_date: endDate } : {}), limit: 500 }),
  });
  const detail = useQuery({ queryKey: ['reprogramming-trip', tripId], queryFn: () => tripsService.getById(Number(tripId)), enabled: open && !!tripId });
  const futureTrips = (trips.data || []).filter(t => tripDateTime(t.departure_datetime).getTime() > Date.now()).sort((a, b) => tripDateTime(a.departure_datetime).getTime() - tripDateTime(b.departure_datetime).getTime());
  const stops = [...(detail.data?.stops || [])].sort((a, b) => a.stop_order - b.stop_order);
  useEffect(() => {
    if (open) { setMode('schedule'); setTripId(''); setBoarding(''); setDisembarking(''); setReason(''); setError(''); }
  }, [open, invoiceId]);

  async function submit() {
    setError('');
    if (mode === 'pending' && reason.trim().length < 5) { setError('Escribe el motivo (al menos 5 caracteres).'); return; }
    if (mode === 'schedule' && !tripId) { setError('Elige el nuevo viaje.'); return; }
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
      <Dialog.Panel className="w-full max-w-xl rounded-2xl bg-dm-bg-primary border border-dm-border-primary shadow-xl p-6 space-y-5">
        <div className="flex items-start justify-between"><div><Dialog.Title className="text-xl font-bold text-dm-text-primary">Reprogramar pasajes</Dialog.Title><p className="text-dm-text-muted">{label}</p></div><button disabled={busy} onClick={onClose} aria-label="Cerrar"><XMarkIcon className="h-6 w-6" /></button></div>
        <p className="text-sm text-dm-text-secondary">Conserva el pago y el comprobante. Se reprograman todos sus pasajeros; no se emite una nota de crédito ni se cambia el importe.</p>
        <p className="text-sm text-dm-text-muted">Si corresponde un cargo por reprogramación, cóbralo con un comprobante separado por ese servicio. Esta operación no cobra cargos adicionales.</p>
        {pending.data && <p className="rounded-lg p-3 bg-amber-100 text-amber-900">Pendiente de nueva fecha: {pending.data.reason}</p>}
        {!pending.data && <div className="grid grid-cols-2 gap-3">
          {[{ value: 'schedule', title: 'Ya tiene fecha', Icon: CalendarDaysIcon }, { value: 'pending', title: 'Aún no tiene fecha', Icon: ClockIcon }].map(({ value, title, Icon }) => <button key={value} disabled={busy || pending.isLoading} onClick={() => setMode(value as 'schedule' | 'pending')} className={`rounded-xl border p-3 text-left text-dm-text-primary ${mode === value ? 'border-primary bg-primary/10' : 'border-dm-border-primary'}`}><Icon className="h-6 w-6 mb-2" />{title}</button>)}
        </div>}
        {mode === 'pending' ? <>
          <p className="rounded-lg bg-amber-100 p-3 text-sm text-amber-900">Los asientos quedarán libres y los pasajeros dejarán de aparecer en el manifiesto del viaje actual. Podrás asignarles un viaje desde Reprogramaciones pendientes.</p>
          <label className="block text-sm text-dm-text-primary">Motivo<textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={1000} rows={3} className={inputClass} placeholder="El pasajero viajará en otra fecha, aún por confirmar." /></label>
        </> : <>
          <div className="grid grid-cols-2 gap-3 text-sm text-dm-text-primary"><label>Desde<input type="date" min={today} value={startDate} onChange={e => { setStartDate(e.target.value); setTripId(''); }} className={inputClass} /></label><label>Hasta (opcional)<input type="date" min={startDate} value={endDate} onChange={e => { setEndDate(e.target.value); setTripId(''); }} className={inputClass} /></label></div>
          {endDate && endDate < startDate && <p role="alert" className="text-red-600">La fecha final debe ser igual o posterior al inicio.</p>}
          <label className="block text-sm text-dm-text-primary">Nuevo viaje<select value={tripId} onChange={e => { setTripId(e.target.value); setBoarding(''); setDisembarking(''); }} className={inputClass}><option value="">Seleccionar viaje</option>{futureTrips.map(t => <option key={t.id} value={t.id}>{t.trip_name || t.route_name || t.route?.name || `Viaje ${t.id}`} · {tripDateTime(t.departure_datetime).toLocaleString('es-PE', { timeZone: 'America/Lima' })} · {t.vessel_name || t.vessel?.name}</option>)}</select></label>
          <p className="rounded-lg p-3 bg-amber-100 text-amber-900 text-sm">Reprograma para otra fecha con el mismo destino o un destino equivalente y la misma tarifa. Verifica los puertos antes de confirmar: el importe del pasaje original no se recalcula. Si la tarifa es diferente, no uses esta operación. El cargo por reprogramación se cobra aparte en Venta Rápida.</p>
          {trips.isLoading && <p>Cargando viajes…</p>}{trips.isError && <p role="alert" className="text-red-600">No se pudieron cargar los viajes. <button onClick={() => trips.refetch()}>Reintentar</button></p>}
          {!trips.isLoading && !trips.isError && !futureTrips.length && <p className="text-sm text-dm-text-muted">No hay viajes futuros disponibles. Puedes dejar el pasaje pendiente de nueva fecha.</p>}
          {detail.isError && <p role="alert" className="text-red-600">No se pudieron cargar las paradas. <button onClick={() => detail.refetch()}>Reintentar</button></p>}
          {tripId && <div className="grid grid-cols-2 gap-3">{[{ title: 'Embarque', value: boarding, set: setBoarding }, { title: 'Desembarque', value: disembarking, set: setDisembarking }].map(field => <label key={field.title} className="text-sm text-dm-text-primary">{field.title}<select className={inputClass} value={field.value} onChange={e => field.set(e.target.value)}><option value="">Mantener puerto si existe</option>{stops.map(s => <option key={s.id} value={s.port_id}>{s.port?.name || `Puerto ${s.port_id}`}</option>)}</select></label>)}</div>}
          <p className="text-sm text-dm-text-muted">Se intentará mantener el número de asiento; si está ocupado, se asignará otro disponible del mismo tipo. Revisa y entrega el ticket actualizado.</p>
        </>}
        {error && <p role="alert" className="rounded-lg bg-red-50 text-red-700 p-3">{error}</p>}
        <div className="flex justify-end gap-3"><button disabled={busy} onClick={onClose} className="px-4 py-2 text-dm-text-secondary">Cancelar</button><button disabled={busy || pending.isLoading || pending.isError || (mode === 'schedule' && (!!tripId && (detail.isLoading || detail.isError)))} onClick={submit} className="px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50">{busy ? 'Guardando…' : mode === 'pending' ? 'Dejar pendiente y liberar asientos' : 'Confirmar reprogramación'}</button></div>
        {pending.isError && <p role="alert" className="text-red-600 text-sm">No se pudo comprobar si hay una reprogramación pendiente. <button onClick={() => pending.refetch()}>Reintentar</button></p>}
      </Dialog.Panel>
    </div>
  </Dialog>;
}
