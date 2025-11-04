# Especificación API Backend - Exportación de Reportes

## 📋 Objetivo

Definir la especificación completa para el sistema de **exportación de reportes** en formato Excel (XLSX) y opcionalmente PDF, con generación asíncrona, descarga temporal, y múltiples opciones de filtrado.

---

## 🎯 Principios de Diseño

1. ✅ **Proceso Asíncrono** - No bloquear la UI del usuario
2. ✅ **Múltiples Formatos** - Excel prioritario, PDF opcional
3. ✅ **Múltiples Filtros** - Por sucursal, vendedor, ruta, etc.
4. ✅ **Archivos Temporales** - Se eliminan automáticamente después de 24 horas
5. ✅ **Seguridad** - Validación de permisos por sucursal/vendedor
6. ✅ **Rate Limiting** - Máximo 5 exportaciones por usuario por hora
7. ✅ **Notificaciones** - WebSocket o polling para estado
8. ✅ **Excel Profesional** - Múltiples hojas, estilos, fórmulas, gráficos

---

## 🔗 Endpoints

### 1. Solicitar Exportación

```http
POST /admin/reports/export/request
```

#### Request Body

```typescript
interface ExportRequest {
  // Tipo de exportación
  export_type: "branch" | "seller" | "consolidated" | "route" | "custom";
  
  // Formato del archivo
  format: "excel" | "pdf";  // Excel es prioritario
  
  // Rango de fechas (REQUERIDO)
  start_date: string;       // "YYYY-MM-DD"
  end_date: string;         // "YYYY-MM-DD"
  
  // Filtros específicos según tipo
  filters: {
    branch_id?: number;           // Para export_type = "branch"
    user_id?: string;             // Para export_type = "seller"
    route_id?: number;            // Para export_type = "route"
    
    // Filtros adicionales opcionales
    payment_method?: string;      // "EFECTIVO", "TRANSFERENCIA", etc.
    document_type?: string;       // "01", "03", "07", "08"
    sunat_status?: string;        // "ACEPTADO", "PENDIENTE", "RECHAZADO"
    business_status?: string;     // "PAGADO", "PENDIENTE", "CANCELLED"
    include_cancelled?: boolean;  // Incluir documentos anulados (default: true)
  };
  
  // Opciones de Excel (opcional)
  excel_options?: {
    include_charts: boolean;      // Incluir gráficos (default: true)
    include_summary: boolean;     // Incluir hoja resumen (default: true)
    include_formulas: boolean;    // Incluir fórmulas automáticas (default: true)
    language: "es" | "en";        // Idioma del reporte (default: "es")
  };
  
  // Metadatos opcionales
  metadata?: {
    report_title?: string;        // Título personalizado
    notes?: string;               // Notas adicionales
    requested_by?: string;        // Email del solicitante (auto-detectado)
  };
}
```

#### Ejemplo de Request - Exportar por Sucursal

```json
{
  "export_type": "branch",
  "format": "excel",
  "start_date": "2025-10-01",
  "end_date": "2025-10-31",
  "filters": {
    "branch_id": 1,
    "include_cancelled": true
  },
  "excel_options": {
    "include_charts": true,
    "include_summary": true,
    "include_formulas": true,
    "language": "es"
  },
  "metadata": {
    "report_title": "Reporte Mensual Octubre 2025 - Sucursal Iquitos"
  }
}
```

#### Response Inmediata

```typescript
interface ExportRequestResponse {
  success: true;
  export_id: string;                // ID único: "exp_abc123def456"
  status: "queued" | "processing";  // Estado inicial
  estimated_time_seconds: number;   // Tiempo estimado en segundos
  message: string;                  // Mensaje para el usuario
  check_status_url: string;         // URL para verificar estado
  created_at: string;               // ISO 8601
}
```

**Ejemplo JSON:**
```json
{
  "success": true,
  "export_id": "exp_abc123def456",
  "status": "queued",
  "estimated_time_seconds": 15,
  "message": "Tu reporte se está generando. Te notificaremos cuando esté listo.",
  "check_status_url": "/admin/reports/export/status/exp_abc123def456",
  "created_at": "2025-11-03T15:30:00Z"
}
```

---

### 2. Verificar Estado de Exportación

```http
GET /admin/reports/export/status/{export_id}
```

#### Response - En Proceso

```typescript
interface ExportStatusResponse {
  export_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress_percentage?: number;     // 0-100 (opcional)
  message: string;
  
  // Solo si status = "processing"
  current_step?: string;            // "Calculando métricas", "Generando Excel", etc.
  
  // Solo si status = "completed"
  download_url?: string;
  file_name?: string;
  file_size_bytes?: number;
  expires_at?: string;              // ISO 8601
  
  // Solo si status = "failed"
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  
  created_at: string;
  updated_at: string;
}
```

**Ejemplo - Procesando:**
```json
{
  "export_id": "exp_abc123def456",
  "status": "processing",
  "progress_percentage": 65,
  "message": "Generando hojas de Excel...",
  "current_step": "Creando hoja de resumen ejecutivo (3/7)",
  "created_at": "2025-11-03T15:30:00Z",
  "updated_at": "2025-11-03T15:30:12Z"
}
```

**Ejemplo - Completado:**
```json
{
  "export_id": "exp_abc123def456",
  "status": "completed",
  "progress_percentage": 100,
  "message": "¡Tu reporte está listo para descargar!",
  "download_url": "/admin/reports/export/download/exp_abc123def456",
  "file_name": "REPORTE_SUCURSAL_IQUITOS_OCT2025.xlsx",
  "file_size_bytes": 2457600,
  "expires_at": "2025-11-04T15:30:00Z",
  "created_at": "2025-11-03T15:30:00Z",
  "updated_at": "2025-11-03T15:30:18Z"
}
```

**Ejemplo - Error:**
```json
{
  "export_id": "exp_abc123def456",
  "status": "failed",
  "message": "Error al generar el reporte",
  "error": {
    "code": "INSUFFICIENT_DATA",
    "message": "No se encontraron documentos en el rango de fechas especificado",
    "details": {
      "start_date": "2025-10-01",
      "end_date": "2025-10-31",
      "branch_id": 1
    }
  },
  "created_at": "2025-11-03T15:30:00Z",
  "updated_at": "2025-11-03T15:30:05Z"
}
```

---

### 3. Descargar Archivo

```http
GET /admin/reports/export/download/{export_id}
```

#### Headers de Response

```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="REPORTE_SUCURSAL_IQUITOS_OCT2025.xlsx"
Content-Length: 2457600
```

#### Respuesta
- **200 OK** - Descarga el archivo binario
- **404 Not Found** - Archivo expirado o no existe
- **403 Forbidden** - Sin permisos para descargar

---

### 4. Listar Exportaciones del Usuario

```http
GET /admin/reports/export/history
```

#### Query Parameters

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `page` | number | Página actual (default: 1) |
| `page_size` | number | Items por página (default: 20) |
| `status` | string | Filtrar por estado |

#### Response

```typescript
interface ExportHistoryResponse {
  exports: ExportHistoryItem[];
  pagination: {
    current_page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

interface ExportHistoryItem {
  export_id: string;
  export_type: string;
  format: string;
  status: string;
  file_name?: string;
  file_size_bytes?: number;
  download_url?: string;
  expires_at?: string;
  created_at: string;
  filters_applied: any;
}
```

**Ejemplo JSON:**
```json
{
  "exports": [
    {
      "export_id": "exp_abc123def456",
      "export_type": "branch",
      "format": "excel",
      "status": "completed",
      "file_name": "REPORTE_SUCURSAL_IQUITOS_OCT2025.xlsx",
      "file_size_bytes": 2457600,
      "download_url": "/admin/reports/export/download/exp_abc123def456",
      "expires_at": "2025-11-04T15:30:00Z",
      "created_at": "2025-11-03T15:30:00Z",
      "filters_applied": {
        "branch_id": 1,
        "start_date": "2025-10-01",
        "end_date": "2025-10-31"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "page_size": 20,
    "total_items": 1,
    "total_pages": 1
  }
}
```

---

## 📊 Estructura del Excel por Tipo de Exportación

### 1. Exportación por Sucursal

**Nombre del archivo:** `REPORTE_SUCURSAL_{NOMBRE}_{MES}{AÑO}.xlsx`

Ejemplo: `REPORTE_SUCURSAL_IQUITOS_OCT2025.xlsx`

#### Hojas del Excel (7 hojas)

##### 📄 Hoja 1: Resumen Ejecutivo

**Contenido:**
```
╔═══════════════════════════════════════════════════════════════╗
║           TRANSPORTES ROMERO - REPORTE DE SUCURSAL            ║
║                    SUCURSAL: IQUITOS                          ║
║              Período: 01/10/2025 - 31/10/2025                 ║
║                 Generado: 03/11/2025 15:30                    ║
╚═══════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────┐
│ RESUMEN FINANCIERO                                          │
├─────────────────────────────────────────────────────────────┤
│ Ventas Brutas:                           S/ 125,500.00      │
│ Notas de Crédito:                        S/  (3,200.00)     │
│ Notas de Débito:                         S/     450.00      │
│ ────────────────────────────────────────────────────────     │
│ VENTAS NETAS:                            S/ 122,750.00      │
│                                                              │
│ Total IGV Recaudado:                     S/  18,724.58      │
│ Total Descuentos:                        S/   1,250.00      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ DOCUMENTOS EMITIDOS                                         │
├─────────────────────────────────────────────────────────────┤
│ ✅ Facturas:                                     245        │
│ ✅ Boletas:                                      180        │
│ ❌ Notas de Crédito (Anulaciones):                12        │
│ ⚠️  Notas de Débito (Cargos):                      3        │
│ ────────────────────────────────────────────────────────     │
│ TOTAL DOCUMENTOS:                                440        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ DESGLOSE POR TIPO DE SERVICIO                              │
├─────────────────────────────────────────────────────────────┤
│ 🚢 Pasajes:                              S/  95,800.00  78% │
│ 📦 Encomiendas:                          S/  26,950.00  22% │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ MÉTODOS DE PAGO                                             │
├─────────────────────────────────────────────────────────────┤
│ 💵 Efectivo:                    S/ 45,680.00        37.21%  │
│ 🏦 Transferencia:               S/ 38,920.00        31.71%  │
│ 💳 Tarjeta:                     S/ 28,150.00        22.94%  │
│ 📱 Yape:                        S/ 10,000.00         8.14%  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ TOP 5 VENDEDORES                                            │
├─────────────────────────────────────────────────────────────┤
│ 🥇 Juan Pérez García                     S/ 35,070.00  29%  │
│ 🥈 María López Sánchez                   S/ 28,500.00  23%  │
│ 🥉 Carlos Ramírez Torres                 S/ 22,150.00  18%  │
│ 4️⃣  Ana Gonzáles Díaz                    S/ 18,930.00  15%  │
│ 5️⃣  Luis Fernández Ruiz                  S/ 18,100.00  15%  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ESTADÍSTICAS ADICIONALES                                    │
├─────────────────────────────────────────────────────────────┤
│ Total de Pasajeros:                              840        │
│ Total de Encomiendas:                            156        │
│ Promedio por Ticket:                     S/   285.34        │
│ Promedio Diario:                         S/ 3,959.68        │
│ Días con Ventas:                                  31        │
└─────────────────────────────────────────────────────────────┘

[GRÁFICO DE PASTEL: Métodos de Pago]
[GRÁFICO DE BARRAS: Top 5 Vendedores]
[GRÁFICO DE LÍNEA: Ventas Diarias]
```

**Columnas en formato tabla:**

| Métrica | Valor | Porcentaje |
|---------|-------|------------|
| Ventas Brutas | S/ 125,500.00 | 100.00% |
| Notas de Crédito | (S/ 3,200.00) | -2.55% |
| Notas de Débito | S/ 450.00 | 0.36% |
| **Ventas Netas** | **S/ 122,750.00** | **97.81%** |

---

##### 📄 Hoja 2: Detalle de Facturas

**Estructura de Tabla:**

| # | Serie-Correlativo | Fecha Emisión | Vendedor | Cliente | RUC/DNI | Tipo Servicio | Ruta | Pasajeros | Encomiendas (kg) | Método Pago | Subtotal | IGV | Descuento | Total | Estado SUNAT | Estado Negocio |
|---|-------------------|---------------|----------|---------|---------|---------------|------|-----------|------------------|-------------|----------|-----|-----------|-------|--------------|----------------|
| 1 | F001-00012345 | 15/10/2025 14:30 | Juan Pérez | Carlos Ramírez | 12345678 | Pasaje | Iquitos → Yurimaguas | 1 | - | Efectivo | S/ 126.27 | S/ 22.73 | S/ 0.00 | S/ 149.00 | ✅ Aceptado | ✅ Pagado |
| 2 | F001-00012346 | 15/10/2025 15:45 | María López | Empresa SAC | 20123456789 | Encomienda | Iquitos → Yurimaguas | - | 25.5 | Transferencia | S/ 80.51 | S/ 14.49 | S/ 0.00 | S/ 95.00 | ✅ Aceptado | ✅ Pagado |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

**Totales al final:**
```
TOTAL FACTURAS:     245
TOTAL MONTO:        S/ 85,600.00
TOTAL IGV:          S/ 13,050.85
```

**Características:**
- ✅ Filtros habilitados en todas las columnas
- ✅ Formato condicional (colores por estado)
- ✅ Totales automáticos con fórmulas
- ✅ Fecha en formato local (DD/MM/YYYY HH:MM)
- ✅ Montos con símbolo de moneda y 2 decimales

---

##### 📄 Hoja 3: Detalle de Boletas

**Misma estructura que Facturas**, pero solo boletas (código 03).

---

##### 📄 Hoja 4: Notas de Crédito

**Estructura de Tabla:**

| # | Serie-Correlativo | Fecha Emisión | Vendedor | Cliente | Documento Afectado | Motivo | Subtotal | IGV | Total | Estado SUNAT | Anulado Por | Fecha Anulación |
|---|-------------------|---------------|----------|---------|-------------------|--------|----------|-----|-------|--------------|-------------|-----------------|
| 1 | FC01-00000234 | 16/10/2025 10:15 | Juan Pérez | Ana Gonzáles | F001-00012340 | Devolución de pasaje | (S/ 84.75) | (S/ 15.25) | **(S/ 100.00)** | ✅ Aceptado | admin@transportes.com | 16/10/2025 10:10 |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

**Totales:**
```
TOTAL NOTAS DE CRÉDITO:    12
TOTAL MONTO:               (S/ 3,200.00)
```

**Características:**
- ⚠️ Montos en **ROJO** y entre paréntesis
- ⚠️ Emoji ❌ en la columna de estado visual
- ✅ Información de quién, cuándo y por qué se anuló

---

##### 📄 Hoja 5: Notas de Débito

**Misma estructura que Notas de Crédito**, pero para cargos adicionales.

**Características:**
- ⚠️ Montos en **AZUL** (no negativos)
- ⚠️ Emoji ⚠️ en la columna de estado visual

---

##### 📄 Hoja 6: Estadísticas por Vendedor

**Estructura de Tabla:**

| Ranking | Vendedor | Email | Total Facturas | Total Boletas | Total NC | Total ND | Ventas Brutas | Monto NC | Monto ND | **Ventas Netas** | Promedio Ticket | Total Pasajeros | % del Total |
|---------|----------|-------|----------------|---------------|----------|----------|---------------|----------|----------|------------------|-----------------|-----------------|-------------|
| 🥇 1 | Juan Pérez García | juan.perez@transportes.com | 60 | 29 | 3 | 1 | S/ 35,800.00 | (S/ 850.00) | S/ 120.00 | **S/ 35,070.00** | S/ 402.36 | 142 | 28.57% |
| 🥈 2 | María López Sánchez | maria.lopez@transportes.com | 52 | 26 | 2 | 0 | S/ 28,950.00 | (S/ 450.00) | S/ 0.00 | **S/ 28,500.00** | S/ 371.15 | 118 | 23.21% |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

**Totales:**
```
TOTAL VENDEDORES:           12
TOTAL VENTAS NETAS:         S/ 122,750.00
PROMEDIO POR VENDEDOR:      S/ 10,229.17
```

---

##### 📄 Hoja 7: Análisis por Método de Pago

**Estructura de Tabla:**

| Método de Pago | Total Transacciones | Monto Total | Promedio por Transacción | % del Total | Facturas | Boletas |
|----------------|---------------------|-------------|--------------------------|-------------|----------|---------|
| 💵 Efectivo | 156 | S/ 45,680.00 | S/ 292.82 | 37.21% | 98 | 58 |
| 🏦 Transferencia Bancaria | 142 | S/ 38,920.00 | S/ 274.08 | 31.71% | 92 | 50 |
| 💳 Tarjeta Crédito/Débito | 98 | S/ 28,150.00 | S/ 287.24 | 22.94% | 55 | 43 |
| 📱 Yape | 44 | S/ 10,000.00 | S/ 227.27 | 8.14% | 0 | 44 |

**Gráfico de Pastel embebido.**

---

### 2. Exportación por Vendedor

**Nombre del archivo:** `REPORTE_VENDEDOR_{NOMBRE}_{MES}{AÑO}.xlsx`

Ejemplo: `REPORTE_VENDEDOR_JUAN_PEREZ_OCT2025.xlsx`

#### Hojas del Excel (6 hojas)

1. **Resumen del Vendedor** - Métricas personales
2. **Mis Facturas** - Todas las facturas emitidas
3. **Mis Boletas** - Todas las boletas emitidas
4. **Notas de Crédito** - NC emitidas por este vendedor
5. **Notas de Débito** - ND emitidas por este vendedor
6. **Análisis de Rutas** - Rutas más vendidas por este vendedor

**Diferencias con reporte de sucursal:**
- ✅ Enfocado en un solo vendedor
- ✅ Incluye ranking personal vs otros vendedores
- ✅ Muestra evolución día a día
- ✅ Incluye objetivos/metas si están configurados

---

### 3. Exportación Consolidada (Todas las Sucursales)

**Nombre del archivo:** `REPORTE_CONSOLIDADO_TODAS_SUCURSALES_{MES}{AÑO}.xlsx`

Ejemplo: `REPORTE_CONSOLIDADO_TODAS_SUCURSALES_OCT2025.xlsx`

#### Hojas del Excel (8 hojas)

1. **Resumen General** - Totales de todas las sucursales
2. **Comparativa por Sucursal** - Ranking de sucursales
3. **Detalle Sucursal 1** - Datos de cada sucursal
4. **Detalle Sucursal 2**
5. **...**
6. **Top Vendedores Global** - Los mejores vendedores de todas las sucursales
7. **Análisis de Métodos de Pago Global**
8. **Tendencias Diarias** - Ventas por día de todas las sucursales

---

### 4. Exportación por Ruta

**Nombre del archivo:** `REPORTE_RUTA_{ORIGEN}_{DESTINO}_{MES}{AÑO}.xlsx`

Ejemplo: `REPORTE_RUTA_IQUITOS_YURIMAGUAS_OCT2025.xlsx`

#### Hojas del Excel (5 hojas)

1. **Resumen de la Ruta**
2. **Detalle de Pasajes** - Todos los pasajes vendidos
3. **Detalle de Encomiendas** - Todas las encomiendas
4. **Análisis por Embarcación** - Qué embarcaciones operaron
5. **Ocupación por Viaje** - % de ocupación de cada viaje

---

## 🎨 Especificaciones de Estilo del Excel

### Formato General

```typescript
interface ExcelStyles {
  // Fuentes
  fonts: {
    header: "Arial Black, 14pt, Negrita, Blanco";
    subheader: "Arial, 12pt, Negrita, Azul Oscuro";
    body: "Arial, 10pt, Normal";
    totals: "Arial, 11pt, Negrita";
  };
  
  // Colores
  colors: {
    header_background: "#1E40AF";      // Azul oscuro
    subheader_background: "#3B82F6";   // Azul
    row_even: "#F3F4F6";               // Gris claro
    row_odd: "#FFFFFF";                // Blanco
    totals_background: "#FEF3C7";      // Amarillo claro
    
    // Estados
    accepted: "#10B981";                // Verde
    pending: "#F59E0B";                 // Amarillo
    rejected: "#EF4444";                // Rojo
    cancelled: "#DC2626";               // Rojo oscuro
  };
  
  // Bordes
  borders: {
    header: "Grueso, Negro";
    cells: "Delgado, Gris";
    totals: "Doble, Negro";
  };
  
  // Formatos numéricos
  number_formats: {
    currency: 'S/ #,##0.00';           // S/ 1,234.56
    percentage: '0.00%';                // 12.34%
    integer: '#,##0';                   // 1,234
    decimal: '#,##0.00';                // 1,234.56
  };
}
```

### Formato Condicional

```typescript
interface ConditionalFormatting {
  // Colorear estados SUNAT
  sunat_status: {
    "ACEPTADO": { background: "#D1FAE5", text: "#065F46" },    // Verde claro
    "PENDIENTE": { background: "#FEF3C7", text: "#92400E" },   // Amarillo claro
    "RECHAZADO": { background: "#FEE2E2", text: "#991B1B" }    // Rojo claro
  };
  
  // Colorear estados de negocio
  business_status: {
    "PAGADO": { background: "#D1FAE5", text: "#065F46" },
    "PENDIENTE": { background: "#FEF3C7", text: "#92400E" },
    "CANCELLED": { background: "#FEE2E2", text: "#991B1B" }
  };
  
  // Resaltar top vendedores
  ranking: {
    1: { background: "#FEF3C7", icon: "🥇" },  // Oro
    2: { background: "#F3F4F6", icon: "🥈" },  // Plata
    3: { background: "#FED7AA", icon: "🥉" }   // Bronce
  };
  
  // Barras de datos para porcentajes
  percentage_bars: {
    type: "data_bar";
    color: "#3B82F6";
    show_value: true;
  };
}
```

### Ancho de Columnas

```typescript
interface ColumnWidths {
  // Anchos estándar
  id_column: 5;              // #
  series_column: 18;         // Serie-Correlativo
  date_column: 18;           // Fecha
  name_column: 25;           // Nombres
  email_column: 30;          // Emails
  document_column: 15;       // DNI/RUC
  amount_column: 15;         // Montos
  status_column: 15;         // Estados
  description_column: 35;    // Descripciones
}
```

### Fórmulas Automáticas

```excel
// Total de una columna
=SUM(D2:D500)

// Porcentaje del total
=D2/SUM($D$2:$D$500)*100

// Promedio
=AVERAGE(D2:D500)

// Contar registros
=COUNTA(A2:A500)

// Ventas netas (con NC y ND)
=SUM(Ventas_Brutas) - SUM(NC) + SUM(ND)

// Promedio ticket
=SUM(Total)/COUNTA(Documentos)
```

---

## 📐 Gráficos Embebidos

### 1. Gráfico de Pastel - Métodos de Pago

```typescript
interface PieChart {
  type: "pie";
  title: "Distribución por Método de Pago";
  data_range: "G2:H6";          // Método, Monto
  position: "J2";               // Celda superior izquierda
  size: { width: 400, height: 300 };
  show_legend: true;
  show_percentages: true;
  colors: ["#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B"];
}
```

### 2. Gráfico de Barras - Top Vendedores

```typescript
interface BarChart {
  type: "bar";
  orientation: "horizontal";
  title: "Top 5 Vendedores del Mes";
  data_range: "B2:C6";          // Vendedor, Ventas Netas
  position: "J15";
  size: { width: 500, height: 350 };
  show_values: true;
  sort: "descending";
  color: "#3B82F6";
}
```

### 3. Gráfico de Línea - Tendencia Diaria

```typescript
interface LineChart {
  type: "line";
  title: "Ventas Diarias del Período";
  data_range: "A2:B32";         // Fecha, Ventas Netas
  position: "J30";
  size: { width: 600, height: 300 };
  show_markers: true;
  show_trend_line: true;
  x_axis_label: "Fecha";
  y_axis_label: "Ventas (S/)";
  color: "#3B82F6";
}
```

---

## 🔒 Seguridad y Permisos

### Validaciones en Backend

```typescript
interface SecurityValidations {
  // 1. Validar permisos del usuario
  user_permissions: {
    can_export_branch: (user_id: string, branch_id: number) => boolean;
    can_export_seller: (user_id: string, seller_id: string) => boolean;
    can_export_consolidated: (user_id: string) => boolean;
  };
  
  // 2. Rate Limiting
  rate_limits: {
    max_exports_per_hour: 5;
    max_exports_per_day: 20;
    max_concurrent_exports: 2;
  };
  
  // 3. Validación de rango de fechas
  date_validations: {
    max_range_days: 365;           // Máximo 1 año
    cannot_be_future: true;
    start_must_be_before_end: true;
  };
  
  // 4. Tamaño del archivo
  file_size_limits: {
    max_size_mb: 50;               // Máximo 50MB
    warn_if_exceeds_mb: 20;        // Advertir si supera 20MB
  };
}
```

### Respuestas de Error

```typescript
// Error: Sin permisos
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "No tienes permisos para exportar datos de esta sucursal",
    "details": {
      "branch_id": 1,
      "required_permission": "export:branch:1"
    }
  }
}

// Error: Rate limit excedido
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Has alcanzado el límite de exportaciones por hora",
    "details": {
      "limit": 5,
      "reset_at": "2025-11-03T16:30:00Z"
    }
  }
}

// Error: Rango de fechas inválido
{
  "success": false,
  "error": {
    "code": "INVALID_DATE_RANGE",
    "message": "El rango de fechas no puede superar 365 días",
    "details": {
      "start_date": "2024-01-01",
      "end_date": "2025-10-31",
      "days_requested": 669
    }
  }
}
```

---

## ⏱️ Proceso Asíncrono Detallado

### Estados del Proceso

```typescript
enum ExportStatus {
  QUEUED = "queued",           // En cola de procesamiento
  PROCESSING = "processing",   // Generando el reporte
  COMPLETED = "completed",     // Listo para descargar
  FAILED = "failed",           // Error en la generación
  EXPIRED = "expired"          // Archivo ya expiró
}
```

### Pasos del Procesamiento

```typescript
interface ProcessingSteps {
  steps: [
    {
      step: 1,
      name: "Validando permisos y parámetros",
      estimated_time_seconds: 1
    },
    {
      step: 2,
      name: "Consultando base de datos",
      estimated_time_seconds: 3
    },
    {
      step: 3,
      name: "Calculando métricas y totales",
      estimated_time_seconds: 4
    },
    {
      step: 4,
      name: "Creando estructura del Excel",
      estimated_time_seconds: 2
    },
    {
      step: 5,
      name: "Generando hojas de datos",
      estimated_time_seconds: 5
    },
    {
      step: 6,
      name: "Aplicando estilos y formatos",
      estimated_time_seconds: 2
    },
    {
      step: 7,
      name: "Creando gráficos",
      estimated_time_seconds: 3
    },
    {
      step: 8,
      name: "Guardando archivo",
      estimated_time_seconds: 1
    }
  ];
  total_estimated_time: 21;  // segundos
}
```

### WebSocket para Notificaciones (Opcional)

```typescript
// Frontend subscribe
socket.on(`export:${export_id}`, (data) => {
  console.log(data);
});

// Backend emit - Progreso
{
  "export_id": "exp_abc123",
  "event": "progress",
  "status": "processing",
  "progress_percentage": 45,
  "current_step": "Generando hojas de datos (5/8)",
  "timestamp": "2025-11-03T15:30:10Z"
}

// Backend emit - Completado
{
  "export_id": "exp_abc123",
  "event": "completed",
  "status": "completed",
  "download_url": "/admin/reports/export/download/exp_abc123",
  "file_name": "REPORTE_SUCURSAL_IQUITOS_OCT2025.xlsx",
  "file_size_bytes": 2457600,
  "timestamp": "2025-11-03T15:30:18Z"
}

// Backend emit - Error
{
  "export_id": "exp_abc123",
  "event": "failed",
  "status": "failed",
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Error al consultar la base de datos"
  },
  "timestamp": "2025-11-03T15:30:08Z"
}
```

---

## 🗑️ Limpieza de Archivos

### Política de Expiración

```typescript
interface FileCleanupPolicy {
  // Archivos se eliminan después de 24 horas
  expiration_hours: 24;
  
  // Job de limpieza se ejecuta cada hora
  cleanup_job_interval: "0 * * * *";  // Cron: cada hora
  
  // Advertir al usuario 2 horas antes de expirar
  warn_before_expiration_hours: 2;
  
  // Máximo de archivos por usuario (histórico)
  max_files_per_user: 50;
  
  // Si se excede, eliminar los más antiguos
  cleanup_strategy: "oldest_first";
}
```

### Notificación de Expiración

```json
{
  "notification_type": "export_expiring_soon",
  "export_id": "exp_abc123",
  "file_name": "REPORTE_SUCURSAL_IQUITOS_OCT2025.xlsx",
  "expires_at": "2025-11-04T15:30:00Z",
  "hours_remaining": 2,
  "download_url": "/admin/reports/export/download/exp_abc123",
  "message": "Tu reporte expirará en 2 horas. Descárgalo ahora para no perderlo."
}
```

---

## 📊 Estimación de Tamaños de Archivo

### Tabla de Referencia

| Documentos | Hojas | Gráficos | Tamaño Estimado | Tiempo Generación |
|------------|-------|----------|-----------------|-------------------|
| 1-100 | 7 | 3 | ~500 KB | ~5 segundos |
| 101-500 | 7 | 3 | ~1.5 MB | ~10 segundos |
| 501-1000 | 7 | 3 | ~3 MB | ~15 segundos |
| 1001-2000 | 7 | 3 | ~6 MB | ~25 segundos |
| 2001-5000 | 7 | 3 | ~15 MB | ~45 segundos |
| 5001+ | 7 | 3 | ~30 MB | ~90 segundos |

### Cálculo Dinámico

```typescript
function estimateFileSize(documentCount: number): {
  size_bytes: number;
  size_mb: number;
  generation_time_seconds: number;
} {
  // Aproximación: 3KB por documento + 200KB de overhead
  const size_bytes = (documentCount * 3000) + 200000;
  const size_mb = size_bytes / 1048576;
  
  // Tiempo: 0.01 segundos por documento + 5 segundos de overhead
  const generation_time_seconds = Math.ceil((documentCount * 0.01) + 5);
  
  return { size_bytes, size_mb, generation_time_seconds };
}
```

---

## 🎯 Casos de Uso Específicos

### Caso 1: Reporte Mensual de Sucursal para Gerencia

```http
POST /admin/reports/export/request
{
  "export_type": "branch",
  "format": "excel",
  "start_date": "2025-10-01",
  "end_date": "2025-10-31",
  "filters": {
    "branch_id": 1
  },
  "excel_options": {
    "include_charts": true,
    "include_summary": true,
    "language": "es"
  },
  "metadata": {
    "report_title": "Reporte Mensual - Octubre 2025",
    "notes": "Para presentación a gerencia general"
  }
}
```

**Resultado:**
- Excel con 7 hojas
- Gráficos embebidos
- Formato profesional
- Listo para imprimir o enviar por email

---

### Caso 2: Análisis de Rendimiento de Vendedor

```http
POST /admin/reports/export/request
{
  "export_type": "seller",
  "format": "excel",
  "start_date": "2025-01-01",
  "end_date": "2025-10-31",
  "filters": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000"
  },
  "excel_options": {
    "include_charts": true,
    "include_summary": true,
    "language": "es"
  },
  "metadata": {
    "report_title": "Análisis Anual - Juan Pérez García"
  }
}
```

**Resultado:**
- Reporte personalizado del vendedor
- Comparativa con otros vendedores
- Evolución mensual
- Objetivos vs logros

---

### Caso 3: Auditoría de Documentos Anulados

```http
POST /admin/reports/export/request
{
  "export_type": "custom",
  "format": "excel",
  "start_date": "2025-10-01",
  "end_date": "2025-10-31",
  "filters": {
    "business_status": "CANCELLED",
    "include_cancelled": true
  },
  "excel_options": {
    "include_charts": false,
    "include_summary": true,
    "language": "es"
  },
  "metadata": {
    "report_title": "Auditoría de Documentos Anulados - Octubre 2025"
  }
}
```

**Resultado:**
- Solo documentos anulados
- Información de quién, cuándo, por qué
- Análisis de patrones
- Útil para auditorías

---

## ✅ Checklist de Implementación Backend

### 1. API Endpoints
- [ ] Implementar POST `/admin/reports/export/request`
- [ ] Implementar GET `/admin/reports/export/status/{id}`
- [ ] Implementar GET `/admin/reports/export/download/{id}`
- [ ] Implementar GET `/admin/reports/export/history`

### 2. Validaciones
- [ ] Validar permisos por sucursal/vendedor
- [ ] Validar rango de fechas (máximo 365 días)
- [ ] Validar que start_date <= end_date
- [ ] Implementar rate limiting (5 por hora)
- [ ] Validar que filtros existan (branch_id, user_id, etc.)

### 3. Procesamiento Asíncrono
- [ ] Implementar cola de trabajos (Redis, Bull, etc.)
- [ ] Implementar workers para generar Excel
- [ ] Implementar sistema de notificaciones (WebSocket/polling)
- [ ] Manejar timeouts (máximo 2 minutos)
- [ ] Manejar errores y reintentos

### 4. Generación de Excel
- [ ] Instalar librería (exceljs, xlsx, etc.)
- [ ] Implementar generación de hojas múltiples
- [ ] Implementar estilos y formatos
- [ ] Implementar fórmulas automáticas
- [ ] Implementar gráficos embebidos
- [ ] Implementar formato condicional

### 5. Almacenamiento de Archivos
- [ ] Configurar storage (local, S3, etc.)
- [ ] Implementar generación de URLs temporales
- [ ] Implementar job de limpieza (cada hora)
- [ ] Implementar expiración (24 horas)
- [ ] Implementar compresión (opcional)

### 6. Base de Datos
- [ ] Crear tabla `export_requests`
- [ ] Crear índices necesarios
- [ ] Implementar queries optimizados
- [ ] Implementar cache si es necesario

### 7. Seguridad
- [ ] Implementar autenticación JWT
- [ ] Implementar autorización por roles
- [ ] Validar inyección SQL
- [ ] Sanitizar inputs
- [ ] Implementar CORS

### 8. Monitoreo
- [ ] Logs de generación de reportes
- [ ] Métricas de tiempo de generación
- [ ] Alertas si falla generación
- [ ] Dashboard de uso

### 9. Testing
- [ ] Tests unitarios de validaciones
- [ ] Tests de generación de Excel
- [ ] Tests de permisos
- [ ] Tests de rate limiting
- [ ] Tests de limpieza de archivos

### 10. Documentación
- [ ] Swagger/OpenAPI
- [ ] Ejemplos de requests
- [ ] Ejemplos de responses
- [ ] Códigos de error

---

## 🚀 Beneficios de Esta Implementación

1. ✅ **Escalable** - Funciona con 10 o 10,000 documentos
2. ✅ **No bloquea UI** - Proceso asíncrono
3. ✅ **Profesional** - Excel con formato de calidad
4. ✅ **Flexible** - Múltiples tipos de exportación
5. ✅ **Seguro** - Validación de permisos y rate limiting
6. ✅ **Mantenible** - Código organizado en workers
7. ✅ **Auditable** - Registro de todas las exportaciones
8. ✅ **Eficiente** - Usa caché y optimizaciones

---

## 📞 Preguntas Frecuentes (FAQ)

### ¿Por qué proceso asíncrono?
Generar un Excel con 5,000 documentos puede tardar 30-60 segundos. No podemos hacer esperar al usuario con la UI congelada.

### ¿Por qué expiran los archivos?
Para no llenar el servidor de archivos antiguos. 24 horas es suficiente para descargar.

### ¿Puedo generar PDF también?
Sí, pero Excel es prioritario porque permite análisis adicional en el archivo.

### ¿Qué pasa si el usuario cierra la ventana?
El archivo se sigue generando en background. Puede volver después y descargarlo desde el historial.

### ¿Puedo exportar más de 1 año?
No, el máximo es 365 días para evitar archivos muy pesados.

### ¿Qué pasa si hay muchas solicitudes simultáneas?
El sistema usa cola. Las solicitudes se procesan en orden (FIFO).

---

## 📝 Notas Finales

Esta especificación cubre:
- ✅ 4 tipos de exportación (sucursal, vendedor, consolidado, ruta)
- ✅ Proceso asíncrono completo
- ✅ Estructura detallada del Excel
- ✅ Seguridad y permisos
- ✅ Limpieza automática
- ✅ WebSocket para notificaciones
- ✅ Rate limiting
- ✅ Múltiples formatos (Excel prioritario)

El backend tiene todo lo necesario para implementar un sistema de exportación **robusto, escalable y profesional**.

---

**Versión:** 1.0  
**Fecha:** 3 de noviembre de 2025  
**Estado:** ✅ Especificación Completa  
**Equipo:** Frontend - Transportes Romero  
**Complementa a:** BACKEND_REPORTS_API_SPECIFICATION.md
