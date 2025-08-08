/external/whatsapp/send-invoice-pdf
Enviar comprobante por WhatsApp (descarga automática desde Bunny CDN)


Envía un comprobante (factura/boleta) por WhatsApp descargando automáticamente el PDF desde Bunny CDN.

Este endpoint:

Obtiene los datos del comprobante desde la base de datos
Descarga el PDF desde Bunny CDN temporalmente
Envía el PDF por WhatsApp usando base64
Limpia el archivo temporal
invoice_id: ID del comprobante en la base de datos
phone_number: Número de teléfono con código de país (ej: 51987654321)
custom_message: Mensaje personalizado (opcional)
pdf_type: Tipo de PDF a enviar ("a4", "ticket", "legacy") - default: "a4"
instance_name: Nombre de la instancia de Evolution API (opcional, default: "default")
Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "invoice_id": 0,
  "phone_number": "string",
  "custom_message": "string",
  "pdf_type": "a4",
  "instance_name": "default"
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
  "additionalProp1": {}
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

usar romero_ventas como instancia_name del servicio de Evolution API.