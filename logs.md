# 🚨 *Solución al Problema: Asientos que Desaparecen del Mapa*

## 📋 *Problema Identificado*

Según los logs proporcionados, el frontend está enviando un evento WebSocket *incorrecto* que causa que los asientos desaparezcan del mapa:

### *❌ Lo que está haciendo el frontend (INCORRECTO):*
javascript
// Frontend envía este evento que NO EXISTE en el backend
{
  type: 'REPRESENTATIVE_SELECTION',
  seatId: 9995,
  companyName: 'LUNA VILLANUEVA JHON MARCOS',
  representativeIndex: 0,
  representativeName: 'LUNA VILLANUEVA JHON MARCOS'
}


### *🔍 Secuencia del problema:*
1. ✅ Usuario selecciona asiento → SEAT_SELECTION → Asiento se marca como selected
2. ❌ Frontend envía REPRESENTATIVE_SELECTION → *Backend NO reconoce este evento*
3. ❌ Frontend envía SEAT_RELEASED → Asiento se libera y desaparece
4. 💥 *Resultado:* Asiento queda disponible para otros usuarios

---

## ✅ *Solución: Usar Eventos Correctos*

### *Eventos WebSocket Implementados en el Backend:*

| Evento | Propósito | Parámetros |
|--------|-----------|------------|
| SEAT_SELECTION | Selección normal (5 min) | seatId |
| SEAT_RELEASED | Liberar asiento | seatId |
| SEAT_TEMP_RESERVE | *Reserva temporal* | seatId, representativeName |
| SEAT_TEMP_RELEASE | Liberar reserva temporal | seatId, releaseAll, reservationType |

---

## 🔧 *Código Frontend Corregido*

### *❌ ANTES (Incorrecto):*
javascript
// NO USAR - Este evento no existe
function selectSeatForRepresentative(seatId, representativeName) {
  const message = {
    type: "REPRESENTATIVE_SELECTION",  // ❌ EVENTO INEXISTENTE
    seatId: seatId,
    representativeName: representativeName
  };
  ws.send(JSON.stringify(message));
}


### *✅ DESPUÉS (Correcto):*
javascript
// USAR ESTE - Evento correcto implementado
function selectSeatForRepresentative(seatId, representativeName) {
  const message = {
    type: "SEAT_TEMP_RESERVE",  // ✅ EVENTO CORRECTO
    seatId: seatId,
    representativeName: representativeName  // Activa TTL de 30 minutos
  };
  ws.send(JSON.stringify(message));
}


---

## 📡 *Manejo de Respuestas WebSocket*

### *Respuestas que debe manejar el frontend:*

javascript
function handleWebSocketMessage(data) {
  switch (data.type) {
    // ✅ Confirmación de reserva temporal exitosa
    case 'SEAT_TEMP_RESERVE_RESPONSE':
      if (data.success) {
        console.log(`✅ Asiento ${data.seatId} reservado para representante ${data.representativeName}`);
        // Actualizar UI: asiento → 'representative_reserved' (púrpura)
        updateSeatUI(data.seatId, 'representative_reserved', {
          representativeName: data.representativeName,
          ttlSeconds: data.ttlSeconds
        });
      } else {
        console.log(`❌ Error: No se pudo reservar asiento ${data.seatId}`);
        showError(`Asiento ${data.seatId} no disponible`);
      }
      break;
    
    // 🔔 Notificación: otro usuario reservó un asiento
    case 'SEAT_TEMP_RESERVED':
      console.log(`🔒 Asiento ${data.seatId} reservado por ${data.userName}`);
      if (data.representativeName) {
        // Es una reserva de representante
        updateSeatUI(data.seatId, 'representative_reserved', data);
      } else {
        // Es una reserva normal
        updateSeatUI(data.seatId, 'reserved', data);
      }
      break;
    
    // 🔓 Notificación: asientos liberados
    case 'SEAT_TEMP_RELEASED':
      console.log(`🔓 Asientos liberados: ${data.seatIds.join(', ')}`);
      data.seatIds.forEach(seatId => {
        updateSeatUI(seatId, 'available');
      });
      break;
  }
}


---

## 🎨 *Estados Visuales Correctos*

javascript
// Estados de asientos
const SEAT_STATES = {
  AVAILABLE: 'available',                    // Gris - Disponible
  SELECTED: 'selected',                      // Azul - Seleccionado por mí
  RESERVED: 'reserved',                      // Amarillo - Reservado por otro (5 min)
  REPRESENTATIVE_RESERVED: 'representative_reserved', // Púrpura - Representante (30 min)
  OCCUPIED: 'occupied'                       // Rojo - Vendido permanentemente
};

function updateSeatUI(seatId, state, data = null) {
  const seatElement = document.querySelector(`[data-seat-id="${seatId}"]`);
  if (!seatElement) return;
  
  // Colores según estado
  const colors = {
    available: '#e5e7eb',
    selected: '#3b82f6',
    reserved: '#f59e0b',
    representative_reserved: '#8b5cf6',  // Púrpura para representantes
    occupied: '#ef4444'
  };
  
  seatElement.style.backgroundColor = colors[state];
  seatElement.className = `seat ${state}`;
  
  // Indicador especial para representantes
  if (state === 'representative_reserved') {
    seatElement.innerHTML = `${seatElement.dataset.seatNumber}<br><small>REP</small>`;
    if (data && data.representativeName) {
      seatElement.title = `Reservado para: ${data.representativeName}\nExpira en: ${Math.floor(data.ttlSeconds / 60)} minutos`;
    }
  } else {
    seatElement.innerHTML = seatElement.dataset.seatNumber;
  }
}


---

## 🔄 *Flujo Correcto Completo*

### *1. Seleccionar asiento para representante:*
javascript
// Cuando usuario hace clic en un asiento para representante
function onSeatClickForRepresentative(seatId, representativeName) {
  // Enviar reserva temporal con TTL de 30 minutos
  const message = {
    type: "SEAT_TEMP_RESERVE",
    seatId: seatId,
    representativeName: representativeName
  };
  
  ws.send(JSON.stringify(message));
}


### *2. Manejar confirmación:*
javascript
// En handleWebSocketMessage
case 'SEAT_TEMP_RESERVE_RESPONSE':
  if (data.success) {
    // ✅ Asiento reservado exitosamente
    updateSeatUI(data.seatId, 'representative_reserved', data);
    
    // Agregar a lista de representantes
    addRepresentativeToList({
      name: data.representativeName,
      seatId: data.seatId,
      seatNumber: getSeatNumber(data.seatId)
    });
  } else {
    // ❌ Error en reserva
    showError(`No se pudo reservar el asiento para ${data.representativeName}`);
  }
  break;


### *3. Crear factura final:*
javascript
// Al final, crear factura con asientos ya reservados
async function createInvoiceWithRepresentatives() {
  const representatives = getSelectedRepresentatives(); // Obtener de la UI
  
  const invoiceData = {
    company: getCompanyData(),
    trip_id: tripId,
    representatives: representatives.map(rep => ({
      name: rep.name,
      seat_number: rep.seatNumber,
      passenger_doc_type: rep.docType,
      passenger_doc_number: rep.docNumber,
      // ... otros campos
    }))
  };
  
  try {
    const response = await fetch('/api/v1/sunat/invoices/company-with-representatives', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(invoiceData)
    });
    
    if (response.ok) {
      console.log('✅ Factura creada exitosamente');
      // Las reservas temporales se convierten automáticamente en ocupadas
    }
  } catch (error) {
    console.error('❌ Error creando factura:', error);
  }
}


---

## 🚨 *Cambios Urgentes Requeridos en Frontend*

### *1. Reemplazar evento incorrecto:*
diff
- type: "REPRESENTATIVE_SELECTION"  // ❌ NO EXISTE
+ type: "SEAT_TEMP_RESERVE"         // ✅ CORRECTO


### *2. Agregar manejo de respuestas:*
javascript
// Agregar estos casos en handleWebSocketMessage:
+ case 'SEAT_TEMP_RESERVE_RESPONSE':
+ case 'SEAT_TEMP_RESERVED':
+ case 'SEAT_TEMP_RELEASED':


### *3. Actualizar estados visuales:*
javascript
// Agregar estado púrpura para representantes
+ representative_reserved: '#8b5cf6'


---

## ✅ *Resultado Esperado*

Después de aplicar estos cambios:

1. ✅ *Asiento se reserva correctamente* para representante (30 min)
2. ✅ *Asiento se muestra púrpura* con indicador "REP"
3. ✅ *Otros usuarios NO pueden seleccionarlo*
4. ✅ *Reserva se mantiene* hasta crear la factura
5. ✅ *Al crear factura* → reserva temporal → asiento ocupado permanentemente

---

## 🔧 *Para Debugging*

### *Verificar en consola del navegador:*
javascript
// Verificar que WebSocket esté conectado
console.log('WebSocket state:', ws.readyState); // Debe ser 1 (OPEN)

// Verificar eventos enviados
ws.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log('📨 Recibido:', data);
});

// Verificar eventos enviados
const originalSend = ws.send;
ws.send = function(data) {
  console.log('📤 Enviando:', JSON.parse(data));
  return originalSend.call(this, data);
};


*🎯 Con estos cambios, el problema de asientos que desaparecen se solucionará completamente.*


### 🎯 ESTADOS de Asientos (Frontend - Visual)
### 📡 EVENTOS WebSocket (Comunicación)

// Eventos para comunicarse con el backend
const WEBSOCKET_EVENTS = {
  "SEAT_SELECTION",          // 
  Seleccionar asiento normal
  "SEAT_RELEASED",           // Liberar 
  asiento
  "SEAT_TEMP_RESERVE",       // ✅ 
  CORRECTO para representantes
  "SEAT_TEMP_RELEASE"        // Liberar 
  reserva temporal
}

### ❌ El Error que Tenías:
Estabas enviando un evento inexistente :


// ❌ INCORRECTO - Este evento NO EXISTE
{
  type: "REPRESENTATIVE_SELECTION",  // ← 
  Este no es un evento válido
  seatId: 9995,
  representativeName: "Juan Pérez"
}

### ✅ Lo Correcto:
1. 1.
   Enviar evento correcto:

// ✅ CORRECTO - Este evento SÍ EXISTE
{
  type: "SEAT_TEMP_RESERVE",  // ← Evento 
  válido
  seatId: 9995,
  representativeName: "Juan Pérez"
}
