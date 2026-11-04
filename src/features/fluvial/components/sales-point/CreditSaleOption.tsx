interface Props {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function CreditSaleOption({ checked, disabled, onChange }: Props) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-dm-border-primary p-3">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} className="mt-1 h-4 w-4 rounded text-primary focus:ring-primary" />
      <span><span className="block font-medium text-dm-text-primary">Venta al crédito</span><span className="text-sm text-dm-text-muted">Se cobra después. El ticket mostrará DEBE y quedará en Cuentas por cobrar.</span></span>
    </label>
  );
}
