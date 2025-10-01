# Implementación de Envío de Comprobantes por WhatsApp

## Descripción General

Esta implementación permite enviar documentos PDF (tickets/comprobantes) generados por el sistema directamente a través de WhatsApp usando la API Evolution.

## Archivos Modificados/Creados

### 1. Servicio WhatsApp
- **Archivo**: `src/services/whatsapp.service.ts`
- **Funcionalidad**: Servicio encargado de comunicarse con la API de Evolution para enviar documentos PDF por WhatsApp.

### 2. Modal de Envío WhatsApp
- **Archivo**: `src/features/fluvial/components/sales-point/WhatsAppSendModal.tsx`
- **Funcionalidad**: Interfaz de usuario para configurar y enviar documentos por WhatsApp.

### 3. Modal de Preview de Tickets (Actualizado)
- **Archivo**: `src/features/fluvial/components/sales-point/TicketPreviewModal.tsx`
- **Funcionalidad**: Se agregó botón de WhatsApp y integración con el modal de envío.

### 4. Formulario de Venta (Actualizado)
- **Archivo**: `src/features/fluvial/components/sales-point/SaleForm.tsx`
- **Funcionalidad**: Se pasó el número de teléfono del pasajero al modal de preview.

## Características Implementadas

### ✅ Funcionalidades Principales

1. **Validación de Número de Teléfono**
   - Formato automático para Perú (+51)
   - Validación mínima de 9 dígitos
   - Limpieza de caracteres especiales

2. **Mensaje Predeterminado**
   ```
   ¡Hola!
   
   Nos alegra mucho que hayas decidido confiar en nosotros.
   Adjuntamos a continuación tu comprobante electrónico correspondiente.
   
   Gracias por tu preferencia.
   Atentamente,
   El equipo de GLOBAL ROMERO S.A.C.
   ```

3. **Mensaje Personalizable**
   - El usuario puede modificar el mensaje predeterminado
   - Campo de texto amplio para personalización

4. **Soporte para Diferentes Tipos de Tickets**
   - Tickets normales (boletas)
   - Tickets empresariales (facturas con representantes)
   - Detección automática del tipo de generador PDF

5. **Estados de Envío**
   - Indicador de progreso durante el envío
   - Mensajes de éxito/error
   - Auto-cierre del modal en caso de éxito

### 🎨 Interfaz de Usuario

- **Botón WhatsApp**: Verde con ícono de WhatsApp en el modal de preview
- **Modal Intuitivo**: Campos claros con validaciones visuales
- **Feedback Visual**: Estados de carga y resultados visibles
- **Responsive**: Compatible con dispositivos móviles

## Flujo de Funcionamiento

1. **Usuario genera venta**: Se abre el modal de preview de ticket
2. **Clic en WhatsApp**: Se abre el modal de envío por WhatsApp
3. **Configuración**: El usuario ingresa el número y personaliza el mensaje
4. **Envío**: El sistema:
   - Genera el PDF del ticket
   - Convierte a base64
   - Envía a través de Evolution API
   - Muestra el resultado

## API Utilizada

### Endpoint: `/external/whatsapp/send-document`

**Request Body:**
```json
{
  "number": "51987654321",
  "caption": "Mensaje personalizado...",
  "media": "base64_content_here",
  "fileName": "ticket_B001-00000123.pdf",
  "mimetype": "application/pdf",
  "instance_name": "romero_ventas"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Documento enviado exitosamente"
}
```

## Configuración Requerida

### 1. Variable de Entorno
Asegurar que `VITE_API_URL` esté configurado correctamente para apuntar al backend que tiene la integración con Evolution API.

### 2. Instancia Evolution
- **Nombre de instancia**: `romero_ventas`
- Debe estar configurada y activa en el backend

### 3. Permisos API
El backend debe tener acceso al endpoint `/external/whatsapp/send-document` con los permisos necesarios.

## Casos de Uso

### 1. Venta Normal (Boleta)
- Cliente individual
- Número de teléfono del campo `phone` del pasajero
- PDF generado con template estándar

### 2. Venta Empresarial (Factura)
- Cliente con RUC
- Múltiples representantes
- PDF generado con template empresarial

### 3. Número Personalizado
- El usuario puede cambiar el número de teléfono
- Útil si el cliente quiere enviarlo a otro número

## Manejo de Errores

### Errores Comunes
1. **Número inválido**: Validación en frontend
2. **Error de red**: Mensaje de error claro
3. **Error API Evolution**: Respuesta del backend mostrada al usuario
4. **Error generación PDF**: Capturado y reportado

### Estados de Error
- **Validación**: Borde rojo en campos inválidos
- **Envío**: Mensaje de error con detalles
- **Red**: Indicación de problema de conectividad

## Próximas Mejoras Sugeridas

1. **Historial de Envíos**: Guardar registro de documentos enviados
2. **Plantillas de Mensaje**: Múltiples templates predefinidos
3. **Envío Masivo**: Para múltiples clientes
4. **Verificación Estado**: Confirmar entrega del mensaje
5. **Configuración Usuario**: Personalizar instancia y mensajes por usuario

## Pruebas Recomendadas

1. **Envío Exitoso**: Con número válido y PDF generado correctamente
2. **Validaciones**: Números inválidos, campos vacíos
3. **Error de Red**: Simular desconexión
4. **Diferentes Tipos**: Boletas, facturas, tickets sin asientos
5. **Mensajes Largos**: Verificar límites de caracteres

---

**Implementado por**: Sistema de ventas GLOBAL ROMERO S.A.C.  
**Fecha**: Agosto 2025  
**Versión**: 1.0.0
