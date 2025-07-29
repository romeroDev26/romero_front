{
  "_descripcion": "Ejemplo JSON COMPLETO para company-with-representatives-extended",
  "_endpoint": "POST /invoices/company-with-representatives-extended",
  "_nota": "Todos los campos marcados como OPCIONAL pueden omitirse. Los AUTOMATICOS se calculan pero puedes enviarlos para mayor control.",
  
  "ejemplo_json": {
    
    "// ========== CAMPOS OBLIGATORIOS (siempre requeridos) ==========": "",
    
    "company_data": {
      "client_doc_type": "6",
      "client_doc_number": "20123456789",
      "client_name": "EMPRESA TRANSPORTES SAC",
      "client_address": "AV. PRINCIPAL 123, LIMA",
      "client_email": "facturacion@empresa.com",
      "client_phone": "+51987654321"
    },
    
    "trip_id": 45,
    "boarding_stop_id": 12,
    "disembarking_stop_id": 18,
    
    "representatives": [
      {
        "passenger_name": "JUAN CARLOS RODRIGUEZ LOPEZ",
        "passenger_doc_type": "1",
        "passenger_doc_number": "12345678",
        "passenger_phone": "+51987654321",
        "passenger_email": "juan.rodriguez@empresa.com",
        "seat_number": "A1",
        "special_notes": "Ejecutivo principal"
      },
      {
        "passenger_name": "MARIA ELENA GARCIA TORRES",
        "passenger_doc_type": "1",
        "passenger_doc_number": "87654321",
        "passenger_phone": "+51912345678",
        "passenger_email": "maria.garcia@empresa.com",
        "seat_number": "A2",
        "special_notes": "Asistente ejecutiva"
      }
    ],
    
    "// ========== CAMPOS OPCIONALES (nuevas capacidades) ==========": "",
    
    "invoice_config": {
      "_descripcion": "OPCIONAL: Configuración de la factura. Si no se envía, usa valores automáticos del sistema.",
      
      "document_type_code": "01",
      "_document_type_code_nota": "AUTOMATICO pero controlable. Por defecto: 01 (Factura). Opciones: 01=Factura, 03=Boleta",
      
      "operation_type_code": "0101",
      "_operation_type_code_nota": "AUTOMATICO pero controlable. Por defecto: 0101 (Venta interna)",
      
      "currency_code": "PEN",
      "_currency_code_nota": "AUTOMATICO pero controlable. Por defecto: PEN. Opciones: PEN, USD, EUR",
      
      "exchange_rate": "3.750",
      "_exchange_rate_nota": "OPCIONAL. Solo requerido si currency_code != PEN. Tipo de cambio del día.",
      
      "issue_time": "14:30:00",
      "_issue_time_nota": "AUTOMATICO pero controlable. Por defecto: hora actual. Formato: HH:MM:SS",
      
      "payment_terms_description": "Crédito a 30 días",
      "_payment_terms_description_nota": "AUTOMATICO pero controlable. Por defecto: 'Contado'",
      
      "due_date": "2024-01-19",
      "_due_date_nota": "OPCIONAL. Fecha de vencimiento. Formato: YYYY-MM-DD",
      
      "detraccion_code": "027",
      "_detraccion_code_nota": "OPCIONAL. Código de detracción SUNAT. 027 = Transporte de personas",
      
      "detraccion_percentage": "4.00",
      "_detraccion_percentage_nota": "OPCIONAL. Porcentaje de detracción (0-100). Requerido si detraccion_code se especifica."
    },
    
    "item_config": {
      "_descripcion": "OPCIONAL: Configuración del item/producto. Si no se envía, usa configuración automática del producto.",
      
      "unit_price": "55.00",
      "_unit_price_nota": "AUTOMATICO pero controlable. Por defecto: precio del producto en BD. Precio sin IGV por pasajero.",
      
      "discount": "3.00",
      "_discount_nota": "OPCIONAL. Descuento fijo por pasajero. Por defecto: 0.00. NO usar junto con discount_percentage.",
      
      "discount_percentage": null,
      "_discount_percentage_nota": "OPCIONAL. Descuento en porcentaje (0-100). Alternativa a discount. NO usar ambos.",
      
      "tax_category_code": "10",
      "_tax_category_code_nota": "AUTOMATICO pero controlable. Por defecto: del producto. 10=Gravado, 20=Exonerado, 30=Inafecto",
      
      "item_description": "Servicio de transporte ejecutivo",
      "_item_description_nota": "AUTOMATICO pero controlable. Por defecto: nombre del producto en BD.",
      
      "unit_code": "NIU",
      "_unit_code_nota": "AUTOMATICO pero controlable. Por defecto: del producto. NIU=Unidad, ZZ=Servicio"
    },
    
    "special_notes": "Servicio premium con configuración personalizada",
    "_special_notes_nota": "OPCIONAL. Notas especiales para la factura. Máximo 500 caracteres."
  },