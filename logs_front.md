GET
/operations/trips/{trip_id}/seat-map
Obtener el mapa de asientos para un viaje


Devuelve una lista completa de todos los asientos individuales para un viaje específico, cada uno con su estado (Disponible, Reservado, Ocupado, etc.) y los detalles de su tipo de asiento.

Esta es la fuente de datos para dibujar el mapa visual de asientos en el frontend.

Parameters
Cancel
Name	Description
trip_id *
integer
(path)
205
Execute
Clear
Responses
Curl

curl -X 'GET' \
  'https://romeroapi-production.up.railway.app/api/v1/operations/trips/205/seat-map' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTM5NDAyNjEsInN1YiI6IjY3NzBmMTNiLWQzYTUtNDQwNC1hMDUxLTI3NmJlNGNjMmVlYiIsInJvbGUiOiJhZG1pbiJ9.iQvEmhQ7XXqhjnioVZhFTmrHG_zcCo4CDltn1f_k8UQ'
Request URL
https://romeroapi-production.up.railway.app/api/v1/operations/trips/205/seat-map
Server response
Code	Details
204
Undocumented
Response headers
 date: Thu,24 Jul 2025 05:38:25 GMT 
 server: railway-edge 
 x-process-time: 0.20555639266967773 
 x-railway-edge: railway/us-east4-eqdc4a 
 x-railway-request-id: Rtkjaaj2TeGHUbW4Cx5-qw 
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
    "trip_id": 0,
    "vessel_seat_config_id": 0,
    "seat_number": "string",
    "status": "AVAILABLE",
    "notes": "string",
    "id": 0,
    "seat_type": {
      "name": "VIP Panorámico",
      "code": "VIP",
      "description": "string",
      "price_multiplier": 1,
      "is_active": true,
      "display_order": 0,
      "id": 0,
      "created_at": "2025-07-24T05:45:24.176Z"
    }
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

