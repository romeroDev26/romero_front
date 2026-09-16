import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '@/utils/sileo-toast';
import { usePortsData } from '../../../hooks/usePorts';
import {
  useUpdateRouteStops,
  routeHelpers,
} from '../hooks/useVesselsRoutesData';
import { RouteWithStops, RouteStopCreateData } from '../../../services/routes.service';
import { RouteStop } from '../../../types';

export function useRouteMap(isOpen: boolean, route?: RouteWithStops) {
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

  const [dynamicRiverPath, setDynamicRiverPath] = useState('');
  const [stopPositions, setStopPositions] = useState<{ x: number; y: number }[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1200, height: 900 });

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Inicializar paradas
  useEffect(() => {
    if (isOpen && route) {
      if (route.stops && route.stops.length > 0) {
        const stopsWithPortObjects = route.stops.map((stop) => ({
          ...stop,
          port: ports.find((p) => p.id === stop.port_id),
        }));
        setStops(stopsWithPortObjects);
      } else {
        const originPort = ports.find((p) => p.id === route.origin_port_id);
        const destinationPort = ports.find((p) => p.id === route.destination_port_id);
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

  // Calcular río y posiciones
  useEffect(() => {
    const basePositions = [
      { x: 120, y: 60 },
      { x: 280, y: 140 },
      { x: 450, y: 180 },
      { x: 580, y: 260 },
      { x: 750, y: 280 },
      { x: 820, y: 380 },
      { x: 880, y: 480 },
      { x: 820, y: 580 },
      { x: 680, y: 680 },
      { x: 520, y: 750 },
      { x: 380, y: 820 },
    ];
    const baseRiverPath =
      'M 120 60 Q 200 100, 280 140 Q 360 160, 450 180 Q 520 220, 580 260 Q 670 270, 750 280 Q 785 330, 820 380 Q 850 430, 880 480 Q 850 530, 820 580 Q 750 630, 680 680 Q 600 715, 520 750 Q 450 785, 380 820';

    if (stops.length === 0) {
      setDynamicRiverPath('');
      setStopPositions([]);
      setViewBox({ x: 0, y: 0, width: 1200, height: 900 });
      return;
    }

    let calculatedPositions: { x: number; y: number }[] = [];
    let calculatedPath = baseRiverPath;
    let maxX = 880;
    let maxY = 820;

    if (stops.length <= basePositions.length) {
      const tempPositions = [];
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
    } else {
      calculatedPositions = [...basePositions];
      let currentPath = baseRiverPath;
      const extraStops = stops.length - basePositions.length;
      const spacingX = Math.max(80, 200 - extraStops * 5);
      const spacingY = 25;

      for (let i = basePositions.length; i < stops.length; i++) {
        const stopIndex = i - basePositions.length;
        const lastPos = calculatedPositions[calculatedPositions.length - 1];
        let nextPos;
        if (stopIndex % 4 === 0) {
          nextPos = { x: lastPos.x + spacingX, y: lastPos.y + spacingY };
        } else if (stopIndex % 4 === 1) {
          nextPos = { x: lastPos.x + spacingX * 0.7, y: lastPos.y + spacingY * 2 };
        } else if (stopIndex % 4 === 2) {
          nextPos = { x: lastPos.x + spacingX * 0.8, y: lastPos.y - spacingY * 0.5 };
        } else {
          nextPos = { x: lastPos.x + spacingX * 0.9, y: lastPos.y + spacingY * 1.5 };
        }

        calculatedPositions.push(nextPos);
        maxX = Math.max(maxX, nextPos.x);
        maxY = Math.max(maxY, nextPos.y);

        const controlPoint1 = {
          x: lastPos.x + (nextPos.x - lastPos.x) * 0.3,
          y: lastPos.y + (nextPos.y - lastPos.y) * 0.7 + Math.sin(stopIndex) * 15,
        };
        const controlPoint2 = {
          x: lastPos.x + (nextPos.x - lastPos.x) * 0.7,
          y: lastPos.y + (nextPos.y - lastPos.y) * 0.3 - Math.cos(stopIndex) * 10,
        };

        currentPath += ` C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${nextPos.x} ${nextPos.y}`;
      }
      calculatedPath = currentPath;
    }

    const padding = 100;
    const dynamicViewBox = {
      x: -padding,
      y: -padding,
      width: maxX + padding * 2,
      height: maxY + padding * 2,
    };

    setDynamicRiverPath(calculatedPath);
    setStopPositions(calculatedPositions);
    setViewBox(dynamicViewBox);
  }, [stops.length]);

  // Wheel zoom
  useEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoomLevel((prev) => Math.max(0.3, Math.min(2, prev + delta)));
    };

    mapContainer.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      mapContainer.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const getRiverPosition = (index: number) => {
    return stopPositions[index] || { x: 0, y: 0 };
  };

  const isStopFixed = useCallback((index: number) => {
    return index === 0 || index === stops.length - 1;
  }, [stops.length]);

  // Pan handlers
  // Touch pan state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as SVGElement;
    if (target.tagName === 'circle' || target.tagName === 'text') return;
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      const sensitivity = 1 / zoomLevel;
      setPanOffset({
        x: deltaX * sensitivity,
        y: deltaY * sensitivity,
      });
    },
    [isPanning, panStart, zoomLevel]
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setViewBox((prev) => ({
        x: prev.x - panOffset.x,
        y: prev.y - panOffset.y,
        width: prev.width,
        height: prev.height,
      }));
      setPanOffset({ x: 0, y: 0 });
    }
    setIsPanning(false);
  }, [isPanning, panOffset]);

  const handleMouseLeave = useCallback(() => {
    if (isPanning) {
      handleMouseUp();
    }
  }, [isPanning, handleMouseUp]);

  // Touch handlers for mobile pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const target = e.target as SVGElement;
      if (target.tagName === 'circle' || target.tagName === 'text') return;
      setIsPanning(true);
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPanning || e.touches.length !== 1 || !touchStart) return;
    e.preventDefault();
    const deltaX = e.touches[0].clientX - touchStart.x;
    const deltaY = e.touches[0].clientY - touchStart.y;
    const sensitivity = 1 / zoomLevel;
    setPanOffset({
      x: deltaX * sensitivity,
      y: deltaY * sensitivity,
    });
  }, [isPanning, touchStart, zoomLevel]);

  const handleTouchEnd = useCallback(() => {
    if (isPanning) {
      setViewBox((prev) => ({
        x: prev.x - panOffset.x,
        y: prev.y - panOffset.y,
        width: prev.width,
        height: prev.height,
      }));
      setPanOffset({ x: 0, y: 0 });
    }
    setIsPanning(false);
    setTouchStart(null);
  }, [isPanning, panOffset]);

  // Drag & drop
  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      if (isStopFixed(index)) {
        e.preventDefault();
        return;
      }
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = 'move';
    },
    [isStopFixed]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (isStopFixed(index)) return;
      setDragOverItem(index);
    },
    [isStopFixed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
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
    },
    [draggedIndex, isStopFixed, stops]
  );

  // Move stop up/down for mobile reordering (no drag & drop)
  const moveStopUp = useCallback(
    (index: number) => {
      if (index <= 1) return;
      const newStops = [...stops];
      const temp = newStops[index];
      newStops[index] = newStops[index - 1];
      newStops[index - 1] = temp;
      const finalStops = newStops.map((stop, i) => ({
        ...stop,
        stop_order: i + 1,
      }));
      setStops(finalStops);
    },
    [stops]
  );

  const moveStopDown = useCallback(
    (index: number) => {
      if (index >= stops.length - 2) return;
      const newStops = [...stops];
      const temp = newStops[index];
      newStops[index] = newStops[index + 1];
      newStops[index + 1] = temp;
      const finalStops = newStops.map((stop, i) => ({
        ...stop,
        stop_order: i + 1,
      }));
      setStops(finalStops);
    },
    [stops]
  );

  const handleStopClick = useCallback((stop: Partial<RouteStop>) => {
    setSelectedStop(stop);
    setIsStopModalOpen(true);
  }, []);

  const openAddStopModal = useCallback(() => {
    if (stops.length < 2) return;
    const insertIndex = stops.length - 1;
    setAddStopPosition(insertIndex);
    setIsAddStopModalOpen(true);
  }, [stops.length]);

  const handleAddStop = useCallback(
    (stopData: Partial<RouteStop>) => {
      const newStops = [...stops];
      newStops.splice(addStopPosition, 0, stopData);
      const finalStops = newStops.map((stop, index) => ({
        ...stop,
        stop_order: index + 1,
      }));
      setStops(finalStops);
    },
    [addStopPosition, stops]
  );

  const removeStop = useCallback(
    (index: number) => {
      if (isStopFixed(index)) return;
      const newStops = stops.filter((_, i) => i !== index);
      const finalStops = newStops.map((s, i) => ({ ...s, stop_order: i + 1 }));
      setStops(finalStops);
    },
    [isStopFixed, stops]
  );

  const updateStop = useCallback(
    (index: number, field: keyof RouteStop, value: any) => {
      const newStops = [...stops];
      const updatedStop: Partial<RouteStop> = { ...newStops[index] };
      if (field === 'estimated_duration_from_origin' && typeof value === 'object') {
        const totalHours = (value.hours || 0) + (value.minutes || 0) / 60;
        updatedStop.estimated_duration_from_origin = routeHelpers.hoursToISOString(totalHours);
      } else if (field === 'port_id') {
        updatedStop.port_id = value;
        updatedStop.port = ports.find((p) => p.id === value);
      } else {
        (updatedStop as any)[field] = value;
      }
      newStops[index] = updatedStop;
      setStops(newStops);
    },
    [ports, stops]
  );

  const startEditing = useCallback((stop: Partial<RouteStop>) => {
    setEditingStop({ ...stop });
  }, []);

  const saveEdit = useCallback(() => {
    if (editingStop) {
      setStops((prev) =>
        prev.map((stop) =>
          stop.stop_order === editingStop.stop_order ? editingStop : stop
        )
      );
      setEditingStop(null);
    }
  }, [editingStop]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent, onClose: () => void) => {
      e.preventDefault();
      if (!route) return;
      const payload = stops.map(({ port, id, route_id, ...rest }) => rest) as RouteStopCreateData[];
      await updateRouteStops.mutateAsync({
        routeId: route.id,
        stops: payload,
      });
      onClose();
    },
    [route, stops, updateRouteStops]
  );

  const parseDurationForUI = useCallback((isoString?: string) => {
    const totalHours = routeHelpers.isoStringToHours(isoString || 'PT0S');
    return {
      hours: Math.floor(totalHours),
      minutes: Math.round((totalHours % 1) * 60),
    };
  }, []);

  const resetView = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    const padding = 100;
    const maxX = Math.max(880, ...stopPositions.map((pos) => pos.x));
    const maxY = Math.max(820, ...stopPositions.map((pos) => pos.y));
    setViewBox({
      x: -padding,
      y: -padding,
      width: maxX + padding * 2,
      height: maxY + padding * 2,
    });
  }, [stopPositions]);

  return {
    ports,
    stops,
    viewMode,
    setViewMode,
    selectedStop,
    isStopModalOpen,
    setIsStopModalOpen,
    editingStop,
    setEditingStop,
    isAddStopModalOpen,
    setIsAddStopModalOpen,
    addStopPosition,
    draggedIndex,
    dragOverItem,
    dynamicRiverPath,
    stopPositions,
    zoomLevel,
    setZoomLevel,
    viewBox,
    isPanning,
    panOffset,
    mapContainerRef,
    getRiverPosition,
    isStopFixed,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleDragStart,
    handleDragOver,
    handleDrop,
    moveStopUp,
    moveStopDown,
    handleStopClick,
    openAddStopModal,
    handleAddStop,
    removeStop,
    updateStop,
    startEditing,
    saveEdit,
    handleSubmit,
    parseDurationForUI,
    resetView,
    isSaving: updateRouteStops.isPending,
  };
}
