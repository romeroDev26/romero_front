# Sistema de Tickets - Estructura del PDF

## Problema Identificado
El usuario reporta que el PDF del ticket no está bien estructurado. Necesitamos verificar y corregir:

## Checklist de Verificación del PDF

### 1. Estructura General
- [ ] Formato térmico 80mm de ancho
- [ ] Márgenes correctos (2mm)
- [ ] Altura automática que se ajusta al contenido
- [ ] Fuente monoespaciada/helvetica legible

### 2. Bloque 1: Cabecera
- [ ] Logo de empresa (placeholder por ahora)
- [ ] Nombre completo de la empresa
- [ ] RUC correctamente formateado
- [ ] Dirección completa
- [ ] Teléfono de contacto
- [ ] Punto de emisión

### 3. Bloque 2: Tipo de Documento
- [ ] Separador visual con caracteres %
- [ ] Título del documento (BOLETA/FACTURA ELECTRÓNICA)
- [ ] Serie y número del documento
- [ ] Fecha y hora de emisión formateada
- [ ] Nombre del vendedor

### 4. Bloque 3: Información del Pasajero
- [ ] Separador visual
- [ ] Tipo y número de documento del cliente
- [ ] Nombre completo del pasajero

### 5. Bloque 4: Detalles del Viaje
- [ ] Separador visual
- [ ] Título "DATOS DEL VIAJE"
- [ ] Nombre de la embarcación
- [ ] Puerto de origen
- [ ] Puerto de destino
- [ ] Fecha del viaje
- [ ] Hora del viaje (formato 12h)
- [ ] Hora de embarque (formato 12h)
- [ ] **ASIENTO destacado** (si aplica)

### 6. Bloque 5: Desglose Financiero
- [ ] Separador visual
- [ ] Título "DETALLE DE LA VENTA"
- [ ] Items con descripción, cantidad y precio
- [ ] Descuentos individuales (si aplica)

### 7. Bloque 6: Totales
- [ ] Separador visual
- [ ] Subtotal (si aplica)
- [ ] Descuentos totales (si aplica)
- [ ] IGV (si aplica)
- [ ] **TOTAL A PAGAR destacado**

### 8. Bloque 7: Información de Pago
- [ ] Separador visual
- [ ] Monto en palabras
- [ ] Forma de pago

### 9. Bloque 8: Footer y QR
- [ ] Separador visual final
- [ ] Mensaje de agradecimiento
- [ ] URL de consulta SUNAT
- [ ] **Código QR real** (25x25mm)

## Verificaciones Técnicas

### Datos del Backend
- [ ] Campos de fecha/hora correctos
- [ ] Formateo de números con 2 decimales
- [ ] Textos sin caracteres especiales problemáticos
- [ ] QR code data válido

### Rendering del PDF
- [ ] Sin solapamiento de texto
- [ ] Espaciado consistente
- [ ] Saltos de línea apropiados
- [ ] Caracteres especiales (tildes, ñ) se renderizan bien

### Funcionalidades del Modal
- [ ] Vista previa se carga inmediatamente
- [ ] PDF se muestra correctamente en iframe
- [ ] Descarga funciona
- [ ] Impresión funciona
- [ ] URLs de blob se liberan correctamente

## Problemas Comunes a Verificar

1. **Asiento no destacado**: ¿El número de asiento está en un recuadro visible?
2. **Fechas mal formateadas**: ¿Las horas están en formato 12h (AM/PM)?
3. **Separadores rotos**: ¿Los caracteres % y separadores se ven bien?
4. **QR code faltante**: ¿El código QR se genera correctamente?
5. **Texto cortado**: ¿Todo el contenido cabe en el ancho del ticket?
6. **Logo placeholder**: ¿Se muestra "[LOGO EMPRESA]" hasta tener el logo real?

## Próximos Pasos

1. Probar el modal actualizado
2. Identificar problemas específicos en el PDF
3. Corregir el template según los hallazgos
4. Ajustar el formateo de datos si es necesario
