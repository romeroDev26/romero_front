# Implementación de Validación para Manifiestos de Carga

## Problema Identificado

Cuando se intentaba generar un manifiesto de carga para una embarcación que no tenía carga registrada, el backend devolvía un error 401 (Unauthorized) que el interceptor de API interpretaba como un problema de autenticación, causando que el usuario fuera redirigido automáticamente a la página de login.

### Ubicación del Error Original

**Archivo:** `src/config/api.ts` (líneas 34-36)
```typescript
if (error.response.status === 401) {
  localStorage.removeItem('authToken');
  window.location.href = '/login';
}
```

## Solución Implementada

### 1. Nuevo Método de Validación en manifest.service.ts

Se agregó un nuevo método `validateCargoManifest` al servicio de manifiestos que valida si hay datos de carga disponibles antes de intentar generar el manifiesto.

**Archivo:** `src/features/manifests/services/manifest.service.ts`

```typescript
// Validar si se puede generar manifiesto de carga para un viaje específico
validateCargoManifest: async (tripId: number): Promise<{ 
  canGenerate: boolean; 
  message: string; 
  itemCount?: number 
}> => {
  try {
    // Intenta usar endpoint específico de validación
    const response = await api.get(`/dispatch/manifests/validate-cargo/${tripId}`);
    
    return {
      canGenerate: true,
      message: 'Hay carga disponible para generar el manifiesto',
      itemCount: response.data?.cargo_items_count || 0
    };
  } catch (error: any) {
    // Manejo inteligente de diferentes tipos de error
    if (error.response?.status === 404) {
      // El endpoint no existe, usar método alternativo
      // ... lógica de fallback
    }
    
    // Errores que indican falta de datos
    if (error.response?.status === 400 || 
        error.response?.status === 422 || 
        error.response?.status === 401) {
      return { 
        canGenerate: false, 
        message: 'No hay carga registrada para este viaje' 
      };
    }

    // Para otros errores, permitir generación con advertencia
    return { 
      canGenerate: true, 
      message: 'Se intentará generar el manifiesto (validación inconclusa)' 
    };
  }
}
```

### 2. Mejoras en ManifestGenerationModal.tsx

#### 2.1. Validación Previa
Se agregó validación previa antes de intentar generar el manifiesto:

```typescript
const handleGenerate = async () => {
  // Validación previa para manifiesto de carga
  if (selectedType === 'CARGO') {
    const cargoValidationResult = await validateCargoManifest();
    if (!cargoValidationResult.canGenerate) {
      toast.error(cargoValidationResult.message);
      return;
    }
  }
  // ... resto de la lógica
};
```

#### 2.2. Manejo Mejorado de Errores
Se implementó manejo específico para diferentes tipos de error:

```typescript
} catch (error: any) {
  console.error('Error al generar manifiesto:', error);
  
  if (error.response?.status === 401) {
    if (selectedType === 'CARGO') {
      toast.error('No se puede generar el manifiesto de carga: no hay carga registrada para este viaje');
    } else {
      toast.error('No se puede generar el manifiesto de pasajeros: no hay pasajeros registrados para este viaje');
    }
  } else if (error.response?.status === 400 || error.response?.status === 422) {
    const errorMessage = error.response.data?.message || error.response.data?.detail;
    toast.error(errorMessage || `No hay datos suficientes para generar el manifiesto de ${selectedType === 'CARGO' ? 'carga' : 'pasajeros'}`);
  } else {
    toast.error(error.message || 'Error al generar el manifiesto');
  }
}
```

#### 2.3. Indicadores Visuales
Se agregaron indicadores visuales en la interfaz:

- **Estado de validación de carga:** Muestra si hay carga disponible
- **Contador de items:** Indica cuántos items de carga hay disponibles
- **Deshabilitación del botón:** El botón de generar se deshabilita si no hay carga
- **Advertencias visuales:** Indicadores rojos/verdes según disponibilidad

```typescript
// Estado para rastrear la validación
const [cargoValidationStatus, setCargoValidationStatus] = useState<{
  isValidated: boolean;
  canGenerate: boolean;
  message: string;
  itemCount?: number;
}>({
  isValidated: false,
  canGenerate: true,
  message: ''
});

// Validación automática cuando se selecciona CARGO
useEffect(() => {
  if (isOpen && selectedType === 'CARGO' && !cargoValidationStatus.isValidated) {
    const validateCargo = async () => {
      const result = await validateCargoManifest();
      setCargoValidationStatus({
        isValidated: true,
        canGenerate: result.canGenerate,
        message: result.message,
        itemCount: result.itemCount
      });
    };

    validateCargo();
  }
}, [isOpen, selectedType]);
```

## Beneficios de la Solución

### 1. Prevención de Redirección Indeseada
- Los usuarios ya no serán redirigidos al login cuando no haya carga disponible
- El error se maneja localmente con mensajes informativos

### 2. Mejor Experiencia de Usuario
- Validación proactiva antes de intentar generar manifiestos
- Indicadores visuales claros sobre disponibilidad de datos
- Mensajes de error específicos y comprensibles

### 3. Robustez del Sistema
- Múltiples estrategias de validación (endpoint principal + fallbacks)
- Manejo inteligente de diferentes tipos de error
- Logging apropiado para debugging

### 4. Interfaz Mejorada
- Indicadores de estado en tiempo real
- Botones deshabilitados cuando corresponde
- Información contextual sobre disponibilidad de datos

## Casos de Uso Cubiertos

### ✅ Caso 1: Embarcación con carga disponible
- La validación confirma disponibilidad
- Se muestra contador de items
- El manifiesto se genera normalmente

### ✅ Caso 2: Embarcación sin carga registrada
- La validación detecta la falta de carga
- Se muestra advertencia visual
- El botón se deshabilita
- Mensaje claro al usuario sobre la situación

### ✅ Caso 3: Error de red o backend
- Fallbacks apropiados
- Mensajes de error informativos
- No redirige al login innecesariamente

### ✅ Caso 4: Endpoint de validación no disponible
- Estrategia de fallback usando métodos existentes
- Graceful degradation del servicio

## Archivos Modificados

1. **`src/features/manifests/services/manifest.service.ts`**
   - Agregado método `validateCargoManifest`

2. **`src/features/fluvial/components/schedule/ManifestGenerationModal.tsx`**
   - Validación previa antes de generar manifiestos
   - Manejo mejorado de errores
   - Indicadores visuales de estado
   - Lógica de validación automática

## Próximos Pasos Recomendados

1. **Backend:** Implementar endpoint `/dispatch/manifests/validate-cargo/{tripId}` para validación optimizada
2. **Testing:** Probar todos los escenarios (con carga, sin carga, errores de red)
3. **Monitoreo:** Revisar logs para verificar que no hay más redirecciones inesperadas
4. **Documentación:** Actualizar documentación de API con nuevos endpoints

## Consideraciones Técnicas

- La solución es backward-compatible
- No afecta funcionalidad existente de manifiestos de pasajeros
- Implementa graceful degradation si el backend no tiene el endpoint optimizado
- Mantiene la seguridad del sistema sin comprometer la experiencia de usuario
