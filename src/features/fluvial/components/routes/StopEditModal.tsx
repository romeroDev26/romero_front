import React from 'react';
import { Modal } from '../../../../components/common/Modal';
import { RouteStop } from '../../../../types';
import { Port } from '../../../../types';

interface StopEditModalProps {
  editingStop: Partial<RouteStop> | null;
  onClose: () => void;
  onSave: () => void;
  ports: Port[];
  onChange: (stop: Partial<RouteStop>) => void;
}

export const StopEditModal: React.FC<StopEditModalProps> = ({
  editingStop,
  onClose,
  onSave,
  ports,
  onChange,
}) => {
  if (!editingStop) return null;

  return (
    <Modal isOpen={!!editingStop} onClose={onClose} title="Editar Parada" maxWidth="md">
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-[#4d4d4d] mb-1.5">Puerto</label>
          <select
            value={editingStop.port_id}
            onChange={(e) => onChange({ ...editingStop, port_id: parseInt(e.target.value) })}
            className="w-full px-3 py-2.5 border border-[#e8e8e8] rounded-[10px] text-[14px] bg-white focus:border-[#1F4690] focus:outline-none focus:ring-2 focus:ring-[#1F4690]/10 transition-all"
          >
            <option value={0}>Seleccionar puerto</option>
            {ports.map((port) => (
              <option key={port.id} value={port.id}>
                {port.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#4d4d4d] mb-1.5">Notas</label>
          <textarea
            value={editingStop.notes || ''}
            onChange={(e) => onChange({ ...editingStop, notes: e.target.value })}
            className="w-full px-3 py-2.5 border border-[#e8e8e8] rounded-[10px] text-[14px] bg-white focus:border-[#1F4690] focus:outline-none focus:ring-2 focus:ring-[#1F4690]/10 transition-all resize-none"
            rows={3}
            placeholder="Notas opcionales..."
          />
        </div>

        <div className="space-y-2.5">
          <label className="flex items-center text-[14px] cursor-pointer">
            <input
              type="checkbox"
              checked={editingStop.is_boarding_allowed || false}
              onChange={(e) => onChange({ ...editingStop, is_boarding_allowed: e.target.checked })}
              className="mr-2.5 h-4 w-4 rounded border-[#e8e8e8] text-[#1F4690] focus:ring-[#1F4690]/20"
            />
            <span className="text-[#202020]">Permitir embarque</span>
          </label>
          <label className="flex items-center text-[14px] cursor-pointer">
            <input
              type="checkbox"
              checked={editingStop.is_disembarking_allowed || false}
              onChange={(e) => onChange({ ...editingStop, is_disembarking_allowed: e.target.checked })}
              className="mr-2.5 h-4 w-4 rounded border-[#e8e8e8] text-[#1F4690] focus:ring-[#1F4690]/20"
            />
            <span className="text-[#202020]">Permitir desembarque</span>
          </label>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-[14px] font-medium text-[#202020] bg-white border border-[#e8e8e8] rounded-[10px] hover:bg-[#f5f5f5] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2.5 text-[14px] font-medium text-white bg-[#1F4690] rounded-[10px] hover:bg-[#163672] transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
};
