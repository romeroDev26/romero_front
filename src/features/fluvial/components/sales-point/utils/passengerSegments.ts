import type { Representative } from '../core/types';
export interface PassengerSegmentSummary { key: string; origin: string; destination: string; fare: number; count: number; total: number; }
export function summarizePassengerSegments(reps: Representative[], stops: Array<{ id: number; port?: { name: string } }>, boarding: number | null, destination: number | null, fare: number): PassengerSegmentSummary[] {
  const groups = new Map<string, PassengerSegmentSummary>();
  for (const rep of reps) {
    const originId = rep.boarding_stop_id ?? boarding;
    const destinationId = rep.disembarking_stop_id ?? destination;
    const individualFare = rep.unit_price ?? fare;
    const key = `${originId}-${destinationId}-${individualFare}`;
    const group = groups.get(key) ?? { key, origin: stops.find(s => s.id === originId)?.port?.name ?? 'Embarque por elegir', destination: stops.find(s => s.id === destinationId)?.port?.name ?? 'Destino por elegir', fare: individualFare, count: 0, total: 0 };
    group.count += 1;
    group.total += individualFare;
    groups.set(key, group);
  }
  return [...groups.values()];
}
