// src/types/dashboard.ts
// Tipos para el dashboard principal optimizado
// El backend realiza TODOS los cálculos

export interface DashboardMetadata {
  generated_at: string;
  period: 'today' | 'week' | 'month' | 'year';
  company_id: number;
}

export interface MetricasGenerales {
  total_usuarios: number;
  ingresos_totales: number;
  ingresos_totales_formateado: string;
  comparacion_mes_anterior: {
    porcentaje: number;
    tendencia: 'up' | 'down' | 'neutral';
  };
}

export interface VentaMensual {
  mes: string;
  anio: number;
  mes_completo: string;
  total_ventas: number;
  cantidad_facturas: number;
}

export interface VentasMensuales {
  ultimos_6_meses: VentaMensual[];
}

export interface VentaPorSucursal {
  sucursal_id: number;
  sucursal_nombre: string;
  total_ventas: number;
  cantidad_facturas: number;
  porcentaje_total: number;
}

export interface VentasPorSucursal {
  resumen: VentaPorSucursal[];
}

export interface DatoEvolucionSucursal {
  fecha: string;
  fecha_formateada: string;
  sucursales: {
    [sucursalNombre: string]: number;
  };
}

export interface EvolucionVentasSucursales {
  periodo: 'daily' | 'weekly' | 'monthly' | 'yearly';
  datos: DatoEvolucionSucursal[];
  nota?: string;
}

export interface VendedorData {
  vendedor_id: string;
  vendedor_nombre: string;
  vendedor_email: string;
  total_facturas: number;
  total_ventas: number;
  total_descuentos: number;
  total_igv: number;
  ticket_promedio: number;
  total_pasajeros: number;
  posicion_ranking: number;
  porcentaje_ventas_sucursal: number;
}

export interface SucursalConVendedores {
  sucursal_id: number;
  sucursal_nombre: string;
  sucursal_direccion: string;
  sucursal_telefono: string;
  total_facturas: number;
  total_ventas: number;
  total_descuentos: number;
  total_igv: number;
  ticket_promedio: number;
  total_pasajeros: number;
  vendedores: VendedorData[];
  top_vendedor_nombre: string;
  top_vendedor_ventas: number;
}

export interface ResumenGeneralVendedores {
  total_sucursales: number;
  total_facturas: number;
  total_ventas: number;
  total_descuentos: number;
  total_igv: number;
  top_sucursal_nombre: string;
  top_sucursal_ventas: number;
}

export interface TopVendedoresPorSucursal {
  sucursales: SucursalConVendedores[];
  resumen_general: ResumenGeneralVendedores;
}

export interface DashboardMetricsResponse {
  meta: DashboardMetadata;
  metricas_generales: MetricasGenerales;
  ventas_mensuales: VentasMensuales;
  ventas_por_sucursal: VentasPorSucursal;
  evolucion_ventas_sucursales: EvolucionVentasSucursales;
  top_vendedores_por_sucursal: TopVendedoresPorSucursal;
}

export interface DashboardMetricsFilters {
  period?: 'today' | 'week' | 'month' | 'year';
}
