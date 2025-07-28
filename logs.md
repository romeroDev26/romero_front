logs del primer vendedor quien hace la venta de los representates:
📡 ENVIANDO AL BACKEND: {
  "type": "SEAT_SELECTION",
  "seatId": 10950,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f",
  "userName": "test system",
  "selectionType": "temporary",
  "timestamp": "2025-07-28T17:48:09.050Z"
}
SaleForm.tsx:317 🔵 === INICIO RESERVA REPRESENTANTE ===
SaleForm.tsx:318 ✅ Datos de entrada: {seatId: 10950, seatNumber: '28', representativeIndex: 0, representativeName: 'WILMER ALEXANDER EDQUÉN BARBOZA', isConnected: true, …}
seatOperations.ts:99 🚀 Enviando mensaje al backend: {
  "type": "SEAT_TEMP_RESERVE",
  "seatId": 10950,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f-company-session-1753720997114-wi85cq6jf-rep-0",
  "userName": "LUNA VILLANUEVA JHON MARCOS - WILMER ALEXANDER EDQUÉN BARBOZA",
  "representativeName": "WILMER ALEXANDER EDQUÉN BARBOZA",
  "sessionId": "session-1753720997114-wi85cq6jf",
  "reservationType": "representative"
}
useWebSocketConnection.ts:110 📡 ENVIANDO AL BACKEND: {
  "type": "SEAT_TEMP_RESERVE",
  "seatId": 10950,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f-company-session-1753720997114-wi85cq6jf-rep-0",
  "userName": "LUNA VILLANUEVA JHON MARCOS - WILMER ALEXANDER EDQUÉN BARBOZA",
  "representativeName": "WILMER ALEXANDER EDQUÉN BARBOZA",
  "sessionId": "session-1753720997114-wi85cq6jf",
  "reservationType": "representative"
}
seatOperations.ts:105 📤 Mensaje enviado: ÉXITO
SaleForm.tsx:334 📡 Resultado de reserva WebSocket: true
SaleForm.tsx:345 🔵 === FIN RESERVA REPRESENTANTE ===
useWebSocketConnection.ts:64 📥 MENSAJE DEL BACKEND: {
  "type": "SEAT_TEMP_RESERVED",
  "tripId": 199,
  "seatId": 10950,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f",
  "userName": "test system",
  "representativeName": "WILMER ALEXANDER EDQUÉN BARBOZA",
  "reservationType": "REPRESENTATIVE_TEMP_RESERVATION",
  "expiresAt": "2025-07-28T18:18:12.617775Z",
  "timestamp": "2025-07-28T17:48:12.617754Z",
  "sessionId": "session-1753720997114-wi85cq6jf",
  "reservationCategory": "representative"
}
websocketMessageHandler.ts:124 🎯 PROCESANDO SEAT_TEMP_RESERVED: {seatId: 10950, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', myUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', isForMe: true, reservationType: 'REPRESENTATIVE_TEMP_RESERVATION', …}
websocketMessageHandler.ts:151 🧠 LÓGICA DE DECISIÓN: {isRepresentativeReservation: true, isMyOwnRepresentativeReservation: 'WILMER ALEXANDER EDQUÉN BARBOZA', shouldAddSelection: true, messageUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', myUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f'}
websocketMessageHandler.ts:175 ✅ AGREGANDO SELECCIÓN: {isRepresentativeReservation: true, shouldAddSelection: true, selection: {…}}
useSeatSelections.ts:48 🗂️ AGREGANDO SELECCIÓN A MAP: {seatId: 10950, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', type: 'representative', representativeName: 'WILMER ALEXANDER EDQUÉN BARBOZA', previousMapSize: 0}
useWebSocketConnection.ts:64 📥 MENSAJE DEL BACKEND: {
  "type": "SEAT_TEMP_RESERVE_RESPONSE",
  "success": true,
  "seatId": 10950,
  "representativeName": "WILMER ALEXANDER EDQUÉN BARBOZA",
  "sessionId": "session-1753720997114-wi85cq6jf",
  "reservationType": "representative",
  "ttlSeconds": 1800
}
useWebSocketConnection.ts:64 📥 MENSAJE DEL BACKEND: {
  "type": "SEAT_TEMP_RESERVED",
  "tripId": 199,
  "seatId": 10950,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f",
  "userName": "test system",
  "representativeName": "WILMER ALEXANDER EDQUÉN BARBOZA",
  "reservationType": "REPRESENTATIVE_TEMP_RESERVATION",
  "expiresAt": "2025-07-28T18:18:12.617775Z",
  "timestamp": "2025-07-28T17:48:12.617754Z",
  "sessionId": "session-1753720997114-wi85cq6jf",
  "reservationCategory": "representative"
}
websocketMessageHandler.ts:124 🎯 PROCESANDO SEAT_TEMP_RESERVED: {seatId: 10950, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', myUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', isForMe: true, reservationType: 'REPRESENTATIVE_TEMP_RESERVATION', …}
websocketMessageHandler.ts:151 🧠 LÓGICA DE DECISIÓN: {isRepresentativeReservation: true, isMyOwnRepresentativeReservation: 'WILMER ALEXANDER EDQUÉN BARBOZA', shouldAddSelection: true, messageUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', myUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f'}
websocketMessageHandler.ts:175 ✅ AGREGANDO SELECCIÓN: {isRepresentativeReservation: true, shouldAddSelection: true, selection: {…}}
useSeatSelections.ts:48 🗂️ AGREGANDO SELECCIÓN A MAP: {seatId: 10950, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', type: 'representative', representativeName: 'WILMER ALEXANDER EDQUÉN BARBOZA', previousMapSize: 0}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: {newMapSize: 1, allSelections: Array(1)}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: {newMapSize: 1, allSelections: Array(1)}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: {newMapSize: 1, allSelections: Array(1)}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: {newMapSize: 1, allSelections: Array(1)}
SeatRealtime.tsx:42 🎨 ESTILOS ASIENTO undefined: {seatNumber: undefined, seatId: undefined, activeSelection: {…}, isSelected: true, isWebSocketAvailable: true, …}
SeatRealtime.tsx:42 🎨 ESTILOS ASIENTO undefined: {seatNumber: undefined, seatId: undefined, activeSelection: {…}, isSelected: true, isWebSocketAvailable: true, …}
SeatMapRealtime.tsx:151 🗺️ DEBUGGING SEAT MAP REALTIME: {totalActiveSelections: 1, activeSelections: Array(1), occupiedSeatNumbers: Array(1), selectedSeats: Array(1)}
SaleForm.tsx:338 ⏰ VERIFICACIÓN POST-RESERVA (después de 3 segundos):
SaleForm.tsx:339 - ¿Llegó respuesta del backend? Revisar mensajes 📥 arriba
SaleForm.tsx:340 - Estado actual de activeSeatSelections: Map(0) {size: 0}
SaleForm.tsx:341 - Tamaño de activeSeatSelections: 0
SaleForm.tsx:342 - Lista de asientos activos: []
SeatRealtime.tsx:42 🎨 ESTILOS ASIENTO undefined: {seatNumber: undefined, seatId: undefined, activeSelection: {…}, isSelected: false, isWebSocketAvailable: true, …}
SeatRealtime.tsx:42 🎨 ESTILOS ASIENTO undefined: {seatNumber: undefined, seatId: undefined, activeSelection: {…}, isSelected: false, isWebSocketAvailable: true, …}
useWebSocketConnection.ts:110 📡 ENVIANDO AL BACKEND: {
  "type": "SEAT_RELEASED",
  "seatId": 10950,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f",
  "userName": "test system",
  "timestamp": "2025-07-28T17:48:30.354Z"
}
useSeatSelections.ts:80 ❌ REMOVIENDO SELECCIÓN DEL MAP: {seatId: 10950, previousMapSize: 1}
useSeatSelections.ts:90 ❌ MAP DESPUÉS DE REMOVER: {newMapSize: 0, removedSelection: {…}, remainingSelections: Array(0)}
useWebSocketConnection.ts:110 📡 ENVIANDO AL BACKEND: {
  "type": "SEAT_SELECTION",
  "seatId": 10949,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f",
  "userName": "test system",
  "selectionType": "temporary",
  "timestamp": "2025-07-28T17:48:30.355Z"
}
useSeatSelections.ts:90 ❌ MAP DESPUÉS DE REMOVER: {newMapSize: 0, removedSelection: {…}, remainingSelections: Array(0)}
SaleForm.tsx:317 🔵 === INICIO RESERVA REPRESENTANTE ===
SaleForm.tsx:318 ✅ Datos de entrada: {seatId: 10949, seatNumber: '27', representativeIndex: 1, representativeName: 'ARIANA BRISALUCIA MALLMA ZAPATA', isConnected: true, …}
seatOperations.ts:99 🚀 Enviando mensaje al backend: {
  "type": "SEAT_TEMP_RESERVE",
  "seatId": 10949,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f-company-session-1753720997114-wi85cq6jf-rep-1",
  "userName": "LUNA VILLANUEVA JHON MARCOS - ARIANA BRISALUCIA MALLMA ZAPATA",
  "representativeName": "ARIANA BRISALUCIA MALLMA ZAPATA",
  "sessionId": "session-1753720997114-wi85cq6jf",
  "reservationType": "representative"
}
useWebSocketConnection.ts:110 📡 ENVIANDO AL BACKEND: {
  "type": "SEAT_TEMP_RESERVE",
  "seatId": 10949,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f-company-session-1753720997114-wi85cq6jf-rep-1",
  "userName": "LUNA VILLANUEVA JHON MARCOS - ARIANA BRISALUCIA MALLMA ZAPATA",
  "representativeName": "ARIANA BRISALUCIA MALLMA ZAPATA",
  "sessionId": "session-1753720997114-wi85cq6jf",
  "reservationType": "representative"
}
seatOperations.ts:105 📤 Mensaje enviado: ÉXITO
SaleForm.tsx:334 📡 Resultado de reserva WebSocket: true
SaleForm.tsx:345 🔵 === FIN RESERVA REPRESENTANTE ===
useWebSocketConnection.ts:64 📥 MENSAJE DEL BACKEND: {
  "type": "SEAT_TEMP_RESERVED",
  "tripId": 199,
  "seatId": 10949,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f",
  "userName": "test system",
  "representativeName": "ARIANA BRISALUCIA MALLMA ZAPATA",
  "reservationType": "REPRESENTATIVE_TEMP_RESERVATION",
  "expiresAt": "2025-07-28T18:18:37.699914Z",
  "timestamp": "2025-07-28T17:48:37.699894Z",
  "sessionId": "session-1753720997114-wi85cq6jf",
  "reservationCategory": "representative"
}
websocketMessageHandler.ts:124 🎯 PROCESANDO SEAT_TEMP_RESERVED: {seatId: 10949, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', myUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', isForMe: true, reservationType: 'REPRESENTATIVE_TEMP_RESERVATION', …}
websocketMessageHandler.ts:151 🧠 LÓGICA DE DECISIÓN: {isRepresentativeReservation: true, isMyOwnRepresentativeReservation: 'ARIANA BRISALUCIA MALLMA ZAPATA', shouldAddSelection: true, messageUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', myUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f'}
websocketMessageHandler.ts:175 ✅ AGREGANDO SELECCIÓN: {isRepresentativeReservation: true, shouldAddSelection: true, selection: {…}}
useSeatSelections.ts:48 🗂️ AGREGANDO SELECCIÓN A MAP: {seatId: 10949, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', type: 'representative', representativeName: 'ARIANA BRISALUCIA MALLMA ZAPATA', previousMapSize: 0}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: {newMapSize: 2, allSelections: Array(2)}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: {newMapSize: 2, allSelections: Array(2)}
useWebSocketConnection.ts:64 📥 MENSAJE DEL BACKEND: {
  "type": "SEAT_TEMP_RESERVE_RESPONSE",
  "success": true,
  "seatId": 10949,
  "representativeName": "ARIANA BRISALUCIA MALLMA ZAPATA",
  "sessionId": "session-1753720997114-wi85cq6jf",
  "reservationType": "representative",
  "ttlSeconds": 1800
}
useWebSocketConnection.ts:64 📥 MENSAJE DEL BACKEND: {
  "type": "SEAT_TEMP_RESERVED",
  "tripId": 199,
  "seatId": 10949,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f",
  "userName": "test system",
  "representativeName": "ARIANA BRISALUCIA MALLMA ZAPATA",
  "reservationType": "REPRESENTATIVE_TEMP_RESERVATION",
  "expiresAt": "2025-07-28T18:18:37.699914Z",
  "timestamp": "2025-07-28T17:48:37.699894Z",
  "sessionId": "session-1753720997114-wi85cq6jf",
  "reservationCategory": "representative"
}
websocketMessageHandler.ts:124 🎯 PROCESANDO SEAT_TEMP_RESERVED: {seatId: 10949, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', myUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', isForMe: true, reservationType: 'REPRESENTATIVE_TEMP_RESERVATION', …}
websocketMessageHandler.ts:151 🧠 LÓGICA DE DECISIÓN: {isRepresentativeReservation: true, isMyOwnRepresentativeReservation: 'ARIANA BRISALUCIA MALLMA ZAPATA', shouldAddSelection: true, messageUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', myUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f'}
websocketMessageHandler.ts:175 ✅ AGREGANDO SELECCIÓN: {isRepresentativeReservation: true, shouldAddSelection: true, selection: {…}}
useSeatSelections.ts:48 🗂️ AGREGANDO SELECCIÓN A MAP: {seatId: 10949, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', type: 'representative', representativeName: 'ARIANA BRISALUCIA MALLMA ZAPATA', previousMapSize: 0}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: {newMapSize: 1, allSelections: Array(1)}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: {newMapSize: 1, allSelections: Array(1)}
SeatRealtime.tsx:42 🎨 ESTILOS ASIENTO undefined: {seatNumber: undefined, seatId: undefined, activeSelection: {…}, isSelected: false, isWebSocketAvailable: true, …}
SeatRealtime.tsx:42 🎨 ESTILOS ASIENTO undefined: {seatNumber: undefined, seatId: undefined, activeSelection: {…}, isSelected: false, isWebSocketAvailable: true, …}
SeatMapRealtime.tsx:151 🗺️ DEBUGGING SEAT MAP REALTIME: {totalActiveSelections: 1, activeSelections: Array(1), occupiedSeatNumbers: Array(2), selectedSeats: Array(1)}
SaleForm.tsx:338 ⏰ VERIFICACIÓN POST-RESERVA (después de 3 segundos):
SaleForm.tsx:339 - ¿Llegó respuesta del backend? Revisar mensajes 📥 arriba
SaleForm.tsx:340 - Estado actual de activeSeatSelections: Map(1) {10950 => {…}}
SaleForm.tsx:341 - Tamaño de activeSeatSelections: 1
SaleForm.tsx:342 - Lista de asientos activos: [Array(2)]


LOGS DEL SEGUNDO VENDEDOR QUIEN VE LOS ASIENTOS OCUPADOS:

﻿
useWebSocketConnection.ts:64 📥 MENSAJE DEL BACKEND: {
  "type": "SEAT_TEMP_RESERVED",
  "tripId": 199,
  "seatId": 10950,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f",
  "userName": "test system",
  "representativeName": "WILMER ALEXANDER EDQUÉN BARBOZA",
  "reservationType": "REPRESENTATIVE_TEMP_RESERVATION",
  "expiresAt": "2025-07-28T18:18:12.617775Z",
  "timestamp": "2025-07-28T17:48:12.617754Z",
  "sessionId": "session-1753720997114-wi85cq6jf",
  "reservationCategory": "representative"
}
websocketMessageHandler.ts:124 🎯 PROCESANDO SEAT_TEMP_RESERVED: 
{seatId: 10950, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', myUserId: 'dc088761-58c5-4fc0-bd11-9cf4880c7061', isForMe: false, reservationType: 'REPRESENTATIVE_TEMP_RESERVATION', …}
websocketMessageHandler.ts:151 🧠 LÓGICA DE DECISIÓN: 
{isRepresentativeReservation: true, isMyOwnRepresentativeReservation: false, shouldAddSelection: true, messageUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', myUserId: 'dc088761-58c5-4fc0-bd11-9cf4880c7061'}
websocketMessageHandler.ts:175 ✅ AGREGANDO SELECCIÓN: 
{isRepresentativeReservation: true, shouldAddSelection: true, selection: {…}}
useSeatSelections.ts:48 🗂️ AGREGANDO SELECCIÓN A MAP: 
{seatId: 10950, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', type: 'representative', representativeName: 'WILMER ALEXANDER EDQUÉN BARBOZA', previousMapSize: 0}
useWebSocketConnection.ts:64 📥 MENSAJE DEL BACKEND: {
  "type": "SEAT_TEMP_RESERVED",
  "tripId": 199,
  "seatId": 10950,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f",
  "userName": "test system",
  "representativeName": "WILMER ALEXANDER EDQUÉN BARBOZA",
  "reservationType": "REPRESENTATIVE_TEMP_RESERVATION",
  "expiresAt": "2025-07-28T18:18:12.617775Z",
  "timestamp": "2025-07-28T17:48:12.617754Z",
  "sessionId": "session-1753720997114-wi85cq6jf",
  "reservationCategory": "representative"
}
websocketMessageHandler.ts:124 🎯 PROCESANDO SEAT_TEMP_RESERVED: 
{seatId: 10950, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', myUserId: 'dc088761-58c5-4fc0-bd11-9cf4880c7061', isForMe: false, reservationType: 'REPRESENTATIVE_TEMP_RESERVATION', …}
websocketMessageHandler.ts:151 🧠 LÓGICA DE DECISIÓN: 
{isRepresentativeReservation: true, isMyOwnRepresentativeReservation: false, shouldAddSelection: true, messageUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', myUserId: 'dc088761-58c5-4fc0-bd11-9cf4880c7061'}
websocketMessageHandler.ts:175 ✅ AGREGANDO SELECCIÓN: 
{isRepresentativeReservation: true, shouldAddSelection: true, selection: {…}}
useSeatSelections.ts:48 🗂️ AGREGANDO SELECCIÓN A MAP: 
{seatId: 10950, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', type: 'representative', representativeName: 'WILMER ALEXANDER EDQUÉN BARBOZA', previousMapSize: 0}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: 
{newMapSize: 1, allSelections: Array(1)}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: 
{newMapSize: 1, allSelections: Array(1)}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: 
{newMapSize: 1, allSelections: Array(1)}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: 
{newMapSize: 1, allSelections: Array(1)}
SeatRealtime.tsx:42 🎨 ESTILOS ASIENTO undefined: 
{seatNumber: undefined, seatId: undefined, activeSelection: {…}, isSelected: false, isWebSocketAvailable: true, …}
SeatRealtime.tsx:42 🎨 ESTILOS ASIENTO undefined: 
{seatNumber: undefined, seatId: undefined, activeSelection: {…}, isSelected: false, isWebSocketAvailable: true, …}
SeatMapRealtime.tsx:151 🗺️ DEBUGGING SEAT MAP REALTIME: 
{totalActiveSelections: 1, activeSelections: Array(1), occupiedSeatNumbers: Array(1), selectedSeats: Array(0)}
useWebSocketConnection.ts:64 📥 MENSAJE DEL BACKEND: {
  "type": "SEAT_RELEASED",
  "tripId": 199,
  "seatId": 10950,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f",
  "userName": "test system",
  "timestamp": "2025-07-28T17:48:31.526494Z"
}
useSeatSelections.ts:80 ❌ REMOVIENDO SELECCIÓN DEL MAP: 
{seatId: 10950, previousMapSize: 0}
useSeatSelections.ts:90 ❌ MAP DESPUÉS DE REMOVER: 
{newMapSize: 0, removedSelection: {…}, remainingSelections: Array(0)}
useSeatSelections.ts:90 ❌ MAP DESPUÉS DE REMOVER: 
{newMapSize: 0, removedSelection: {…}, remainingSelections: Array(0)}
SeatRealtime.tsx:42 🎨 ESTILOS ASIENTO undefined: 
{seatNumber: undefined, seatId: undefined, activeSelection: {…}, isSelected: false, isWebSocketAvailable: true, …}
SeatRealtime.tsx:42 🎨 ESTILOS ASIENTO undefined: 
{seatNumber: undefined, seatId: undefined, activeSelection: {…}, isSelected: false, isWebSocketAvailable: true, …}
useWebSocketConnection.ts:64 📥 MENSAJE DEL BACKEND: {
  "type": "SEAT_RELEASED",
  "tripId": 199,
  "seatId": 10950,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f",
  "userName": "test system",
  "timestamp": "2025-07-28T17:48:31.526494Z"
}
useSeatSelections.ts:80 ❌ REMOVIENDO SELECCIÓN DEL MAP: 
{seatId: 10950, previousMapSize: 0}
useSeatSelections.ts:90 ❌ MAP DESPUÉS DE REMOVER: 
{newMapSize: 0, removedSelection: {…}, remainingSelections: Array(0)}
useSeatSelections.ts:90 ❌ MAP DESPUÉS DE REMOVER: 
{newMapSize: 0, removedSelection: {…}, remainingSelections: Array(0)}
useWebSocketConnection.ts:64 📥 MENSAJE DEL BACKEND: {
  "type": "SEAT_SELECTION",
  "tripId": 199,
  "seatId": 10949,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f",
  "userName": "test system",
  "timestamp": "2025-07-28T17:48:31.661016Z"
}
useSeatSelections.ts:48 🗂️ AGREGANDO SELECCIÓN A MAP: 
{seatId: 10949, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', type: 'temporary', representativeName: undefined, previousMapSize: 0}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: 
{newMapSize: 1, allSelections: Array(1)}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: 
{newMapSize: 1, allSelections: Array(1)}
useWebSocketConnection.ts:64 📥 MENSAJE DEL BACKEND: {
  "type": "SEAT_SELECTION",
  "tripId": 199,
  "seatId": 10949,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f",
  "userName": "test system",
  "timestamp": "2025-07-28T17:48:31.661016Z"
}
useSeatSelections.ts:48 🗂️ AGREGANDO SELECCIÓN A MAP: 
{seatId: 10949, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', type: 'temporary', representativeName: undefined, previousMapSize: 0}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: 
{newMapSize: 1, allSelections: Array(1)}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: 
{newMapSize: 1, allSelections: Array(1)}
SeatMapRealtime.tsx:151 🗺️ DEBUGGING SEAT MAP REALTIME: 
{totalActiveSelections: 1, activeSelections: Array(1), occupiedSeatNumbers: Array(1), selectedSeats: Array(0)}
useWebSocketConnection.ts:64 📥 MENSAJE DEL BACKEND: {
  "type": "SEAT_TEMP_RESERVED",
  "tripId": 199,
  "seatId": 10949,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f",
  "userName": "test system",
  "representativeName": "ARIANA BRISALUCIA MALLMA ZAPATA",
  "reservationType": "REPRESENTATIVE_TEMP_RESERVATION",
  "expiresAt": "2025-07-28T18:18:37.699914Z",
  "timestamp": "2025-07-28T17:48:37.699894Z",
  "sessionId": "session-1753720997114-wi85cq6jf",
  "reservationCategory": "representative"
}
websocketMessageHandler.ts:124 🎯 PROCESANDO SEAT_TEMP_RESERVED: 
{seatId: 10949, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', myUserId: 'dc088761-58c5-4fc0-bd11-9cf4880c7061', isForMe: false, reservationType: 'REPRESENTATIVE_TEMP_RESERVATION', …}
websocketMessageHandler.ts:151 🧠 LÓGICA DE DECISIÓN: 
{isRepresentativeReservation: true, isMyOwnRepresentativeReservation: false, shouldAddSelection: true, messageUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', myUserId: 'dc088761-58c5-4fc0-bd11-9cf4880c7061'}
websocketMessageHandler.ts:175 ✅ AGREGANDO SELECCIÓN: 
{isRepresentativeReservation: true, shouldAddSelection: true, selection: {…}}
useSeatSelections.ts:48 🗂️ AGREGANDO SELECCIÓN A MAP: 
{seatId: 10949, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', type: 'representative', representativeName: 'ARIANA BRISALUCIA MALLMA ZAPATA', previousMapSize: 0}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: 
{newMapSize: 1, allSelections: Array(1)}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: 
{newMapSize: 1, allSelections: Array(1)}
useWebSocketConnection.ts:64 📥 MENSAJE DEL BACKEND: {
  "type": "SEAT_TEMP_RESERVED",
  "tripId": 199,
  "seatId": 10949,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f",
  "userName": "test system",
  "representativeName": "ARIANA BRISALUCIA MALLMA ZAPATA",
  "reservationType": "REPRESENTATIVE_TEMP_RESERVATION",
  "expiresAt": "2025-07-28T18:18:37.699914Z",
  "timestamp": "2025-07-28T17:48:37.699894Z",
  "sessionId": "session-1753720997114-wi85cq6jf",
  "reservationCategory": "representative"
}
websocketMessageHandler.ts:124 🎯 PROCESANDO SEAT_TEMP_RESERVED: 
{seatId: 10949, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', myUserId: 'dc088761-58c5-4fc0-bd11-9cf4880c7061', isForMe: false, reservationType: 'REPRESENTATIVE_TEMP_RESERVATION', …}
websocketMessageHandler.ts:151 🧠 LÓGICA DE DECISIÓN: 
{isRepresentativeReservation: true, isMyOwnRepresentativeReservation: false, shouldAddSelection: true, messageUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', myUserId: 'dc088761-58c5-4fc0-bd11-9cf4880c7061'}
websocketMessageHandler.ts:175 ✅ AGREGANDO SELECCIÓN: 
{isRepresentativeReservation: true, shouldAddSelection: true, selection: {…}}
useSeatSelections.ts:48 🗂️ AGREGANDO SELECCIÓN A MAP: 
{seatId: 10949, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', type: 'representative', representativeName: 'ARIANA BRISALUCIA MALLMA ZAPATA', previousMapSize: 0}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: 
{newMapSize: 1, allSelections: Array(1)}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: 
{newMapSize: 1, allSelections: Array(1)}
SeatRealtime.tsx:42 🎨 ESTILOS ASIENTO undefined: 
{seatNumber: undefined, seatId: undefined, activeSelection: {…}, isSelected: false, isWebSocketAvailable: true, …}
SeatRealtime.tsx:42 🎨 ESTILOS ASIENTO undefined: 
{seatNumber: undefined, seatId: undefined, activeSelection: {…}, isSelected: false, isWebSocketAvailable: true, …}
SeatMapRealtime.tsx:151 🗺️ DEBUGGING SEAT MAP REALTIME: 
{totalActiveSelections: 1, activeSelections: Array(1), occupiedSeatNumbers: Array(1), selectedSeats: Array(0)}