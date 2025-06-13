// src/hooks/useFares.ts (archivo renombrado desde useFaresData.ts)
import { useState, useEffect, useCallback } from 'react';
import { Fare, ServiceCategory } from '../types'; // Asumo que tienes Port, Route también
import fareService, { CreateFareData, UpdateFareData, FareFilters } from '../services/fareService';
// Importa tus otros servicios si son necesarios
 import { portsConfigService } from '../services/ports.cities.service';

// CAMBIO: Renombramos el hook para que coincida con el uso en FaresPage
export const useFares = (companyId: number, initialFilters?: Partial<FareFilters>) => {
  const [fares, setFares] = useState<Fare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFares = useCallback(async () => {
    if (!companyId) {
      setError("No se ha proporcionado un ID de compañía.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const filters = {
        company_id: companyId,
        ...initialFilters
      };
      const data = await fareService.listFares(filters);
      setFares(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las tarifas');
    } finally {
      setLoading(false);
    }
  }, [companyId, initialFilters]);

  useEffect(() => {
    fetchFares();
  }, [fetchFares]);

  const createFare = useCallback(async (data: CreateFareData) => {
    try {
      const newFare = await fareService.createFare(data);
      // Actualizamos el estado local para reflejar el cambio instantáneamente
      setFares(prev => [...prev, newFare]);
    } catch (err) {
      console.error("Error en createFare:", err);
      // Re-lanzamos el error para que el componente pueda manejarlo (e.g., mostrar un mensaje)
      throw err; 
    }
  }, []);

  const updateFare = useCallback(async (fareId: number, data: UpdateFareData) => {
    try {
      const updatedFare = await fareService.updateFare(fareId, data);
      setFares(prev => prev.map(f => (f.id === fareId ? updatedFare : f)));
    } catch (err) {
      console.error("Error en updateFare:", err);
      throw err;
    }
  }, []);

  // CAMBIO: Se reemplaza deleteFare por deactivateFare.
  const deactivateFare = useCallback(async (fareId: number) => {
    try {
      // Llamamos al nuevo método del servicio que usa PATCH
      const deactivatedFare = await fareService.deactivateFare(fareId);
      // Actualizamos el estado. Dependiendo de si quieres ocultar las inactivas,
      // puedes filtrar o actualizar el objeto. Actualizar es mejor para no perderlo de vista.
      setFares(prev => prev.map(f => (f.id === fareId ? deactivatedFare : f)));
    } catch (err) {
      console.error("Error en deactivateFare:", err);
      throw err;
    }
  }, []);

  // Puedes añadir aquí el resto de funciones de tu hook original (findFare, etc.)
  // si las necesitas, asegurándote que usen los métodos correctos del servicio.

  return {
    fares,
    loading,
    error,
    createFare,
    updateFare,
    deactivateFare, // CAMBIO: Exportamos la nueva función
    refreshFares: fetchFares
  };
};