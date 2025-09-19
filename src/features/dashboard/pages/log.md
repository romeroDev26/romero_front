GET
/api/v1/admin/reports/sales-by-branch
Reporte de ventas por sucursal


Genera un reporte detallado de ventas agrupado por sucursal con métricas de rendimiento.

Parameters
Cancel
Name	Description
start_date *
string($date)
(query)
Fecha de inicio del reporte

start_date
end_date *
string($date)
(query)
Fecha de fin del reporte

end_date
branch_office_ids
string | (string | null)
(query)
IDs de sucursales separados por comas

branch_office_ids
include_vessel_data
boolean
(query)
Incluir datos de embarcaciones


false
period_grouping
string
(query)
Agrupación temporal: DAILY, WEEKLY, MONTHLY, YEARLY


daily
include_seller_details
boolean
(query)
Incluir detalles completos de todos los vendedores por sucursal


true
Execute
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
  "report_type": "sales_by_branch",
  "generated_at": "2025-09-19T15:15:10.307Z",
  "generated_by": "string",
  "filters": {
    "start_date": "2025-09-19",
    "end_date": "2025-09-19",
    "branch_office_ids": [
      0
    ],
    "include_vessel_data": false,
    "period_grouping": "daily",
    "include_seller_details": true
  },
  "items": [
    {
      "branch_office_id": 0,
      "branch_office_name": "string",
      "branch_office_address": "string",
      "branch_office_phone": "string",
      "total_invoices": 0,
      "total_amount": "string",
      "total_discount": "0",
      "total_tax": "0",
      "average_ticket": "0",
      "total_passengers": 0,
      "sellers": [
        {
          "seller_id": 0,
          "seller_name": "string",
          "seller_email": "string",
          "total_invoices": 0,
          "total_amount": "string",
          "total_discount": "0",
          "total_tax": "0",
          "average_ticket": "0",
          "total_passengers": 0,
          "ranking_position": 0,
          "percentage_of_branch_sales": "0"
        }
      ],
      "top_seller_name": "string",
      "top_seller_amount": "string"
    }
  ],
  "summary": {
    "total_branches": 0,
    "total_invoices": 0,
    "total_amount": "string",
    "total_discount": "string",
    "total_tax": "string",
    "average_per_branch": "string",
    "top_branch_name": "string",
    "top_branch_amount": "string"
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