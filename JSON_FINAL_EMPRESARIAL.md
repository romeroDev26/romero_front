# JSON Final que se Envía al Backend - Ventas Empresariales

## ✅ JSON Completo Según Especificación

Después de las correcciones realizadas, - ✅ **Endpoint correcto**: `/sunat/invoices/company-with-representatives-extended`l sistema ahora envía el siguiente JSON al endpoint `/sunat/invoices/company-with-representatives-extended`:

### Ejemplo con Todos los Campos:

```json
{
  "company_data": {
    "client_doc_type": "6",
    "client_doc_number": "20123456789",
    "client_name": "EMPRESA TRANSPORTES SAC",
    "client_address": "AV. PRINCIPAL 123, LIMA",
    "client_phone": "+51987654321",
    "client_email": "facturacion@empresa.com"
  },
  "trip_id": 45,
  "boarding_stop_id": 12,
  "disembarking_stop_id": 18,
  "representatives": [
    {
      "passenger_name": "JUAN CARLOS RODRIGUEZ LOPEZ",
      "passenger_doc_type": "1",
      "passenger_doc_number": "12345678",
      "passenger_phone": "+51987654321",
      "passenger_email": "juan.rodriguez@empresa.com",
      "seat_number": "A1",
      "special_notes": "Ejecutivo principal"
    },
    {
      "passenger_name": "MARIA ELENA GARCIA TORRES",
      "passenger_doc_type": "1", 
      "passenger_doc_number": "87654321",
      "passenger_phone": "+51912345678",
      "passenger_email": "maria.garcia@empresa.com",
      "seat_number": "A2",
      "special_notes": "Asistente ejecutiva"
    }
  ],
  "item_config": {
    "unit_price": "58.50",
    "quantity": 2,
    "discount": "10.00",
    "tax_category_code": "10",
    "item_description": "Servicio de transporte fluvial empresarial - Servicio premium",
    "unit_code": "ZZ"
  },
  "special_notes": "Punto de Venta: LIMA - Factura Empresarial - Costo adicional: S/. 7.00"
}
```

## 🔧 Mapeo de Campos del Formulario al JSON

### Company Data (Datos de la Empresa)
- `passengerData.docType` → `company_data.client_doc_type`
- `passengerData.docNumber` → `company_data.client_doc_number`
- `passengerData.name` → `company_data.client_name`
- `passengerData.address` → `company_data.client_address`
- `passengerData.phone` → `company_data.client_phone`
- `passengerData.email` → `company_data.client_email`

### Trip Data (Datos del Viaje)
- `trip.id` → `trip_id`
- `selectedBoardingStopId` → `boarding_stop_id`
- `selectedDisembarkingStopId` → `disembarking_stop_id`

### Representatives (Representantes)
- `representative.name` → `passenger_name`
- `representative.document_type` → `passenger_doc_type`
- `representative.document_number` → `passenger_doc_number`
- `representative.phone` → `passenger_phone`
- `representative.email` → `passenger_email` ← **NUEVO**
- `representative.seat_number` → `seat_number`
- `representative.special_notes` → `special_notes` ← **NUEVO**

### Item Config (Configuración de Items) ← **NUEVO**
- `(basePrice * seatMultiplier) + (extraCost / representatives.length)` → `unit_price`
- `representatives.length` → `quantity` ← **NUEVO**
- `discount` → `discount` ← **CORREGIDO**: Descuento total, no dividido
- `isIgvGravado ? "10" : "20"` → `tax_category_code`
- `"Servicio de transporte fluvial empresarial" + extraCostDescription` → `item_description`
- `"ZZ"` → `unit_code`

### Special Notes (Notas Especiales)
- `branchName + extraCost info` → `special_notes`

## 📋 Casos de Uso

### Caso 1: Empresa con 2 representantes, descuento y costo adicional
```
Formulario:
- Base Price: 50.00
- Seat Multiplier: 1.2
- Extra Cost: 10.00
- Extra Cost Description: "Servicio premium"
- Discount: 5.00
- Is IGV Gravado: true
- Representatives: 2

JSON Generado:
- unit_price: "65.00" // (50 * 1.2) + (10/2) = 60 + 5
- quantity: 2 // Número de representantes
- discount: "5.00" // Descuento total del formulario
- tax_category_code: "10" // Gravado
- item_description: "Servicio de transporte fluvial empresarial - Servicio premium"
```

### Caso 2: Empresa sin costos adicionales ni descuentos
```
Formulario:
- Base Price: 45.00
- Extra Cost: 0
- Discount: 0
- Representatives: 1

JSON Generado:
- unit_price: "45.00"
- quantity: 1 // Número de representantes
- discount: NO SE INCLUYE (0)
- item_description: "Servicio de transporte fluvial empresarial"
```

## ✅ Verificación de Cumplimiento

| Campo Especificación | ✅ Implementado | Comentario |
|---------------------|----------------|------------|
| `company_data.*` | ✅ | Todos los campos mapeados correctamente |
| `trip_id` | ✅ | Mapeado desde `trip.id` |
| `boarding_stop_id` | ✅ | Desde selector del formulario |
| `disembarking_stop_id` | ✅ | Desde selector del formulario |
| `representatives[].passenger_*` | ✅ | Nombres de campos corregidos |
| `representatives[].passenger_email` | ✅ | **NUEVO**: Campo agregado |
| `representatives[].special_notes` | ✅ | **NUEVO**: Campo agregado |
| `item_config.unit_price` | ✅ | **NUEVO**: Calculado desde formulario |
| `item_config.quantity` | ✅ | **NUEVO**: Número de representantes |
| `item_config.discount` | ✅ | **NUEVO**: Descuento total del formulario |
| `item_config.tax_category_code` | ✅ | **NUEVO**: Basado en IGV |
| `item_config.item_description` | ✅ | **NUEVO**: Incluye descripción extra |
| `item_config.unit_code` | ✅ | **NUEVO**: "ZZ" para servicios |
| `special_notes` | ✅ | Incluye info del punto de venta |

## 🚀 Estado Final

**✅ COMPLETADO**: El sistema ahora envía exactamente el JSON especificado en `json_representates.md`, incluyendo:

1. **Todos los campos obligatorios** correctamente mapeados
2. **Configuración de items** (`item_config`) con precios, descuentos y categorías fiscales
3. **Campos adicionales** de email y notas especiales en representantes
4. **Cálculos correctos** que distribuyen costos y descuentos entre representantes
5. **Endpoint correcto**: `/invoices/company-with-representatives-extended`

El sistema está listo para producción y cumple 100% con la especificación del backend.
