# Implementación de Formato A4 Multi-Modal para Tickets

## 📋 RESUMEN DE LA IMPLEMENTACIÓN

Se ha implementado un sistema completo para generar tickets en formato A4 además del formato térmico 80mm existente. El sistema es **multi-modal**, lo que significa que un único template A4 funciona para todos los tipos de ventas.

## 🎯 CARACTERÍSTICAS IMPLEMENTADAS

### 1. Template A4 Multi-Modal
**Archivo:** `src/features/fluvial/components/sales-point/tickets/templates/a4.template.ts`

- **Diseño corporativo** con estructura profesional
- **Compatible con todos los tipos** de venta:
  - Pasajes normales con asiento
  - Pasajes sin asiento (elección libre)
  - Ventas empresariales (RUC) - muestra resumen
  - Encomiendas - incluye información del destinatario
- **Componentes del diseño:**
  - Logo de la empresa (izquierda)
  - Información de la empresa (derecha)
  - Recuadro azul para información del cliente
  - Recuadro de documento (tipo y número)
  - Tabla de items profesional
  - QR Code de SUNAT
  - Textos legales
  - Totales SUNAT destacados

### 2. Generador Dual de Tickets
**Archivo:** `src/features/fluvial/components/sales-point/tickets/TicketGenerator.ts`

**Métodos principales:**
- `generateBothTickets()`: Genera ambos formatos (80mm y A4) en paralelo
- `generateTicket()`: Mantiene compatibilidad, solo genera 80mm
- `generateA4Ticket()`: Genera solo el A4

**Retorna:**
```typescript
{
  ticket80mm: Blob,      // PDF térmico
  ticketA4: Blob,        // PDF A4
  ticket80mmDoc: jsPDF,  // Documento jsPDF del térmico
  ticketA4Doc: jsPDF     // Documento jsPDF del A4
}
```

### 3. Hook de Subida Mejorado
**Archivo:** `src/hooks/useTicketUpload.ts`

**Nuevo método:**
- `uploadBothTickets()`: Sube ambos PDFs en paralelo al backend
  - Ticket 80mm → `pdf_ticket_file_path`
  - Formato A4 → `pdf_a4_file_path`

### 4. Modal con Tabs
**Archivo:** `src/features/fluvial/components/sales-point/TicketPreviewModalV2.tsx`

**Características:**
- **Tabs interactivos**: Cambia entre vista 80mm y A4
- **Generación automática**: Ambos PDFs se generan al abrir el modal
- **Subida automática**: Ambos se suben al backend en paralelo
- **Vista previa**: Muestra el PDF correspondiente al tab activo
- **Indicadores visuales**: Muestra estado de subida para cada formato
- **Descarga selectiva**: Descarga el formato del tab activo

## 🔄 FLUJO DE FUNCIONAMIENTO

```
1. Usuario realiza venta → SaleForm
2. Se abre TicketPreviewModalV2
3. Modal genera AMBOS tickets automáticamente:
   - Detecta tipo de venta (normal, cargo, empresa, sin asientos)
   - Usa el transformer correspondiente
   - Genera ticket 80mm con su template específico
   - Genera A4 con el template multi-modal
4. Modal sube AMBOS tickets al backend en paralelo:
   - 80mm → `/files/upload-invoice-file` (file_type: 'pdf_ticket')
   - A4 → `/files/upload-invoice-file` (file_type: 'pdf_a4')
5. Usuario puede:
   - Ver cualquiera de los dos en los tabs
   - Descargar el que esté viendo
   - Enviar por WhatsApp
   - Cerrar y continuar
```

## 📁 ARCHIVOS CREADOS/MODIFICADOS

### Archivos Creados:
1. `src/features/fluvial/components/sales-point/tickets/templates/a4.template.ts`
2. `src/features/fluvial/components/sales-point/tickets/TicketPreviewModalV2.tsx`

### Archivos Modificados:
1. `src/features/fluvial/components/sales-point/tickets/templates/index.ts`
2. `src/features/fluvial/components/sales-point/tickets/TicketGenerator.ts`
3. `src/hooks/useTicketUpload.ts`

## 🔧 PASOS PARA ACTIVAR

### 1. Reemplazar el modal anterior
En los archivos que usen `TicketPreviewModal`, cambiar la importación:

```typescript
// ANTES:
import { TicketPreviewModal } from './TicketPreviewModal';

// DESPUÉS:
import { TicketPreviewModal } from './TicketPreviewModalV2';
```

O simplemente reemplazar el contenido del archivo original con el de V2.

### 2. Actualizar WhatsAppSendModal (opcional)
Si quieres enviar ambos formatos por WhatsApp, actualiza el modal para que pueda seleccionar cuál enviar.

## 📊 ADAPTACIONES POR TIPO DE VENTA

### Ventas Normales / Sin Asiento
- **80mm**: Muestra todo el detalle del viaje
- **A4**: Misma información pero en tabla con formato corporativo
  - Info del viaje se integra en la descripción del item

### Ventas Empresariales (RUC)
- **80mm**: Muestra resumen de representantes
- **A4**: Muestra resumen de la misma forma
  - No lista todos los pasajeros individualmente
  - Muestra total de representantes

### Encomiendas
- **80mm**: Muestra remitente y destinatario
- **A4**: Muestra remitente y destinatario en secciones destacadas
  - Recuadro naranja para información del destinatario
  - Origen y destino en la descripción

## 🎨 DISEÑO A4

El diseño A4 sigue los estándares de facturación electrónica en Perú:

- **Dimensiones**: 210mm x 297mm (A4 estándar)
- **Márgenes**: 15mm en todos los lados
- **Colores**:
  - Recuadro cliente: Azul claro (#E6F0FF)
  - Destinatario (cargo): Naranja claro (#FFF5E6)
  - Total: Verde (#228B22)
- **QR**: 35mm x 35mm
- **Fuente**: Helvetica (estándar PDF)

## ✅ VALIDACIONES

El sistema incluye:
- Detección automática del tipo de venta
- Manejo de errores en generación
- Manejo de errores en subida
- Reintentos automáticos (por el servicio de files)
- Limpieza de recursos (URLs de preview)

## 🚀 PRÓXIMOS PASOS SUGERIDOS

1. **Probar con cada tipo de venta** para validar el diseño
2. **Ajustar espaciados** si es necesario en el A4
3. **Agregar cuentas bancarias** si se requiere (actualmente omitidas)
4. **Opción de envío dual** por WhatsApp (ambos formatos)
5. **Configuración por empresa** para elegir qué formato generar por defecto

## 📝 NOTAS TÉCNICAS

- El servicio `files.service.ts` ya estaba preparado para `'pdf_a4'` como FileType
- El backend debe aceptar el campo `pdf_a4_file_path` (ya existe en el JSON de respuesta)
- Ambos PDFs se generan con jsPDF (sin dependencias adicionales)
- Las URLs de preview se limpian automáticamente al cerrar el modal
- El sistema mantiene compatibilidad con el flujo anterior

## 🐛 TROUBLESHOOTING

### Error: "No se puede subir el A4"
- Verificar que el endpoint `/files/upload-invoice-file` acepta `file_type: 'pdf_a4'`
- Verificar que el modelo de Invoice en backend tiene el campo `pdf_a4_file_path`

### Error: "El A4 no se muestra correctamente"
- Verificar que el navegador soporta iframes con PDFs
- Probar descargando el PDF directamente

### Error: "Falta información en el A4"
- Verificar que el transformer correspondiente está pasando todos los datos necesarios
- Revisar la consola para errores de transformación

---

**Implementado por:** GitHub Copilot
**Fecha:** 18 de octubre de 2025
**Versión:** 1.0
