/external/whatsapp/send-document
Enviar documento por WhatsApp (JSON con base64/URL)


Envía un documento (PDF, imagen, etc.) a través de WhatsApp usando Evolution API.

number: Número de teléfono con código de país (ej: 51987654321)
caption: Texto que acompaña al documento
media: URL del archivo o contenido en base64
fileName: Nombre del archivo
mimetype: Tipo MIME del archivo (default: application/pdf)
instance_name: Nombre de la instancia de Evolution API (opcional, default: "default")
Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "number": "string",
  "caption": "string",
  "media": "string",
  "fileName": "string",
  "mimetype": "application/pdf",
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

romero_ventas esta es la instancia de Evolution API que se usa para enviar documentos por WhatsApp.
