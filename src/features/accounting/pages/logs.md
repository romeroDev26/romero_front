# 📋 Guía Completa de Endpoints SUNAT - API Romero

## 🎯 Resumen Ejecutivo

Esta guía completa te ayudará a implementar el frontend para todos los documentos SUNAT:
- *Notas de Crédito* (Código SUNAT: 07)
- *Notas de Débito* (Código SUNAT: 08) 
- *Resúmenes Diarios* (Código SUNAT: RC)
- *Comunicaciones de Baja/Anulaciones* (Código SUNAT: RA)
- *Consulta de Estados Unificada*

## 🔄 Flujo de Trabajo General

### 1. Creación de Documentos
- El frontend envía los datos al endpoint correspondiente
- El sistema crea el documento en la BD con estado PENDING
- *Automáticamente* se inicia una tarea en segundo plano para enviar a SUNAT
- El frontend recibe respuesta inmediata (HTTP 202 - Accepted)

### 2. Seguimiento del Estado
- Los documentos pasan por estados: PENDING → SENT → ACCEPTED/REJECTED
- Usar endpoints de consulta de estado para monitorear el progreso
- SUNAT puede tardar varios minutos en procesar

---

## 📝 NOTAS DE CRÉDITO

### Códigos SUNAT (Catálogo 09)
| Código | Descripción | Uso Común |
|--------|-------------|----------|
| *01* | Anulación de la operación | Para anular por completo una factura o boleta |
| *02* | Anulación por error en el RUC | Cuando te equivocas al registrar el RUC del cliente |
| *03* | Corrección por error en la descripción | Si hay un error en el detalle del producto o servicio |
| *04* | Descuento global | Para aplicar un descuento total sobre el comprobante |
| *05* | Descuento por ítem | Para aplicar un descuento a un producto específico |
| *06* | Devolución total | Cuando el cliente devuelve todos los productos |
| *07* | Devolución por ítem | Si el cliente devuelve solo una parte de los productos |
| *09* | Disminución en el valor | Para ajustar el precio a un monto menor |

### Endpoints Disponibles

#### 1. Crear Nota de Crédito
http
POST /sunat/credit-notes/
Content-Type: application/json
Authorization: Bearer {token}


*Payload de ejemplo:*
json
{
  "company_id": 1,
  "client_id": 123,
  "series": "FC01",
  "currency_code": "PEN",
  "issue_date": "2024-01-15",
  "issue_time": "14:30:00",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-00000456",
  "credit_note_type_code": "01",
  "reason": "Anulación de la operación",
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_code": "NIU",
      "unit_price": 100.00,
      "price_with_tax": 118.00,
      "price_type_code": "01",
      "tax_category_code": "10",
      "description": "Producto devuelto"
    }
  ]
}


*Respuesta (HTTP 201):*
json
{
  "id": 789,
  "company_id": 1,
  "client_id": 123,
  "document_type_code": "07",
  "series": "FC01",
  "number": 123,
  "issue_date": "2024-01-15",
  "issue_time": "14:30:00",
  "currency_code": "PEN",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-00000456",
  "credit_note_type_code": "01",
  "reason": "Anulación de la operación",
  "total_payable": 236.00,
  "total_in_words": null,
  "sunat_status": "PENDING",
  "sunat_response_description": null,
  "qr_code_data": null,
  "created_by": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-01-15T14:30:00",
  "updated_at": null,
  "items": [
    {
      "id": 1,
      "product_id": 1,
      "quantity": 2,
      "unit_code": "NIU",
      "unit_price": 100.00,
      "price_with_tax": 118.00,
      "price_type_code": "01",
      "tax_category_code": "10",
      "igv_percentage": 18.00,
      "igv_amount": 36.00,
      "subtotal": 200.00,
      "total_line": 236.00,
      "description": "Producto devuelto"
    }
  ]
}


#### 2. Crear Nota de Crédito por Anulación
http
POST /sunat/credit-notes/annul
Content-Type: application/json
Authorization: Bearer {token}


*Payload de ejemplo:*
json
{
  "invoice_id": 456,
  "credit_note_series": "FC01",
  "reason": "Error en facturación"
}


#### 3. Listar Notas de Crédito
http
GET /sunat/credit-notes/?company_id=1&skip=0&limit=50
Authorization: Bearer {token}


*Respuesta:*
json
{
  "credit_notes": [
    {
      "id": 789,
      "series": "FC01",
      "number": 123,
      "issue_date": "2024-01-15",
      "total_payable": 236.00,
      "sunat_status": "ACCEPTED",
      "client_name": "Cliente Ejemplo",
      "reason": "Anulación de la operación"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 50,
  "message": "Notas de crédito obtenidas exitosamente"
}


---

## 📝 NOTAS DE DÉBITO

### Códigos SUNAT (Catálogo 10)
| Código | Descripción | Uso Común |
|--------|-------------|----------|
| *01* | Intereses por mora | Para cobrar intereses por un pago retrasado |
| *02* | Aumento en el valor | Cuando necesitas incrementar el valor de una factura |
| *03* | Penalidades / otros conceptos | Para añadir cargos adicionales o penalidades |

### Endpoints Disponibles

#### 1. Crear Nota de Débito
http
POST /sunat/debit-notes/
Content-Type: application/json
Authorization: Bearer {token}


*Payload de ejemplo:*
json
{
  "company_id": 1,
  "client_id": 123,
  "series": "FD01",
  "currency_code": "PEN",
  "issue_date": "2024-01-15",
  "issue_time": "14:30:00",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-00000456",
  "debit_note_type_code": "01",
  "reason": "Intereses por mora",
  "items": [
    {
      "product_id": 1,
      "quantity": 1,
      "unit_code": "NIU",
      "unit_price": 50.00,
      "price_with_tax": 59.00,
      "price_type_code": "01",
      "tax_category_code": "10",
      "description": "Cargo por intereses"
    }
  ]
}


*Respuesta (HTTP 201):*
json
{
  "id": 890,
  "company_id": 1,
  "client_id": 123,
  "document_type_code": "08",
  "series": "FD01",
  "number": 45,
  "issue_date": "2024-01-15",
  "issue_time": "14:30:00",
  "currency_code": "PEN",
  "affected_document_type_code": "01",
  "affected_document_series_number": "F001-00000456",
  "debit_note_type_code": "01",
  "reason": "Intereses por mora",
  "total_payable": 59.00,
  "sunat_status": "PENDING",
  "created_at": "2024-01-15T14:30:00",
  "items": [
    {
      "id": 1,
      "product_id": 1,
      "quantity": 1,
      "unit_price": 50.00,
      "total_line": 59.00,
      "description": "Cargo por intereses"
    }
  ]
}


#### 2. Listar Notas de Débito
http
GET /sunat/debit-notes/?company_id=1&skip=0&limit=50
Authorization: Bearer {token}


---

## 📊 RESÚMENES DIARIOS

> *Nota:* Los resúmenes diarios agrupan todas las boletas (código 03) emitidas en una fecha específica.

### Endpoints Disponibles

#### 1. Crear Resumen Diario
http
POST /sunat/summaries/
Content-Type: application/json
Authorization: Bearer {token}


*Payload de ejemplo:*
json
{
  "company_id": 1,
  "summary_date": "2024-01-15",
  "currency_code": "PEN"
}


*Respuesta (HTTP 202):*
json
{
  "id": 101,
  "company_id": 1,
  "identifier": "RC-20240115-001",
  "summary_date": "2024-01-15",
  "currency_code": "PEN",
  "sunat_status": "PENDING",
  "sunat_ticket": null,
  "sunat_response_description": null,
  "created_by": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-01-15T23:59:00",
  "items": [
    {
      "id": 1,
      "document_type_code": "03",
      "series": "B001",
      "start_number": 1,
      "end_number": 50,
      "total_amount": 5420.50,
      "total_igv": 820.50,
      "total_documents": 50
    }
  ]
}


#### 2. Listar Resúmenes Diarios
http
GET /sunat/summaries/by-company/1?skip=0&limit=50
Authorization: Bearer {token}


*Respuesta:*
json
[
  {
    "id": 101,
    "identifier": "RC-20240115-001",
    "summary_date": "2024-01-15",
    "sunat_status": "ACCEPTED",
    "created_at": "2024-01-15T23:59:00",
    "total_documents": 50,
    "total_amount": 5420.50
  }
]


#### 3. Consultar Estado SUNAT
http
POST /sunat/summaries/101/check-status
Authorization: Bearer {token}


*Respuesta:*
json
{
  "id": 101,
  "identifier": "RC-20240115-001",
  "sunat_status": "ACCEPTED",
  "sunat_ticket": "1234567890",
  "sunat_response_description": "La Comunicación de Resumen Diario ha sido aceptada",
  "cdr_file_path": "/storage/cdr/RC-20240115-001-CDR.xml"
}


#### 4. Obtener Detalles
http
GET /sunat/summaries/101
Authorization: Bearer {token}


---

## ❌ COMUNICACIONES DE BAJA (ANULACIONES)

> *Nota:* Las comunicaciones de baja permiten anular documentos ya enviados a SUNAT.

### Endpoints Disponibles

#### 1. Crear Comunicación de Baja
http
POST /sunat/voided/
Content-Type: application/json
Authorization: Bearer {token}


*Payload de ejemplo:*
json
{
  "company_id": 1,
  "generation_date": "2024-01-15",
  "items": [
    {
      "document_type_code": "01",
      "series": "F001",
      "number": 123,
      "reason": "Error en datos del cliente"
    },
    {
      "document_type_code": "03",
      "series": "B001",
      "number": 456,
      "reason": "Duplicado por error"
    }
  ]
}


*Respuesta (HTTP 202):*
json
{
  "id": 201,
  "company_id": 1,
  "identifier": "RA-20240115-001",
  "generation_date": "2024-01-15",
  "sunat_status": "PENDING",
  "sunat_ticket": null,
  "sunat_response_description": null,
  "created_by": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-01-15T16:30:00",
  "items": [
    {
      "id": 1,
      "document_type_code": "01",
      "series": "F001",
      "number": 123,
      "reason": "Error en datos del cliente",
      "item_line": 1
    },
    {
      "id": 2,
      "document_type_code": "03",
      "series": "B001",
      "number": 456,
      "reason": "Duplicado por error",
      "item_line": 2
    }
  ]
}


#### 2. Listar Comunicaciones de Baja
http
GET /sunat/voided/by-company/1?skip=0&limit=50
Authorization: Bearer {token}


*Respuesta:*
json
[
  {
    "id": 201,
    "identifier": "RA-20240115-001",
    "generation_date": "2024-01-15",
    "sunat_status": "ACCEPTED",
    "total_items": 2,
    "created_at": "2024-01-15T16:30:00"
  }
]


#### 3. Consultar Estado SUNAT
http
POST /sunat/voided/201/check-status
Authorization: Bearer {token}


#### 4. Obtener Detalles
http
GET /sunat/voided/201
Authorization: Bearer {token}


---

## 🔍 CONSULTA DE ESTADOS UNIFICADA

### Endpoint Universal de Estados
http
GET /sunat/tickets/documents/{document_type}/{document_id}/status
Authorization: Bearer {token}


*Tipos de documento soportados:*
- credit_note
- debit_note 
- daily_summary
- voided_document

*Ejemplos:*
http
# Consultar estado de nota de crédito
GET /sunat/tickets/documents/credit_note/789/status

# Consultar estado de nota de débito
GET /sunat/tickets/documents/debit_note/890/status

# Consultar estado de resumen diario
GET /sunat/tickets/documents/daily_summary/101/status

# Consultar estado de comunicación de baja
GET /sunat/tickets/documents/voided_document/201/status


*Respuesta típica:*
json
{
  "document_id": 789,
  "document_type": "credit_note",
  "sunat_status": "ACCEPTED",
  "sunat_ticket": "1234567890",
  "sunat_response_description": "La Nota de Crédito ha sido aceptada",
  "last_updated": "2024-01-15T15:30:00",
  "files": {
    "xml_file_path": "/storage/xml/FC01-00000123.xml",
    "signed_xml_file_path": "/storage/signed/FC01-00000123-signed.xml",
    "zip_file_path": "/storage/zip/FC01-00000123.zip",
    "cdr_file_path": "/storage/cdr/FC01-00000123-CDR.xml",
    "pdf_file_path": "/storage/pdf/FC01-00000123.pdf"
  }
}


---

## 📋 ESTADOS SUNAT

### Estados Posibles
| Estado | Descripción | Acción Frontend |
|--------|-------------|----------------|
| PENDING | Documento creado, pendiente de envío | Mostrar "Procesando..." |
| SENT | Enviado a SUNAT, esperando respuesta | Mostrar "Enviado a SUNAT" |
| ACCEPTED | Aceptado por SUNAT | Mostrar "✅ Aceptado" |
| REJECTED | Rechazado por SUNAT | Mostrar "❌ Rechazado" + error |
| OBSERVED | Aceptado con observaciones | Mostrar "⚠ Con observaciones" |

---

## 🎨 IMPLEMENTACIÓN FRONTEND

### 1. Componentes Sugeridos

#### DocumentStatusBadge.vue
vue
<template>
  <span :class="statusClass">
    {{ statusText }}
  </span>
</template>

<script>
export default {
  props: ['status'],
  computed: {
    statusClass() {
      const classes = {
        'PENDING': 'badge-warning',
        'SENT': 'badge-info',
        'ACCEPTED': 'badge-success',
        'REJECTED': 'badge-danger',
        'OBSERVED': 'badge-warning'
      }
      return `badge ${classes[this.status] || 'badge-secondary'}`
    },
    statusText() {
      const texts = {
        'PENDING': '⏳ Procesando',
        'SENT': '📤 Enviado',
        'ACCEPTED': '✅ Aceptado',
        'REJECTED': '❌ Rechazado',
        'OBSERVED': '⚠ Observado'
      }
      return texts[this.status] || this.status
    }
  }
}
</script>


#### DocumentForm.vue
vue
<template>
  <form @submit.prevent="submitDocument">
    <!-- Campos del formulario según el tipo de documento -->
    <div class="form-group">
      <label>Tipo de Nota de Crédito:</label>
      <select v-model="form.credit_note_type_code">
        <option value="01">01 - Anulación de la operación</option>
        <option value="04">04 - Descuento global</option>
        <option value="06">06 - Devolución total</option>
        <option value="07">07 - Devolución por ítem</option>
      </select>
    </div>
    
    <button type="submit" :disabled="loading">
      {{ loading ? 'Procesando...' : 'Crear Documento' }}
    </button>
  </form>
</template>

<script>
export default {
  data() {
    return {
      form: {
        company_id: 1,
        client_id: null,
        credit_note_type_code: '01',
        reason: '',
        items: []
      },
      loading: false
    }
  },
  methods: {
    async submitDocument() {
      this.loading = true
      try {
        const response = await this.$http.post('/sunat/credit-notes/', this.form)
        this.$emit('document-created', response.data)
        this.resetForm()
      } catch (error) {
        this.$emit('error', error.response.data.detail)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>


### 2. Servicios API

#### sunatService.js
javascript
class SunatService {
  constructor(httpClient) {
    this.http = httpClient
  }

  // Notas de Crédito
  async createCreditNote(data) {
    return await this.http.post('/sunat/credit-notes/', data)
  }

  async getCreditNotes(companyId, params = {}) {
    return await this.http.get(`/sunat/credit-notes/`, {
      params: { company_id: companyId, ...params }
    })
  }

  // Notas de Débito
  async createDebitNote(data) {
    return await this.http.post('/sunat/debit-notes/', data)
  }

  // Resúmenes Diarios
  async createDailySummary(data) {
    return await this.http.post('/sunat/summaries/', data)
  }

  async getDailySummaries(companyId, params = {}) {
    return await this.http.get(`/sunat/summaries/by-company/${companyId}`, {
      params
    })
  }

  // Comunicaciones de Baja
  async createVoidedDocument(data) {
    return await this.http.post('/sunat/voided/', data)
  }

  // Consulta Universal de Estados
  async getDocumentStatus(documentType, documentId) {
    return await this.http.get(`/sunat/tickets/documents/${documentType}/${documentId}/status`)
  }

  // Polling para estados
  async pollDocumentStatus(documentType, documentId, callback, interval = 5000) {
    const poll = async () => {
      try {
        const response = await this.getDocumentStatus(documentType, documentId)
        callback(response.data)
        
        // Continuar polling si está pendiente
        if (['PENDING', 'SENT'].includes(response.data.sunat_status)) {
          setTimeout(poll, interval)
        }
      } catch (error) {
        callback({ error: error.message })
      }
    }
    
    poll()
  }
}

export default SunatService


### 3. Store (Vuex/Pinia)

#### sunatStore.js
javascript
import { defineStore } from 'pinia'
import SunatService from '@/services/sunatService'

export const useSunatStore = defineStore('sunat', {
  state: () => ({
    creditNotes: [],
    debitNotes: [],
    dailySummaries: [],
    voidedDocuments: [],
    loading: false,
    error: null
  }),

  actions: {
    async createCreditNote(data) {
      this.loading = true
      try {
        const response = await SunatService.createCreditNote(data)
        this.creditNotes.unshift(response.data)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.detail || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async loadCreditNotes(companyId, params = {}) {
      this.loading = true
      try {
        const response = await SunatService.getCreditNotes(companyId, params)
        this.creditNotes = response.data.credit_notes
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async updateDocumentStatus(documentType, documentId) {
      try {
        const response = await SunatService.getDocumentStatus(documentType, documentId)
        
        // Actualizar en el store correspondiente
        const collections = {
          'credit_note': 'creditNotes',
          'debit_note': 'debitNotes',
          'daily_summary': 'dailySummaries',
          'voided_document': 'voidedDocuments'
        }
        
        const collection = collections[documentType]
        if (collection) {
          const index = this[collection].findIndex(doc => doc.id === documentId)
          if (index !== -1) {
            this[collection][index] = { ...this[collection][index], ...response.data }
          }
        }
        
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      }
    }
  }
})


---

## 🚀 CASOS DE USO PRÁCTICOS

### 1. Flujo Completo: Crear Nota de Crédito
javascript
// 1. Crear la nota de crédito
const creditNote = await sunatStore.createCreditNote({
  company_id: 1,
  client_id: 123,
  series: 'FC01',
  credit_note_type_code: '01',
  reason: 'Anulación por error',
  affected_document_series_number: 'F001-00000456',
  items: [/* items */]
})

// 2. Iniciar polling del estado
sunatService.pollDocumentStatus('credit_note', creditNote.id, (status) => {
  console.log('Estado actualizado:', status.sunat_status)
  
  if (status.sunat_status === 'ACCEPTED') {
    // Mostrar mensaje de éxito
    // Habilitar descarga de PDF/XML
  } else if (status.sunat_status === 'REJECTED') {
    // Mostrar error
    console.error('Error SUNAT:', status.sunat_response_description)
  }
})


### 2. Dashboard de Estados
vue
<template>
  <div class="sunat-dashboard">
    <div class="stats-cards">
      <div class="card">
        <h3>Notas de Crédito</h3>
        <p>{{ creditNotesStats.total }} total</p>
        <p>{{ creditNotesStats.pending }} pendientes</p>
      </div>
      
      <div class="card">
        <h3>Resúmenes Diarios</h3>
        <p>{{ summariesStats.total }} total</p>
        <p>{{ summariesStats.pending }} pendientes</p>
      </div>
    </div>
    
    <div class="recent-documents">
      <h3>Documentos Recientes</h3>
      <table>
        <tr v-for="doc in recentDocuments" :key="doc.id">
          <td>{{ doc.type }}</td>
          <td>{{ doc.identifier }}</td>
          <td><DocumentStatusBadge :status="doc.sunat_status" /></td>
          <td>
            <button @click="checkStatus(doc)" :disabled="doc.checking">
              {{ doc.checking ? 'Consultando...' : 'Consultar Estado' }}
            </button>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>


### 3. Automatización de Resúmenes Diarios
javascript
// Función para crear resúmenes automáticamente
async function createDailySummaryForYesterday(companyId) {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  try {
    const summary = await sunatService.createDailySummary({
      company_id: companyId,
      summary_date: yesterday.toISOString().split('T')[0],
      currency_code: 'PEN'
    })
    
    console.log('Resumen creado:', summary.identifier)
    
    // Iniciar monitoreo
    sunatService.pollDocumentStatus('daily_summary', summary.id, (status) => {
      if (status.sunat_status === 'ACCEPTED') {
        // Notificar al usuario
        showNotification(`Resumen ${summary.identifier} aceptado por SUNAT`)
      }
    })
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('No hay boletas para resumir en la fecha especificada')
    } else {
      console.error('Error creando resumen:', error)
    }
  }
}


---

## 📞 MANEJO DE ERRORES

### Errores Comunes y Soluciones

| Error HTTP | Descripción | Solución Frontend |
|------------|-------------|------------------|
| 400 | Datos inválidos | Validar formulario, mostrar errores específicos |
| 401 | No autorizado | Redirigir a login |
| 404 | Documento no encontrado | Mostrar mensaje "Documento no existe" |
| 409 | Conflicto (ej. serie duplicada) | Mostrar mensaje, sugerir nueva serie |
| 500 | Error interno | Mostrar "Error del servidor, intente más tarde" |

### Interceptor de Errores
javascript
// axios interceptor
axios.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status
    const message = error.response?.data?.detail || 'Error desconocido'
    
    switch (status) {
      case 401:
        // Redirigir a login
        router.push('/login')
        break
      case 400:
        // Mostrar errores de validación
        showValidationErrors(error.response.data)
        break
      default:
        // Mostrar error genérico
        showErrorNotification(message)
    }
    
    return Promise.reject(error)
  }
)


---

## 🔧 CONFIGURACIÓN RECOMENDADA

### Variables de Entorno Frontend
env
VUE_APP_API_BASE_URL=http://localhost:8000
VUE_APP_SUNAT_POLLING_INTERVAL=5000
VUE_APP_MAX_POLLING_ATTEMPTS=60


### Configuración de Axios
javascript
import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default apiClient


---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### ✅ Backend (Ya implementado)
- [x] Endpoints de creación de documentos
- [x] Endpoints de consulta de estados
- [x] Procesamiento asíncrono con SUNAT
- [x] Manejo de errores y validaciones

### 🔲 Frontend (Por implementar)
- [ ] Formularios de creación de documentos
- [ ] Listados con paginación y filtros
- [ ] Dashboard de estados en tiempo real
- [ ] Sistema de notificaciones
- [ ] Descarga de archivos (PDF, XML, CDR)
- [ ] Validaciones del lado cliente
- [ ] Manejo de errores y estados de carga
- [ ] Polling automático de estados
- [ ] Componentes reutilizables
- [ ] Tests unitarios

---

## 🎉 ¡Listo para Implementar!

Con esta guía tienes todo lo necesario para implementar un frontend completo para el sistema SUNAT. Los endpoints están probados y funcionando, solo necesitas crear las interfaces de usuario correspondientes.

*Próximos pasos sugeridos:*
1. Implementar el servicio API base
2. Crear componentes de formularios
3. Implementar el dashboard de estados
4. Agregar sistema de notificaciones
5. Implementar descarga de archivos

¡Éxito con tu implementación! 🚀