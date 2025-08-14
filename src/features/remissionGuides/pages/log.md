# 📋 Guía Completa: Guías de Remisión Electrónicas (GRE)

## 🎯 Introducción

Las Guías de Remisión Electrónicas (GRE) son documentos tributarios obligatorios que sustentan el traslado de bienes. Este sistema implementa el flujo completo desde la creación hasta la recepción del Comprobante de Recepción (CDR) de SUNAT.

## 🔄 Flujo Completo de Estados

mermaid
graph TD
    A[PENDING] --> B[GENERATED]
    B --> C[SIGNED]
    C --> D[SENT]
    D --> E[ACCEPTED]
    E --> F[RECEIVED]
    D --> G[REJECTED]
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#bfb,stroke:#333,stroke-width:2px
    style D fill:#ffb,stroke:#333,stroke-width:2px
    style E fill:#bff,stroke:#333,stroke-width:2px
    style F fill:#bfb,stroke:#333,stroke-width:2px
    style G fill:#fbb,stroke:#333,stroke-width:2px


### Estados Explicados:

- *PENDING*: Guía creada, esperando generación del XML
- *GENERATED*: XML generado correctamente
- *SIGNED*: XML firmado digitalmente
- *SENT*: Enviado a SUNAT, esperando respuesta
- *ACCEPTED*: SUNAT acepta el documento, esperando CDR
- *RECEIVED*: CDR recibido y procesado (estado final exitoso)
- *REJECTED*: SUNAT rechaza el documento

## 🛠 Endpoints para Frontend

### 1. Gestión Básica de Guías

#### 📝 Crear Nueva Guía
http
POST /remission-guides/
Content-Type: application/json
Authorization: Bearer {token}

{
  "company_id": 1,
  "branch_office_id": 1,
  "document_series_id": 1,
  "issue_date": "2024-12-19",
  "transfer_reason_code": "01",
  "transfer_reason_description": "Venta",
  "transfer_start_date": "2024-12-19T08:00:00",
  "gross_total_weight": 100.50,
  "number_of_packages": 5,
  "transport_mode_code": "02",
  "sender": {
    "document_type_code": "6",
    "document_number": "20123456789",
    "business_name": "Empresa Remitente SAC"
  },
  "receiver": {
    "document_type_code": "6",
    "document_number": "20987654321",
    "business_name": "Empresa Destinataria SAC"
  },
  "origin_address": {
    "ubigeo_code": "150101",
    "address": "Av. Principal 123"
  },
  "destination_address": {
    "ubigeo_code": "150102",
    "address": "Av. Secundaria 456"
  },
  "items": [
    {
      "description": "Producto A",
      "quantity": 10,
      "unit_code": "NIU",
      "unit_weight": 5.25
    }
  ]
}


#### 📋 Listar Guías
http
GET /remission-guides/?company_id=1&page=1&size=20
Authorization: Bearer {token}


#### 🔍 Obtener Guía Específica
http
GET /remission-guides/{guide_id}?company_id=1
Authorization: Bearer {token}


#### ✏ Actualizar Guía
http
PUT /remission-guides/{guide_id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "company_id": 1,
  "transfer_reason_description": "Venta actualizada",
  // ... otros campos a actualizar
}


### 2. Procesamiento SUNAT

#### 🚀 Procesar Guía para SUNAT
http
POST /remission-guides/{guide_id}/process-sunat
Content-Type: application/json
Authorization: Bearer {token}

{
  "company_id": 1
}


*Respuesta:*
json
{
  "success": true,
  "message": "Guía procesada y enviada a SUNAT exitosamente",
  "guide_id": 123,
  "sunat_status": "SENT",
  "sunat_ticket": "ABC123456789",
  "xml_file_path": "https://cdn.example.com/xml/guide_123.xml",
  "zip_file_path": "https://cdn.example.com/zip/guide_123.zip"
}


#### 🔍 Consultar Estado del Ticket
http
POST /remission-guides/{guide_id}/check-ticket-status
Content-Type: application/json
Authorization: Bearer {token}

{
  "company_id": 1,
  "ticket": "ABC123456789"
}


*Respuesta:*
json
{
  "success": true,
  "message": "Estado consultado exitosamente",
  "guide_id": 123,
  "ticket": "ABC123456789",
  "current_status": "ACCEPTED"
}


#### 📥 Procesar CDR Manualmente
http
POST /remission-guides/{guide_id}/process-cdr
Content-Type: application/json
Authorization: Bearer {token}

{
  "company_id": 1
}


*Respuesta:*
json
{
  "success": true,
  "message": "CDR procesado exitosamente",
  "guide_id": 123,
  "cdr_processed": true
}


#### 📊 Estado SUNAT Detallado
http
GET /remission-guides/{guide_id}/sunat-status?company_id=1
Authorization: Bearer {token}


*Respuesta:*
json
{
  "guide_id": 123,
  "sunat_status": "RECEIVED",
  "sunat_ticket": "ABC123456789",
  "sunat_response_code": "0",
  "sunat_response_description": "La Guía de Remisión ha sido aceptada",
  "sunat_reception_date": "2024-12-19T10:30:00Z",
  "cdr_file_path": "https://cdn.example.com/cdr/guide_123_cdr.xml",
  "has_cdr": true,
  "zip_hash": "abc123def456...",
  "sunat_observations": null,
  "status_description": "CDR recibido y procesado correctamente"
}


## 🎨 Implementación en Frontend

### 1. Componente de Lista de Guías

typescript
interface RemissionGuide {
  id: number;
  document_number: string;
  issue_date: string;
  sunat_status: 'PENDING' | 'GENERATED' | 'SIGNED' | 'SENT' | 'ACCEPTED' | 'RECEIVED' | 'REJECTED';
  receiver_business_name: string;
  gross_total_weight: number;
  sunat_ticket?: string;
}

const GuidesList = () => {
  const [guides, setGuides] = useState<RemissionGuide[]>([]);
  
  const fetchGuides = async () => {
    const response = await api.get('/remission-guides/', {
      params: { company_id: currentCompany.id }
    });
    setGuides(response.data.items);
  };
  
  const getStatusColor = (status: string) => {
    const colors = {
      'PENDING': 'gray',
      'GENERATED': 'blue',
      'SIGNED': 'green',
      'SENT': 'yellow',
      'ACCEPTED': 'cyan',
      'RECEIVED': 'green',
      'REJECTED': 'red'
    };
    return colors[status] || 'gray';
  };
  
  return (
    <Table>
      {guides.map(guide => (
        <TableRow key={guide.id}>
          <TableCell>{guide.document_number}</TableCell>
          <TableCell>
            <Badge color={getStatusColor(guide.sunat_status)}>
              {guide.sunat_status}
            </Badge>
          </TableCell>
          <TableCell>{guide.receiver_business_name}</TableCell>
          <TableCell>
            <GuideActions guide={guide} onUpdate={fetchGuides} />
          </TableCell>
        </TableRow>
      ))}
    </Table>
  );
};


### 2. Componente de Acciones de Guía

typescript
const GuideActions = ({ guide, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  
  const processForSunat = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/remission-guides/${guide.id}/process-sunat`, {
        company_id: currentCompany.id
      });
      
      if (response.data.success) {
        toast.success('Guía enviada a SUNAT exitosamente');
        onUpdate();
      }
    } catch (error) {
      toast.error('Error al procesar la guía');
    } finally {
      setLoading(false);
    }
  };
  
  const checkTicketStatus = async () => {
    if (!guide.sunat_ticket) return;
    
    setLoading(true);
    try {
      const response = await api.post(`/remission-guides/${guide.id}/check-ticket-status`, {
        company_id: currentCompany.id,
        ticket: guide.sunat_ticket
      });
      
      toast.success('Estado actualizado');
      onUpdate();
    } catch (error) {
      toast.error('Error al consultar el estado');
    } finally {
      setLoading(false);
    }
  };
  
  const processCdr = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/remission-guides/${guide.id}/process-cdr`, {
        company_id: currentCompany.id
      });
      
      if (response.data.cdr_processed) {
        toast.success('CDR procesado exitosamente');
        onUpdate();
      }
    } catch (error) {
      toast.error('Error al procesar el CDR');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ButtonGroup>
      {guide.sunat_status === 'SIGNED' && (
        <Button onClick={processForSunat} loading={loading}>
          Enviar a SUNAT
        </Button>
      )}
      
      {guide.sunat_status === 'SENT' && (
        <Button onClick={checkTicketStatus} loading={loading}>
          Consultar Estado
        </Button>
      )}
      
      {guide.sunat_status === 'ACCEPTED' && (
        <Button onClick={processCdr} loading={loading}>
          Procesar CDR
        </Button>
      )}
      
      <Button onClick={() => viewGuideDetails(guide.id)}>
        Ver Detalles
      </Button>
    </ButtonGroup>
  );
};


### 3. Hook para Estado SUNAT

typescript
const useSunatStatus = (guideId: number) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/remission-guides/${guideId}/sunat-status`, {
        params: { company_id: currentCompany.id }
      });
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching SUNAT status:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (guideId) {
      fetchStatus();
    }
  }, [guideId]);
  
  return { status, loading, refetch: fetchStatus };
};


## 🔄 Flujo Recomendado para Frontend

### 1. Creación de Guía
1. Usuario llena formulario de nueva guía
2. Frontend envía POST a /remission-guides/
3. Mostrar guía creada con estado PENDING

### 2. Procesamiento Automático
1. Sistema automáticamente genera XML (estado GENERATED)
2. Sistema firma digitalmente (estado SIGNED)
3. Mostrar botón "Enviar a SUNAT"

### 3. Envío a SUNAT
1. Usuario hace clic en "Enviar a SUNAT"
2. Frontend llama POST /process-sunat
3. Estado cambia a SENT
4. Mostrar ticket y botón "Consultar Estado"

### 4. Seguimiento
1. Usuario puede consultar estado con botón
2. Estado puede cambiar a ACCEPTED o REJECTED
3. Si es ACCEPTED, mostrar botón "Procesar CDR"

### 5. Finalización
1. Procesar CDR manualmente o automáticamente
2. Estado final RECEIVED
3. Mostrar enlace para descargar CDR

## 🚨 Manejo de Errores

### Errores Comunes:

- *422*: Error de validación (datos incorrectos)
- *404*: Guía no encontrada
- *403*: Sin permisos para la empresa
- *500*: Error interno del servidor

### Códigos de Respuesta SUNAT:

- *0*: Aceptado
- *2324*: Documento ya fue informado anteriormente
- *4000-4999*: Errores de validación

## 📱 Notificaciones en Tiempo Real

Para una mejor experiencia de usuario, considera implementar:

1. *Polling*: Consultar estado cada 30 segundos para guías en estado SENT
2. *WebSockets*: Notificaciones en tiempo real cuando cambie el estado
3. *Push Notifications*: Alertas cuando se reciba el CDR

## 🔐 Seguridad

- Todos los endpoints requieren autenticación Bearer Token
- Validación de permisos por empresa
- Logs de auditoría para todas las operaciones SUNAT

## 📊 Monitoreo

Endpoints útiles para dashboards:

- Guías por estado: GET /remission-guides/?sunat_status=SENT
- Estadísticas: Implementar endpoint personalizado para métricas
- Reportes: Filtros por fecha, empresa, estado

---

*Nota*: Esta guía cubre el flujo completo implementado. Para casos especiales o personalizaciones, consulta la documentación técnica de cada endpoint en /docs.