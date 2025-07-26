# Actualización de Implementación WebSocket - Eventos Correctos del Backend

## Resumen de Cambios

Se ha actualizado la implementación de WebSocket para usar los eventos correctos según la documentación oficial del backend, específicamente para las reservas temporales de representantes empresariales.

## Cambios Principales

### 1. Eventos WebSocket Actualizados

#### Antes (Eventos Incorrectos)
```typescript
// ❌ Eventos que NO existen en el backend
type: 'REPRESENTATIVE_SELECTION'
type: 'REPRESENTATIVE_RELEASED'
```

#### Después (Eventos Correctos del Backend)
```typescript
// ✅ Eventos oficiales del backend según documentación
type: 'SEAT_TEMP_RESERVE'     // Para reservar asiento (30 min TTL para representantes)
type: 'SEAT_TEMP_RELEASE'     // Para liberar reserva temporal
type: 'SEAT_TEMP_RESERVE_RESPONSE'  // Respuesta del servidor
type: 'SEAT_TEMP_RESERVED'    // Notificación a otros usuarios
type: 'SEAT_TEMP_RELEASED'    // Notificación de liberación
```

### 2. Estructura de Mensajes Actualizada

#### Para Reservar Asiento de Representante
```typescript
// Nuevo mensaje SEAT_TEMP_RESERVE
{
  type: 'SEAT_TEMP_RESERVE',
  seatId: number,
  reservationType: 'representative', // Especifica TTL de 30 minutos
  companyName: string,
  representativeName: string,
  representativeIndex: number,
  userId: string,
  userName: string,
  timestamp: string
}
```

#### Para Liberar Asiento de Representante
```typescript
// Nuevo mensaje SEAT_TEMP_RELEASE
{
  type: 'SEAT_TEMP_RELEASE',
  seatId: number,
  reservationType: 'representative',
  userId: string,
  userName: string,
  timestamp: string
}
```

### 3. Manejo de Respuestas del Backend

#### SEAT_TEMP_RESERVE_RESPONSE
- Confirma si la reserva fue exitosa
- Incluye información de error si falló
- Se registra en logs para debugging

#### SEAT_TEMP_RESERVED
- Notifica a otros vendedores sobre reserva activa
- Incluye TTL de 30 minutos para representantes
- Muestra asiento como ocupado (morado) por 30 minutos

#### SEAT_TEMP_RELEASED
- Notifica liberación de reserva temporal
- Actualiza estado visual en tiempo real

### 4. Diferencias de TTL según Tipo de Usuario

| Tipo de Usuario | Evento | TTL | Uso |
|----------------|---------|-----|-----|
| Usuario Normal | SEAT_SELECTION | 5 minutos | Selecciones temporales |
| Representante Empresarial | SEAT_TEMP_RESERVE | 30 minutos | Reservas de representantes |

### 5. Archivos Modificados

#### `useSeatMapRealtime.ts`
- ✅ Actualizada interfaz `SeatUpdateMessage` con eventos correctos
- ✅ Agregado manejo para `SEAT_TEMP_RESERVE_RESPONSE`
- ✅ Agregado manejo para `SEAT_TEMP_RESERVED`  
- ✅ Agregado manejo para `SEAT_TEMP_RELEASED`
- ✅ Función `selectSeatForRepresentative` usa `SEAT_TEMP_RESERVE`
- ✅ Función `releaseSeatForRepresentative` usa `SEAT_TEMP_RELEASE`
- ✅ Agregados campos TTL y expiración para reservas temporales

#### `SaleForm.tsx`
- ✅ Actualizados comentarios para reflejar eventos correctos
- ✅ Mejorado logging para incluir información del evento backend
- ✅ Actualizada función `handleRemoveRepresentative` para usar eventos correctos

## Beneficios de la Implementación

### 1. Compatibilidad con Backend
- Los eventos ahora coinciden exactamente con la documentación oficial
- El backend reconocerá y procesará correctamente los mensajes

### 2. TTL Apropiado para Representantes
- Reservas de representantes duran 30 minutos (vs 5 minutos normales)
- Tiempo suficiente para completar proceso empresarial complejo

### 3. Mejor Visibilidad entre Vendedores
- Otros vendedores verán asientos de representantes como ocupados
- Eliminado problema donde aparecían como "disponibles"

### 4. Manejo de Errores Mejorado
- Respuestas del backend indican éxito/error de reservas
- Logs detallados para debugging

## Logging Mejorado

```typescript
// Ejemplo de logs informativos
console.log('📡 Enviando SEAT_TEMP_RESERVE para representante:', {
  seatId: 123,
  representativeName: 'Juan Pérez',
  companyName: 'Empresa XYZ',
  eventType: 'SEAT_TEMP_RESERVE',
  ttl: '30 minutos'
});

console.log('🔒 Recibido SEAT_TEMP_RESERVED:', {
  seatId: 123,
  reservationType: 'representative',
  ttl: 1800 // 30 minutos en segundos
});
```

## Estado de la Implementación

- ✅ **Completado**: Actualización de eventos WebSocket
- ✅ **Completado**: Manejo de respuestas del backend  
- ✅ **Completado**: TTL apropiado para representantes
- ✅ **Completado**: Logging mejorado
- 🟡 **Pendiente**: Testing en entorno real con backend
- 🟡 **Pendiente**: Validación de funcionamiento entre múltiples vendedores

## Próximos Pasos

1. **Testing**: Probar con el backend real para validar funcionamiento
2. **Refinamiento**: Ajustar según comportamiento observado
3. **Documentación**: Actualizar documentación de usuario final
4. **Optimización**: Mejorar manejo de errores según feedback del backend

---

**Fecha de Actualización**: 25 de julio de 2025  
**Versión**: 2.0 - Eventos Backend Oficiales
