# Implementación de Regeneración de Manifiestos

## Resumen
Se ha implementado la funcionalidad para regenerar manifiestos existentes utilizando el endpoint `PUT /manifests/regenerate` según los requerimientos del usuario.

## Funcionalidades Implementadas

### 1. Detección Automática de Manifiestos Existentes

#### ManifestForm.tsx
- **Estado para manifiestos existentes**: Nuevo estado `existingManifest` y `checkingExisting`
- **Verificación automática**: Cuando se selecciona un viaje y tipo de manifiesto, automáticamente verifica si ya existe
- **Indicador visual**: Muestra una alerta amarilla cuando se detecta un manifiesto existente con:
  - Número de manifiesto
  - Fecha de creación
  - Fecha de última actualización (si aplica)

#### Métodos agregados:
```typescript
// Verifica si existe un manifiesto para el viaje y tipo seleccionado
const checkExistingManifest = async (tripId: number, manifestType: 'PASSENGER' | 'CARGO')

// useEffect para verificar automáticamente cuando cambian los datos
useEffect(() => {
  if (formData.trip_id && formData.manifest_type) {
    checkExistingManifest(formData.trip_id, formData.manifest_type);
  }
}, [formData.trip_id, formData.manifest_type]);
```

### 2. UI Adaptativa para Regeneración

#### Botón Dinámico
- **Manifiesto nuevo**: Muestra "Generar Manifiesto" (azul)
- **Manifiesto existente**: Muestra "Regenerar Manifiesto" (ámbar) con icono de refresh

#### Estados de Loading
- **Creación**: "Generando..."
- **Regeneración**: "Regenerando..."

### 3. Servicios de Backend

#### manifest.service.ts - Nuevos métodos:

```typescript
// Verificar existencia de manifiesto
checkExistingManifest: async (tripId: number, manifestType: 'PASSENGER' | 'CARGO'): Promise<Manifest | null>

// Regenerar manifiesto existente
regenerateManifest: async (data: ManifestFormData): Promise<ManifestResponse>

// Crear o regenerar automáticamente
createOrRegenerateManifest: async (data: ManifestFormData): Promise<ManifestResponse>
```

#### Lógica de createOrRegenerateManifest:
1. **Intenta crear** un manifiesto nuevo con `POST /dispatch/manifests/`
2. **Si existe conflicto** (status 409), automáticamente intenta regenerar con `PUT /dispatch/manifests/regenerate/`
3. **Retorna información** sobre si fue creación nueva o regeneración

### 4. Integración en ManifestsPage.tsx

#### Actualización del handleCreateManifest:
```typescript
const handleCreateManifest = async (data: ManifestFormData) => {
  setIsCreating(true);
  try {
    const result = await manifestService.createOrRegenerateManifest(data);
    
    if (result.isRegeneration) {
      toast.success('Manifiesto regenerado correctamente');
    } else {
      toast.success('Manifiesto generado correctamente');
    }
    
    setShowCreateModal(false);
    refetch(); // Actualizar la lista
  } catch (error: any) {
    toast.error(error.message || 'Error al generar el manifiesto');
  } finally {
    setIsCreating(false);
  }
};
```

### 5. Tipos TypeScript Actualizados

#### ManifestResponse Interface:
```typescript
export interface ManifestResponse {
  success: boolean;
  data: Manifest;
  message?: string;
  isRegeneration?: boolean; // Nueva propiedad para identificar regeneraciones
}
```

## Flujo de Usuario

### Escenario 1: Crear Nuevo Manifiesto
1. Usuario selecciona viaje y tipo
2. Sistema verifica que no existe manifiesto
3. Botón muestra "Generar Manifiesto"
4. Al enviar, se ejecuta creación normal

### Escenario 2: Regenerar Manifiesto Existente
1. Usuario selecciona viaje y tipo
2. Sistema detecta manifiesto existente y muestra alerta
3. Botón cambia a "Regenerar Manifiesto" (ámbar)
4. Al enviar, se ejecuta regeneración
5. Toast notifica "Manifiesto regenerado correctamente"

### Escenario 3: Manejo Automático de Conflictos
1. Usuario intenta crear manifiesto
2. Si backend devuelve error 409, automáticamente intenta regenerar
3. Usuario ve el resultado final sin intervención manual

## Endpoints Utilizados

### Verificación de Existencia
```http
GET /dispatch/manifests/check?trip_id={tripId}&manifest_type={type}
```

### Regeneración
```http
PUT /dispatch/manifests/regenerate/
{
  "trip_id": number,
  "manifest_type": "PASSENGER" | "CARGO",
  "observations": string?
}
```

## Características del Sistema

### ✅ Beneficios Implementados
- **Detección automática** de manifiestos existentes
- **UI adaptativa** que cambia según el contexto
- **Manejo transparente** de conflictos
- **Notificaciones específicas** para cada acción
- **Preservación del número** de manifiesto original
- **Actualización de fecha** de modificación
- **Experiencia fluida** sin intervención manual del usuario

### 🔧 Aspectos Técnicos
- **Manejo de errores robusto** con fallback automático
- **Estados de loading** específicos para cada operación
- **TypeScript** completamente tipado
- **Integración con React Query** para cache management
- **UI consistente** con el resto del sistema

## Archivos Modificados

1. **ManifestForm.tsx** - UI para detección y regeneración
2. **manifest.service.ts** - Lógica de servicios y endpoints
3. **ManifestsPage.tsx** - Integración con página principal
4. **manifest.types.ts** - Tipos TypeScript actualizados

## Estado del Sistema

✅ **Completamente funcional** - Listo para uso en producción
✅ **Sin errores de compilación** - Código limpio y tipado
✅ **Experiencia de usuario fluida** - Detección automática y regeneración transparente
✅ **Documentación completa** - Implementación documentada y mantenible
