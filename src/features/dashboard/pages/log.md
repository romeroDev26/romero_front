/api/v1/admin/reports/daily-sales-detailed
Reporte de ventas diarias detallado


Devuelve ventas por usuario con detalle de factura, ítems y representantes (para RUC). Permite filtrar por sucursal, viaje, embarcación, ruta, servicio, método de pago, tipo de documento, estado SUNAT, serie, origen y destino.

Parameters
Try it out
Name	Description
start_date *
string($date)
(query)
Fecha de inicio

start_date
end_date *
string($date)
(query)
Fecha de fin

end_date
user_id *
string($uuid)
(query)
ID del vendedor (UUID, obligatorio)

user_id

ejemplo de respuesta que obtendremos:
{
  "report_type": "daily_sales_detailed_by_user",
  "generated_at": "2025-10-03T01:56:31.381Z",
  "generated_by": "string",
  "filters": {
    "additionalProp1": {}
  },
  "items": [
    {
      "invoice_id": 0,
      "document_type": "string",
      "series": "string",
      "correlative": "string",
      "issue_date": "2025-10-03T01:56:31.381Z",
      "sunat_status": "string",
      "seller_id": "string",
      "seller_name": "string",
      "seller_email": "string",
      "branch_office_name": "string",
      "client_name": "string",
      "client_doc_type": "string",
      "client_document_number": "string",
      "client_nationality": "string",
      "client_phone": "string",
      "client_email": "string",
      "currency": "string",
      "payment_method": "string",
      "payment_operation_code": "string",
      "total_subtotal": "string",
      "total_tax": "string",
      "total_amount": "string",
      "items": [
        {
          "item_id": 0,
          "product_id": 0,
          "product_name": "string",
          "service_category": "string",
          "quantity": "string",
          "unit_price": "string",
          "discount_amount": "0",
          "subtotal": "string",
          "tax_amount": "string",
          "total_amount": "string",
          "seat_number": "string",
          "trip_id": 0,
          "trip_date": "2025-10-03",
          "vessel_name": "string",
          "route_name": "string",
          "origin_port": "string",
          "destination_port": "string",
          "boarding_port_name": "string",
          "disembarking_port_name": "string"
        }
      ],
      "representatives": [
        {
          "id": 0,
          "name": "string",
          "doc_type": "string",
          "doc_number": "string",
          "phone": "string",
          "email": "string",
          "seat_number": "string",
          "vessel_name": "string",
          "trip_date": "2025-10-03",
          "boarding_stop_name": "string",
          "disembarking_stop_name": "string"
        }
      ]
    }
  ]
}

