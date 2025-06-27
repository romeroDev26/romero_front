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
  const nodeColor = isFirst ? 'bg-green-500 ring-green-200' : isLast ? 'bg-red-500 ring-red-200' : 'bg-blue-500 ring-blue-200';
  const textColor = isFirst ? 'text-green-700' : isLast ? 'text-red-700' : 'text-blue-700';
  const cursor = draggable ? 'cursor-grab' : 'cursor-pointer';

  return (
    <div className="relative flex flex-col items-center group" onClick={onClick}>
      {/* Etiqueta del nombre de la parada */}
      <div className={`absolute -top-7 px-2 py-0.5 rounded-md text-xs font-bold bg-white shadow-sm whitespace-nowrap ${textColor}`}>
        {stop.port?.name || 'Puerto'}
      </div>
      {/* El nodo (círculo) */}
      <div className={`w-5 h-5 rounded-full ring-4 z-10 flex items-center justify-center transition-transform group-hover:scale-110 ${nodeColor} ${cursor}`}>
        {isFirst && <MapPinIcon className="h-3 w-3 text-white" />}
        {!isFirst && !isLast && <ArrowsUpDownIcon className="h-3 w-3 text-white opacity-50" />}
      </div>
    </div>
  );
};

export const RouteTimeline: React.FC<RouteTimelineProps> = ({ stops, onDragStart, onDragOver, onDrop, onStopClick, draggedIndex }) => {
  if (!stops || stops.length < 2) {
    return <div className="text-center text-gray-500 py-4">Agrega paradas para visualizar la ruta.</div>;
  }

  const sortedStops = [...stops].sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0));

  return (
    <div className="relative w-full px-8 py-10">
      {/* La línea de fondo */}
      <div className="absolute top-1/2 left-8 right-8 h-1 bg-gray-300 transform -translate-y-1/2"></div>
      
      <div className="relative flex justify-between">
        {sortedStops.map((stop, index) => {
          const isDraggable = index > 0 && index < sortedStops.length - 1;
          return (
            <div
              key={stop.id || index}
              draggable={isDraggable}
              onDragStart={(e) => isDraggable && onDragStart(e, index)}
              onDragOver={(e) => isDraggable && onDragOver(e, index)}
              onDrop={(e) => isDraggable && onDrop(e, index)}
              className={`transition-opacity ${draggedIndex === index ? 'opacity-30' : 'opacity-100'}`}
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
    </div>
  );
};