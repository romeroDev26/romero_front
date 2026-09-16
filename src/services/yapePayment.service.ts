import api from '../config/api';

export type YapeCanal = 'YAPE' | 'PLIN' | 'TRANSFERENCIA';

export type YapeVerificacionEstado =
  | 'VERIFICADO_AUTO'
  | 'PENDIENTE_VERIFICAR'
  | 'REVISION_MANUAL';

export interface PagoYape {
  id: string;
  monto: number;
  nombre_emisor: string;
  codigo_operacion?: string | null;
  fecha_hora: string;
  canal: string;
  estado: string;
  texto_raw?: string | null;
  invoice_id?: number | null;
  created_at: string;
}

export interface ValidarYapeAsistidoResponse {
  match: boolean;
  pago_yape_id?: string | null;
  estado_sugerido: YapeVerificacionEstado;
  mensaje: string;
  pago?: PagoYape | null;
  sugeridos: PagoYape[];
  bloquear_venta: boolean;
}

export interface ValidarCodigoOperacionResponse {
  codigo_operacion: string;
  codigo_normalizado: string;
  usage_count: number;
  max_allowed: number;
  allowed: boolean;
  bloquear_venta: boolean;
  warning?: string | null;
  blocking_reason?: string | null;
  prior_uses: Array<{
    invoice_id: number;
    series: string;
    number: number;
    slot: string;
  }>;
  pago_yape_id?: string | null;
  pago_yape_encontrado: boolean;
  codigo_plausible: boolean;
}

class YapePaymentService {
  async validarAsistido(payload: {
    monto_yape: number;
    nombre_cliente: string;
    hora_venta?: string;
    canal?: YapeCanal;
    codigo_operacion?: string;
  }): Promise<ValidarYapeAsistidoResponse> {
    const { data } = await api.post<ValidarYapeAsistidoResponse>(
      '/ventas/validar-yape-asistido',
      payload,
      { timeout: 4000 }
    );
    return data;
  }

  async validarCodigo(payload: {
    codigo_operacion: string;
    monto_yape?: number;
  }): Promise<ValidarCodigoOperacionResponse> {
    const { data } = await api.post<ValidarCodigoOperacionResponse>(
      '/ventas/validar-codigo-operacion',
      payload,
      { timeout: 4000 }
    );
    return data;
  }
}

export const yapePaymentService = new YapePaymentService();
