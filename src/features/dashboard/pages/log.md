<<<<<<< HEAD

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
=======
# Guía Frontend - Implementación de Reportes Administrativos

## 📋 Introducción

Esta guía está diseñada para desarrolladores frontend que necesiten implementar la funcionalidad completa de *Reportes Administrativos* en la aplicación web.

Los reportes están diseñados exclusivamente para *administradores* que necesiten controlar el desempeño de vendedores, auditar ventas y realizar análisis financiero.

---

## 🔐 Autenticación y Permisos

Todos los endpoints requieren autenticación Bearer Token:


Authorization: Bearer {token}
Content-Type: application/json


### Permisos Requeridos
- *Acceso a reportes*: Solo admin (administradores)
- *Exportación*: Solo admin (administradores)

> ⚠ *IMPORTANTE*: Estos endpoints están restringidos únicamente a usuarios con rol de administrador.

---

## 📊 REPORTES DISPONIBLES

### 1. Reporte de Ventas Diarias por Usuario

*Endpoint:* GET /admin/reports/daily-sales

*Parámetros de consulta:*

?start_date=2024-01-01
&end_date=2024-01-31
&user_id=5                    # Opcional: filtrar por vendedor específico
&branch_office_id=2           # Opcional: filtrar por sucursal
&payment_method=efectivo      # Opcional: filtrar por método de pago
&format=json                  # Opcional: json, excel, csv


*Response JSON:*
json
{
  "report_type": "daily_sales_by_user",
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "filters_applied": {
    "user_id": 5,
    "branch_office_id": 2,
    "payment_method": "efectivo"
  },
  "summary": {
    "total_invoices": 156,
    "total_net_amount": 45678.90,
    "total_tax_amount": 8222.20,
    "total_gross_amount": 53901.10,
    "unique_users": 8,
    "unique_clients": 89
  },
  "items": [
    {
      "invoice_id": 1234,
      "invoice_series": "F001",
      "invoice_number": 156,
      "invoice_date": "2024-01-15",
      "invoice_time": "14:30:00",
      "user_id": 5,
      "user_name": "Juan Pérez",
      "user_email": "juan.perez@empresa.com",
      "branch_office_id": 2,
      "branch_office_name": "Sucursal Lima Centro",
      "client_id": 89,
      "client_name": "Transportes ABC SAC",
      "client_document_type": "6",
      "client_document_number": "20123456789",
      "client_phone": "+51987654321",
      "client_email": "contacto@transportesabc.com",
      "trip_id": 567,
      "trip_name": "Lima - Arequipa",
      "route_name": "Ruta Sur",
      "vessel_name": "Bus Mercedes 001",
      "boarding_port": "Terminal Lima",
      "disembarking_port": "Terminal Arequipa",
      "departure_time": "08:00:00",
      "passenger_name": "María García",
      "seat_number": "A15",
      "document_type": "01",
      "document_status": "ACCEPTED",
      "sunat_status": "ACEPTADO",
      "payment_method": "efectivo",
      "currency": "PEN",
      "quantity_sold": 1,
      "net_amount": 85.00,
      "tax_amount": 15.30,
      "gross_amount": 100.30,
      "operation_code": "OP-2024-001234"
    }
  ]
}


### 2. Resumen de Ventas por Período

*Endpoint:* GET /admin/reports/sales-summary

*Parámetros de consulta:*

?start_date=2024-01-01
&end_date=2024-01-31
&group_by=user              # user, branch_office, payment_method
&format=json


*Response JSON:*
json
{
  "report_type": "sales_summary",
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "group_by": "user",
  "summary": {
    "total_invoices": 456,
    "total_net_amount": 123456.78,
    "total_tax_amount": 22222.22,
    "total_gross_amount": 145678.90
  },
  "items": [
    {
      "group_key": "5",
      "group_name": "Juan Pérez",
      "invoice_count": 89,
      "net_amount": 25678.90,
      "tax_amount": 4622.20,
      "gross_amount": 30301.10,
      "percentage_of_total": 20.8
    },
    {
      "group_key": "8",
      "group_name": "Ana López",
      "invoice_count": 67,
      "net_amount": 19456.78,
      "tax_amount": 3502.22,
      "gross_amount": 22959.00,
      "percentage_of_total": 15.7
    }
  ]
}


### 3. Ingresos por Ruta

*Endpoint:* GET /admin/reports/route-revenue

*Parámetros de consulta:*

?start_date=2024-01-01
&end_date=2024-01-31
&route_id=3                 # Opcional: filtrar por ruta específica
&format=json


*Response JSON:*
json
{
  "report_type": "route_revenue",
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "summary": {
    "total_routes": 12,
    "total_trips": 234,
    "total_passengers": 5678,
    "total_revenue": 567890.12
  },
  "items": [
    {
      "route_id": 3,
      "route_name": "Lima - Arequipa",
      "origin_port": "Terminal Lima",
      "destination_port": "Terminal Arequipa",
      "trip_count": 45,
      "passenger_count": 1234,
      "total_revenue": 123456.78,
      "average_revenue_per_trip": 2743.48,
      "occupancy_rate": 87.5
    }
  ]
}


### 4. Ocupación de Embarcaciones

*Endpoint:* GET /admin/reports/vessel-occupancy

*Parámetros de consulta:*

?start_date=2024-01-01
&end_date=2024-01-31
&vessel_id=7                # Opcional: filtrar por embarcación específica
&format=json


*Response JSON:*
json
{
  "report_type": "vessel_occupancy",
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "summary": {
    "total_vessels": 8,
    "total_trips": 456,
    "average_occupancy": 78.5
  },
  "items": [
    {
      "vessel_id": 7,
      "vessel_name": "Bus Mercedes 001",
      "vessel_capacity": 45,
      "trip_count": 67,
      "total_passengers": 2345,
      "occupancy_rate": 78.2,
      "revenue_generated": 234567.89
    }
  ]
}


### 5. Análisis de Métodos de Pago

*Endpoint:* GET /admin/reports/payment-methods

*Parámetros de consulta:*

?start_date=2024-01-01
&end_date=2024-01-31
&format=json


*Response JSON:*
json
{
  "report_type": "payment_methods",
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "summary": {
    "total_transactions": 1234,
    "total_amount": 456789.12
  },
  "items": [
    {
      "payment_method": "efectivo",
      "transaction_count": 567,
      "total_amount": 234567.89,
      "percentage_of_transactions": 45.9,
      "percentage_of_amount": 51.3
    },
    {
      "payment_method": "tarjeta",
      "transaction_count": 345,
      "total_amount": 123456.78,
      "percentage_of_transactions": 27.9,
      "percentage_of_amount": 27.0
    }
  ]
}


### 6. Rendimiento de Vendedores

*Endpoint:* GET /admin/reports/sales-performance

*Parámetros de consulta:*

?start_date=2024-01-01
&end_date=2024-01-31
&user_id=5                  # Opcional: vendedor específico
&format=json


*Response JSON:*
json
{
  "report_type": "sales_performance",
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "summary": {
    "total_sellers": 12,
    "total_sales": 456789.12,
    "average_sales_per_seller": 38065.76
  },
  "items": [
    {
      "user_id": 5,
      "user_name": "Juan Pérez",
      "user_email": "juan.perez@empresa.com",
      "branch_office_name": "Sucursal Lima Centro",
      "invoice_count": 89,
      "passenger_count": 156,
      "total_sales": 67890.12,
      "average_sale_amount": 762.59,
      "best_selling_route": "Lima - Arequipa",
      "performance_rank": 1
    }
  ]
}


### 7. Análisis de Rutas Populares

*Endpoint:* GET /admin/reports/popular-routes

*Parámetros de consulta:*

?start_date=2024-01-01
&end_date=2024-01-31
&limit=10                   # Top N rutas más populares
&format=json


*Response JSON:*
json
{
  "report_type": "popular_routes",
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "summary": {
    "total_routes_analyzed": 25,
    "total_passengers": 12345,
    "total_revenue": 1234567.89
  },
  "items": [
    {
      "route_id": 3,
      "route_name": "Lima - Arequipa",
      "origin_port": "Terminal Lima",
      "destination_port": "Terminal Arequipa",
      "passenger_count": 2345,
      "trip_count": 67,
      "total_revenue": 345678.90,
      "popularity_rank": 1,
      "market_share_passengers": 19.0,
      "market_share_revenue": 28.0
    }
  ]
}


---

## 📥 EXPORTACIÓN DE REPORTES

### Exportar a Excel

*Endpoint:* GET /admin/reports/{report_type}?format=excel

*Ejemplo:*

GET /admin/reports/daily-sales?start_date=2024-01-01&end_date=2024-01-31&format=excel


*Response:* Archivo Excel (.xlsx) para descarga directa

### Exportar a CSV

*Endpoint:* GET /admin/reports/{report_type}?format=csv

*Ejemplo:*

GET /admin/reports/daily-sales?start_date=2024-01-01&end_date=2024-01-31&format=csv


*Response:* Archivo CSV para descarga directa

---

## 🎯 ENDPOINT PRINCIPAL UNIFICADO

### Obtener Cualquier Reporte

*Endpoint:* GET /admin/reports/

*Parámetros de consulta:*

?report_type=daily_sales_by_user    # Requerido: tipo de reporte
&start_date=2024-01-01              # Requerido: fecha inicio
&end_date=2024-01-31                # Requerido: fecha fin
&user_id=5                          # Opcional: filtros específicos
&branch_office_id=2                 # Opcional: filtros específicos
&payment_method=efectivo            # Opcional: filtros específicos
&format=json                        # Opcional: json, excel, csv


*Tipos de reporte disponibles:*
- daily_sales_by_user - Ventas diarias por usuario
- sales_summary - Resumen de ventas
- route_revenue - Ingresos por ruta
- vessel_occupancy - Ocupación de embarcaciones
- payment_methods - Análisis de métodos de pago
- sales_performance - Rendimiento de vendedores
- popular_routes - Rutas más populares

---

## 💻 IMPLEMENTACIÓN EN FRONTEND

### 1. Función Base para Llamadas API

javascript
// Función base para obtener reportes
const getReport = async (reportType, filters = {}) => {
  const params = new URLSearchParams({
    report_type: reportType,
    ...filters
  });
  
  const response = await fetch(`/admin/reports/?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
};

// Función para exportar reportes
const exportReport = async (reportType, filters = {}, format = 'excel') => {
  const params = new URLSearchParams({
    report_type: reportType,
    format: format,
    ...filters
  });
  
  const response = await fetch(`/admin/reports/?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  
  // Descargar archivo
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.${format}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};


### 2. Componente de Filtros

javascript
// Componente para filtros de reportes
const ReportFilters = ({ onFiltersChange, reportType }) => {
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    user_id: '',
    branch_office_id: '',
    payment_method: ''
  });
  
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };
  
  return (
    <div className="report-filters">
      <div className="filter-group">
        <label>Fecha Inicio:</label>
        <input 
          type="date" 
          value={filters.start_date}
          onChange={(e) => handleFilterChange('start_date', e.target.value)}
          required
        />
      </div>
      
      <div className="filter-group">
        <label>Fecha Fin:</label>
        <input 
          type="date" 
          value={filters.end_date}
          onChange={(e) => handleFilterChange('end_date', e.target.value)}
          required
        />
      </div>
      
      {reportType === 'daily_sales_by_user' && (
        <>
          <div className="filter-group">
            <label>Vendedor:</label>
            <select 
              value={filters.user_id}
              onChange={(e) => handleFilterChange('user_id', e.target.value)}
            >
              <option value="">Todos los vendedores</option>
              {/* Cargar opciones dinámicamente */}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Método de Pago:</label>
            <select 
              value={filters.payment_method}
              onChange={(e) => handleFilterChange('payment_method', e.target.value)}
            >
              <option value="">Todos los métodos</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
};


### 3. Componente Principal de Reportes

javascript
// Componente principal para mostrar reportes
const AdminReports = () => {
  const [reportType, setReportType] = useState('daily_sales_by_user');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  
  const loadReport = async () => {
    if (!filters.start_date || !filters.end_date) {
      alert('Por favor selecciona las fechas de inicio y fin');
      return;
    }
    
    setLoading(true);
    try {
      const data = await getReport(reportType, filters);
      setReportData(data);
    } catch (error) {
      console.error('Error cargando reporte:', error);
      alert('Error cargando el reporte');
    } finally {
      setLoading(false);
    }
  };
  
  const handleExport = async (format) => {
    try {
      await exportReport(reportType, filters, format);
    } catch (error) {
      console.error('Error exportando reporte:', error);
      alert('Error exportando el reporte');
    }
  };
  
  return (
    <div className="admin-reports">
      <h1>Reportes Administrativos</h1>
      
      <div className="report-controls">
        <div className="report-type-selector">
          <label>Tipo de Reporte:</label>
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="daily_sales_by_user">Ventas Diarias por Usuario</option>
            <option value="sales_summary">Resumen de Ventas</option>
            <option value="route_revenue">Ingresos por Ruta</option>
            <option value="vessel_occupancy">Ocupación de Embarcaciones</option>
            <option value="payment_methods">Métodos de Pago</option>
            <option value="sales_performance">Rendimiento de Vendedores</option>
            <option value="popular_routes">Rutas Populares</option>
          </select>
        </div>
        
        <ReportFilters 
          reportType={reportType}
          onFiltersChange={setFilters}
        />
        
        <div className="report-actions">
          <button onClick={loadReport} disabled={loading}>
            {loading ? 'Cargando...' : 'Generar Reporte'}
          </button>
          
          {reportData && (
            <>
              <button onClick={() => handleExport('excel')}>
                Exportar Excel
              </button>
              <button onClick={() => handleExport('csv')}>
                Exportar CSV
              </button>
            </>
          )}
        </div>
      </div>
      
      {reportData && (
        <ReportDisplay data={reportData} type={reportType} />
      )}
    </div>
  );
};


### 4. Componente para Mostrar Datos

javascript
// Componente para mostrar los datos del reporte
const ReportDisplay = ({ data, type }) => {
  if (!data || !data.items) return null;
  
  return (
    <div className="report-display">
      <div className="report-summary">
        <h3>Resumen del Período</h3>
        <div className="summary-grid">
          {Object.entries(data.summary).map(([key, value]) => (
            <div key={key} className="summary-item">
              <span className="label">{formatLabel(key)}:</span>
              <span className="value">{formatValue(key, value)}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="report-table">
        <h3>Detalle</h3>
        <table>
          <thead>
            <tr>
              {getTableHeaders(type).map(header => (
                <th key={header.key}>{header.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index}>
                {getTableHeaders(type).map(header => (
                  <td key={header.key}>
                    {formatCellValue(header.key, item[header.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Funciones auxiliares
const formatLabel = (key) => {
  const labels = {
    total_invoices: 'Total Facturas',
    total_net_amount: 'Monto Neto Total',
    total_tax_amount: 'IGV Total',
    total_gross_amount: 'Monto Bruto Total',
    unique_users: 'Vendedores Únicos',
    unique_clients: 'Clientes Únicos'
  };
  return labels[key] || key;
};

const formatValue = (key, value) => {
  if (key.includes('amount')) {
    return `S/ ${parseFloat(value).toFixed(2)}`;
  }
  return value;
};

const getTableHeaders = (type) => {
  const headers = {
    daily_sales_by_user: [
      { key: 'invoice_series', label: 'Serie' },
      { key: 'invoice_number', label: 'Número' },
      { key: 'invoice_date', label: 'Fecha' },
      { key: 'user_name', label: 'Vendedor' },
      { key: 'client_name', label: 'Cliente' },
      { key: 'passenger_name', label: 'Pasajero' },
      { key: 'trip_name', label: 'Viaje' },
      { key: 'seat_number', label: 'Asiento' },
      { key: 'payment_method', label: 'Pago' },
      { key: 'gross_amount', label: 'Total' }
    ],
    sales_summary: [
      { key: 'group_name', label: 'Nombre' },
      { key: 'invoice_count', label: 'Facturas' },
      { key: 'gross_amount', label: 'Total Ventas' },
      { key: 'percentage_of_total', label: '% del Total' }
    ]
    // Agregar más según necesidad
  };
  
  return headers[type] || [];
};


---

## 🚨 CONSIDERACIONES IMPORTANTES

### ✅ *Seguridad*
- Todos los endpoints requieren rol de *administrador*
- Validación de permisos en cada solicitud
- Filtrado de datos sensibles según el usuario

### ⚡ *Rendimiento*
- Los reportes pueden contener *grandes volúmenes de datos*
- Implementar *paginación* para reportes extensos
- Usar *loading states* durante la carga
- Considerar *cache* para reportes frecuentes

### 📱 *UX/UI*
- Mostrar *indicadores de progreso* durante la carga
- Implementar *filtros intuitivos* con validación
- Proporcionar *exportación* en múltiples formatos
- *Responsive design* para diferentes dispositivos

### 🔍 *Validaciones*
- *Fechas requeridas* para todos los reportes
- *Rangos de fechas válidos* (no futuras, no muy extensas)
- *Filtros opcionales* con valores válidos
- *Manejo de errores* con mensajes claros

---

## 📞 Soporte

Para dudas o problemas con la implementación:
- Revisar logs del servidor en /logs/
- Verificar permisos de usuario (solo administradores)
- Validar formato de fechas (YYYY-MM-DD)
- Consultar documentación de la API

---

Documentación generada para Romero API - Sistema de Reportes Administrativos
>>>>>>> 50a34cbf2a9176684bad5414dbf2330668046542
