/api/v1/users/{user_id}/sales-stats
Obtener estadísticas de ventas de un usuario


Obtiene estadísticas de ventas para un usuario específico en un período determinado.

Vendedores: Pueden ver sus propias estadísticas
Administradores: Pueden ver estadísticas de cualquier usuario
Dispatchers: Pueden ver estadísticas de usuarios de su sucursal
Parámetros:

user_id: UUID del usuario del cual obtener estadísticas
period: Período de consulta
day: Estadísticas del día específico indicado en date
month: Estadísticas de todo el mes de la fecha indicada en date
year: Estadísticas de todo el año de la fecha indicada en date
date: Fecha de referencia para el período (YYYY-MM-DD)
Para day: Se consultan las ventas de esa fecha exacta
Para month: Se consultan las ventas de todo el mes de esa fecha
Para year: Se consultan las ventas de todo el año de esa fecha
Ejemplos:

period=day&date=2025-09-20: Ventas del 20 de septiembre de 2025
period=month&date=2025-09-15: Ventas de todo septiembre de 2025
period=year&date=2025-06-10: Ventas de todo el año 2025
Respuesta incluye:

Total de ventas y ingresos del período
Información de la sucursal del usuario
Desglose por categorías (pasajes vs carga)
Parameters
Cancel
Name	Description
user_id *
string($uuid)
(path)
65cd8419-1e0b-48b2-89a8-4e551885d28c
period
string
(query)
Período: day (día específico), month (mes completo), year (año completo)


day
date *
string($date)
(query)
Fecha de referencia (YYYY-MM-DD). Para month/year se usa como referencia del período

2025-09-15
Execute
Clear
Responses
Curl

curl -X 'GET' \
  'https://romeroapi-production.up.railway.app/api/v1/users/65cd8419-1e0b-48b2-89a8-4e551885d28c/sales-stats?period=day&date=2025-09-15' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTg5OTQxNTAsInN1YiI6IjM1M2VkNjBkLTQzMzctNDJjMC1hNTFhLWZiNDkyYzhhNGRlYSIsInJvbGUiOiJhZG1pbiJ9.Nzm92tZhxZaBxmRw-_vsl_-5Qs3vAJL-ZRll8NqiSOg'
Request URL
https://romeroapi-production.up.railway.app/api/v1/users/65cd8419-1e0b-48b2-89a8-4e551885d28c/sales-stats?period=day&date=2025-09-15
Server response
Code	Details
200	
Response body
Download
{
  "user_id": "65cd8419-1e0b-48b2-89a8-4e551885d28c",
  "period": "day",
  "date": "2025-09-15",
  "total_sales": 1,
  "total_revenue": 123,
  "currency": "PEN",
  "branch_office": {
    "id": 1,
    "name": "Sucursal NAUTA"
  },
  "breakdown": {
    "tickets": {
      "count": 0,
      "revenue": "0"
    },
    "cargo": {
      "count": 1,
      "revenue": "123.00"
    }
  }
}
Response headers
 content-length: 278 
 content-type: application/json 
 date: Sat,20 Sep 2025 17:30:41 GMT 
 server: railway-edge 
 x-process-time: 0.08815407752990723 
 x-railway-edge: railway/us-east4-eqdc4a 
 x-railway-request-id: 3nq9C2MxS8yvN-iLwoOzXw 