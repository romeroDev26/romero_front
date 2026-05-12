import React from 'react';
import {
  MapPinIcon,
  LockClosedIcon,
  Bars3Icon,
  MinusCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { RouteTimeline } from './RouteTimeline';
import { RouteStop } from '../../../../types';
import { Port } from '../../../../types';

interface RouteListViewProps {
  stops: Partial<RouteStop>[];
  ports: Port[];
  draggedIndex: number | null;
  dragOverItem: number | null;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onStopClick: (stop: Partial<RouteStop>) => void;
  onUpdateStop: (index: number, field: keyof RouteStop, value: any) => void;
  onRemoveStop: (index: number) => void;
  isStopFixed: (index: number) => boolean;
  parseDurationForUI: (isoString?: string) => { hours: number; minutes: number };
  moveStopUp?: (index: number) => void;
  moveStopDown?: (index: number) => void;
}

const getStopStyle = (index: number, total: number) => {
  if (index === 0) return 'text-[#1F4690] bg-[#1F4690]/5 border-[#1F4690]/20';
  if (index === total - 1) return 'text-[#4d4d4d] bg-[#4d4d4d]/5 border-[#4d4d4d]/20';
  return 'text-[#828282] bg-[#f5f5f5] border-[#e8e8e8]';
};

export const RouteListView: React.FC<RouteListViewProps> = ({
  stops,
  ports,
  draggedIndex,
  dragOverItem,
  onDragStart,
  onDragOver,
  onDrop,
  onStopClick,
  onUpdateStop,
  onRemoveStop,
  isStopFixed,
  parseDurationForUI,
  moveStopUp,
  moveStopDown,
}) => {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 bg-white">
      <div className="bg-[#f5f5f5] rounded-[12px] p-4 sm:p-5 mb-4 sm:mb-5 border border-[#e8e8e8]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[15px] font-medium text-[#202020]">Visualización Lineal</h3>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-[#e8e8e8]">
            <MapPinIcon className="h-3.5 w-3.5 text-[#828282]" strokeWidth={1.5} />
            <span className="text-[12px] font-medium text-[#202020]">{stops.length}</span>
            <span className="text-[12px] text-[#828282]">Paradas</span>
          </div>
        </div>
        <p className="text-[13px] text-[#828282] mb-4">
          Arrastra las paradas intermedias para reordenarlas.
          <span className="font-medium text-[#1F4690]"> Las paradas de origen y destino están fijas.</span>
        </p>
        <RouteTimeline
          stops={stops}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onStopClick={onStopClick}
          draggedIndex={draggedIndex}
        />
      </div>

      <div className="bg-[#f5f5f5] rounded-[12px] p-4 sm:p-5 border border-[#e8e8e8]">
        <h3 className="text-[15px] font-medium text-[#202020] mb-4">Gestión de Paradas</h3>
        <div className="space-y-3">
          {stops.map((stop, index) => {
            const duration = parseDurationForUI(stop.estimated_duration_from_origin);
            const fixed = isStopFixed(index);
            const isFirst = index === 0;
            const isLast = index === stops.length - 1;

            return (
              <div
                key={stop.id || `list-stop-${index}-${stop.port_id || 'temp'}`}
                draggable={!fixed}
                onDragStart={(e) => !fixed && onDragStart(e, index)}
                onDragOver={(e) => !fixed && onDragOver(e, index)}
                onDrop={(e) => !fixed && onDrop(e, index)}
                className={`p-3 sm:p-4 rounded-[10px] border transition-all ${
                  dragOverItem === index
                    ? 'border-[#1F4690] bg-white'
                    : fixed
                    ? 'border-[#e8e8e8] bg-white'
                    : 'border-[#e8e8e8] bg-white hover:shadow-sm'
                } ${!fixed ? 'cursor-move' : 'cursor-default'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-3">
                    {!fixed ? (
                      <Bars3Icon className="h-5 w-5 text-[#c4c4c4] hidden sm:block shrink-0" strokeWidth={1.5} />
                    ) : (
                      <LockClosedIcon className="h-4 w-4 text-[#828282] hidden sm:block shrink-0" strokeWidth={1.5} />
                    )}

                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0 ${getStopStyle(
                        index,
                        stops.length
                      )}`}
                    >
                      {index + 1}
                    </div>

                    <span className="sm:hidden text-[13px] font-medium text-[#202020] truncate">
                      {stop.port?.name || 'Sin puerto'}
                    </span>

                    {!fixed && (
                      <div className="flex items-center gap-1 sm:hidden ml-auto">
                        <button
                          onClick={() => moveStopUp?.(index)}
                          disabled={index <= 1}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e8e8e8] bg-white text-[#828282] hover:text-[#1F4690] disabled:opacity-30 transition-colors"
                          title="Mover arriba"
                        >
                          <ArrowUpIcon className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => moveStopDown?.(index)}
                          disabled={index >= stops.length - 2}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e8e8e8] bg-white text-[#828282] hover:text-[#1F4690] disabled:opacity-30 transition-colors"
                          title="Mover abajo"
                        >
                          <ArrowDownIcon className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                      </div>
                    )}

                    {!fixed ? (
                      <button
                        onClick={() => onRemoveStop(index)}
                        className="p-2 text-[#cf1322] hover:bg-[#fff1f0] rounded-lg transition-colors sm:hidden shrink-0"
                        title="Eliminar parada"
                      >
                        <MinusCircleIcon className="h-5 w-5" strokeWidth={1.5} />
                      </button>
                    ) : (
                      <div className="px-3 py-1.5 bg-[#f5f5f5] rounded-lg text-[12px] font-medium text-[#828282] border border-[#e8e8e8] sm:hidden shrink-0">
                        {isFirst ? 'ORIGEN' : 'DESTINO'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 items-start sm:items-center min-w-0">
                    <div className="lg:col-span-2">
                      <label className="block text-[11px] font-medium text-[#828282] mb-1 uppercase tracking-wide">
                        Puerto
                      </label>
                      <select
                        value={stop.port_id}
                        onChange={(e) => onUpdateStop(index, 'port_id', parseInt(e.target.value))}
                        className="w-full text-[13px] border border-[#e8e8e8] rounded-[8px] px-3 py-2 bg-white focus:border-[#1F4690] focus:outline-none focus:ring-2 focus:ring-[#1F4690]/10 transition-all"
                        required
                        disabled={fixed}
                      >
                        <option value={0}>Seleccionar puerto</option>
                        {ports.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#828282] mb-1 uppercase tracking-wide">
                        Duracion (H:M)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={duration.hours}
                          onChange={(e) =>
                            onUpdateStop(index, 'estimated_duration_from_origin', {
                              hours: parseInt(e.target.value) || 0,
                              minutes: duration.minutes,
                            })
                          }
                          className="w-14 px-2 py-2 border border-[#e8e8e8] rounded-[8px] text-center text-[13px] bg-white focus:border-[#1F4690] focus:outline-none focus:ring-2 focus:ring-[#1F4690]/10 transition-all"
                          min="0"
                          disabled={isFirst}
                          placeholder="0"
                        />
                        <span className="text-[#c4c4c4] font-medium">:</span>
                        <input
                          type="number"
                          value={duration.minutes}
                          onChange={(e) =>
                            onUpdateStop(index, 'estimated_duration_from_origin', {
                              hours: duration.hours,
                              minutes: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-14 px-2 py-2 border border-[#e8e8e8] rounded-[8px] text-center text-[13px] bg-white focus:border-[#1F4690] focus:outline-none focus:ring-2 focus:ring-[#1F4690]/10 transition-all"
                          min="0"
                          max="59"
                          disabled={isFirst}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#828282] mb-1 uppercase tracking-wide">
                        Notas
                      </label>
                      <input
                        type="text"
                        value={stop.notes || ''}
                        onChange={(e) => onUpdateStop(index, 'notes', e.target.value)}
                        className="w-full px-3 py-2 border border-[#e8e8e8] rounded-[8px] text-[13px] bg-white focus:border-[#1F4690] focus:outline-none focus:ring-2 focus:ring-[#1F4690]/10 transition-all"
                        placeholder="Opcional..."
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#828282] mb-1 uppercase tracking-wide">
                        Operaciones
                      </label>
                      <div className="space-y-1.5">
                        <label className="flex items-center text-[12px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={stop.is_boarding_allowed || false}
                            onChange={(e) =>
                              onUpdateStop(index, 'is_boarding_allowed', e.target.checked)
                            }
                            className="mr-2 h-3.5 w-3.5 rounded border-[#e8e8e8] text-[#1F4690] focus:ring-[#1F4690]/20"
                            disabled={isLast}
                          />
                          <span className={isLast ? 'text-[#c4c4c4]' : 'text-[#4d4d4d]'}>
                            Embarque
                          </span>
                        </label>
                        <label className="flex items-center text-[12px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={stop.is_disembarking_allowed || false}
                            onChange={(e) =>
                              onUpdateStop(index, 'is_disembarking_allowed', e.target.checked)
                            }
                            className="mr-2 h-3.5 w-3.5 rounded border-[#e8e8e8] text-[#1F4690] focus:ring-[#1F4690]/20"
                            disabled={isFirst}
                          />
                          <span className={isFirst ? 'text-[#c4c4c4]' : 'text-[#4d4d4d]'}>
                            Desembarque
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 hidden sm:flex">
                    {!fixed ? (
                      <button
                        onClick={() => onRemoveStop(index)}
                        className="p-2 text-[#cf1322] hover:bg-[#fff1f0] rounded-lg transition-colors"
                        title="Eliminar parada"
                      >
                        <MinusCircleIcon className="h-5 w-5" strokeWidth={1.5} />
                      </button>
                    ) : (
                      <div className="px-3 py-1.5 bg-[#f5f5f5] rounded-lg text-[12px] font-medium text-[#828282] border border-[#e8e8e8]">
                        {isFirst ? 'ORIGEN' : 'DESTINO'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
