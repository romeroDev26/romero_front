{
  //================================================================================
  // BLOQUE 1: CABECERA - Información general del documento y la empresa.
  //================================================================================
  "header": {
    "company_logo_url": "https://romero-cdn.b-cdn.net/1/2025/07/logos/logo_romero.png",
    "company_name": "EMPRESA DE TRANSPORTES ROMERO S.R.L.",
    "company_ruc": "20167700277",
    "company_address": "MZA. B LOTE. 19 Z.I. ZONA INDUSTRIAL (TALARA ALTA) PIURA - TALARA - PARIÑAS",
    "company_phones": ["968574321"],
    "emission_point": "NAUTA", // USO: El backend debería derivarlo de la sucursal de venta.
    "document_title": "BOLETA DE VENTA ELECTRÓNICA", // Derivado de 'document_type_code: "03"'.
    "document_id": "B001-38225", // Combinación de 'series' y 'number'.
    "emission_datetime": "31/07/2025 08:21 PM", // Formato legible de 'issue_date' y 'issue_time'.
    "seller_name": "test system" // Derivado de 'seller.full_name'.
  },

  //================================================================================
  // BLOQUE 2: INFORMACIÓN DEL PASAJERO - Datos específicos del cliente.
  //================================================================================
  "passenger_info": {
    "doc_label": "DNI PASAJERO", // Derivado de 'client.doc_type: "1"'.
    "doc_number": "76307497",
    "name_label": "PASAJERO",
    "full_name": "WILMER ALEXANDER EDQUÉN BARBOZA"
  },

  //================================================================================
  // BLOQUE 3: DETALLES LOGÍSTICOS DEL VIAJE - Extraído del ítem principal.
  //================================================================================
  "trip_details": {
    "title": "DATOS DEL VIAJE",
    "details": [
      { "label": "EMBARCACIÓN", "value": "Romero VIII" }, // De 'items[0].vehicle_name'.
      { "label": "ORIGEN", "value": "Nauta" }, // ¡NUEVO! De 'items[0].boarding_port_name'.
      { "label": "DESTINO", "value": "Yurimaguas" }, // ¡NUEVO! De 'items[0].disembarking_port_name'.
      { "label": "FECHA VIAJE", "value": "02/08/2025" }, // Formato de 'trip_departure_time'.
      { "label": "HORA VIAJE", "value": "11:00 PM" }, // Formato de 'trip_departure_time'.
      { "label": "EMBARQUE", "value": "10:00 PM" }, // Formato de 'boarding_time'.
      { "label": "ASIENTO", "value": "75" } // De 'items[0].seat_number'.
    ]
  },

  //================================================================================
  // BLOQUE 4: DESGLOSE FINANCIERO - Transparencia total para el cliente.
  //================================================================================
  "financial_breakdown": {
    "title": "DETALLE DE LA VENTA",
    "items": [ // El backend procesa el array de items crudo y lo transforma en este formato limpio.
      {
        "description": "Servicio de Transporte de Pasajeros", // De 'product_name'.
        "quantity": 1,
        "unit_price": 150.00,
        "discount": 10.00,
        "total_line": 140.00
      },
      {
        "description": "Exceso de Equipaje", // De 'product_name'.
        "quantity": 1,
        "unit_price": 65.00,
        "discount": 0.00,
        "total_line": 65.00
      }
    ],
    "summary": [ // El backend calcula este resumen para que el frontend solo lo pinte.
      { "label": "SUBTOTAL", "value": "S/ 215.00" }, // Suma de (unit_price * quantity) de todos los items (150 + 65).
      { "label": "DESCUENTOS", "value": "- S/ 10.00" }, // Suma de 'discount' de todos los items.
      { "label": "TOTAL A PAGAR", "value": "S/ 205.00", "is_bold": true } // El monto final, de 'total_payable'.
    ]
  },
  
  //================================================================================
  // BLOQUE 5: INFORMACIÓN DE PAGO
  //================================================================================
  "payment_info": {
    "amount_in_words_prefix": "SON:",
    "amount_in_words": "DOSCIENTOS CINCO CON 00/100 SOLES",
    "payment_method_label": "FORMA DE PAGO:",
    "payment_method": "Contado"
  },
  
  //================================================================================
  // BLOQUE 6: PIE DE PÁGINA
  //================================================================================
  "footer": {
    "qr_code_base64": "iVBORw0KGgoAAAANSUhEUgAAAZoAAAGaAQAAAAAefbjOAAAC4UlEQVR4nO2cQW7bMBBF31QCspSBHsBHkW+QIwU9Um8gHcUHCCAtDUj4XQxJK+dmlaS1DHC8IK9IDRsjgz+fQtIkvf8YfX2cgoIACCiiggAI6TsjSp4XxBIzWYhdWA1azy5wfuBwSXkD3h3pJ0gR2YTV7m1aD+UV2mV8ENJIkfYTuF15A94fmJAAa5hYNXf7vj+fFv7iCHBVeQHeD2k/XRvfeMr6+t4wnTABiPiq8gA6HpGuqFZIWGDf38AjhBfTfoawRnYAZrP8NgtWgm2R0Ewaw72Q9+DsF9A+g0czMTumP7if7a4sPsPpU46jwArq3RmwCIFiA7mb+bTwv6KNCPPw7BfQdiN2ssp8AaAQ+12hErwUNXR4kScODv1NA34FSRngydPJkkKZGGgAfPA8g9S0iI54f0kCj1IpgNbPzzeilohareaoMh4QX0N01wjOi1A9pglwwkmTQT41CI54fShmhqcnmMXsG3EdMJVXCR1QB7TVi6JSlwPNgSWoBTfiIWqDsLDd7SaMPeZBqRbKckRF1QBpYjfG8LYCmiSd0N18Sl67RoaoByj5CqWCkZc/NR5S7oRF1QOySQUp54P0IaSFNN9nmH5ERTw7tepbZMyz5Rplm9O4xm9CICqC8rjH/XKwXaDQQ8wlf3Bhf3z9voXj4dwroO9Bu9plKx0TuR3QKH1EfVKpGcZGlH+HrW9tzE+Ej6oHcPZTNlr/ON7O3Ka+C9sVyDseEF9ABHaol77fdakXJCLZmZmjEs0O7nmW2EFv3ErapR/iISqBdh+qzgVRJhl45S0IjKoF2Z7p8T+UpneBJxmFuif0RdUFb1UhDI7uUVrY3tec4wVMDtN9Vl7zjQkqB7DHTk7E/olJoflEuGKuloZPSjcPDC+gQqFfpR/hx4BYNvi7+COEFdAeo2MbxfLMsFK1fagDs7RoaUQO0P6/hLtJXOPJlX7oVcV6jDsjil8kCCiiggAIKKKC/hP4ALJG22LVkejUAAAAASUVORK5CYII=",
    "consultation_text": "Para consultar el comprobante ingrese a",
    "consultation_url": "https://cpe.sunat.gob.pe/consultacpe"
  },

  //================================================================================
  // BLOQUE 7: TOTALES PARA SUNAT (La "verdad contable" para uso interno)
  //================================================================================
  "sunat_totals": {
    "total_taxable": "0.00",
    "total_exonerated": "205.00",
    "total_unaffected": "0.00",
    "total_free": "0.00",
    "total_global_discount": "10.00",
    "total_igv": "0.00",
    "total_isc": "0.00",
    "total_other_taxes": "0.00"
  },

  //================================================================================
  // BLOQUE 8: METADATOS - IDs y datos de sistema no visibles.
  //================================================================================
  "metadata": {
    "invoice_id": 381,
    "company_id": 1,
    "client_id": 4
  }
}