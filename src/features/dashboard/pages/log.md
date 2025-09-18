
/api/v1/admin/reports/daily-sales
Reporte de ventas diarias


Reporte detallado de ventas diarias. Si no se especifica user_id, retorna datos de todos los usuarios.

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
user_id
integer | (integer | null)
(query)
ID del vendedor (opcional - si no se especifica, retorna todos)

user_id
branch_office_id
integer | (integer | null)
(query)
ID de la sucursal

branch_office_id
payment_method
string | (string | null)
(query)
Método de pago

payment_method
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
  "report_type": "daily_sales_by_user",
  "generated_at": "2025-09-18T19:36:11.817Z",
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
      "issue_date": "2025-09-18T19:36:11.817Z",
      "sunat_status": "string",
      "seller_id": 0,
      "seller_name": "string",
      "seller_email": "string",
      "branch_office_name": "string",
      "client_name": "string",
      "client_document_number": "string",
      "client_nationality": "string",
      "client_phone": "string",
      "client_email": "string",
      "trip_date": "2025-09-18",
      "boarding_time": "string",
      "vessel_name": "string",
      "origin_port": "string",
      "destination_port": "string",
      "route_name": "string",
      "service_description": "string",
      "quantity": "string",
      "unit_price": "string",
      "discount_amount": "0",
      "seat_number": "string",
      "currency": "string",
      "subtotal": "string",
      "tax_amount": "string",
      "total_amount": "string",
      "payment_method": "string",
      "payment_operation_code": "string"
    }
  ],
  "summary": {
    "total_invoices": 0,
    "total_amount": "string",
    "total_discount": "string",
    "total_tax": "string",
    "payment_methods_summary": {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    },
    "sellers_summary": {
      "additionalProp1": {
        "additionalProp1": {}
      },
      "additionalProp2": {
        "additionalProp1": {}
      },
      "additionalProp3": {
        "additionalProp1": {}
      }
    }
  }
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