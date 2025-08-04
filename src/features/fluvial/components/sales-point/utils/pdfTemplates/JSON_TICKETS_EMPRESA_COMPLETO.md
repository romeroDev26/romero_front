# Cambios Mínimos Requerido      // AGREGAR: Items a    // MANTENER: Todos los totales SUNAT actuales
    "total_exonerated": "225.00", // RECALCULAR según nuevos items
    "total_payable": "225.00", // RECALCULAR según nuevos items
    "total_discount": "50.00" // RECALCULAR: suma de discounts de itemsonales SI HAY equipaje/seguros
      {
        "item_type": "additional_service", // NUEVO
        "product_id": 2,
        "product_name": "Exceso de Equipaje",
        "item_description": "Exceso de Equipaje",
        "quantity": "1.0000",
        "unit_price": "57.0000000000",
        "discount": "0.00",
        "total_line": "57.00"
        // ... resto de campos iguales a estructura actual
      }ts Empresariales

## 📋 **JSON Actual vs JSON Requerido**

### 🔍 **Comparación con JSON Actual del Backend**

Tu backend YA envía una estructura muy buena. Solo necesitas estos **cambios mínimos**:

```json
{
  "invoice": {
    // ... TODOS los campos actuales se mantienen igual ...
    
    "items": [
      {
        // ✅ MANTENER: Todos los campos actuales
        "product_id": 1,
        "quantity": "5.0000", // 🔄 CAMBIAR: de "1.0000" a número de asientos
        "item_description": "Servicio de Transporte de Pasajeros. Asientos: 12,13,14,15,16. Descuento: ", // 🔄 CAMBIAR: incluir lista
        "unit_price": "132.6000000000",
        "discount": "50.00", // 🔄 CAMBIAR: de "0.00" a descuento real si aplica
        "total_line": "613.00", // 🔄 RECALCULAR: quantity * unit_price - discount
        
        // ➕ AGREGAR: Solo estos 2 campos nuevos
        "seat_numbers": ["12", "13", "14", "15", "16"], // NUEVO: array de asientos
        "item_type": "transport_service" // NUEVO: identificador de tipo
      },
      // ➕ AGREGAR: Items adicionales SI HAY equipaje/
      {
        "item_type": "additional_service", // NUEVO
        "product_id": 2,
        "product_name": "Equipaje Adicional",
        "item_description": "Equipaje extra",
        "unit_price": "15.0000000000",
        "discount": "0.00",
        "total_line": "45.00"
        // ... resto de campos iguales a estructura actual
      }
    ],
    
    // ✅ MANTENER: Todos los totales SUNAT actuales
    "total_exonerated": "658.00", // RECALCULAR según nuevos items
    "total_payable": "717.00", // RECALCULAR según nuevos items
    "total_discount": "50.00" // RECALCULAR: suma de discounts de items
  },

  "representatives": [
    // ✅ MANTENER: Estructura actual exacta, solo asegurar que tienes 5+ representantes
    {
      "passenger_name": "WILMER ALEXANDER EDQUÉN BARBOZA",
      "passenger_doc_type": "1",
      "passenger_doc_number": "76307497", 
      "seat_number": "12", // ✅ YA LO TIENES
      // ... resto igual
    }
    // ... 4 representantes más
  ],

  "summary": {
    // ✅ MANTENER: Campos actuales
    "invoice_id": 488,
    "max_allowed": 10, // ✅ YA LO TIENES
    "current_count": 5, // 🔄 CAMBIAR: a número real de representantes
    "remaining": 5, // 🔄 CALCULAR: max_allowed - current_count
    "can_add_more": true,
    
    // ➕ AGREGAR: Solo este campo nuevo para el ticket
    "seat_numbers_list": "12, 13, 14, 15, 16" // NUEVO: para mostrar en ticket
  }
}
```

## 🎯 **Resumen de Cambios Mínimos para tu Backend:**

### 1. **En `items[0]` (servicio de transporte):**
- `quantity`: Cambiar de `"1.0000"` a `"5.0000"` (número de asientos)
- `item_description`: Incluir lista de asientos
- `discount`: Poner descuento real si aplica (en soles)
- `total_line`: Recalcular con descuento
- **AGREGAR:** `seat_numbers: ["12","13","14","15","16"]`
- **AGREGAR:** `item_type: "transport_service"`

### 2. **Si hay servicios adicionales:**
- **AGREGAR:** Items extra para equipaje, etc. (opcional)

### 3. **En `summary`:**
- `current_count`: Poner número real de representantes (5 en lugar de 1)
- **AGREGAR:** `seat_numbers_list: "12, 13, 14, 15, 16"`

### 4. **Recalcular totales:**
- `total_exonerated`, `total_payable`, `total_discount` según nuevos items

## Ventajas de esta Propuesta:
- Mínima invasión: 90% de tu estructura actual se mantiene
- Cambios puntuales: Solo quantity, descriptions y 2 campos nuevos
- Dinámico: Lista de asientos y cantidades se generan automáticamente
- Compatible: Funciona igual que ticket normal pero con múltiples asientos
```

## Beneficios de esta Estructura Corregida

### 1. **Descuentos por Servicio Individual (en Soles)**
- **Transporte:** S/ 50.00 de descuento aplicado solo al servicio de transporte
- **Equipaje:** Sin descuento (S/ 0.00)
- Cada servicio maneja su propio descuento independientemente

### 2. **Estructura Simplificada en Items**
```json
"items": [
  {
    "item_type": "transport_service",      // Identifica el tipo de servicio
    "quantity": "5.0000",                  // = número de asientos comprados
    "seat_numbers": ["12","13","14","15","16"], // Lista dinámica de asientos
    "discount": "50.00",                   // Descuento EN SOLES para este servicio
    "total_line": "613.00"                // subtotal - discount
  },
  {
    "item_type": "additional_service",     // Equipaje como servicio separado
    "quantity": "1.0000",                  // Cantidad fija
    "discount": "0.00",                    // Sin descuento en equipaje
    "total_line": "57.00"                  // Precio total del servicio
  }
]
```

### 3. **Desglose en el Ticket (igual que ticket normal)**
```
DETALLE DE LA VENTA
CANT. DESCRIPCIÓN                    P/U     TOTAL
5     Transporte Nauta-Yurimaguas   132.60  663.00
      Asientos: 12,13,14,15,16
      (descuento: 50.00)                   613.00
      
1     Exceso de Equipaje             57.00   57.00
                                    ---------------
                             TOTAL A PAGAR: 670.00
```

### 4. **Información Dinámica Extraída**
- **Lista de asientos:** Extraída del array `seat_numbers` en item de transporte
- **Cantidad total:** Calculada dinámicamente desde `representatives.length`
- **Resumen:** "12, 13, 14, 15, 16" generado automáticamente
- **Descuentos:** Mostrados por servicio igual que en ticket normal

## Cambios Clave para tu Backend

### Lo que SÍ necesitas cambiar:
1. **En items[0] (transporte):** Agregar `seat_numbers` array y `item_type`
2. **Quantity:** Debe ser igual al número de asientos comprados  
3. **Discount:** En soles, aplicado por servicio individual
4. **Servicios adicionales:** Como items separados (equipaje, etc.)

### Lo que NO necesitas:
- Campos extras como `seat_breakdown`, `additional_services`, `applied_discounts`
- Descuentos por porcentaje
- Totales pre-calculados adicionales

Todo se extrae dinámicamente del array `items` igual que en el ticket normal.
