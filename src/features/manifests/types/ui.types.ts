import { Manifest } from './manifest.types';

export interface TripManifestGroup {
  id: number;
  departure_datetime?: string;
  trip_name?: string;                 // Nombre comercial de la ruta (ej: "NAUTA YURIMAGUAS CARGO")
  route_name?: string;                // Fallback / compatibilidad
  origin_port_name?: string;
  destination_port_name?: string;
  vessel_name?: string;
  status?: string;
  passengerManifest?: Manifest;
  cargoManifest?: Manifest;
}
