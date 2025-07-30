{
  "descripcion": "JSON COMPLETO ACTUALIZADO para endpoint /api/v1/sunat/invoices/company-with-representatives-extended",
  "fecha_actualizacion": "2024-12-19",
  "cambios_implementados": [
    "✅ Campo 'series' se obtiene automáticamente de document_series",
    "✅ Campo 'client_id' se obtiene automáticamente buscando/creando cliente",
    "✅ Campo 'company_id' usa settings.COMPANY_ID automáticamente",
    "✅ Estructura InvoiceCreate corregida",
    "✅ Mapeo correcto de atributos RepresentanteForCompanyInvoice"
  ],
  
  "json_request_completo": {
    "company_data": {
      "_comentario": "NECESARIO: Se usa para buscar/crear el cliente en la base de datos",
      "client_doc_type": "6",
      "client_doc_number": "20167700277",
      "client_name": "TRANSPORTES AMAZONIA S.A.C.",
      "client_address": "AV. AMAZONAS 123, IQUITOS",
      "client_email": "facturacion@amazonia.com",
      "client_phone": "065-123456"
    },
    
    "trip_id": 190,
    "boarding_stop_id": 1280,
    "disembarking_stop_id": 1290,
    
    "representatives": [
      {
        "passenger_name": "JUAN CARLOS PEREZ LOPEZ",
        "passenger_doc_type": "1",
        "passenger_doc_number": "12345678",
        "passenger_phone": "987654321",
        "passenger_email": "juan.perez@email.com",
        "seat_number": "8"
      },
      {
        "passenger_name": "MARIA ELENA RODRIGUEZ SILVA",
        "passenger_doc_type": "1",
        "passenger_doc_number": "87654321",
        "passenger_phone": "987654322",
        "passenger_email": "maria.rodriguez@email.com",
        "seat_number": "9"
      }
    ],
    
    "item_config": {
      "_comentario": "OPCIONAL: Configuración personalizada del item",
      "quantity": 2,
      "unit_price": 45.00,
      "discount": 5.00,
      "tax_category_code": "10",
      "unit_code": "ZZ",
      "item_description": "Transporte de pasajeros - Servicio empresarial"
    },
    
    "invoice_config": {
      "_comentario": "OPCIONAL: Configuración personalizada de la factura",
      "document_type_code": "01",
      "operation_type_code": "0101",
      "currency_code": "PEN",
      "exchange_rate": null,
      "payment_terms_description": "Contado",
      "due_date": null,
      "detraccion_code": null,
      "detraccion_percentage": null
    },
    
    "special_notes": "Factura empresarial para transporte de personal"
  },
  
  "campos_automaticos_backend": {
    "descripcion": "Estos campos NO van en el JSON, se obtienen automáticamente en el backend",
    "series": {
      "como_se_obtiene": "SELECT series_code FROM document_series WHERE company_id = settings.COMPANY_ID AND document_type_code = '01' AND is_active = true",
      "ejemplo_valor": "F001"
    },
    "client_id": {
      "como_se_obtiene": "Se busca en clients por doc_number, si no existe se crea automáticamente",
      "ejemplo_valor": 123
    },
    "company_id": {
      "como_se_obtiene": "settings.COMPANY_ID (configuración del sistema)",
      "ejemplo_valor": 1
    }
  },
  
  "explicacion_company_data": {
    "pregunta": "¿Por qué enviar company_data si ya tenemos client_id?",
    "respuesta": "NO tenemos client_id en el JSON de entrada. El backend lo obtiene así:",
    "proceso": [
      "1. Frontend envía company_data con datos del cliente",
      "2. Backend busca cliente por client_doc_number en la tabla clients",
      "3. Si existe: usa ese client_id",
      "4. Si NO existe: crea nuevo cliente con los datos de company_data",
      "5. Obtiene el client_id del cliente encontrado/creado",
      "6. Usa ese client_id en InvoiceCreate"
    ],
    "codigo_backend": "client_record = await db.fetchrow('SELECT id FROM clients WHERE doc_number = $1', invoice_data.company_data['client_doc_number'])"
  },
  
  "flujo_completo_backend": {
    "paso_1": "Validar datos de entrada",
    "paso_2": "Buscar producto activo para PASAJES",
    "paso_3": "Aplicar configuración de item_config (o usar defaults)",
    "paso_4": "Aplicar configuración de invoice_config (o usar defaults)",
    "paso_5": "Buscar/crear cliente usando company_data → obtener client_id",
    "paso_6": "Obtener serie activa para facturas → obtener series",
    "paso_7": "Crear InvoiceCreate con: client_id, series, items, configuración",
    "paso_8": "Crear factura usando crud_invoice.create_invoice()",
    "paso_9": "Crear representantes usando RepresentanteCreate con passenger_*",
    "paso_10": "Retornar respuesta completa"
  },
  
  "estructura_invoicecreate_final": {
    "descripcion": "Así se ve el InvoiceCreate que se construye internamente",
    "client_id": "<obtenido de clients table>",
    "series": "<obtenido de document_series table>",
    "items": [
      {
        "product_id": "<obtenido de products_services>",
        "quantity": "<de item_config o cantidad de representantes>",
        "unit_price": "<de item_config o precio del producto>",
        "discount": "<de item_config o 0.00>",
        "tax_category_code": "<de item_config o del producto>",
        "trip_id": "<del JSON>",
        "boarding_trip_stop_id": "<del JSON>",
        "disembarking_trip_stop_id": "<del JSON>"
      }
    ],
    "document_type_code": "<de invoice_config o '01'>",
    "operation_type_code": "<de invoice_config o '0101'>",
    "currency_code": "<de invoice_config o 'PEN'>",
    "exchange_rate": "<de invoice_config o null>",
    "payment_terms_description": "<de invoice_config o 'Contado'>",
    "due_date": "<de invoice_config o null>",
    "detraccion_code": "<de invoice_config o null>",
    "detraccion_percentage": "<de invoice_config o null>",
    "notes": "<de special_notes>"
  },
  
  "estructura_representantecreate_final": {
    "descripcion": "Así se ve cada RepresentanteCreate que se construye internamente",
    "invoice_id": "<ID de la factura creada>",
    "passenger_name": "<de representatives[].passenger_name>",
    "passenger_doc_type": "<de representatives[].passenger_doc_type>",
    "passenger_doc_number": "<de representatives[].passenger_doc_number>",
    "passenger_email": "<de representatives[].passenger_email>",
    "passenger_phone": "<de representatives[].passenger_phone>",
    "trip_id": "<del JSON>",
    "boarding_stop_id": "<del JSON>",
    "disembarking_stop_id": "<del JSON>",
    "seat_number": "<de representatives[].seat_number o null>"
  },
  
  "ejemplo_respuesta": {
    "invoice": {
      "id": 322,
      "client_id": 123,
      "series": "F001",
      "number": 456,
      "document_type_code": "01",
      "issue_date": "2024-12-19",
      "total_payable": 94.50,
      "currency_code": "PEN",
      "notes": "Factura empresarial para transporte de personal"
    },
    "representatives": [
      {
        "id": 101,
        "invoice_id": 322,
        "passenger_name": "JUAN CARLOS PEREZ LOPEZ",
        "passenger_doc_number": "12345678",
        "seat_number": "8"
      },
      {
        "id": 102,
        "invoice_id": 322,
        "passenger_name": "MARIA ELENA RODRIGUEZ SILVA",
        "passenger_doc_number": "87654321",
        "seat_number": "9"
      }
    ],
    "summary": {
      "total_capacity": 2,
      "available_capacity": 0,
      "occupied_capacity": 2
    }
  },
  
  "diferencias_con_endpoint_original": {
    "endpoint_original": "/api/v1/sunat/invoices/company-with-representatives",
    "endpoint_extendido": "/api/v1/sunat/invoices/company-with-representatives-extended",
    "diferencias": [
      "✅ Extendido permite item_config (precios, descuentos personalizados)",
      "✅ Extendido permite invoice_config (moneda, términos de pago, etc.)",
      "✅ Extendido usa company_data como dict (más flexible)",
      "✅ Extendido implementa lógica completa (no delega al original)",
      "✅ Ambos tienen la misma respuesta final"
    ]
  },
  
  "notas_importantes": [
    "🔹 El campo 'series' NUNCA va en el JSON de entrada, se obtiene automáticamente",
    "🔹 El campo 'client_id' NUNCA va en el JSON de entrada, se obtiene de company_data",
    "🔹 company_data ES NECESARIO para crear/buscar el cliente",
    "🔹 item_config e invoice_config son OPCIONALES (usan defaults si no se envían)",
    "🔹 Los atributos de representatives usan prefijo 'passenger_' (passenger_name, etc.)",
    "🔹 El endpoint está completamente funcional después de todos los fixes"
  ]
}{
  "descripcion": "JSON COMPLETO ACTUALIZADO para endpoint /api/v1/sunat/invoices/company-with-representatives-extended",
  "fecha_actualizacion": "2024-12-19",
  "cambios_implementados": [
    "✅ Campo 'series' se obtiene automáticamente de document_series",
    "✅ Campo 'client_id' se obtiene automáticamente buscando/creando cliente",
    "✅ Campo 'company_id' usa settings.COMPANY_ID automáticamente",
    "✅ Estructura InvoiceCreate corregida",
    "✅ Mapeo correcto de atributos RepresentanteForCompanyInvoice"
  ],
  
  "json_request_completo": {
    "company_data": {
      "_comentario": "NECESARIO: Se usa para buscar/crear el cliente en la base de datos",
      "client_doc_type": "6",
      "client_doc_number": "20167700277",
      "client_name": "TRANSPORTES AMAZONIA S.A.C.",
      "client_address": "AV. AMAZONAS 123, IQUITOS",
      "client_email": "facturacion@amazonia.com",
      "client_phone": "065-123456"
    },
    
    "trip_id": 190,
    "boarding_stop_id": 1280,
    "disembarking_stop_id": 1290,
    
    "representatives": [
      {
        "passenger_name": "JUAN CARLOS PEREZ LOPEZ",
        "passenger_doc_type": "1",
        "passenger_doc_number": "12345678",
        "passenger_phone": "987654321",
        "passenger_email": "juan.perez@email.com",
        "seat_number": "8"
      },
      {
        "passenger_name": "MARIA ELENA RODRIGUEZ SILVA",
        "passenger_doc_type": "1",
        "passenger_doc_number": "87654321",
        "passenger_phone": "987654322",
        "passenger_email": "maria.rodriguez@email.com",
        "seat_number": "9"
      }
    ],
    
    "item_config": {
      "_comentario": "OPCIONAL: Configuración personalizada del item",
      "quantity": 2,
      "unit_price": 45.00,
      "discount": 5.00,
      "tax_category_code": "10",
      "unit_code": "ZZ",
      "item_description": "Transporte de pasajeros - Servicio empresarial"
    },
    
    "invoice_config": {
      "_comentario": "OPCIONAL: Configuración personalizada de la factura",
      "document_type_code": "01",
      "operation_type_code": "0101",
      "currency_code": "PEN",
      "exchange_rate": null,
      "payment_terms_description": "Contado",
      "due_date": null,
      "detraccion_code": null,
      "detraccion_percentage": null
    },
    
    "special_notes": "Factura empresarial para transporte de personal"
  },
  
  "campos_automaticos_backend": {
    "descripcion": "Estos campos NO van en el JSON, se obtienen automáticamente en el backend",
    "series": {
      "como_se_obtiene": "SELECT series_code FROM document_series WHERE company_id = settings.COMPANY_ID AND document_type_code = '01' AND is_active = true",
      "ejemplo_valor": "F001"
    },
    "client_id": {
      "como_se_obtiene": "Se busca en clients por doc_number, si no existe se crea automáticamente",
      "ejemplo_valor": 123
    },
    "company_id": {
      "como_se_obtiene": "settings.COMPANY_ID (configuración del sistema)",
      "ejemplo_valor": 1
    }
  },
  
  "explicacion_company_data": {
    "pregunta": "¿Por qué enviar company_data si ya tenemos client_id?",
    "respuesta": "NO tenemos client_id en el JSON de entrada. El backend lo obtiene así:",
    "proceso": [
      "1. Frontend envía company_data con datos del cliente",
      "2. Backend busca cliente por client_doc_number en la tabla clients",
      "3. Si existe: usa ese client_id",
      "4. Si NO existe: crea nuevo cliente con los datos de company_data",
      "5. Obtiene el client_id del cliente encontrado/creado",
      "6. Usa ese client_id en InvoiceCreate"
    ],
    "codigo_backend": "client_record = await db.fetchrow('SELECT id FROM clients WHERE doc_number = $1', invoice_data.company_data['client_doc_number'])"
  },
  
  "flujo_completo_backend": {
    "paso_1": "Validar datos de entrada",
    "paso_2": "Buscar producto activo para PASAJES",
    "paso_3": "Aplicar configuración de item_config (o usar defaults)",
    "paso_4": "Aplicar configuración de invoice_config (o usar defaults)",
    "paso_5": "Buscar/crear cliente usando company_data → obtener client_id",
    "paso_6": "Obtener serie activa para facturas → obtener series",
    "paso_7": "Crear InvoiceCreate con: client_id, series, items, configuración",
    "paso_8": "Crear factura usando crud_invoice.create_invoice()",
    "paso_9": "Crear representantes usando RepresentanteCreate con passenger_*",
    "paso_10": "Retornar respuesta completa"
  },
  
  "estructura_invoicecreate_final": {
    "descripcion": "Así se ve el InvoiceCreate que se construye internamente",
    "client_id": "<obtenido de clients table>",
    "series": "<obtenido de document_series table>",
    "items": [
      {
        "product_id": "<obtenido de products_services>",
        "quantity": "<de item_config o cantidad de representantes>",
        "unit_price": "<de item_config o precio del producto>",
        "discount": "<de item_config o 0.00>",
        "tax_category_code": "<de item_config o del producto>",
        "trip_id": "<del JSON>",
        "boarding_trip_stop_id": "<del JSON>",
        "disembarking_trip_stop_id": "<del JSON>"
      }
    ],
    "document_type_code": "<de invoice_config o '01'>",
    "operation_type_code": "<de invoice_config o '0101'>",
    "currency_code": "<de invoice_config o 'PEN'>",
    "exchange_rate": "<de invoice_config o null>",
    "payment_terms_description": "<de invoice_config o 'Contado'>",
    "due_date": "<de invoice_config o null>",
    "detraccion_code": "<de invoice_config o null>",
    "detraccion_percentage": "<de invoice_config o null>",
    "notes": "<de special_notes>"
  },
  
  "estructura_representantecreate_final": {
    "descripcion": "Así se ve cada RepresentanteCreate que se construye internamente",
    "invoice_id": "<ID de la factura creada>",
    "passenger_name": "<de representatives[].passenger_name>",
    "passenger_doc_type": "<de representatives[].passenger_doc_type>",
    "passenger_doc_number": "<de representatives[].passenger_doc_number>",
    "passenger_email": "<de representatives[].passenger_email>",
    "passenger_phone": "<de representatives[].passenger_phone>",
    "trip_id": "<del JSON>",
    "boarding_stop_id": "<del JSON>",
    "disembarking_stop_id": "<del JSON>",
    "seat_number": "<de representatives[].seat_number o null>"
  },
  
  "ejemplo_respuesta": {
    "invoice": {
      "id": 322,
      "client_id": 123,
      "series": "F001",
      "number": 456,
      "document_type_code": "01",
      "issue_date": "2024-12-19",
      "total_payable": 94.50,
      "currency_code": "PEN",
      "notes": "Factura empresarial para transporte de personal"
    },
    "representatives": [
      {
        "id": 101,
        "invoice_id": 322,
        "passenger_name": "JUAN CARLOS PEREZ LOPEZ",
        "passenger_doc_number": "12345678",
        "seat_number": "8"
      },
      {
        "id": 102,
        "invoice_id": 322,
        "passenger_name": "MARIA ELENA RODRIGUEZ SILVA",
        "passenger_doc_number": "87654321",
        "seat_number": "9"
      }
    ],
    "summary": {
      "total_capacity": 2,
      "available_capacity": 0,
      "occupied_capacity": 2
    }
  },
  
  "diferencias_con_endpoint_original": {
    "endpoint_original": "/api/v1/sunat/invoices/company-with-representatives",
    "endpoint_extendido": "/api/v1/sunat/invoices/company-with-representatives-extended",
    "diferencias": [
      "✅ Extendido permite item_config (precios, descuentos personalizados)",
      "✅ Extendido permite invoice_config (moneda, términos de pago, etc.)",
      "✅ Extendido usa company_data como dict (más flexible)",
      "✅ Extendido implementa lógica completa (no delega al original)",
      "✅ Ambos tienen la misma respuesta final"
    ]
  },
  
  "notas_importantes": [
    "🔹 El campo 'series' NUNCA va en el JSON de entrada, se obtiene automáticamente",
    "🔹 El campo 'client_id' NUNCA va en el JSON de entrada, se obtiene de company_data",
    "🔹 company_data ES NECESARIO para crear/buscar el cliente",
    "🔹 item_config e invoice_config son OPCIONALES (usan defaults si no se envían)",
    "🔹 Los atributos de representatives usan prefijo 'passenger_' (passenger_name, etc.)",
    "🔹 El endpoint está completamente funcional después de todos los fixes"
  ]
}