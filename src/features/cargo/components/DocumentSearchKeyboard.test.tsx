import { cleanup, createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecipientForm } from './RecipientForm';
import { CargoItemForm } from './CargoItemForm';
import { ClientSelector } from '../../quotations/components/ClientSelector';
import type { ProductService } from '../../../types';
const lookup = vi.hoisted(() => ({ queryDni: vi.fn(), queryRuc: vi.fn(), isQueryingDni: false, isQueryingRuc: false }));
const find = vi.hoisted(() => vi.fn().mockResolvedValue(null));
vi.mock('../../fluvial/hooks/useSunatData', () => ({ useSunatData: () => lookup }));
vi.mock('../../fluvial/hooks/useProductsServicesData', () => ({ useProductsServicesData: () => ({ data: [], isLoading: false }) }));
vi.mock('../../../components/common/ClientSearchAutocomplete', () => ({ ClientSearchAutocomplete: () => null }));
vi.mock('../../../services/clients.service', () => ({ clientsService: { findByDocument: find } }));
vi.mock('../../../services/external.service', () => ({ externalQueryService: lookup }));
vi.mock('@/utils/sileo-toast', () => ({ toast: { error: vi.fn(), warning: vi.fn(), success: vi.fn(), info: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); lookup.isQueryingDni = false; });
const product: ProductService = { id: 2, name: 'Encomienda', item_type: 'SERVICE', unit_code: 'ZZ', sale_price: 1, currency_code: 'PEN', tax_category_code: '20', is_active: true, created_at: '', updated_at: '' };
const pressEnter = (input: HTMLElement) => {
  const event = createEvent.keyDown(input, { key: 'Enter', cancelable: true });
  fireEvent(input, event);
  expect(event.defaultPrevented).toBe(true);
};
describe('Enter en las consultas de documentos restantes', () => {
  it.each([['1', '12345678', 'queryDni'], ['6', '20123456789', 'queryRuc']] as const)('consulta destinatario %s sin enviar la venta', (docType, docNumber, method) => {
    const submit = vi.fn(event => event.preventDefault());
    render(<form onSubmit={submit}><RecipientForm recipient={{ isSameAsSender: false, name: '', docType, docNumber, phone: '' }} setRecipient={vi.fn()} remitter={{ name: '', docType: '1', docNumber: '', phone: '' }} /></form>);
    pressEnter(screen.getByTitle('Número de documento del destinatario'));
    expect(lookup[method]).toHaveBeenCalledExactlyOnceWith(docNumber);
    expect(submit).not.toHaveBeenCalled();
  });
  it.each([['1', '12345678', 'queryDni'], ['6', '20123456789', 'queryRuc']] as const)('consulta destinatario por ítem %s sin agregar la encomienda', (docType, docNumber, method) => {
    const onSubmit = vi.fn();
    render(<CargoItemForm onSubmit={onSubmit} onClose={vi.fn()} existingItem={{ id: 'x', product, quantity: 1, description: 'Caja', price: 10, unitOfMeasure: 'ZZ', recipient: { isSameAsSender: false, name: '', docType, docNumber, phone: '' } }} />);
    pressEnter(screen.getByPlaceholderText(docNumber));
    expect(lookup[method]).toHaveBeenCalledExactlyOnceWith(docNumber);
    expect(onSubmit).not.toHaveBeenCalled();
  });
  it.each([['1', '12345678', 'queryDni'], ['6', '20123456789', 'queryRuc']] as const)('consulta cliente de cotización %s', async (docType, docNumber, method) => {
    const submit = vi.fn(event => event.preventDefault());
    render(<form onSubmit={submit}><ClientSelector selectedClient={null} onClientSelect={vi.fn()} /></form>);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: docType } });
    const input = screen.getByPlaceholderText('Ingrese el número');
    fireEvent.change(input, { target: { value: docNumber } });
    pressEnter(input);
    await waitFor(() => expect(lookup[method]).toHaveBeenCalledExactlyOnceWith(docNumber));
    expect(submit).not.toHaveBeenCalled();
  });
});
