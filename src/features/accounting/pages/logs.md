# 📋 Guía Frontend - Notas de Crédito y Débito SUNAT

## 🎯 Resumen Ejecutivo

Esta guía proporciona ejemplos detallados de JSON para cada tipo de *Nota de Crédito* y *Nota de Débito* según los catálogos SUNAT, facilitando la implementación de formularios y vistas en el frontend.

---

## 📝 NOTAS DE CRÉDITO (Catálogo 09 SUNAT)

### Endpoints Disponibles

#### *Endpoint Principal*
http
POST /api/v1/sunat/credit-notes/


#### *Endpoint de Anulación Simplificada*
http
POST /api/v1/sunat/credit-notes/annul

*Uso:* Para anular facturas/boletas de forma rápida sin especificar ítems.

*Payload:*
json
{
  "invoice_id": 456,
  "credit_note_series": "FC01",
  "reason": "Error en facturación"
}


### Códigos Disponibles

#### *01 - Anulación de la operación*
*Uso:* Cuando se anula completamente una venta por devolución total de mercadería.

*Opción 1: Endpoint simplificado (recomendado)*
json
{
  "invoice_id": 456,
  "credit_note_series": "FC01",
  "reason": "Anulación total de la operación por devolución de mercadería"
}


*Opción 2: Endpoint completo*
json
{
  "company_id": 1,
  "client_id": 123,
  "series": "FC01",
  "currency_code": "PEN",
  "issue_date": "2024-01-15",
  "issue_time": "14:30:00",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-00000456",
  "credit_note_type_code": "01",
  "reason": "Anulación total de la operación por devolución de mercadería",
  "items": [
    {
      "product_id": 1,
      "quantity": 5,
      "unit_code": "NIU",
      "unit_price": 100.00,
      "tax_category_code": "10"
    },
    {
      "product_id": 2,
      "quantity": 2,
      "unit_code": "NIU",
      "unit_price": 50.00,
      "tax_category_code": "10"
    }
  ]
}


#### *02 - Anulación por error en el RUC*
*Uso:* Cuando se emitió el comprobante con un RUC incorrecto.

json
{
  "company_id": 1,
  "client_id": 124,
  "series": "FC01",
  "currency_code": "PEN",
  "issue_date": "2024-01-15",
  "issue_time": "15:00:00",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-00000457",
  "credit_note_type_code": "02",
  "reason": "Anulación por error en el RUC del cliente",
  "items": [
    {
      "product_id": 3,
      "quantity": 1,
      "unit_code": "NIU",
      "unit_price": 1500.00,
      "tax_category_code": "10"
    }
  ]
}


#### *03 - Corrección por error en la descripción*
*Uso:* Cuando hay errores en la descripción del producto/servicio.

json
{
  "company_id": 1,
  "client_id": 125,
  "series": "FC01",
  "currency_code": "PEN",
  "issue_date": "2024-01-15",
  "issue_time": "15:30:00",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-00000458",
  "credit_note_type_code": "03",
  "reason": "Corrección por error en la descripción del producto",
  "items": [
    {
      "product_id": 4,
      "quantity": 3,
      "unit_code": "NIU",
      "unit_price": 200.00,
      "tax_category_code": "10"
    }
  ]
}


#### *04 - Descuento global*
*Uso:* Aplicar un descuento general sobre toda la factura.

json
{
  "company_id": 1,
  "client_id": 126,
  "series": "FC01",
  "currency_code": "PEN",
  "issue_date": "2024-01-15",
  "issue_time": "16:00:00",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-00000459",
  "credit_note_type_code": "04",
  "reason": "Descuento global por cliente frecuente - 10%",
  "items": [
    {
      "product_id": 5,
      "quantity": 1,
      "unit_code": "NIU",
      "unit_price": 300.00,
      "discount": 30.00,
      "tax_category_code": "10"
    }
  ]
}


#### *05 - Descuento por ítem*
*Uso:* Aplicar descuento específico a productos individuales.

json
{
  "company_id": 1,
  "client_id": 127,
  "series": "FC01",
  "currency_code": "PEN",
  "issue_date": "2024-01-15",
  "issue_time": "16:30:00",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-00000460",
  "credit_note_type_code": "05",
  "reason": "Descuento por ítem - producto con defecto menor",
  "items": [
    {
      "product_id": 6,
      "quantity": 1,
      "unit_code": "NIU",
      "unit_price": 50.00,
      "discount": 5.00,
      "tax_category_code": "10"
    }
  ]
}


#### *06 - Devolución total*
*Uso:* Devolución completa de mercadería.

json
{
  "company_id": 1,
  "client_id": 128,
  "series": "FC01",
  "currency_code": "PEN",
  "issue_date": "2024-01-15",
  "issue_time": "17:00:00",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-00000461",
  "credit_note_type_code": "06",
  "reason": "Devolución total de mercadería por no conformidad",
  "items": [
    {
      "product_id": 7,
      "quantity": 10,
      "unit_code": "NIU",
      "unit_price": 25.00,
      "tax_category_code": "10"
    }
  ]
}


#### *07 - Devolución por ítem*
*Uso:* Devolución parcial de algunos productos específicos.

json
{
  "company_id": 1,
  "client_id": 129,
  "series": "FC01",
  "currency_code": "PEN",
  "issue_date": "2024-01-15",
  "issue_time": "17:30:00",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-00000462",
  "credit_note_type_code": "07",
  "reason": "Devolución parcial - 2 unidades defectuosas",
  "items": [
    {
      "product_id": 8,
      "quantity": 2,
      "unit_code": "NIU",
      "unit_price": 75.00,
      "tax_category_code": "10"
    }
  ]
}


#### *08 - Bonificación*
*Uso:* Otorgar bonificaciones o créditos adicionales al cliente.

json
{
  "company_id": 1,
  "client_id": 130,
  "series": "FC01",
  "currency_code": "PEN",
  "issue_date": "2024-01-15",
  "issue_time": "18:00:00",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-00000463",
  "credit_note_type_code": "08",
  "reason": "Bonificación por compra mayor a S/ 5,000",
  "items": [
    {
      "product_id": 9,
      "quantity": 1,
      "unit_code": "NIU",
      "unit_price": 200.00,
      "tax_category_code": "10"
    }
  ]
}


#### *09 - Disminución en el valor*
*Uso:* Reducción del valor por cambios en condiciones comerciales.

json
{
  "company_id": 1,
  "client_id": 131,
  "series": "FC01",
  "currency_code": "PEN",
  "issue_date": "2024-01-15",
  "issue_time": "18:30:00",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-00000464",
  "credit_note_type_code": "09",
  "reason": "Disminución en el valor por cambio en especificaciones",
  "items": [
    {
      "product_id": 10,
      "quantity": 1,
      "unit_code": "NIU",
      "unit_price": 150.00,
      "tax_category_code": "10"
    }
  ]
}


#### *10 - Otros conceptos*
*Uso:* Para otros conceptos no contemplados en los códigos anteriores.

json
{
  "company_id": 1,
  "client_id": 132,
  "series": "FC01",
  "currency_code": "PEN",
  "issue_date": "2024-01-15",
  "issue_time": "19:00:00",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-00000465",
  "credit_note_type_code": "10",
  "reason": "Ajuste por resolución comercial especial",
  "items": [
    {
      "product_id": 11,
      "quantity": 1,
      "unit_code": "NIU",
      "unit_price": 100.00,
      "tax_category_code": "10"
    }
  ]
}


---

## 📈 NOTAS DE DÉBITO (Catálogo 10 SUNAT)

### Endpoint Base
http
POST /api/v1/sunat/debit-notes/


### Códigos Disponibles

#### *01 - Intereses por mora*
*Uso:* Cobro de intereses por pagos tardíos.

json
{
  "company_id": 1,
  "client_id": 133,
  "series": "FD01",
  "currency_code": "PEN",
  "issue_date": "2024-01-15",
  "issue_time": "14:30:00",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-00000466",
  "debit_note_type_code": "01",
  "reason": "Intereses por mora - pago con 30 días de retraso",
  "items": [
    {
      "product_id": 12,
      "quantity": 1,
      "unit_code": "NIU",
      "unit_price": 150.00,
      "tax_category_code": "10"
    }
  ]
}


#### *02 - Aumento en el valor*
*Uso:* Incremento en el precio por cambios en condiciones.

json
{
  "company_id": 1,
  "client_id": 134,
  "series": "FD01",
  "currency_code": "PEN",
  "issue_date": "2024-01-15",
  "issue_time": "15:00:00",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-00000467",
  "debit_note_type_code": "02",
  "reason": "Aumento en el valor por cambio en especificaciones del cliente",
  "items": [
    {
      "product_id": 13,
      "quantity": 1,
      "unit_code": "NIU",
      "unit_price": 300.00,
      "tax_category_code": "10"
    }
  ]
}


#### *03 - Penalidades / otros conceptos*
*Uso:* Penalidades, multas o cargos adicionales.

json
{
  "company_id": 1,
  "client_id": 135,
  "series": "FD01",
  "currency_code": "PEN",
  "issue_date": "2024-01-15",
  "issue_time": "15:30:00",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-00000468",
  "debit_note_type_code": "03",
  "reason": "Penalidad por incumplimiento de términos contractuales",
  "items": [
    {
      "product_id": 14,
      "quantity": 1,
      "unit_code": "NIU",
      "unit_price": 500.00,
      "tax_category_code": "10"
    }
  ]
}


#### *11 - Ajustes de operaciones de exportación*
*Uso:* Ajustes específicos para operaciones de exportación.

json
{
  "company_id": 1,
  "client_id": 136,
  "series": "FD01",
  "currency_code": "USD",
  "issue_date": "2024-01-15",
  "issue_time": "16:00:00",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-00000469",
  "debit_note_type_code": "11",
  "reason": "Ajuste por variación en tipo de cambio - operación de exportación",
  "items": [
    {
      "product_id": 15,
      "quantity": 1,
      "unit_code": "NIU",
      "unit_price": 200.00,
      "tax_category_code": "40"
    }
  ]
}


#### *12 - Ajustes afectos al IVAP*
*Uso:* Ajustes para operaciones afectas al Impuesto a la Venta del Arroz Pilado.

json
{
  "company_id": 1,
  "client_id": 137,
  "series": "FD01",
  "currency_code": "PEN",
  "issue_date": "2024-01-15",
  "issue_time": "16:30:00",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-00000470",
  "debit_note_type_code": "12",
  "reason": "Ajuste por IVAP - Impuesto a la Venta del Arroz Pilado",
  "items": [
    {
      "product_id": 16,
      "quantity": 100,
      "unit_code": "NIU",
      "unit_price": 2.50,
      "tax_category_code": "10"
    }
  ]
}


---

## 🔍 Consulta de Estados

### Para Notas de Crédito
http
GET /api/v1/sunat/tickets/documents/credit_note/{id}/status


### Para Notas de Débito
http
GET /api/v1/sunat/tickets/documents/debit_note/{id}/status


### Respuesta de Estado
json
{
  "id": 789,
  "identifier": "FC01-00000123",
  "sunat_status": "ACCEPTED",
  "sunat_response_code": "0",
  "sunat_response_description": "La Nota de Crédito número FC01-00000123, ha sido aceptada",
  "cdr_status": "ACCEPTED",
  "total_amount": 236.00,
  "created_at": "2024-01-15T14:30:00",
  "updated_at": "2024-01-15T14:35:00"
}


---

## 💰 Manejo de Descuentos en Notas de Crédito

### ¿Cómo especificar descuentos?

Para los códigos *04 (Descuento global)* y *05 (Descuento por ítem), tienes **dos opciones*:

#### **Opción 1: Campo discount separado (Recomendado)**
json
{
  "unit_price": 100.00,  // Precio original SIN descuento
  "discount": 10.00      // Monto del descuento
}


#### **Opción 2: unit_price ya con descuento aplicado**
json
{
  "unit_price": 90.00     // Precio ya con descuento aplicado
  // NO incluir campo discount
}


### ⚠ Importante sobre Anulaciones

*Para anulaciones (código 01), usa preferiblemente el **endpoint simplificado*:
http
POST /api/v1/sunat/credit-notes/annul


Este endpoint:
- ✅ Copia automáticamente todos los ítems del documento original
- ✅ Establece automáticamente credit_note_type_code: "01"
- ✅ Requiere menos datos del frontend
- ✅ Reduce errores de implementación

## 💡 Consejos para el Frontend

### 1. *Validaciones Recomendadas*
- Verificar que el documento afectado existe y está aceptado por SUNAT
- Validar que los montos no excedan el documento original
- Confirmar que el cliente coincide con el documento original

### 2. *Campos Obligatorios*
- company_id: ID de la empresa emisora
- client_id: ID del cliente receptor
- series: Serie del documento
- affected_document_*: Datos del documento que se está afectando
- *_type_code: Código del tipo de nota según catálogo SUNAT
- reason: Motivo detallado de la emisión
- items: Array con al menos un ítem
- unit_price: Valor unitario *SIN IGV* (según schema)
- discount: Monto del descuento (opcional, solo para códigos 04 y 05)

### 3. *Manejo de Estados*
- PENDING: Documento creado, esperando envío a SUNAT
- SENT: Enviado a SUNAT, esperando respuesta
- ACCEPTED: Aceptado por SUNAT
- REJECTED: Rechazado por SUNAT (revisar errores)

### 4. *Códigos de Impuestos Comunes*
- "10": Gravado - Operación Onerosa (con IGV 18%)
- "20": Exonerado - Operación Onerosa (sin IGV)
- "30": Inafecto - Operación Onerosa (sin IGV)
- "40": Exportación (sin IGV)

---

## ⚠ Consideraciones Importantes

1. *Límites de Tiempo*: Las notas de crédito/débito deben emitirse dentro de los plazos establecidos por SUNAT.

2. *Documentos Relacionados*: Solo se pueden afectar documentos que estén aceptados por SUNAT.

3. *Montos*: Los montos de las notas no pueden exceder el documento original.

4. *Series*: Usar series específicas para notas de crédito (FC, BC) y débito (FD, BD).

5. *Procesamiento Asíncrono*: El envío a SUNAT es asíncrono, implementar polling para verificar estados.

Esta guía te permitirá implementar formularios específicos para cada tipo de nota, mejorando la experiencia del usuario y asegurando el cumplimiento normativo.