// src/utils/parsePassenger.ts

/**
 * Extrae el nombre del pasajero desde la descripción de un item de venta.
 *
 * Formato esperado (backend, ventas de pasajes):
 *   "Servicio de Transporte Fluvial de Pasajeros - PASAJERO: roberto bolaños villacorta, CE:785245879, Asiento:5"
 *
 * Devuelve el texto entre "PASAJERO:" y la primera coma, o null si no hay match.
 */
export const parsePassengerFromDescription = (
  description?: string | null
): string | null => {
  if (!description) return null;

  const match = description.match(/PASAJERO:\s*([^,]+)/i);
  const name = match?.[1]?.trim();

  return name ? name : null;
};
