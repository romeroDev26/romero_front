// src/utils/exportToExcel.ts
import * as XLSX from 'xlsx';
import { SellerDetailedReportResponse } from '../types/sellerDetailedReport';

export const exportSellerStatsToExcel = (
  data: SellerDetailedReportResponse,
  sellerName: string,
  startDate: string,
  endDate: string
) => {
  const workbook = XLSX.utils.book_new();

  // Hoja 1: Resumen
  const summary = [
    ['Reporte de Ventas Detallado'],
    ['Vendedor:', sellerName],
    ['Período:', `${startDate} - ${endDate}`],
    ['Generado:', new Date().toLocaleString()],
    [],
    ['Total de Facturas:', data.invoices.length],
    [
      'Total de Ingresos:',
      data.invoices.reduce((sum: number, inv) => sum + inv.total, 0).toFixed(2),
    ],
    [],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summary);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  // Hoja 2: Facturas
  const invoicesData = data.invoices.map((inv) => ({
    'ID Factura': inv.invoice_id,
    'Tipo Documento': inv.document_type,
    Serie: inv.series,
    Correlativo: inv.correlative,
    'Fecha Emisión': new Date(inv.issue_date).toLocaleDateString(),
    Cliente: inv.client_name,
    'Tipo Doc Cliente': inv.client_doc_type,
    'Nro Doc Cliente': inv.client_document_number,
    Sucursal: inv.branch_office_name,
    Moneda: inv.currency,
    'Método Pago': inv.payment_method,
    Subtotal: inv.subtotal.toFixed(2),
    IGV: inv.igv.toFixed(2),
    Total: inv.total.toFixed(2),
    'Estado SUNAT': inv.sunat_status,
  }));

  const invoicesSheet = XLSX.utils.json_to_sheet(invoicesData);
  XLSX.utils.book_append_sheet(workbook, invoicesSheet, 'Facturas');

  // Hoja 3: Detalle de Ítems
  const itemsData: any[] = [];
  data.invoices.forEach((inv) => {
    inv.items.forEach((item) => {
      itemsData.push({
        'ID Factura': inv.invoice_id,
        'Serie-Correlativo': `${inv.series}-${inv.correlative}`,
        'Producto/Servicio': item.product_name,
        Categoría: item.service_category,
        Cantidad: item.quantity,
        'Precio Unitario': item.unit_price.toString(),
        Descuento: item.discount_amount.toString(),
        Subtotal: item.subtotal.toString(),
        IGV: item.tax_amount.toString(),
        Total: item.total_amount.toString(),
        'Nro Asiento': item.trip_info?.seat_number || '',
        Embarcación: item.trip_info?.vessel_name || '',
        Ruta: item.trip_info?.route_name || '',
        'Puerto Origen': item.trip_info?.origin_port || '',
        'Puerto Destino': item.trip_info?.destination_port || '',
        'Fecha Viaje': item.trip_info?.trip_date || '',
      });
    });
  });

  const itemsSheet = XLSX.utils.json_to_sheet(itemsData);
  XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Detalle Items');

  // Hoja 4: Representantes (si hay)
  const representativesData: any[] = [];
  data.invoices.forEach((inv) => {
    if (inv.representatives && inv.representatives.length > 0) {
      inv.representatives.forEach((rep) => {
        representativesData.push({
          'ID Factura': inv.invoice_id,
          'Serie-Correlativo': `${inv.series}-${inv.correlative}`,
          Nombre: rep.name,
          'Tipo Doc': rep.doc_type,
          'Nro Doc': rep.doc_number,
          Teléfono: rep.phone || '',
          Email: rep.email || '',
          'Nro Asiento': rep.trip_info?.seat_number || '',
          Embarcación: rep.trip_info?.vessel_name || '',
          'Fecha Viaje': rep.trip_info?.trip_date || '',
        });
      });
    }
  });

  if (representativesData.length > 0) {
    const repsSheet = XLSX.utils.json_to_sheet(representativesData);
    XLSX.utils.book_append_sheet(workbook, repsSheet, 'Representantes');
  }

  // Descargar archivo
  const fileName = `Estadisticas_${sellerName.replace(/\s+/g, '_')}_${startDate}_${endDate}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
