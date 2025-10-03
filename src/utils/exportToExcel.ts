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
    ['Total de Facturas:', data.items.length],
    [
      'Total de Ingresos:',
      data.items.reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0).toFixed(2),
    ],
    [],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summary);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  // Hoja 2: Facturas
  const invoicesData = data.items.map((inv) => ({
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
    Subtotal: parseFloat(inv.total_subtotal || '0').toFixed(2),
    IGV: parseFloat(inv.total_tax || '0').toFixed(2),
    Total: parseFloat(inv.total_amount || '0').toFixed(2),
    'Estado SUNAT': inv.sunat_status,
  }));

  const invoicesSheet = XLSX.utils.json_to_sheet(invoicesData);
  XLSX.utils.book_append_sheet(workbook, invoicesSheet, 'Facturas');

  // Hoja 3: Detalle de Ítems
  const itemsData: any[] = [];
  data.items.forEach((inv) => {
    inv.items.forEach((item) => {
      itemsData.push({
        'ID Factura': inv.invoice_id,
        'Serie-Correlativo': `${inv.series}-${inv.correlative}`,
        'Producto/Servicio': item.product_name,
        Categoría: item.service_category,
        Cantidad: item.quantity,
        'Precio Unitario': parseFloat(item.unit_price || '0').toFixed(2),
        Descuento: parseFloat(item.discount_amount || '0').toFixed(2),
        Subtotal: parseFloat(item.subtotal || '0').toFixed(2),
        IGV: parseFloat(item.tax_amount || '0').toFixed(2),
        Total: parseFloat(item.total_amount || '0').toFixed(2),
        'Nro Asiento': item.seat_number || '',
        Embarcación: item.vessel_name || '',
        Ruta: item.route_name || '',
        'Puerto Origen': item.origin_port || '',
        'Puerto Destino': item.destination_port || '',
        'Fecha Viaje': item.trip_date || '',
      });
    });
  });

  const itemsSheet = XLSX.utils.json_to_sheet(itemsData);
  XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Detalle Items');

  // Hoja 4: Representantes (si hay)
  const representativesData: any[] = [];
  data.items.forEach((inv) => {
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
          'Nro Asiento': rep.seat_number || '',
          Embarcación: rep.vessel_name || '',
          'Fecha Viaje': rep.trip_date || '',
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
