// src/features/accounting/components/EditSeatModal.tsx

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentsService, SeatAssignmentDetail } from '../../../services/assignments.service';
import { useSeatMap } from '../../fluvial/hooks/useSeatMap';
import { SeatMap } from '../../fluvial/components/seat-map/SeatMap';
import { SeatMapLegend } from '../../fluvial/components/seat-map/SeatMapLegend';
import { SeatMapItem } from '../../../types';
import { Spinner } from '../../../components/common/Spinner';

interface EditSeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoiceSeries: string;
  invoiceNumber: number;
  invoiceId: number;
}

export const EditSeatModal: React.FC<EditSeatModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  invoiceSeries,
  invoiceNumber,
  invoiceId
}) => {
  const queryClient = useQueryClient();
  const [selectedSeat, setSelectedSeat] = useState<SeatMapItem | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<SeatAssignmentDetail | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Consultar las asignaciones del ticket
  const { data: assignments, isLoading: loadingAssignments, error: assignmentsError } = useQuery({
    queryKey: ['ticketAssignments', invoiceSeries, invoiceNumber],
    queryFn: () => assignmentsService.getByTicket(invoiceSeries, invoiceNumber),
    enabled: isOpen,
  });

  // Obtener el trip_id de la primera asignación
  const tripId = assignments && assignments.length > 0 ? assignments[0].trip_id : null;

  // Cargar el mapa de asientos
  const { data: seatMapData, isLoading: loadingSeatMap } = useSeatMap(tripId);

  // Establecer la asignación actual cuando se cargan los datos
  useEffect(() => {
    if (assignments && assignments.length > 0) {
      setCurrentAssignment(assignments[0]);
    }
  }, [assignments]);

  // Mutación para reasignar el asiento
  const reassignMutation = useMutation({
    mutationFn: (data: { assignment_id: number; new_trip_seat_id: number }) =>
      assignmentsService.reassign(data),
    onSuccess: () => {
      toast.success('Asiento reasignado exitosamente');
      
      // Invalidar las queries para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['ticketAssignments', invoiceSeries, invoiceNumber] });
      queryClient.invalidateQueries({ queryKey: ['seatMap', tripId] });
      
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Error al reasignar el asiento';
      toast.error(errorMessage);
    },
  });

  const handleSeatToggle = (seat: SeatMapItem) => {
    // Solo permitir seleccionar asientos disponibles
    if (seat.status === 'AVAILABLE') {
      setSelectedSeat(seat);
    } else {
      toast.warn('Este asiento no está disponible');
    }
  };

  const handleSubmit = async () => {
    if (!currentAssignment) {
      toast.error('No se encontró la asignación actual');
      return;
    }

    if (!selectedSeat) {
      toast.warn('Debes seleccionar un nuevo asiento');
      return;
    }

    if (!selectedSeat.id) {
      toast.error('El asiento seleccionado no tiene un ID válido');
      return;
    }

    // Mostrar el modal de confirmación
    setShowConfirmModal(true);
  };

  const handleConfirmReassign = () => {
    if (!currentAssignment || !selectedSeat) return;

    reassignMutation.mutate({
      assignment_id: currentAssignment.id,
      new_trip_seat_id: selectedSeat.id,
    });

    setShowConfirmModal(false);
  };

  if (!isOpen) return null;

  const isLoading = loadingAssignments || loadingSeatMap;
  const currentSeatLabel = currentAssignment?.current_seat_label || currentAssignment?.seat_number || 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ArrowPathIcon className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Editar Asiento</h2>
              <p className="text-sm text-gray-500 mt-1">
                Boleta/Factura: {invoiceSeries}-{String(invoiceNumber).padStart(8, '0')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={reassignMutation.isPending}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
            </div>
          ) : assignmentsError ? (
            <div className="text-center py-8">
              <p className="text-red-600">Error al cargar la información del ticket</p>
            </div>
          ) : !currentAssignment ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No se encontraron asignaciones para este ticket</p>
            </div>
          ) : (
            <>
              {/* Información del pasajero y asiento actual */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-blue-800">
                      Información del pasajero
                    </h3>
                    <div className="mt-2 text-sm text-blue-700 grid grid-cols-2 gap-4">
                      <div>
                        <p><strong>Nombre:</strong> {currentAssignment.passenger_name}</p>
                        <p><strong>Documento:</strong> {currentAssignment.passenger_doc_number}</p>
                      </div>
                      <div>
                        <p><strong>Asiento actual:</strong> <span className="font-bold text-lg">{currentSeatLabel}</span></p>
                        {selectedSeat && (
                          <p><strong>Nuevo asiento:</strong> <span className="font-bold text-lg text-green-600">{selectedSeat.seat_number}</span></p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mapa de asientos */}
              {seatMapData && tripId && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Seleccionar nuevo asiento
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <SeatMap
                          tripId={tripId}
                          vesselName=""
                          selectedSeats={selectedSeat ? new Set([selectedSeat.id]) : new Set()}
                          onSeatToggle={handleSeatToggle}
                          isLocked={false}
                        />
                      </div>
                    </div>
                    <div className="lg:col-span-1">
                      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                        <SeatMapLegend />
                        
                        {selectedSeat && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded">
                            <p className="text-sm font-medium text-green-800">
                              Asiento seleccionado:
                            </p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                              {selectedSeat.seat_number}
                            </p>
                          </div>
                        )}

                        {/* Botones de acción */}
                        <div className="pt-4 border-t border-gray-200 space-y-3">
                          <button
                            onClick={handleSubmit}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                            disabled={!selectedSeat || reassignMutation.isPending || isLoading}
                          >
                            {reassignMutation.isPending ? (
                              <>
                                <Spinner size="sm" />
                                <span>Guardando...</span>
                              </>
                            ) : (
                              <>
                                <ArrowPathIcon className="w-5 h-5" />
                                <span>Guardar cambio</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={onClose}
                            className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            disabled={reassignMutation.isPending}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de Confirmación */}
      {showConfirmModal && currentAssignment && selectedSeat && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Header del modal de confirmación */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Confirmar cambio de asiento</h3>
                  <p className="text-sm text-gray-500 mt-1">Esta acción modificará el ticket</p>
                </div>
              </div>
            </div>

            {/* Contenido del modal de confirmación */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                ¿Estás seguro de que deseas cambiar el asiento del pasajero?
              </p>

              <div className="bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-blue-500 p-4 rounded-lg">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Pasajero</p>
                      <p className="text-sm font-semibold text-gray-900">{currentAssignment.passenger_name}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                    <div className="text-center">
                      <p className="text-xs text-gray-600 font-medium mb-1">Asiento actual</p>
                      <div className="bg-red-100 border-2 border-red-300 rounded-lg py-2 px-3">
                        <p className="text-2xl font-bold text-red-700">
                          {currentAssignment.current_seat_label || currentAssignment.seat_number || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-xs text-gray-600 font-medium mb-1">Nuevo asiento</p>
                      <div className="bg-green-100 border-2 border-green-300 rounded-lg py-2 px-3">
                        <p className="text-2xl font-bold text-green-700">
                          {selectedSeat.seat_number}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-yellow-800">
                  El sistema regenerará automáticamente el ticket con el nuevo asiento.
                </p>
              </div>
            </div>

            {/* Footer del modal de confirmación */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all hover:shadow-sm font-medium"
                disabled={reassignMutation.isPending}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReassign}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={reassignMutation.isPending}
              >
                {reassignMutation.isPending ? (
                  <>
                    <Spinner size="sm" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Confirmar cambio</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
