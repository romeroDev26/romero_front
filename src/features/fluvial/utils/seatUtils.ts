// src/features/fluvial/utils/seatUtils.ts

import { SeatMapItem, VesselSeatConfiguration } from '../../../types';

/**
 * Obtiene un nombre descriptivo del tipo de asiento basado en el nombre del tipo
 * @param seatTypeName - Nombre del tipo de asiento desde la base de datos
 * @returns Nombre descriptivo para mostrar al usuario
 */
export const getSeatTypeName = (seatTypeName?: string | null): string => {
  if (!seatTypeName) return 'Zona de Asientos';
  
  const name = seatTypeName.toLowerCase();
  
  // Patrones específicos para diferentes tipos de asientos
  if (name.includes('reclinable')) return 'Zona Reclinable';
  if (name.includes('estático')) return 'Zona Estática';
  if (name.includes('premium')) return 'Zona Premium';
  if (name.includes('vip')) return 'Zona VIP';
  if (name.includes('económico') || name.includes('economico')) return 'Zona Económica';
  if (name.includes('ejecutivo')) return 'Zona Ejecutiva';
  if (name.includes('turista')) return 'Zona Turista';
  
  // Si tiene un nombre pero no coincide con los patrones conocidos, usar el nombre original con formato de título
  return seatTypeName.charAt(0).toUpperCase() + seatTypeName.slice(1).toLowerCase();
};

/**
 * Obtiene el nombre de la zona del asiento basado en su configuración dinámica
 * Esta función busca la configuración del asiento en las configuraciones de la embarcación
 * @param seat - Asiento seleccionado
 * @param vesselConfigurations - Configuraciones de asientos de la embarcación
 * @returns Nombre de la zona donde está ubicado el asiento
 */
export const getSeatZoneName = (
  seat: SeatMapItem | null,
  vesselConfigurations?: VesselSeatConfiguration[]
): string => {
  if (!seat || !vesselConfigurations) {
    return 'Zona de Asientos';
  }

  // Buscar la configuración del asiento usando vessel_seat_config_id
  const seatConfig = vesselConfigurations.find(
    config => config.id === seat.vessel_seat_config_id
  );

  if (!seatConfig || !seatConfig.seat_type) {
    // Fallback al seat_type del asiento mismo
    return getSeatTypeName(seat.seat_type?.name);
  }

  // Usar el seat_type de la configuración (más confiable)
  return getSeatTypeName(seatConfig.seat_type.name);
};

/**
 * Obtiene el color de la zona basado en el tipo de asiento
 * @param seatTypeName - Nombre del tipo de asiento
 * @returns Clases CSS para el color de fondo y borde
 */
export const getZoneColor = (seatTypeName?: string | null): string => {
  if (!seatTypeName) return 'bg-gray-100/80 border border-gray-200';
  
  const name = seatTypeName.toLowerCase();
  if (name.includes('reclinable')) return 'bg-green-100/80 border border-green-200';
  if (name.includes('estático')) return 'bg-yellow-100/80 border border-yellow-200';
  if (name.includes('premium')) return 'bg-purple-100/80 border border-purple-200';
  if (name.includes('vip')) return 'bg-indigo-100/80 border border-indigo-200';
  if (name.includes('económico') || name.includes('economico')) return 'bg-blue-100/80 border border-blue-200';
  
  return 'bg-gray-100/80 border border-gray-200';
};

/**
 * Obtiene el título de la zona para mostrar en el mapa de asientos
 * @param seatTypeName - Nombre del tipo de asiento
 * @returns Título de la zona en mayúsculas
 */
export const getZoneTitle = (seatTypeName?: string | null): string => {
  return getSeatTypeName(seatTypeName).toUpperCase();
};
