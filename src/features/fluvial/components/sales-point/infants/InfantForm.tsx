// src/features/fluvial/components/sales-point/infants/InfantForm.tsx
import React, { useState } from 'react';
import { Baby, X } from 'lucide-react';
import { Button } from '../../../../../components/common/Button';
import { Infant, InfantRelationship, INFANT_RELATIONSHIP_LABELS } from '../core/types';

interface InfantFormProps {
  onAdd: (infant: Infant) => void;
  onCancel: () => void;
  /** Nombre del responsable para mostrarlo como referencia en el formulario */
  responsibleName: string;
}

const EMPTY_FORM = {
  full_name: '',
  birth_date: '',
  gender: 'M' as 'M' | 'F',
  relationship: 'padre' as InfantRelationship,
  document_number: '',
};

export const InfantForm: React.FC<InfantFormProps> = ({
  onAdd,
  onCancel,
  responsibleName,
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof EMPTY_FORM, string>>>({});

  const today = new Date().toISOString().split('T')[0];

  const validate = (): boolean => {
    const next: Partial<Record<keyof typeof EMPTY_FORM, string>> = {};

    if (!form.full_name.trim()) {
      next.full_name = 'El nombre es requerido';
    }

    if (!form.birth_date) {
      next.birth_date = 'La fecha de nacimiento es requerida';
    } else {
      const birthDate = new Date(form.birth_date + 'T00:00:00');
      if (birthDate > new Date()) {
        next.birth_date = 'La fecha debe ser en el pasado';
      }
    }

    if (form.document_number.trim() && form.document_number.trim().length !== 8) {
      next.document_number = 'El DNI debe tener 8 dígitos';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onAdd({
      full_name: form.full_name.trim(),
      birth_date: form.birth_date,
      gender: form.gender,
      relationship: form.relationship,
      ...(form.document_number.trim() && { document_number: form.document_number.trim() }),
    });

    setForm(EMPTY_FORM);
    setErrors({});
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative space-y-3 rounded-xl border border-amber-100 bg-amber-50 dark:bg-amber-950/30/50 p-3"
    >
      {/* Cierre rápido */}
      <button
        type="button"
        onClick={onCancel}
        className="absolute right-2 top-2 rounded-md p-1 text-dm-text-muted transition-colors hover:bg-amber-100 hover:text-dm-text-secondary"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Header mini */}
      <div className="flex items-center gap-2 pr-6">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100">
          <Baby className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="leading-tight">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Nuevo infante</p>
          <p className="text-[10px] text-amber-700 dark:text-amber-300/80">
            Resp: <span className="font-medium">{responsibleName || '—'}</span>
          </p>
        </div>
      </div>

      {/* Nombre y DNI */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-dm-text-muted">
            Nombre Completo
          </label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
            placeholder="Nombre y apellidos"
            className="w-full rounded-lg border border-dm-border-primary bg-dm-bg-primary py-2 px-3 text-sm text-dm-text-primary placeholder:text-dm-text-muted focus:outline-none focus:ring-2 focus:ring-amber-300/50"
          />
          {errors.full_name && (
            <p className="mt-1 text-[11px] text-red-500 dark:text-red-400">{errors.full_name}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-dm-text-muted">
            DNI <span className="normal-case text-dm-text-muted font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={form.document_number}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                document_number: e.target.value.replace(/\D/g, '').slice(0, 8),
              }))
            }
            placeholder="8 dígitos"
            maxLength={8}
            className="w-full rounded-lg border border-dm-border-primary bg-dm-bg-primary py-2 px-3 text-sm text-dm-text-primary placeholder:text-dm-text-muted focus:outline-none focus:ring-2 focus:ring-amber-300/50"
          />
          {errors.document_number && (
            <p className="mt-1 text-[11px] text-red-500 dark:text-red-400">{errors.document_number}</p>
          )}
        </div>
      </div>

      {/* Fecha y Sexo */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-dm-text-muted">
            Fecha Nac.
          </label>
          <input
            type="date"
            value={form.birth_date}
            max={today}
            onChange={(e) => setForm((p) => ({ ...p, birth_date: e.target.value }))}
            className="w-full rounded-lg border border-dm-border-primary bg-dm-bg-primary py-2 px-3 text-sm text-dm-text-primary focus:outline-none focus:ring-2 focus:ring-amber-300/50"
          />
          {errors.birth_date && (
            <p className="mt-1 text-[11px] text-red-500 dark:text-red-400">{errors.birth_date}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-dm-text-muted">
            Sexo
          </label>
          <select
            value={form.gender}
            onChange={(e) =>
              setForm((p) => ({ ...p, gender: e.target.value as 'M' | 'F' }))
            }
            className="w-full rounded-lg border border-dm-border-primary bg-dm-bg-primary py-2 px-3 text-sm text-dm-text-primary focus:outline-none focus:ring-2 focus:ring-amber-300/50"
          >
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>
      </div>

      {/* Relación con el responsable */}
      <div>
        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-dm-text-muted">
          Relación
        </label>
        <select
          value={form.relationship}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              relationship: e.target.value as InfantRelationship,
            }))
          }
          className="w-full rounded-lg border border-dm-border-primary bg-dm-bg-primary py-2 px-3 text-sm text-dm-text-primary focus:outline-none focus:ring-2 focus:ring-amber-300/50"
        >
          {Object.entries(INFANT_RELATIONSHIP_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Acciones */}
      <div className="flex gap-2 pt-0.5">
        <Button
          type="submit"
          size="sm"
          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded-lg h-8"
        >
          Registrar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="px-3 text-xs rounded-lg border-dm-border-primary text-dm-text-secondary hover:bg-dm-bg-hover h-8"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
};
