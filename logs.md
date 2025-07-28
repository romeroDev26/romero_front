🔄 SeatAndFareSelector: Recalculando selectedSeats para empresa: {representativeSelectedSeatIds: Array(0), selectedSeatId: 10950, allSelectedIds: Array(1)}
SeatAndFareSelector.tsx:105 🔄 SeatAndFareSelector: Recalculando selectedSeats para empresa: {representativeSelectedSeatIds: Array(0), selectedSeatId: 10950, allSelectedIds: Array(1)}
SeatMapRealtime.tsx:182 🔄 SeatMapRealtime: selectedSeats changed: {selectedSeatsArray: Array(1), selectedSeatsSize: 1, isCompanyMode: true}
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
SaleForm.tsx:437 🔄 SaleForm: Recalculando representative seat IDs: {representativesCount: 1, representatives: Array(1), seatIds: Array(1)}
SaleForm.tsx:437 🔄 SaleForm: Recalculando representative seat IDs: {representativesCount: 1, representatives: Array(1), seatIds: Array(1)}
SeatAndFareSelector.tsx:105 🔄 SeatAndFareSelector: Recalculando selectedSeats para empresa: {representativeSelectedSeatIds: Array(1), selectedSeatId: undefined, allSelectedIds: Array(1)}
SeatAndFareSelector.tsx:105 🔄 SeatAndFareSelector: Recalculando selectedSeats para empresa: {representativeSelectedSeatIds: Array(1), selectedSeatId: undefined, allSelectedIds: Array(1)}
SeatMapRealtime.tsx:182 🔄 SeatMapRealtime: selectedSeats changed: {selectedSeatsArray: Array(1), selectedSeatsSize: 1, isCompanyMode: true}
useWebSocketConnection.ts:64 📥 MENSAJE DEL BACKEND: {
  "type": "SEAT_TEMP_RESERVED",
  "tripId": 199,
  "seatId": 10950,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f",
  "userName": "test system",
  "representativeName": "WILMER ALEXANDER EDQUÉN BARBOZA",
  "reservationType": "REPRESENTATIVE_TEMP_RESERVATION",
  "expiresAt": "2025-07-28T19:13:40.542515Z",
  "timestamp": "2025-07-28T18:43:40.542468Z",
  "sessionId": "session-1753720997114-wi85cq6jf",
  "reservationCategory": "representative"
}
websocketMessageHandler.ts:124 🎯 PROCESANDO SEAT_TEMP_RESERVED: {seatId: 10950, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', myUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', isForMe: true, reservationType: 'REPRESENTATIVE_TEMP_RESERVATION', …}
websocketMessageHandler.ts:151 🧠 LÓGICA DE DECISIÓN: {isRepresentativeReservation: true, isMyOwnRepresentativeReservation: 'WILMER ALEXANDER EDQUÉN BARBOZA', shouldAddSelection: true, messageUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', myUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f'}
websocketMessageHandler.ts:175 ✅ AGREGANDO SELECCIÓN: {isRepresentativeReservation: true, shouldAddSelection: true, selection: {…}}
useSeatSelections.ts:48 🗂️ AGREGANDO SELECCIÓN A MAP: {seatId: 10950, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', type: 'representative', representativeName: 'WILMER ALEXANDER EDQUÉN BARBOZA', previousMapSize: 0}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: {newMapSize: 1, allSelections: Array(1)}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: {newMapSize: 1, allSelections: Array(1)}
SeatRealtime.tsx:42 🎨 ESTILOS ASIENTO undefined: {seatNumber: undefined, seatId: undefined, activeSelection: {…}, isSelected: true, isWebSocketAvailable: true, …}
SeatRealtime.tsx:42 🎨 ESTILOS ASIENTO undefined: {seatNumber: undefined, seatId: undefined, activeSelection: {…}, isSelected: true, isWebSocketAvailable: true, …}
useWebSocketConnection.ts:64 📥 MENSAJE DEL BACKEND: {
  "type": "SEAT_TEMP_RESERVED",
  "tripId": 199,
  "seatId": 10950,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f",
  "userName": "test system",
  "representativeName": "WILMER ALEXANDER EDQUÉN BARBOZA",
  "reservationType": "REPRESENTATIVE_TEMP_RESERVATION",
  "expiresAt": "2025-07-28T19:13:40.542515Z",
  "timestamp": "2025-07-28T18:43:40.542468Z",
  "sessionId": "session-1753720997114-wi85cq6jf",
  "reservationCategory": "representative"
}
websocketMessageHandler.ts:124 🎯 PROCESANDO SEAT_TEMP_RESERVED: {seatId: 10950, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', myUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', isForMe: true, reservationType: 'REPRESENTATIVE_TEMP_RESERVATION', …}
websocketMessageHandler.ts:151 🧠 LÓGICA DE DECISIÓN: {isRepresentativeReservation: true, isMyOwnRepresentativeReservation: 'WILMER ALEXANDER EDQUÉN BARBOZA', shouldAddSelection: true, messageUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', myUserId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f'}
websocketMessageHandler.ts:175 ✅ AGREGANDO SELECCIÓN: {isRepresentativeReservation: true, shouldAddSelection: true, selection: {…}}
useSeatSelections.ts:48 🗂️ AGREGANDO SELECCIÓN A MAP: {seatId: 10950, userId: 'fb408cb6-9b5e-443e-840c-072a9f825a0f', type: 'representative', representativeName: 'WILMER ALEXANDER EDQUÉN BARBOZA', previousMapSize: 0}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: {newMapSize: 1, allSelections: Array(1)}
SeatMapRealtime.tsx:159 🗺️ DEBUGGING SEAT MAP REALTIME: {totalActiveSelections: 1, activeSelections: Array(1), occupiedSeatNumbers: Array(1), selectedSeats: Array(1)}
useSeatSelections.ts:60 🗂️ MAP DESPUÉS DE AGREGAR: {newMapSize: 1, allSelections: Array(1)}
SeatRealtime.tsx:42 🎨 ESTILOS ASIENTO undefined: {seatNumber: undefined, seatId: undefined, activeSelection: {…}, isSelected: true, isWebSocketAvailable: true, …}
SeatRealtime.tsx:42 🎨 ESTILOS ASIENTO undefined: {seatNumber: undefined, seatId: undefined, activeSelection: {…}, isSelected: true, isWebSocketAvailable: true, …}
useWebSocketConnection.ts:64 📥 MENSAJE DEL BACKEND: {
  "type": "SEAT_TEMP_RESERVE_RESPONSE",
  "success": true,
  "seatId": 10950,
  "representativeName": "WILMER ALEXANDER EDQUÉN BARBOZA",
  "sessionId": "session-1753720997114-wi85cq6jf",
  "reservationType": "representative",
  "ttlSeconds": 1800
}
SaleForm.tsx:338 ⏰ VERIFICACIÓN POST-RESERVA (después de 3 segundos):
SaleForm.tsx:339 - ¿Llegó respuesta del backend? Revisar mensajes 📥 arriba
SaleForm.tsx:340 - Estado actual de activeSeatSelections: Map(0) {size: 0}
SaleForm.tsx:341 - Tamaño de activeSeatSelections: 0
SaleForm.tsx:342 - Lista de asientos activos: []
seatOperations.ts:150 🔄 Liberando asiento de representante: {
  "type": "SEAT_TEMP_RELEASE",
  "seatId": 10950,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f-company-session-1753720997114-wi85cq6jf-rep-0",
  "sessionId": "session-1753720997114-wi85cq6jf",
  "reservationType": "representative"
}
useWebSocketConnection.ts:110 📡 ENVIANDO AL BACKEND: {
  "type": "SEAT_TEMP_RELEASE",
  "seatId": 10950,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f-company-session-1753720997114-wi85cq6jf-rep-0",
  "sessionId": "session-1753720997114-wi85cq6jf",
  "reservationType": "representative"
}
useWebSocketConnection.ts:110 📡 ENVIANDO AL BACKEND: {
  "type": "SEAT_RELEASED",
  "seatId": 10950,
  "userId": "fb408cb6-9b5e-443e-840c-072a9f825a0f",
  "userName": "test system",
  "timestamp": "2025-07-28T18:43:58.526Z"
}
useSeatSelections.ts:80 ❌ REMOVIENDO SELECCIÓN DEL MAP: {seatId: 10950, previousMapSize: 0}
useSeatSelections.ts:90 ❌ MAP DESPUÉS DE REMOVER: {newMapSize: 0, removedSelection: {…}, remainingSelections: Array(0)}
useSeatSelections.ts:90 ❌ MAP DESPUÉS DE REMOVER: {newMapSize: 0, removedSelection: {…}, remainingSelections: Array(0)}
SaleForm.tsx:437 🔄 SaleForm: Recalculando representative seat IDs: {representativesCount: 0, representatives: Array(0), seatIds: Array(0)}
SaleForm.tsx:437 🔄 SaleForm: Recalculando representative seat IDs: {representativesCount: 0, representatives: Array(0), seatIds: Array(0)}
SeatAndFareSelector.tsx:105 🔄 SeatAndFareSelector: Recalculando selectedSeats para empresa: {representativeSelectedSeatIds: Array(0), selectedSeatId: undefined, allSelectedIds: Array(0)}
SeatAndFareSelector.tsx:105 🔄 SeatAndFareSelector: Recalculando selectedSeats para empresa: {representativeSelectedSeatIds: Array(0), selectedSeatId: undefined, allSelectedIds: Array(0)}
SeatRealtime.tsx:42 🎨 ESTILOS ASIENTO undefined: {seatNumber: undefined, seatId: undefined, activeSelection: {…}, isSelected: false, isWebSocketAvailable: true, …}
SeatRealtime.tsx:42 🎨 ESTILOS ASIENTO undefined: {seatNumber: undefined, seatId: undefined, activeSelection: {…}, isSelected: false, isWebSocketAvailable: true, …}
SeatMapRealtime.tsx:182 🔄 SeatMapRealtime: selectedSeats changed: {selectedSeatsArray: Array(0), selectedSeatsSize: 0, isCompanyMode: true}
useWebSocketConnection.ts:64 📥 MENSAJE DEL BACKEND: {
  "type": "SEAT_TEMP_RELEASE_RESPONSE",
  "success": true,
  "releasedCount": 1,
  "seatId": 10950,
  "sessionId": "session-1753720997114-wi85cq6jf"
}