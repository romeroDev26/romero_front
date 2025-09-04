import React, { useState, useEffect, useRef } from 'react';
import {
  PlusCircleIcon,
  MinusCircleIcon,
  MapIcon,
  ListBulletIcon,
  ClockIcon,
  UserGroupIcon,
  Bars3Icon,
  PlusIcon,
  MinusIcon,
  HomeIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  LockClosedIcon,
  CursorArrowRaysIcon,
  HandRaisedIcon,
  CursorArrowRippleIcon
} from '@heroicons/react/24/outline';
import { Modal } from '../../../../components/common/Modal';
import { RouteTimeline } from './RouteTimeline';
import { AddStopModal } from './AddStopModal';
import { usePortsData } from '../../../../hooks/usePorts';
import {
  useUpdateRouteStops,
  routeHelpers
} from '../../hooks/useVesselsRoutesData';
import { RouteWithStops, RouteStopCreateData } from '../../../../services/routes.service';
import { RouteStop } from '../../../../types';

interface RouteMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  route?: RouteWithStops;
}

export const RouteMapModal: React.FC<RouteMapModalProps> = ({ isOpen, onClose, route }) => {
  const updateRouteStops = useUpdateRouteStops();
  const { data: ports = [] } = usePortsData();

  const [stops, setStops] = useState<Partial<RouteStop>[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedStop, setSelectedStop] = useState<Partial<RouteStop> | null>(null);
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<Partial<RouteStop> | null>(null);
  const [isAddStopModalOpen, setIsAddStopModalOpen] = useState(false);
  const [addStopPosition, setAddStopPosition] = useState<number>(0);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);

  // Eliminamos la limitación de paradas para permitir configuraciones flexibles

  // Estados para el río y las posiciones dinámicas
  const [dynamicRiverPath, setDynamicRiverPath] = useState('');
  const [stopPositions, setStopPositions] = useState<{ x: number; y: number }[]>([]);
  
  // Estados para zoom y viewport
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1200, height: 900 });
  
  // Estados para pan/drag del mapa
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Ref para el contenedor del mapa
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // useEffect para inicializar las paradas la primera vez que se abre el modal
  useEffect(() => {
    if (isOpen && route) {
      if (route.stops && route.stops.length > 0) {
        const stopsWithPortObjects = route.stops.map(stop => ({
          ...stop,
          port: ports.find(p => p.id === stop.port_id),
        }));
        setStops(stopsWithPortObjects);
      } else {
        const originPort = ports.find(p => p.id === route.origin_port_id);
        const destinationPort = ports.find(p => p.id === route.destination_port_id);
        const originStop: Partial<RouteStop> = {
          port_id: route.origin_port_id,
          stop_order: 1,
          estimated_duration_from_origin: 'PT0S',
          is_boarding_allowed: true,
          is_disembarking_allowed: false,
          notes: 'Puerto de origen',
          port: originPort,
        };
        const destinationStop: Partial<RouteStop> = {
          port_id: route.destination_port_id,
          stop_order: 2,
          estimated_duration_from_origin: route.estimated_duration,
          is_boarding_allowed: false,
          is_disembarking_allowed: true,
          notes: 'Puerto de destino',
          port: destinationPort,
        };
        setStops([originStop, destinationStop]);
      }
    }
  }, [isOpen, route, ports]);

  // useEffect principal que recalcula el río y las posiciones cuando cambia el número de paradas
  useEffect(() => {
    const basePositions = [
      { x: 120, y: 60 }, { x: 280, y: 140 }, { x: 450, y: 180 }, { x: 580, y: 260 },
      { x: 750, y: 280 }, { x: 820, y: 380 }, { x: 880, y: 480 }, { x: 820, y: 580 },
      { x: 680, y: 680 }, { x: 520, y: 750 }, { x: 380, y: 820 }
    ];
    const baseRiverPath = "M 120 60 Q 200 100, 280 140 Q 360 160, 450 180 Q 520 220, 580 260 Q 670 270, 750 280 Q 785 330, 820 380 Q 850 430, 880 480 Q 850 530, 820 580 Q 750 630, 680 680 Q 600 715, 520 750 Q 450 785, 380 820";

    if (stops.length === 0) {
      setDynamicRiverPath('');
      setStopPositions([]);
      setViewBox({ x: 0, y: 0, width: 1200, height: 900 });
      return;
    }

    let calculatedPositions = [];
    let calculatedPath = baseRiverPath;
    let maxX = 880;
    let maxY = 820;

    // Lógica para paradas DENTRO del límite original
    if (stops.length <= basePositions.length) {
      const tempPositions = [];
      // Usamos la lógica de distribución original para el caso estático
      for (let i = 0; i < stops.length; i++) {
        if (i === 0) {
          tempPositions.push(basePositions[0]);
          continue;
        }
        if (i === stops.length - 1) {
          tempPositions.push(basePositions[basePositions.length - 1]);
          continue;
        }
        const intermediatePositions = basePositions.slice(1, -1);
        const intermediateStopsCount = stops.length - 2;
        const currentIntermediateIndex = i - 1;
        const ratio = (currentIntermediateIndex + 1) / (intermediateStopsCount + 1);
        const targetSlotIndex = Math.floor(ratio * intermediatePositions.length);
        const finalIndex = Math.min(targetSlotIndex, intermediatePositions.length - 1);
        tempPositions.push(intermediatePositions[finalIndex]);
      }
      calculatedPositions = tempPositions;
    } else { // Lógica mejorada para paradas que EXCEDEN el límite original
      calculatedPositions = [...basePositions];
      let currentPath = baseRiverPath;

      // Mejorar el espaciado dinámico
      const extraStops = stops.length - basePositions.length;
      const spacingX = Math.max(80, 200 - extraStops * 5); // Espaciado adaptativo
      const spacingY = 25; // Espaciado vertical más consistente

      for (let i = basePositions.length; i < stops.length; i++) {
        const stopIndex = i - basePositions.length;
        const lastPos = calculatedPositions[calculatedPositions.length - 1];
        
        // Crear un patrón serpenteante más natural
        let nextPos;
        if (stopIndex % 4 === 0) {
          // Hacia la derecha y ligeramente abajo
          nextPos = { x: lastPos.x + spacingX, y: lastPos.y + spacingY };
        } else if (stopIndex % 4 === 1) {
          // Hacia la derecha y más abajo
          nextPos = { x: lastPos.x + spacingX * 0.7, y: lastPos.y + spacingY * 2 };
        } else if (stopIndex % 4 === 2) {
          // Hacia la derecha y arriba
          nextPos = { x: lastPos.x + spacingX * 0.8, y: lastPos.y - spacingY * 0.5 };
        } else {
          // Hacia la derecha y centro
          nextPos = { x: lastPos.x + spacingX * 0.9, y: lastPos.y + spacingY * 1.5 };
        }

        calculatedPositions.push(nextPos);
        maxX = Math.max(maxX, nextPos.x);
        maxY = Math.max(maxY, nextPos.y);

        // Crear curvas más suaves para el río
        const controlPoint1 = { 
          x: lastPos.x + (nextPos.x - lastPos.x) * 0.3, 
          y: lastPos.y + (nextPos.y - lastPos.y) * 0.7 + Math.sin(stopIndex) * 15
        };
        const controlPoint2 = { 
          x: lastPos.x + (nextPos.x - lastPos.x) * 0.7, 
          y: lastPos.y + (nextPos.y - lastPos.y) * 0.3 - Math.cos(stopIndex) * 10
        };
        
        currentPath += ` C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${nextPos.x} ${nextPos.y}`;
      }
      calculatedPath = currentPath;
    }

    // Actualizar viewBox dinámicamente con padding
    const padding = 100;
    const dynamicViewBox = {
      x: -padding,
      y: -padding,
      width: maxX + padding * 2,
      height: maxY + padding * 2
    };

    setDynamicRiverPath(calculatedPath);
    setStopPositions(calculatedPositions);
    setViewBox(dynamicViewBox);
  }, [stops.length]);

  // useEffect para manejar el evento wheel con preventDefault
  useEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoomLevel(prev => Math.max(0.3, Math.min(2, prev + delta)));
    };

    // Agregar el event listener con passive: false para poder usar preventDefault
    mapContainer.addEventListener('wheel', handleWheel, { passive: false });

    // Cleanup
    return () => {
      mapContainer.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Función simplificada para obtener la posición de una parada
  const getRiverPosition = (index: number) => {
    return stopPositions[index] || { x: 0, y: 0 };
  };

  // Funciones para manejar el pan/drag del mapa
  const handleMouseDown = (e: React.MouseEvent) => {
    // Solo activar pan si no se está haciendo clic en una parada
    const target = e.target as SVGElement;
    if (target.tagName === 'circle' || target.tagName === 'text') return;
    
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    
    const deltaX = e.clientX - panStart.x;
    const deltaY = e.clientY - panStart.y;
    
    // Ajustar la sensibilidad del pan basado en el zoom
    const sensitivity = 1 / zoomLevel;
    
    setPanOffset({
      x: deltaX * sensitivity,
      y: deltaY * sensitivity
    });
  };

  const handleMouseUp = () => {
    if (isPanning) {
      // Aplicar el offset al viewBox permanentemente
      setViewBox(prev => ({
        x: prev.x - panOffset.x,
        y: prev.y - panOffset.y,
        width: prev.width,
        height: prev.height
      }));
      setPanOffset({ x: 0, y: 0 });
    }
    setIsPanning(false);
  };

  const handleMouseLeave = () => {
    if (isPanning) {
      handleMouseUp();
    }
  };

  const isStopFixed = (index: number) => {
    return index === 0 || index === stops.length - 1;
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isStopFixed(index)) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (isStopFixed(index)) {
      return;
    }
    setDragOverItem(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || isStopFixed(dropIndex)) {
      setDraggedIndex(null);
      setDragOverItem(null);
      return;
    }

    if (dropIndex === 0 || dropIndex === stops.length - 1) {
      setDraggedIndex(null);
      setDragOverItem(null);
      return;
    }

    const newStops = [...stops];
    const draggedItem = newStops.splice(draggedIndex, 1)[0];
    newStops.splice(dropIndex, 0, draggedItem);

    const finalStops = newStops.map((stop, index) => ({
      ...stop,
      stop_order: index + 1,
    }));

    setStops(finalStops);
    setDraggedIndex(null);
    setDragOverItem(null);
  };

  const handleStopClick = (stop: Partial<RouteStop>) => {
    setSelectedStop(stop);
    setIsStopModalOpen(true);
  };

  const getStopColor = (index: number, totalStops: number) => {
    if (index === 0) return 'text-green-600 bg-green-100 border-green-300';
    if (index === totalStops - 1) return 'text-red-600 bg-red-100 border-red-300';
    return 'text-blue-600 bg-blue-100 border-blue-300';
  };

  // Abrir modal para agregar parada
  const openAddStopModal = () => {
    if (stops.length < 2) return;
    
    // La nueva parada se insertará antes de la última (destino)
    const insertIndex = stops.length - 1;
    setAddStopPosition(insertIndex);
    setIsAddStopModalOpen(true);
  };

  // Agregar parada desde el modal
  const handleAddStop = (stopData: Partial<RouteStop>) => {
    const newStops = [...stops];
    const insertIndex = addStopPosition;

    // Insertar la nueva parada en la posición correcta
    newStops.splice(insertIndex, 0, stopData);

    // Reordenar todas las paradas
    const finalStops = newStops.map((stop, index) => ({
      ...stop,
      stop_order: index + 1,
    }));

    setStops(finalStops);
  };

  const removeStop = (index: number) => {
    if (isStopFixed(index)) return;

    const newStops = stops.filter((_, i) => i !== index);
    const finalStops = newStops.map((s, i) => ({ ...s, stop_order: i + 1 }));
    setStops(finalStops);
  };

  const updateStop = (index: number, field: keyof RouteStop, value: any) => {
    const newStops = [...stops];
    let updatedStop: Partial<RouteStop> = { ...newStops[index] };

    if (field === 'estimated_duration_from_origin' && typeof value === 'object') {
      const totalHours = (value.hours || 0) + (value.minutes || 0) / 60;
      updatedStop.estimated_duration_from_origin = routeHelpers.hoursToISOString(totalHours);
    } else if (field === 'port_id') {
      updatedStop.port_id = value;
      updatedStop.port = ports.find(p => p.id === value);
    } else {
      (updatedStop as any)[field] = value;
    }

    newStops[index] = updatedStop;
    setStops(newStops);
  };

  const startEditing = (stop: Partial<RouteStop>) => {
    setEditingStop({ ...stop });
  };

  const saveEdit = () => {
    if (editingStop) {
      setStops(stops.map(stop =>
        stop.stop_order === editingStop.stop_order ? editingStop : stop
      ));
      setEditingStop(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!route) return;
    const payload = stops.map(({ port, id, route_id, ...rest }) => rest) as RouteStopCreateData[];
    await updateRouteStops.mutateAsync({
      routeId: route.id,
      stops: payload,
    });
    onClose();
  };

  const parseDurationForUI = (isoString?: string) => {
    const totalHours = routeHelpers.isoStringToHours(isoString || 'PT0S');
    return {
      hours: Math.floor(totalHours),
      minutes: Math.round((totalHours % 1) * 60),
    };
  };

  if (!isOpen || !route) return null;

  return (
    <>
      {/* Modal Principal */}
      <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="6xl">
        <div className="h-[90vh] flex flex-col">
          {/* Header personalizado mejorado */}
          <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Gestión de Ruta Fluvial</h2>
              <p className="text-lg text-gray-600 mt-1">{route.name}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center">
                  <MapIcon className="h-4 w-4 mr-1" />
                  {stops.length} paradas configuradas
                </span>
                <span className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {routeHelpers.isoStringToHours(route.estimated_duration).toFixed(1)}h estimadas
                </span>
              </div>
            </div>

            {/* Controles de vista mejorados */}
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
                className="px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center space-x-2 border border-gray-200 hover:border-blue-300 text-sm font-medium"
              >
                {viewMode === 'map' ? (
                  <>
                    <ListBulletIcon className="h-4 w-4 text-blue-600" />
                    <span>Vista Lista</span>
                  </>
                ) : (
                  <>
                    <MapIcon className="h-4 w-4 text-green-600" />
                    <span>Vista Mapa</span>
                  </>
                )}
              </button>

              {/* Controles de zoom (solo en vista mapa) */}
              {viewMode === 'map' && (
                <div className="flex items-center space-x-1 bg-white rounded-lg border border-gray-200 p-1">
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(0.3, prev - 0.2))}
                    className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors flex items-center space-x-1"
                    title="Alejar"
                  >
                    <MinusIcon className="h-3 w-3" />
                  </button>
                  <span className="px-2 py-1 text-xs font-medium text-gray-700 min-w-[50px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.2))}
                    className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors flex items-center space-x-1"
                    title="Acercar"
                  >
                    <PlusIcon className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors border-l border-gray-200 ml-1 flex items-center space-x-1"
                    title="Reset zoom"
                  >
                    <HomeIcon className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => {
                      setZoomLevel(1);
                      setPanOffset({ x: 0, y: 0 });
                      // Restaurar viewBox original basado en las paradas actuales
                      const padding = 100;
                      const maxX = Math.max(880, ...stopPositions.map(pos => pos.x));
                      const maxY = Math.max(820, ...stopPositions.map(pos => pos.y));
                      setViewBox({
                        x: -padding,
                        y: -padding,
                        width: maxX + padding * 2,
                        height: maxY + padding * 2
                      });
                    }}
                    className="px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 rounded transition-colors border-l border-gray-200 ml-1 flex items-center space-x-1"
                    title="Centrar mapa"
                  >
                    <MapPinIcon className="h-3 w-3" />
                  </button>
                </div>
              )}

              <button
                onClick={openAddStopModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center space-x-2 text-sm font-medium"
              >
                <PlusCircleIcon className="h-4 w-4" />
                <span>Agregar Parada</span>
              </button>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 overflow-hidden">
            {viewMode === 'map' ? (
              <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-auto">
                {/* Información de zoom y paradas */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm z-10">
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Zoom: {Math.round(zoomLevel * 100)}%</div>
                    <div>Paradas: {stops.length}</div>
                    <div className="text-xs text-gray-500 pt-1 border-t space-y-0.5">
                      <div className="flex items-center space-x-1">
                        <CursorArrowRaysIcon className="h-3 w-3" />
                        <span>Scroll: Zoom</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <HandRaisedIcon className="h-3 w-3" />
                        <span>Arrastrar: Mover mapa</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CursorArrowRippleIcon className="h-3 w-3" />
                        <span>Clic: Detalles de parada</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SVG con zoom y viewBox dinámico */}
                <div 
                  ref={mapContainerRef}
                  className={`w-full h-full flex items-center justify-center ${
                    isPanning ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                >
                  <svg 
                    className="transition-transform duration-200 select-none" 
                    style={{ 
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'center center'
                    }}
                    viewBox={`${viewBox.x - panOffset.x} ${viewBox.y - panOffset.y} ${viewBox.width} ${viewBox.height}`} 
                    width={viewBox.width} 
                    height={viewBox.height}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <defs>
                      <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 0.8 }} />
                        <stop offset="100%" style={{ stopColor: '#1E40AF', stopOpacity: 0.9 }} />
                      </linearGradient>
                    </defs>

                    {/* Río principal con path dinámico */}
                    <path
                      d={dynamicRiverPath}
                      stroke="url(#riverGradient)"
                      strokeWidth="16"
                      fill="none"
                      strokeLinecap="round"
                    />

                    {/* Sombra del río */}
                    <path
                      d={dynamicRiverPath}
                      stroke="rgba(0,0,0,0.1)"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      transform="translate(4,4)"
                    />

                    {/* Afluentes decorativos estáticos */}
                    <path d="M 80 80 Q 100 70, 120 60" stroke="url(#riverGradient)" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" />
                    <path d="M 300 120 Q 290 130, 280 140" stroke="url(#riverGradient)" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.7" />
                    <path d="M 480 160 Q 465 170, 450 180" stroke="url(#riverGradient)" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.6" />
                    <path d="M 770 260 Q 760 270, 750 280" stroke="url(#riverGradient)" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" />
                    <path d="M 840 360 Q 830 370, 820 380" stroke="url(#riverGradient)" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.7" />
                    <path d="M 900 460 Q 890 470, 880 480" stroke="url(#riverGradient)" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" />
                    <path d="M 840 600 Q 830 590, 820 580" stroke="url(#riverGradient)" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.7" />
                    <path d="M 700 700 Q 690 690, 680 680" stroke="url(#riverGradient)" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" />
                    <path d="M 400 840 Q 390 830, 380 820" stroke="url(#riverGradient)" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" />

                    {stops.map((stop, index) => {
                      const riverPos = getRiverPosition(index);
                      const isFirst = index === 0;
                      const isLast = index === stops.length - 1;
                      const isFixed = isStopFixed(index);

                      return (
                        <g key={stop.id || `map-stop-${index}-${stop.port_id || 'temp'}`}>
                          <circle
                            cx={riverPos.x - 35}
                            cy={riverPos.y - 35}
                            r="14"
                            fill="white"
                            stroke="#6B7280"
                            strokeWidth="2"
                            className="drop-shadow-md"
                          />
                          <text
                            x={riverPos.x - 35}
                            y={riverPos.y - 30}
                            textAnchor="middle"
                            className="text-xs font-bold fill-gray-700"
                          >
                            {index + 1}
                          </text>

                          <circle
                            cx={riverPos.x}
                            cy={riverPos.y}
                            r="26"
                            fill="white"
                            stroke={isFirst ? '#059669' : isLast ? '#DC2626' : '#2563EB'}
                            strokeWidth={isFixed ? "6" : "4"}
                            className={`cursor-pointer hover:r-30 transition-all duration-200 drop-shadow-lg ${
                              isFixed ? 'stroke-4' : ''
                            }`}
                            onClick={() => handleStopClick(stop)}
                          />

                          {/* Ícono de embarcación */}
                          <foreignObject 
                            x={riverPos.x - 10} 
                            y={riverPos.y - 10} 
                            width="20" 
                            height="20"
                            className="pointer-events-none"
                          >
                            {isFixed ? (
                              <PaperAirplaneIcon className="w-5 h-5 text-gray-700" />
                            ) : (
                              <MapPinIcon className="w-5 h-5 text-blue-600" />
                            )}
                          </foreignObject>

                          <text
                            x={riverPos.x}
                            y={riverPos.y - 45}
                            textAnchor="middle"
                            className={`text-sm font-bold pointer-events-none ${
                              isFixed ? 'fill-gray-900' : 'fill-gray-800'
                            }`}
                            style={{ textShadow: '2px 2px 4px rgba(255,255,255,0.9)' }}
                          >
                            {stop.port?.name || `Parada ${index + 1}`}
                          </text>

                          {isFixed && (
                            <>
                              <text
                                x={riverPos.x}
                                y={riverPos.y + 50}
                                textAnchor="middle"
                                className={`text-xs font-bold pointer-events-none ${
                                  isFirst ? 'fill-green-700' : 'fill-red-700'
                                }`}
                                style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}
                              >
                                {isFirst ? 'ORIGEN' : 'DESTINO'}
                              </text>
                              <circle
                                cx={riverPos.x + 20}
                                cy={riverPos.y - 20}
                                r="8"
                                fill={isFirst ? '#059669' : '#DC2626'}
                                className="drop-shadow-sm"
                              />
                              {/* Ícono de candado */}
                              <foreignObject 
                                x={riverPos.x + 16} 
                                y={riverPos.y - 24} 
                                width="8" 
                                height="8"
                                className="pointer-events-none"
                              >
                                <LockClosedIcon className="w-2 h-2 text-white" />
                              </foreignObject>
                            </>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            ) : (
              // Vista Lista
              <div className="h-full overflow-y-auto p-6 bg-gray-50">
                {/* Sección de visualización lineal */}
                <div className="bg-white rounded-lg p-6 mb-6 border shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">Visualización Lineal de la Ruta</h3>
                    {/* Contador de paradas */}
                    <div className="bg-blue-50 px-3 py-2 rounded-lg shadow-sm border border-blue-200">
                      <div className="flex items-center space-x-2">
                        <MapPinIcon className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-semibold text-gray-700">{stops.length}</span>
                        <span className="text-xs text-gray-500">Paradas</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Arrastra las paradas intermedias para reordenarlas.
                    <span className="font-medium text-blue-600"> Las paradas de origen y destino están fijas.</span>
                  </p>
                  <RouteTimeline
                    stops={stops}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onStopClick={handleStopClick}
                    draggedIndex={draggedIndex}
                  />
                </div>

                {/* Lista de gestión detallada */}
                <div className="bg-white rounded-lg p-6 border shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Gestión Detallada de Paradas</h3>
                  <div className="space-y-4">
                    {stops.map((stop, index) => {
                      const duration = parseDurationForUI(stop.estimated_duration_from_origin);
                      const isFixed = isStopFixed(index);
                      const isFirst = index === 0;
                      const isLast = index === stops.length - 1;

                      return (
                        <div
                          key={stop.id || `list-stop-${index}-${stop.port_id || 'temp'}`}
                          draggable={!isFixed}
                          onDragStart={(e) => !isFixed && handleDragStart(e, index)}
                          onDragOver={(e) => !isFixed && handleDragOver(e, index)}
                          onDrop={(e) => !isFixed && handleDrop(e, index)}
                          className={`p-6 rounded-lg border-2 transition-all ${
                            dragOverItem === index ? 'border-blue-400 bg-blue-50' :
                            isFixed ? 'border-gray-300 bg-gray-50' : 'border-gray-200 bg-white'
                          } ${!isFixed ? 'hover:shadow-md cursor-move' : 'cursor-default'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6 flex-1">
                              {!isFixed ? (
                                <Bars3Icon className="h-6 w-6 text-gray-400" />
                              ) : (
                                <div className="w-6 h-6 flex items-center justify-center">
                                  <LockClosedIcon className="h-4 w-4 text-gray-500" />
                                </div>
                              )}

                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                isFixed ? 'bg-gray-300 text-gray-700' : 'bg-gray-200 text-gray-600'
                              }`}>
                                {index + 1}
                              </div>

                              <div className={`p-3 rounded-full border-2 ${getStopColor(index, stops.length)}`}>
                                {isFixed ? (
                                  <PaperAirplaneIcon className="h-5 w-5" />
                                ) : (
                                  <MapPinIcon className="h-5 w-5" />
                                )}
                              </div>

                              <div className="flex-1 grid grid-cols-5 gap-6 items-center">
                                <div className="col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Puerto</label>
                                  <select
                                    value={stop.port_id}
                                    onChange={(e) => updateStop(index, 'port_id', parseInt(e.target.value))}
                                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    disabled={isFixed}
                                  >
                                    <option value={0}>Seleccionar puerto</option>
                                    {ports.map((p) => (
                                      <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Duración (H:M)</label>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="number"
                                      value={duration.hours}
                                      onChange={(e) => updateStop(index, 'estimated_duration_from_origin', { hours: parseInt(e.target.value) || 0, minutes: duration.minutes })}
                                      className="w-16 px-2 py-2 border border-gray-300 rounded-md text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      min="0"
                                      disabled={isFirst}
                                      placeholder="0"
                                    />
                                    <span className="text-gray-400 font-medium">:</span>
                                    <input
                                      type="number"
                                      value={duration.minutes}
                                      onChange={(e) => updateStop(index, 'estimated_duration_from_origin', { hours: duration.hours, minutes: parseInt(e.target.value) || 0 })}
                                      className="w-16 px-2 py-2 border border-gray-300 rounded-md text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      min="0" max="59"
                                      disabled={isFirst}
                                      placeholder="0"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                                  <input
                                    type="text"
                                    value={stop.notes || ''}
                                    onChange={(e) => updateStop(index, 'notes', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Opcional..."
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Operaciones</label>
                                  <div className="space-y-2">
                                    <label className="flex items-center text-sm">
                                      <input
                                        type="checkbox"
                                        checked={stop.is_boarding_allowed || false}
                                        onChange={(e) => updateStop(index, 'is_boarding_allowed', e.target.checked)}
                                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        disabled={isLast}
                                      />
                                      <span className={isLast ? 'text-gray-400' : 'text-gray-700'}>Embarque</span>
                                    </label>
                                    <label className="flex items-center text-sm">
                                      <input
                                        type="checkbox"
                                        checked={stop.is_disembarking_allowed || false}
                                        onChange={(e) => updateStop(index, 'is_disembarking_allowed', e.target.checked)}
                                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        disabled={isFirst}
                                      />
                                      <span className={isFirst ? 'text-gray-400' : 'text-gray-700'}>Desembarque</span>
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 ml-6">
                              {!isFixed && (
                                <button
                                  onClick={() => removeStop(index)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  title="Eliminar parada"
                                >
                                  <MinusCircleIcon className="h-5 w-5" />
                                </button>
                              )}
                              {isFixed && (
                                <div className="px-3 py-1.5 bg-gray-200 rounded-md text-sm font-medium text-gray-700">
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
            )}
          </div>

          {/* Footer con acciones mejorado */}
          <div className="border-t p-4 bg-white">
            <form onSubmit={handleSubmit}>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Ruta con <span className="font-medium text-gray-700">{stops.length}</span> paradas configuradas
                  {stops.length > 2 && (
                    <span className="ml-2 text-blue-600">
                      ({stops.length - 2} paradas intermedias)
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={updateRouteStops.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {updateRouteStops.isPending ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </Modal>

      {/* Modal de detalles de parada */}
      {isStopModalOpen && selectedStop && (
        <Modal
          isOpen={isStopModalOpen}
          onClose={() => setIsStopModalOpen(false)}
          title={`Detalles: ${selectedStop.port?.name || 'Parada'}`}
          maxWidth="md"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-3 rounded-full border-2 ${getStopColor(stops.findIndex(s => s.id === selectedStop.id), stops.length)}`}>
                {isStopFixed(stops.findIndex(s => s.id === selectedStop.id)) ? (
                  <PaperAirplaneIcon className="h-5 w-5" />
                ) : (
                  <MapPinIcon className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{selectedStop.port?.name}</h3>
                <p className="text-gray-600">
                  Parada #{selectedStop.stop_order}
                  {isStopFixed(stops.findIndex(s => s.id === selectedStop.id)) && (
                    <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                      {stops.findIndex(s => s.id === selectedStop.id) === 0 ? 'ORIGEN' : 'DESTINO'}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-gray-500" />
                <div>
                  <span className="text-sm text-gray-500">Tiempo desde origen</span>
                  <p className="font-semibold">
                    {routeHelpers.isoStringToHours(selectedStop.estimated_duration_from_origin || 'PT0S').toFixed(1)}h
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="h-5 w-5 text-gray-500" />
                <div>
                  <span className="text-sm text-gray-500">Operaciones</span>
                  <p className="font-semibold">
                    {selectedStop.is_boarding_allowed && selectedStop.is_disembarking_allowed ? 'Embarque y Desembarque' :
                     selectedStop.is_boarding_allowed ? 'Solo Embarque' :
                     selectedStop.is_disembarking_allowed ? 'Solo Desembarque' : 'Sin operaciones'}
                  </p>
                </div>
              </div>
            </div>
            {selectedStop.notes && (
              <div>
                <span className="text-sm text-gray-500">Notas</span>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedStop.notes}</p>
              </div>
            )}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <button
                onClick={() => {
                  startEditing(selectedStop);
                  setIsStopModalOpen(false);
                }}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Editar Parada
              </button>
              <button
                onClick={() => setIsStopModalOpen(false)}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de edición rápida */}
      {editingStop && (
        <Modal
          isOpen={!!editingStop}
          onClose={() => setEditingStop(null)}
          title="Editar Parada"
          maxWidth="md"
        >
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Puerto</label>
              <select
                value={editingStop.port_id}
                onChange={(e) => setEditingStop({...editingStop, port_id: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="0">Seleccionar puerto</option>
                {ports.map((port) => (
                  <option key={port.id} value={port.id}>{port.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                value={editingStop.notes || ''}
                onChange={(e) => setEditingStop({...editingStop, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Notas opcionales..."
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingStop.is_boarding_allowed || false}
                  onChange={(e) => setEditingStop({...editingStop, is_boarding_allowed: e.target.checked})}
                  className="mr-2"
                />
                Permitir embarque
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingStop.is_disembarking_allowed || false}
                  onChange={(e) => setEditingStop({...editingStop, is_disembarking_allowed: e.target.checked})}
                  className="mr-2"
                />
                Permitir desembarque
              </label>
            </div>
            <div className="flex space-x-2 pt-4">
              <button
                onClick={saveEdit}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={() => setEditingStop(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal para agregar parada */}
      <AddStopModal
        isOpen={isAddStopModalOpen}
        onClose={() => setIsAddStopModalOpen(false)}
        onAddStop={handleAddStop}
        existingStops={stops}
        ports={ports}
        insertPosition={addStopPosition}
      />
    </>
  );
};