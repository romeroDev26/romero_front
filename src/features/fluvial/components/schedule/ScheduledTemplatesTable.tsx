// src/features/fluvial/components/schedule/ScheduledTemplatesTable.tsx
import React, { useState, useMemo } from 'react';
import { PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { ScheduledRouteTemplate } from '../../../../types';

interface Props {
  templates: ScheduledRouteTemplate[];
  onEdit: (template: ScheduledRouteTemplate) => void;
  onDelete: (template: ScheduledRouteTemplate) => void;
}

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const TEMPLATES_PAGE_SIZE = 6;

// ── Paginacion de plantillas ─────────────────────────────────────────────────
interface TemplatePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

const TemplatePagination: React.FC<TemplatePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}) => {
  const startItem = (currentPage - 1) * TEMPLATES_PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * TEMPLATES_PAGE_SIZE, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-dm-border-secondary gap-2">
      <p className="text-xs text-dm-text-muted">
        Mostrando{' '}
        <span className="font-semibold text-dm-text-secondary">{startItem}–{endItem}</span>{' '}
        de{' '}
        <span className="font-semibold text-dm-text-secondary">{totalItems}</span>{' '}
        plantillas
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-md border border-dm-border-primary text-dm-text-muted hover:bg-dm-bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Pagina anterior"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-[30px] h-7 px-2 rounded-md text-xs font-medium transition-colors border ${
              currentPage === page
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'border-dm-border-primary text-dm-text-secondary hover:bg-dm-bg-hover'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-md border border-dm-border-primary text-dm-text-muted hover:bg-dm-bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Pagina siguiente"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// ── Componente principal ─────────────────────────────────────────────────────
export const ScheduledTemplatesTable: React.FC<Props> = ({
  templates,
  onEdit,
  onDelete,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(templates.length / TEMPLATES_PAGE_SIZE));

  // Reset de pagina si cambia el numero de plantillas
  React.useEffect(() => {
    setCurrentPage(1);
  }, [templates.length]);

  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * TEMPLATES_PAGE_SIZE;
    return templates.slice(start, start + TEMPLATES_PAGE_SIZE);
  }, [templates, currentPage]);

  const showPagination = templates.length > TEMPLATES_PAGE_SIZE;

  if (!templates.length) {
    return (
      <div className="text-center py-8 text-dm-text-muted text-sm">
        No hay plantillas configuradas.
      </div>
    );
  }

  const getDayOfWeekLabel = (day: number) => {
    return DAYS_OF_WEEK[day - 1] || 'Día inválido';
  };

  return (
    <div className="rounded-xl border border-dm-border-secondary overflow-hidden">
      {/* Mobile Card View */}
      <div className="block lg:hidden divide-y divide-gray-100">
        {paginatedTemplates.map((template) => (
          <div key={template.id} className="p-4 hover:bg-dm-bg-hover transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-dm-text-primary truncate">{template.template_name}</h3>
                <p className="text-xs text-dm-text-muted mt-0.5">
                  {template.route?.origin_port?.name} → {template.route?.destination_port?.name}
                </p>
              </div>
              <span
                className={`ml-3 flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${
                  template.is_active
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                }`}
              >
                {template.is_active ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            <div className="space-y-2 text-sm mb-3">
              <div>
                <span className="block text-xs text-dm-text-muted uppercase tracking-wide">Ruta</span>
                <span className="font-medium text-dm-text-primary">{template.route?.name}</span>
              </div>
              <div>
                <span className="block text-xs text-dm-text-muted uppercase tracking-wide">Embarcación</span>
                <span className="font-medium text-dm-text-primary">
                  {template.vessel?.name || <span className="text-dm-text-muted">No asignada</span>}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-xs text-dm-text-muted uppercase tracking-wide">Día Salida</span>
                  <span className="font-medium text-dm-text-primary">{getDayOfWeekLabel(template.day_of_week)}</span>
                </div>
                <div>
                  <span className="block text-xs text-dm-text-muted uppercase tracking-wide">Hora Salida</span>
                  <span className="font-medium text-dm-text-primary font-mono">{template.departure_time.substring(0, 5)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-dm-border-secondary">
              <Button
                variant="outline"
                onClick={() => onEdit(template)}
                className="flex items-center text-sm"
              >
                <PencilIcon className="h-4 w-4 mr-1" /> Editar
              </Button>
              <Button
                variant="outline"
                onClick={() => onDelete(template)}
                className="flex items-center text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:text-red-300"
              >
                <TrashIcon className="h-4 w-4 mr-1" /> Desactivar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-dm-border-secondary bg-dm-bg-secondary">
              {['Nombre Plantilla', 'Ruta', 'Embarcación', 'Día Salida', 'Hora Salida', 'Estado', 'Acciones'].map(
                (header) => (
                  <th
                    key={header}
                    className="px-5 py-3 text-left text-xs font-semibold text-dm-text-muted uppercase tracking-wider"
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedTemplates.map((template) => (
              <tr key={template.id} className="hover:bg-dm-bg-hover/70 transition-colors">
                <td className="px-5 py-4 whitespace-nowrap">
                  <p className="font-semibold text-sm text-dm-text-primary">{template.template_name}</p>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <p className="text-sm text-dm-text-primary">{template.route?.name}</p>
                  <p className="text-xs text-dm-text-muted mt-0.5">
                    {template.route?.origin_port?.name} → {template.route?.destination_port?.name}
                  </p>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-dm-text-secondary">
                  {template.vessel?.name || <span className="text-dm-text-muted">No asignada</span>}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-dm-text-secondary">
                  {getDayOfWeekLabel(template.day_of_week)}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-dm-text-secondary font-mono">
                  {template.departure_time.substring(0, 5)}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${
                      template.is_active
                        ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30 ring-green-600/20'
                        : 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30 ring-red-600/20'
                    }`}
                  >
                    {template.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(template)}
                      className="p-1.5 rounded-md text-dm-text-muted hover:text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                      title="Editar plantilla"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(template)}
                      className="p-1.5 rounded-md text-dm-text-muted hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Desactivar plantilla"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginacion */}
      {showPagination && (
        <TemplatePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={templates.length}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};