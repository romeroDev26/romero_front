import { render, screen, fireEvent, createEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { PassengerDataForm } from './PassengerDataForm';

const lookup = vi.hoisted(() => ({ queryDni: vi.fn(), queryRuc: vi.fn(), isQueryingDni: false, isQueryingRuc: false }));
vi.mock('../../hooks/useSunatData', () => ({ useSunatData: () => lookup }));
vi.mock('../../../../hooks/useTripPassengerTicketCheck', () => ({ useTripPassengerTicketCheck: () => ({ loading: false, matches: [] }) }));
vi.mock('../../../../components/common/ClientSearchAutocomplete', () => ({ ClientSearchAutocomplete: () => null }));
vi.mock('./CountrySelector', () => ({ default: () => null }));

afterEach(() => { cleanup(); vi.clearAllMocks(); lookup.isQueryingDni = false; });
const passenger = { docType: '1', docNumber: '12345678', name: '', address: '', phone: '', email: '' };

describe('búsqueda del pasajero con Enter', () => {
  it.each([['1', '12345678', 'queryDni'], ['6', '20123456789', 'queryRuc']] as const)('consulta documento %s sin enviar la venta', (docType, docNumber, method) => {
    const submit = vi.fn(event => event.preventDefault());
    render(<form onSubmit={submit}><PassengerDataForm passengerData={{ ...passenger, docType, docNumber }} setPassengerData={vi.fn()} /></form>);
    const input = screen.getByPlaceholderText('Ingrese el número');
    const event = createEvent.keyDown(input, { key: 'Enter', code: 'Enter', cancelable: true });
    fireEvent(input, event);
    expect(event.defaultPrevented).toBe(true);
    expect(lookup[method]).toHaveBeenCalledExactlyOnceWith(docNumber);
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Buscar por número de documento' })).toHaveAttribute('type', 'button');
  });
  it('no repite la consulta mientras carga ni al mantener Enter presionado', () => {
    lookup.isQueryingDni = true;
    const { rerender } = render(<PassengerDataForm passengerData={passenger} setPassengerData={vi.fn()} />);
    fireEvent.keyDown(screen.getByPlaceholderText('Ingrese el número'), { key: 'Enter' });
    expect(lookup.queryDni).not.toHaveBeenCalled();
    lookup.isQueryingDni = false;
    rerender(<PassengerDataForm passengerData={passenger} setPassengerData={vi.fn()} />);
    fireEvent.keyDown(screen.getByPlaceholderText('Ingrese el número'), { key: 'Enter', repeat: true });
    expect(lookup.queryDni).not.toHaveBeenCalled();
  });
});
