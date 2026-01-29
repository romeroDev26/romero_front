// src/types/index.ts
import { Column } from '../components/common/DataTable';

// ========================================
// TIPOS PARA COMPONENTES
// ========================================

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading: boolean;
  error: Error | null;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  keyExtractor: (item: T) => number | string;
  emptyMessage?: string;
  showActions?: boolean;
  customActions?: (item: T) => React.ReactNode;
}


// ========================================
// ENUMS Y TIPOS BASE
// ========================================

export type SunatDocumentStatus = 
  | 'PENDING' | 'GENERATED' | 'SIGNED' | 'SENT' 
  | 'ACCEPTED' | 'RECEIVED' | 'REJECTED' | 'OBSERVED' | 'VOIDED' | 'ERROR';

export type InventoryMovementType = 
  | 'PURCHASE_ENTRY' | 'SALE_EXIT' | 'INITIAL_STOCK' 
  | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT';

export type SummaryItemStatus = 
  | 'ADD' | 'MODIFY' | 'VOID';

export type ReservationStatus = 
  | 'RESERVED' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';

export type FareType = 
  | 'FULL_ROUTE' | 'PARTIAL_SEGMENT' | 'SPECIAL';

export type ServiceCategory = 
  | 'PASAJES' | 'ENCOMIENDA_PEQUENA' | 'ENCOMIENDA_MEDIANA' 
  | 'ENCOMIENDA_GRANDE' | 'CARGA_GENERAL_KGM' | 'CARGA_GENERAL_VOL' | 'OTROS';

export type TripStatus = 
  | 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED';

export type SeatAssignmentStatus = 
  | 'CONFIRMED' | 'BOARDED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

// Estados de cotización
export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';

export type ManifestItemType = 
  | 'PASSENGER' | 'CARGO' | 'PACKAGE';

// ========================================
// ENTIDADES BÁSICAS
// ========================================

export interface Currency {
  code: string;
  name: string;
  symbol?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface User {
  first_name: string;
  id: string;
  email: string;
  full_name: string;
  role_id: number;
  role?: Role;
  role_name?: string;
  default_branch_office_id?: number;
  current_city_id?: number;
  supervisor_id?: string;
  supervisor?: User;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  company_id: number;
}

export interface City {
  id: number;
  name: string;
  code?: string;
  ubigeo?: string;
  department?: string;
  province?: string;
  country_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// src/types/index.ts -> Reemplaza la sección de Company con esto

export interface Company {
  id: number;
  ruc: string;
  business_name: string;
  trade_name: string; // La API de GET lo devuelve como string, no opcional
  address: string;
  ubigeo: string;
  phone: string;
  email: string;
  logo_url: string;
  sunat_username: string;
  certificate_path: string;
  beta_mode: boolean;
  detraccion_account: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // OJO: Los campos hash no vienen en la respuesta de la API según la doc, 
  // así que es mejor no incluirlos para mantener el tipo alineado con lo que se recibe.
}

// NUEVO: Tipo para CREAR una compañía (POST)
// Basado en el "Request Body" de tu API.
export interface CompanyCreate {
  ruc: string;
  business_name: string;
  trade_name?: string;
  address: string;
  ubigeo: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  sunat_username: string;
  certificate_path?: string;
  beta_mode: boolean;
  detraccion_account?: string;
  is_active?: boolean;
  sunat_password_sol: string; // Es obligatoria al crear
  certificate_password?: string;
}

// TIPO AJUSTADO: Para ACTUALIZAR una compañía (PATCH)
// Partial<CompanyCreate> es perfecto para esto.
export type CompanyUpdate = Partial<CompanyCreate>;

export interface BranchOffice {
  id: number;
  company_id: number;
  company?: Company;
  name: string;
  code?: string;
  address_line?: string;
  ubigeo?: string;
  department?: string;
  province?: string;
  district?: string;
  country_code: string;
  phone?: string;
  email?: string;
  is_main_office: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  port_id: number;
  port_name?: string;
  port_address?: string;
  port?: Port;
  whatsapp_instance_name?: string | null; // Nombre de la instancia de WhatsApp
}


export interface Client {
  id: number;
  doc_type: string;
  doc_number: string;
  name: string;
  address_line?: string;
  ubigeo?: string;
  department?: string;
  province?: string;
  district?: string;
  country_code?: string;
  country_name?: string; // Nombre del país para mostrar
  email?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Para compatibilidad con código existente
  address?: string;
}

export interface Supplier {
  id: number;
  doc_type: string;
  doc_number: string;
  name: string;
  address?: string;
  ubigeo?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ========================================
// SISTEMA FLUVIAL - CONFIGURACIÓN
// ========================================

export interface Port {
  id: number;
  name: string;
  ubigeo: string;
  address?: string;
  city_id?: number;
  city?: City;
  port_type: PortType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PortType = 'PRIMARY_HUB' | 'SECONDARY_STOP';

export interface Vessel {
  id: number;
  registration_number: string;
  name: string;
  capacity_weight_kg?: number;
  capacity_packages?: number;
  capacity_passengers?: number; 
  company_id: number; 
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  seat_configurations_count?: number;
    // --- CAMPOS AÑADIDOS PARA EL MAPA DE ASIENTOS ---
  seat_configurations?: VesselSeatConfiguration[];
  total_columns?: number;
  total_rows?: number;
}

export interface UnifiedTripViewItem {
  trip_id: number;
  trip_name?: string | null;
  route_name?: string | null;
  origin_city?: string | null;
  destination_city?: string | null;
  vessel_name?: string | null;
  departure_datetime: string;
  estimated_arrival_datetime?: string | null;
  status?: string | null;
  sales_status?: string | null;
  total_available_seats?: number | null;
  total_capacity?: number | null; 
  original_data: any;
}

export interface SeatType {
  id: number;
  name: string;
  code: string;
  description?: string;
  price_multiplier: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface VesselSeatConfiguration {
  id: number;
  vessel_id: number;
  vessel?: Vessel;
  seat_type_id: number;
  seat_type?: SeatType;
  total_seats: number;
  deck_level: number;
  notes?: string;
  // --- NUEVOS CAMPOS AÑADIDOS ---
   
  total_rows?: number;
  total_columns?: number;
  // --- FIN DE NUEVOS CAMPOS ---
  created_at: string;
  updated_at: string;
}

export interface Route {
  id: number;
  name: string;
  origin_port_id: number;
  origin_port?: Port;
  destination_port_id: number;
  destination_port?: Port;
  estimated_duration?: string; // Formato ISO 8601 Duration (e.g., "P3D")
  estimated_duration_hours?: number;
  company_id: number;
  company?: Company;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stops: RouteStop[]; // La API devuelve las paradas aquí
}

export interface RouteStop {
  id: number;
  route_id: number;
  route?: Route;
  port_id: number;
  port?: Port;
  stop_order: number;
  estimated_duration_from_origin?: string; // Formato ISO 8601 Duration (e.g., "PT12H")
  is_boarding_allowed: boolean;
  is_disembarking_allowed: boolean;
  notes?: string;
  created_at: string; // El backend no siempre lo devuelve, pero lo dejamos por si acaso
}

export interface Fare {
  id: number;
  company_id: number;
  company?: Company;
  origin_port_id: number;
  origin_port?: Port;
  destination_port_id: number;
  destination_port?: Port;
  service_category: ServiceCategory;
  price: number;
  currency_code: string;
  currency?: Currency;
  tax_category_code: string;
  description?: string;
  fare_type: FareType;
  route_id?: number;
  route?: Route;
  is_active: boolean;
  effective_date: string;
  expiration_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduledRouteTemplate {
  id: number;
  company_id: number;
  company?: Company;
  route_id: number;
  route?: Route;
  template_name: string;
  day_of_week: number; // 1=Lunes, 7=Domingo
  departure_time: string; // Time como string
  vessel_id?: number;
  vessel?: Vessel;
  is_active: boolean;
  auto_generate_trips: boolean;
  generate_weeks_ahead: number;
  created_at: string;
  updated_at: string;
}

// ========================================
// VIAJES Y OPERACIONES
// ========================================

export interface Trip {
  id: number;
  company_id: number;
  company?: Company;
  route_id: number;
  route?: Route;
  vessel_id: number;
  vessel?: Vessel;
  template_id?: number;
  template?: ScheduledRouteTemplate;
  trip_name?: string;
  departure_datetime: string;
  estimated_arrival_datetime?: string;
  actual_departure_datetime?: string;
  actual_arrival_datetime?: string;
  status: TripStatus;
  captain_user_id?: string;
  captain?: User;
  max_passengers?: number;
  max_cargo_weight_kg?: number;
  can_sell_tickets: boolean;
  sales_closed_at?: string;
  auto_closed: boolean;
  manifest_generated: boolean;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TripStop {
  id: number;
  trip_id: number;
  trip?: Trip;
  port_id: number;
  port?: Port;
  stop_order: number;
  estimated_arrival_time?: string;
  estimated_departure_time?: string;
  actual_arrival_time?: string;
  actual_departure_time?: string;
  notes?: string;
}

export interface TripSeatAvailability {
  id: number;
  trip_id: number;
  trip?: Trip;
  seat_type_id: number;
  seat_type?: SeatType;
  total_seats: number;
  reserved_seats: number;
  confirmed_seats: number;
  blocked_seats: number;
  available_seats: number; // Calculado
  last_updated_at: string;
}

export interface SeatReservation {
  id: number;
  trip_id: number;
  trip?: Trip;
  trip_name?: string;
  trip_seat_id: number;
  seat_type_id: number;
  seat_type?: SeatType;
  boarding_stop_id: number;
  boarding_stop?: TripStop;
  disembarking_stop_id: number;
  disembarking_stop?: TripStop;
  customer_name: string;
  customer_doc_type: string;
  customer_doc_number: string;
  customer_phone?: string;
  customer_email?: string;
  total_price: number;
  advance_amount: number;
  remaining_amount: number; // Calculado
  currency_code: string;
  currency?: Currency;
  status: ReservationStatus;
  reserved_at: string;
  expires_at?: string;
  reserved_by: string;
  reserved_by_user?: User;
  seat_number?: string;
  special_notes?: string;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface SeatAssignment {
  id: number;
  trip_id: number;
  trip?: Trip;
  invoice_item_id?: number;
  invoice_item?: InvoiceItem;
  seat_reservation_id?: number;
  seat_reservation?: SeatReservation;
  client_id: number;
  client?: Client;
  seat_type_id: number;
  seat_type?: SeatType;
  boarding_stop_id: number;
  boarding_stop?: TripStop;
  disembarking_stop_id: number;
  disembarking_stop?: TripStop;
  passenger_name: string;
  passenger_doc_type: string;
  passenger_doc_number: string;
  seat_number?: string;
  status: SeatAssignmentStatus;
  special_notes?: string;
  created_at: string;
  updated_at: string;
}

// ========================================
// MANIFIESTOS
// ========================================

export interface TripManifest {
  id: number;
  trip_id: number;
  trip?: Trip;
  manifest_number: string;
  generation_date: string;
  generated_by: string;
  generated_by_user?: User;
  printed_at?: string;
  printed_by?: string;
  printed_by_user?: User;
  status: string;
  total_passengers: number;
  total_cargo_weight_kg: number;
  observations?: string;
  pdf_file_path?: string;
  created_at: string;
  updated_at: string;
}

export interface ManifestItem {
  id: number;
  manifest_id: number;
  manifest?: TripManifest;
  item_type: ManifestItemType;
  seat_assignment_id?: number;
  seat_assignment?: SeatAssignment;
  invoice_item_id?: number;
  invoice_item?: InvoiceItem;
  item_order: number;
  passenger_name?: string;
  passenger_doc_type?: string;
  passenger_doc_number?: string;
  boarding_port_name?: string;
  disembarking_port_name?: string;
  seat_type_name?: string;
  seat_number?: string;
  cargo_description?: string;
  cargo_weight_kg?: number;
  special_notes?: string;
  created_at: string;
}

// ========================================
// PRODUCTOS Y SERVICIOS
// ========================================

export interface ProductService {
  id: number;
  internal_code?: string;
  name: string;
  description?: string;
  item_type: 'PRODUCT' | 'SERVICE';
  service_category?: ServiceCategory;
  unit_code: string;
  purchase_price?: number;
  sale_price: number;
  currency_code: string;
  tax_category_code: string;
  unspcs_code?: string;
  specific_route_id?: number;
  specific_route?: Route;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ========================================
// FACTURACIÓN
// ========================================

export interface Invoice {
  id: number;
  company_id: number;
  client_id: number;
  client?: Client;
  sales_order_id?: number;
  document_type_code: string;
  series: string;
  number: number;
  ubl_version?: string;
  issue_date: string;
  issue_time?: string;
  due_date?: string;
  operation_type_code?: string;
  currency_code: string;
  exchange_rate?: number;
  total_taxable: number;
  total_exonerated: number;
  total_unaffected: number;
  total_free: number;
  total_discount: number;
  total_igv: number;
  total_isc: number;
  total_other_taxes: number;
  total_payable: number;
  total_in_words?: string;
  sunat_status: SunatDocumentStatus;
  business_status?: 'ACTIVE' | 'CANCELLED' | 'INCREASED';
  sunat_ticket?: string;
  sunat_response_code?: string;
  sunat_response_description?: string;
  sunat_observations?: string;
  xml_file_path?: string;
  signed_xml_file_path?: string;
  zip_file_path?: string;
  cdr_file_path?: string;
  pdf_file_path?: string;
  pdf_a4_file_path?: string;
  pdf_ticket_file_path?: string;
  related_gre_series_number?: string;
  payment_terms?: string;
  payment_method_code?: string;
  detraccion_code?: string;
  detraccion_percentage?: number;
  detraccion_amount?: number;
  detraccion_account?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
  // Campos de sucursal (devueltos por el backend)
  branch_office_name?: string | null;
  branch_office_address?: string | null;
  branch_office_phone?: string | null;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  item_order: number;
  product_id?: number;
  product?: ProductService;
  quantity: number;
  unit_code: string;
  unit_price: number;
  item_description?: string;
  price_with_tax?: number;
  price_type_code?: string;
  discount: number;
  tax_category_code: string;
  igv_percentage: number;
  igv_amount: number;
  isc_type_code?: string;
  isc_percentage?: number;
  isc_amount?: number;
  other_tax_percentage?: number;
  other_tax_amount?: number;
  subtotal: number;
  total_line: number;
  // Campos específicos para pasajes
  trip_id?: number;
  trip?: Trip;
  fare_id?: number;
  fare?: Fare;
  seat_type_id?: number;
  seat_type?: SeatType;
  boarding_trip_stop_id?: number;
  boarding_trip_stop?: TripStop;
  disembarking_trip_stop_id?: number;
  disembarking_trip_stop?: TripStop;
  recipient_name?: string;
  recipient_doc_type?: string;
  recipient_doc_number?: string;
  recipient_phone?: string;
}

// ========================================
// NOTAS DE CRÉDITO
// ========================================

export interface CreditNote {
  id: number;
  company_id: number;
  company?: Company;
  client_id: number;
  client?: Client;
  seller?: any; // Información del vendedor
  branch_office?: any; // Información de la sucursal
  trip?: any; // Información del viaje
  ubl_version?: string;
  document_type_code: string;
  series: string;
  number: number;
  issue_date: string;
  issue_time?: string;
  currency_code: string;
  affected_document_type_code: string;
  affected_document_series_number: string;
  affected_invoice?: any; // Información completa de la factura afectada
  credit_note_type_code: string;
  reason: string;
  total_taxable: number;
  total_exonerated: number;
  total_unaffected: number;
  total_free: number;
  total_discount: number;
  total_igv: number;
  total_isc: number;
  total_other_taxes: number;
  total_payable: number;
  total_in_words?: string;
  qr_code_data?: string; // Código QR en base64
  sunat_status: SunatDocumentStatus;
  sunat_ticket?: string;
  sunat_response_code?: string;
  sunat_response_description?: string;
  sunat_observations?: string;
  xml_file_path?: string;
  signed_xml_file_path?: string;
  zip_file_path?: string;
  cdr_file_path?: string;
  pdf_file_path?: string;
  pdf_a4_file_path?: string;
  pdf_ticket_file_path?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  items?: CreditNoteItem[];
}

export interface CreditNoteItem {
  id: number;
  credit_note_id: number;
  item_order: number;
  product_id: number;
  product?: ProductService;
  quantity: number;
  unit_code: string;
  unit_price: number;
  price_with_tax?: number;
  price_type_code?: string;
  discount: number;
  tax_category_code: string;
  igv_percentage: number;
  igv_amount: number;
  isc_type_code?: string;
  isc_percentage?: number;
  isc_amount?: number;
  other_tax_percentage?: number;
  other_tax_amount?: number;
  subtotal: number;
  total_line: number;
}

// ========================================
// NOTAS DE DÉBITO
// ========================================

export interface DebitNote {
  id: number;
  company_id: number;
  company?: Company;
  client_id: number;
  client?: Client;
  ubl_version?: string;
  document_type_code: string;
  series: string;
  number: number;
  issue_date: string;
  currency_code: string;
  affected_document_type_code: string;
  affected_document_series_number: string;
  debit_note_type_code: string;
  reason: string;
  total_taxable: number;
  total_exonerated: number;
  total_unaffected: number;
  total_igv: number;
  total_isc: number;
  total_other_taxes: number;
  total_payable: number;
  total_in_words?: string;
  sunat_status: SunatDocumentStatus;
  sunat_ticket?: string;
  sunat_response_code?: string;
  sunat_response_description?: string;
  sunat_observations?: string;
  xml_file_path?: string;
  signed_xml_file_path?: string;
  zip_file_path?: string;
  cdr_file_path?: string;
  pdf_file_path?: string;
  pdf_a4_file_path?: string;
  pdf_ticket_file_path?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  items?: DebitNoteItem[];
}

export interface DebitNoteItem {
  id: number;
  debit_note_id: number;
  item_order: number;
  product_id: number;
  product?: ProductService;
  quantity: number;
  unit_code: string;
  unit_price: number;
  price_with_tax?: number;
  price_type_code?: string;
  tax_category_code: string;
  igv_percentage: number;
  igv_amount: number;
  isc_type_code?: string;
  isc_percentage?: number;
  isc_amount?: number;
  other_tax_percentage?: number;
  other_tax_amount?: number;
  subtotal: number;
  total_line: number;
}

// ========================================
// GUÍAS DE REMISIÓN
// ========================================

// Tipos comunes para ambas guías
export interface RemissionGuideAddress {
  ubigeo_code: string;
  address: string;
}

export interface RemissionGuideParty {
  document_type_code: string;
  document_number: string;
  business_name: string;
}

export interface RemissionGuideItem {
  id?: number;
  remission_guide_id?: number;
  item_order?: number;
  product_code?: string;
  description: string;
  quantity: number;
  unit_measure: string;
  unit_code: string;
  weight: number;
  unit_weight?: number;
  internal_code?: string;
  invoice_item_id?: number;
  invoice_item?: InvoiceItem;
}

// Guía del Transportista (Tipo 31)
export interface RemissionGuideTransportista {
  id: number;
  company_id: number;
  company?: Company;
  ubl_version?: string;
  document_type_code: string;
  series: string;
  number: number;
  issue_date: string;
  trip_id?: number;
  trip?: Trip;
  transfer_reason_code: string;
  transfer_reason_description: string;
  transfer_start_date: string;
  gross_total_weight: number;
  number_of_packages: number;
  transport_mode_code: string;
  sender: RemissionGuideParty;
  receiver: RemissionGuideParty;
  origin_address: RemissionGuideAddress;
  destination_address: RemissionGuideAddress;
  boarding_trip_stop_id?: number;
  boarding_trip_stop?: TripStop;
  disembarking_trip_stop_id?: number;
  disembarking_trip_stop?: TripStop;
  vessel_id?: number;
  vessel?: Vessel;
  driver_doc_type: string;
  driver_doc_number: string;
  driver_name?: string;
  driver_license?: string;
  related_doc_type?: string;
  related_doc_number?: string;
  sunat_status: SunatDocumentStatus;
  sunat_ticket?: string;
  sunat_response_code?: string;
  sunat_response_description?: string;
  sunat_observations?: string;
  xml_file_path?: string;
  signed_xml_file_path?: string;
  zip_file_path?: string;
  cdr_file_path?: string;
  pdf_file_path?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  items?: RemissionGuideItem[];
  observation?: string;
}

// Guía del Remitente (Tipo 09)
export interface RemissionGuideRemitente {
  id: number;
  company_id: number;
  company?: Company;
  ubl_version?: string;
  document_type_code: string;
  series: string;
  number: number;
  issue_date: string;
  transfer_reason_code: string;
  transfer_reason_description: string;
  transfer_start_date: string;
  gross_total_weight: number;
  number_of_packages: number;
  transport_mode_code: string;
  sender: RemissionGuideParty;
  receiver: RemissionGuideParty;
  origin_address: RemissionGuideAddress;
  destination_address: RemissionGuideAddress;
  vessel_id?: number;
  vessel?: Vessel;
  driver_doc_type: string;
  driver_doc_number: string;
  driver_name?: string;
  driver_license?: string;
  sunat_status: SunatDocumentStatus;
  sunat_ticket?: string;
  sunat_response_code?: string;
  sunat_response_description?: string;
  sunat_observations?: string;
  xml_file_path?: string;
  signed_xml_file_path?: string;
  zip_file_path?: string;
  cdr_file_path?: string;
  pdf_file_path?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  items?: RemissionGuideItem[];
  observation?: string;
}

// Tipo union para ambas guías
export type RemissionGuide = RemissionGuideTransportista | RemissionGuideRemitente;

// Respuesta combinada para endpoint by-branch-office (array único con guide_type)
export type RemissionGuidesByBranchOfficeResponse = RemissionGuide[];

// ========================================
// AUTO-GENERATE REMISSION GUIDES
// ========================================

export interface AutoGenerateRemissionGuidesRequest {
  trip_id: number;
  document_series_id: number;
  transport_mode_code: string;
  captain_name: string;
  captain_doc_type: string;
  captain_doc_number: string;
  captain_license: string;
}

export interface AutoGenerateRemissionGuideItem {
  id: number;
  item_order: number;
  quantity: number;
  unit_code: string;
  description: string;
  internal_code: string;
}

export interface AutoGenerateRemissionGuide {
  guide_id: number;
  ubl_version: string;
  document_type_code: string;
  series: string;
  number: number;
  company_logo_url?: string;
  document_number: string;
  issue_date: string;
  issue_time: string;
  sender_doc_type: string;
  sender_doc_number: string;
  sender_name: string;
  recipient_doc_type: string;
  recipient_doc_number: string;
  recipient_name: string;
  origin_ubigeo: string;
  origin_address: string;
  destination_ubigeo: string;
  destination_address: string;
  destination_port_name: string;
  transport_mode_code: string;
  total_gross_weight: number;
  weight_unit_code: string;
  number_of_packages: number;
  total_packages: number;
  total_weight: number;
  shipment_start_date: string;
  driver_doc_type: string;
  driver_doc_number: string;
  driver_name: string;
  driver_license: string;
  captain_name: string;
  captain_doc_type: string;
  captain_doc_number: string;
  captain_license: string;
  vessel_name: string;
  vessel_plate: string;
  related_doc_type: string | null;
  related_doc_number: string | null;
  sunat_status: string;
  sunat_ticket: string | null;
  sunat_response_code: string | null;
  sunat_response_description: string | null;
  sunat_observations: string | null;
  sunat_reception_date: string | null;
  xml_file_path: string | null;
  signed_xml_file_path: string | null;
  zip_file_path: string | null;
  zip_hash: string | null;
  cdr_file_path: string | null;
  pdf_file_path: string | null;
  pdf_a4_file_path: string | null;
  pdf_ticket_file_path: string | null;
  qr_code_data: string;
  company_ruc: string;
  company_business_name: string;
  company_trade_name: string | null;
  company_address: string;
  company_phone: string | null;
  company_email: string | null;
  package_items: AutoGenerateRemissionGuideItem[];
  observation: string | null;
  trip_name: string;
  departure_date: string;
  created_by_name: string;
  created_by_email: string;
  created_at: string;
  updated_at: string;
}

export interface AutoGenerateRemissionGuidesResponse {
  trip_id: number;
  trip_name: string;
  captain_updated: boolean;
  destinations_processed: number;
  guides_generated: AutoGenerateRemissionGuide[];
  total_packages: number;
  total_weight: number;
  generated_at: string;
  generated_by: string;
}

// ========================================
// DOCUMENTOS SUNAT RESÚMENES Y BAJAS
// ========================================

export interface SunatDailySummary {
  id: number;
  company_id: number;
  company?: Company;
  issue_date: string;
  generation_date: string;
  identifier: string;
  sunat_status: SunatDocumentStatus;
  sunat_ticket?: string;
  sunat_response_code?: string;
  sunat_response_description?: string;
  sunat_observations?: string;
  xml_file_path?: string;
  signed_xml_file_path?: string;
  zip_file_path?: string;
  cdr_file_path?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  items?: SunatSummaryItem[];
}

export interface SunatSummaryItem {
  id: number;
  summary_id: number;
  item_line: number;
  document_type_code: string;
  series_number: string;
  invoice_id?: number;
  invoice?: Invoice;
  credit_note_id?: number;
  credit_note?: CreditNote;
  debit_note_id?: number;
  debit_note?: DebitNote;
  client_doc_type?: string;
  client_doc_number?: string;
  affected_document_type_code?: string;
  affected_document_series_number?: string;
  currency_code: string;
  total_taxable?: number;
  total_exonerated?: number;
  total_unaffected?: number;
  total_isc?: number;
  total_igv?: number;
  total_other_taxes?: number;
  total_payable?: number;
  status: SummaryItemStatus;
}

export interface SunatVoidedDocument {
  id: number;
  company_id: number;
  company?: Company;
  generation_date: string;
  identifier: string;
  sunat_status: SunatDocumentStatus;
  sunat_ticket?: string;
  sunat_response_code?: string;
  sunat_response_description?: string;
  sunat_observations?: string;
  xml_file_path?: string;
  signed_xml_file_path?: string;
  zip_file_path?: string;
  cdr_file_path?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  items?: SunatVoidedItem[];
}

export interface SunatVoidedItem {
  id: number;
  voided_document_id: number;
  item_line: number;
  document_type_code: string;
  series: string;
  number: number;
  reason: string;
  invoice_id?: number;
  invoice?: Invoice;
  credit_note_id?: number;
  credit_note?: CreditNote;
  debit_note_id?: number;
  debit_note?: DebitNote;
}

// ========================================
// INVENTARIO (SIMPLIFICADO PARA CASOS ESPECIALES)
// ========================================

export interface Warehouse {
  id: number;
  name: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryStock {
  id: number;
  product_id: number;
  product?: ProductService;
  warehouse_id: number;
  warehouse?: Warehouse;
  quantity: number;
  last_updated_at: string;
}

export interface InventoryMovement {
  id: number;
  product_id: number;
  product?: ProductService;
  warehouse_id: number;
  warehouse?: Warehouse;
  movement_date: string;
  movement_type: InventoryMovementType;
  quantity: number;
  unit_cost?: number;
  balance_quantity?: number;
  balance_cost?: number;
  reference_doc_type?: string;
  reference_doc_id?: number;
  notes?: string;
  created_at: string;
}

export interface InventoryAdjustment {
  product_id: number;
  warehouse_id: number;
  quantity: number;
  reason: string;
  notes?: string;
}

// ========================================
// VISTAS Y DTOs PARA LA INTERFAZ
// ========================================

export interface AvailableTrip {
  id: number;
  trip_id: number;
  trip_name?: string;
  route_name: string;
  origin_city?: string;
  destination_city?: string;
  vessel_name: string;
  departure_datetime: string;
  estimated_arrival_datetime?: string;
  status: TripStatus;
  can_sell_tickets: boolean;
  auto_closed: boolean;
  total_available_seats: number;
  total_reserved_seats: number;
  total_confirmed_seats: number;
  total_capacity: number;
  sales_status: 'DISPONIBLE' | 'URGENTE' | 'AGOTADO' | 'CERRADO';
}

export interface FareMatrix {
  route_id?: number;
  route_name?: string;
  origin_port_name: string;
  origin_city_name?: string;
  destination_port_name: string;
  destination_city_name?: string;
  service_category: ServiceCategory;
  base_fare_price: number;
  currency_code: string;
  tax_category_code: string;
  seat_type_name: string;
  seat_type_code: string;
  price_multiplier: number;
  final_seat_price_no_tax: number;
}

// ========================================
// TIPOS PARA FORMULARIOS Y APIS
// ========================================

export interface CreateClientData {
  doc_type: string;
  doc_number: string;
  name: string;
  address_line?: string;
  department?: string;
  province?: string;
  district?: string;
  country_code?: string;
  country_name?: string; // Nombre del país para mostrar
  ubigeo?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
}

export interface UpdateClientData extends Partial<CreateClientData> {
  // El backend espera "address" para actualizaciones, no "address_line"
  address?: string;
}

export interface SalesPointFormData {
  trip_id: number;
  client_id: number;
  boarding_stop_id: number;
  disembarking_stop_id: number;
  seat_type_id: number;
  passenger_name: string;
  passenger_doc_type: string;
  passenger_doc_number: string;
  special_notes?: string;
}

export interface ReservationFormData extends SalesPointFormData {
  advance_amount: number;
  customer_phone?: string;
  customer_email?: string;
  expires_at?: string;
}

// Tipo para documento de identidad
export type DocType = '1' | '4' | '6' | '7' | '0';


export interface DocumentSeries {
  id: number;
  company_id: number;
  branch_office_id: number;
  document_type_code: string; // e.g., "01", "03"
  series_code: string; // e.g., "F001", "B001"
  current_number: number;
  is_electronic: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Opcionales para mostrar info enriquecida en la UI
  branch_office?: { id: number, name: string }; // Asumiendo una estructura para sucursal
}

export interface BranchOffice {
  id: number;
  company_id: number;
  name: string;
  code?: string;
  port_id: number;
  address_line?: string;
  phone?: string;
  email?: string;
  is_main_office: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  port?: Port;
}

// ========================================
// TIPOS PARA MAPA DE ASIENTOS 
// ========================================
export type SeatStatus = "AVAILABLE" | "RESERVED" | "CONFIRMED" | "CANCELLED" | "EXPIRED" | "BLOCKED";

export interface SeatMapItem {
    id: number;
    trip_id: number;
    vessel_seat_config_id: number;
    seat_number: string;
    status: SeatStatus;
    notes: string;
    seat_type: {
        id: number;
        name: string;
        code: string;
        price_multiplier: number;
    };
}
