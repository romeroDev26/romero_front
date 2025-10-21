# Corrección del Contador de Vendedores Activos en Ventas con Representantes

## 🐛 Problema Identificado

Al realizar ventas empresariales (RUC) con múltiples representantes, el sistema mostraba incorrectamente el contador de "vendedores activos":
- **Esperado:** 1 vendedor activo
- **Mostrado:** N vendedores activos (donde N = número de asientos seleccionados)

### Ejemplo del Bug:
```
Usuario selecciona 2 asientos para 2 representantes
→ Sistema muestra: "2 vendedores activos" ❌
→ Debería mostrar: "1 vendedor activo" ✅
```

## 🔍 Causa Raíz

El sistema tenía **DOS problemas principales:**

### Problema 1: Contador basado en asientos en lugar de vendedores
**Archivo:** `SeatMapRealtime.tsx` línea 248

```typescript
// ❌ ANTES: Contaba asientos, no vendedores
const totalActiveSelections = activeSeatSelections.size;
```

El `activeSeatSelections` es un `Map<number, SeatSelection>` donde:
- **Key:** seatId (ID del asiento)
- **Value:** SeatSelection (información del vendedor)

Entonces `activeSeatSelections.size` retorna el **número de asientos**, no el número de vendedores únicos.

### Problema 2: Lógica incorrecta en WebSocket Handler
**Archivo:** `websocketMessageHandler.ts` 

```typescript
// ❌ ANTES: Agregaba TODAS las selecciones de representantes propios
const shouldAddSelection = isRepresentativeReservation || (message.userId !== this.userId);
```

Esta lógica causaba que:
1. Si `isRepresentativeReservation` era `true`, **SIEMPRE** agregaba la selección
2. Esto incluía los representantes del **propio vendedor**
3. Cada representante tenía un userId único: `user123-company-session-rep-0`, `user123-company-session-rep-1`, etc.
4. El sistema los trataba como vendedores diferentes

## ✅ Solución Implementada

### Cambio 1: Contar Vendedores Únicos por userId Base

**Archivo:** `SeatMapRealtime.tsx`

```typescript
// ✅ DESPUÉS: Cuenta vendedores únicos agrupando por userId base
const uniqueSellers = new Set<string>();
activeSeatSelections.forEach((selection) => {
  // Extraer userId base removiendo sufijos de representantes
  const baseUserId = selection.userId.split('-company-')[0];
  uniqueSellers.add(baseUserId);
});
const totalActiveSelections = uniqueSellers.size;
```

**Lógica:**
- Itera todas las selecciones activas
- Extrae el userId base (antes del `-company-`)
- Agrega a un `Set` que automáticamente elimina duplicados
- Cuenta el tamaño del `Set` = vendedores únicos

**Ejemplo:**
```
Selecciones:
- Asiento 1: userId = "user123-company-session-rep-0"
- Asiento 2: userId = "user123-company-session-rep-1"

→ baseUserId extraído: "user123" (ambos)
→ Set: { "user123" }
→ Contador: 1 vendedor ✅
```

### Cambio 2: Filtrar Selecciones por userId Base

**Archivo:** `websocketMessageHandler.ts`

Actualicé **5 funciones** para comparar correctamente el userId base:

#### 2.1 handleTempReserved
```typescript
// ✅ Extraer userId base para comparar correctamente
const messageBaseUserId = message.userId?.split('-company-')[0] || '';
const isFromDifferentUser = messageBaseUserId !== this.userId;

// Solo agregar si es de un usuario diferente
const shouldAddSelection = isFromDifferentUser;
```

#### 2.2 handleSeatSelection
```typescript
// ✅ Comparar userId base
const messageBaseUserId = message.userId?.split('-company-')[0] || '';
const isFromDifferentUser = messageBaseUserId !== this.userId;

if (isFromDifferentUser && message.seatId !== undefined) {
  // ... agregar selección
}
```

#### 2.3 handleSeatReleased
```typescript
// ✅ Comparar userId base
const messageBaseUserId = message.userId?.split('-company-')[0] || '';
const isFromDifferentUser = messageBaseUserId !== this.userId;

if (isFromDifferentUser && message.seatId !== undefined) {
  // ... remover selección
}
```

#### 2.4 handleTempReleased
```typescript
// ✅ Comparar userId base
const messageBaseUserId = message.userId?.split('-company-')[0] || '';
const isFromDifferentUser = messageBaseUserId !== this.userId;

if (isFromDifferentUser && message.seatId !== undefined) {
  // ... remover selección temporal
}
```

#### 2.5 handleInitialState (dos formatos)
```typescript
// Formato nuevo (selecctionSeats)
.filter((selection: SelectionSeat) => {
  const selectionBaseUserId = selection.userId.split('-company-')[0];
  return selectionBaseUserId !== this.userId;
})

// Formato legacy (seats)
.filter(selection => {
  const selectionBaseUserId = selection.userId?.split('-company-')[0] || '';
  return selectionBaseUserId !== this.userId;
})
```

## 🎯 Impacto de los Cambios

### Antes de la Corrección:
```
Vendedor Juan selecciona:
- Asiento 1 para Representante A → userId: "juan123-company-sess1-rep-0"
- Asiento 2 para Representante B → userId: "juan123-company-sess1-rep-1"

Sistema ve:
- 2 userIds diferentes
- Muestra: "2 vendedores activos" ❌
- Otros usuarios ven 2 "vendedores" diferentes ❌
```

### Después de la Corrección:
```
Vendedor Juan selecciona:
- Asiento 1 para Representante A → userId: "juan123-company-sess1-rep-0"
- Asiento 2 para Representante B → userId: "juan123-company-sess1-rep-1"

Sistema procesa:
- Extrae baseUserId: "juan123" (de ambos)
- Agrupa como mismo vendedor
- Muestra: "1 vendedor activo" ✅
- Otros usuarios ven 1 vendedor con múltiples asientos ✅
```

## 📊 Comparación: Venta Normal vs Empresarial

| Tipo Venta | userIds Generados | Asientos | Contador Antes | Contador Ahora |
|------------|-------------------|----------|----------------|----------------|
| **Normal (DNI)** | `user123` | 1 | 1 ✅ | 1 ✅ |
| **Empresa 2 rep** | `user123-company-X-rep-0`<br>`user123-company-X-rep-1` | 2 | 2 ❌ | 1 ✅ |
| **Empresa 5 rep** | `user123-company-X-rep-0` hasta `rep-4` | 5 | 5 ❌ | 1 ✅ |

## 🧪 Casos de Prueba

### Caso 1: Venta Empresarial con 3 Representantes
**Pasos:**
1. Iniciar sesión como vendedor
2. Crear venta RUC
3. Agregar 3 representantes seleccionando asientos
4. Observar contador de vendedores activos

**Resultado Esperado:** "1 vendedor activo"

### Caso 2: Dos Vendedores Simultáneos
**Pasos:**
1. Vendedor A: Selecciona 2 asientos para empresa
2. Vendedor B: Selecciona 1 asiento normal
3. Observar contador

**Resultado Esperado:** "2 vendedores activos"

### Caso 3: Vendedor Libera Asiento de Representante
**Pasos:**
1. Seleccionar 2 asientos para representantes
2. Eliminar 1 representante
3. Verificar que no desaparezca el vendedor del contador

**Resultado Esperado:** "1 vendedor activo" (mientras quede al menos 1 asiento)

## 📝 Archivos Modificados

### 1. websocketMessageHandler.ts
**Ubicación:** `src/features/fluvial/services/websocketMessageHandler.ts`

**Cambios:**
- ✅ handleTempReserved: Comparación por userId base
- ✅ handleSeatSelection: Comparación por userId base
- ✅ handleSeatReleased: Comparación por userId base
- ✅ handleTempReleased: Comparación por userId base
- ✅ handleInitialState: Filtrado por userId base (2 formatos)

**Total líneas modificadas:** ~35 líneas

### 2. SeatMapRealtime.tsx
**Ubicación:** `src/features/fluvial/components/seat-map/SeatMapRealtime.tsx`

**Cambios:**
- ✅ Lógica de conteo de vendedores únicos
- ✅ Agregado comentario explicativo

**Total líneas modificadas:** ~8 líneas

## 🔄 Compatibilidad

### ✅ Mantiene Funcionalidad Existente
- ✅ Ventas normales (DNI/CE) funcionan igual
- ✅ Ventas empresariales sin representantes funcionan igual
- ✅ Sistema de reservas temporales no afectado
- ✅ Generación de tickets no afectada
- ✅ Backend no requiere cambios

### ✅ Mejoras Adicionales
- ✅ Código más limpio y comprensible
- ✅ Comentarios explicativos agregados
- ✅ Lógica consistente en todas las funciones

## 🎓 Concepto Técnico: Agrupación por Prefijo

La solución utiliza el patrón de **"agrupación por prefijo compartido"**:

```typescript
// Estructura de userId para representantes:
// formato: {baseUserId}-company-{sessionId}-rep-{index}
// ejemplo: "user123-company-sess789-rep-0"

// Extraer baseUserId:
const baseUserId = userId.split('-company-')[0];
// resultado: "user123"

// Agrupar en Set (elimina duplicados automáticamente):
uniqueSellers.add(baseUserId);
```

Este patrón es útil cuando:
- Tienes identificadores con sufijos variables
- Necesitas agrupar por un prefijo común
- Quieres contar elementos únicos después de normalizar

## ⚡ Performance

**Impacto:** ✅ Mínimo / Positivo

- Operación `split()`: O(n) donde n = longitud del string (~50 caracteres)
- Operación `Set.add()`: O(1) amortizado
- Complejidad total: O(m) donde m = número de selecciones activas

**Típicamente:**
- m < 50 (raramente más de 10 vendedores simultáneos)
- Overhead < 1ms
- Ejecuta solo cuando hay actualizaciones de selección

## 📅 Historial

**Fecha:** 21 de octubre de 2025
**Autor:** Sistema de corrección de WebSocket
**Versión:** 1.0.0
**Estado:** ✅ Completado y probado

---

## 🎯 Resumen Ejecutivo

**Problema:** Contador de vendedores activos incorrecto en ventas con representantes
**Causa:** Sistema contaba asientos en lugar de vendedores únicos
**Solución:** Agrupar selecciones por userId base y filtrar correctamente en WebSocket
**Archivos:** 2 archivos modificados, ~43 líneas cambiadas
**Resultado:** ✅ Contador ahora muestra vendedores únicos correctamente
