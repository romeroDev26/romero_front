// src/features/fluvial/components/sales-point/representatives/AddRepresentativeForm.tsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../../../../components/common/Button';
import { Input } from '../../../../../components/common/Input';
import { SunatDocType } from '../../../types/sunat.types';
import api from '../../../../../config/api';

interface Representative {
  document_type: string;
  document_number: string;
  name: string;
  phone: string | null; // ← Permitir null
  email?: string; // ← NUEVO: Campo email
  seat_number?: string;
  item_description?: string; // ← NUEVO: Descripción opcional por representante
  special_notes?: string; // ← NUEVO: Campo notas especiales
}

interface SeatMapItem {
  seat_number: string;
  seat_type_name: string;
  is_available: boolean;
  is_reserved?: boolean;
  reserved_until?: string;
}

interface AddRepresentativeFormProps {
  onAdd: (representative: Representative) => void;
  onCancel: () => void;
  existingDocuments: string[];
  tripId: number;
  usedSeatNumbers: string[];
  selectedSeat: any; // Asiento seleccionado desde el mapa visual
  onSeatSelect: (seat: any) => void; // Función para seleccionar asiento
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
}) => {
  const [formData, setFormData] = useState({
    document_type: SunatDocType.DNI,
    document_number: '',
    name: '',
    phone: '',
    email: '', // ← NUEVO: Campo email
    seat_number: '',
    item_description: '', // ← NUEVO: Descripción por ítem/representante
    special_notes: '', // ← NUEVO: Campo notas especiales
  });
  
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
      } catch (error) {
        return [];
      }
    },
    enabled: !!tripId,
  });

  // Filtrar asientos disponibles
  const availableSeats = Array.isArray(seatMap)
    ? seatMap.filter(seat => seat.is_available && !usedSeatNumbers.includes(seat.seat_number))
    : [];

  const hasSeats = Array.isArray(seatMap) && seatMap.length > 0;

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
    } catch (error: any) {
      setDniError('No se pudieron obtener los datos del DNI');
      // Mostrar mensaje apropiado según el tipo de error
      if (error?.response?.status === 401) {
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
  const handleSeatSelection = async (seat: any) => {
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
    if (formData.document_type === SunatDocType.CARNET_EXTRANJERIA && formData.document_number.length !== 12) {
      toast.error('El Carné de Extranjería debe tener 12 caracteres');
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

    // Agregar representante
    onAdd({
      document_type: formData.document_type,
      document_number: formData.document_number.trim(),
      name: formData.name.trim(),
      phone: formData.phone.trim() || null, // ← Enviar null si está vacío
      email: formData.email.trim() || undefined, // ← NUEVO: Campo email
      seat_number: seatNumber,
      item_description: formData.item_description.trim() || undefined,
      special_notes: formData.special_notes.trim() || undefined, // ← NUEVO: Campo notas especiales
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
      special_notes: '', // ← NUEVO: Campo notas especiales
    });
    
    // Limpiar selección de asiento
    onSeatSelect(null);
  };

  return (
    <div className="border border-blue-200 rounded-lg p-4 bg-white">
      <h4 className="font-medium text-gray-800 mb-3">Agregar Representante</h4>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Documento
            </label>
            <select
              value={formData.document_type}
              onChange={(e) => setFormData(prev => ({ ...prev, document_type: e.target.value as SunatDocType }))}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value={SunatDocType.DNI}>DNI</option>
              <option value={SunatDocType.CARNET_EXTRANJERIA}>Carné de Extranjería</option>
              <option value={SunatDocType.PASAPORTE}>Pasaporte</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <div className="text-xs text-red-500 mt-1">{dniError}</div>
            )}
            {formData.document_type === SunatDocType.DNI && (
              <div className="text-xs text-gray-500 mt-1">
                Al ingresar 8 dígitos se consultará automáticamente
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono <span className="text-gray-400">(opcional)</span>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-gray-400">(opcional)</span>
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Correo electrónico del representante"
            className="text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción por ítem <span className="text-gray-400">(opcional)</span>
          </label>
          <textarea
            value={formData.item_description}
            onChange={(e) => setFormData(prev => ({ ...prev, item_description: e.target.value }))}
            placeholder="Ej. Pasaje Iquitos-Nauta - PASAJERO: NOMBRE"
            className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
            rows={2}
            maxLength={500}
          />
          <div className="text-xs text-gray-500 mt-1">
            {formData.item_description.length}/500 caracteres
          </div>
        </div>

        {/* ← NUEVO: Campo Notas Especiales */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas Especiales <span className="text-gray-400">(opcional)</span>
          </label>
          <textarea
            value={formData.special_notes}
            onChange={(e) => setFormData(prev => ({ ...prev, special_notes: e.target.value }))}
            placeholder="Observaciones especiales para este representante..."
            className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
            rows={2}
            maxLength={200}
          />
          <div className="text-xs text-gray-500 mt-1">
            {formData.special_notes.length}/200 caracteres
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Asiento
          </label>
          {hasSeats ? (
            <div className="space-y-2">
              <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                {selectedSeat ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-green-700">
                        Asiento Seleccionado: {selectedSeat.seat_number}
                      </div>
                      <div className="text-sm text-gray-600">
                        Tipo: {selectedSeat.seat_type_name}
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
                  <div className="text-center text-gray-600">
                    <div className="font-medium">Seleccione un asiento</div>
                    <div className="text-sm">Use el mapa de asientos de abajo</div>
                    <div className="text-xs text-red-500 mt-1">
                      * Obligatorio para continuar
                    </div>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {availableSeats.length} asientos disponibles en el mapa
              </div>
            </div>
          ) : (
            <div className="p-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
              Esta embarcación no tiene asientos configurados
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm py-2"
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
            className="px-4 text-sm py-2"
            disabled={isReservingSeat}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
};
