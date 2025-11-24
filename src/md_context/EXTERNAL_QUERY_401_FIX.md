# Corrección: Error 401 en Consultas Externas de DNI/RUC

## Problema Identificado

Cuando se realizaba una consulta de DNI o RUC al endpoint `/external/query-dni` o `/external/query-ruc` y el servicio externo devolvía un error 401 (Unauthorized), el interceptor de axios en `api.ts` interpretaba esto como un problema de autenticación del usuario y automáticamente:
1. Eliminaba el token de autenticación (`localStorage.removeItem('authToken')`)
2. Redirigía al usuario a la página de login (`window.location.href = '/login'`)

Esto interrumpía completamente el flujo de venta, cuando en realidad el usuario debería poder continuar ingresando los datos manualmente.

### URL del Endpoint Problemático
```
https://romeroapi-production-5dec.up.railway.app/api/v1/external/query-dni?dni=76307491
```

### Comportamiento Esperado
- Si la consulta externa falla (401, timeout, etc.), el sistema debe:
  - Mostrar una alerta informativa al usuario
  - Permitir que el usuario ingrese los datos manualmente
  - **NO** cerrar su sesión ni redirigir a login

## Solución Implementada

### 1. Modificación del Servicio de Consultas Externas

**Archivo:** `src/services/external.service.ts`

Se agregó el header `X-Skip-Auth-Redirect: '1'` a las peticiones de consulta DNI/RUC:

```typescript
class ExternalQueryService {
  async queryDni(dni: string): Promise<DniResponse> {
    const response = await api.get<DniResponse>('/external/query-dni', {
      params: { dni },
      headers: { 'X-Skip-Auth-Redirect': '1' } // ← NUEVO
    });
    return response.data;
  }

  async queryRuc(ruc: string): Promise<RucResponse> {
    const response = await api.get<RucResponse>('/external/query-ruc', {
      params: { ruc },
      headers: { 'X-Skip-Auth-Redirect': '1' } // ← NUEVO
    });
    return response.data;
  }
}
```

Este header indica al interceptor de axios que **no debe** redirigir a login en caso de error 401.

### 2. Mejora del Manejo de Errores en el Hook

**Archivo:** `src/features/fluvial/hooks/useSunatData.ts`

Se mejoró el manejo de errores para detectar específicamente errores 401 y mostrar mensajes apropiados:

```typescript
const queryDniMutation = useMutation<DniResponse, Error, string>({
  mutationFn: (dni: string) => externalQueryService.queryDni(dni),
  onError: (error: any) => {
    // Manejar específicamente errores 401 sin cerrar sesión
    if (error?.response?.status === 401) {
      toast.warning('No se pudo realizar la consulta automática del DNI. Puede ingresar los datos manualmente para continuar.', {
        autoClose: 5000,
      });
    } else {
      toast.error(`Error al consultar DNI: ${error.message}`);
    }
  },
});

const queryRucMutation = useMutation<RucResponse, Error, string>({
  mutationFn: (ruc: string) => externalQueryService.queryRuc(ruc),
  onError: (error: any) => {
    // Manejar específicamente errores 401 sin cerrar sesión
    if (error?.response?.status === 401) {
      toast.warning('No se pudo realizar la consulta automática del RUC. Puede ingresar los datos manualmente para continuar.', {
        autoClose: 5000,
      });
    } else {
      toast.error(`Error al consultar RUC: ${error.message}`);
    }
  },
});
```

### 3. Corrección de Consulta Directa en AddRepresentativeForm

**Archivo:** `src/features/fluvial/components/sales-point/representatives/AddRepresentativeForm.tsx`

Este componente estaba haciendo la llamada directamente con `api.get()` sin el header protector. Se corrigió:

```typescript
const handleDniQuery = async (dni: string) => {
  // ...
  try {
    const response = await api.get(`/external/query-dni?dni=${dni}`, {
      headers: { 'X-Skip-Auth-Redirect': '1' } // ← NUEVO
    });
    // ...
  } catch (error: any) {
    setDniError('No se pudieron obtener los datos del DNI');
    // Mostrar mensaje apropiado según el tipo de error
    if (error?.response?.status === 401) {
      toast.warning('No se pudo realizar la consulta automática del DNI. Puede ingresar los datos manualmente para continuar.');
    } else {
      toast.warning('No se encontraron datos para este DNI. Ingrese el nombre manualmente.');
    }
  }
};
```

## Mecanismo de Protección Existente

El interceptor de axios ya tenía soporte para el header `X-Skip-Auth-Redirect`:

**Archivo:** `src/config/api.ts`

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ...
    const skipRedirect = error.config?.headers && 
      (error.config.headers['X-Skip-Auth-Redirect'] || 
       error.config.headers['x-skip-auth-redirect']);
    
    if (error.response.status === 401) {
      if (skipRedirect) {
        // Dejar que el caller maneje el 401
        return Promise.reject(error);
      }
      // Solo redirigir a login si NO tiene el header
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    // ...
  }
);
```

## Componentes Afectados (Beneficiados)

Los siguientes componentes ahora manejan correctamente los errores 401 sin cerrar sesión:

1. **PassengerDataForm.tsx** - Formulario de datos del pasajero
2. **RecipientForm.tsx** - Formulario de destinatario de encomienda
3. **CargoItemForm.tsx** - Formulario de item de carga
4. **AddRepresentativeForm.tsx** - Formulario de representante empresarial
5. **ClientSelector.tsx** - Selector de cliente en cotizaciones

Todos estos componentes ya tenían bloques `try-catch` apropiados, por lo que automáticamente se benefician de la mejora.

## Flujo de Usuario Mejorado

### Antes (❌ Problema)
1. Usuario intenta vender un pasaje
2. Sistema consulta automáticamente el DNI
3. Servicio externo falla con 401
4. **Usuario es deslogueado y redirigido a login**
5. **Se pierde todo el progreso de la venta**

### Ahora (✅ Solución)
1. Usuario intenta vender un pasaje
2. Sistema consulta automáticamente el DNI
3. Servicio externo falla con 401
4. **Se muestra alerta: "No se pudo realizar la consulta automática del DNI. Puede ingresar los datos manualmente para continuar."**
5. **Usuario ingresa datos manualmente**
6. **Venta continúa normalmente**

## Casos de Uso

Esta solución aplica para:
- ✅ Consultas de DNI/RUC durante venta de pasajes
- ✅ Consultas de DNI/RUC al agregar representantes empresariales
- ✅ Consultas de DNI/RUC al crear encomiendas
- ✅ Consultas de DNI/RUC al crear cotizaciones

## Notas Técnicas

- El header `X-Skip-Auth-Redirect` se puede usar en cualquier endpoint que necesite manejar errores 401 sin cerrar sesión
- El header es case-insensitive en el interceptor (acepta `X-Skip-Auth-Redirect` o `x-skip-auth-redirect`)
- Los mensajes de error usan `toast.warning()` para errores 401 (color amarillo) y `toast.error()` para otros errores (color rojo)
- El tiempo de visualización del toast es 5 segundos para dar tiempo al usuario de leerlo

## Testing

Para verificar que la solución funciona:

1. Intentar vender un pasaje e ingresar un DNI
2. Si el servicio externo falla con 401:
   - ✅ Debe aparecer un toast amarillo con el mensaje
   - ✅ El usuario debe permanecer en la página
   - ✅ Los campos deben permitir entrada manual
   - ✅ La venta debe poder completarse normalmente

## Archivos Modificados

- `src/services/external.service.ts`
- `src/features/fluvial/hooks/useSunatData.ts`
- `src/features/fluvial/components/sales-point/representatives/AddRepresentativeForm.tsx`
