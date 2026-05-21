// src/features/fluvial/components/sales-point/infants/InfantManager.tsx
import React, { useState } from 'react';
import { Baby, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Infant } from '../core/types';
import { InfantCard } from './InfantCard';
import { InfantForm } from './InfantForm';

interface InfantManagerProps {
  infants: Infant[];
  onAdd: (infant: Infant) => void;
  onRemove: (index: number) => void;
  /** Nombre de la persona responsable de los infantes */
  responsibleName: string;
  /**
   * Modo colapsable: muestra un botón trigger que expande la sección.
   * Usar en la boleta para no sobrecargar el formulario.
   * En modo inline (false) se integra directamente en la card del representante.
   */
  collapsible?: boolean;
}

export const InfantManager: React.FC<InfantManagerProps> = ({
  infants,
  onAdd,
  onRemove,
  responsibleName,
  collapsible = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleAdd = (infant: Infant) => {
    onAdd(infant);
    setShowForm(false);
  };

  // -------------------------------------------------------
  // Modo colapsable — para la sección de boleta
  // -------------------------------------------------------
  if (collapsible) {
    return (
      <div className="mt-4 border-t border-dm-border-secondary pt-3">
        {/* Botón trigger */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-amber-700 dark:text-amber-300 transition-colors hover:bg-amber-50 dark:bg-amber-950/30/60"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100">
            <Baby className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="flex-1">
            Infantes acompañantes
          </span>
          {infants.length > 0 && (
            <span className="mr-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
              {infants.length}
            </span>
          )}
          <span className="shrink-0 text-amber-600 dark:text-amber-400">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>

        {/* Panel expandible */}
        {isExpanded && (
          <div className="mt-2 space-y-2 px-2">
            {infants.length > 0 && (
              <div className="space-y-2">
                {infants.map((infant, idx) => (
                  <InfantCard
                    key={idx}
                    infant={infant}
                    index={idx}
                    onRemove={onRemove}
                  />
                ))}
              </div>
            )}

            {showForm ? (
              <InfantForm
                onAdd={handleAdd}
                onCancel={() => setShowForm(false)}
                responsibleName={responsibleName}
              />
            ) : (
              <div className="flex items-center justify-between">
                {infants.length === 0 && (
                  <span className="text-[11px] text-dm-text-muted italic">
                    Sin infantes registrados
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-dm-bg-primary px-3 py-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50 dark:bg-amber-950/30"
                >
                  <Plus className="h-3 w-3" />
                  Agregar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------
  // Modo inline — para cada card de representante (factura)
  // -------------------------------------------------------
  return (
    <div className="mt-3 border-t border-dm-border-secondary pt-3 space-y-2">
      {/* Cabecera de la sección */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100">
            <Baby className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <span>
            Infantes a cargo
            {infants.length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                {infants.length}
              </span>
            )}
          </span>
        </div>

        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-dm-bg-primary px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50 dark:bg-amber-950/30"
          >
            <Plus className="h-3 w-3" />
            Agregar
          </button>
        )}
      </div>

      {/* Lista de infantes registrados */}
      {infants.length > 0 && (
        <div className="space-y-2">
          {infants.map((infant, idx) => (
            <InfantCard
              key={idx}
              infant={infant}
              index={idx}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}

      {/* Formulario de nuevo infante */}
      {showForm && (
        <InfantForm
          onAdd={handleAdd}
          onCancel={() => setShowForm(false)}
          responsibleName={responsibleName}
        />
      )}

      {infants.length === 0 && !showForm && (
        <p className="text-[11px] text-dm-text-muted italic px-1">Sin infantes registrados</p>
      )}
    </div>
  );
};
