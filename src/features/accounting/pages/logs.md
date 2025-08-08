POST
/sunat/credit-notes/annul
Create Credit Note For Annulment Endpoint


Crea una Nota de Crédito para anular una factura/boleta existente.

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "invoice_id": 0,
  "credit_note_series": "string",
  "reason": "string"
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
  "company_id": 0,
  "client_id": 0,
  "document_type_code": "07",
  "series": "FC01",
  "issue_date": "2025-08-07",
  "issue_time": "23:49:21.986Z",
  "currency_code": "PEN",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-12345",
  "credit_note_type_code": "st",
  "reason": "string",
  "id": 0,
  "number": 0,
  "total_payable": "string",
  "total_in_words": "string",
  "xml_file_path": "string",
  "signed_xml_file_path": "string",
  "zip_file_path": "string",
  "cdr_file_path": "string",
  "sunat_status": "string",
  "sunat_response_description": "string",
  "qr_code_data": "string",
  "created_by": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "created_at": "2025-08-07T23:49:21.986Z",
  "updated_at": "2025-08-07T23:49:21.986Z",
  "pdf_file_path": "string",
  "pdf_a4_file_path": "string",
  "pdf_ticket_file_path": "string",
  "items": []
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
/sunat/credit-notes/
Create Credit Note


Crea una nueva Nota de Crédito y la encola para su envío a SUNAT.

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "company_id": 0,
  "client_id": 0,
  "document_type_code": "07",
  "series": "FC01",
  "issue_date": "2025-08-07",
  "issue_time": "23:49:21.950Z",
  "currency_code": "PEN",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-12345",
  "credit_note_type_code": "st",
  "reason": "string",
  "items": [
    {
      "product_id": 0,
      "quantity": 1,
      "unit_code": "str",
      "unit_price": 0,
      "price_with_tax": 0,
      "price_type_code": "01",
      "discount": 0,
      "tax_category_code": "stri"
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
  "company_id": 0,
  "client_id": 0,
  "document_type_code": "07",
  "series": "FC01",
  "issue_date": "2025-08-07",
  "issue_time": "23:49:21.951Z",
  "currency_code": "PEN",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-12345",
  "credit_note_type_code": "st",
  "reason": "string",
  "id": 0,
  "number": 0,
  "total_payable": "string",
  "total_in_words": "string",
  "xml_file_path": "string",
  "signed_xml_file_path": "string",
  "zip_file_path": "string",
  "cdr_file_path": "string",
  "sunat_status": "string",
  "sunat_response_description": "string",
  "qr_code_data": "string",
  "created_by": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "created_at": "2025-08-07T23:49:21.951Z",
  "updated_at": "2025-08-07T23:49:21.951Z",
  "pdf_file_path": "string",
  "pdf_a4_file_path": "string",
  "pdf_ticket_file_path": "string",
  "items": []
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
/sunat/credit-notes/
Read Credit Notes


Busca y devuelve una lista de notas de crédito con filtros opcionales.

Parameters
Try it out
Name	Description
skip
integer
(query)
Default value : 0

0
minimum: 0
limit
integer
(query)
Default value : 100

100
maximum: 500
minimum: 1
company_id
integer | (integer | null)
(query)
Filtrar por ID de la compañía

company_id
series
string | (string | null)
(query)
Filtrar por serie del documento

series
number
integer | (integer | null)
(query)
Filtrar por número del documento

number
start_date
string | (string | null)($date)
(query)
Fecha de inicio para el rango de búsqueda

start_date
end_date
string | (string | null)($date)
(query)
Fecha de fin para el rango de búsqueda

end_date
client_search
string | (string | null)
(query)
Buscar por DNI/RUC o nombre del cliente

client_search
sunat_status
string | (string | null)
(query)
Filtrar por estado SUNAT

Available values : PENDING, GENERATED, SIGNED, SENT, ACCEPTED, REJECTED, OBSERVED, VOIDED, ERROR


--
period
string | (string | null)
(query)
Filtrar por un periodo de tiempo predefinido

Available values : LAST_WEEK, LAST_MONTH, LAST_3_MONTHS, LAST_YEAR


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
{
  "credit_notes": [
    {
      "additionalProp1": {}
    }
  ],
  "total": 0,
  "skip": 0,
  "limit": 0,
  "message": "string",
  "error": "string"
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

