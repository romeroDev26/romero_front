// src/features/fluvial/components/seat-map/SeatMap.tsx
import React, { useMemo } from 'react';
import { useTripDetails } from '../../hooks/useTripDetails';
import { useSeatMap } from '../../hooks/useSeatMap';
import { Spinner } from '../../../../components/common/Spinner';
import { Seat } from './Seat';
import { SeatMapItem } from '../../../../types';
import { useVessel } from '../../hooks/useVesselsData';

interface SeatMapProps {
  tripId: number;
  selectedSeats: Set<number>;
  onSeatToggle: (seat: SeatMapItem) => void;
}

// Definimos un tipo para la estructura de una fila
type SeatRow = SeatMapItem[];

const getZoneColor = (seatTypeName: string): string => {
  const name = (seatTypeName || '').toLowerCase();
  if (name.includes('reclinable')) return 'bg-green-100/80 border border-green-200';
  if (name.includes('estático')) return 'bg-yellow-100/80 border border-yellow-200';
  return 'bg-gray-100/80 border border-gray-200';
};

const getZoneTitle = (seatTypeName: string): string => {
  const name = (seatTypeName || '').toLowerCase();
  if (name.includes('reclinable')) return 'ZONA RECLINABLE';
  if (name.includes('estático')) return 'ZONA ESTÁTICA';
  return 'ZONA DE ASIENTOS';
};

export const SeatMap: React.FC<SeatMapProps> = ({ tripId, selectedSeats, onSeatToggle }) => {
  const { data: tripDetails, isLoading: isLoadingTrip } = useTripDetails(tripId);
  const vesselId = tripDetails?.vessel?.id;
  const { data: vesselDetails, isLoading: isLoadingVessel } = useVessel(vesselId || null);
  const { data: seatMap = [], isLoading: isLoadingMap } = useSeatMap(tripId);

  const seatLayout = useMemo(() => {
    if (!vesselDetails?.seat_configurations || !(seatMap ?? []).length) {
      return [];
    }

    const seatsByConfigId = (seatMap ?? []).reduce((acc, seat) => {
      const configId = seat.vessel_seat_config_id;
      if (!acc[configId]) acc[configId] = [];
      acc[configId].push(seat);
      return acc;
    }, {} as Record<number, SeatMapItem[]>);

    return vesselDetails.seat_configurations
      .map(config => {
        const configSeats = seatsByConfigId[config.id] || [];
        const totalColumns = vesselDetails.total_columns || 4;
        
        // Agrupar por filas
        const rows: SeatRow[] = [];
        configSeats.forEach(seat => {
          // Ordenamos los asientos de la sección por número
          const sortedSectionSeats = [...configSeats].sort((a,b) => parseInt(a.seat_number) - parseInt(b.seat_number));
          const seatIndexInSection = sortedSectionSeats.findIndex(s => s.id === seat.id);

          const rowIndex = Math.floor(seatIndexInSection / totalColumns);
          
          if (!rows[rowIndex]) {
            rows[rowIndex] = [];
          }
          rows[rowIndex].push(seat);
        });

        // Ordenar los asientos dentro de cada fila por su número
        rows.forEach(row => {
          row.sort((a, b) => parseInt(a.seat_number) - parseInt(b.seat_number));
        });

        return {
          id: config.id,
          title: getZoneTitle(config.seat_type?.name || ''),
          level: config.deck_level,
          rows: rows,
          totalColumns: totalColumns,
          bgColor: getZoneColor(config.seat_type?.name || ''),
        };
      })
      .sort((a, b) => a.level - b.level);
  }, [vesselDetails, seatMap]);

  const isLoading = isLoadingTrip || isLoadingVessel || isLoadingMap;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }
  
  if (!seatLayout.length) {
    return <div className="text-center text-gray-500 p-8">No se pudo cargar la configuración de asientos.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Selección de Asientos</h1>
          <p className="text-gray-600 text-sm">Sistema de reserva empresarial</p>
        </div>

        {/* Bus Layout Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4">
          <div className="relative">
            {/* Bus outline with dashed border */}
            <div className="border border-dashed border-gray-400 rounded-2xl px-2 py-4 relative">
              
              {/* Front Section */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="w-32 h-8 border border-dashed border-gray-400 rounded-t-2xl bg-white flex items-center justify-center shadow-sm">
                  <span className="text-xs font-bold text-gray-700">ROMERO XXI</span>
                </div>
              </div>
              
              {/* Main Seating Area */}
              <div className="mt-2">
                <div className="space-y-2">
                  {seatLayout.map(section => (
                    <div key={section.id} className={`${section.bgColor} rounded-xl p-4 mb-4`}>
                      <div className="text-center mb-4">
                        <h3 className="text-sm font-bold text-gray-700 bg-white px-3 py-1 rounded-full shadow-sm border inline-block">
                          {section.title}
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {section.rows.map((row, rowIndex) => (
                          <div key={`${section.id}-row-${rowIndex}`} className="bg-white/40 rounded-lg p-3">
                            <div className="flex justify-center gap-6">
                              
                              {/* Lado izquierdo: Segunda mitad de la fila (C, D) ordenados 4,3 */}
                              <div className="flex gap-3">
                                {row.slice(Math.ceil(row.length / 2)).reverse().map(seat => (
                                  <Seat
                                    key={seat.id}
                                    seat={seat}
                                    isSelected={selectedSeats.has(seat.id)}
                                    onClick={onSeatToggle}
                                  />
                                ))}
                              </div>
                              
                              {/* Pasillo más ancho */}
                              {section.totalColumns > 2 && (
                                <div className="w-16 flex items-center justify-center">
                                  <div className="w-0.5 h-8 bg-gray-300 rounded-full"></div>
                                </div>
                              )}
                              
                              {/* Lado derecho: Primera mitad de la fila (B, A) ordenados 2,1 */}
                              <div className="flex gap-3">
                                {row.slice(0, Math.ceil(row.length / 2)).reverse().map(seat => (
                                  <Seat
                                    key={seat.id}
                                    seat={seat}
                                    isSelected={selectedSeats.has(seat.id)}
                                    onClick={onSeatToggle}
                                  />
                                ))}
                              </div>

                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Back of the bus */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-4 bg-white border border-dashed border-gray-400 rounded-b-xl flex items-center justify-center">
                <span className="text-xs font-bold text-gray-600">TRASERA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};