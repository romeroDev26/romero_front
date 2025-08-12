POST
/quotations/
Create Quotation


Crea una nueva cotización.

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "client_id": 0,
  "document_type_code": "COT",
  "series": "stri",
  "issue_date": "2025-08-11",
  "issue_time": "16:06:45.670Z",
  "valid_until": "2025-08-11",
  "operation_type_code": "0101",
  "currency_code": "PEN",
  "exchange_rate": 0,
  "payment_terms": "string",
  "payment_method_code": "str",
  "notes": "string",
  "internal_notes": "string",
  "items": [
    {
      "product_id": 0,
      "quantity": 1,
      "trip_id": 0,
      "boarding_trip_stop_id": 0,
      "disembarking_trip_stop_id": 0,
      "item_description": "string",
      "unit_code": "NIU",
      "unit_price": 0,
      "price_type_code": "01",
      "discount": 0,
      "tax_category_code": "10",
      "recipient_name": "string",
      "recipient_doc_type": "s",
      "recipient_doc_number": "string",
      "recipient_phone": "string"
    }
  ]
}
Responses
Code	Description	Links
201	
Successful Response

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "client_id": 0,
  "document_type_code": "COT",
  "series": "stri",
  "issue_date": "2025-08-11",
  "issue_time": "16:06:45.672Z",
  "valid_until": "2025-08-11",
  "operation_type_code": "0101",
  "currency_code": "PEN",
  "exchange_rate": "string",
  "payment_terms": "string",
  "payment_method_code": "str",
  "notes": "string",
  "internal_notes": "string",
  "id": 0,
  "company_id": 0,
  "number": 0,
  "ubl_version": "2.1",
  "status": "DRAFT",
  "created_by": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "total_taxable": "string",
  "total_exonerated": "string",
  "total_unaffected": "string",
  "total_free": "string",
  "total_discount": "string",
  "total_igv": "string",
  "total_isc": "string",
  "total_other_taxes": "string",
  "total_payable": "string",
  "total_in_words": "string",
  "created_at": "2025-08-11T16:06:45.672Z",
  "updated_at": "2025-08-11T16:06:45.672Z",
  "items": [],
  "client": {
    "doc_type": "6",
    "doc_number": "20123456789",
    "name": "EMPRESA XYZ S.A.C.",
    "address_line": "string",
    "ubigeo": "string",
    "department": "LIMA",
    "province": "LIMA",
    "district": "LIMA",
    "country_code": "PE",
    "email": "contacto@empresa.xyz",
    "phone": "+5112345678",
    "is_active": true,
    "id": 0,
    "created_at": "2025-08-11T16:06:45.672Z",
    "updated_at": "2025-08-11T16:06:45.672Z"
  },
  "company": {
    "ruc": "20428145969",
    "business_name": "string",
    "trade_name": "string",
    "address": "string",
    "ubigeo": "372072",
    "phone": "string",
    "email": "user@example.com",
    "logo_url": "https://example.com/",
    "sunat_username": "string",
    "certificate_path": "string",
    "beta_mode": true,
    "detraccion_account": "string",
    "is_active": true,
    "id": 0,
    "created_at": "2025-08-11T16:06:45.673Z",
    "updated_at": "2025-08-11T16:06:45.673Z"
  },
  "seller": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "user@example.com",
    "full_name": "string",
    "is_active": true,
    "role_id": 0,
    "default_branch_office_id": 0,
    "current_city_id": 0,
    "created_at": "2025-08-11T16:06:45.673Z",
    "updated_at": "2025-08-11T16:06:45.673Z",
    "role_name": "string"
  },
  "branch_office_name": "string",
  "branch_office_address": "string",
  "branch_office_phone": "string",
  "pdf_file_path": "string"
}
No links
422	
Validation Error

Media type

application/json
Example Value
Schema
{
  "detail": [
    {
      "loc": [
        "string",
        0
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
No links

GET
/quotations/
Get Quotations


Obtiene una lista de cotizaciones con filtros opcionales.

Parameters
Try it out
Name	Description
skip
integer
(query)
Número de registros a omitir

Default value : 0

0
minimum: 0
limit
integer
(query)
Número máximo de registros a devolver

Default value : 100

100
maximum: 1000
minimum: 1
series
string | (string | null)
(query)
Filtrar por serie

series
number
integer | (integer | null)
(query)
Filtrar por número

number
start_date
string | (string | null)($date)
(query)
Fecha de inicio (YYYY-MM-DD)

start_date
end_date
string | (string | null)($date)
(query)
Fecha de fin (YYYY-MM-DD)

end_date
client_search
string | (string | null)
(query)
Buscar por nombre o documento del cliente

client_search
status
string | (string | null)
(query)
Filtrar por estado

Available values : DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CONVERTED


--
Responses
Code	Description	Links
200	
Successful Response

Media type

application/json
Controls Accept header.
Example Value
Schema
[
  {
    "client_id": 0,
    "document_type_code": "COT",
    "series": "stri",
    "issue_date": "2025-08-11",
    "issue_time": "16:06:45.703Z",
    "valid_until": "2025-08-11",
    "operation_type_code": "0101",
    "currency_code": "PEN",
    "exchange_rate": "string",
    "payment_terms": "string",
    "payment_method_code": "str",
    "notes": "string",
    "internal_notes": "string",
    "id": 0,
    "company_id": 0,
    "number": 0,
    "ubl_version": "2.1",
    "status": "DRAFT",
    "created_by": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "total_taxable": "string",
    "total_exonerated": "string",
    "total_unaffected": "string",
    "total_free": "string",
    "total_discount": "string",
    "total_igv": "string",
    "total_isc": "string",
    "total_other_taxes": "string",
    "total_payable": "string",
    "total_in_words": "string",
    "created_at": "2025-08-11T16:06:45.703Z",
    "updated_at": "2025-08-11T16:06:45.703Z",
    "items": [],
    "client": {
      "doc_type": "6",
      "doc_number": "20123456789",
      "name": "EMPRESA XYZ S.A.C.",
      "address_line": "string",
      "ubigeo": "string",
      "department": "LIMA",
      "province": "LIMA",
      "district": "LIMA",
      "country_code": "PE",
      "email": "contacto@empresa.xyz",
      "phone": "+5112345678",
      "is_active": true,
      "id": 0,
      "created_at": "2025-08-11T16:06:45.704Z",
      "updated_at": "2025-08-11T16:06:45.704Z"
    },
    "company": {
      "ruc": "10554286805",
      "business_name": "string",
      "trade_name": "string",
      "address": "string",
      "ubigeo": "217237",
      "phone": "string",
      "email": "user@example.com",
      "logo_url": "https://example.com/",
      "sunat_username": "string",
      "certificate_path": "string",
      "beta_mode": true,
      "detraccion_account": "string",
      "is_active": true,
      "id": 0,
      "created_at": "2025-08-11T16:06:45.704Z",
      "updated_at": "2025-08-11T16:06:45.704Z"
    },
    "seller": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "email": "user@example.com",
      "full_name": "string",
      "is_active": true,
      "role_id": 0,
      "default_branch_office_id": 0,
      "current_city_id": 0,
      "created_at": "2025-08-11T16:06:45.704Z",
      "updated_at": "2025-08-11T16:06:45.704Z",
      "role_name": "string"
    },
    "branch_office_name": "string",
    "branch_office_address": "string",
    "branch_office_phone": "string",
    "pdf_file_path": "string"
  }
]
No links
422	
Validation Error

Media type

application/json
Example Value
Schema
{
  "detail": [
    {
      "loc": [
        "string",
        0
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
No links

GET
/quotations/{quotation_id}
Get Quotation


Obtiene una cotización específica por su ID con toda la información necesaria para generar PDF.

Parameters
Try it out
Name	Description
quotation_id *
integer
(path)
quotation_id
Responses
Code	Description	Links
200	
Successful Response

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "client_id": 0,
  "document_type_code": "COT",
  "series": "stri",
  "issue_date": "2025-08-11",
  "issue_time": "16:06:45.720Z",
  "valid_until": "2025-08-11",
  "operation_type_code": "0101",
  "currency_code": "PEN",
  "exchange_rate": "string",
  "payment_terms": "string",
  "payment_method_code": "str",
  "notes": "string",
  "internal_notes": "string",
  "id": 0,
  "company_id": 0,
  "number": 0,
  "ubl_version": "2.1",
  "status": "DRAFT",
  "created_by": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "total_taxable": "string",
  "total_exonerated": "string",
  "total_unaffected": "string",
  "total_free": "string",
  "total_discount": "string",
  "total_igv": "string",
  "total_isc": "string",
  "total_other_taxes": "string",
  "total_payable": "string",
  "total_in_words": "string",
  "created_at": "2025-08-11T16:06:45.720Z",
  "updated_at": "2025-08-11T16:06:45.720Z",
  "items": [],
  "client": {
    "doc_type": "6",
    "doc_number": "20123456789",
    "name": "EMPRESA XYZ S.A.C.",
    "address_line": "string",
    "ubigeo": "string",
    "department": "LIMA",
    "province": "LIMA",
    "district": "LIMA",
    "country_code": "PE",
    "email": "contacto@empresa.xyz",
    "phone": "+5112345678",
    "is_active": true,
    "id": 0,
    "created_at": "2025-08-11T16:06:45.720Z",
    "updated_at": "2025-08-11T16:06:45.720Z"
  },
  "company": {
    "ruc": "20206410498",
    "business_name": "string",
    "trade_name": "string",
    "address": "string",
    "ubigeo": "472637",
    "phone": "string",
    "email": "user@example.com",
    "logo_url": "https://example.com/",
    "sunat_username": "string",
    "certificate_path": "string",
    "beta_mode": true,
    "detraccion_account": "string",
    "is_active": true,
    "id": 0,
    "created_at": "2025-08-11T16:06:45.720Z",
    "updated_at": "2025-08-11T16:06:45.720Z"
  },
  "seller": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "user@example.com",
    "full_name": "string",
    "is_active": true,
    "role_id": 0,
    "default_branch_office_id": 0,
    "current_city_id": 0,
    "created_at": "2025-08-11T16:06:45.720Z",
    "updated_at": "2025-08-11T16:06:45.720Z",
    "role_name": "string"
  },
  "branch_office_name": "string",
  "branch_office_address": "string",
  "branch_office_phone": "string",
  "pdf_file_path": "string"
}
No links
422	
Validation Error

Media type

application/json
Example Value
Schema
{
  "detail": [
    {
      "loc": [
        "string",
        0
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
No links

DELETE
/quotations/{quotation_id}
Delete Quotation


Elimina una cotización (solo si está en estado DRAFT).

Parameters
Try it out
Name	Description
quotation_id *
integer
(path)
quotation_id
Responses
Code	Description	Links
204	
Successful Response

No links
422	
Validation Error

Media type

application/json
Example Value
Schema
{
  "detail": [
    {
      "loc": [
        "string",
        0
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
No links

PUT
/quotations/{quotation_id}/status
Update Quotation Status


Actualiza el estado de una cotización.

Parameters
Try it out
Name	Description
quotation_id *
integer
(path)
quotation_id
Request body

application/json
Example Value
Schema
{
  "status": "DRAFT",
  "notes": "string"
}
Responses
Code	Description	Links
200	
Successful Response

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "client_id": 0,
  "document_type_code": "COT",
  "series": "stri",
  "issue_date": "2025-08-11",
  "issue_time": "16:06:45.730Z",
  "valid_until": "2025-08-11",
  "operation_type_code": "0101",
  "currency_code": "PEN",
  "exchange_rate": "string",
  "payment_terms": "string",
  "payment_method_code": "str",
  "notes": "string",
  "internal_notes": "string",
  "id": 0,
  "company_id": 0,
  "number": 0,
  "ubl_version": "2.1",
  "status": "DRAFT",
  "created_by": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "total_taxable": "string",
  "total_exonerated": "string",
  "total_unaffected": "string",
  "total_free": "string",
  "total_discount": "string",
  "total_igv": "string",
  "total_isc": "string",
  "total_other_taxes": "string",
  "total_payable": "string",
  "total_in_words": "string",
  "created_at": "2025-08-11T16:06:45.730Z",
  "updated_at": "2025-08-11T16:06:45.730Z"
}
No links
422	
Validation Error

Media type

application/json
Example Value
Schema
{
  "detail": [
    {
      "loc": [
        "string",
        0
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
No links

GET
/quotations/summary/statistics
Get Quotation Summary


Obtiene un resumen estadístico de las cotizaciones.

Parameters
Try it out
Name	Description
start_date
string | (string | null)($date)
(query)
Fecha de inicio (YYYY-MM-DD)

start_date
end_date
string | (string | null)($date)
(query)
Fecha de fin (YYYY-MM-DD)

end_date
Responses
Code	Description	Links
200	
Successful Response

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "total_quotations": 0,
  "draft_quotations": 0,
  "sent_quotations": 0,
  "accepted_quotations": 0,
  "rejected_quotations": 0,
  "expired_quotations": 0,
  "converted_quotations": 0,
  "total_amount": "string",
  "conversion_rate": 0
}
No links
422	
Validation Error

Media type

application/json
Example Value
Schema
{
  "detail": [
    {
      "loc": [
        "string",
        0
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
No links

POST
/quotations/{quotation_id}/send-email
Send Quotation By Email


Marca una cotización como enviada por correo electrónico. El frontend se encarga de generar y enviar el PDF.

Parameters
Try it out
Name	Description
quotation_id *
integer
(path)
quotation_id
Request body

application/json
Example Value
Schema
{
  "additionalProp1": {}
}
Responses
Code	Description	Links
200	
Successful Response

Media type

application/json
Controls Accept header.
Example Value
Schema
"string"
No links
422	
Validation Error

Media type

application/json
Example Value
Schema
{
  "detail": [
    {
      "loc": [
        "string",
        0
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
No links

POST
/quotations/{quotation_id}/convert-to-invoice
Convert Quotation To Invoice


Convierte una cotización aceptada en una factura.

Parameters
Try it out
Name	Description
quotation_id *
integer
(path)
quotation_id
Request body

application/json
Example Value
Schema
{
  "quotation_id": 0,
  "invoice_series": "stri",
  "invoice_issue_date": "2025-08-11",
  "payment_method_code": "str",
  "notes": "string"
}
Responses
Code	Description	Links
200	
Successful Response

Media type

application/json
Controls Accept header.
Example Value
Schema
"string"
No links
422	
Validation Error

Media type

application/json
Example Value
Schema
{
  "detail": [
    {
      "loc": [
        "string",
        0
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
No links

