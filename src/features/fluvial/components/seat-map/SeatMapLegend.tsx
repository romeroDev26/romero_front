// src/features/fluvial/components/seat-map/SeatMapLegend.tsx
import React from 'react';

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-4 h-4 ${color} rounded-md border`}></div>
    <span className="text-gray-600">{label}</span>
  </div>
);

interface SeatMapLegendProps {
  // Mostrar el estado naranja de asiento con cambio pendiente (solo en edicion de facturas)
  showPendingBlock?: boolean;
}

export const SeatMapLegend: React.FC<SeatMapLegendProps> = ({ showPendingBlock = false }) => {
  return (
    <div className="space-y-4">
        {/* Leyenda de Zonas */}
        <div className="bg-white rounded-lg p-3 shadow-sm border">
            <h3 className="font-bold text-gray-800 mb-2 text-sm">Zonas</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
                <LegendItem color="bg-green-50 border-green-200" label="Reclinable" />
                <LegendItem color="bg-yellow-50 border-yellow-200" label="Estatico" />
            </div>
        </div>
    
        {/* Leyenda de Estados */}
        <div className="bg-white rounded-lg p-3 shadow-sm border">
            <h3 className="font-bold text-gray-800 mb-2 text-sm">Estados</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <LegendItem color="bg-white border-gray-300" label="Disponible" />
                <LegendItem color="bg-blue-500 border-blue-600" label="Seleccionado" />
                <LegendItem color="bg-red-500 border-red-600" label="Ocupado" />
                <LegendItem color="bg-yellow-500 border-yellow-600" label="Reservado" />
                <LegendItem color="bg-gray-400 border-gray-500" label="Bloqueado" />
                {showPendingBlock && (
                  <LegendItem color="bg-orange-400 border-orange-500" label="Pendiente (otra asig.)" />
                )}
            </div>
        </div>
    </div>
  );
};