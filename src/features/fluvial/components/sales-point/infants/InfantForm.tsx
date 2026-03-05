// src/features/fluvial/components/sales-point/infants/InfantForm.tsx
import React, { useState } from 'react';
import { Baby } from 'lucide-react';
import { Button } from '../../../../../components/common/Button';
import { Input } from '../../../../../components/common/Input';
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
      className="space-y-3 bg-amber-50 border border-amber-200 rounded-lg p-4"
    >
      {/* Indicador de responsable */}
      <div className="flex items-center gap-2 text-xs text-amber-800 font-medium">
        <Baby className="h-3.5 w-3.5 flex-shrink-0" />
        <span>
          Responsable:{' '}
          <span className="font-semibold">{responsibleName || '—'}</span>
        </span>
      </div>

      {/* Nombre y DNI */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Completo
          </label>
          <Input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
            placeholder="Nombre y apellidos"
            className="text-sm"
          />
          {errors.full_name && (
            <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>
          )}
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            DNI <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <Input
            type="text"
            value={form.document_number}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                document_number: e.target.value.replace(/\D/g, '').slice(0, 8),
              }))
            }
            placeholder="8 dígitos"
            className="text-sm"
            maxLength={8}
          />
          {errors.document_number && (
            <p className="text-xs text-red-500 mt-1">{errors.document_number}</p>
          )}
        </div>
      </div>

      {/* Fecha y Sexo */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Nacimiento
          </label>
          <input
            type="date"
            value={form.birth_date}
            max={today}
            onChange={(e) => setForm((p) => ({ ...p, birth_date: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
          />
          {errors.birth_date && (
            <p className="text-xs text-red-500 mt-1">{errors.birth_date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
          <select
            value={form.gender}
            onChange={(e) =>
              setForm((p) => ({ ...p, gender: e.target.value as 'M' | 'F' }))
            }
            className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
          >
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>
      </div>

      {/* Relación con el responsable */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Relación con el Responsable
        </label>
        <select
          value={form.relationship}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              relationship: e.target.value as InfantRelationship,
            }))
          }
          className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
        >
          {Object.entries(INFANT_RELATIONSHIP_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Acciones */}
      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          size="sm"
          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-sm"
        >
          Registrar Infante
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="px-4 text-sm"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
};
