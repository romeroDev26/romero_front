// src/features/fluvial/components/sales-point/infants/InfantManager.tsx
import React, { useState } from 'react';
import { Baby, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../../../../components/common/Button';
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
      <div className="border-t border-gray-100 pt-3 mt-3">
        {/* Botón trigger */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors w-full text-left"
        >
          <Baby className="h-4 w-4 flex-shrink-0" />
          <span>
            Infantes acompañantes
            {infants.length > 0 && (
              <span className="ml-1 text-xs bg-amber-100 text-amber-800 rounded-full px-1.5 py-0.5 font-semibold">
                {infants.length}
              </span>
            )}
          </span>
          <span className="ml-auto flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        </button>

        {/* Panel expandible */}
        {isExpanded && (
          <div className="mt-3 space-y-2">
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowForm(true)}
                className="w-full border-dashed border-amber-300 text-amber-700 hover:bg-amber-50 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Agregar infante
              </Button>
            )}

            {infants.length === 0 && !showForm && (
              <p className="text-xs text-gray-400 italic text-center py-1">
                Sin infantes registrados
              </p>
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
    <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
      {/* Cabecera de la sección */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
          <Baby className="h-3.5 w-3.5" />
          <span>
            Infantes a cargo
            {infants.length > 0 && (
              <span className="ml-1 bg-amber-100 text-amber-800 rounded-full px-1.5 py-0.5 font-semibold">
                {infants.length}
              </span>
            )}
          </span>
        </div>

        {!showForm && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            className="h-7 px-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            <Plus className="h-3 w-3 mr-1" />
            Infante
          </Button>
        )}
      </div>

      {/* Lista de infantes registrados */}
      {infants.length > 0 && (
        <div className="space-y-1.5">
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
        <p className="text-xs text-gray-400 italic">Sin infantes registrados</p>
      )}
    </div>
  );
};
