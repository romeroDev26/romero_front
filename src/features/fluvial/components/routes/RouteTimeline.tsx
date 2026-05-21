// src/features/fluvial/components/routes/RouteTimeline.tsx
import React from 'react';
import { RouteStop } from '../../../../types';
import { MapPinIcon, ArrowsUpDownIcon } from '@heroicons/react/24/solid';

interface RouteTimelineProps {
  stops: Partial<RouteStop>[];
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onStopClick: (stop: Partial<RouteStop>) => void;
  draggedIndex: number | null;
}

const StopNode: React.FC<{
  stop: Partial<RouteStop>;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onClick: () => void;
  draggable: boolean;
}> = ({ stop, index, isFirst, isLast, onClick, draggable }) => {
  const nodeColor = isFirst
    ? 'bg-[#1F4690] ring-[#1F4690]/20'
    : isLast
    ? 'bg-[#4d4d4d] ring-[#4d4d4d]/20'
    : 'bg-[#828282] ring-[#828282]/20';
  const textColor = isFirst
    ? 'text-[#1F4690] bg-[#1F4690]/5 border-[#1F4690]/20'
    : isLast
    ? 'text-dm-text-secondary bg-[#4d4d4d]/5 border-[#4d4d4d]/20'
    : 'text-dm-text-muted bg-dm-bg-secondary border-dm-border-primary';
  const cursor = draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer';

  return (
    <div className="relative flex flex-col items-center group min-w-0" onClick={onClick}>
      {/* Etiqueta del nombre de la parada — ancho mayor para nombres largos */}
      <div
        className={`absolute -top-14 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold border shadow-lg text-center transition-all duration-200 group-hover:scale-105 group-hover:shadow-xl ${textColor} break-words leading-tight`}
        style={{ minWidth: '100px', maxWidth: '280px' }}
      >
        <span className="block">{stop.port?.name || 'Puerto Sin Nombre'}</span>
      </div>

      {/* El nodo (círculo) */}
      <div className={`w-7 h-7 rounded-full ring-4 z-10 flex items-center justify-center transition-all duration-200 group-hover:scale-125 shadow-lg ${nodeColor} ${cursor}`}>
        {isFirst && <MapPinIcon className="h-4 w-4 text-white" />}
        {isLast && <MapPinIcon className="h-4 w-4 text-white" />}
        {!isFirst && !isLast && <ArrowsUpDownIcon className="h-4 w-4 text-white opacity-75" />}
      </div>

      {/* Número de orden */}
      <div className="absolute -bottom-8 text-xs font-bold text-dm-text-muted bg-dm-bg-primary px-2 py-1 rounded-full border shadow-sm">
        {index + 1}
      </div>
    </div>
  );
};

export const RouteTimeline: React.FC<RouteTimelineProps> = ({
  stops,
  onDragStart,
  onDragOver,
  onDrop,
  onStopClick,
  draggedIndex,
}) => {
  if (!stops || stops.length < 2) {
    return (
      <div className="text-center text-dm-text-muted py-8 bg-dm-bg-secondary rounded-lg border-2 border-dashed border-dm-border-primary">
        <MapPinIcon className="h-12 w-12 mx-auto mb-2 text-dm-text-muted" />
        <p className="text-lg font-medium">Agrega paradas para visualizar la ruta</p>
        <p className="text-sm mt-1">Necesitas al menos 2 paradas para crear una ruta</p>
      </div>
    );
  }

  const sortedStops = [...stops].sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0));

  // Más espacio entre paradas para acomodar labels anchos
  const minWidth = Math.max(440, sortedStops.length * 200);

  return (
    <div className="w-full bg-dm-bg-secondary rounded-[12px] border border-dm-border-primary">
      {/* Contenedor con scroll horizontal */}
      <div
        className="overflow-x-auto snap-x snap-mandatory pb-3"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#828282 #e0e0e0',
        }}
      >
        <style>{`
          .timeline-scroll::-webkit-scrollbar {
            height: 8px;
          }
          .timeline-scroll::-webkit-scrollbar-track {
            background: #e0e0e0;
            border-radius: 4px;
          }
          .timeline-scroll::-webkit-scrollbar-thumb {
            background-color: #828282;
            border-radius: 4px;
          }
          .timeline-scroll::-webkit-scrollbar-thumb:hover {
            background-color: #4d4d4d;
          }
        `}</style>
        <div className="timeline-scroll relative px-4 sm:px-8 py-10 sm:py-16" style={{ minWidth: `${minWidth}px` }}>
          {/* La línea de conexión principal */}
          <div className="absolute top-1/2 left-4 right-4 sm:left-8 sm:right-8 transform -translate-y-1/2">
            <div className="h-1.5 bg-[#e8e8e8] rounded-full"></div>
          </div>

          {/* Contenedor de paradas — gap aumentado para evitar superposición de labels */}
          <div className="relative flex justify-between items-center gap-10 sm:gap-16">
            {sortedStops.map((stop, index) => {
              const isDraggable = index > 0 && index < sortedStops.length - 1;
              return (
                <div
                  key={stop.id || `timeline-stop-${index}-${stop.port_id || 'temp'}-${stop.stop_order || index}`}
                  draggable={isDraggable}
                  onDragStart={(e) => isDraggable && onDragStart(e, index)}
                  onDragOver={(e) => isDraggable && onDragOver(e, index)}
                  onDrop={(e) => isDraggable && onDrop(e, index)}
                  className={`transition-all duration-300 flex-shrink-0 snap-center ${
                    draggedIndex === index
                      ? 'opacity-30 scale-95 rotate-2'
                      : 'opacity-100 scale-100'
                  }`}
                  style={{ minWidth: '120px' }}
                >
                  <StopNode
                    stop={stop}
                    index={index}
                    isFirst={index === 0}
                    isLast={index === sortedStops.length - 1}
                    onClick={() => onStopClick(stop)}
                    draggable={isDraggable}
                  />
                </div>
              );
            })}
          </div>

          {/* Indicadores de dirección */}
          <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 sm:gap-3 text-[11px] sm:text-[13px] text-dm-text-muted">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 bg-[#1F4690] rounded-full"></div>
              <span>Origen</span>
            </div>
            <div className="w-4 sm:w-8 h-px bg-[#c4c4c4]"></div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 bg-[#828282] rounded-full"></div>
              <span>Intermedia</span>
            </div>
            <div className="w-4 sm:w-8 h-px bg-[#c4c4c4]"></div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 bg-[#4d4d4d] rounded-full"></div>
              <span>Destino</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
