/** Reglas alineadas con `authorize_invoice` en romero_api (vendedor = solo sus ventas). */
export function canReprogramInvoice(
  user: { id?: string; role_name?: string } | null | undefined,
  invoice: { created_by?: string; seller?: { id?: string } } | null | undefined,
): boolean {
  if (!user || !invoice) return false;
  const role = (user.role_name || '').toLowerCase();
  if (!['admin', 'supervisor', 'sales', 'seller'].includes(role)) return false;
  if (role === 'admin' || role === 'supervisor') return true;
  const ownerId = invoice.created_by || invoice.seller?.id;
  if (!ownerId) return false;
  return String(ownerId) === String(user.id);
}

export function reprogrammingAccessMessage(
  user: { id?: string; role_name?: string } | null | undefined,
  invoice: { created_by?: string; seller?: { id?: string }; series?: string; number?: number } | null | undefined,
): string | null {
  if (!user || !invoice) return null;
  if (canReprogramInvoice(user, invoice)) return null;
  const role = (user.role_name || '').toLowerCase();
  if (!['sales', 'seller'].includes(role)) return null;
  const label = invoice.series && invoice.number != null ? `${invoice.series}-${invoice.number}` : 'esta boleta';
  const ownerId = invoice.created_by || invoice.seller?.id;
  if (!ownerId) {
    return `No puedes reprogramar ${label}: no tiene vendedor registrado. Pide a un supervisor o administrador.`;
  }
  return `No puedes reprogramar ${label} porque la emitió otra cajera. Pide a un supervisor o administrador.`;
}
