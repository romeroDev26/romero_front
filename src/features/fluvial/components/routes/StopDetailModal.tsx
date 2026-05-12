import React from 'react';
import { ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Modal } from '../../../../components/common/Modal';
import { RouteStop } from '../../../../types';
import { routeHelpers } from '../../hooks/useVesselsRoutesData';

interface StopDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  stop: Partial<RouteStop> | null;
  stops: Partial<RouteStop>[];
  isStopFixed: (index: number) => boolean;
  onStartEditing: (stop: Partial<RouteStop>) => void;
}

export const StopDetailModal: React.FC<StopDetailModalProps> = ({
  isOpen,
  onClose,
  stop,
  stops,
  isStopFixed,
  onStartEditing,
}) => {
  if (!stop) return null;

  const stopIndex = stops.findIndex((s) => s.id === stop.id);
  const fixed = isStopFixed(stopIndex);
  const isFirst = stopIndex === 0;

  const getColor = () => {
    if (isFirst) return 'text-[#1F4690] bg-[#1F4690]/5 border-[#1F4690]/20';
    if (stopIndex === stops.length - 1) return 'text-[#4d4d4d] bg-[#4d4d4d]/5 border-[#4d4d4d]/20';
    return 'text-[#828282] bg-[#f5f5f5] border-[#e8e8e8]';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalles: ${stop.port?.name || 'Parada'}`} maxWidth="md">
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getColor()}`}>
            <span className="text-[18px] font-bold">{stop.stop_order}</span>
          </div>
          <div>
            <h3 className="text-[18px] font-medium text-[#202020]">{stop.port?.name}</h3>
            <p className="text-[13px] text-[#828282]">
              Parada #{stop.stop_order}
              {fixed && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#f5f5f5] text-[#828282] border border-[#e8e8e8]">
                  {isFirst ? 'ORIGEN' : 'DESTINO'}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#f5f5f5] rounded-[10px] p-4 border border-[#e8e8e8]">
            <div className="flex items-center gap-2 mb-1">
              <ClockIcon className="h-4 w-4 text-[#828282]" strokeWidth={1.5} />
              <span className="text-[12px] text-[#828282]">Tiempo desde origen</span>
            </div>
            <p className="text-[16px] font-semibold text-[#202020]">
              {routeHelpers.isoStringToHours(stop.estimated_duration_from_origin || 'PT0S').toFixed(1)}h
            </p>
          </div>
          <div className="bg-[#f5f5f5] rounded-[10px] p-4 border border-[#e8e8e8]">
            <div className="flex items-center gap-2 mb-1">
              <UserGroupIcon className="h-4 w-4 text-[#828282]" strokeWidth={1.5} />
              <span className="text-[12px] text-[#828282]">Operaciones</span>
            </div>
            <p className="text-[14px] font-medium text-[#202020]">
              {stop.is_boarding_allowed && stop.is_disembarking_allowed
                ? 'Embarque y Desembarque'
                : stop.is_boarding_allowed
                ? 'Solo Embarque'
                : stop.is_disembarking_allowed
                ? 'Solo Desembarque'
                : 'Sin operaciones'}
            </p>
          </div>
        </div>

        {stop.notes && (
          <div className="bg-[#f5f5f5] rounded-[10px] p-4 border border-[#e8e8e8]">
            <span className="text-[12px] text-[#828282]">Notas</span>
            <p className="text-[14px] text-[#202020] mt-1">{stop.notes}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
          <button
            onClick={() => {
              onStartEditing(stop);
              onClose();
            }}
            className="px-4 py-2 text-[13px] font-medium text-[#202020] bg-white border border-[#e8e8e8] rounded-[10px] hover:bg-[#f5f5f5] transition-colors"
          >
            Editar Parada
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-white bg-[#1F4690] rounded-[10px] hover:bg-[#163672] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};
