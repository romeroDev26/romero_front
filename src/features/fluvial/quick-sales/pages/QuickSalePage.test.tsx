import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuickSalePage } from './QuickSalePage';

const mocks = vi.hoisted(() => ({
  branches: [{ id: 1, name: 'NAUTA' }],
  products: [{ id: 15, name: 'Cargo por reprogramación de pasaje', internal_code: 'SRV-REP-001', unit_code: 'ZZ' }],
  create: vi.fn(), client: vi.fn(), getById: vi.fn(),
  series: { availableBoletaSeries: [{ id: 1, series_code: 'B004' }], availableFacturaSeries: [{ id: 2, series_code: 'F004' }], isLoading: false },
}));
vi.mock('../../../../services/mobileInvoices.service', () => ({ mobileInvoicesService: { create: mocks.create } }));
vi.mock('../../../../services/invoices.service', () => ({ invoicesService: { getById: mocks.getById } }));
vi.mock('../../../../hooks/useCompanyInfo', () => ({ useCompanyInfo: () => ({ data: { id: 1 } }) }));
vi.mock('../../../../hooks/useBranchOffices', () => ({ useBranchOffices: () => ({ data: mocks.branches, isLoading: false }) }));
vi.mock('../../hooks/useDocumentSeriesForBranch', () => ({ useDocumentSeriesForBranch: () => mocks.series }));
vi.mock('../../hooks/useClientManager', () => ({ useClientManager: () => ({ findOrCreateClient: mocks.client, isProcessingClient: false }) }));
vi.mock('../hooks/useProducts', () => ({ useProducts: () => ({ data: mocks.products, isLoading: false }) }));
vi.mock('../hooks/useRouteHistory', () => ({ useRouteHistory: () => ({ saveRoute: vi.fn(), getOriginSuggestions: () => [], getDestinationSuggestions: () => [] }) }));
vi.mock('@/utils/sileo-toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('../../components/sales-point/TicketPreviewModal', () => ({ TicketPreviewModal: () => <p>Ticket listo</p> }));
vi.mock('../../components/sales-point/PassengerDataForm', () => ({ PassengerDataForm: ({ setPassengerData }: { setPassengerData: (v: object) => void }) => <button onClick={() => setPassengerData({docType:'6',docNumber:'20123456789',name:'Empresa',phone:'',email:'',address:''})}>Usar RUC</button> }));
vi.mock('../components', () => ({
  ServiceSelector: ({ onSelectProduct }: { onSelectProduct: (v: object) => void }) => <button onClick={() => onSelectProduct(mocks.products[0])}>Elegir servicio</button>,
  RouteSection: () => null,
  ServiceDetailsForm: ({ onCustomPriceChange }: { onCustomPriceChange: (v: string) => void }) => <input aria-label="Precio" onChange={e => onCustomPriceChange(e.target.value)} />,
}));
vi.mock('../../../../components/common/SplitPaymentForm', () => ({ SplitPaymentForm: ({ onPaymentDataChange, onValidationChange }: { onPaymentDataChange: (v: object) => void; onValidationChange: (v: boolean) => void }) => <button onClick={() => { onPaymentDataChange({isSplitPayment:true,paymentMethod1:'YAP',operationCode1:'stale',amount1:1,paymentMethod2:'EFE',operationCode2:'',amount2:0,pagoYapeId:'stale-yape'}); onValidationChange(false); }}>Pago dividido inválido</button> }));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('selectedSalesBranch', JSON.stringify(mocks.branches[0]));
  mocks.create.mockResolvedValue({ invoice_id: 99 });
  mocks.client.mockResolvedValue({ id: 2 });
  mocks.getById.mockResolvedValue({ id: 99 });
});
afterEach(cleanup);

it.each(['03', '01'])('permite venta rápida al crédito de tipo %s sin enviar pagos previos', async type => {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><QuickSalePage /></QueryClientProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Elegir servicio' }));
  fireEvent.change(screen.getByLabelText('Precio'), { target: { value: '60' } });
  if (type === '01') fireEvent.click(screen.getByRole('button', { name: 'Usar RUC' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pago dividido inválido' }));
  expect(screen.getByRole('button', { name: 'Confirmar Venta' })).toBeDisabled();
  fireEvent.click(screen.getByRole('switch', { name: 'Venta al crédito' }));
  fireEvent.click(screen.getByRole('button', { name: 'Emitir al crédito' }));
  expect(screen.getByText(/Se emitirá al crédito/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Sí, Confirmar Venta' }));
  await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
  const payload = mocks.create.mock.calls[0][0];
  expect(payload).toMatchObject({ is_credit_sale: true, document_type_code: type });
  for (const key of ['payment_method_code','payment_operation_code','payment_amount_1','payment_method_code_2','payment_amount_2','pago_yape_id']) expect(payload[key]).toBeUndefined();
  expect(payload.items[0].product_id).toBe(15);
});
