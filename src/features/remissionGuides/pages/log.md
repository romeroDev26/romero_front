## 📦 GUÍA DEL REMITENTE (Tipo 09)

### 1. Crear Nueva Guía

*Endpoint:* POST /api/v1/sunat/remission-guides-sender/

*Request JSON:*
json
{
  "company_id": 1,
  "document_type_code": "09",
  "series": "R001",
  "sender_document_type": "6",
  "sender_document_number": "20123456789",
  "sender_name": "Mi Empresa SAC",
  "sender_address": "Av. Mi Empresa 789, Lima",
  "recipient_document_type": "6",
  "recipient_document_number": "20987654321",
  "recipient_name": "Cliente Destinatario SAC", 
  "recipient_address": "Jr. Cliente 321, Cusco",
  "origin_address": "Almacén Principal - Av. Mi Empresa 789",
  "origin_ubigeo": "150101",
  "destination_address": "Oficina Cliente - Jr. Cliente 321",
  "destination_ubigeo": "080101",
  "transport_mode": "02",
  "transport_start_date": "2024-01-16",
  "vehicle_plate": "XYZ-789",
  "driver_license": "Q87654321", 
  "driver_name": "María García López",
  "driver_document_type": "1",
  "driver_document_number": "87654321",
  "related_doc_type": "01",
  "related_doc_number": "F001-294",
  "related_doc_ruc": "20123456789",
  "related_doc_description": "Factura por venta de productos",
  "items": [
    {
      "product_code": "MIP001",
      "description": "Productos de mi empresa - Lote A",
      "quantity": 50,
      "unit_measure": "NIU",
      "weight": 125.0
    }
  ],
  "observations": "Entrega programada para el 17/01/2024"
}


> *📝 Nota sobre Documento Relacionado:*
> - related_doc_type: Código del tipo de documento según catálogo 01 de SUNAT (01=Factura, 03=Boleta, etc.)
> - related_doc_number: Número completo del documento incluyendo serie (ej: "F001-294", "B002-1500")
> - related_doc_ruc: RUC del emisor del documento relacionado (11 dígitos)
> - related_doc_description: Descripción del comprobante para mayor trazabilidad
> - Estos campos son opcionales pero recomendados para sustentar el traslado ante SUNAT

*Response JSON:*
json
{
  "id": 124,
  "company_id": 1,
  "document_type_code": "09",
  "series": "R001",
  "number": 1,
  "issue_date": "2024-01-16",
  "sender_name": "Mi Empresa SAC",
  "recipient_name": "Cliente Destinatario SAC",
  "sunat_status": "DRAFT",
  "sunat_ticket": null,
  "items": [
    {
      "id": 457,
      "product_code": "MIP001",
      "description": "Productos de mi empresa - Lote A",
      "quantity": 50,
      "unit_measure": "NIU",
      "weight": 125.0
    }
  ],
  "created_at": "2024-01-16T09:15:00Z",
  "updated_at": "2024-01-16T09:15:00Z"
}

## 📦 GUÍA DEL REMITENTE (Tipo 09)

### 1. Crear Nueva Guía

*Endpoint:* POST /api/v1/sunat/remission-guides-sender/

*Request JSON:*
json
{
  "company_id": 1,
  "document_type_code": "09",
  "series": "R001",
  "sender_document_type": "6",
  "sender_document_number": "20123456789",
  "sender_name": "Mi Empresa SAC",
  "sender_address": "Av. Mi Empresa 789, Lima",
  "recipient_document_type": "6",
  "recipient_document_number": "20987654321",
  "recipient_name": "Cliente Destinatario SAC", 
  "recipient_address": "Jr. Cliente 321, Cusco",
  "origin_address": "Almacén Principal - Av. Mi Empresa 789",
  "origin_ubigeo": "150101",
  "destination_address": "Oficina Cliente - Jr. Cliente 321",
  "destination_ubigeo": "080101",
  "transport_mode": "02",
  "transport_start_date": "2024-01-16",
  "vehicle_plate": "XYZ-789",
  "driver_license": "Q87654321", 
  "driver_name": "María García López",
  "driver_document_type": "1",
  "driver_document_number": "87654321",
  "related_doc_type": "01",
  "related_doc_number": "F001-294",
  "related_doc_ruc": "20123456789",
  "related_doc_description": "Factura por venta de productos",
  "items": [
    {
      "product_code": "MIP001",
      "description": "Productos de mi empresa - Lote A",
      "quantity": 50,
      "unit_measure": "NIU",
      "weight": 125.0
    }
  ],
  "observations": "Entrega programada para el 17/01/2024"
}


> *📝 Nota sobre Documento Relacionado:*
> - related_doc_type: Código del tipo de documento según catálogo 01 de SUNAT (01=Factura, 03=Boleta, etc.)
> - related_doc_number: Número completo del documento incluyendo serie (ej: "F001-294", "B002-1500")
> - related_doc_ruc: RUC del emisor del documento relacionado (11 dígitos)
> - related_doc_description: Descripción del comprobante para mayor trazabilidad
> - Estos campos son opcionales pero recomendados para sustentar el traslado ante SUNAT

*Response JSON:*
json
{
  "id": 124,
  "company_id": 1,
  "document_type_code": "09",
  "series": "R001",
  "number": 1,
  "issue_date": "2024-01-16",
  "sender_name": "Mi Empresa SAC",
  "recipient_name": "Cliente Destinatario SAC",
  "sunat_status": "DRAFT",
  "sunat_ticket": null,
  "items": [
    {
      "id": 457,
      "product_code": "MIP001",
      "description": "Productos de mi empresa - Lote A",
      "quantity": 50,
      "unit_measure": "NIU",
      "weight": 125.0
    }
  ],
  "created_at": "2024-01-16T09:15:00Z",
  "updated_at": "2024-01-16T09:15:00Z"
}


ahora este es de tipo remitente, neceistoq ue revices haber si envia los campos correctos en el front para este tipo de guia por que este ejemplo es lo que el backend tiene que recibir