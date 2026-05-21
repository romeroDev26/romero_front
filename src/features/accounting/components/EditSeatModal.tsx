// src/features/accounting/components/EditSeatModal.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { XMarkIcon, ArrowPathIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { toast } from '@/utils/sileo-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentsService, SeatAssignmentDetail, ReassignBulkData } from '../../../services/assignments.service';
import { useSeatMap } from '../../fluvial/hooks/useSeatMap';
import { SeatMap } from '../../fluvial/components/seat-map/SeatMap';
import { SeatMapLegend } from '../../fluvial/components/seat-map/SeatMapLegend';
import { SeatMapItem } from '../../../types';
import { Spinner } from '../../../components/common/Spinner';

// Vista activa dentro del modal
type ModalView = 'list' | 'edit';

// Cambio pendiente por enviar al backend
interface PendingChange {
  new_trip_seat_id: number;
  newSeatLabel: string; // para mostrar en el listado
}

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

  // Vista actual del modal: listado de asignaciones o edición de una
  const [view, setView] = useState<ModalView>('list');
  const [selectedSeat, setSelectedSeat] = useState<SeatMapItem | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<SeatAssignmentDetail | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  // Cambios acumulados localmente (solo para el caso multi-asignacion / factura)
  const [pendingChanges, setPendingChanges] = useState<Map<number, PendingChange>>(new Map());
  // Estado de guardado masivo en curso
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Consultar las asignaciones del ticket
  const { data: assignments, isLoading: loadingAssignments, error: assignmentsError } = useQuery({
    queryKey: ['ticketAssignments', invoiceSeries, invoiceNumber],
    queryFn: () => assignmentsService.getByTicket(invoiceSeries, invoiceNumber),
    enabled: isOpen,
  });

  const isMultiple = assignments !== undefined && assignments.length > 1;

  // Obtener el trip_id de la primera asignación disponible
  const tripId = assignments && assignments.length > 0 ? assignments[0].trip_id : null;

  // Cargar el mapa de asientos (siempre, ya que el trip_id es el mismo para todas)
  const { data: seatMapData, isLoading: loadingSeatMap } = useSeatMap(tripId);

  // Si solo hay una asignación, establecerla directo y pasar a la vista de edición
  useEffect(() => {
    if (assignments && assignments.length === 1) {
      setCurrentAssignment(assignments[0]);
      setView('edit');
    } else if (assignments && assignments.length > 1) {
      // Con múltiples, empezar siempre en el listado
      setView('list');
    }
  }, [assignments]);

  // Limpiar estado al cerrar
  useEffect(() => {
    if (!isOpen) {
      setView('list');
      setSelectedSeat(null);
      setCurrentAssignment(null);
      setShowConfirmModal(false);
      setPendingChanges(new Map());
      setIsSavingAll(false);
    }
  }, [isOpen]);

  // Mutación para reasignar un único asiento (usada solo en el caso boleta)
  const reassignMutation = useMutation({
    mutationFn: (data: { assignment_id: number; new_trip_seat_id: number }) =>
      assignmentsService.reassign(data),
    onSuccess: () => {
      toast.success('Asiento reasignado exitosamente');
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

  // ----------------------------------------------------------------
  // Guardar todos los cambios acumulados (caso factura / multi-asiento).
  // Se envían secuencialmente para evitar conflictos en el backend.
  // ----------------------------------------------------------------
  const handleSaveAll = async () => {
    if (pendingChanges.size === 0) return;
    setIsSavingAll(true);

    const payload: ReassignBulkData = {
      changes: Array.from(pendingChanges.entries()).map(([assignmentId, change]) => ({
        assignment_id: assignmentId,
        new_trip_seat_id: change.new_trip_seat_id,
      })),
    };

    try {
      await assignmentsService.reassignBulk(payload);
      toast.success('Todos los asientos fueron reasignados exitosamente');
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['ticketAssignments', invoiceSeries, invoiceNumber] });
      queryClient.invalidateQueries({ queryKey: ['seatMap', tripId] });
      onSuccess();
      onClose();
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error?.message || 'Error al guardar los cambios de asientos';
      toast.error(msg);
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleSelectAssignment = (assignment: SeatAssignmentDetail) => {
    setCurrentAssignment(assignment);
    // Si ya se había marcado un cambio para esta asignación, pre-seleccionar ese asiento
    const existing = pendingChanges.get(assignment.id);
    if (existing && seatMapData) {
      const prevSeat = (seatMapData as SeatMapItem[]).find(s => s.id === existing.new_trip_seat_id) ?? null;
      setSelectedSeat(prevSeat);
    } else {
      setSelectedSeat(null);
    }
    setView('edit');
  };

  const handleBackToList = () => {
    setCurrentAssignment(null);
    setSelectedSeat(null);
    setView('list');
  };

  const handleSeatToggle = (seat: SeatMapItem) => {
    if (seat.status === 'AVAILABLE') {
      setSelectedSeat(seat);
    } else {
      toast.warn('Este asiento no está disponible');
    }
  };

  const handleSubmit = () => {
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
    setShowConfirmModal(true);
  };

  // Confirmar cambio:
  // - Boleta (1 asignacion): llama al backend de inmediato.
  // - Factura (multiples): acumula el cambio localmente y vuelve al listado.
  const handleConfirmChange = () => {
    if (!currentAssignment || !selectedSeat) return;
    setShowConfirmModal(false);

    if (isMultiple) {
      setPendingChanges(prev => {
        const next = new Map(prev);
        next.set(currentAssignment.id, {
          new_trip_seat_id: selectedSeat.id,
          newSeatLabel: selectedSeat.seat_number || String(selectedSeat.id),
        });
        return next;
      });
      setSelectedSeat(null);
      setCurrentAssignment(null);
      setView('list');
    } else {
      reassignMutation.mutate({
        assignment_id: currentAssignment.id,
        new_trip_seat_id: selectedSeat.id,
      });
    }
  };

  if (!isOpen) return null;

  const isLoadingInitial = loadingAssignments;
  const isLoadingEdit = loadingSeatMap;
  const currentSeatLabel = currentAssignment?.current_seat_label || currentAssignment?.seat_number || 'N/A';
  const hasPendingChanges = pendingChanges.size > 0;

  // IDs de trip_seat ya elegidos como destino pendiente por OTRAS asignaciones (no la que se edita ahora)
  // Se usan para bloquear visualmente esos asientos en el mapa
  const blockedSeatIds = useMemo(() => {
    const ids = new Set<number>();
    for (const [assignmentId, change] of pendingChanges.entries()) {
      if (assignmentId !== currentAssignment?.id) {
        ids.add(change.new_trip_seat_id);
      }
    }
    return ids;
  }, [pendingChanges, currentAssignment?.id]);

  // ----------------------------------------------------------------
  // Vista: Listado de asignaciones (solo cuando hay múltiples)
  // ----------------------------------------------------------------
  const renderListView = () => (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-dm-text-secondary">
          Esta factura tiene <strong>{assignments?.length}</strong> asientos asignados.
          Selecciona cada asiento que deseas cambiar y luego guarda todos los cambios de una sola vez.
        </p>
        {hasPendingChanges && (
          <span className="flex-shrink-0 text-xs font-semibold text-orange-700 bg-orange-100 dark:bg-orange-900/40 border border-orange-300 rounded-full px-2 py-0.5">
            {pendingChanges.size} pendiente{pendingChanges.size > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {assignments?.map((assignment, index) => {
          const pending = pendingChanges.get(assignment.id);
          const seatLabel = assignment.current_seat_label || assignment.seat_number || 'N/A';
          return (
            <div
              key={assignment.id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                pending
                  ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-300'
                  : 'bg-dm-bg-primary border-dm-border-primary hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-dm-bg-secondary flex items-center justify-center text-sm font-bold text-dm-text-secondary">
                  {index + 1}
                </div>
                <div>
                  {/* Asiento actual -> nuevo asiento (si hay cambio pendiente) */}
                  {pending ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-dm-text-muted line-through">{seatLabel}</span>
                      <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span className="text-lg font-bold text-orange-700">{pending.newSeatLabel}</span>
                      <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">(pendiente)</span>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-dm-text-primary">
                      Asiento actual:{' '}
                      <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                        {seatLabel}
                      </span>
                    </p>
                  )}
                  <p className="text-xs text-dm-text-muted mt-0.5">
                    Item ID: {assignment.invoice_item_id} &mdash; Estado: {assignment.status}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleSelectAssignment(assignment)}
                  disabled={isSavingAll}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {pending ? 'Cambiar asiento' : 'Editar asiento'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Acciones del listado */}
      <div className="pt-4 border-t border-dm-border-primary flex items-center justify-between gap-3">
        <button
          onClick={onClose}
          disabled={isSavingAll}
          className="px-5 py-2.5 text-dm-text-secondary bg-dm-bg-primary border border-dm-border-primary rounded-lg hover:bg-dm-bg-hover transition-colors font-medium disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSaveAll}
          disabled={!hasPendingChanges || isSavingAll}
          className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSavingAll ? (
            <>
              <Spinner size="sm" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <ArrowPathIcon className="w-4 h-4" />
              <span>Guardar todos los cambios{hasPendingChanges ? ` (${pendingChanges.size})` : ''}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  // ----------------------------------------------------------------
  // Vista: Edición de una asignación puntual
  // ----------------------------------------------------------------
  const renderEditView = () => {
    if (!currentAssignment) return null;
    return (
      <div className="p-6 space-y-6">
        {/* Botón volver al listado (solo si hay múltiples) */}
        {isMultiple && (
          <button
            onClick={handleBackToList}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-300 font-medium"
            disabled={reassignMutation.isPending}
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Volver al listado de asientos
          </button>
        )}

        {/* Información del asiento seleccionado para editar */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Informacion del pasajero / asignacion
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 grid grid-cols-2 gap-4">
                <div>
                  <p><strong>Nombre:</strong> {currentAssignment.passenger_name}</p>
                  <p><strong>Documento:</strong> {currentAssignment.passenger_doc_number}</p>
                </div>
                <div>
                  <p><strong>Asiento actual:</strong> <span className="font-bold text-lg">{currentSeatLabel}</span></p>
                  {selectedSeat && (
                    <p><strong>Nuevo asiento:</strong> <span className="font-bold text-lg text-green-600 dark:text-green-400">{selectedSeat.seat_number}</span></p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mapa de asientos */}
        {isLoadingEdit ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : seatMapData && tripId ? (
          <div>
            <h3 className="text-lg font-semibold text-dm-text-primary mb-4">
              Seleccionar nuevo asiento
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-dm-bg-secondary rounded-lg p-4 border border-dm-border-primary">
                  <SeatMap
                    tripId={tripId}
                    vesselName=""
                    selectedSeats={selectedSeat ? new Set([selectedSeat.id]) : new Set()}
                    onSeatToggle={handleSeatToggle}
                    isLocked={false}
                    blockedSeats={blockedSeatIds}
                  />
                </div>
              </div>
              <div className="lg:col-span-1">
                <div className="bg-dm-bg-primary rounded-lg border border-dm-border-primary p-4 space-y-4">
                  <SeatMapLegend showPendingBlock={isMultiple} />

                  {selectedSeat && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 rounded">
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">
                        Asiento seleccionado:
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {selectedSeat.seat_number}
                      </p>
                    </div>
                  )}

                  {/* Botones de accion */}
                  <div className="pt-4 border-t border-dm-border-primary space-y-3">
                    <button
                      onClick={handleSubmit}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                      disabled={!selectedSeat || reassignMutation.isPending}
                    >
                      {reassignMutation.isPending ? (
                        <>
                          <Spinner size="sm" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <ArrowPathIcon className="w-5 h-5" />
                          <span>{isMultiple ? 'Agregar cambio al listado' : 'Guardar cambio'}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={isMultiple ? handleBackToList : onClose}
                      className="w-full px-4 py-3 text-dm-text-secondary bg-dm-bg-primary border border-dm-border-primary rounded-lg hover:bg-dm-bg-hover transition-colors font-medium"
                      disabled={reassignMutation.isPending}
                    >
                      {isMultiple ? 'Volver al listado' : 'Cancelar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-dm-bg-primary rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dm-border-primary">
          <div className="flex items-center gap-3">
            <ArrowPathIcon className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="text-2xl font-bold text-dm-text-primary">Editar Asiento</h2>
              <p className="text-sm text-dm-text-muted mt-1">
                Factura/Boleta: {invoiceSeries}-{String(invoiceNumber).padStart(8, '0')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-dm-text-muted hover:text-dm-text-secondary transition-colors"
            disabled={reassignMutation.isPending}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        {isLoadingInitial ? (
          <div className="flex justify-center items-center py-16">
            <Spinner size="lg" />
          </div>
        ) : assignmentsError ? (
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">Error al cargar la informacion del ticket</p>
          </div>
        ) : !assignments || assignments.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-dm-text-secondary">No se encontraron asignaciones para este ticket</p>
          </div>
        ) : view === 'list' ? (
          renderListView()
        ) : (
          renderEditView()
        )}
      </div>

      {/* Modal de Confirmacion */}
      {showConfirmModal && currentAssignment && selectedSeat && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-dm-bg-primary rounded-xl shadow-2xl max-w-md w-full">
            {/* Header del modal de confirmacion */}
            <div className="p-6 border-b border-dm-border-primary">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-dm-text-primary">Confirmar cambio de asiento</h3>
                  <p className="text-sm text-dm-text-muted mt-1">
                    {isMultiple ? 'El cambio se agregara al listado pendiente' : 'Esta accion modificara el ticket'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido del modal de confirmacion */}
            <div className="p-6 space-y-4">
              <p className="text-dm-text-secondary">
                Esta seguro de que deseas cambiar el asiento?
              </p>

              <div className="bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-blue-500 p-4 rounded-lg">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-dm-text-secondary font-medium">Asignacion</p>
                    <p className="text-sm font-semibold text-dm-text-primary">{currentAssignment.passenger_name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dm-border-primary">
                    <div className="text-center">
                      <p className="text-xs text-dm-text-secondary font-medium mb-1">Asiento actual</p>
                      <div className="bg-red-100 dark:bg-red-900/40 border-2 border-red-300 rounded-lg py-2 px-3">
                        <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                          {currentAssignment.current_seat_label || currentAssignment.seat_number || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-dm-text-secondary font-medium mb-1">Nuevo asiento</p>
                      <div className="bg-green-100 dark:bg-green-900/40 border-2 border-green-300 rounded-lg py-2 px-3">
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {selectedSeat.seat_number}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  {isMultiple
                    ? 'Este cambio se guardara en el listado. El ticket se regenera una sola vez al presionar "Guardar todos los cambios".'
                    : 'El sistema regenerara automaticamente el ticket con el nuevo asiento.'}
                </p>
              </div>
            </div>

            {/* Footer del modal de confirmacion */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-dm-border-primary bg-dm-bg-secondary rounded-b-xl">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 text-dm-text-secondary bg-dm-bg-primary border border-dm-border-primary rounded-lg hover:bg-dm-bg-hover transition-all hover:shadow-sm font-medium"
                disabled={reassignMutation.isPending}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmChange}
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
