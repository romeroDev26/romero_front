import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { reprogrammingService, PendingReprogramming } from '../../../services/reprogramming.service';
import ReprogramTicketModal from '../components/ReprogramTicketModal';

export default function PendingReprogrammingPage() {
  const query = useQuery({ queryKey: ['pending-reprogramming'], queryFn: reprogrammingService.pending });
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PendingReprogramming | null>(null);
  const rows = (query.data || []).filter(r => `${r.series}-${r.number} ${r.client_name || ''}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="p-6 space-y-5">
    <div><h1 className="text-2xl font-bold text-dm-text-primary">Reprogramaciones pendientes</h1><p className="text-dm-text-secondary">Pasajes que conservan su comprobante y esperan una nueva fecha. No ocupan asiento ni aparecen en el manifiesto del viaje anterior.</p></div>
    <input aria-label="Buscar pasaje pendiente" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por boleta o pasajero" className="w-full max-w-lg rounded-lg border border-dm-border-primary bg-dm-bg-primary p-3" />
    {query.isLoading && <p>Cargando pendientes…</p>}
    {query.isError && <p role="alert" className="text-red-600">No se pudieron consultar los pendientes. <button onClick={() => query.refetch()}>Reintentar</button></p>}
    {!query.isLoading && !query.isError && !rows.length && <p className="p-8 rounded-xl bg-dm-bg-secondary text-dm-text-muted">No hay pasajes pendientes de nueva fecha.</p>}
    <div className="space-y-3">{rows.map(r => <article key={r.id} className="p-5 rounded-xl border border-dm-border-primary bg-dm-bg-primary flex flex-col sm:flex-row justify-between gap-4"><div><Link className="font-bold text-primary" to={`/accounting/invoices/${r.invoice_id}`}>{r.series}-{r.number}</Link><p className="text-dm-text-primary">{r.client_name}</p><p className="text-sm text-dm-text-muted">Viaje anterior: {r.source_trip_name || r.source_trip_id}</p><p className="text-sm text-dm-text-secondary whitespace-pre-wrap">{r.reason}</p><p className="text-xs text-dm-text-muted">Pendiente desde {new Date(r.created_at).toLocaleString('es-PE')} · SUNAT: {r.sunat_status}</p></div><button onClick={() => setSelected(r)} className="self-start px-4 py-2 rounded-lg bg-primary text-white">Asignar nuevo viaje</button></article>)}</div>
    {selected && <ReprogramTicketModal invoiceId={selected.invoice_id} label={`${selected.series}-${selected.number}`} open onClose={() => setSelected(null)} />}
  </div>;
}
