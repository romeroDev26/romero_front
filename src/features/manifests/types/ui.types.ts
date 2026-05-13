import { Manifest } from './manifest.types';

export interface TripManifestGroup {
  id: number;
  departure_datetime?: string;
  route_name?: string;
  vessel_name?: string;
  status?: string;
  passengerManifest?: Manifest;
  cargoManifest?: Manifest;
}
