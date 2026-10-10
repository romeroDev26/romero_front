// Types for Manifests
import { User } from '../../../types';
export interface Company {
  id: number;
  name: string;
  ruc: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string;
}

export interface ManifestItem {
  item_order: number;
  item_type: 'PASSENGER' | 'CARGO';
  
  // Campos para PASSENGER
  seat_assignment_id?: number;
  passenger_name?: string;
  passenger_doc_type?: string;
  passenger_doc_number?: string;
  passenger_phone?: string;
  passenger_country_code?: string;
  passenger_country_name?: string | null;
  boarding_port_name?: string;
  disembarking_port_name?: string;
  seat_type_name?: string;
  seat_number?: string | null;
  special_notes?: string | null;
  // Vendedor asociado a la venta del pasajero (opcional)
  seller_name?: string;
  seller_id?: string | number;
  
  // Campos para CARGO
  cargo_description?: string;
  cargo_weight_kg?: string;
  unit_code?: string;
  remitente_nombre?: string;
  remitente_doc?: string;
  remitente_phone?: string;
  destinatario_nombre?: string;
  destinatario_doc?: string;
  destinatario_phone?: string;
  source_document?: string;
  amount?: number;
  payment_status?: string;
  parcel_number?: number;

  // ── Nombres heredados ────────────────────────────────────────────────────
  // El endpoint que devuelve los items en `data` (en vez de en `items`) usa
  // estos nombres para los mismos datos. El generador de PDF lee ambos con
  // fallback, asi que se declaran como opcionales en lugar de recurrir a any.
  /** Alias heredado de passenger_name. */
  full_name?: string;
  /** Alias heredado de passenger_doc_number. */
  document_number?: string;
  /** Alias heredado de passenger_doc_type. */
  document_type?: string;
  /** Alias heredado de passenger_phone. */
  phone?: string;
  /** Alias heredado de boarding_port_name. */
  boarding_port?: string;
  /** Alias heredado de disembarking_port_name. */
  destination_port?: string;
  /** Vendedor como objeto anidado, en vez de seller_name plano. */
  seller?: { name?: string };
}

export interface TripInfo {
  id: number;
  departure_datetime: string;
  arrival_datetime: string;
  status: string;
  origin_port_name: string;
  destination_port_name: string;
  vehicle_license_plate: string;
  vehicle_model: string;
  vehicle_capacity: number;
  branch_office_name: string;
}

/**
 * Grupo de encomiendas por tramo. El backend agrupa asi los manifiestos de
 * CARGO para que el PDF pueda imprimir un subtotal y un titulo por tramo.
 */
export interface CargoStopGroup {
  origin_port_name?: string;
  destination_port_name?: string;
  /** Orden del punto de desembarque; se usa para ordenar los grupos. */
  disembarking_stop_order?: number;
  items?: ManifestItem[];
}

export interface CargoGroupedByStops {
  groups?: CargoStopGroup[];
}

export interface Manifest {
  content_revision?: string;
  pdf_status?: 'CURRENT' | 'MISSING' | 'INVALIDATED' | 'OUTDATED' | 'UNVERIFIED';
  pdf_needs_refresh?: boolean;
  pdf_generated_at?: string;
  id: number;
  trip_id: number;
  manifest_number: string;
  generation_date: string;
  generated_by: string;
  printed_at?: string | null;
  printed_by?: string | null;
  status: 'DRAFT' | 'GENERATED' | 'PRINTED' | 'CANCELLED';
  total_passengers: number;
  total_cargo_weight_kg: number;
  observations?: string | null;
  pdf_file_path?: string | null;
  created_at: string;
  updated_at: string;
  manifest_type: 'PASSENGER' | 'CARGO';
  departure_datetime?: string;
  trip_status?: string;
  route_name?: string;
  vessel_name?: string;
  vessel_registration_number?: string;
  origin_port_name?: string;
  destination_port_name?: string;
  generated_by_name?: string;
  generated_by_user?: User;
  company?: Company;
  items: ManifestItem[];
  trip_info?: TripInfo; // Información detallada del viaje
  /**
   * Algunos endpoints devuelven los items del manifiesto en `data` en lugar de
   * en `items`; el generador de PDF acepta ambas formas.
   */
  data?: ManifestItem[];
  /** Presente solo en manifiestos de CARGO agrupados por tramo. */
  cargo_grouped_by_stops?: CargoGroupedByStops;
}

export interface ManifestPassenger {
  id: number;
  ticket_id: number;
  passenger_name: string;
  document_type: string;
  document_number: string;
  seat_number?: string;
  fare_amount: number;
  boarding_port: string;
  destination_port: string;
}

export interface ManifestCargoItem {
  id: number;
  cargo_sale_id: number;
  item_description: string;
  quantity: number;
  weight_kg: number;
  volume_m3?: number;
  declared_value: number;
  sender_name: string;
  receiver_name: string;
  origin_port: string;
  destination_port: string;
}

export interface ManifestFormData {
  trip_id: number;
  manifest_type: 'PASSENGER' | 'CARGO';
  observations?: string;
}

export interface Trip {
  id: number;
  departure_date: string;
  departure_time: string;
  arrival_date?: string;
  arrival_time?: string;
  status: string;
  vessel: {
    id: number;
    name: string;
    capacity: number;
  };
  route: {
    id: number;
    name: string;
    origin_port: {
      id: number;
      name: string;
      city_name: string;
    };
    destination_port: {
      id: number;
      name: string;
      city_name: string;
    };
  };
}

export interface ManifestCreateRequest {
  trip_id: number;
  observations?: string;
  manifest_type: 'PASSENGER' | 'CARGO';
}

export interface ManifestResponse {
  success: boolean;
  data: Manifest;
  message?: string;
  isRegeneration?: boolean; // Indica si fue una regeneración en lugar de una creación nueva
}

// ------------------------------------------------------------------
// Vista diaria / semanal de manifiestos (endpoint unificado)
// ------------------------------------------------------------------

export interface DailyManifestSummary {
  id: number;
  manifest_number: string;
  status: 'DRAFT' | 'GENERATED' | 'PRINTED' | 'CANCELLED';
  total_passengers: number;
  total_cargo_weight_kg: number;
  pdf_file_path: string | null;
  generated_by_name: string | null;
  generation_date: string | null;
}

export interface DailyTripManifestItem {
  id: number;
  trip_name: string;
  departure_datetime: string;
  status: string;
  origin_port_name: string;
  destination_port_name: string;
  vessel_id: number;
  vessel_name: string;
  passenger_manifest: DailyManifestSummary | null;
  cargo_manifest: DailyManifestSummary | null;
}

export interface DailyManifestViewResponse {
  trips: DailyTripManifestItem[];
}


