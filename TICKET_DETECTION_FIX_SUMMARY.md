# Corrección de Detección Automática de Tipos de Tickets

## Problema Identificado
El sistema de detección automática estaba clasificando incorrectamente las ventas de pasajes como encomiendas, causando el error:
```
Error: Los datos no corresponden a una factura de encomiendas
```

## Causa Raíz
La función `isCargoInvoice()` en `ticketHelpers.ts` tenía criterios demasiado amplios:
- Incluía unidades `'ZZ'` y `'NIU'` que también se usan para servicios de pasajeros
- Los criterios no eran lo suficientemente específicos para distinguir entre encomiendas y pasajes

## Solución Implementada

### 1. Refinamiento de Criterios de Detección
**Archivo:** `src/features/fluvial/components/sales-point/tickets/utils/ticketHelpers.ts`

- **Criterio 1 (Principal):** Verificar `recipient_name` en items - es el más confiable
- **Criterio 2:** Palabras clave específicas de encomienda:
  - `'encomienda'`, `'paquete'`, `'envío de carga'`, `'servicio de carga'`, `'transporte de mercancía'`, `'flete'`
- **Criterio 3:** Unidades específicas de carga (eliminado `'ZZ'` y `'NIU'`):
  - Solo: `['PAQ', 'XBX', 'KGM', 'TNE', 'MTR', 'MTQ', 'LTR']`
- **Criterio 4:** Palabras clave específicas en notas del comprobante

### 2. Flujo de Detección Automática
**Archivo:** `src/features/fluvial/components/sales-point/tickets/generators/ticketGenerator.ts`

El orden de detección es:
1. **Encomienda/Cargo** → `CargoSaleTransformer` + `CargoTicketTemplate`
2. **Empresa (RUC)** → `CompanySaleTransformer` + `CompanyTicketTemplate`
3. **Embarcación sin asientos** → `NoSeatsTicketGenerator`
4. **Ticket normal con asientos** → `NormalSaleTransformer` + `NormalTicketTemplate`

## Resultados
- ✅ Las ventas de pasajes ya no se detectan incorrectamente como encomiendas
- ✅ La detección automática funciona correctamente para todos los tipos
- ✅ No hay errores de compilación
- ✅ Se mantiene la funcionalidad existente para encomiendas reales

## Archivos Modificados
1. `src/features/fluvial/components/sales-point/tickets/utils/ticketHelpers.ts`
2. `src/features/fluvial/components/sales-point/tickets/generators/ticketGenerator.ts`

## Pruebas Realizadas
- ✅ Detección de pasajes normales con asientos
- ✅ No clasificación errónea como encomienda
- ✅ Sistema de logs funcional (removido después de pruebas)
- ✅ Compilación sin errores

## Notas Técnicas
- Se removieron las unidades `'ZZ'` y `'NIU'` del criterio de detección de encomiendas
- Los criterios ahora requieren indicadores explícitos de encomienda
- Se mantiene compatibilidad con todos los tipos de ticket existentes
