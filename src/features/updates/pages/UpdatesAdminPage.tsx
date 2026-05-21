import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, Transition } from '@headlessui/react';
import {
  SparklesIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { toast } from '@/utils/sileo-toast';
import {
  updatesService,
  SystemUpdate,
  SystemUpdatePayload,
} from '../services/updates.service';

/* ── Tipos locales ── */
type PlatformOption = 'WEB' | 'MOBILE' | 'ALL';
const PLATFORMS: PlatformOption[] = ['WEB', 'MOBILE', 'ALL'];

const emptyForm = (): SystemUpdatePayload => ({
  version: '',
  title: '',
  description: '',
  video_url: '',
  learn_more_url: '',
  release_date: new Date().toISOString().split('T')[0], // hoy por defecto
  platform: 'WEB',
  is_active: true,
  is_mandatory: false,
});

/* ── Modal formulario ── */
interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editing: SystemUpdate | null;
}

const FormModal: React.FC<FormModalProps> = ({ isOpen, onClose, editing }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState<SystemUpdatePayload>(
    editing
      ? {
          version: editing.version,
          title: editing.title,
          description: editing.description,
          video_url: editing.video_url ?? '',
          learn_more_url: editing.learn_more_url ?? '',
          release_date: editing.release_date,
          platform: editing.platform,
          is_active: editing.is_active,
          is_mandatory: editing.is_mandatory,
        }
      : emptyForm()
  );

  // Sincronizar cuando cambia el item que se edita
  React.useEffect(() => {
    setForm(
      editing
        ? {
            version: editing.version,
            title: editing.title,
            description: editing.description,
            video_url: editing.video_url ?? '',
            learn_more_url: editing.learn_more_url ?? '',
            release_date: editing.release_date,
            platform: editing.platform,
            is_active: editing.is_active,
            is_mandatory: editing.is_mandatory,
          }
        : emptyForm()
    );
  }, [editing]);

  const createMutation = useMutation({
    mutationFn: (data: SystemUpdatePayload) => updatesService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system-updates-all'] });
      qc.invalidateQueries({ queryKey: ['system-updates-latest'] });
      toast.success('Novedad creada correctamente');
      onClose();
    },
    onError: () => toast.error('Error al crear la novedad'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<SystemUpdatePayload>) =>
      updatesService.update(editing!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system-updates-all'] });
      qc.invalidateQueries({ queryKey: ['system-updates-latest'] });
      toast.success('Novedad actualizada correctamente');
      onClose();
    },
    onError: () => toast.error('Error al actualizar la novedad'),
  });

  const isBusy = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.version.trim() || !form.title.trim() || !form.description.trim()) {
      toast.warning('Versión, título y descripción son obligatorios');
      return;
    }
    const payload: SystemUpdatePayload = {
      ...form,
      video_url: form.video_url?.trim() || null,
      learn_more_url: form.learn_more_url?.trim() || null,
    };
    if (editing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const set = <K extends keyof SystemUpdatePayload>(key: K, val: SystemUpdatePayload[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl bg-dm-bg-primary rounded-2xl shadow-2xl border border-dm-border-primary overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-dm-border-secondary">
                  <Dialog.Title className="text-base font-bold text-dm-text-primary">
                    {editing ? 'Editar Novedad' : 'Nueva Novedad'}
                  </Dialog.Title>
                  <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dm-bg-hover transition-colors">
                    <XMarkIcon className="w-5 h-5 text-dm-text-muted" />
                  </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-dm-text-muted mb-1 uppercase tracking-wider">
                        Versión *
                      </label>
                      <input
                        type="text"
                        value={form.version}
                        onChange={(e) => set('version', e.target.value)}
                        placeholder="v3.1.0"
                        className="w-full px-3 py-2 text-sm border border-dm-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-dm-text-muted mb-1 uppercase tracking-wider">
                        Plataforma
                      </label>
                      <select
                        value={form.platform}
                        onChange={(e) => set('platform', e.target.value as PlatformOption)}
                        className="w-full px-3 py-2 text-sm border border-dm-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        {PLATFORMS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dm-text-muted mb-1 uppercase tracking-wider">
                      Fecha de Lanzamiento *
                    </label>
                    <input
                      type="date"
                      value={form.release_date}
                      onChange={(e) => set('release_date', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-dm-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dm-text-muted mb-1 uppercase tracking-wider">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => set('title', e.target.value)}
                      placeholder="Nuevo módulo de cotizaciones"
                      className="w-full px-3 py-2 text-sm border border-dm-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dm-text-muted mb-1 uppercase tracking-wider">
                      Descripción *
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => set('description', e.target.value)}
                      rows={3}
                      placeholder="Describe brevemente la novedad..."
                      className="w-full px-3 py-2 text-sm border border-dm-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dm-text-muted mb-1 uppercase tracking-wider">
                      URL de Video (YouTube o MP4)
                    </label>
                    <input
                      type="url"
                      value={form.video_url ?? ''}
                      onChange={(e) => set('video_url', e.target.value)}
                      placeholder="https://youtu.be/... o https://cdn.ejemplo.com/video.mp4"
                      className="w-full px-3 py-2 text-sm border border-dm-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dm-text-muted mb-1 uppercase tracking-wider">
                      Enlace "Más información" (opcional)
                    </label>
                    <input
                      type="url"
                      value={form.learn_more_url ?? ''}
                      onChange={(e) => set('learn_more_url', e.target.value)}
                      placeholder="https://docs.tusistema.com/..."
                      className="w-full px-3 py-2 text-sm border border-dm-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="flex items-center gap-6 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => set('is_active', e.target.checked)}
                        className="w-4 h-4 accent-primary rounded"
                      />
                      <span className="text-sm font-medium text-dm-text-secondary">Activa</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.is_mandatory}
                        onChange={(e) => set('is_mandatory', e.target.checked)}
                        className="w-4 h-4 accent-primary rounded"
                      />
                      <span className="text-sm font-medium text-dm-text-secondary">Obligatoria</span>
                    </label>
                  </div>

                  {/* Acciones */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-dm-border-secondary">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isBusy}
                      className="px-4 py-2 text-sm font-medium text-dm-text-secondary hover:bg-dm-bg-hover rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isBusy}
                      className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isBusy ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear novedad'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

/* ── Página principal ── */
const UpdatesAdminPage: React.FC = () => {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SystemUpdate | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: updates = [], isLoading } = useQuery<SystemUpdate[]>({
    queryKey: ['system-updates-all'],
    queryFn: () => updatesService.getAll({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => updatesService.deleteById(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system-updates-all'] });
      qc.invalidateQueries({ queryKey: ['system-updates-latest'] });
      toast.success('Novedad eliminada');
      setDeletingId(null);
    },
    onError: () => {
      toast.error('Error al eliminar la novedad');
      setDeletingId(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      updatesService.update(id, { is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system-updates-all'] });
      qc.invalidateQueries({ queryKey: ['system-updates-latest'] });
    },
    onError: () => toast.error('No se pudo cambiar el estado'),
  });

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (u: SystemUpdate) => {
    setEditing(u);
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    deleteMutation.mutate(id);
  };

  const platformBadge = (p: string) => {
    const map: Record<string, string> = {
      WEB: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
      MOBILE: 'bg-violet-100 text-violet-700',
      ALL: 'bg-dm-bg-secondary text-dm-text-secondary',
    };
    return map[p] ?? 'bg-dm-bg-secondary text-dm-text-secondary';
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-10 lg:px-8">
      {/* Header */}
      <header className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-dm-text-primary">Novedades del Sistema</h1>
            <p className="text-dm-text-muted mt-1 text-sm">
              Crea y gestiona los anuncios de actualización que verán los usuarios.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold shadow-md hover:bg-primary/90 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Nueva Novedad
          </button>
        </div>
      </header>

      {/* Tabla */}
      <section className="bg-dm-bg-primary rounded-xl border border-dm-border-primary overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-dm-text-muted">Cargando novedades...</p>
          </div>
        ) : updates.length === 0 ? (
          <div className="p-12 text-center">
            <SparklesIcon className="w-12 h-12 mx-auto mb-4 text-dm-text-muted" />
            <p className="text-dm-text-muted">No hay novedades registradas aún.</p>
            <button
              onClick={openCreate}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Crear la primera
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-dm-border-primary bg-dm-bg-secondary/50">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-dm-text-muted">Versión</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-dm-text-muted">Título</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-dm-text-muted">Plataforma</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-dm-text-muted">Fecha</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-dm-text-muted">Estado</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-dm-text-muted text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {updates.map((u) => (
                    <tr key={u.id} className="hover:bg-dm-bg-hover transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded">
                          {u.version}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-dm-text-primary">{u.title}</div>
                        <div className="text-xs text-dm-text-muted line-clamp-1 max-w-xs">{u.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${platformBadge(u.platform)}`}>
                          {u.platform}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-dm-text-muted">
                        {u.release_date}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActiveMutation.mutate({ id: u.id, is_active: !u.is_active })}
                          disabled={toggleActiveMutation.isPending}
                          className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                          title={u.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {u.is_active ? (
                            <>
                              <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                              <span className="text-emerald-700 dark:text-emerald-300">Activa</span>
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="w-4 h-4 text-dm-text-muted" />
                              <span className="text-dm-text-muted">Inactiva</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => openEdit(u)}
                            className="text-dm-text-muted hover:text-primary transition-colors"
                            title="Editar"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            disabled={deletingId === u.id}
                            className="text-dm-text-muted hover:text-rose-600 dark:text-rose-400 transition-colors disabled:opacity-40"
                            title="Eliminar"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-dm-bg-secondary border-t border-dm-border-secondary">
              <span className="text-xs font-medium text-dm-text-muted uppercase tracking-tight">
                {updates.length} novedad{updates.length !== 1 ? 'es' : ''} registrada{updates.length !== 1 ? 's' : ''}
              </span>
            </div>
          </>
        )}
      </section>

      {/* Modal Crear/Editar */}
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
      />
    </div>
  );
};

export default UpdatesAdminPage;
