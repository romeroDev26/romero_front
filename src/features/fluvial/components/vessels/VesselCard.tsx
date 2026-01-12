// src/features/fluvial/components/vessels/VesselCard.tsx
import React from 'react';
import {
  PencilIcon,
  TrashIcon,
  CogIcon,
  PresentationChartBarIcon,
  UserGroupIcon,
  ArchiveBoxIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';

import { Vessel } from '../../../../types';

interface VesselCardProps {
  vessel: Vessel;
  onEdit: (vessel: Vessel) => void;
  onConfigure: (vessel: Vessel) => void;
  onDelete: (vessel: Vessel) => void;
}

const DetailItem: React.FC<{ icon: React.ElementType, label: string, value: string | number }> = ({ icon: Icon, label, value }) => {
  const IconComponent = Icon as React.ComponentType<{ className: string }>;
  return (
  <div className="flex items-center gap-2">
    <IconComponent className="h-5 w-5 text-gray-400" />
    <div>
      <span className="text-gray-600 text-xs">{label}</span>
      <p className="font-semibold text-gray-800">{value}</p>
    </div>
  </div>
  );
};

export const VesselCard: React.FC<VesselCardProps> = ({ vessel, onEdit, onConfigure, onDelete }) => {
  const totalCapacity = vessel.capacity_passengers || 0;

  // Usamos el nuevo campo del backend si está disponible, de lo contrario, usamos el cálculo local
  const configCount =
    typeof vessel.seat_configurations_count === 'number'
      ? vessel.seat_configurations_count
      : (Array.isArray(vessel.seat_configurations_count)
        ? (vessel.seat_configurations_count as unknown[]).length
        : 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between transition-shadow hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <PresentationChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">{vessel.name}</h3>
              <p className="text-sm text-gray-500">{vessel.registration_number}</p>
            </div>
          </div>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
            vessel.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {vessel.is_active ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm mt-4 pt-4 border-t border-gray-100">
          <DetailItem
            icon={UserGroupIcon}
            label="Capacidad de Asientos"
            value={totalCapacity}
          />

          <DetailItem
            icon={ScaleIcon}
            label="Peso (kg)"
            value={vessel.capacity_weight_kg?.toLocaleString() || 0}
          />

          <DetailItem
            icon={ArchiveBoxIcon}
            label="Bultos"
            value={vessel.capacity_packages || 0}
          />

          <DetailItem
            icon={CogIcon}
            label="Configuraciones"
            value={configCount}
          />
        </div>
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-start gap-4">
        <button
          onClick={() => onEdit(vessel)}
          className="text-gray-500 hover:text-blue-600 transition-colors"
          title="Editar Embarcación"
        >
          <PencilIcon className="h-5 w-5" />
        </button>
        <button
          onClick={() => onConfigure(vessel)}
          className="text-gray-500 hover:text-green-600 transition-colors"
          title="Configurar Asientos"
        >
          <CogIcon className="h-5 w-5" />
        </button>
        <button
          onClick={() => onDelete(vessel)}
          className="text-gray-500 hover:text-red-600 transition-colors"
          title="Desactivar Embarcación"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
