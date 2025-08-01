// Prueba simple para verificar la estructura
import { testRealTicketGeneration, logDataSummary } from './testTickets';

console.log('🧪 EJECUTANDO PRUEBA DIRECTA...\n');

// Mostrar resumen de datos
logDataSummary();

console.log('\n🚀 Intentando generar ticket...');

// Ejecutar prueba
testRealTicketGeneration()
  .then((result) => {
    if (result) {
      console.log('✅ ¡Ticket generado exitosamente!');
    } else {
      console.log('❌ La generación falló');
    }
  })
  .catch((error) => {
    console.error('❌ Error en la generación:', error);
  });
