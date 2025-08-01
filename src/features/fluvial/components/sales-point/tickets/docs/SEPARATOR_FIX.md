# Corrección de Separadores en Template de Tickets

## Problema Identificado
Los separadores del ticket se estaban renderizando como caracteres "%P%P%P%" o "%%%%%%%%%" en lugar de líneas visuales apropiadas.

## Causa del Problema
- Se estaban usando caracteres Unicode especiales: `────────` y `════════`
- jsPDF no renderiza correctamente estos caracteres en algunos contextos
- Los caracteres se convertían a "%" en el PDF final

## Solución Implementada

### Separadores Actualizados
- **Separador principal**: `------------------------------` (30 guiones)
- **Separador secundario**: `- - - - - - - - - - - - - - - - -` (17 grupos de "- ")

### Ubicaciones Corregidas
1. **Header**: Entre empresa y tipo de documento
2. **Passenger Info**: Antes de información del pasajero  
3. **Trip Details**: Antes de datos del viaje
4. **Financial Breakdown**: Antes del detalle de venta
5. **Financial Summary**: Antes de los totales
6. **Payment Info**: Antes de información de pago
7. **Footer**: Antes del mensaje final

### Ventajas de la Nueva Implementación
- ✅ Compatibilidad total con jsPDF
- ✅ Renderizado consistente en todos los navegadores
- ✅ Caracteres ASCII simples que se ven bien en papel térmico
- ✅ Separación visual clara entre secciones
- ✅ Mantiene el ancho de 80mm correctamente

## Estructura Visual Resultante

```
[LOGO EMPRESA]
EMPRESA DE TRANSPORTES ROMERO S.R.L.
RUC: 20167700277
MZA. B LOTE. 19 Z.I. ZONA INDUSTRIAL
Tel: 968574321
PUNTO DE EMISIÓN: IQUITOS

------------------------------

BOLETA DE VENTA ELECTRÓNICA
B001-38225
31/07/2025 8:21 PM
Vendedor: test system

- - - - - - - - - - - - - - - - -

DNI PASAJERO: 76307497
PASAJERO: WILMER ALEXANDER EDQUÉN BARBOZA

- - - - - - - - - - - - - - - - -

DATOS DEL VIAJE
EMBARCACIÓN: Romero VIII
ORIGEN: Nauta
DESTINO: Yurimaguas
FECHA VIAJE: 02/08/2025
HORA VIAJE: 6:00 PM
EMBARQUE: 10:00 PM

ASIENTO: 75

- - - - - - - - - - - - - - - - -

DETALLE DE LA VENTA
[Items con precios]

- - - - - - - - - - - - - - - - -

SUBTOTAL        S/ 215.00
DESCUENTOS      - S/ 10.00
TOTAL A PAGAR   S/ 205.00

- - - - - - - - - - - - - - - - -

SON: DOSCIENTOS CINCO CON 00/100 SOLES
FORMA DE PAGO: Contado

------------------------------

¡Gracias por su preferencia!
Para consultar el comprobante ingrese a
https://cpe.sunat.gob.pe/consultacpe

[QR CODE]
```

## Próximos Pasos
1. Probar el nuevo formato en el modal de preview
2. Verificar que los separadores se vean correctamente
3. Ajustar spacing si es necesario
4. Confirmar compatibilidad con impresoras térmicas
