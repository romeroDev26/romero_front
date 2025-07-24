PATCH /clients/{client_id}
Actualizar un cliente


Actualiza los datos de un cliente existente.

Se requiere rol sales o admin.

Parameters
Try it out
Name	Description
client_id *
integer
(path)
client_id
Request body

application/json
Example Value
Schema
{
  "doc_type": "0",
  "doc_number": "string",
  "name": "string",
  "address": "string",
  "ubigeo": "716760",
  "email": "user@example.com",
  "phone": "string",
  "is_active": true,
  "sunat_trade_name": "string",
  "sunat_state": "string",
  "sunat_condition": "string",
  "last_api_query": "2025-07-24T04:04:44.963Z"
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
  "created_at": "2025-07-24T04:04:45.048Z",
  "updated_at": "2025-07-24T04:04:45.048Z"
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

