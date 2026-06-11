import React from 'react';
import {
  ExclamationTriangleIcon,
  ArrowRightIcon,
  UserIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/common/Button';
import { PreviewVesselChangeResponse } from '../../../../types';

interface VesselChangePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  previewData: PreviewVesselChangeResponse | null;
  isLoading?: boolean;
}

export const VesselChangePreviewModal: React.FC<VesselChangePreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  previewData,
  isLoading = false,
}) => {
  if (!previewData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Cambio de Embarcación" maxWidth="2xl">
      <div className="flex flex-col max-h-[calc(90vh-6rem)]">
        {/* Contenido scrolleable */}
        <div className="overflow-y-auto pr-1 space-y-4">
          {/* Header informativo */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Atención: Se detectaron reubicaciones de pasajeros
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  La nueva embarcación tiene una configuración de asientos diferente.{' '}
                  <span className="font-semibold">
                    {previewData.total_relocated} pasajero{previewData.total_relocated !== 1 ? 's' : ''}
                  </span>{' '}
                  serán reubicados.
                </p>
              </div>
            </div>
          </div>

          {/* Alerta de capacidad insuficiente */}
          {previewData.insufficient_capacity && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                    Capacidad insuficiente
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    {previewData.unassigned_passengers > 0
                      ? `${previewData.unassigned_passengers} pasajero${previewData.unassigned_passengers !== 1 ? 's' : ''} no podrán ser reubicados por falta de capacidad.`
                      : 'La nueva embarcación no tiene capacidad suficiente para todos los pasajeros.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── DESKTOP: tabla fija (≥768px) ── */}
          <div className="hidden md:block">
            <h4 className="text-sm font-semibold text-dm-text-primary mb-2">
              Detalle de reubicaciones
            </h4>
            <div className="rounded-lg border border-dm-border-secondary overflow-hidden">
              <div className="overflow-y-auto max-h-[220px]">
                <table className="w-full table-fixed divide-y divide-dm-border-secondary">
                  <thead className="bg-dm-bg-secondary sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-dm-text-secondary uppercase tracking-wider w-[35%]">
                        Pasajero
                      </th>
                      <th className="px-3 py-2.5 text-center text-xs font-medium text-dm-text-secondary uppercase tracking-wider w-[17%]">
                        Actual
                      </th>
                      <th className="px-3 py-2.5 text-center text-xs font-medium text-dm-text-secondary uppercase tracking-wider w-[17%]">
                        Nuevo
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-dm-text-secondary uppercase tracking-wider w-[31%]">
                        Advertencia
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-dm-bg-primary divide-y divide-dm-border-secondary">
                    {previewData.relocations.map((relocation, idx) => (
                      <tr
                        key={idx}
                        className={
                          relocation.warning
                            ? 'bg-amber-50/50 dark:bg-amber-950/20'
                            : undefined
                        }
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-dm-text-muted flex-shrink-0" />
                            <span className="text-sm font-medium text-dm-text-primary truncate">
                              {relocation.passenger_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="inline-flex flex-col items-center leading-tight">
                            <span className="text-sm font-semibold text-dm-text-primary">
                              {relocation.old_seat}
                            </span>
                            <span className="text-[11px] text-dm-text-muted">
                              {relocation.old_seat_type}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="inline-flex items-center gap-1 leading-tight">
                            <ArrowRightIcon className="h-3 w-3 text-dm-text-muted flex-shrink-0" />
                            <div className="inline-flex flex-col items-center">
                              <span className="text-sm font-semibold text-primary">
                                {relocation.new_seat}
                              </span>
                              <span className="text-[11px] text-dm-text-muted">
                                {relocation.new_seat_type}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {relocation.warning ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 truncate max-w-full">
                              {relocation.warning}
                            </span>
                          ) : (
                            <span className="text-xs text-dm-text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── MÓVIL: cards apiladas (<768px) ── */}
          <div className="md:hidden">
            <h4 className="text-sm font-semibold text-dm-text-primary mb-2">
              Detalle de reubicaciones ({previewData.total_relocated})
            </h4>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
              {previewData.relocations.map((relocation, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-3 ${
                    relocation.warning
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'
                      : 'bg-dm-bg-primary border-dm-border-secondary'
                  }`}
                >
                  {/* Nombre del pasajero */}
                  <div className="flex items-center gap-2 mb-2">
                    <UserIcon className="h-4 w-4 text-dm-text-muted flex-shrink-0" />
                    <span className="text-sm font-semibold text-dm-text-primary">
                      {relocation.passenger_name}
                    </span>
                  </div>

                  {/* Asientos */}
                  <div className="flex items-center justify-between bg-dm-bg-secondary rounded-md px-3 py-2 mb-2">
                    <div className="text-center flex-1">
                      <span className="block text-[10px] text-dm-text-muted uppercase tracking-wide">Actual</span>
                      <span className="block text-sm font-semibold text-dm-text-primary">
                        {relocation.old_seat}
                      </span>
                      <span className="block text-[10px] text-dm-text-muted">
                        {relocation.old_seat_type}
                      </span>
                    </div>
                    <div className="px-2">
                      <ArrowsRightLeftIcon className="h-4 w-4 text-dm-text-muted" />
                    </div>
                    <div className="text-center flex-1">
                      <span className="block text-[10px] text-dm-text-muted uppercase tracking-wide">Nuevo</span>
                      <span className="block text-sm font-semibold text-primary">
                        {relocation.new_seat}
                      </span>
                      <span className="block text-[10px] text-dm-text-muted">
                        {relocation.new_seat_type}
                      </span>
                    </div>
                  </div>

                  {/* Advertencia */}
                  {relocation.warning && (
                    <div className="flex items-start gap-1.5">
                      <ExclamationTriangleIcon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        {relocation.warning}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pie de modal — siempre visible */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 mt-4 border-t border-dm-border-secondary flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            disabled={isLoading || previewData.insufficient_capacity}
            isLoading={isLoading}
            className={`w-full sm:w-auto ${
              previewData.insufficient_capacity ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {previewData.insufficient_capacity
              ? 'Capacidad insuficiente'
              : 'Sí, continuar con el cambio'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
