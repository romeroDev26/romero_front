// src/features/fluvial/components/sales-point/representatives/AddRepresentativeForm.tsx
import React, { useState } from 'react';
import { toast } from '@/utils/sileo-toast';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../../../../components/common/Button';
import { Input } from '../../../../../components/common/Input';
import { SunatDocType } from '../../../types/sunat.types';
import api from '../../../../../config/api';
import { REPRESENTATIVE_ITEM_DESCRIPTION_MAX_CHARS } from '../core/types';
import { asApiError } from '../../../../../utils/errorHandler';
import type { SeatMapItem } from '../../../../../types';
import { DuplicatePassengerWarning } from '../../../../../components/common/DuplicatePassengerWarning';
import { useTripPassengerTicketCheck } from '../../../../../hooks/useTripPassengerTicketCheck';

interface Representative {
  boarding_stop_id?: number;
  disembarking_stop_id?: number;
  unit_price?: number;

  document_type: string;
  document_number: string;
  name: string;
  phone: string | null; // ← Permitir null
  email?: string; // ← NUEVO: Campo email
  seat_number?: string;
  item_description?: string; // ← NUEVO: Descripción opcional por representante
}

interface AddRepresentativeFormProps {
  tripStops?: Array<{ id: number; stop_order: number; port?: { name: string } }>;
  defaultBoardingStopId?: number | null;
  defaultDisembarkingStopId?: number | null;
  defaultFare?: number;

  onAdd: (representative: Representative) => void;
  onCancel: () => void;
  existingDocuments: string[];
  tripId: number;
  usedSeatNumbers: string[];
  selectedSeat: SeatMapItem | null; // Asiento seleccionado desde el mapa visual
  onSeatSelect: (seat: SeatMapItem | null) => void; // null = deseleccionar
  representativeIndex: number; // Nuevo: índice del representante
  onSeatReserve?: (seatNumber: string, representativeIndex: number) => Promise<boolean>; // Nueva función para reservar
  onSeatRelease?: (representativeIndex: number) => void; // Nueva función para liberar
}

export const AddRepresentativeForm: React.FC<AddRepresentativeFormProps> = ({
  onAdd,
  onCancel,
  existingDocuments,
  tripId,
  usedSeatNumbers,
  selectedSeat,
  onSeatSelect,
  representativeIndex,
  onSeatReserve,
  onSeatRelease,
  tripStops = [], defaultBoardingStopId, defaultDisembarkingStopId, defaultFare,
}) => {
  const [formData, setFormData] = useState({
    document_type: SunatDocType.DNI,
    document_number: '',
    name: '',
    phone: '',
    email: '', // ← NUEVO: Campo email
    seat_number: '',
    item_description: '', // ← NUEVO: Descripción por ítem/representante
  });
  
  const [customSegment, setCustomSegment] = useState(false);
  const [boardingStopId, setBoardingStopId] = useState(defaultBoardingStopId ?? 0);
  const [disembarkingStopId, setDisembarkingStopId] = useState(defaultDisembarkingStopId ?? 0);
  const [individualFare, setIndividualFare] = useState(String(defaultFare ?? ''));
  const boardingOrder = tripStops.find(stop => stop.id === boardingStopId)?.stop_order;

  const [isLoadingDni, setIsLoadingDni] = useState(false);
  const [dniError, setDniError] = useState<string | null>(null);
  const [isReservingSeat, setIsReservingSeat] = useState(false);

  // Obtener mapa de asientos del viaje
  const { data: seatMap } = useQuery({
    queryKey: ['seatMap', tripId],
    queryFn: async () => {
      try {
        const response = await api.get(`/operations/trips/${tripId}/seat-map`);
        if (response.status === 204) {
          return []; // Sin asientos configurados -> devolver array vacío
        }
        return response.data as SeatMapItem[];
      } catch {
        return [];
      }
    },
    enabled: !!tripId,
  });

  // Filtrar asientos disponibles
  const availableSeats = Array.isArray(seatMap)
    ? seatMap.filter(
        (seat) => seat.status === 'AVAILABLE' && !usedSeatNumbers.includes(seat.seat_number)
      )
    : [];

  const hasSeats = Array.isArray(seatMap) && seatMap.length > 0;

  const { loading: checkingDuplicateTicket, matches: duplicateTicketMatches } =
    useTripPassengerTicketCheck({
      tripId,
      docType: formData.document_type,
      docNumber: formData.document_number,
    });

  // Función para consultar DNI
  const handleDniQuery = async (dni: string) => {
    if (dni.length !== 8) return;

    setIsLoadingDni(true);
    setDniError(null);

    try {
      const response = await api.get(`/external/query-dni?dni=${dni}`, {
        headers: { 'X-Skip-Auth-Redirect': '1' }
      });
      if (response.data && response.data.nombreCompleto) {
        setFormData(prev => ({
          ...prev,
          name: response.data.nombreCompleto,
          phone: response.data.phone || prev.phone // Solo actualizar teléfono si viene en la respuesta
        }));
        toast.success('Datos encontrados automáticamente');
      }
    } catch (error) {
      const apiError = asApiError(error);
      setDniError('No se pudieron obtener los datos del DNI');
      // Mostrar mensaje apropiado según el tipo de error
      if (apiError.response?.status === 401) {
        toast.warning('No se pudo realizar la consulta automática del DNI. Puede ingresar los datos manualmente para continuar.');
      } else {
        toast.warning('No se encontraron datos para este DNI. Ingrese el nombre manualmente.');
      }
    } finally {
      setIsLoadingDni(false);
    }
  };

  // Manejar cambio en número de documento
  const handleDocumentNumberChange = (value: string) => {
    setFormData(prev => ({ ...prev, document_number: value }));
    
    // Auto-consultar si es DNI y tiene 8 dígitos
    if (formData.document_type === SunatDocType.DNI && value.length === 8) {
      handleDniQuery(value);
    }
  };

  // Nueva función: Manejar selección de asiento con reserva
  const handleSeatSelection = async (seat: SeatMapItem | null) => {
    if (!seat) {
      // Liberar asiento actual si existe
      if (selectedSeat && onSeatRelease) {
        onSeatRelease(representativeIndex);
      }
      onSeatSelect(null);
      return;
    }

    // Intentar reservar el nuevo asiento
    if (onSeatReserve) {
      setIsReservingSeat(true);
      const reserved = await onSeatReserve(seat.seat_number, representativeIndex);
      setIsReservingSeat(false);
      
      if (reserved) {
        // Liberar asiento anterior si había uno
        if (selectedSeat && selectedSeat.seat_number !== seat.seat_number && onSeatRelease) {
          onSeatRelease(representativeIndex);
        }
        onSeatSelect(seat);
        toast.success(`Asiento ${seat.seat_number} reservado temporalmente`);
      } else {
        toast.error('No se pudo reservar el asiento. Intente con otro.');
      }
    } else {
      // Fallback sin reserva
      onSeatSelect(seat);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.document_number.trim()) {
      toast.error('El número de documento es requerido');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    // Verificar duplicados
    if (existingDocuments.includes(formData.document_number.trim())) {
      toast.error('Este documento ya está registrado');
      return;
    }

    // Validar DNI
    if (formData.document_type === SunatDocType.DNI && formData.document_number.length !== 8) {
      toast.error('El DNI debe tener 8 dígitos');
      return;
    }

    // Validar CE (Carné de extranjería)
    if (formData.document_type === SunatDocType.CARNET_EXTRANJERIA && (formData.document_number.length < 8 || formData.document_number.length > 12)) {
      toast.error('El Carné de Extranjería debe tener entre 8 y 12 caracteres');
      return;
    }

    // NUEVA VALIDACIÓN: Para embarcaciones con asientos, es obligatorio seleccionar uno
    if (hasSeats && !selectedSeat) {
      toast.error('Debe seleccionar un asiento en el mapa de abajo');
      return;
    }

    // Determinar número de asiento
    const seatNumber = hasSeats 
      ? (selectedSeat ? selectedSeat.seat_number : "Elección libre")
      : "Sin asientos configurados";

    if (customSegment && (!boardingStopId || !disembarkingStopId ||
        (boardingOrder ?? Infinity) >= (tripStops.find(stop => stop.id === disembarkingStopId)?.stop_order ?? -1) ||
        !Number.isFinite(Number(individualFare)) || Number(individualFare) <= 0)) {
      toast.error('Revisa el tramo y la tarifa del representante');
      return;
    }

    // Agregar representante
    onAdd({
      document_type: formData.document_type,
      document_number: formData.document_number.trim(),
      name: formData.name.trim(),
      phone: formData.phone.trim() || null, // ← Enviar null si está vacío
      email: formData.email.trim() || undefined, // ← NUEVO: Campo email
      seat_number: seatNumber,
      ...(customSegment ? { boarding_stop_id: boardingStopId, disembarking_stop_id: disembarkingStopId, unit_price: Number(individualFare) } : {}),
      item_description: formData.item_description.trim() || undefined,
    });

    // Limpiar formulario y asiento seleccionado
    setFormData({
      document_type: SunatDocType.DNI,
      document_number: '',
      name: '',
      phone: '',
      email: '', // ← NUEVO: Campo email
      seat_number: '',
      item_description: '', // ← NUEVO: Descripción por ítem/representante
    });
    
    // Limpiar selección de asiento
    onSeatSelect(null);
  };

  return (
    <div className="rounded-lg border border-dm-border-primary bg-dm-bg-primary p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-dm-text-primary sm:text-base">Agregar Representante</h4>
        <span className="rounded-full bg-dm-bg-secondary px-2.5 py-1 text-[11px] font-medium text-dm-text-muted">
          Paso {representativeIndex + 1}
        </span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        {tripStops.length > 0 && (
          <div className="rounded-lg border border-dm-border-primary p-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={customSegment} onChange={e => {
                setCustomSegment(e.target.checked);
                if (e.target.checked) {
                  setBoardingStopId(defaultBoardingStopId ?? 0);
                  setDisembarkingStopId(defaultDisembarkingStopId ?? 0);
                  setIndividualFare(defaultFare && defaultFare > 0 ? String(defaultFare) : '');
                }
              }} />
              Usar otro tramo o tarifa para este pasajero
            </label>
            {!customSegment && <p className="mt-1 text-xs text-dm-text-secondary">Usará el tramo y la tarifa general de la venta. Puedes elegirlos antes de confirmar.</p>}
          </div>
        )}
        {customSegment && (
          <fieldset className="rounded-lg border border-dm-border-primary bg-dm-bg-secondary p-3">
            <legend className="px-1 text-sm font-semibold">Tramo y tarifa de este pasajero</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs">Embarque
                <select aria-label="Embarque del representante" value={boardingStopId} onChange={e => { setBoardingStopId(Number(e.target.value)); setDisembarkingStopId(0); }} className="mt-1 w-full rounded-md border border-dm-border-primary bg-dm-bg-primary p-2 text-sm">
                  <option value={0}>Seleccionar puerto</option>
                  {tripStops.map(stop => <option key={stop.id} value={stop.id}>{stop.port?.name ?? `Parada ${stop.id}`}</option>)}
                </select>
              </label>
              <label className="text-xs">Desembarque
                <select aria-label="Desembarque del representante" value={disembarkingStopId} onChange={e => setDisembarkingStopId(Number(e.target.value))} className="mt-1 w-full rounded-md border border-dm-border-primary bg-dm-bg-primary p-2 text-sm">
                  <option value={0}>Seleccionar puerto</option>
                  {tripStops.filter(stop => stop.stop_order > (boardingOrder ?? Infinity)).map(stop => <option key={stop.id} value={stop.id}>{stop.port?.name ?? `Parada ${stop.id}`}</option>)}
                </select>
              </label>
              <label className="text-xs">Tarifa individual
                <input aria-label="Tarifa del representante" type="number" min="0.01" step="0.01" value={individualFare} onChange={e => setIndividualFare(e.target.value)} className="mt-1 w-full rounded-md border border-dm-border-primary bg-dm-bg-primary p-2 text-sm" />
              </label>
            </div>
            <p className="mt-2 text-xs text-dm-text-secondary">Puedes combinar distintos tramos del mismo viaje en una factura. Ingresa la tarifa autorizada; el cambio de puerto no la recalcula.</p>
          </fieldset>
        )}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-dm-text-muted">
              Tipo de Documento
            </label>
            <select
              value={formData.document_type}
              onChange={(e) => setFormData(prev => ({ ...prev, document_type: e.target.value as SunatDocType }))}
              className="w-full rounded-lg border border-dm-border-primary bg-dm-bg-primary px-3 py-2 text-sm text-dm-text-primary focus:border-[#435ee5] focus:outline-none focus:ring-2 focus:ring-[#435ee5]/20"
            >
              <option value={SunatDocType.DNI}>DNI</option>
              <option value={SunatDocType.CARNET_EXTRANJERIA}>Carné de Extranjería</option>
              <option value={SunatDocType.PASAPORTE}>Pasaporte</option>
              <option value={SunatDocType.CEDULA_DIPLOMATICA}>Cédula Diplomática</option>
            </select>
          </div>
          
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-dm-text-muted">
              N° de Documento
            </label>
            <div className="relative">
              <Input
                type="text"
                value={formData.document_number}
                onChange={(e) => handleDocumentNumberChange(e.target.value)}
                placeholder={formData.document_type === SunatDocType.DNI ? "DNI (se consultará automáticamente)" : "Ingrese número"}
                className="text-sm"
                maxLength={formData.document_type === SunatDocType.DNI ? 8 : 20}
                disabled={isLoadingDni}
              />
              {isLoadingDni && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            {dniError && (
              <div className="text-xs text-red-500 dark:text-red-400 mt-1">{dniError}</div>
            )}
            {formData.document_type === SunatDocType.DNI && (
              <div className="mt-1 text-xs text-dm-text-muted">
                Al ingresar 8 dígitos se consultará automáticamente
              </div>
            )}
            <DuplicatePassengerWarning
              loading={checkingDuplicateTicket}
              matches={duplicateTicketMatches}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-dm-text-muted">
            Nombre Completo
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Nombre y apellidos del representante"
            className="text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-dm-text-muted">
            Teléfono <span className="text-dm-text-muted">(opcional)</span>
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Número de teléfono del representante"
              className="text-sm"
            />
          </div>

          {/* ← NUEVO: Campo Email */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-dm-text-muted">
            Email <span className="text-dm-text-muted">(opcional)</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Correo electrónico del representante"
              className="text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-dm-text-muted">
            Descripción por ítem <span className="font-normal text-red-600 dark:text-red-400">(opcional)</span>
          </label>
          <textarea
            value={formData.item_description}
            onChange={(e) => setFormData(prev => ({ ...prev, item_description: e.target.value }))}
            placeholder="Ej. Pasaje Iquitos-Nauta - PASAJERO: NOMBRE"
            className="w-full resize-none rounded-lg border-2 border-red-300 bg-dm-bg-primary p-2 text-sm text-dm-text-primary placeholder:text-dm-text-muted focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            rows={2}
            maxLength={REPRESENTATIVE_ITEM_DESCRIPTION_MAX_CHARS}
          />
          <div className="mt-1 text-xs text-dm-text-muted">
            {formData.item_description.length}/{REPRESENTATIVE_ITEM_DESCRIPTION_MAX_CHARS} caracteres
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-dm-text-muted">
            Asiento
          </label>
          {hasSeats ? (
            <div className="space-y-2">
              <div className="rounded-md border border-dm-border-primary bg-dm-bg-secondary p-3">
                {selectedSeat ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-green-700 dark:text-green-300">
                        Asiento Seleccionado: {selectedSeat.seat_number}
                      </div>
                      <div className="text-sm text-dm-text-muted">
                        Tipo: {selectedSeat.seat_type?.name ?? 'N/A'}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSeatSelection(null)}
                      className="text-xs"
                      disabled={isReservingSeat}
                    >
                      {isReservingSeat ? 'Liberando...' : 'Cambiar'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-dm-text-muted">
                    <div className="font-medium">Seleccione un asiento</div>
                    <div className="text-sm">Use el mapa de asientos de abajo</div>
                    <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                      * Obligatorio para continuar
                    </div>
                  </div>
                )}
              </div>
              <div className="text-xs text-dm-text-muted">
                {availableSeats.length} asientos disponibles en el mapa
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dm-border-primary bg-dm-bg-secondary p-2 text-sm text-dm-text-muted">
              Esta embarcación no tiene asientos configurados
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <Button
            type="submit"
            className="flex-1 bg-gray-900 py-2 text-sm text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            disabled={Boolean((hasSeats && !selectedSeat) || isReservingSeat)}
          >
            {isReservingSeat 
              ? "Reservando asiento..." 
              : hasSeats && !selectedSeat 
                ? "Seleccione un asiento primero" 
                : "Agregar Representante"
            }
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="px-4 py-2 text-sm"
            disabled={isReservingSeat}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
};
