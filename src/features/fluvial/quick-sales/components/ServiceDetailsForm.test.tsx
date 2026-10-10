import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ServiceDetailsForm } from './ServiceDetailsForm';
import { ProductService } from '../../../../types';

afterEach(cleanup);
const product = { id: 5, name: 'Cargo por reprogramación de pasaje', internal_code: 'REPROGRAMACION', sale_price: 1, tax_category_code: '20' } as ProductService;
const props = { selectedProduct: product, quantity: 1, customPrice: '', description: '', isIgvGravado: false, onQuantityChange: vi.fn(), onCustomPriceChange: vi.fn(), onDescriptionChange: vi.fn(), onIgvGravadoChange: vi.fn() };
describe('Cargo por reprogramación en Venta Rápida', () => {
  it('solicita el monto autorizado sin precargar el precio referencial y mantiene exoneración', () => {
    render(<ServiceDetailsForm {...props} />);
    expect(screen.getByPlaceholderText('0.00')).toHaveValue(null);
    expect(screen.getByText(/Ingresa el monto autorizado del cargo/)).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeDisabled();
    fireEvent.click(screen.getByRole('switch'));
    expect(props.onIgvGravadoChange).not.toHaveBeenCalled();
  });
  it('conserva el control de IGV de los otros servicios', () => {
    render(<ServiceDetailsForm {...props} selectedProduct={{ ...product, internal_code: 'SRV-EXT-001' }} />);
    expect(screen.getByRole('switch')).not.toBeDisabled();
  });
});
