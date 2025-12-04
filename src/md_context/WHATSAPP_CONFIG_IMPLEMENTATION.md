# Implementación de Configuración de WhatsApp

> **Última actualización:** 4 de diciembre de 2025

## Descripción General

Se ha implementado un módulo completo para la configuración y gestión de instancias de WhatsApp usando **Evolution API** a través del backend de Transportes Romero. El sistema funciona de manera **dinámica**, donde cada sucursal puede tener su propia instancia de WhatsApp configurada.

## Arquitectura

### Archivos Principales

1. **`src/services/whatsappConfig.service.ts`** - Servicio para comunicación con el backend
2. **`src/hooks/useWhatsAppConfig.ts`** - Hooks de React Query para gestión de estado
3. **`src/features/settings/pages/WhatsAppConfigPage.tsx`** - Página de configuración

### Archivos Modificados

1. **`src/App.tsx`** - Agregada la ruta `/settings/whatsapp`
2. **`src/components/layout/Sidebar.tsx`** - Agregada opción "WhatsApp" en Administración del Sistema
3. **`src/types/index.ts`** - Agregado campo `whatsapp_instance_name` a `BranchOffice`

## API del Backend

### Endpoints Utilizados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/external/whatsapp/instance/create` | Crea instancia y la asocia a sucursal |
| GET | `/external/whatsapp/instance/{instance_name}/qr` | Obtiene código QR para conectar |
| GET | `/external/whatsapp/instance/{instance_name}/status` | Estado de conexión |
| DELETE | `/external/whatsapp/instance/{instance_name}` | Elimina instancia |
| POST | `/external/whatsapp/instance/{instance_name}/logout` | Cierra sesión |
| POST | `/external/whatsapp/instance/{instance_name}/restart` | Reinicia instancia |

### Crear Instancia

```json
POST /api/v1/external/whatsapp/instance/create
{
  "instance_name": "ROMERO_IQUITOS",
  "branch_office_id": 3,
  "integration": "WHATSAPP-BAILEYS",
  "qrcode": true
}
```

**Respuesta:**
```json
{
  "success": true,
  "instance": "ROMERO_IQUITOS",
  "status": "connecting",
  "qr_code": "data:image/png;base64,...",
  "message": "Instancia creada exitosamente",
  "branch_office_updated": true
}
```

### Obtener QR

```
GET /api/v1/external/whatsapp/instance/ROMERO_IQUITOS/qr
```

**Respuesta:**
```json
{
  "success": true,
  "instance": "ROMERO_IQUITOS",
  "qr_code": "data:image/png;base64,...",
  "status": "connecting",
  "message": "QR code obtenido exitosamente"
}
```

### Estado de Conexión

```
GET /api/v1/external/whatsapp/instance/ROMERO_IQUITOS/status
```

**Respuesta:**
```json
{
  "success": true,
  "instance": "ROMERO_IQUITOS",
  "connection_state": "open",
  "is_connected": true,
  "requires_qr": false,
  "message": "Estado de conexión: open"
}
```

## Funcionalidades

### Lista de Sucursales
- Muestra todas las sucursales de la empresa
- Indica si tienen una instancia de WhatsApp vinculada (`whatsapp_instance_name`)
- Estado de conexión en tiempo real (polling cada 15 segundos)

### Crear Instancia
1. Seleccionar una sucursal sin instancia
2. Se genera un nombre automático (ej: `ROMERO_IQUITOS`)
3. Se crea en Evolution API y se guarda en la sucursal
4. Se muestra el código QR para vincular

### Conectar WhatsApp
1. Click en "Conectar" en una instancia desconectada
2. Se muestra el código QR
3. Escanear con WhatsApp en el teléfono
4. Polling automático para detectar conexión exitosa

### Gestión de Instancias
- **Desconectar**: Cierra la sesión de WhatsApp (logout)
- **Reiniciar**: Reinicia la instancia
- **Eliminar**: Elimina completamente la instancia

## Modelo de Datos

El campo `whatsapp_instance_name` se agregó al modelo `BranchOffice`:

```typescript
interface BranchOffice {
  // ... otros campos
  whatsapp_instance_name?: string | null;
}
```

## Uso

1. Navegar a **Administración del Sistema → WhatsApp**
2. Ver lista de sucursales con estado de WhatsApp
3. Crear instancias para sucursales que no tienen
4. Escanear código QR para conectar
5. Gestionar instancias existentes

## Consideraciones

- Solo usuarios con rol `admin` tienen acceso a la configuración
- Las instancias se asocian directamente a las sucursales
- El backend maneja la comunicación con Evolution API
- El QR se regenera automáticamente si expira
