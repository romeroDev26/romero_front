import React from 'react';
import {
  PlusIcon,
  MinusIcon,
  HomeIcon,
  MapPinIcon,
  CursorArrowRaysIcon,
  HandRaisedIcon,
  CursorArrowRippleIcon,
} from '@heroicons/react/24/outline';
import { RouteStop } from '../../../../types';

interface RouteMapViewProps {
  stops: Partial<RouteStop>[];
  dynamicRiverPath: string;
  viewBox: { x: number; y: number; width: number; height: number };
  zoomLevel: number;
  panOffset: { x: number; y: number };
  isPanning: boolean;
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onStopClick: (stop: Partial<RouteStop>) => void;
  getRiverPosition: (index: number) => { x: number; y: number };
  isStopFixed: (index: number) => boolean;
}

export const RouteMapView: React.FC<RouteMapViewProps> = ({
  stops,
  dynamicRiverPath,
  viewBox,
  zoomLevel,
  panOffset,
  isPanning,
  mapContainerRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onZoomIn,
  onZoomOut,
  onResetView,
  onStopClick,
  getRiverPosition,
  isStopFixed,
}) => {
  const [showLegend, setShowLegend] = React.useState(true);

  return (
    <div className="h-full bg-white relative overflow-auto">
      {/* Leyenda / info - collapsible on mobile */}
      {showLegend && (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white rounded-[10px] sm:rounded-[12px] border border-[#e8e8e8] p-3 sm:p-4 shadow-sm z-10 max-w-[160px] sm:max-w-none">
          <div className="text-[11px] sm:text-[12px] text-[#828282] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-[#202020]">Leyenda</span>
              <button
                onClick={() => setShowLegend(false)}
                className="text-[#c4c4c4] hover:text-[#202020] transition-colors"
              >
                ×
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1F4690]" />
              <span>Origen</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4d4d4d]" />
              <span>Destino</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#828282]" />
              <span>Intermedia</span>
            </div>
            <div className="pt-1.5 border-t border-[#f0f0f0] space-y-1 hidden sm:block">
              <div className="flex items-center gap-1.5">
                <CursorArrowRaysIcon className="h-3 w-3" strokeWidth={1.5} />
                <span>Scroll: Zoom</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HandRaisedIcon className="h-3 w-3" strokeWidth={1.5} />
                <span>Arrastrar: Mover</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CursorArrowRippleIcon className="h-3 w-3" strokeWidth={1.5} />
                <span>Clic: Detalles</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {!showLegend && (
        <button
          onClick={() => setShowLegend(true)}
          className="absolute top-3 left-3 z-10 w-8 h-8 bg-white rounded-lg border border-[#e8e8e8] shadow-sm flex items-center justify-center text-[#828282] hover:text-[#202020] transition-colors"
        >
          ?
        </button>
      )}

      {/* Controles de zoom */}
      <div className="absolute top-4 right-4 flex items-center gap-1 bg-white rounded-[12px] border border-[#e8e8e8] p-1 shadow-sm z-10">
        <button
          onClick={onZoomOut}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#4d4d4d] hover:bg-[#f5f5f5] transition-colors"
          title="Alejar"
        >
          <MinusIcon className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <span className="px-2 text-[12px] font-medium text-[#202020] min-w-[48px] text-center">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#4d4d4d] hover:bg-[#f5f5f5] transition-colors"
          title="Acercar"
        >
          <PlusIcon className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          onClick={onResetView}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#1F4690] hover:bg-[#1F4690]/5 transition-colors border-l border-[#e8e8e8] ml-1"
          title="Centrar"
        >
          <HomeIcon className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* SVG */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full flex items-center justify-center touch-none ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <svg
          className="transition-transform duration-200 select-none w-full h-full"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
          }}
          viewBox={`${viewBox.x - panOffset.x} ${viewBox.y - panOffset.y} ${viewBox.width} ${viewBox.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Río principal */}
          <path
            d={dynamicRiverPath}
            stroke="#e8e8e8"
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
          />
          {/* Línea central sutil */}
          <path
            d={dynamicRiverPath}
            stroke="#f5f5f5"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />

          {/* Afluentes decorativos sutiles */}
          <path d="M 80 80 Q 100 70, 120 60" stroke="#f5f5f5" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 300 120 Q 290 130, 280 140" stroke="#f5f5f5" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 480 160 Q 465 170, 450 180" stroke="#f5f5f5" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 770 260 Q 760 270, 750 280" stroke="#f5f5f5" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 840 360 Q 830 370, 820 380" stroke="#f5f5f5" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 900 460 Q 890 470, 880 480" stroke="#f5f5f5" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 840 600 Q 830 590, 820 580" stroke="#f5f5f5" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 700 700 Q 690 690, 680 680" stroke="#f5f5f5" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 400 840 Q 390 830, 380 820" stroke="#f5f5f5" strokeWidth="4" fill="none" strokeLinecap="round" />

          {stops.map((stop, index) => {
            const riverPos = getRiverPosition(index);
            const isFirst = index === 0;
            const isLast = index === stops.length - 1;
            const fixed = isStopFixed(index);

            const strokeColor = isFirst ? '#1F4690' : isLast ? '#4d4d4d' : '#828282';
            const strokeWidth = fixed ? 3 : 2;
            const labelColor = isFirst ? '#1F4690' : isLast ? '#4d4d4d' : '#828282';
            const labelText = isFirst ? 'ORIGEN' : isLast ? 'DESTINO' : '';

            return (
              <g key={stop.id || `map-stop-${index}-${stop.port_id || 'temp'}`}>
                {/* Número de orden */}
                <circle
                  cx={riverPos.x - 32}
                  cy={riverPos.y - 32}
                  r="12"
                  fill="white"
                  stroke="#e8e8e8"
                  strokeWidth="1.5"
                />
                <text
                  x={riverPos.x - 32}
                  y={riverPos.y - 28}
                  textAnchor="middle"
                  className="text-[11px] font-semibold fill-[#202020]"
                >
                  {index + 1}
                </text>

                {/* Círculo principal de parada */}
                <circle
                  cx={riverPos.x}
                  cy={riverPos.y}
                  r="22"
                  fill="white"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => onStopClick(stop)}
                />

                {/* Ícono */}
                <foreignObject
                  x={riverPos.x - 8}
                  y={riverPos.y - 8}
                  width="16"
                  height="16"
                  className="pointer-events-none"
                >
                  <div className="flex items-center justify-center w-full h-full">
                    <MapPinIcon
                      className="w-4 h-4"
                      style={{ color: strokeColor }}
                      strokeWidth={1.5}
                    />
                  </div>
                </foreignObject>

                {/* Nombre del puerto */}
                <text
                  x={riverPos.x}
                  y={riverPos.y - 38}
                  textAnchor="middle"
                  className="text-[13px] font-medium pointer-events-none fill-[#202020]"
                >
                  {stop.port?.name || `Parada ${index + 1}`}
                </text>

                {/* Label origen/destino */}
                {labelText && (
                  <>
                    <rect
                      x={riverPos.x - 28}
                      y={riverPos.y + 34}
                      width="56"
                      height="18"
                      rx="9"
                      fill={isFirst ? '#1F4690' : '#4d4d4d'}
                    />
                    <text
                      x={riverPos.x}
                      y={riverPos.y + 46}
                      textAnchor="middle"
                      className="text-[10px] font-semibold pointer-events-none fill-white"
                    >
                      {labelText}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
