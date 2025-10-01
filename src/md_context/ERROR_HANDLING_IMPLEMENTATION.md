# Implementación de Manejo Centralizado de Errores HTTP

## Descripción

Se ha implementado un sistema centralizado de manejo de errores HTTP que mejora la experiencia del usuario mostrando mensajes específicos de error, especialmente para errores de permisos (403 Forbidden).

## Cambios Realizados

### 1. Nueva función utilitaria `getErrorMessage`

Se creó `src/utils/errorHandler.ts` con funciones para manejar errores HTTP de manera consistente:

```typescript
export const getErrorMessage = (error: any, fallbackMessage: string = 'Ha ocurrido un error'): string => {
  // Si no hay respuesta del servidor
  if (!error?.response) {
    return fallbackMessage;
  }

  const { status, data } = error.response;

  // Para errores 403 (Forbidden), mostrar el mensaje específico de permisos del backend
  if (status === 403 && data?.detail) {
    return data.detail;
  }

  // Para errores de validación (normalmente 422), buscar en el array de errores
  if (data?.detail && Array.isArray(data.detail) && data.detail.length > 0) {
    return data.detail[0]?.msg || fallbackMessage;
  }

  // Para otros errores con mensaje en detail (string)
  if (data?.detail && typeof data.detail === 'string') {
    return data.detail;
  }

  // Para otros campos de mensaje
  if (data?.message) {
    return data.message;
  }

  // Usar el mensaje fallback
  return fallbackMessage;
};
```

### 2. Hooks actualizados

Se actualizaron los siguientes hooks para usar el nuevo sistema de manejo de errores:

- `useDocumentSeries.ts`
- `useScheduledTemplates.ts`
- `useReservations.ts`
- `useCitiesPortsData.ts`
- `useBranchOffices.ts`

### 3. Componentes actualizados

- `RolesPage.tsx` - Para manejo de errores de roles

## Ejemplos de Mensajes de Error

### Antes (Mensajes Genéricos)
```
❌ "Error al crear la serie, verifique que la combinación no exista"
❌ "Error al crear la plantilla"
❌ "Error al crear la reserva"
```

### Después (Mensajes Específicos del Backend)

#### Para errores 403 (Sin permisos):
```
🔒 "No tienes permiso para realizar esta acción. Se requiere rol: admin"
🔒 "No tienes permiso para realizar esta acción. Se requiere rol: admin, dispatcher"
```

#### Para errores de validación (422):
```
⚠️ "El nombre de la serie ya existe"
⚠️ "La combinación de tipo y serie ya está registrada"
```

#### Para otros errores del backend:
```
💡 Mensaje específico del backend según el error
```

## Tipos de Error Soportados

| Código HTTP | Tipo de Error | Origen del Mensaje |
|-------------|---------------|-------------------|
| 403 | Forbidden (Sin permisos) | `data.detail` (string) |
| 422 | Validation Error | `data.detail[0].msg` (array) |
| 400, 409, etc. | Otros errores | `data.detail` o `data.message` |
| Sin respuesta | Error de red | Mensaje fallback |

## Beneficios

1. **Mensajes más informativos**: Los usuarios ven exactamente qué permisos les faltan
2. **Experiencia consistente**: Todos los errores se manejan de la misma manera
3. **Mantenimiento simplificado**: Cambios centralizados en lugar de múltiples lugares
4. **Mejor debugging**: Mensajes específicos ayudan a identificar problemas

## Componentes que se benefician

- ✅ Series de documentos (Contabilidad)
- ✅ Plantillas programadas (Viajes)
- ✅ Reservas (Ventas)
- ✅ Ciudades y Puertos (Configuración)
- ✅ Sucursales (Configuración)
- ✅ Roles (Configuración)

## Uso futuro

Para nuevos hooks o componentes, simplemente importar y usar:

```typescript
import { getErrorMessage } from '../utils/errorHandler';

// En la función onError
onError: (error: any) => {
  const message = getErrorMessage(error, 'Mensaje fallback específico');
  toast.error(message);
}
```