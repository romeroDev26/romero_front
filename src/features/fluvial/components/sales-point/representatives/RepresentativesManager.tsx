// src/features/fluvial/components/sales-point/representatives/RepresentativesManager.tsx
import React from 'react';
import { Users, Plus, Trash2, UserCheck, Settings, FileText } from 'lucide-react';
import { Button } from '../../../../../components/common/Button';
import { AddRepresentativeForm } from './AddRepresentativeForm';
import { PassengerQuantitySelector } from './PassengerQuantitySelector';

interface Representative {
  document_type: string;
  document_number: string;
  name: string;
  phone: string;
  email?: string; // ← NUEVO: Campo email
  seat_number?: string;
  special_notes?: string; // ← NUEVO: Campo notas especiales
}

interface RepresentativesManagerProps {
  representatives: Representative[];
  maxPassengers: number;
  onMaxPassengersChange: (quantity: number) => void;
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
}

export const RepresentativesManager: React.FC<RepresentativesManagerProps> = ({
  representatives,
  maxPassengers,
  onMaxPassengersChange,
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
}) => {
  const handleAddRepresentative = (representative: Representative) => {
    onAddRepresentative(representative);
    onShowAddFormChange(false);
  };

  const handleCancelAdd = () => {
    onShowAddFormChange(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Gestión de Representantes
              </h3>
              <p className="text-sm text-gray-500">
                Administre los representantes empresariales para esta factura
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
              {representatives.length} de {maxPassengers}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Instructions Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="p-1 bg-blue-100 rounded">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Sistema de Facturación Empresarial
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-blue-800">
                <div className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Configure la cantidad de pasajes a facturar</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Agregue los datos de cada representante</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Asigne asientos si es necesario</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span>Proceda con la facturación empresarial</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quantity Selector */}
        {representatives.length < maxPassengers && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Settings className="h-5 w-5 text-gray-600" />
              <h4 className="text-sm font-medium text-gray-900">
                Configuración de Pasajes
              </h4>
            </div>
            <PassengerQuantitySelector
              quantity={maxPassengers}
              onQuantityChange={onMaxPassengersChange}
              disabled={false}
            />
          </div>
        )}

        {/* Representatives List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-gray-600" />
              <h4 className="text-sm font-medium text-gray-900">
                Representantes Registrados
              </h4>
              <span className="text-xs text-gray-500">
                ({representatives.length} registrados)
              </span>
            </div>
            {representatives.length < maxPassengers && (
              <Button
                onClick={() => onShowAddFormChange(true)}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isReserving || showAddForm}
              >
                <Plus className="h-4 w-4 mr-1" />
                {isReserving ? 'Reservando...' : showAddForm ? 'Agregando...' : 'Agregar Representante'}
              </Button>
            )}
          </div>

          {/* Representatives Cards */}
          {representatives.length > 0 ? (
            <div className="grid gap-3">
              {representatives.map((rep, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-900">
                            {rep.name}
                          </h5>
                          <p className="text-xs text-gray-500">
                            {rep.document_type}: {rep.document_number}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                        <span>Teléfono: {rep.phone}</span>
                        {rep.email && (
                          <span>Email: {rep.email}</span>
                        )}
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {rep.seat_number === "Elección libre" ? (
                            "Elección libre"
                          ) : (
                            `Asiento ${rep.seat_number}`
                          )}
                        </span>
                      </div>
                      
                      {/* ← NUEVO: Mostrar notas especiales si existen */}
                      {rep.special_notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-md">
                          <div className="text-xs text-gray-500 font-medium mb-1">Notas especiales:</div>
                          <div className="text-xs text-gray-700">{rep.special_notes}</div>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => onRemoveRepresentative(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                No hay representantes registrados
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Use el botón "Agregar Representante" para comenzar
              </p>
            </div>
          )}
        </div>

        {/* Add Representative Form */}
        {showAddForm && (
          <div className="border-t border-gray-200 pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 text-sm text-blue-800">
                <Plus className="h-4 w-4" />
                <span className="font-medium">Agregando nuevo representante</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Complete los datos del representante y seleccione su asiento en el mapa
              </p>
            </div>
            
            <AddRepresentativeForm
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
