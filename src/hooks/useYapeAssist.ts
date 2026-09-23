import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PagoYape,
  ValidarCodigoOperacionResponse,
  ValidarYapeAsistidoResponse,
  yapePaymentService,
} from '../services/yapePayment.service';
import { buildHoraVentaISO } from '../utils/yapeSearchTime';

/** Espera inicial: el aviso del celular suele tardar ~3 s. Luego el WebSocket actualiza en vivo. */
const DIGITAL_WAIT_MS = 3200;

/** Solo Yape: el celular de la empresa captura avisos de la app Yape. */
export function isYapeAssistMethod(method: string): boolean {
  return method === 'YAP';
}

/** @deprecated Usar isYapeAssistMethod */
export function isDigitalPaymentMethod(method: string): boolean {
  return isYapeAssistMethod(method);
}

export function digitalAmountFromPayments(params: {
  isSplitPayment: boolean;
  paymentMethod1: string;
  paymentMethod2: string;
  amount1: number;
  amount2: number;
  totalAmount: number;
}): number {
  const { isSplitPayment, paymentMethod1, paymentMethod2, amount1, amount2, totalAmount } = params;
  if (!isSplitPayment) {
    return isYapeAssistMethod(paymentMethod1) ? totalAmount : 0;
  }
  let digital = 0;
  if (isYapeAssistMethod(paymentMethod1)) digital += amount1;
  if (isYapeAssistMethod(paymentMethod2)) digital += amount2;
  return Math.round(digital * 100) / 100;
}

export function useYapeAssist(params: {
  enabled: boolean;
  customerName: string;
  isSplitPayment: boolean;
  paymentMethod1: string;
  paymentMethod2: string;
  amount1: number;
  amount2: number;
  totalAmount: number;
  operationCode1: string;
  operationCode2: string;
  paymentReferenceDate?: string;
  paymentReferenceTime?: string;
}) {
  const {
    enabled,
    customerName,
    isSplitPayment,
    paymentMethod1,
    paymentMethod2,
    amount1,
    amount2,
    totalAmount,
    operationCode1,
    operationCode2,
    paymentReferenceDate = '',
    paymentReferenceTime = '',
  } = params;

  const [assist, setAssist] = useState<ValidarYapeAsistidoResponse | null>(null);
  const [codigoInfo, setCodigoInfo] = useState<ValidarCodigoOperacionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPagoId, setSelectedPagoId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const codeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const montoDigital = digitalAmountFromPayments({
    isSplitPayment,
    paymentMethod1,
    paymentMethod2,
    amount1,
    amount2,
    totalAmount,
  });

  const hasDigital = enabled && montoDigital > 0;
  const horaVenta = buildHoraVentaISO(paymentReferenceDate, paymentReferenceTime);
  const usesReferenceTime = Boolean(horaVenta);

  const consultar = useCallback(async () => {
    if (!hasDigital) {
      setAssist(null);
      return;
    }
    setLoading(true);
    try {
      const codigo = (operationCode1 || operationCode2 || '').trim();
      const data = await yapePaymentService.validarAsistido({
        monto_yape: montoDigital,
        nombre_cliente: customerName.trim() || 'CLIENTE',
        hora_venta: horaVenta,
        codigo_operacion: codigo || undefined,
      });
      setAssist(data);
      if (data.match && data.pago_yape_id) {
        setSelectedPagoId(data.pago_yape_id);
      }
    } catch {
      setAssist({
        match: false,
        estado_sugerido: 'PENDIENTE_VERIFICAR',
        mensaje:
          'Todavía no llega el aviso de Yape al celular de la empresa. Puedes completar la venta igual y revisar después con la foto.',
        sugeridos: [],
        bloquear_venta: false,
      });
    } finally {
      setLoading(false);
    }
  }, [hasDigital, montoDigital, customerName, operationCode1, operationCode2, horaVenta]);

  useEffect(() => {
    if (!hasDigital) {
      setAssist(null);
      setSelectedPagoId(null);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    const delay = usesReferenceTime ? 400 : DIGITAL_WAIT_MS;
    timerRef.current = setTimeout(() => {
      void consultar();
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [hasDigital, montoDigital, customerName, consultar, usesReferenceTime, horaVenta]);

  useEffect(() => {
    const code = (operationCode1 || operationCode2 || '').trim();
    if (!hasDigital || code.length < 4) {
      setCodigoInfo(null);
      return;
    }
    if (codeTimerRef.current) clearTimeout(codeTimerRef.current);
    codeTimerRef.current = setTimeout(async () => {
      try {
        const data = await yapePaymentService.validarCodigo({
          codigo_operacion: code,
          monto_yape: montoDigital,
        });
        setCodigoInfo(data);
        if (data.pago_yape_id) setSelectedPagoId(data.pago_yape_id);
      } catch {
        setCodigoInfo(null);
      }
    }, 600);
    return () => {
      if (codeTimerRef.current) clearTimeout(codeTimerRef.current);
    };
  }, [hasDigital, operationCode1, operationCode2, montoDigital]);

  // Tiempo real: el API ya emite PAGO_DIGITAL_RECIBIDO por WebSocket al guardar el aviso.
  useEffect(() => {
    if (!hasDigital) return;

    const onPagoRecibido = (event: Event) => {
      const pago = (event as CustomEvent).detail as { monto?: number | string };
      const montoAviso = Number(pago?.monto ?? 0);
      if (Math.abs(montoAviso - montoDigital) < 0.02) {
        void consultar();
      }
    };

    window.addEventListener('pago-digital-recibido', onPagoRecibido);
    return () => window.removeEventListener('pago-digital-recibido', onPagoRecibido);
  }, [hasDigital, montoDigital, consultar]);

  const elegirPago = useCallback((pago: PagoYape) => {
    setSelectedPagoId(pago.id);
  }, []);

  return {
    hasDigital,
    montoDigital,
    horaVenta,
    usesReferenceTime,
    assist,
    codigoInfo,
    loading,
    selectedPagoId,
    consultar,
    elegirPago,
  };
}
