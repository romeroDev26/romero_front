// src/types/params.ts

export interface VesselListParams {
  is_active?: boolean;
}

export interface RouteListParams {
  is_active?: boolean;
  origin_port_id?: number;
  destination_port_id?: number;
}

export interface SeatTypeListParams {
  is_active?: boolean;
}
