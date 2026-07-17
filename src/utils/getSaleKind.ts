// src/utils/getSaleKind.ts

export type SaleKind = 'pasaje' | 'encomienda' | 'otro';

/**
 * Forma estructural mínima de un item para clasificar la venta.
 * Compatible con InvoiceItem (GET detalle, tipos opcionales) y
 * BackendInvoiceItem (respuesta del POST de creación).
 */
interface SaleKindItem {
  parcel_number?: string | number | null;
  product_name?: string | null;
  item_description?: string | null;
  seat_number?: string | null;
  route_name?: string | null;
}

interface SaleKindSource {
  items?: SaleKindItem[];
}

/**
 * Clasifica una venta según sus items.
 *
 * Centraliza la heurística que estaba duplicada en InvoiceDetailPage y
 * TicketPreviewModal:
 * - 'encomienda': algún item tiene parcel_number o su nombre/descripción
 *   incluye 'encomienda'.
 * - 'pasaje': algún item tiene seat_number o route_name.
 * - 'otro': cualquier otro caso.
 *
 * Nota: el chequeo de sticker PDF (pdf_sticker_100x100_file_path) NO es un
 * item, por lo que se mantiene en los call-sites que ya lo tenían, para
 * conservar exactamente el mismo resultado que la heurística original.
 */
export const getSaleKind = (invoice: SaleKindSource): SaleKind => {
  const items = invoice.items ?? [];

  const isEncomienda = items.some((item) =>
    item.parcel_number != null ||
    item.product_name?.toLowerCase().includes('encomienda') ||
    item.item_description?.toLowerCase().includes('encomienda')
  );
  if (isEncomienda) return 'encomienda';

  const isPasaje = items.some((item) =>
    item.seat_number != null || item.route_name != null
  );
  if (isPasaje) return 'pasaje';

  return 'otro';
};
