# Análisis del Sistema de Representantes y Problema de WebSocket

## 📋 Resumen del Problema

**Problema Identificado:** Cuando se selecciona un asiento para un representante en ventas empresariales (RUC), el sistema está creando múltiples "vendedores" en el WebSocket, haciendo que parezca que varios vendedores diferentes están seleccionando asientos cuando en realidad es un solo vendedor agregando múltiples representantes.

## 🔍 Arquitectura del Sistema de Representantes

### Componentes Involucrados

#### 1. **SaleForm.tsx** - Componente Principal
- **Ubicación:** `src/features/fluvial/components/sales-point/SaleForm.tsx`
- **Función:** Coordina todo el flujo de venta empresarial
- **Estados clave:**
  ```typescript
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [showRepresentatives, setShowRepresentatives] = useState(false);
  const [maxPassengers, setMaxPassengers] = useState(1);
  const [selectedSeatForRepresentative, setSelectedSeatForRepresentative] = useState<any>(null);
  ```

#### 2. **seatOperations.ts** - Lógica de Operaciones WebSocket
- **Ubicación:** `src/features/fluvial/services/seatOperations.ts`
- **Función:** Maneja las operaciones de asientos vía WebSocket
- **Método crítico:**
  ```typescript
  selectSeatForRepresentative(
    seatId: number, 
    representativeIndex: number, 
    representativeName: string
  ): boolean {
    const sessionId = this.getOrCreateCompanySessionId();
    const representativeUserId = `${this.userId}-company-${sessionId}-rep-${representativeIndex}`;
    
    const message = {
      type: 'SEAT_TEMP_RESERVE',
      seatId: seatId,
      userId: representativeUserId,  // ⚠️ PROBLEMA: Crea un userId diferente por cada rep
      userName: `${this.companyName || 'Empresa'} - ${representativeName}`,
      representativeName: representativeName,
      sessionId: sessionId,
      reservationType: 'representative'
    };

    return this.sendMessage(message);
  }
  ```

#### 3. **websocketMessageHandler.ts** - Procesador de Mensajes
- **Ubicación:** `src/features/fluvial/services/websocketMessageHandler.ts`
- **Función:** Procesa mensajes entrantes del WebSocket
- **Lógica de detección:**
  ```typescript
  private handleTempReserved(message: SeatUpdateMessage): void {
    const isRepresentativeReservation = message.reservationType === 'REPRESENTATIVE_TEMP_RESERVATION' ||
                                       message.reservationType === 'representative' ||
                                       (message as any).reservationCategory === 'representative';

    const shouldAddSelection = isRepresentativeReservation || (message.userId !== this.userId);
    // ⚠️ PROBLEMA: Si isRepresentativeReservation es true, SIEMPRE añade la selección
  }
  ```

#### 4. **useSeatReservations.ts** - Hook de Reservas
- **Ubicación:** `src/features/fluvial/hooks/useSeatReservations.ts`
- **Función:** Maneja reservas temporales de asientos via API REST (no WebSocket)
- **Nota:** Este sistema corre en PARALELO al WebSocket

#### 5. **RepresentativesManager.tsx** y **AddRepresentativeForm.tsx**
- **Ubicación:** `src/features/fluvial/components/sales-point/representatives/`
- **Función:** UI para gestionar representantes

## 🐛 Análisis del Problema

### Flujo Actual (con el problema)

1. **Usuario inicia venta RUC** → Activa modo de representantes
2. **Usuario agrega Representante #1:**
   - Selecciona un asiento en el mapa
   - Sistema llama `selectSeatForRepresentative(seatId, 0, "Juan Pérez")`
   - Se crea mensaje WebSocket con:
     ```javascript
     userId: "user123-company-session-abc-rep-0"
     userName: "Empresa ABC - Juan Pérez"
     reservationType: 'representative'
     ```
   - **Resultado:** El WebSocket detecta un "nuevo vendedor"

3. **Usuario agrega Representante #2:**
   - Selecciona otro asiento
   - Sistema llama `selectSeatForRepresentative(seatId, 1, "María López")`
   - Se crea mensaje WebSocket con:
     ```javascript
     userId: "user123-company-session-abc-rep-1"  // ⚠️ DIFERENTE userId
     userName: "Empresa ABC - María López"
     reservationType: 'representative'
     ```
   - **Resultado:** El WebSocket detecta OTRO "nuevo vendedor"

4. **Problema:**
   - El contador de "vendedores activos" muestra 2, 3, 4... según los representantes
   - Otros usuarios ven múltiples "vendedores" cuando es solo uno
   - La UI muestra alertas incorrectas de múltiples vendedores

### Causa Raíz

El problema tiene **DOS causas principales:**

#### Causa 1: UserIds Únicos por Representante
```typescript
// seatOperations.ts línea ~90
const representativeUserId = `${this.userId}-company-${sessionId}-rep-${representativeIndex}`;
```
- Cada representante recibe un `userId` diferente
- El WebSocket interpreta cada `userId` único como un vendedor diferente

#### Causa 2: Lógica de Detección en Handler
```typescript
// websocketMessageHandler.ts línea ~176
const shouldAddSelection = isRepresentativeReservation || (message.userId !== this.userId);
```
- La condición `isRepresentativeReservation` causa que SIEMPRE se agregue a la selección
- No hay filtro para reconocer que todos los representantes pertenecen al mismo vendedor

## 🎯 Sistema de Doble Capa

**IMPORTANTE:** Hay DOS sistemas funcionando en paralelo:

### Sistema 1: WebSocket (Tiempo Real)
- **Propósito:** Mostrar selecciones en vivo de otros vendedores
- **Archivo:** `seatOperations.ts`, `websocketMessageHandler.ts`
- **Problema:** Crea múltiples "vendedores" por representantes

### Sistema 2: API REST (Reservas Temporales)
- **Propósito:** Reservar asientos con TTL en el backend
- **Archivo:** `useSeatReservations.ts`, `seatReservation.service.ts`
- **Estado:** Funciona correctamente

## 📊 Comparación: Usuario Normal vs Venta Empresarial

| Aspecto | Venta Normal (DNI/CE) | Venta Empresarial (RUC) |
|---------|----------------------|------------------------|
| **Vendedor** | 1 vendedor | 1 vendedor |
| **Pasajeros** | 1 pasajero | N representantes |
| **Asientos** | 1 asiento | N asientos |
| **userId WebSocket** | `user123` | `user123-company-session-rep-0`, `user123-company-session-rep-1`, etc |
| **Contador vendedores** | 1 ✅ | N ❌ |
| **Reserva Backend** | 1 reserva | N reservas |

## 🎓 Funcionamiento Correcto del Sistema

### Lo que SÍ funciona bien:

1. ✅ **Interfaz de usuario** - RepresentativesManager muestra correctamente los representantes
2. ✅ **Reservas en backend** - useSeatReservations reserva correctamente via API
3. ✅ **Generación de tickets** - Sistema PDF genera correctamente tickets empresariales
4. ✅ **Detección de embarcaciones sin asientos** - Sistema automático funciona
5. ✅ **Cálculos de precio** - Multiplica correctamente por número de representantes

### Lo que NO funciona:

1. ❌ **Contador de vendedores activos** - Muestra N en lugar de 1
2. ❌ **Vista de otros usuarios** - Ven múltiples vendedores en lugar de uno
3. ❌ **Identificación de sesión compartida** - No reconoce que todos los representantes son del mismo vendedor

## 🔧 Soluciones Posibles

### Opción 1: Usar el mismo userId para todos los representantes
**Ventaja:** Simple, mínimos cambios
**Desventaja:** Pierde tracking individual de representantes

### Opción 2: Agregar campo `parentUserId` o `sessionId`
**Ventaja:** Mantiene tracking individual, agrupa por sesión
**Desventaja:** Requiere cambios en backend y frontend

### Opción 3: Cambiar lógica de conteo de vendedores
**Ventaja:** No requiere cambios en mensajes WebSocket
**Desventaja:** Requiere lógica más compleja en el handler

### Opción 4: Marcar representantes de forma especial en la UI
**Ventaja:** Mantiene funcionalidad actual, mejora visualización
**Desventaja:** No resuelve el problema de fondo

## 📝 Archivos Relacionados

### Archivos Principales:
1. `src/features/fluvial/services/seatOperations.ts` - Genera mensajes WebSocket
2. `src/features/fluvial/services/websocketMessageHandler.ts` - Procesa mensajes
3. `src/features/fluvial/components/sales-point/SaleForm.tsx` - Coordina venta
4. `src/features/fluvial/hooks/useSeatReservations.ts` - Reservas API REST
5. `src/features/fluvial/hooks/useSeatMapRealtime.ts` - Hook WebSocket

### Archivos de UI:
6. `src/features/fluvial/components/sales-point/representatives/RepresentativesManager.tsx`
7. `src/features/fluvial/components/sales-point/representatives/AddRepresentativeForm.tsx`

### Archivos de Documentación:
8. `src/md_context/COMPANY_NO_SEATS_IMPLEMENTATION.md` - Doc de sistema sin asientos

## 🎯 Siguiente Paso

Antes de hacer cambios, necesitamos decidir:

1. **¿Qué comportamiento queremos?**
   - ¿Un solo "vendedor" con múltiples asientos?
   - ¿Mostrar de forma especial que son representantes?
   
2. **¿Backend soporta sessionId o groupId?**
   - ¿Podemos agregar campos al mensaje WebSocket?
   - ¿O debemos trabajar solo con frontend?

3. **¿Qué info deben ver otros usuarios?**
   - "Juan está seleccionando 3 asientos"
   - "Juan (Empresa ABC - 3 representantes)"
   - Cada representante por separado pero agrupados visualmente

---

**Fecha de análisis:** 21 de octubre de 2025
**Estado:** ❌ Problema identificado, solución pendiente
