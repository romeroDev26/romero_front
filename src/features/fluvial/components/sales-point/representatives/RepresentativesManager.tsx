// src/features/fluvial/components/sales-point/representatives/RepresentativesManager.tsx
import React from 'react';
import { Users, Plus, Trash2, UserCheck } from 'lucide-react';
import { Button } from '../../../../../components/common/Button';
import { AddRepresentativeForm } from './AddRepresentativeForm';
import { InfantManager } from '../infants';
import { Infant } from '../core/types';

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
  infants?: Infant[]; // ← Infantes a cargo
}

interface RepresentativesManagerProps {
  tripStops?: Array<{ id: number; stop_order: number; port?: { name: string } }>;
  defaultBoardingStopId?: number | null;
  defaultDisembarkingStopId?: number | null;
  defaultFare?: number;

  representatives: Representative[];
  onAddRepresentative: (representative: Representative) => void;
  onRemoveRepresentative: (index: number) => void;
  showAddForm: boolean;
  onShowAddFormChange: (show: boolean) => void;
  isReserving: boolean;
  existingDocuments: string[];
  tripId: number;
  usedSeatNumbers: string[];
  selectedSeatForRepresentative: any;
  onSeatSelectForRepresentative: (seat: any) => void;
  onSeatReserve: (seatNumber: string, representativeIndex: number) => Promise<boolean>;
  onSeatRelease: (representativeIndex: number) => void;
  getReservedSeatNumbers: () => string[];
  /** Actualiza la lista de infantes de un representante por índice */
  onUpdateRepresentativeInfants: (repIndex: number, infants: Infant[]) => void;
}

export const RepresentativesManager: React.FC<RepresentativesManagerProps> = ({
  representatives,
  onAddRepresentative,
  onRemoveRepresentative,
  showAddForm,
  onShowAddFormChange,
  isReserving,
  existingDocuments,
  tripId,
  usedSeatNumbers,
  selectedSeatForRepresentative,
  onSeatSelectForRepresentative,
  onSeatReserve,
  onSeatRelease,
  getReservedSeatNumbers,
  onUpdateRepresentativeInfants,
  tripStops = [], defaultBoardingStopId, defaultDisembarkingStopId, defaultFare,
}) => {
  const handleAddRepresentative = (representative: Representative) => {
    onAddRepresentative(representative);
    onShowAddFormChange(false);
  };

  const handleCancelAdd = () => {
    onShowAddFormChange(false);
  };

  return (
    <div className="rounded-xl border border-dm-border-primary bg-dm-bg-primary shadow-sm">
      {/* Header */}
      <div className="border-b border-dm-border-primary px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 dark:bg-blue-900/40 p-2">
              <Users className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-dm-text-primary sm:text-lg">
                Gestión de Representantes
              </h3>
              <p className="text-xs text-dm-text-secondary sm:text-sm">
                Administre los representantes empresariales para esta factura
              </p>
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className="rounded-full bg-dm-bg-secondary px-3 py-1 text-xs font-semibold text-dm-text-secondary sm:text-sm">
              {representatives.length} registrados
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 p-4 sm:p-5">
        {/* Representatives List */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-dm-text-secondary" />
              <h4 className="text-sm font-semibold text-dm-text-primary">
                Representantes Registrados
              </h4>
              <span className="text-xs text-dm-text-secondary">
                ({representatives.length} registrados)
              </span>
            </div>
            <Button
              onClick={() => onShowAddFormChange(true)}
              size="sm"
              className="bg-primary text-white hover:bg-primary-dark"
              disabled={isReserving || showAddForm}
            >
              <Plus className="h-4 w-4 mr-1" />
              {isReserving ? 'Reservando...' : showAddForm ? 'Agregando...' : 'Agregar Representante'}
            </Button>
          </div>

          {/* Representatives Cards */}
          {representatives.length > 0 ? (
            <div className="grid gap-3">
              {representatives.map((rep, index) => (
                <div key={index} className="rounded-lg border border-dm-border-primary bg-dm-bg-primary p-3 transition-shadow hover:shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-dm-text-primary">
                            {rep.name}
                          </h5>
                          <p className="text-xs text-dm-text-secondary">
                            {rep.document_type}: {rep.document_number}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs text-dm-text-secondary">
                        {rep.phone && (
                          <span>Teléfono: {rep.phone}</span>
                        )}
                        {rep.email && (
                          <span>Email: {rep.email}</span>
                        )}
                        <span className="inline-flex items-center rounded-full bg-rose-50 dark:bg-rose-950/30 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400">
                          {rep.seat_number === "Elección libre" ? (
                            "Elección libre"
                          ) : (
                            `Asiento ${rep.seat_number}`
                          )}
                        </span>
                      </div>
                      
                      {rep.boarding_stop_id && (
                        <p className="mt-2 text-xs font-medium text-dm-text-primary">
                          {tripStops.find(s => s.id === rep.boarding_stop_id)?.port?.name} → {tripStops.find(s => s.id === rep.disembarking_stop_id)?.port?.name} · Tarifa: {rep.unit_price?.toFixed(2)}
                        </p>
                      )}
                      {/* ← NUEVO: Mostrar notas especiales si existen */}
                      {rep.item_description && (
                        <div className="mt-2 rounded-md border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/30 p-2">
                          <div className="mb-1 text-xs font-medium text-blue-700 dark:text-blue-300">Descripción del ítem:</div>
                          <div className="text-xs text-dm-text-primary">{rep.item_description}</div>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => onRemoveRepresentative(index)}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-600 dark:text-red-400 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Infantes a cargo del representante */}
                  <InfantManager
                    infants={rep.infants || []}
                    responsibleName={rep.name}
                    onAdd={(infant) =>
                      onUpdateRepresentativeInfants(index, [
                        ...(rep.infants || []),
                        infant,
                      ])
                    }
                    onRemove={(infantIdx) =>
                      onUpdateRepresentativeInfants(
                        index,
                        (rep.infants || []).filter((_infant: Infant, i: number) => i !== infantIdx)
                      )
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-dm-border-secondary bg-dm-bg-secondary py-7 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-dm-text-muted" />
              <p className="text-sm text-dm-text-secondary">
                No hay representantes registrados
              </p>
              <p className="mt-2 text-xs text-dm-text-muted">
                Use el botón "Agregar Representante" para comenzar
              </p>
            </div>
          )}
        </div>

        {/* Add Representative Form */}
        {showAddForm && (
          <div className="border-t border-dm-border-primary pt-4">
            <div className="mb-3 rounded-lg border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/30 p-3">
              <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
                <Plus className="h-4 w-4" />
                <span className="font-medium">Agregando nuevo representante</span>
              </div>
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                Complete los datos del representante y seleccione su asiento en el mapa
              </p>
            </div>
            
            <AddRepresentativeForm
              tripStops={tripStops}
              defaultBoardingStopId={defaultBoardingStopId}
              defaultDisembarkingStopId={defaultDisembarkingStopId}
              defaultFare={defaultFare}
              onAdd={handleAddRepresentative}
              onCancel={handleCancelAdd}
              existingDocuments={existingDocuments}
              tripId={tripId}
              usedSeatNumbers={[...usedSeatNumbers, ...getReservedSeatNumbers()]}
              selectedSeat={selectedSeatForRepresentative}
              onSeatSelect={onSeatSelectForRepresentative}
              representativeIndex={representatives.length}
              onSeatReserve={onSeatReserve}
              onSeatRelease={onSeatRelease}
            />
          </div>
        )}
      </div>
    </div>
  );
};
