// src/features/fluvial/components/seat-map/SeatSelectionVisualizer.tsx
import React from 'react';
import { SeatMap } from './SeatMap';
import { SeatMapLegend } from './SeatMapLegend';
import { SeatMapItem } from '../../../../types';

interface SeatSelectionVisualizerProps {
  tripId: number;
  selectedSeats: Set<number>;
  onSeatToggle: (seat: SeatMapItem) => void;
}

export const SeatSelectionVisualizer: React.FC<SeatSelectionVisualizerProps> = ({ tripId, selectedSeats, onSeatToggle }) => {
  return (
    <div className="mt-4 border-t pt-4">
      <div className="bg-dm-bg-primary rounded-2xl shadow-lg border border-dm-border-primary p-4">
        <div className="relative">
          {/* Contorno de la embarcación */}
          <div className="border-2 border-dashed border-dm-border-primary rounded-2xl p-4 relative">
            
            {/* Frente de la embarcación */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="w-40 h-8 border-2 border-dashed border-dm-border-primary rounded-t-2xl bg-dm-bg-primary flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-dm-text-secondary">FRENTE</span>
              </div>
            </div>
            
            {/* Mapa de asientos */}
            <div className="mt-4 bg-dm-bg-secondary p-4 rounded-lg overflow-x-auto">
              <SeatMap 
                tripId={tripId}
                vesselName="Embarcación"
                selectedSeats={selectedSeats}
                onSeatToggle={onSeatToggle}
              />
            </div>

          </div>
        </div>

        {/* Leyendas afuera y debajo del contorno principal */}
        <div className="mt-6">
            <SeatMapLegend />
        </div>
      </div>
    </div>
  );
};