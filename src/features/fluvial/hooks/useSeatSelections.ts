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
  removeSelection: (seatId: number) => void;
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
    
    // ✅ NUEVO: Seguir mis propias selecciones
    if (selection.userId === userId) {
      setMyActiveSelections(prev => new Set([...prev, selection.seatId]));
    }
  }, [userId]);

  const removeSelection = useCallback((seatId: number) => {
    setActiveSeatSelections(prev => {
      const newMap = new Map(prev);
      const removedSelection = newMap.get(seatId);
      newMap.delete(seatId);
      
      // ✅ NUEVO: Remover de mis selecciones si era mía
      if (removedSelection?.userId === userId) {
        setMyActiveSelections(prevMine => {
          const newSet = new Set(prevMine);
          newSet.delete(seatId);
          return newSet;
        });
      }
      
      return newMap;
    });
  }, [userId]);

  // ✅ NUEVO: Función para agregar mi propia selección
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
    // Obtener el valor actual sin crear dependencia
    setActiveSeatSelections(current => {
      console.log('Active seat selections:', {
        totalSelections: current.size,
        selections: Array.from(current.entries()).map(([seatId, selection]) => ({
          seatId,
          userName: selection.userName,
          userId: selection.userId,
          timestamp: selection.timestamp
        }))
      });
      return current; // No modificar el estado
    });
  }, []); // Sin dependencias para evitar recreación

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
