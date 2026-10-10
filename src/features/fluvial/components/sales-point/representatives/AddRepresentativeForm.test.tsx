import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { AddRepresentativeForm } from './AddRepresentativeForm';
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: [] }) }));
vi.mock('../../../../../hooks/useTripPassengerTicketCheck', () => ({ useTripPassengerTicketCheck: () => ({ loading: false, matches: [] }) }));
vi.mock('../../../../../config/api', () => ({ default: { get: vi.fn(() => new Promise(() => {})) } }));
vi.mock('@/utils/sileo-toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
afterEach(cleanup);
const stops = [{ id: 1, stop_order: 1, port: { name: 'Nauta' } }, { id: 2, stop_order: 2, port: { name: 'San Regis' } }, { id: 3, stop_order: 3, port: { name: 'San Lorenzo' } }];
const props = { onAdd: vi.fn(), onCancel: vi.fn(), existingDocuments: [], tripId: 1, usedSeatNumbers: [], selectedSeat: null, onSeatSelect: vi.fn(), representativeIndex: 0, tripStops: stops, defaultBoardingStopId: 1, defaultDisembarkingStopId: null, defaultFare: 0 };
describe('tramo personalizado opcional', () => {
  it('permite agregar antes de elegir tarifa y destino; no congela valores vacíos', () => {
    const onAdd = vi.fn();
    render(<AddRepresentativeForm {...props} onAdd={onAdd} />);
    expect(screen.queryByLabelText('Tarifa del representante')).toBeNull();
    fireEvent.change(screen.getByPlaceholderText('DNI (se consultará automáticamente)'), { target: { value: '12345678' } });
    fireEvent.change(screen.getByPlaceholderText('Nombre y apellidos del representante'), { target: { value: 'CLIENTE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar Representante' }));
    expect(onAdd).toHaveBeenCalledOnce();
    expect(onAdd.mock.calls[0][0].unit_price).toBeUndefined();
    expect(onAdd.mock.calls[0][0].disembarking_stop_id).toBeUndefined();
  });
  it('al activar la opción toma los valores generales actuales, aunque llegaron después', () => {
    const { rerender } = render(<AddRepresentativeForm {...props} />);
    rerender(<AddRepresentativeForm {...props} defaultFare={200} defaultDisembarkingStopId={3} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByLabelText('Tarifa del representante')).toHaveValue(200);
    expect(screen.getByLabelText('Desembarque del representante')).toHaveValue('3');
  });
});
