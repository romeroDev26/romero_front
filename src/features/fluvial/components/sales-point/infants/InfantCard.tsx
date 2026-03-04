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
    <div className="flex items-center justify-between bg-white border border-amber-200 rounded-md p-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center">
          <Baby className="h-4 w-4 text-amber-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{infant.full_name}</p>
          <p className="text-xs text-gray-500">
            {formattedDate}
            {' · '}
            {infant.gender === 'M' ? 'Masculino' : 'Femenino'}
            {' · '}
            {INFANT_RELATIONSHIP_LABELS[infant.relationship]}
            {infant.document_number && (
              <>
                {' · '}
                <span className="font-mono">DNI {infant.document_number}</span>
              </>
            )}
          </p>
        </div>
      </div>
      <Button
        onClick={() => onRemove(index)}
        variant="outline"
        size="sm"
        className="flex-shrink-0 ml-2 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};
