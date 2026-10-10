import { describe, it, expect } from 'vitest';
import { summarizePassengerSegments } from './passengerSegments';
import type { Representative } from '../core/types';
const stops = [{ id: 1, port: { name: 'Nauta' } }, { id: 2, port: { name: 'San Regis' } }, { id: 3, port: { name: 'San Lorenzo' } }];
describe('representantes con tramo general o propio', () => {
  it('los agregados antes del destino heredan luego el tramo y la tarifa general actual', () => {
    const reps = [{} as Representative, {} as Representative];
    expect(summarizePassengerSegments(reps, stops, 1, null, 0)[0].destination).toBe('Destino por elegir');
    expect(summarizePassengerSegments(reps, stops, 1, 3, 200)[0]).toMatchObject({ origin: 'Nauta', destination: 'San Lorenzo', count: 2, total: 400 });
    expect(summarizePassengerSegments(reps, stops, 1, 3, 190)[0].total).toBe(380);
  });
  it('la tarifa propia no cambia al editar la general y se separa en el resumen', () => {
    const reps = [{} as Representative, { boarding_stop_id: 2, disembarking_stop_id: 3, unit_price: 180 } as Representative];
    expect(summarizePassengerSegments(reps, stops, 1, 3, 200).map(g => g.total)).toEqual([200, 180]);
    expect(summarizePassengerSegments(reps, stops, 1, 3, 190).map(g => g.total)).toEqual([190, 180]);
  });
});
