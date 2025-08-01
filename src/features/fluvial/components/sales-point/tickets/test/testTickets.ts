// src/features/fluvial/components/sales-point/tickets/test/testTickets.ts

import { BackendInvoiceData } from '../types/backend.types';
import { downloadNormalSaleTicket, validateNormalSaleData } from '../api/ticketApi';

/**
 * Datos de ejemplo basados en el JSON REAL del backend
 * Estructura exacta para probar el sistema completo
 */
const mockRealBackendData: BackendInvoiceData = {
  // Datos principales del documento
  id: 381,
  client_id: 4,
  company_id: 1,
  document_type_code: "03",
  series: "B001",
  number: 38225,
  issue_date: "2025-07-31",
  issue_time: "20:21:06",
  operation_type_code: "0101",
  currency_code: "PEN",
  
  // Campos adicionales del documento
  ubl_version: "2.1",
  created_by: "fb408cb6-9b5e-443e-840c-072a9f825a0f",
  exchange_rate: null,
  payment_terms_description: null,
  due_date: null,
  payment_installments: null,
  detraccion_code: null,
  detraccion_percentage: null,
  related_documents: null,
  notes: null,
  
  // Totales financieros
  total_taxable: "0.00",
  total_exonerated: "205.00",
  total_unaffected: "0.00",
  total_free: "0.00",
  total_global_discount: "10.00",
  total_igv: "0.00",
  total_isc: "0.00",
  total_other_taxes: "0.00",
  total_payable: "205.00",
  total_in_words: "DOSCIENTOS CINCO CON 00/100 SOLES",
  detraccion_amount: null,
  
  // Estado SUNAT
  sunat_status: "PENDING",
  sunat_ticket: null,
  sunat_response_code: null,
  sunat_response_description: null,
  sunat_observations: null,
  
  // Archivos generados
  xml_file_path: null,
  signed_xml_file_path: null,
  zip_file_path: null,
  cdr_file_path: null,
  pdf_file_path: null,
  pdf_a4_file_path: null,
  pdf_ticket_file_path: null,
  
  // Items del documento (DATOS REALES)
  items: [
    {
      id: 400,
      invoice_id: 381,
      product_id: 1,
      item_order: 1,
      
      // Datos del producto/servicio
      product_internal_code: "SRV-PAS-001",
      product_name: "Servicio de Transporte de Pasajeros",
      item_description: "Servicio de Transporte Fluvial. Tramo: Nauta - Yurimaguas. Asiento: 75",
      
      // Cantidades y precios
      quantity: "1.0000",
      unit_code: "NIU",
      unit_price: "150.0000000000",
      price_type_code: "01",
      discount: "10.00",
      price_with_tax: "150.00",
      subtotal: "140.00",
      total_line: "140.00",
      
      // Impuestos
      tax_category_code: "20",
      igv_percentage: "0.00",
      igv_amount: "0.00",
      isc_amount: null,
      other_tax_amount: null,
      
      // Datos específicos de transporte fluvial
      trip_id: 190,
      trip_seat_id: 10141,
      boarding_trip_stop_id: 1280,
      disembarking_trip_stop_id: 1290,
      seat_number: "75",
      route_name: "Nauta - Yurimaguas",
      vehicle_name: "Romero VIII",
      boarding_port_name: "Nauta",
      disembarking_port_name: "Yurimaguas",
      
      // Datos del destinatario
      recipient_name: null,
      recipient_doc_type: null,
      recipient_doc_number: null,
      recipient_phone: null
    },
    {
      id: 401,
      invoice_id: 381,
      product_id: 7,
      item_order: 2,
      
      // Datos del producto/servicio
      product_internal_code: "SRV-EXT-001",
      product_name: "Exceso de Equipaje",
      item_description: "Equipaje extra",
      
      // Cantidades y precios
      quantity: "1.0000",
      unit_code: "NIU",
      unit_price: "65.0000000000",
      price_type_code: "01",
      discount: "0.00",
      price_with_tax: "65.00",
      subtotal: "65.00",
      total_line: "65.00",
      
      // Impuestos
      tax_category_code: "20",
      igv_percentage: "0.00",
      igv_amount: "0.00",
      isc_amount: null,
      other_tax_amount: null,
      
      // Datos específicos de transporte fluvial
      trip_id: 190,
      trip_seat_id: null,
      boarding_trip_stop_id: 1280,
      disembarking_trip_stop_id: 1290,
      seat_number: null,
      route_name: "Nauta - Yurimaguas",
      vehicle_name: "Romero VIII",
      boarding_port_name: "Nauta",
      disembarking_port_name: "Yurimaguas",
      
      // Datos del destinatario
      recipient_name: null,
      recipient_doc_type: null,
      recipient_doc_number: null,
      recipient_phone: null
    }
  ],
  
  // Entidades relacionadas (DATOS REALES)
  client: {
    id: 4,
    doc_type: "1",
    doc_number: "76307497",
    name: "WILMER ALEXANDER EDQUÉN BARBOZA",
    address_line: "",
    ubigeo: null,
    department: null,
    province: null,
    district: null,
    country_code: "PE",
    email: "test@gmail.com",
    phone: "987654321",
    is_active: true,
    created_at: "2025-07-01T19:35:26.014773Z",
    updated_at: "2025-08-01T01:21:13.842738Z"
  },
  
  company: {
    id: 1,
    ruc: "20167700277",
    business_name: "EMPRESA DE TRANSPORTES ROMERO S.R.L.",
    trade_name: "EMPRESA DE TRANSPORTES ROMERO S.R.L.",
    address: "MZA. B LOTE. 19 Z.I. ZONA INDUSTRIAL (TALARA ALTA) PIURA - TALARA - PARIÑAS",
    ubigeo: "168626",
    phone: "968574321",
    email: "romero@example.com.pe",
    logo_url: "https://romero-cdn.b-cdn.net/1/2025/07/logos/logo_romero.png",
    sunat_username: "20167700277MODDATOS",
    certificate_path: "LLAMA-PE-CERTIFICADO-DEMO-20167700277.pfx",
    beta_mode: true,
    detraccion_account: "string",
    is_active: true,
    created_at: "2025-06-09T18:56:14.940728Z",
    updated_at: "2025-07-30T22:48:29.091506Z"
  },
  
  seller: {
    id: "fb408cb6-9b5e-443e-840c-072a9f825a0f",
    email: "test@gmail.com",
    full_name: "test system",
    is_active: true,
    role_id: 1,
    role_name: "admin",
    default_branch_office_id: null,
    current_city_id: null,
    created_at: "2025-06-26T10:19:08.742356Z",
    updated_at: "2025-07-19T21:09:57.518131Z"
  },
  
  // Datos específicos de transporte fluvial
  boarding_time: "22:00:00",
  trip_departure_time: "2025-08-02T23:00:00Z",
  
  // Datos de sucursal
  branch_office_name: null,
  branch_office_address: null,
  branch_office_phone: null,
  
  // QR Code data (REAL)
  qr_code_data: "iVBORw0KGgoAAAANSUhEUgAAAZoAAAGaAQAAAAAefbjOAAAC4UlEQVR4nO2cQW7bMBBF31QCspSBHsBHkW+QIwU9Um8gHcUHCCAtDUj4XQxJKdmlaS3DHC8IK9IDRsjgz+eQtIkvf8YfX2cgoIACCiiggAJ6TsjSp4XxBIzWYhdWA1azy5wfuBwSXkD3h3pJ0gR2YTV7m1aD+UV2mV8ENJIkfYTuF15A94fmJAAa5hYNXf7vj+fFv7iCHBVeQHeD2k/XRvfeMr6+t4wnTABiPiq8gA6HpGuqFZIWGDf38AjhBfTfoawRnYAZrP8NgtWgm2R0Ewaw72Q9+DsF9A+g0czMTumP7if7a4sPsPpU46jwArq3RmwCIFiA7mb+bTwv6KNCPPw7BfQdiN2ssp8AaAQ+12hErwUNXR4kScODv1NA34FSRngydPJkkKZGGgAfPA8g9S0iI54f0kCj1IpgNbPzzeilohareaoMh4QX0N01wjOi1A9pglwwkmTQT41CI54fShmhqcnmMXsG3EdMJVXCR1QB7TVi6JSlwPNgSWoBTfiIWqDsLDd7SaMPeZBqRbKckRF1QBpYjfG8LYCmiSd0N18Sl67RoaoByj5CqWCkZc/NR5S7oRF1QOySQUp54P0IaSFNN9nmH5ERTw7tepbZMyz5Rplm9O4xm9CICqC8rjH/XKwXaDQQ8wlf3Bhf3z9voXj4dwroO9Bu9plKx0TuR3QKH1EfVKpGcZGlH+HrW9tzE+Ej6oHcPZTNlr/ON7O3Ka+C9sVyDseEF9ABHaol77fdakXJCLZmZmjEs0O7nmW2EFv3ErapR/iISqBdh+qzgVRJhl45S0IjKoF2Z7p8T+UpneBJxmFuif0RdUFb1UhDI7uUVrY3tec4wVMDtN9Vl7zjQkqB7DHTk7E/olJoflEuGKuloZPSjcPDC+gQqFfpR/hx4BYNvi7+COEFdAeo2MbxfLMsFK1fagDs7RoaUQO0P6/hLtJXOPJlX7oVcV6jDsjil8kCCiiggAIKKKC/hP4ALJG22LVkejUAAAAASUVORK5CYII=",
  
  // Metadatos
  created_at: "2025-08-01T01:21:14.201661Z",
  updated_at: "2025-08-01T01:21:14.201661Z"
};

/**
 * Función para probar la generación de tickets con datos reales
 */
export async function testRealTicketGeneration() {
  console.log('🧪 Iniciando prueba con datos REALES del backend...');
  
  try {
    // 1. Validar datos
    console.log('1️⃣ Validando datos del backend...');
    const validation = validateNormalSaleData(mockRealBackendData);
    
    if (!validation.isValid) {
      console.error('❌ Datos inválidos:', validation.errors);
      return;
    }
    console.log('✅ Datos válidos');
    
    // 2. Generar y descargar ticket
    console.log('2️⃣ Generando ticket PDF con nueva estructura...');
    await downloadNormalSaleTicket(mockRealBackendData, 'ticket_real_B001-38225.pdf');
    console.log('✅ ¡Ticket generado y descargado exitosamente!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    return false;
  }
}

/**
 * Función para obtener datos de prueba reales
 */
export function getRealMockBackendData(): BackendInvoiceData {
  return mockRealBackendData;
}

/**
 * Log de resumen de los datos
 */
export function logDataSummary() {
  console.log('📋 RESUMEN DE DATOS REALES:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📄 Documento: ${mockRealBackendData.document_type_code === '03' ? 'BOLETA' : 'FACTURA'} ${mockRealBackendData.series}-${mockRealBackendData.number}`);
  console.log(`👤 Cliente: ${mockRealBackendData.client.name}`);
  console.log(`📋 Documento: ${mockRealBackendData.client.doc_type === '1' ? 'DNI' : 'OTRO'} ${mockRealBackendData.client.doc_number}`);
  console.log(`🏢 Empresa: ${mockRealBackendData.company.business_name}`);
  console.log(`🚢 Viaje: ${mockRealBackendData.items[0].route_name} en ${mockRealBackendData.items[0].vehicle_name}`);
  console.log(`💺 Asiento: ${mockRealBackendData.items[0].seat_number}`);
  console.log(`💰 Total: S/ ${mockRealBackendData.total_payable}`);
  console.log('📦 Items:');
  mockRealBackendData.items.forEach((item, index) => {
    const discount = parseFloat(item.discount) > 0 ? ` (-S/ ${item.discount} desc)` : '';
    console.log(`  ${index + 1}. ${item.product_name}: S/ ${item.total_line}${discount}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Exportar función de prueba global
if (typeof window !== 'undefined') {
  (window as any).testRealTickets = testRealTicketGeneration;
  (window as any).getRealMockData = getRealMockBackendData;
  (window as any).logDataSummary = logDataSummary;
}
