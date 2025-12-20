// src/features/fluvial/hooks/useSeatSelections.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { SeatSelection } from '../types/websocket.types';

interface UseSeatSelectionsOptions {
  userId: string;
  seatSelectionTimeout?: number;
  cleanupInterval?: number;
}

interface UseSeatSelectionsReturn {
  activeSeatSelections: Map<number, SeatSelection>;
  myReservedSeats: Set<number>;
  myActiveSelections: Set<number>; // ✅ NUEVO: Mis selecciones activas
  myReservedSeatsRef: React.RefObject<Set<number>>; // Nueva referencia expuesta
  addSelection: (selection: SeatSelection) => void;
  removeSelection: (seatId: number, sourceUserId?: string) => void;
  addMySelection: (seatId: number) => void; // ✅ NUEVO: Agregar mi propia selección
  addReservation: (seatId: number) => void;
  removeReservation: (seatId: number) => void;
  clearAllReservations: () => void;
  debugActiveSelections: () => void;
}

export const useSeatSelections = ({
  userId,
  seatSelectionTimeout = 30000,
  cleanupInterval = 5000
}: UseSeatSelectionsOptions): UseSeatSelectionsReturn => {
  const [activeSeatSelections, setActiveSeatSelections] = useState<Map<number, SeatSelection>>(new Map());
  const [myReservedSeats, setMyReservedSeats] = useState<Set<number>>(new Set());
  const [myActiveSelections, setMyActiveSelections] = useState<Set<number>>(new Set()); // ✅ NUEVO: Mis selecciones activas
  
  // Referencias estables - se actualizan manualmente solo cuando es necesario
  const myReservedSeatsRef = useRef<Set<number>>(new Set());
  const userIdRef = useRef(userId);
  const seatSelectionTimeoutRef = useRef(seatSelectionTimeout);
  const cleanupIntervalRef = useRef(cleanupInterval);
  
  // Actualizar referencias solo cuando cambien los props (no los estados)
  useEffect(() => {
    userIdRef.current = userId;
    seatSelectionTimeoutRef.current = seatSelectionTimeout;
    cleanupIntervalRef.current = cleanupInterval;
  }, [userId, seatSelectionTimeout, cleanupInterval]);

  const addSelection = useCallback((selection: SeatSelection) => {
    setActiveSeatSelections(prev => {
      const newMap = new Map(prev);
      newMap.set(selection.seatId, selection);
      return newMap;
    });
    //  CORRECCIÓN: Comparar userId base para reconocer representantes propios
    const selectionBaseUserId = selection.userId.split('-company-')[0];
    if (selectionBaseUserId === userId) {
      setMyActiveSelections(prev => new Set([...prev, selection.seatId]));
    }
  }, [userId]);

  const removeSelection = useCallback((seatId: number, sourceUserId?: string) => {
    setActiveSeatSelections(prev => {
      const newMap = new Map(prev);
      const existingSelection = newMap.get(seatId);
      
      if (!existingSelection) {
        return prev; // No hay cambios si no existe
      }

      // Verificar si el mensaje de liberación viene del mismo usuario
      // que tiene la selección. Si sourceUserId está definido y no coincide con el
      // userId de la selección existente, NO eliminar.
      if (sourceUserId) {
        const sourceBaseUserId = sourceUserId.split('-company-')[0];
        const existingBaseUserId = existingSelection.userId.split('-company-')[0];
        
        // Si los userId base NO coinciden, no eliminar la selección
        // Esto previene que liberaciones de un usuario afecten las selecciones de otro
        if (sourceBaseUserId !== existingBaseUserId) {
          return prev; // No eliminar, los userId base no coinciden
        }
      }

      // Proceder con la eliminación
      newMap.delete(seatId);
      
      //  CORRECCIÓN: Comparar userId base para reconocer representantes propios
      const removedBaseUserId = existingSelection.userId.split('-company-')[0];
      if (removedBaseUserId === userId) {
        setMyActiveSelections(prevMine => {
          const newSet = new Set(prevMine);
          newSet.delete(seatId);
          return newSet;
        });
      }
      
      return newMap;
    });
  }, [userId]);

  //  NUEVO: Función para agregar mi propia selección
  const addMySelection = useCallback((seatId: number) => {
    setMyActiveSelections(prev => new Set([...prev, seatId]));
  }, []);

  const addReservation = useCallback((seatId: number) => {
    setMyReservedSeats(prev => {
      const newSet = new Set([...prev, seatId]);
      myReservedSeatsRef.current = newSet;
      return newSet;
    });
  }, []);

  const removeReservation = useCallback((seatId: number) => {
    setMyReservedSeats(prev => {
      const newSet = new Set(prev);
      newSet.delete(seatId);
      myReservedSeatsRef.current = newSet;
      return newSet;
    });
  }, []);

  const clearAllReservations = useCallback(() => {
    setMyReservedSeats(() => {
      const newSet = new Set<number>();
      myReservedSeatsRef.current = newSet;
      return newSet;
    });
  }, []);

  const debugActiveSelections = useCallback(() => {
    // Función de debugging eliminada
  }, []);

  return {
    activeSeatSelections,
    myReservedSeats,
    myActiveSelections, //  NUEVO: Mis selecciones activas
    myReservedSeatsRef, // Nueva referencia expuesta
    addSelection,
    removeSelection,
    addMySelection, //  NUEVO: Agregar mi propia selección
    addReservation,
    removeReservation,
    clearAllReservations,
    debugActiveSelections
  };
};
