# Especificación API Backend - Reportes Detallados

## 📋 Objetivo

Definir la estructura **óptima y completa** del JSON que el backend debe retornar para el endpoint `/admin/reports/daily-sales`, eliminando la necesidad de hacer cálculos complejos en el frontend.

---

## 🎯 Principios de Diseño

1. ✅ **Backend calcula TODO** - El frontend solo renderiza
2. ✅ **JSON optimizado** - Solo datos necesarios, sin redundancia
3. ✅ **Pre-agregado** - Todas las métricas agrupadas y calculadas
4. ✅ **Listo para usar** - Formato directo para gráficos y tablas
5. ✅ **Tipos correctos** - Números como números, no strings

---

## 🔗 Endpoint Principal

```http
GET /admin/reports/daily-sales
```

### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `start_date` | string (YYYY-MM-DD) | ✅ Sí | Fecha de inicio del reporte |
| `end_date` | string (YYYY-MM-DD) | ✅ Sí | Fecha de fin del reporte |
| `user_id` | number | ❌ No | Filtrar por ID de vendedor específico |
| `branch_office_id` | number | ❌ No | Filtrar por ID de sucursal |
| `payment_method` | string | ❌ No | Filtrar por método de pago |

### Ejemplo de Request

```http
GET /admin/reports/daily-sales?start_date=2025-10-01&end_date=2025-10-31
```

---

## 📦 Estructura del JSON Response

### Estructura General

```typescript
interface DailySalesReportResponse {
  // Metadata del reporte
  report_metadata: ReportMetadata;
  
  // Resumen ejecutivo con TODOS los cálculos
  summary: ReportSummary;
  
  // Métricas agregadas por categorías
  metrics: ReportMetrics;
  
  // Items detallados SOLO para la tabla (paginados si es necesario)
  items: SalesItem[];
  
  // Información de paginación (si aplica)
  pagination?: Pagination;
}
```

---

## 🏷️ 1. Report Metadata

Información básica del reporte generado.

```typescript
interface ReportMetadata {
  report_type: "daily_sales";
  generated_at: string;        // ISO 8601: "2025-11-03T14:30:00Z"
  generated_by: string;         // Email del usuario que genera: "admin@transportes.com"
  period: {
    start_date: string;         // "2025-10-01"
    end_date: string;           // "2025-10-31"
    total_days: number;         // 31
  };
  filters_applied: {
    user_id?: number;
    branch_office_id?: number;
    payment_method?: string;
  };
}
```

### Ejemplo JSON

```json
{
  "report_metadata": {
    "report_type": "daily_sales",
    "generated_at": "2025-11-03T14:30:00Z",
    "generated_by": "admin@transportes.com",
    "period": {
      "start_date": "2025-10-01",
      "end_date": "2025-10-31",
      "total_days": 31
    },
    "filters_applied": {}
  }
}
```

---

## 📊 2. Summary - Resumen Ejecutivo

**TODOS los totales principales ya calculados.**

```typescript
interface ReportSummary {
  // Totales generales
  totals: {
    total_invoices: number;           // Total de facturas emitidas
    total_receipts: number;           // Total de boletas emitidas
    total_credit_notes: number;       // Total de notas de crédito
    total_debit_notes: number;        // Total de notas de débito
    total_documents: number;          // Suma de todos los documentos
    
    // Montos financieros (números, NO strings)
    gross_sales: number;              // Ventas brutas (sin restar NC)
    total_credit_notes_amount: number; // Total en notas de crédito (POSITIVO)
    total_debit_notes_amount: number;  // Total en notas de débito (POSITIVO)
    net_sales: number;                // Ventas netas = gross - NC + ND
    
    total_subtotal: number;           // Suma de subtotales (sin IGV)
    total_igv: number;                // Total de IGV recaudado
    total_discounts: number;          // Total de descuentos aplicados
    total_payable: number;            // Total a pagar (net_sales)
    
    // Promedios
    average_ticket: number;           // Promedio por transacción
    average_daily_sales: number;      // Promedio de ventas por día
  };
  
  // Desglose por moneda (si aplica)
  by_currency: {
    currency_code: string;            // "PEN", "USD"
    total_amount: number;
    invoice_count: number;
  }[];
}
```

### Ejemplo JSON

```json
{
  "summary": {
    "totals": {
      "total_invoices": 245,
      "total_receipts": 180,
      "total_credit_notes": 12,
      "total_debit_notes": 3,
      "total_documents": 440,
      
      "gross_sales": 125500.00,
      "total_credit_notes_amount": 3200.00,
      "total_debit_notes_amount": 450.00,
      "net_sales": 122750.00,
      
      "total_subtotal": 104025.42,
      "total_igv": 18724.58,
      "total_discounts": 1250.00,
      "total_payable": 122750.00,
      
      "average_ticket": 285.34,
      "average_daily_sales": 3959.68
    },
    "by_currency": [
      {
        "currency_code": "PEN",
        "total_amount": 122750.00,
        "invoice_count": 440
      }
    ]
  }
}
```

---

## 📈 3. Metrics - Métricas Agregadas

**Todas las agrupaciones y cálculos necesarios para los gráficos.**

```typescript
interface ReportMetrics {
  // Métodos de pago
  payment_methods: PaymentMethodMetric[];
  
  // Top vendedores
  top_sellers: SellerMetric[];
  
  // Rutas populares
  popular_routes: RouteMetric[];
  
  // Estados SUNAT
  sunat_status: SunatStatusMetric[];
  
  // Tipos de documento
  document_types: DocumentTypeMetric[];
  
  // Ventas diarias (para gráfico de línea)
  daily_breakdown: DailyBreakdown[];
  
  // Notas de crédito y débito detalladas
  adjustments: AdjustmentsMetric;
}
```

### 3.1. Payment Methods

```typescript
interface PaymentMethodMetric {
  payment_method: string;           // "EFECTIVO", "TRANSFERENCIA", etc.
  display_name: string;             // "Efectivo", "Transferencia Bancaria"
  total_amount: number;             // Total en este método (ya con NC/ND aplicados)
  transaction_count: number;        // Cantidad de transacciones
  percentage: number;               // Porcentaje del total (0-100)
  color?: string;                   // Color sugerido para gráficos (opcional)
}
```

**Ejemplo JSON:**
```json
{
  "payment_methods": [
    {
      "payment_method": "EFECTIVO",
      "display_name": "Efectivo",
      "total_amount": 45680.00,
      "transaction_count": 156,
      "percentage": 37.21,
      "color": "#10B981"
    },
    {
      "payment_method": "TRANSFERENCIA",
      "display_name": "Transferencia Bancaria",
      "total_amount": 38920.00,
      "transaction_count": 142,
      "percentage": 31.71,
      "color": "#3B82F6"
    },
    {
      "payment_method": "TARJETA",
      "display_name": "Tarjeta de Crédito/Débito",
      "total_amount": 28150.00,
      "transaction_count": 98,
      "percentage": 22.94,
      "color": "#8B5CF6"
    },
    {
      "payment_method": "YAPE",
      "display_name": "Yape",
      "total_amount": 10000.00,
      "transaction_count": 44,
      "percentage": 8.14,
      "color": "#EC4899"
    }
  ]
}
```

### 3.2. Top Sellers

```typescript
interface SellerMetric {
  seller_id: string;                // UUID del vendedor
  seller_name: string;              // Nombre completo
  seller_email: string;             // Email
  
  // Estadísticas
  total_invoices: number;           // Facturas + boletas (sin NC/ND)
  total_credit_notes: number;       // Notas de crédito emitidas
  total_debit_notes: number;        // Notas de débito emitidas
  
  gross_sales: number;              // Ventas brutas
  credit_notes_amount: number;      // Monto en NC
  debit_notes_amount: number;       // Monto en ND
  net_sales: number;                // Venta neta
  
  average_ticket: number;           // Promedio por transacción
  total_passengers: number;         // Total de pasajeros atendidos
  
  ranking_position: number;         // Posición en el ranking (1, 2, 3...)
  percentage_of_total: number;      // % del total de ventas
}
```

**Ejemplo JSON (Top 10):**
```json
{
  "top_sellers": [
    {
      "seller_id": "123e4567-e89b-12d3-a456-426614174000",
      "seller_name": "Juan Pérez García",
      "seller_email": "juan.perez@transportes.com",
      
      "total_invoices": 89,
      "total_credit_notes": 3,
      "total_debit_notes": 1,
      
      "gross_sales": 35800.00,
      "credit_notes_amount": 850.00,
      "debit_notes_amount": 120.00,
      "net_sales": 35070.00,
      
      "average_ticket": 402.36,
      "total_passengers": 142,
      
      "ranking_position": 1,
      "percentage_of_total": 28.57
    },
    {
      "seller_id": "987fcdeb-51a2-43f7-b123-456789abcdef",
      "seller_name": "María López Sánchez",
      "seller_email": "maria.lopez@transportes.com",
      
      "total_invoices": 78,
      "total_credit_notes": 2,
      "total_debit_notes": 0,
      
      "gross_sales": 28950.00,
      "credit_notes_amount": 450.00,
      "debit_notes_amount": 0.00,
      "net_sales": 28500.00,
      
      "average_ticket": 371.15,
      "total_passengers": 118,
      
      "ranking_position": 2,
      "percentage_of_total": 23.21
    }
  ]
}
```

### 3.3. Popular Routes

```typescript
interface RouteMetric {
  route_id: number;                 // ID de la ruta
  route_name: string;               // Nombre de la ruta
  origin_port: string;              // Puerto de origen
  destination_port: string;         // Puerto de destino
  display_name: string;             // "Iquitos → Yurimaguas"
  
  // Estadísticas
  total_passengers: number;         // Total de pasajeros
  total_cargo_items: number;        // Total de items de carga
  total_trips: number;              // Cantidad de viajes
  
  total_revenue: number;            // Ingresos totales
  average_ticket_price: number;     // Precio promedio por pasajero
  
  percentage_of_passengers: number; // % del total de pasajeros
  
  // Embarcaciones utilizadas
  vessels_used: {
    vessel_name: string;
    trip_count: number;
  }[];
}
```

**Ejemplo JSON (Top 8):**
```json
{
  "popular_routes": [
    {
      "route_id": 1,
      "route_name": "Iquitos - Yurimaguas",
      "origin_port": "Iquitos",
      "destination_port": "Yurimaguas",
      "display_name": "Iquitos → Yurimaguas",
      
      "total_passengers": 287,
      "total_cargo_items": 45,
      "total_trips": 12,
      
      "total_revenue": 42800.00,
      "average_ticket_price": 149.13,
      
      "percentage_of_passengers": 34.15,
      
      "vessels_used": [
        {
          "vessel_name": "Eduardo I",
          "trip_count": 8
        },
        {
          "vessel_name": "Gilmer IV",
          "trip_count": 4
        }
      ]
    },
    {
      "route_id": 2,
      "route_name": "Yurimaguas - Iquitos",
      "origin_port": "Yurimaguas",
      "destination_port": "Iquitos",
      "display_name": "Yurimaguas → Iquitos",
      
      "total_passengers": 254,
      "total_cargo_items": 38,
      "total_trips": 11,
      
      "total_revenue": 37920.00,
      "average_ticket_price": 149.29,
      
      "percentage_of_passengers": 30.21,
      
      "vessels_used": [
        {
          "vessel_name": "Eduardo I",
          "trip_count": 7
        },
        {
          "vessel_name": "Gilmer IV",
          "trip_count": 4
        }
      ]
    }
  ]
}
```

### 3.4. SUNAT Status

```typescript
interface SunatStatusMetric {
  status: string;                   // "ACEPTADO", "RECHAZADO", "PENDIENTE", etc.
  display_name: string;             // "Aceptado por SUNAT"
  count: number;                    // Cantidad de documentos
  percentage: number;               // Porcentaje del total
  color?: string;                   // Color sugerido
}
```

**Ejemplo JSON:**
```json
{
  "sunat_status": [
    {
      "status": "ACEPTADO",
      "display_name": "Aceptado por SUNAT",
      "count": 412,
      "percentage": 93.64,
      "color": "#10B981"
    },
    {
      "status": "PENDIENTE",
      "display_name": "Pendiente de envío",
      "count": 18,
      "percentage": 4.09,
      "color": "#F59E0B"
    },
    {
      "status": "RECHAZADO",
      "display_name": "Rechazado",
      "count": 10,
      "percentage": 2.27,
      "color": "#EF4444"
    }
  ]
}
```

### 3.5. Document Types

```typescript
interface DocumentTypeMetric {
  document_type: string;            // "Factura", "Boleta", "Nota de Crédito", etc.
  code: string;                     // Código SUNAT: "01", "03", "07", "08"
  count: number;                    // Cantidad de documentos
  total_amount: number;             // Monto total
  percentage: number;               // Porcentaje del total de documentos
}
```

**Ejemplo JSON:**
```json
{
  "document_types": [
    {
      "document_type": "Factura",
      "code": "01",
      "count": 245,
      "total_amount": 85600.00,
      "percentage": 55.68
    },
    {
      "document_type": "Boleta",
      "code": "03",
      "count": 180,
      "total_amount": 37150.00,
      "percentage": 40.91
    },
    {
      "document_type": "Nota de Crédito",
      "code": "07",
      "count": 12,
      "total_amount": 3200.00,
      "percentage": 2.73
    },
    {
      "document_type": "Nota de Débito",
      "code": "08",
      "count": 3,
      "total_amount": 450.00,
      "percentage": 0.68
    }
  ]
}
```

### 3.6. Daily Breakdown

Para gráficos de línea mostrando ventas por día.

```typescript
interface DailyBreakdown {
  date: string;                     // "2025-10-15"
  day_name: string;                 // "Lunes", "Martes", etc.
  
  invoice_count: number;            // Cantidad de facturas/boletas
  credit_notes_count: number;       // Cantidad de NC
  debit_notes_count: number;        // Cantidad de ND
  
  gross_sales: number;              // Ventas brutas del día
  credit_notes_amount: number;      // Monto en NC
  debit_notes_amount: number;       // Monto en ND
  net_sales: number;                // Venta neta del día
  
  passenger_count: number;          // Pasajeros del día
}
```

**Ejemplo JSON (últimos 7 días):**
```json
{
  "daily_breakdown": [
    {
      "date": "2025-10-25",
      "day_name": "Viernes",
      
      "invoice_count": 18,
      "credit_notes_count": 1,
      "debit_notes_count": 0,
      
      "gross_sales": 5840.00,
      "credit_notes_amount": 180.00,
      "debit_notes_amount": 0.00,
      "net_sales": 5660.00,
      
      "passenger_count": 32
    },
    {
      "date": "2025-10-26",
      "day_name": "Sábado",
      
      "invoice_count": 24,
      "credit_notes_count": 0,
      "debit_notes_count": 0,
      
      "gross_sales": 7320.00,
      "credit_notes_amount": 0.00,
      "debit_notes_amount": 0.00,
      "net_sales": 7320.00,
      
      "passenger_count": 41
    }
  ]
}
```

### 3.7. Adjustments (Notas de Crédito/Débito)

Detalle completo de ajustes para el componente SalesSummary.

```typescript
interface AdjustmentsMetric {
  credit_notes: {
    total_count: number;
    total_amount: number;           // POSITIVO
    percentage_of_sales: number;    // % de las ventas brutas
    
    // Desglose por vendedor
    by_seller: {
      seller_id: string;
      seller_name: string;
      count: number;
      amount: number;
    }[];
    
    // Desglose por razón (si se registra)
    by_reason?: {
      reason: string;               // "Devolución", "Descuento", "Error", etc.
      count: number;
      amount: number;
    }[];
  };
  
  debit_notes: {
    total_count: number;
    total_amount: number;           // POSITIVO
    percentage_of_sales: number;
    
    by_seller: {
      seller_id: string;
      seller_name: string;
      count: number;
      amount: number;
    }[];
    
    by_reason?: {
      reason: string;               // "Intereses", "Cobro adicional", etc.
      count: number;
      amount: number;
    }[];
  };
}
```

**Ejemplo JSON:**
```json
{
  "adjustments": {
    "credit_notes": {
      "total_count": 12,
      "total_amount": 3200.00,
      "percentage_of_sales": 2.55,
      
      "by_seller": [
        {
          "seller_id": "123e4567-e89b-12d3-a456-426614174000",
          "seller_name": "Juan Pérez García",
          "count": 3,
          "amount": 850.00
        },
        {
          "seller_id": "987fcdeb-51a2-43f7-b123-456789abcdef",
          "seller_name": "María López Sánchez",
          "count": 2,
          "amount": 450.00
        }
      ],
      
      "by_reason": [
        {
          "reason": "Devolución de pasaje",
          "count": 8,
          "amount": 2400.00
        },
        {
          "reason": "Error en facturación",
          "count": 4,
          "amount": 800.00
        }
      ]
    },
    
    "debit_notes": {
      "total_count": 3,
      "total_amount": 450.00,
      "percentage_of_sales": 0.36,
      
      "by_seller": [
        {
          "seller_id": "123e4567-e89b-12d3-a456-426614174000",
          "seller_name": "Juan Pérez García",
          "count": 1,
          "amount": 120.00
        }
      ],
      
      "by_reason": [
        {
          "reason": "Cargo adicional",
          "count": 3,
          "amount": 450.00
        }
      ]
    }
  }
}
```

---

## 📄 4. Items - Detalle de Transacciones

**Solo para la tabla de detalle.** Estos items deben venir ordenados y opcionalmente paginados.

```typescript
interface SalesItem {
  // Identificación del documento
  invoice_id: number;
  document_type: string;            // "Factura", "Boleta", "Nota de Crédito", etc.
  document_code: string;            // "01", "03", "07", "08"
  series: string;                   // "F001"
  correlative: string;              // "00012345"
  full_number: string;              // "F001-00012345"
  
  // Fechas
  issue_date: string;               // ISO 8601: "2025-10-15T14:30:00Z"
  trip_date?: string;               // "2025-10-20" (si aplica)
  
  // Estado
  sunat_status: string;             // "ACEPTADO", "PENDIENTE", "RECHAZADO"
  business_status?: string;         // "PAGADO", "ANULADO", etc.
  
  // Vendedor
  seller_id: string;
  seller_name: string;
  seller_email: string;
  
  // Sucursal
  branch_office_id: number;
  branch_office_name: string;
  
  // Cliente
  client_id: number;
  client_name: string;
  client_document_type: string;     // "DNI", "RUC", etc.
  client_document_number: string;
  
  // Viaje (si aplica)
  trip_info?: {
    vessel_name: string;
    route_name: string;
    origin_port: string;
    destination_port: string;
    boarding_time?: string;
    seat_numbers?: string[];        // ["A1", "A2"] o null
  };
  
  // Montos
  currency: string;                 // "PEN", "USD"
  subtotal: number;                 // Sin IGV
  igv: number;                      // IGV
  discount: number;                 // Descuento aplicado
  total: number;                    // Total a pagar
  
  // Pago
  payment_method: string;           // "EFECTIVO", "TRANSFERENCIA", etc.
  payment_operation_code?: string;  // Código de operación si aplica
  
  // Servicio
  service_description: string;      // Descripción del servicio principal
  passenger_count: number;          // Cantidad de pasajeros (0 si es carga)
  cargo_weight?: number;            // Peso de carga en kg (si aplica)
}
```

**Ejemplo JSON (primeros 5 items):**
```json
{
  "items": [
    {
      "invoice_id": 12345,
      "document_type": "Factura",
      "document_code": "01",
      "series": "F001",
      "correlative": "00012345",
      "full_number": "F001-00012345",
      
      "issue_date": "2025-10-15T14:30:00Z",
      "trip_date": "2025-10-20",
      
      "sunat_status": "ACEPTADO",
      "business_status": "PAGADO",
      
      "seller_id": "123e4567-e89b-12d3-a456-426614174000",
      "seller_name": "Juan Pérez García",
      "seller_email": "juan.perez@transportes.com",
      
      "branch_office_id": 1,
      "branch_office_name": "Oficina Principal Iquitos",
      
      "client_id": 5678,
      "client_name": "Carlos Ramírez Torres",
      "client_document_type": "DNI",
      "client_document_number": "12345678",
      
      "trip_info": {
        "vessel_name": "Eduardo I",
        "route_name": "Iquitos - Yurimaguas",
        "origin_port": "Iquitos",
        "destination_port": "Yurimaguas",
        "boarding_time": "18:00",
        "seat_numbers": ["A1"]
      },
      
      "currency": "PEN",
      "subtotal": 126.27,
      "igv": 22.73,
      "discount": 0.00,
      "total": 149.00,
      
      "payment_method": "EFECTIVO",
      "payment_operation_code": null,
      
      "service_description": "Pasaje fluvial",
      "passenger_count": 1,
      "cargo_weight": null
    },
    {
      "invoice_id": 12346,
      "document_type": "Nota de Crédito",
      "document_code": "07",
      "series": "FC01",
      "correlative": "00000234",
      "full_number": "FC01-00000234",
      
      "issue_date": "2025-10-16T10:15:00Z",
      "trip_date": null,
      
      "sunat_status": "ACEPTADO",
      "business_status": "PROCESADO",
      
      "seller_id": "123e4567-e89b-12d3-a456-426614174000",
      "seller_name": "Juan Pérez García",
      "seller_email": "juan.perez@transportes.com",
      
      "branch_office_id": 1,
      "branch_office_name": "Oficina Principal Iquitos",
      
      "client_id": 5679,
      "client_name": "Ana María Gonzáles",
      "client_document_type": "DNI",
      "client_document_number": "87654321",
      
      "trip_info": null,
      
      "currency": "PEN",
      "subtotal": 84.75,
      "igv": 15.25,
      "discount": 0.00,
      "total": 100.00,
      
      "payment_method": "AJUSTE",
      "payment_operation_code": null,
      
      "service_description": "Anulación de pasaje",
      "passenger_count": 0,
      "cargo_weight": null
    }
  ]
}
```

---

## 📑 5. Pagination (Opcional pero Recomendado)

Si los items son muchos, paginar en el backend.

```typescript
interface Pagination {
  current_page: number;             // Página actual (1-indexed)
  page_size: number;                // Items por página
  total_items: number;              // Total de items disponibles
  total_pages: number;              // Total de páginas
  has_previous: boolean;            // Hay página anterior
  has_next: boolean;                // Hay página siguiente
}
```

**Ejemplo JSON:**
```json
{
  "pagination": {
    "current_page": 1,
    "page_size": 50,
    "total_items": 440,
    "total_pages": 9,
    "has_previous": false,
    "has_next": true
  }
}
```

**Query params adicionales para paginación:**
```http
GET /admin/reports/daily-sales?start_date=2025-10-01&end_date=2025-10-31&page=1&page_size=50
```

---

## 🎯 Ejemplo de Response Completo

```json
{
  "report_metadata": {
    "report_type": "daily_sales",
    "generated_at": "2025-11-03T14:30:00Z",
    "generated_by": "admin@transportes.com",
    "period": {
      "start_date": "2025-10-01",
      "end_date": "2025-10-31",
      "total_days": 31
    },
    "filters_applied": {}
  },
  
  "summary": {
    "totals": {
      "total_invoices": 245,
      "total_receipts": 180,
      "total_credit_notes": 12,
      "total_debit_notes": 3,
      "total_documents": 440,
      
      "gross_sales": 125500.00,
      "total_credit_notes_amount": 3200.00,
      "total_debit_notes_amount": 450.00,
      "net_sales": 122750.00,
      
      "total_subtotal": 104025.42,
      "total_igv": 18724.58,
      "total_discounts": 1250.00,
      "total_payable": 122750.00,
      
      "average_ticket": 285.34,
      "average_daily_sales": 3959.68
    },
    "by_currency": [
      {
        "currency_code": "PEN",
        "total_amount": 122750.00,
        "invoice_count": 440
      }
    ]
  },
  
  "metrics": {
    "payment_methods": [
      {
        "payment_method": "EFECTIVO",
        "display_name": "Efectivo",
        "total_amount": 45680.00,
        "transaction_count": 156,
        "percentage": 37.21,
        "color": "#10B981"
      }
    ],
    
    "top_sellers": [
      {
        "seller_id": "123e4567-e89b-12d3-a456-426614174000",
        "seller_name": "Juan Pérez García",
        "seller_email": "juan.perez@transportes.com",
        "total_invoices": 89,
        "total_credit_notes": 3,
        "total_debit_notes": 1,
        "gross_sales": 35800.00,
        "credit_notes_amount": 850.00,
        "debit_notes_amount": 120.00,
        "net_sales": 35070.00,
        "average_ticket": 402.36,
        "total_passengers": 142,
        "ranking_position": 1,
        "percentage_of_total": 28.57
      }
    ],
    
    "popular_routes": [
      {
        "route_id": 1,
        "route_name": "Iquitos - Yurimaguas",
        "origin_port": "Iquitos",
        "destination_port": "Yurimaguas",
        "display_name": "Iquitos → Yurimaguas",
        "total_passengers": 287,
        "total_cargo_items": 45,
        "total_trips": 12,
        "total_revenue": 42800.00,
        "average_ticket_price": 149.13,
        "percentage_of_passengers": 34.15,
        "vessels_used": [
          {
            "vessel_name": "Eduardo I",
            "trip_count": 8
          }
        ]
      }
    ],
    
    "sunat_status": [
      {
        "status": "ACEPTADO",
        "display_name": "Aceptado por SUNAT",
        "count": 412,
        "percentage": 93.64,
        "color": "#10B981"
      }
    ],
    
    "document_types": [
      {
        "document_type": "Factura",
        "code": "01",
        "count": 245,
        "total_amount": 85600.00,
        "percentage": 55.68
      }
    ],
    
    "daily_breakdown": [
      {
        "date": "2025-10-01",
        "day_name": "Martes",
        "invoice_count": 15,
        "credit_notes_count": 0,
        "debit_notes_count": 0,
        "gross_sales": 4250.00,
        "credit_notes_amount": 0.00,
        "debit_notes_amount": 0.00,
        "net_sales": 4250.00,
        "passenger_count": 28
      }
    ],
    
    "adjustments": {
      "credit_notes": {
        "total_count": 12,
        "total_amount": 3200.00,
        "percentage_of_sales": 2.55,
        "by_seller": [
          {
            "seller_id": "123e4567-e89b-12d3-a456-426614174000",
            "seller_name": "Juan Pérez García",
            "count": 3,
            "amount": 850.00
          }
        ],
        "by_reason": [
          {
            "reason": "Devolución de pasaje",
            "count": 8,
            "amount": 2400.00
          }
        ]
      },
      "debit_notes": {
        "total_count": 3,
        "total_amount": 450.00,
        "percentage_of_sales": 0.36,
        "by_seller": [
          {
            "seller_id": "123e4567-e89b-12d3-a456-426614174000",
            "seller_name": "Juan Pérez García",
            "count": 1,
            "amount": 120.00
          }
        ],
        "by_reason": [
          {
            "reason": "Cargo adicional",
            "count": 3,
            "amount": 450.00
          }
        ]
      }
    }
  },
  
  "items": [
    {
      "invoice_id": 12345,
      "document_type": "Factura",
      "document_code": "01",
      "series": "F001",
      "correlative": "00012345",
      "full_number": "F001-00012345",
      "issue_date": "2025-10-15T14:30:00Z",
      "trip_date": "2025-10-20",
      "sunat_status": "ACEPTADO",
      "business_status": "PAGADO",
      "seller_id": "123e4567-e89b-12d3-a456-426614174000",
      "seller_name": "Juan Pérez García",
      "seller_email": "juan.perez@transportes.com",
      "branch_office_id": 1,
      "branch_office_name": "Oficina Principal Iquitos",
      "client_id": 5678,
      "client_name": "Carlos Ramírez Torres",
      "client_document_type": "DNI",
      "client_document_number": "12345678",
      "trip_info": {
        "vessel_name": "Eduardo I",
        "route_name": "Iquitos - Yurimaguas",
        "origin_port": "Iquitos",
        "destination_port": "Yurimaguas",
        "boarding_time": "18:00",
        "seat_numbers": ["A1"]
      },
      "currency": "PEN",
      "subtotal": 126.27,
      "igv": 22.73,
      "discount": 0.00,
      "total": 149.00,
      "payment_method": "EFECTIVO",
      "payment_operation_code": null,
      "service_description": "Pasaje fluvial",
      "passenger_count": 1,
      "cargo_weight": null
    }
  ],
  
  "pagination": {
    "current_page": 1,
    "page_size": 50,
    "total_items": 440,
    "total_pages": 9,
    "has_previous": false,
    "has_next": true
  }
}
```

---

## ⚡ Reglas de Cálculo Importantes

### 1. Notas de Crédito
- ✅ Se restan de las ventas brutas
- ✅ `credit_notes_amount` siempre es POSITIVO
- ✅ Se cuentan por separado de facturas/boletas
- ✅ Se agrupan por vendedor y razón

### 2. Notas de Débito
- ✅ Se suman a las ventas brutas
- ✅ `debit_notes_amount` siempre es POSITIVO
- ✅ Se cuentan por separado
- ✅ Se agrupan por vendedor y razón

### 3. Ventas Netas
```
net_sales = gross_sales - credit_notes_amount + debit_notes_amount
```

### 4. Promedios
```
average_ticket = net_sales / (total_invoices + total_receipts)
average_daily_sales = net_sales / total_days
```

### 5. Porcentajes
```
percentage = (valor_individual / total) * 100
```

### 6. Ranking
- Ordenar vendedores por `net_sales` descendente
- `ranking_position` empieza en 1

---

## 🎨 Colores Sugeridos (Opcional)

El backend puede sugerir colores para mantener consistencia:

```typescript
const SUGGESTED_COLORS = {
  // Métodos de pago
  EFECTIVO: "#10B981",        // Verde
  TRANSFERENCIA: "#3B82F6",   // Azul
  TARJETA: "#8B5CF6",         // Púrpura
  YAPE: "#EC4899",            // Rosa
  PLIN: "#F59E0B",            // Amarillo
  
  // Estados SUNAT
  ACEPTADO: "#10B981",        // Verde
  PENDIENTE: "#F59E0B",       // Amarillo
  RECHAZADO: "#EF4444",       // Rojo
  
  // Ranking
  POSITION_1: "#FFD700",      // Oro
  POSITION_2: "#C0C0C0",      // Plata
  POSITION_3: "#CD7F32",      // Bronce
  POSITION_OTHER: "#3B82F6",  // Azul
};
```

---

## 📊 Optimizaciones Adicionales

### 1. Caché
El backend puede cachear estos reportes por períodos comunes:
- Día actual
- Semana actual
- Mes actual
- Mes anterior

### 2. Background Jobs
Para reportes muy grandes (>1000 items), considerar:
- Generación asíncrona
- Notificación cuando esté listo
- Descarga de archivo Excel/PDF

### 3. Índices de Base de Datos
Optimizar queries con índices en:
- `issue_date`
- `seller_id`
- `branch_office_id`
- `document_type`
- `sunat_status`

---

## ✅ Checklist de Implementación Backend

### Validaciones
- [ ] Validar que `start_date` <= `end_date`
- [ ] Validar que el rango no exceda 1 año
- [ ] Validar que filtros opcionales existan (user_id, branch_id)

### Cálculos
- [ ] Calcular totales de documentos por tipo
- [ ] Calcular montos brutos, NC, ND y netos
- [ ] Calcular promedios (ticket, diario)
- [ ] Agrupar por métodos de pago con porcentajes
- [ ] Generar ranking de vendedores (top 10)
- [ ] Agrupar rutas populares (top 8)
- [ ] Calcular estados SUNAT con porcentajes
- [ ] Desglosar tipos de documento
- [ ] Generar breakdown diario
- [ ] Desglosar NC/ND por vendedor y razón

### Rendimiento
- [ ] Usar índices apropiados
- [ ] Optimizar queries (evitar N+1)
- [ ] Considerar caché para períodos comunes
- [ ] Paginar items si son >100

### Respuesta
- [ ] Retornar números como números (no strings)
- [ ] Usar ISO 8601 para fechas
- [ ] Incluir metadata completa
- [ ] Validar estructura del JSON

---

## 🚀 Beneficios de Esta Estructura

1. ✅ **Frontend simple:** Solo renderiza datos
2. ✅ **Rendimiento:** Sin cálculos en cliente
3. ✅ **Consistencia:** Misma lógica para todos
4. ✅ **Cacheable:** Backend puede cachear
5. ✅ **Escalable:** Funciona con 10 o 10,000 transacciones
6. ✅ **Mantenible:** Lógica centralizada
7. ✅ **Testeable:** Backend puede tener tests unitarios

---

## 📞 Contacto

Para dudas o aclaraciones sobre esta especificación, contactar al equipo de frontend.

---

**Versión:** 1.0  
**Fecha:** 3 de noviembre de 2025  
**Estado:** ✅ Especificación Completa  
**Equipo:** Frontend - Transportes Romero
