# Sistema de Generación de Tickets

Sistema modular para generar tickets de venta en formato PDF térmico (80mm) para Transportes Romero.

## Estructura del Sistema

```
tickets/
├── api/                    # API de conveniencia
│   └── ticketApi.ts       # Funciones simples para usar en componentes
├── generators/            # Generadores principales
│   └── ticketGenerator.ts # Orquestador de transformación y PDF
├── templates/             # Templates de PDF
│   └── normalTicket.template.ts # Template para ventas normales
├── transformers/          # Transformadores de datos
│   └── normalSale.transformer.ts # Transforma backend → ticket
├── types/                 # Definiciones de tipos
│   ├── backend.types.ts   # Tipos del JSON del backend
│   └── ticket.types.ts    # Tipos optimizados para tickets
├── utils/                 # Utilidades
│   └── ticketHelpers.ts   # Funciones de formateo
└── index.ts              # API principal
```

## Uso Básico

### Importar el sistema

```typescript
import { 
  generateNormalSaleTicket,
  downloadNormalSaleTicket,
  validateNormalSaleData,
  BackendInvoiceData 
} from './tickets';
```

### Generar y descargar ticket

```typescript
// Datos que llegan del backend
const backendData: BackendInvoiceData = {
  // ... estructura completa del JSON del backend
};

// Validar datos antes de generar
const validation = validateNormalSaleData(backendData);
if (!validation.isValid) {
  console.error('Datos inválidos:', validation.errors);
  return;
}

// Generar y descargar ticket
try {
  await downloadNormalSaleTicket(backendData, 'mi-ticket.pdf');
  console.log('Ticket descargado exitosamente');
} catch (error) {
  console.error('Error generando ticket:', error);
}
```

### Generar PDF en memoria

```typescript
// Para obtener el PDF como objeto jsPDF
const pdf = await generateNormalSaleTicket(backendData);

// Para obtener como Blob (útil para enviar por API)
const blob = await generateNormalSaleTicketBlob(backendData);

// Para obtener como base64
const base64 = await generateNormalSaleTicketBase64(backendData);
```

## Tipos de Datos

### BackendInvoiceData
Estructura que llega del backend con todos los datos de la venta:
- Información del documento (serie, número, fecha)
- Items de venta con detalles del producto
- Datos del cliente, empresa y vendedor
- Totales financieros e impuestos

### TicketData
Estructura optimizada para la generación del ticket:
- header: Encabezado con empresa y documento
- passenger_info: Información del pasajero
- trip_details: Detalles del viaje (asiento, nave, ruta)
- financial_breakdown: Desglose financiero detallado
- payment_info: Información de pago
- footer: Pie de página con QR y URL

## Validaciones

El sistema incluye validaciones automáticas:
- Datos requeridos del cliente y empresa
- Items de venta válidos
- Totales coherentes
- Formato de documentos

## Personalización

### Extender para otros tipos de venta

1. Crear nuevo transformer en `transformers/`
2. Crear nuevo template en `templates/`
3. Añadir métodos al `TicketGenerator`
4. Exportar en `index.ts`

### Modificar diseño del ticket

Editar el template correspondiente en `templates/`:
- Ajustar márgenes y espaciado
- Cambiar fonts y tamaños
- Modificar disposición de elementos

## Errores Comunes

### "Datos del cliente requeridos"
Asegurar que `backendData.client` existe y tiene `doc_number`, `doc_type`, y `name`.

### "Items de venta requeridos"
Verificar que `backendData.items` es un array con al menos un elemento.

### "Error al generar PDF"
Revisar que todas las propiedades requeridas estén presentes en el JSON del backend.

## Ejemplo Completo

```typescript
import { downloadNormalSaleTicket, validateNormalSaleData } from './tickets';

async function handleGenerateTicket(invoiceData: any) {
  try {
    // 1. Validar datos
    const validation = validateNormalSaleData(invoiceData);
    if (!validation.isValid) {
      alert(`Error en los datos: ${validation.errors.join(', ')}`);
      return;
    }

    // 2. Generar y descargar
    await downloadNormalSaleTicket(invoiceData);
    
    // 3. Confirmar al usuario
    alert('Ticket generado exitosamente');
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error generando el ticket');
  }
}
```

## Características del PDF

- **Formato**: Térmico 80mm de ancho
- **Orientación**: Vertical (portrait)
- **Altura**: Automática según contenido
- **Fuente**: Helvetica
- **Tamaños**: Variables según sección (5-10pt)
- **Márgenes**: 2mm laterales
- **Divisores**: Líneas de guiones (32 caracteres)

## Dependencias

- `jspdf`: Generación de PDFs
- `date-fns`: Formateo de fechas
- `TypeScript`: Tipado fuerte del sistema
