# 🧪 Pruebas para Verificar Reservas de Representantes

## 📋 Estado Actual

**✅ Backend funcionando:** Envía mensajes `SEAT_TEMP_RESERVED` correctamente
**🔧 Frontend ajustado:** Para procesar reservas de representantes

## 🕵️ Pruebas a Realizar

### **Test 1: Mismo Usuario (Debe funcionar ahora)**

1. **Abrir una sola pestaña**
2. **Crear empresa con 2 representantes**
3. **Verificar logs:**
   ```
   🧠 LÓGICA DE DECISIÓN: {
     isRepresentativeReservation: true,
     isMyOwnRepresentativeReservation: false, // ← Debe ser false
     shouldAddSelection: true, // ← Debe ser true
     messageUserId: "fb408cb6...",
     myUserId: "fb408cb6..."
   }
   ✅ AGREGANDO SELECCIÓN: { seatId: ..., type: "representative" }
   ```
4. **Resultado esperado:** `activeSeatSelections.size > 0`

### **Test 2: Múltiples Vendedores (Verificación final)**

1. **Navegador A:** Usuario 1 crea empresa con representantes
2. **Navegador B:** Usuario 2 debería ver los asientos ocupados
3. **Verificar que aparecen como "representative" en el mapa**

## 🔍 Logs Clave a Buscar

### **✅ Señales de Éxito:**
```
📥 MENSAJE DEL BACKEND: { "type": "SEAT_TEMP_RESERVED" }
🧠 LÓGICA DE DECISIÓN: { shouldAddSelection: true }
✅ AGREGANDO SELECCIÓN: { type: "representative" }
- Tamaño de activeSeatSelections: 1 (o más)
```

### **❌ Señales de Problema:**
```
🧠 LÓGICA DE DECISIÓN: { shouldAddSelection: false }
- Tamaño de activeSeatSelections: 0
```

## 🛠️ Cambios Implementados

### **1. Tipos WebSocket Actualizados**
```typescript
reservationType?: 'user' | 'representative' | 'REPRESENTATIVE_TEMP_RESERVATION';
reservationCategory?: string;
expiresAt?: string;
sessionId?: string;
```

### **2. Lógica de Procesamiento Mejorada**
```typescript
// Detecta reservas de representantes por múltiples campos
const isRepresentativeReservation = 
  message.reservationType === 'REPRESENTATIVE_TEMP_RESERVATION' || 
  message.reservationType === 'representative' ||
  message.reservationCategory === 'representative';

// Evita duplicar mis propias reservas recientes
const isMyOwnRepresentativeReservation = 
  isRepresentativeReservation && 
  message.userId === this.userId &&
  message.representativeName;

// Decide si agregar a la lista visible
const shouldAddSelection = 
  (isRepresentativeReservation && !isMyOwnRepresentativeReservation) || 
  (message.userId !== this.userId);
```

### **3. Debugging Mejorado**
- Logs detallados de la lógica de decisión
- Información completa del estado de `activeSeatSelections`
- Identificación clara de reservas de representantes

## 📞 Si Sigue Sin Funcionar

**Revisar estos puntos:**

1. **¿El campo `reservationType` tiene el valor correcto?**
2. **¿El backend está enviando `sessionId`?**
3. **¿La lógica de `isMyOwnRepresentativeReservation` es correcta?**

## 🎯 Objetivo

**Al final de estas pruebas:**
- Múltiples representantes se muestran correctamente
- Otros vendedores ven los asientos ocupados por representantes
- El sistema funciona sin duplicaciones ni conflictos

---
*Documento creado el 28 de julio de 2025 - Testing de reservas de representantes*
