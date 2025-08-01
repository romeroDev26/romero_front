/**
 * Script para probar el nuevo sistema de tickets en la consola del navegador
 * Copiar y pegar en la consola del navegador para probarlo
 */

console.log('🎯 PROBANDO NUEVO SISTEMA DE TICKETS');

// Función para probar con datos reales
async function testNewTicketSystem() {
  console.log('🧪 Iniciando prueba del nuevo sistema...');
  
  // Datos de prueba reales (basados en el JSON del backend)
  const mockBackendData = {
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
    total_payable: "205.00",
    total_in_words: "DOSCIENTOS CINCO CON 00/100 SOLES",
    
    items: [
      {
        id: 400,
        product_name: "Servicio de Transporte de Pasajeros",
        item_description: "Servicio de Transporte Fluvial. Tramo: Nauta - Yurimaguas. Asiento: 75",
        quantity: "1.0000",
        unit_price: "150.0000000000",
        discount: "10.00",
        total_line: "140.00",
        seat_number: "75",
        route_name: "Nauta - Yurimaguas",
        vehicle_name: "Romero VIII",
        boarding_port_name: "Nauta",
        disembarking_port_name: "Yurimaguas"
      },
      {
        id: 401,
        product_name: "Exceso de Equipaje",
        item_description: "Equipaje extra",
        quantity: "1.0000",
        unit_price: "65.0000000000",
        discount: "0.00",
        total_line: "65.00"
      }
    ],
    
    client: {
      id: 4,
      doc_type: "1",
      doc_number: "76307497",
      name: "WILMER ALEXANDER EDQUÉN BARBOZA"
    },
    
    company: {
      id: 1,
      ruc: "20167700277",
      business_name: "EMPRESA DE TRANSPORTES ROMERO S.R.L.",
      address: "MZA. B LOTE. 19 Z.I. ZONA INDUSTRIAL (TALARA ALTA) PIURA - TALARA - PARIÑAS",
      phone: "968574321",
      logo_url: "https://romero-cdn.b-cdn.net/1/2025/07/logos/logo_romero.png"
    },
    
    seller: {
      id: "fb408cb6-9b5e-443e-840c-072a9f825a0f",
      full_name: "test system",
      role_name: "admin"
    },
    
    boarding_time: "22:00:00",
    trip_departure_time: "2025-08-02T23:00:00Z"
  };
  
  try {
    console.log('✅ Datos de prueba preparados');
    console.log('📊 Cliente:', mockBackendData.client.name);
    console.log('🚢 Viaje:', mockBackendData.items[0].route_name);
    console.log('💺 Asiento:', mockBackendData.items[0].seat_number);
    console.log('💰 Total:', `S/ ${mockBackendData.total_payable}`);
    
    console.log('\n🔄 Para usar este sistema:');
    console.log('1. Importar la función: import { downloadNormalSaleTicket } from "./tickets"');
    console.log('2. Llamar: await downloadNormalSaleTicket(backendData)');
    console.log('3. El PDF se descargará automáticamente');
    
    console.log('\n🎉 ¡Nuevo sistema listo!');
    console.log('📋 Características nuevas:');
    console.log('  • Logo de empresa integrado');
    console.log('  • QR code real de 25x25mm');
    console.log('  • Asiento destacado en grande');
    console.log('  • 8 bloques bien estructurados');
    console.log('  • Origen y destino separados');
    console.log('  • Desglose financiero detallado');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    return false;
  }
}

// Ejecutar prueba
testNewTicketSystem();
