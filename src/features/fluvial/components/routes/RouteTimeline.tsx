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
    ? 'bg-green-500 ring-green-200 shadow-green-200' 
    : isLast 
    ? 'bg-red-500 ring-red-200 shadow-red-200' 
    : 'bg-blue-500 ring-blue-200 shadow-blue-200';
  const textColor = isFirst 
    ? 'text-green-700 bg-green-50 border-green-200' 
    : isLast 
    ? 'text-red-700 bg-red-50 border-red-200' 
    : 'text-blue-700 bg-blue-50 border-blue-200';
  const cursor = draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer';

  return (
    <div className="relative flex flex-col items-center group min-w-0" onClick={onClick}>
      {/* Etiqueta del nombre de la parada */}
       <div className={`absolute -top-12 px-3 py-2 rounded-lg text-sm font-semibold border-2 shadow-lg max-w-40 text-center transition-all duration-200 group-hover:scale-105 group-hover:shadow-xl ${textColor} break-words`}>
         <div className="font-bold leading-tight">{stop.port?.name || 'Puerto Sin Nombre'}</div>
       </div>
      
      {/* El nodo (círculo) - Mejorado */}
      <div className={`w-7 h-7 rounded-full ring-4 z-10 flex items-center justify-center transition-all duration-200 group-hover:scale-125 shadow-lg ${nodeColor} ${cursor}`}>
        {isFirst && <MapPinIcon className="h-4 w-4 text-white" />}
        {isLast && <MapPinIcon className="h-4 w-4 text-white" />}
        {!isFirst && !isLast && <ArrowsUpDownIcon className="h-4 w-4 text-white opacity-75" />}
      </div>
      
      {/* Número de orden */}
      <div className="absolute -bottom-8 text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded-full border shadow-sm">
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
  draggedIndex 
}) => {
  if (!stops || stops.length < 2) {
    return (
      <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <MapPinIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p className="text-lg font-medium">Agrega paradas para visualizar la ruta</p>
        <p className="text-sm mt-1">Necesitas al menos 2 paradas para crear una ruta</p>
      </div>
    );
  }

  const sortedStops = [...stops].sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0));
  
  // Calcular el ancho mínimo necesario basado en el número de paradas
  const minWidth = Math.max(800, sortedStops.length * 200);

  return (
     <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-gray-200 shadow-sm">
       {/* Contenedor con scroll horizontal */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
        <div className="relative px-8 py-16" style={{ minWidth: `${minWidth}px` }}>
          {/* La línea de conexión principal - Mejorada */}
          <div className="absolute top-1/2 left-8 right-8 transform -translate-y-1/2">
            <div className="h-2 bg-gradient-to-r from-green-400 via-blue-400 to-red-400 rounded-full shadow-sm"></div>
            {/* Línea de sombra para profundidad */}
            <div className="h-1 bg-gray-300 rounded-full mt-1 opacity-30"></div>
          </div>
          
          {/* Contenedor de paradas con espaciado mejorado */}
          <div className="relative flex justify-between items-center" style={{ gap: '40px' }}>
            {sortedStops.map((stop, index) => {
              const isDraggable = index > 0 && index < sortedStops.length - 1;
              return (
                <div
                  key={stop.id || `timeline-stop-${index}-${stop.port_id || 'temp'}-${stop.stop_order || index}`}
                  draggable={isDraggable}
                  onDragStart={(e) => isDraggable && onDragStart(e, index)}
                  onDragOver={(e) => isDraggable && onDragOver(e, index)}
                  onDrop={(e) => isDraggable && onDrop(e, index)}
                  className={`transition-all duration-300 flex-shrink-0 ${
                    draggedIndex === index 
                      ? 'opacity-30 scale-95 rotate-2' 
                      : 'opacity-100 scale-100 hover:scale-105'
                  }`}
                  style={{ minWidth: '160px' }}
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
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Origen</span>
            </div>
            <div className="w-8 h-px bg-gray-400"></div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Intermedia</span>
            </div>
            <div className="w-8 h-px bg-gray-400"></div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Destino</span>
            </div>
          </div>
        </div>
       </div>
     </div>
  );
};

// Estilos CSS personalizados para la barra de desplazamiento (se pueden agregar al archivo CSS global)
// .scrollbar-thin::-webkit-scrollbar {
//   height: 8px;
// }
// .scrollbar-thumb-blue-300::-webkit-scrollbar-thumb {
//   background-color: #93c5fd;
//   border-radius: 4px;
// }
// .scrollbar-track-blue-100::-webkit-scrollbar-track {
//   background-color: #dbeafe;
//   border-radius: 4px;
// }