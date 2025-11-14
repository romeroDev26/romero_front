sunat/invoices/{invoice_id}/generate-pdf
Generar y guardar PDF de factura


Genera un PDF elegante para la factura indicada y guarda su ruta:

size '80mm' -> guarda en pdf_ticket_file_path
size '58mm' -> guarda en pdf_ticket58_file_path
size 'a4' -> guarda en pdf_a4_file_path
Parameters
Try it out
Name	Description
invoice_id *
integer
(path)
invoice_id
size
string
(query)
Tamaño: '80mm', '58mm' o 'a4'

Default value : 80mm

80mm
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