import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  SparklesIcon,
  PaintBrushIcon,
  WrenchIcon,
  BugAntIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { CHANGELOG, ChangelogTag, getGroupedChangelog } from '../../../config/version';

const tagConfig: Record<ChangelogTag, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  feature: {
    label: 'Nueva función',
    icon: SparklesIcon,
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  improvement: {
    label: 'Mejora',
    icon: WrenchIcon,
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
  fix: {
    label: 'Corrección',
    icon: BugAntIcon,
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-950/30',
  },
  ui: {
    label: 'Diseño',
    icon: PaintBrushIcon,
    color: 'text-purple-700',
    bg: 'bg-purple-50',
  },
};

export const ChangelogPage: React.FC = () => {
  const navigate = useNavigate();
  const grouped = getGroupedChangelog();
  const versions = Object.keys(grouped).sort((a, b) => {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const na = pa[i] ?? 0;
      const nb = pb[i] ?? 0;
      if (na !== nb) return nb - na;
    }
    return 0;
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-dm-text-muted hover:text-[#1F4690] transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" strokeWidth={1.5} />
          Volver
        </button>
      </div>

      <div className="mb-8">
        <h1
          className="text-[28px] font-medium text-dm-text-primary tracking-[-0.56px] leading-[1.19]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Historial de cambios
        </h1>
        <p className="text-[15px] text-dm-text-secondary mt-2 leading-relaxed">
          Novedades, mejoras y correcciones del frontend. Estos cambios son independientes de las
          actualizaciones críticas del sistema.
        </p>
      </div>

      {/* Timeline */}
      <div className="space-y-10">
        {versions.map((version) => {
          const entries = grouped[version];
          return (
            <section key={version}>
              <div className="flex items-center gap-3 mb-5">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#1F4690] text-white text-[12px] font-semibold">
                  v{version}
                </span>
                <div className="flex-1 h-px bg-[#e8e8e8]" />
              </div>

              <div className="space-y-4">
                {entries.map((entry, idx) => {
                  const primaryTag = entry.tags[0] ?? 'improvement';
                  const cfg = tagConfig[primaryTag];
                  const TagIcon = cfg.icon;

                  return (
                    <div
                      key={idx}
                      className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-5 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[15px] font-semibold text-dm-text-primary leading-snug">
                            {entry.title}
                          </h3>
                          <p className="text-[13px] text-dm-text-secondary leading-relaxed mt-1.5">
                            {entry.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium ${cfg.bg} ${cfg.color}`}
                        >
                          <TagIcon className="h-3 w-3" strokeWidth={2} />
                          {cfg.label}
                        </span>

                        {entry.tags.slice(1).map((t) => {
                          const c = tagConfig[t];
                          const I = c.icon;
                          return (
                            <span
                              key={t}
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium ${c.bg} ${c.color}`}
                            >
                              <I className="h-3 w-3" strokeWidth={2} />
                              {c.label}
                            </span>
                          );
                        })}

                        <span className="inline-flex items-center gap-1 text-[11px] text-[#a0a0a0] ml-auto">
                          <ClockIcon className="h-3 w-3" strokeWidth={2} />
                          {formatDate(entry.date)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {CHANGELOG.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[15px] text-dm-text-muted">
            No hay registros de cambios por el momento.
          </p>
        </div>
      )}
    </div>
  );
};

export default ChangelogPage;
