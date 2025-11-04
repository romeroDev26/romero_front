# Especificación API Backend - Estadísticas de Vendedor

## 📋 Objetivo

Definir la estructura **óptima y completa** del JSON que el backend debe retornar para el endpoint `/admin/reports/daily-sales-detailed`, eliminando la necesidad de hacer **6+ iteraciones complejas** sobre los datos en el frontend.

---

## 🎯 Problema Actual

### ❌ Estado Actual (MALO)

**Frontend recibe:**
```json
{
  "report_type": "daily_sales_detailed",
  "generated_at": "...",
  "generated_by": "...",
  "filters": {...},
  "items": [
    // 500+ facturas con items anidados y representantes
  ]
}
```

**Frontend debe calcular (hook `useSellerDetailedStats`):**
1. ✅ Total de facturas
2. ✅ Total de ingresos
3. ✅ Total de pasajeros (iterando items anidados)
4. ✅ Total de items de carga
5. ✅ Ticket promedio
6. ✅ Breakdown por métodos de pago
7. ✅ Breakdown por tipos de documento
8. ✅ Breakdown por estado SUNAT
9. ✅ Ventas diarias agrupadas
10. ✅ Top 5 rutas más rentables
11. ✅ Top 5 productos más vendidos

**Problema:** Con 500 facturas y 1000+ items anidados, el frontend hace **~3000+ iteraciones**.

---

## 🔗 Endpoint Principal

```http
GET /admin/reports/daily-sales-detailed
```

### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `start_date` | string (YYYY-MM-DD) | ✅ Sí | Fecha de inicio del reporte |
| `end_date` | string (YYYY-MM-DD) | ✅ Sí | Fecha de fin del reporte |
| `user_id` | string (UUID) | ✅ Sí | UUID del vendedor |

### Ejemplo de Request

```http
GET /admin/reports/daily-sales-detailed?user_id=123e4567-e89b-12d3-a456-426614174000&start_date=2025-10-01&end_date=2025-10-31
```

---

## 📦 Estructura del JSON Response

### Estructura General

```typescript
interface SellerDetailedReportResponse {
  // Metadata del reporte
  report_metadata: SellerReportMetadata;
  
  // Información del vendedor
  seller_info: SellerInfo;
  
  // TODAS las métricas calculadas
  metrics: SellerMetrics;
  
  // Gráficos pre-calculados
  charts_data: SellerChartsData;
  
  // Facturas detalladas para la tabla
  invoices: DetailedInvoice[];
  
  // Paginación opcional
  pagination?: Pagination;
}
```

---

## 🏷️ 1. Report Metadata

```typescript
interface SellerReportMetadata {
  report_type: "seller_detailed_statistics";
  generated_at: string;        // ISO 8601: "2025-11-03T14:30:00Z"
  generated_by: string;         // Email del usuario: "admin@transportes.com"
  period: {
    start_date: string;         // "2025-10-01"
    end_date: string;           // "2025-10-31"
    total_days: number;         // 31
  };
  filters_applied: {
    user_id: string;            // UUID
  };
}
```

### Ejemplo JSON

```json
{
  "report_metadata": {
    "report_type": "seller_detailed_statistics",
    "generated_at": "2025-11-03T14:30:00Z",
    "generated_by": "admin@transportes.com",
    "period": {
      "start_date": "2025-10-01",
      "end_date": "2025-10-31",
      "total_days": 31
    },
    "filters_applied": {
      "user_id": "123e4567-e89b-12d3-a456-426614174000"
    }
  }
}
```

---

## 👤 2. Seller Info

Información completa del vendedor.

```typescript
interface SellerInfo {
  seller_id: string;            // UUID
  full_name: string;            // "Juan Pérez García"
  email: string;                // "juan.perez@transportes.com"
  role_name: string;            // "Vendedor", "Administrador", etc.
  branch_office_name: string;   // Sucursal principal del vendedor
  is_active: boolean;           // Estado del vendedor
  hire_date?: string;           // Fecha de contratación (opcional)
}
```

### Ejemplo JSON

```json
{
  "seller_info": {
    "seller_id": "123e4567-e89b-12d3-a456-426614174000",
    "full_name": "Juan Pérez García",
    "email": "juan.perez@transportes.com",
    "role_name": "Vendedor",
    "branch_office_name": "Oficina Principal Iquitos",
    "is_active": true,
    "hire_date": "2023-05-15"
  }
}
```

---

## 📊 3. Metrics - Métricas Principales

**TODAS las estadísticas agregadas.**

```typescript
interface SellerMetrics {
  // Totales generales
  totals: {
    // ⚠️ Todos estos totales EXCLUYEN documentos con business_status = 'CANCELLED'
    total_invoices: number;           // Total facturas + boletas válidas (sin NC/ND, sin anulados)
    total_receipts: number;           // Total de boletas válidas
    total_credit_notes: number;       // Total de notas de crédito válidas
    total_debit_notes: number;        // Total de notas de débito válidas
    total_documents: number;          // Total de todos los documentos válidos
    
    // 🆕 Documentos anulados (para auditoría)
    total_cancelled_invoices: number; // Cantidad de documentos anulados
    total_cancelled_amount: number;   // Monto total de documentos anulados
    
    // Montos financieros (SOLO documentos válidos)
    gross_revenue: number;            // Ingresos brutos (sin restar NC, sin anulados)
    credit_notes_amount: number;      // Monto total en NC válidas (POSITIVO)
    debit_notes_amount: number;       // Monto total en ND válidas (POSITIVO)
    net_revenue: number;              // Ingresos netos = gross - NC + ND (sin anulados)
    
    total_subtotal: number;           // Subtotal sin IGV (sin anulados)
    total_igv: number;                // Total IGV (sin anulados)
    total_discounts: number;          // Total descuentos aplicados (sin anulados)
    
    // Promedios (calculados sobre documentos válidos)
    average_ticket: number;           // Ingreso neto / total_invoices
    average_daily_revenue: number;    // Ingreso neto / total_days
  };
  
  // Pasajeros y carga (SOLO de documentos válidos)
  passengers_cargo: {
    total_passengers: number;         // Total de pasajeros transportados (sin anulados)
    total_cargo_items: number;        // Total de items de carga (sin anulados)
    total_cargo_weight_kg: number;    // Peso total de carga en kg (sin anulados)
    passenger_percentage: number;     // % de ingresos por pasajeros
    cargo_percentage: number;         // % de ingresos por carga
  };
  
  // Breakdown por métodos de pago (SOLO documentos válidos)
  payment_methods: PaymentMethodBreakdown[];
  
  // Breakdown por tipos de documento (SOLO documentos válidos)
  document_types: DocumentTypeBreakdown[];
  
  // Breakdown por estado SUNAT
  sunat_status: SunatStatusBreakdown[];
  
  // Breakdown por sucursales (si vendió en varias)
  branches: BranchBreakdown[];
}
```

### 3.1. Payment Methods Breakdown

```typescript
interface PaymentMethodBreakdown {
  payment_method: string;           // "EFECTIVO", "TRANSFERENCIA", etc.
  display_name: string;             // "Efectivo"
  total_amount: number;             // Monto total (con NC/ND aplicados)
  transaction_count: number;        // Cantidad de transacciones
  percentage: number;               // % del total de ingresos
}
```

**Ejemplo JSON:**
```json
{
  "payment_methods": [
    {
      "payment_method": "EFECTIVO",
      "display_name": "Efectivo",
      "total_amount": 18650.00,
      "transaction_count": 67,
      "percentage": 53.18
    },
    {
      "payment_method": "TRANSFERENCIA",
      "display_name": "Transferencia Bancaria",
      "total_amount": 12400.00,
      "transaction_count": 32,
      "percentage": 35.37
    },
    {
      "payment_method": "YAPE",
      "display_name": "Yape",
      "total_amount": 4020.00,
      "transaction_count": 18,
      "percentage": 11.45
    }
  ]
}
```

### 3.2. Document Types Breakdown

```typescript
interface DocumentTypeBreakdown {
  document_type: string;            // "Factura", "Boleta", "Nota de Crédito", etc.
  document_code: string;            // "01", "03", "07", "08"
  count: number;                    // Cantidad de documentos
  total_amount: number;             // Monto total
  percentage: number;               // % del total de documentos (count)
}
```

**Ejemplo JSON:**
```json
{
  "document_types": [
    {
      "document_type": "Factura",
      "document_code": "01",
      "count": 56,
      "total_amount": 24500.00,
      "percentage": 62.92
    },
    {
      "document_type": "Boleta",
      "document_code": "03",
      "count": 28,
      "total_amount": 10570.00,
      "percentage": 31.46
    },
    {
      "document_type": "Nota de Crédito",
      "document_code": "07",
      "count": 3,
      "total_amount": 850.00,
      "percentage": 3.37
    },
    {
      "document_type": "Nota de Débito",
      "document_code": "08",
      "count": 2,
      "total_amount": 120.00,
      "percentage": 2.25
    }
  ]
}
```

### 3.3. SUNAT Status Breakdown

```typescript
interface SunatStatusBreakdown {
  status: string;                   // "ACEPTADO", "RECHAZADO", "PENDIENTE"
  display_name: string;             // "Aceptado por SUNAT"
  count: number;                    // Cantidad de documentos
  percentage: number;               // % del total
}
```

**Ejemplo JSON:**
```json
{
  "sunat_status": [
    {
      "status": "ACEPTADO",
      "display_name": "Aceptado por SUNAT",
      "count": 82,
      "percentage": 92.13
    },
    {
      "status": "PENDIENTE",
      "display_name": "Pendiente de envío",
      "count": 5,
      "percentage": 5.62
    },
    {
      "status": "RECHAZADO",
      "display_name": "Rechazado",
      "count": 2,
      "percentage": 2.25
    }
  ]
}
```

### 3.4. Branch Breakdown

Si el vendedor vendió desde múltiples sucursales.

```typescript
interface BranchBreakdown {
  branch_office_id: number;
  branch_office_name: string;
  invoice_count: number;
  total_amount: number;
  percentage: number;
}
```

**Ejemplo JSON:**
```json
{
  "branches": [
    {
      "branch_office_id": 1,
      "branch_office_name": "Oficina Principal Iquitos",
      "invoice_count": 78,
      "total_amount": 32450.00,
      "percentage": 92.58
    },
    {
      "branch_office_id": 2,
      "branch_office_name": "Oficina Yurimaguas",
      "invoice_count": 11,
      "total_amount": 2620.00,
      "percentage": 7.42
    }
  ]
}
```

---

## 📈 4. Charts Data - Datos para Gráficos

**Todos los datos pre-procesados para gráficos.**

```typescript
interface SellerChartsData {
  // Ventas diarias (para gráfico de línea)
  daily_sales: DailySalesChart[];
  
  // Top rutas (para gráfico de barras)
  top_routes: TopRoutesChart[];
  
  // Top productos (para ranking)
  top_products: TopProductsChart[];
  
  // Distribución por hora del día (opcional)
  sales_by_hour?: SalesByHourChart[];
}
```

### 4.1. Daily Sales Chart

```typescript
interface DailySalesChart {
  date: string;                     // "2025-10-15"
  day_name: string;                 // "Lunes", "Martes", etc.
  invoice_count: number;            // Cantidad de facturas
  net_amount: number;               // Monto neto (con NC/ND)
  passenger_count: number;          // Pasajeros del día
}
```

**Ejemplo JSON:**
```json
{
  "daily_sales": [
    {
      "date": "2025-10-01",
      "day_name": "Martes",
      "invoice_count": 4,
      "net_amount": 1250.00,
      "passenger_count": 8
    },
    {
      "date": "2025-10-02",
      "day_name": "Miércoles",
      "invoice_count": 3,
      "net_amount": 980.00,
      "passenger_count": 5
    },
    {
      "date": "2025-10-03",
      "day_name": "Jueves",
      "invoice_count": 5,
      "net_amount": 1680.00,
      "passenger_count": 11
    }
  ]
}
```

### 4.2. Top Routes Chart

Top 5 rutas más rentables.

```typescript
interface TopRoutesChart {
  route_id: number;
  route_name: string;               // "Iquitos - Yurimaguas"
  origin_port: string;
  destination_port: string;
  
  total_passengers: number;         // Pasajeros transportados
  total_cargo_items: number;        // Items de carga
  total_revenue: number;            // Ingresos totales en esta ruta
  average_ticket_price: number;     // Precio promedio
  trip_count: number;               // Cantidad de viajes
  
  vessels_used: string[];           // ["Eduardo I", "Gilmer IV"]
}
```

**Ejemplo JSON:**
```json
{
  "top_routes": [
    {
      "route_id": 1,
      "route_name": "Iquitos - Yurimaguas",
      "origin_port": "Iquitos",
      "destination_port": "Yurimaguas",
      
      "total_passengers": 78,
      "total_cargo_items": 12,
      "total_revenue": 11620.00,
      "average_ticket_price": 149.00,
      "trip_count": 6,
      
      "vessels_used": ["Eduardo I", "Gilmer IV"]
    },
    {
      "route_id": 2,
      "route_name": "Yurimaguas - Iquitos",
      "origin_port": "Yurimaguas",
      "destination_port": "Iquitos",
      
      "total_passengers": 64,
      "total_cargo_items": 8,
      "total_revenue": 9536.00,
      "average_ticket_price": 149.00,
      "trip_count": 5,
      
      "vessels_used": ["Eduardo I"]
    }
  ]
}
```

### 4.3. Top Products Chart

Top 5 productos/servicios más vendidos.

```typescript
interface TopProductsChart {
  product_id: number;
  product_name: string;
  service_category: string;         // "Pasaje", "Carga", "Hospedaje", etc.
  
  quantity_sold: number;            // Cantidad vendida
  total_revenue: number;            // Ingresos generados
  average_price: number;            // Precio promedio
  transaction_count: number;        // Cantidad de transacciones
}
```

**Ejemplo JSON:**
```json
{
  "top_products": [
    {
      "product_id": 1,
      "product_name": "Pasaje Cama Individual",
      "service_category": "Pasaje",
      
      "quantity_sold": 142,
      "total_revenue": 21158.00,
      "average_price": 149.00,
      "transaction_count": 142
    },
    {
      "product_id": 2,
      "product_name": "Carga General",
      "service_category": "Carga",
      
      "quantity_sold": 850,
      "total_revenue": 8500.00,
      "average_price": 10.00,
      "transaction_count": 45
    }
  ]
}
```

### 4.4. Sales by Hour (Opcional)

Distribución de ventas por hora del día.

```typescript
interface SalesByHourChart {
  hour: number;                     // 0-23
  hour_display: string;             // "08:00 - 09:00"
  invoice_count: number;
  total_amount: number;
  percentage: number;
}
```

**Ejemplo JSON:**
```json
{
  "sales_by_hour": [
    {
      "hour": 8,
      "hour_display": "08:00 - 09:00",
      "invoice_count": 12,
      "total_amount": 1850.00,
      "percentage": 5.28
    },
    {
      "hour": 9,
      "hour_display": "09:00 - 10:00",
      "invoice_count": 18,
      "total_amount": 2940.00,
      "percentage": 8.39
    }
  ]
}
```

---

## 📄 5. Invoices - Facturas Detalladas

**Facturas para la tabla, con toda la información necesaria.**

```typescript
interface DetailedInvoice {
  // Identificación
  invoice_id: number;
  document_type: string;            // "Factura", "Boleta", etc.
  document_code: string;            // "01", "03", etc.
  series: string;
  correlative: string;
  full_number: string;              // "F001-00012345"
  
  // Fechas
  issue_date: string;               // ISO 8601: "2025-10-15T14:30:00Z"
  
  // Estados
  sunat_status: string;             // "ACEPTADO", "PENDIENTE", "RECHAZADO"
  business_status: string;          // "PAGADO", "CANCELLED", "PENDING", "PROCESSED"
  
  // 🆕 Información de anulación (solo si business_status = 'CANCELLED')
  cancellation_info: {
    cancelled_at: string;           // ISO 8601: Fecha/hora de anulación
    cancelled_by: string;           // Email del usuario que anuló
    cancellation_reason: string;    // Motivo de la anulación
  } | null;
  
  // Cliente
  client_id: number;
  client_name: string;
  client_doc_type: string;          // "DNI", "RUC", "CE"
  client_document_number: string;
  client_phone: string | null;
  client_email: string | null;
  client_nationality: string | null;
  
  // Sucursal
  branch_office_id: number;
  branch_office_name: string;
  
  // Montos
  currency: string;                 // "PEN", "USD"
  subtotal: number;                 // Sin IGV
  igv: number;
  discount: number;
  total: number;                    // Total a pagar
  
  // Pago
  payment_method: string;
  payment_method_display: string;   // Nombre formateado
  payment_operation_code: string | null;
  
  // Resumen de items
  items_summary: {
    total_items: number;            // Cantidad de líneas de items
    total_passengers: number;       // Pasajeros en esta factura
    total_cargo_items: number;      // Items de carga
    has_trip_info: boolean;         // Tiene información de viaje
  };
  
  // Items detallados
  items: InvoiceItem[];
  
  // Representantes
  representatives: Representative[];
}
```

### 5.1. Invoice Item

```typescript
interface InvoiceItem {
  item_id: number;
  product_id: number;
  product_name: string;
  service_category: string;
  
  quantity: number;                 // ⚠️ NÚMERO, no string
  unit_price: number;               // ⚠️ NÚMERO, no string
  discount_amount: number;          // ⚠️ NÚMERO, no string
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  
  // Información de viaje (si aplica)
  trip_info: {
    trip_id: number | null;
    trip_date: string | null;
    vessel_name: string | null;
    route_name: string | null;
    origin_port: string | null;
    destination_port: string | null;
    boarding_port_name: string | null;
    disembarking_port_name: string | null;
    seat_number: string | null;
  } | null;
}
```

### 5.2. Representative

```typescript
interface Representative {
  representative_id: number;
  name: string;
  doc_type: string;
  doc_number: string;
  phone: string | null;
  email: string | null;
  
  trip_info: {
    seat_number: string | null;
    vessel_name: string | null;
    trip_date: string | null;
    boarding_stop_name: string | null;
    disembarking_stop_name: string | null;
  } | null;
}
```

### Ejemplo JSON (1 factura completa)

```json
{
  "invoices": [
    {
      "invoice_id": 12345,
      "document_type": "Factura",
      "document_code": "01",
      "series": "F001",
      "correlative": "00012345",
      "full_number": "F001-00012345",
      
      "issue_date": "2025-10-15T14:30:00Z",
      
      "sunat_status": "ACEPTADO",
      "business_status": "PAGADO",
      
      "client_id": 5678,
      "client_name": "Empresa Comercial SAC",
      "client_doc_type": "RUC",
      "client_document_number": "20123456789",
      "client_phone": "965123456",
      "client_email": "contacto@empresa.com",
      "client_nationality": null,
      
      "branch_office_id": 1,
      "branch_office_name": "Oficina Principal Iquitos",
      
      "currency": "PEN",
      "subtotal": 505.08,
      "igv": 90.92,
      "discount": 0.00,
      "total": 596.00,
      
      "payment_method": "TRANSFERENCIA",
      "payment_method_display": "Transferencia Bancaria",
      "payment_operation_code": "OP-2025-1015-001",
      
      "items_summary": {
        "total_items": 4,
        "total_passengers": 4,
        "total_cargo_items": 0,
        "has_trip_info": true
      },
      
      "items": [
        {
          "item_id": 1001,
          "product_id": 1,
          "product_name": "Pasaje Cama Individual",
          "service_category": "Pasaje",
          
          "quantity": 1,
          "unit_price": 149.00,
          "discount_amount": 0.00,
          "subtotal": 126.27,
          "tax_amount": 22.73,
          "total_amount": 149.00,
          
          "trip_info": {
            "trip_id": 456,
            "trip_date": "2025-10-20",
            "vessel_name": "Eduardo I",
            "route_name": "Iquitos - Yurimaguas",
            "origin_port": "Iquitos",
            "destination_port": "Yurimaguas",
            "boarding_port_name": "Puerto Iquitos",
            "disembarking_port_name": "Puerto Yurimaguas",
            "seat_number": "A1"
          }
        }
      ],
      
      "representatives": [
        {
          "representative_id": 1,
          "name": "Carlos Ramírez Torres",
          "doc_type": "DNI",
          "doc_number": "12345678",
          "phone": "965123456",
          "email": null,
          
          "trip_info": {
            "seat_number": "A1",
            "vessel_name": "Eduardo I",
            "trip_date": "2025-10-20",
            "boarding_stop_name": "Puerto Iquitos",
            "disembarking_stop_name": "Puerto Yurimaguas"
          }
        }
      ]
    }
  ]
}
```

---

## 📑 6. Pagination (Opcional)

Si hay muchas facturas (>100), paginar.

```typescript
interface Pagination {
  current_page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_previous: boolean;
  has_next: boolean;
}
```

**Query params para paginación:**
```http
GET /admin/reports/daily-sales-detailed?user_id=...&start_date=...&end_date=...&page=1&page_size=50
```

---

## 🎯 Ejemplo de Response Completo

```json
{
  "report_metadata": {
    "report_type": "seller_detailed_statistics",
    "generated_at": "2025-11-03T14:30:00Z",
    "generated_by": "admin@transportes.com",
    "period": {
      "start_date": "2025-10-01",
      "end_date": "2025-10-31",
      "total_days": 31
    },
    "filters_applied": {
      "user_id": "123e4567-e89b-12d3-a456-426614174000"
    }
  },
  
  "seller_info": {
    "seller_id": "123e4567-e89b-12d3-a456-426614174000",
    "full_name": "Juan Pérez García",
    "email": "juan.perez@transportes.com",
    "role_name": "Vendedor",
    "branch_office_name": "Oficina Principal Iquitos",
    "is_active": true,
    "hire_date": "2023-05-15"
  },
  
  "metrics": {
    "totals": {
      "total_invoices": 56,
      "total_receipts": 28,
      "total_credit_notes": 3,
      "total_debit_notes": 2,
      "total_documents": 89,
      
      "total_cancelled_invoices": 4,
      "total_cancelled_amount": 1850.00,
      
      "gross_revenue": 35800.00,
      "credit_notes_amount": 850.00,
      "debit_notes_amount": 120.00,
      "net_revenue": 35070.00,
      
      "total_subtotal": 29720.34,
      "total_igv": 5349.66,
      "total_discounts": 450.00,
      
      "average_ticket": 402.36,
      "average_daily_revenue": 1131.29
    },
    
    "passengers_cargo": {
      "total_passengers": 142,
      "total_cargo_items": 85,
      "total_cargo_weight_kg": 1250.5,
      "passenger_percentage": 78.5,
      "cargo_percentage": 21.5
    },
    
    "payment_methods": [
      {
        "payment_method": "EFECTIVO",
        "display_name": "Efectivo",
        "total_amount": 18650.00,
        "transaction_count": 67,
        "percentage": 53.18
      }
    ],
    
    "document_types": [
      {
        "document_type": "Factura",
        "document_code": "01",
        "count": 56,
        "total_amount": 24500.00,
        "percentage": 62.92
      }
    ],
    
    "sunat_status": [
      {
        "status": "ACEPTADO",
        "display_name": "Aceptado por SUNAT",
        "count": 82,
        "percentage": 92.13
      }
    ],
    
    "branches": [
      {
        "branch_office_id": 1,
        "branch_office_name": "Oficina Principal Iquitos",
        "invoice_count": 78,
        "total_amount": 32450.00,
        "percentage": 92.58
      }
    ]
  },
  
  "charts_data": {
    "daily_sales": [
      {
        "date": "2025-10-01",
        "day_name": "Martes",
        "invoice_count": 4,
        "net_amount": 1250.00,
        "passenger_count": 8
      }
    ],
    
    "top_routes": [
      {
        "route_id": 1,
        "route_name": "Iquitos - Yurimaguas",
        "origin_port": "Iquitos",
        "destination_port": "Yurimaguas",
        "total_passengers": 78,
        "total_cargo_items": 12,
        "total_revenue": 11620.00,
        "average_ticket_price": 149.00,
        "trip_count": 6,
        "vessels_used": ["Eduardo I", "Gilmer IV"]
      }
    ],
    
    "top_products": [
      {
        "product_id": 1,
        "product_name": "Pasaje Cama Individual",
        "service_category": "Pasaje",
        "quantity_sold": 142,
        "total_revenue": 21158.00,
        "average_price": 149.00,
        "transaction_count": 142
      }
    ]
  },
  
  "invoices": [
    {
      "invoice_id": 12345,
      "document_type": "Factura",
      "document_code": "01",
      "series": "F001",
      "correlative": "00012345",
      "full_number": "F001-00012345",
      "issue_date": "2025-10-15T14:30:00Z",
      "sunat_status": "ACEPTADO",
      "business_status": "PAGADO",
      "cancellation_info": null,
      
      "client_id": 5678,
      "client_name": "Empresa Comercial SAC",
      "client_doc_type": "RUC",
      "client_document_number": "20123456789",
      "client_phone": "965123456",
      "client_email": "contacto@empresa.com",
      "client_nationality": null,
      "branch_office_id": 1,
      "branch_office_name": "Oficina Principal Iquitos",
      "currency": "PEN",
      "subtotal": 505.08,
      "igv": 90.92,
      "discount": 0.00,
      "total": 596.00,
      "payment_method": "TRANSFERENCIA",
      "payment_method_display": "Transferencia Bancaria",
      "payment_operation_code": "OP-2025-1015-001",
      "items_summary": {
        "total_items": 4,
        "total_passengers": 4,
        "total_cargo_items": 0,
        "has_trip_info": true
      },
      "items": [],
      "representatives": []
    },
    {
      "invoice_id": 12346,
      "document_type": "Boleta",
      "document_code": "03",
      "series": "B001",
      "correlative": "00005678",
      "full_number": "B001-00005678",
      
      "issue_date": "2025-10-17T10:20:00Z",
      "sunat_status": "ACEPTADO",
      "business_status": "CANCELLED",
      "cancellation_info": {
        "cancelled_at": "2025-10-18T09:15:00Z",
        "cancelled_by": "admin@transportes.com",
        "cancellation_reason": "Error en nombre de pasajero - Cliente solicitó corrección"
      },
      
      "client_id": 5679,
      "client_name": "María García López",
      "client_doc_type": "DNI",
      "client_document_number": "12345678",
      "client_phone": "987654321",
      "client_email": null,
      "client_nationality": "Peruana",
      "branch_office_id": 1,
      "branch_office_name": "Oficina Principal Iquitos",
      "currency": "PEN",
      "subtotal": 126.27,
      "igv": 22.73,
      "discount": 0.00,
      "total": 149.00,
      "payment_method": "EFECTIVO",
      "payment_method_display": "Efectivo",
      "payment_operation_code": null,
      "items_summary": {
        "total_items": 1,
        "total_passengers": 1,
        "total_cargo_items": 0,
        "has_trip_info": true
      },
      "items": [],
      "representatives": []
    }
  ],
  
  "pagination": {
    "current_page": 1,
    "page_size": 50,
    "total_items": 89,
    "total_pages": 2,
    "has_previous": false,
    "has_next": true
  }
}
```

---

## ⚡ Reglas de Cálculo Importantes

### ⚠️ IMPORTANTE: Estados de Negocio (business_status)

Los documentos pueden tener diferentes estados de negocio que **AFECTAN** los cálculos:

| Estado | Valor | Descripción | Incluir en Cálculos | Mostrar en Excel |
|--------|-------|-------------|---------------------|------------------|
| **Pagado** | `PAGADO` | Documento válido y pagado | ✅ SÍ | ✅ SÍ |
| **Pendiente** | `PENDING` | Documento válido pero pendiente | ✅ SÍ | ✅ SÍ |
| **Anulado** | `CANCELLED` | Documento anulado | ❌ NO | ⚠️ SÍ (marcado) |
| **Procesado** | `PROCESSED` | Nota de crédito/débito aplicada | ✅ SÍ | ✅ SÍ |

**Regla de Oro:**
```
✅ INCLUIR EN CÁLCULOS: business_status != 'CANCELLED'
❌ EXCLUIR DE CÁLCULOS: business_status = 'CANCELLED'
⚠️ SIEMPRE MOSTRAR EN EXCEL: Todos los documentos (con marca visual si está anulado)
```

---

### 1. Totales de Documentos

**⚠️ EXCLUIR documentos ANULADOS de las métricas:**

```sql
-- Contar solo documentos válidos (NO anulados)
total_invoices = COUNT(*) 
  WHERE document_type IN ('Factura', 'Boleta')
  AND business_status != 'CANCELLED'

total_credit_notes = COUNT(*) 
  WHERE document_type = 'Nota de Crédito'
  AND business_status != 'CANCELLED'

total_debit_notes = COUNT(*) 
  WHERE document_type = 'Nota de Débito'
  AND business_status != 'CANCELLED'

total_documents = total_invoices + total_credit_notes + total_debit_notes

-- Para el Excel: incluir TODOS (incluso anulados)
total_documents_including_cancelled = COUNT(*) -- Sin filtro de business_status
```

---

### 2. Ingresos

**⚠️ EXCLUIR documentos ANULADOS:**

```sql
-- Ventas brutas (solo facturas/boletas NO anuladas)
gross_revenue = SUM(total_amount) 
  WHERE document_type IN ('Factura', 'Boleta')
  AND business_status != 'CANCELLED'

-- Notas de crédito (solo NO anuladas)
credit_notes_amount = ABS(SUM(total_amount)) 
  WHERE document_type = 'Nota de Crédito'
  AND business_status != 'CANCELLED'

-- Notas de débito (solo NO anuladas)
debit_notes_amount = SUM(total_amount) 
  WHERE document_type = 'Nota de Débito'
  AND business_status != 'CANCELLED'

-- Ingreso neto
net_revenue = gross_revenue - credit_notes_amount + debit_notes_amount
```

**Ejemplo con datos reales:**
```
Factura #001: S/ 1000.00 - PAGADO     → ✅ Cuenta (+1000)
Factura #002: S/ 500.00  - CANCELLED  → ❌ NO cuenta
NC #003:      S/ 100.00  - PROCESSED  → ✅ Cuenta (-100)
Factura #004: S/ 800.00  - PENDING    → ✅ Cuenta (+800)
NC #005:      S/ 50.00   - CANCELLED  → ❌ NO cuenta

gross_revenue = 1000 + 800 = 1800
credit_notes_amount = 100
net_revenue = 1800 - 100 = 1700
```

---

### 3. Promedios

**⚠️ Usar solo documentos válidos:**

```sql
average_ticket = net_revenue / total_invoices  
-- total_invoices ya excluye anulados

average_daily_revenue = net_revenue / total_days
```

---

### 4. Pasajeros vs Carga

**⚠️ Contar solo de facturas NO anuladas:**

```sql
total_passengers = COUNT(items) 
  WHERE seat_number IS NOT NULL
  AND invoice.business_status != 'CANCELLED'

total_cargo_items = SUM(items.quantity) 
  WHERE seat_number IS NULL
  AND invoice.business_status != 'CANCELLED'

-- Para cálculo de porcentajes
revenue_from_passengers = SUM(items.total_amount)
  WHERE items.seat_number IS NOT NULL
  AND invoice.business_status != 'CANCELLED'

passenger_percentage = (revenue_from_passengers / net_revenue) * 100
```

---

### 5. Breakdowns (Métodos de Pago, Tipos de Documento, etc.)

**⚠️ Todos los breakdowns EXCLUYEN documentos anulados:**

```sql
-- Métodos de pago
payment_methods_breakdown = 
  GROUP BY payment_method
  WHERE business_status != 'CANCELLED'
  SUM(total_amount)

-- Tipos de documento
document_types_breakdown = 
  GROUP BY document_type
  WHERE business_status != 'CANCELLED'
  COUNT(*)

-- Estados SUNAT
sunat_status_breakdown = 
  GROUP BY sunat_status
  WHERE business_status != 'CANCELLED'
  COUNT(*)
```

---

### 6. Porcentajes
```
percentage = (valor_individual / total) * 100
```

---

### 7. Documentos Anulados en el Response

**⚠️ IMPORTANTE:** Los documentos anulados DEBEN aparecer en la sección `invoices` para:
1. ✅ Mostrarlos en la tabla del frontend
2. ✅ Incluirlos en el Excel exportado
3. ✅ Que el usuario vea el estado "CANCELLED"

Pero **NO** deben ser incluidos en:
- ❌ Métricas (`metrics.totals`)
- ❌ Breakdowns (`metrics.payment_methods`, etc.)
- ❌ Gráficos (`charts_data`)

**Estructura:**
```json
{
  "metrics": {
    "totals": {
      "total_invoices": 85,           // ← Excluye anulados
      "total_cancelled_invoices": 4,  // ← NUEVO: Cantidad de anulados
      "net_revenue": 35070.00         // ← Excluye anulados
    }
  },
  "invoices": [
    {
      "invoice_id": 1,
      "business_status": "PAGADO",    // ✅ Incluido en métricas
      "total": 1000.00
    },
    {
      "invoice_id": 2,
      "business_status": "CANCELLED", // ❌ NO incluido en métricas
      "total": 500.00,
      "cancellation_info": {          // ← NUEVO: Info de anulación
        "cancelled_at": "2025-10-20T10:30:00Z",
        "cancelled_by": "admin@transportes.com",
        "cancellation_reason": "Error en facturación"
      }
    }
  ]
}
```

---

## 🎨 Componentes del Frontend que se Simplifican

### ❌ Antes (MALO)
```typescript
// Hook useSellerDetailedStats hace 6+ cálculos
const calculateMetrics = (data) => {
  // 1. Iterar todas las facturas
  // 2. Iterar items anidados para contar pasajeros
  // 3. Agrupar por método de pago
  // 4. Agrupar por tipo de documento
  // 5. Agrupar por estado SUNAT
  // 6. Agrupar por día
  // 7. Agrupar por ruta
  // 8. Agrupar por producto
  // ... más iteraciones
};
```

### ✅ Después (BUENO)
```typescript
// Frontend solo renderiza
const metrics = data.metrics; // Ya está todo calculado
const chartData = data.charts_data; // Listo para gráficos
```

---

## 📊 Componentes Afectados

### 1. SellerStatisticsDetailPage.tsx
**Antes:** Usa `useSellerDetailedStats` que calcula todo
**Después:** Solo renderiza `data.metrics` y `data.charts_data`

### 2. Tarjetas de Métricas
```tsx
// Antes
<p>{metrics.total_invoices}</p> // calculado en frontend

// Después
<p>{data.metrics.totals.total_invoices}</p> // del backend
```

### 3. Gráficos
```tsx
// Antes
<LineChart data={metrics.daily_sales}> // calculado en frontend

// Después
<LineChart data={data.charts_data.daily_sales}> // del backend
```

### 4. Exportar a Excel

**⚠️ IMPORTANTE: Manejo de Documentos Anulados en Excel**

El Excel debe mostrar **TODOS** los documentos (incluyendo anulados) pero con **indicadores visuales claros**.

#### Estructura del Excel Optimizada:

**Hoja 1: Resumen**
```
┌─────────────────────────────────────────────────┐
│ REPORTE DE VENTAS DETALLADO                     │
│ Vendedor: Juan Pérez García                     │
│ Período: 2025-10-01 - 2025-10-31                │
│ Generado: 03/11/2025 14:30                      │
├─────────────────────────────────────────────────┤
│                                                  │
│ MÉTRICAS PRINCIPALES (Solo docs válidos)        │
│ Total de Facturas Válidas:         85           │
│ Total de Notas de Crédito:         3            │
│ Total de Notas de Débito:          2            │
│ ────────────────────────────────────────        │
│ Documentos Anulados:                4 ⚠️        │
│                                                  │
│ Ventas Brutas:              S/ 35,800.00        │
│ Notas de Crédito:           S/    850.00 (-)    │
│ Notas de Débito:            S/    120.00 (+)    │
│ ────────────────────────────────────────        │
│ VENTAS NETAS:               S/ 35,070.00 ✅     │
│                                                  │
│ Total Pasajeros:                   142          │
│ Ticket Promedio:            S/    402.36        │
└─────────────────────────────────────────────────┘
```

**Hoja 2: Facturas**
```
┌──────┬──────────┬──────────────┬─────────────┬─────────┬────────┬────────────┐
│ ID   │ Tipo     │ Número       │ Fecha       │ Cliente │ Total  │ Estado     │
├──────┼──────────┼──────────────┼─────────────┼─────────┼────────┼────────────┤
│ 1001 │ Factura  │ F001-001234  │ 15/10/2025  │ Emp SAC │ 1000   │ PAGADO ✅  │
│ 1002 │ Boleta   │ B001-005678  │ 16/10/2025  │ Juan P. │  500   │ PAGADO ✅  │
│ 1003 │ Factura  │ F001-001235  │ 17/10/2025  │ Maria L.│  800   │ ANULADO ❌ │ ← Color rojo/gris
│ 1004 │ NC       │ FC01-000045  │ 18/10/2025  │ Emp SAC │ -100   │ APLICADO ⚠️│
│ 1005 │ Boleta   │ B001-005679  │ 19/10/2025  │ Carlos  │  650   │ PAGADO ✅  │
└──────┴──────────┴──────────────┴─────────────┴─────────┴────────┴────────────┘

Leyenda:
✅ PAGADO/PENDING    - Incluido en métricas
❌ ANULADO           - NO incluido en métricas (mostrado solo para auditoría)
⚠️ APLICADO          - Nota de crédito/débito procesada
```

**Formateo visual sugerido:**

```typescript
// Para exportToExcel.ts
const invoicesData = data.invoices.map((inv) => {
  const isCanc = inv.business_status === 'CANCELLED';
  
  return {
    'ID Factura': inv.invoice_id,
    'Tipo Documento': inv.document_type,
    'Serie-Correlativo': inv.full_number,
    'Fecha Emisión': new Date(inv.issue_date).toLocaleDateString(),
    'Cliente': inv.client_name,
    'Total': isCanc ? `(${inv.total})` : inv.total, // Números entre paréntesis si anulado
    'Estado': isCanc ? '❌ ANULADO' : '✅ ' + inv.business_status,
    'Estado SUNAT': inv.sunat_status,
    
    // Columna oculta para formateo condicional
    '_is_cancelled': isCanc, // Para aplicar formato rojo/tachado en Excel
    
    // Información de anulación (solo si está anulado)
    'Motivo Anulación': inv.cancellation_info?.cancellation_reason || '',
    'Anulado Por': inv.cancellation_info?.cancelled_by || '',
    'Fecha Anulación': inv.cancellation_info?.cancelled_at 
      ? new Date(inv.cancellation_info.cancelled_at).toLocaleDateString() 
      : ''
  };
});

// Aplicar estilo a filas anuladas
const worksheet = XLSX.utils.json_to_sheet(invoicesData);

// Recorrer filas y aplicar estilo si está anulada
invoicesData.forEach((row, index) => {
  if (row._is_cancelled) {
    // Aplicar color de fondo gris/rojo y texto tachado
    // (depende de la librería XLSX que uses)
  }
});
```

**Hoja 3: Resumen por Método de Pago** (Solo docs válidos)
```
┌──────────────────────┬─────────┬─────────────┬────────────┐
│ Método de Pago       │ Count   │ Monto       │ %          │
├──────────────────────┼─────────┼─────────────┼────────────┤
│ Efectivo             │   67    │ S/ 18,650   │  53.18%    │
│ Transferencia        │   32    │ S/ 12,400   │  35.37%    │
│ Yape                 │   18    │ S/  4,020   │  11.45%    │
├──────────────────────┼─────────┼─────────────┼────────────┤
│ TOTAL                │  117    │ S/ 35,070   │ 100.00%    │
└──────────────────────┴─────────┴─────────────┴────────────┘

Nota: No incluye documentos anulados
```

#### Código actualizado para exportToExcel.ts:

```typescript
// src/utils/exportToExcel.ts (ACTUALIZADO)
export const exportSellerStatsToExcel = (
  data: SellerDetailedReportResponse,
  sellerName: string,
  startDate: string,
  endDate: string
) => {
  const workbook = XLSX.utils.book_new();
  const metrics = data.metrics;

  // ========================================
  // HOJA 1: RESUMEN
  // ========================================
  const summary = [
    ['REPORTE DE VENTAS DETALLADO'],
    ['Vendedor:', sellerName],
    ['Email:', data.seller_info.email],
    ['Sucursal:', data.seller_info.branch_office_name],
    ['Período:', `${startDate} - ${endDate}`],
    ['Generado:', new Date().toLocaleString()],
    [],
    ['═══════════════════════════════════════════════'],
    ['MÉTRICAS PRINCIPALES (Solo documentos válidos)'],
    ['═══════════════════════════════════════════════'],
    [],
    ['Total de Facturas:', metrics.totals.total_invoices],
    ['Total de Boletas:', metrics.totals.total_receipts],
    ['Total de Notas de Crédito:', metrics.totals.total_credit_notes],
    ['Total de Notas de Débito:', metrics.totals.total_debit_notes],
    ['────────────────────────────────────'],
    ['⚠️ Documentos Anulados:', metrics.totals.total_cancelled_invoices || 0],
    [],
    ['INGRESOS'],
    ['Ventas Brutas:', `S/ ${metrics.totals.gross_revenue.toFixed(2)}`],
    ['Notas de Crédito (-):', `S/ ${metrics.totals.credit_notes_amount.toFixed(2)}`],
    ['Notas de Débito (+):', `S/ ${metrics.totals.debit_notes_amount.toFixed(2)}`],
    ['────────────────────────────────────'],
    ['✅ VENTAS NETAS:', `S/ ${metrics.totals.net_revenue.toFixed(2)}`],
    [],
    ['PASAJEROS Y CARGA'],
    ['Total Pasajeros:', metrics.passengers_cargo.total_passengers],
    ['Total Items de Carga:', metrics.passengers_cargo.total_cargo_items],
    ['Peso Total de Carga (kg):', metrics.passengers_cargo.total_cargo_weight_kg.toFixed(2)],
    [],
    ['PROMEDIOS'],
    ['Ticket Promedio:', `S/ ${metrics.totals.average_ticket.toFixed(2)}`],
    ['Ventas Promedio Diarias:', `S/ ${metrics.totals.average_daily_revenue.toFixed(2)}`],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summary);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  // ========================================
  // HOJA 2: FACTURAS (TODAS, incluyendo anuladas)
  // ========================================
  const invoicesData = data.invoices.map((inv) => {
    const isCanc = inv.business_status === 'CANCELLED';
    const isNC = inv.document_type === 'Nota de Crédito';
    const isND = inv.document_type === 'Nota de Débito';
    
    let statusDisplay = inv.business_status;
    if (isCanc) statusDisplay = '❌ ANULADO';
    else if (isNC || isND) statusDisplay = '⚠️ PROCESADO';
    else if (inv.business_status === 'PAGADO') statusDisplay = '✅ PAGADO';
    else if (inv.business_status === 'PENDING') statusDisplay = '⏳ PENDIENTE';
    
    return {
      'ID': inv.invoice_id,
      'Tipo': inv.document_type,
      'Número': inv.full_number,
      'Fecha': new Date(inv.issue_date).toLocaleDateString(),
      'Cliente': inv.client_name,
      'Doc Cliente': `${inv.client_doc_type}: ${inv.client_document_number}`,
      'Sucursal': inv.branch_office_name,
      'Moneda': inv.currency,
      'Subtotal': isCanc ? `(${inv.subtotal.toFixed(2)})` : inv.subtotal.toFixed(2),
      'IGV': isCanc ? `(${inv.igv.toFixed(2)})` : inv.igv.toFixed(2),
      'Total': isCanc ? `(${inv.total.toFixed(2)})` : inv.total.toFixed(2),
      'Método Pago': inv.payment_method_display,
      'Estado Negocio': statusDisplay,
      'Estado SUNAT': inv.sunat_status,
      
      // Información de anulación (solo si aplica)
      ...(isCanc && inv.cancellation_info ? {
        'Motivo Anulación': inv.cancellation_info.cancellation_reason || '',
        'Anulado Por': inv.cancellation_info.cancelled_by || '',
        'Fecha Anulación': new Date(inv.cancellation_info.cancelled_at).toLocaleDateString()
      } : {
        'Motivo Anulación': '',
        'Anulado Por': '',
        'Fecha Anulación': ''
      })
    };
  });

  const invoicesSheet = XLSX.utils.json_to_sheet(invoicesData);
  XLSX.utils.book_append_sheet(workbook, invoicesSheet, 'Facturas');

  // ========================================
  // HOJA 3: MÉTODOS DE PAGO (Solo válidos)
  // ========================================
  const paymentMethodsData = metrics.payment_methods.map(pm => ({
    'Método de Pago': pm.display_name,
    'Cantidad': pm.transaction_count,
    'Monto Total': `S/ ${pm.total_amount.toFixed(2)}`,
    'Porcentaje': `${pm.percentage.toFixed(2)}%`
  }));

  // Agregar fila de total
  paymentMethodsData.push({
    'Método de Pago': '═══ TOTAL ═══',
    'Cantidad': metrics.payment_methods.reduce((sum, pm) => sum + pm.transaction_count, 0),
    'Monto Total': `S/ ${metrics.totals.net_revenue.toFixed(2)}`,
    'Porcentaje': '100.00%'
  });

  const pmSheet = XLSX.utils.json_to_sheet(paymentMethodsData);
  XLSX.utils.book_append_sheet(workbook, pmSheet, 'Métodos de Pago');

  // ========================================
  // HOJA 4: TOP RUTAS (Solo válidos)
  // ========================================
  if (data.charts_data.top_routes.length > 0) {
    const routesData = data.charts_data.top_routes.map((route, index) => ({
      'Ranking': index + 1,
      'Ruta': route.route_name,
      'Origen': route.origin_port,
      'Destino': route.destination_port,
      'Pasajeros': route.total_passengers,
      'Items Carga': route.total_cargo_items,
      'Ingresos': `S/ ${route.total_revenue.toFixed(2)}`,
      'Precio Promedio': `S/ ${route.average_ticket_price.toFixed(2)}`,
      'Cantidad Viajes': route.trip_count,
      'Embarcaciones': route.vessels_used.join(', ')
    }));

    const routesSheet = XLSX.utils.json_to_sheet(routesData);
    XLSX.utils.book_append_sheet(workbook, routesSheet, 'Top Rutas');
  }

  // ========================================
  // HOJA 5: NOTAS DE CRÉDITO/DÉBITO (Solo válidos)
  // ========================================
  const adjustmentsData = [
    [],
    ['NOTAS DE CRÉDITO'],
    ['Total:', metrics.totals.total_credit_notes],
    ['Monto:', `S/ ${metrics.totals.credit_notes_amount.toFixed(2)}`],
    [],
    ['NOTAS DE DÉBITO'],
    ['Total:', metrics.totals.total_debit_notes],
    ['Monto:', `S/ ${metrics.totals.debit_notes_amount.toFixed(2)}`],
    [],
    ['IMPACTO EN VENTAS'],
    ['Ventas Brutas:', `S/ ${metrics.totals.gross_revenue.toFixed(2)}`],
    ['Ajuste NC (-):', `S/ ${metrics.totals.credit_notes_amount.toFixed(2)}`],
    ['Ajuste ND (+):', `S/ ${metrics.totals.debit_notes_amount.toFixed(2)}`],
    ['────────────────────────'],
    ['Ventas Netas:', `S/ ${metrics.totals.net_revenue.toFixed(2)}`],
  ];

  const adjustmentsSheet = XLSX.utils.aoa_to_sheet(adjustmentsData);
  XLSX.utils.book_append_sheet(workbook, adjustmentsSheet, 'Notas Crédito-Débito');

  // Descargar archivo
  const fileName = `Estadisticas_${sellerName.replace(/\s+/g, '_')}_${startDate}_${endDate}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
```

**Beneficios de este enfoque:**

1. ✅ **Transparencia Total:** Usuario ve TODOS los documentos
2. ✅ **Cálculos Correctos:** Métricas excluyen anulados
3. ✅ **Auditoría:** Se puede rastrear qué fue anulado y por qué
4. ✅ **Visual Claro:** Emojis y formato diferenciado
5. ✅ **Información Completa:** Incluye razón de anulación si existe

---

## ✅ Checklist de Implementación Backend

### Validaciones
- [ ] Validar que `user_id` sea un UUID válido
- [ ] Validar que el usuario exista
- [ ] Validar que `start_date` <= `end_date`
- [ ] Validar que el rango no exceda 1 año

### Cálculos - Totales
- [ ] Calcular `total_invoices`, `total_receipts`
- [ ] Calcular `total_credit_notes`, `total_debit_notes`
- [ ] Calcular `gross_revenue`, `credit_notes_amount`, `debit_notes_amount`, `net_revenue`
- [ ] Calcular `average_ticket`, `average_daily_revenue`

### Cálculos - Pasajeros y Carga
- [ ] Contar pasajeros (items con seat_number)
- [ ] Contar items de carga (items sin seat_number)
- [ ] Calcular peso total de carga
- [ ] Calcular porcentajes de ingresos

### Cálculos - Breakdowns
- [ ] Agrupar por métodos de pago con porcentajes
- [ ] Agrupar por tipos de documento con porcentajes
- [ ] Agrupar por estado SUNAT con porcentajes
- [ ] Agrupar por sucursales (si aplica)

### Cálculos - Gráficos
- [ ] Generar ventas diarias con conteo de pasajeros
- [ ] Calcular top 5 rutas más rentables
- [ ] Calcular top 5 productos más vendidos
- [ ] (Opcional) Calcular distribución por hora

### Datos Detallados
- [ ] Retornar facturas con items anidados
- [ ] Incluir representantes si existen
- [ ] Agregar resumen de items por factura
- [ ] Formatear nombres de métodos de pago

### Rendimiento
- [ ] Optimizar queries con JOINS apropiados
- [ ] Usar índices en `user_id`, `issue_date`, `document_type`
- [ ] Considerar paginación si >100 facturas
- [ ] Cachear resultados para períodos comunes

### Response
- [ ] Retornar números como números (NO strings)
- [ ] Usar ISO 8601 para fechas
- [ ] Incluir metadata completa del vendedor
- [ ] Validar estructura del JSON

---

## 🚀 Beneficios Esperados

### Rendimiento
- ✅ **90%+ más rápido** en reportes grandes
- ✅ De 3000+ iteraciones a 0 en el frontend
- ✅ Tiempo de renderizado reducido drásticamente

### Código
- ✅ Eliminar hook `useSellerDetailedStats` completo
- ✅ Componentes más simples y legibles
- ✅ Menos bugs por cálculos incorrectos

### Mantenibilidad
- ✅ Lógica centralizada en el backend
- ✅ Tests unitarios en el backend
- ✅ Un solo punto de verdad para cálculos

### Escalabilidad
- ✅ Backend puede procesar millones de registros
- ✅ Resultados cacheables
- ✅ Paginación eficiente

---

## 📦 Cambios en el Frontend

### Archivos a ELIMINAR
- ❌ `src/hooks/useSellerDetailedStats.ts` - Ya no es necesario

### Archivos a MODIFICAR
- ✅ `src/types/sellerDetailedReport.ts` - Actualizar interfaces
- ✅ `src/features/dashboard/pages/SellerStatisticsDetailPage.tsx` - Usar nuevas métricas
- ✅ `src/utils/exportToExcel.ts` - Usar métricas pre-calculadas
- ✅ `src/services/adminReports.service.ts` - Actualizar tipo de retorno

### Archivos NUEVOS
- ✅ Nuevas interfaces TypeScript para la respuesta

---

## 🔄 Comparación Antes vs Después

### Antes
```typescript
// 1. Fetch data
const data = await adminReportsService.getDailySalesDetailed({...});

// 2. Calcular TODAS las métricas en el frontend
const metrics = calculateMetrics(data); // 3000+ iteraciones

// 3. Usar métricas calculadas
<MetricCard value={metrics.total_revenue} />
<LineChart data={metrics.daily_sales} />
```

### Después
```typescript
// 1. Fetch data (YA incluye todas las métricas)
const response = await adminReportsService.getSellerStatistics({...});

// 2. Usar directamente
<MetricCard value={response.metrics.totals.net_revenue} />
<LineChart data={response.charts_data.daily_sales} />
```

---

## 📞 Notas Adicionales

### Exportación a Excel
La función `exportSellerStatsToExcel` debe actualizarse para usar las nuevas métricas:

```typescript
export const exportSellerStatsToExcel = (data: SellerDetailedReportResponse) => {
  // Ahora puede usar data.metrics directamente
  const summary = [
    ['Total Facturas:', data.metrics.totals.total_invoices],
    ['Ingresos Netos:', data.metrics.totals.net_revenue],
    ['Pasajeros:', data.metrics.passengers_cargo.total_passengers],
    // ... sin necesidad de calcular nada
  ];
};
```

### Manejo de Estados
El componente debe mantener los estados de:
- ✅ Fechas (start_date, end_date)
- ✅ Facturas expandidas (para la tabla)
- ❌ NO necesita calcular métricas

### React Query
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['sellerStatistics', userId, startDate, endDate],
  queryFn: () => adminReportsService.getSellerStatistics({
    user_id: userId,
    start_date: startDate,
    end_date: endDate,
  }),
  enabled: !!userId && !!startDate && !!endDate,
  staleTime: 5 * 60 * 1000, // Cache por 5 minutos
});

// data ya contiene TODO lo necesario
const metrics = data?.metrics;
const chartsData = data?.charts_data;
const invoices = data?.invoices;
```

---

## ✅ Conclusión

El endpoint `/admin/reports/daily-sales-detailed` debe retornar **TODAS las métricas pre-calculadas**:

1. ✅ **Totales generales** - Facturas, boletas, NC, ND, montos
2. ✅ **Pasajeros y carga** - Conteos y porcentajes
3. ✅ **Breakdowns** - Métodos de pago, documentos, SUNAT, sucursales
4. ✅ **Datos para gráficos** - Ventas diarias, top rutas, top productos
5. ✅ **Facturas detalladas** - Con items y representantes anidados
6. ✅ **Paginación** - Si hay muchas facturas

**Resultado:** Frontend 90%+ más rápido, código más limpio, lógica centralizada.

---

**Versión:** 1.0  
**Fecha:** 3 de noviembre de 2025  
**Estado:** ✅ Especificación Completa  
**Equipo:** Frontend - Transportes Romero
