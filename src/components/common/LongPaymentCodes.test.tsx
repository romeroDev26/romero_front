import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SplitPaymentForm } from './SplitPaymentForm';
import { PaymentDetailsForm } from '../../features/finance/components/payment/PaymentDetailsForm';
vi.mock('../../hooks/useYapeAssist', () => ({ useYapeAssist: () => ({ selectedPagoId: null, hasDigital: false }) }));
afterEach(cleanup);
const longCode = 'TRF20261010-' + '1234567890'.repeat(12);
describe('códigos completos en pagos', () => {
  it.each(['default', 'billing'] as const)('venta %s no corta el código principal ni el segundo', variant => {
    const onChange = vi.fn();
    render(<SplitPaymentForm variant={variant} totalAmount={100} onPaymentDataChange={onChange} initialData={{ isSplitPayment: true, paymentMethod1: 'TRF', paymentMethod2: 'YAP', amount1: 50, amount2: 50 }} />);
    const inputs = screen.getAllByPlaceholderText('Ingrese el código...');
    expect(inputs).toHaveLength(2);
    for (const input of inputs) {
      expect(input).not.toHaveAttribute('maxlength');
      fireEvent.change(input, { target: { value: longCode } });
      expect(input).toHaveValue(longCode);
    }
    const last = onChange.mock.calls.at(-1)?.[0];
    expect(last.operationCode1).toBe(longCode);
    expect(last.operationCode2).toBe(longCode);
  });
  it('cobro de encomienda conserva el código completo', () => {
    const onChange = vi.fn();
    render(<PaymentDetailsForm totalAmount={100} onDataChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'TRF' } });
    const input = screen.getByPlaceholderText('Ingrese el codigo...');
    expect(input).not.toHaveAttribute('maxlength');
    fireEvent.change(input, { target: { value: longCode } });
    expect(input).toHaveValue(longCode);
    expect(onChange.mock.calls.at(-1)?.[0].payment_operation_code).toBe(longCode);
  });
});
