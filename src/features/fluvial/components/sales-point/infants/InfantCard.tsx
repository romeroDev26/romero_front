// src/features/fluvial/components/sales-point/infants/InfantCard.tsx
import React from 'react';
import { Trash2, Baby } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '../../../../../components/common/Button';
import { Infant, INFANT_RELATIONSHIP_LABELS } from '../core/types';

interface InfantCardProps {
  infant: Infant;
  index: number;
  onRemove: (index: number) => void;
}

export const InfantCard: React.FC<InfantCardProps> = ({ infant, index, onRemove }) => {
  const formattedDate = infant.birth_date
    ? format(new Date(infant.birth_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })
    : '-';

  return (
    <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-dm-bg-primary p-3 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <Baby className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-dm-text-primary truncate">{infant.full_name}</p>
          <p className="text-[11px] text-dm-text-muted mt-0.5">
            {formattedDate}
            {' · '}
            {infant.gender === 'M' ? 'Masculino' : 'Femenino'}
            {' · '}
            {INFANT_RELATIONSHIP_LABELS[infant.relationship]}
            {infant.document_number && (
              <>
                {' · '}
                <span className="font-mono text-dm-text-secondary">DNI {infant.document_number}</span>
              </>
            )}
          </p>
        </div>
      </div>
      <Button
        onClick={() => onRemove(index)}
        variant="outline"
        size="sm"
        className="shrink-0 ml-2 h-8 w-8 p-0 text-red-500 dark:text-red-400 border-dm-border-primary hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};
