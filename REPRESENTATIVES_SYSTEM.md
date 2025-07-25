# Sistema de Representantes Empresariales

## Descripción

El sistema de representantes permite que una empresa (con RUC) pueda facturar múltiples pasajes en una sola factura empresarial, agregando representantes/empleados individuales para cada pasaje, manteniendo la integridad del manifiesto de pasajeros.

## Características Implementadas

### ✅ Funcionalidades Principales

1. **Detección Automática de RUC**: El sistema se activa automáticamente cuando se selecciona RUC como tipo de documento
2. **Configuración de Cantidad**: Permite seleccionar cuántos pasajes se quieren facturar (1-50)
3. **Factura Empresarial**: Crea una factura principal con todos los pasajes
4. **Gestión de Representantes**: Permite agregar/eliminar representantes individuales
5. **Validación de Documentos**: Valida DNI, Carné de Extranjería y Pasaportes
6. **Interfaz Intuitiva**: Instrucciones claras y estado visual del progreso

### 🎯 Flujo de Trabajo

1. **Seleccionar RUC** en el formulario de datos del pasajero
2. **Completar datos de la empresa** (RUC, razón social, etc.)
3. **Configurar cantidad de pasajes** usando el selector numérico
4. **Crear factura empresarial** haciendo clic en el botón principal
5. **Agregar representantes** uno por uno con sus datos personales
6. **Finalizar la venta** cuando se hayan agregado todos los representantes

### 📋 Validaciones Implementadas

- **Documentos**: Validación de formato según tipo (DNI: 8 dígitos, etc.)
- **Duplicados**: No permite representantes con el mismo documento en una factura
- **Capacidad**: Controla que no se excedan los pasajes facturados
- **Campos obligatorios**: Nombre y documento son requeridos

## Archivos Creados

### Servicios y Hooks
- `src/services/representantes.service.ts` - API service para representantes
- `src/features/fluvial/hooks/useRepresentantes.ts` - Hook de React para gestión de representantes

### Componentes
- `src/features/fluvial/components/sales-point/representatives/`
  - `RepresentativesManager.tsx` - Componente principal
  - `AddRepresentanteModal.tsx` - Modal para agregar representantes
  - `RepresentantesList.tsx` - Lista de representantes agregados
  - `CompanyInvoiceStatus.tsx` - Estado de la factura empresarial
  - `PassengerQuantitySelector.tsx` - Selector de cantidad de pasajes
  - `RepresentativesInstructions.tsx` - Instrucciones de uso
  - `index.ts` - Archivo de exportaciones

### Utilidades
- `src/utils/validation.ts` - Funciones de validación de documentos

## Modificaciones Realizadas

### SaleForm.tsx
- **Estados agregados**: `createdInvoiceId`, `showRepresentatives`, `maxPassengers`
- **Lógica bifurcada**: `handleConfirmSale()` ahora detecta RUC y maneja dos flujos
- **Nuevas funciones**: `handleCreateCompanyInvoice()` y `handleRegularSale()`
- **UI actualizada**: Nueva sección de representantes y botones adaptativos

### Flujo de Venta
- **RUC sin factura**: Muestra "Crear Factura Empresarial"
- **RUC con factura**: Permite gestionar representantes y "Finalizar Venta"
- **No-RUC**: Flujo normal existente sin cambios

## APIs del Backend Esperadas

El sistema espera estos endpoints en el backend:

```
POST /api/v1/sunat/representantes
GET /api/v1/sunat/representantes/invoice/{invoice_id}
GET /api/v1/sunat/representantes/invoice/{invoice_id}/capacity
DELETE /api/v1/sunat/representantes/{id}
```

## Casos de Uso

### ✅ Caso 1: Empresa con 5 Empleados
1. Selecciona RUC, completa datos de empresa
2. Configura 5 pasajes en el selector
3. Crea factura empresarial
4. Agrega 5 representantes con sus datos
5. Sistema valida que no se exceda el límite
6. Finaliza la venta

### ✅ Caso 2: Venta Individual con RUC
1. Selecciona RUC, completa datos
2. Mantiene 1 pasaje en el selector
3. Crea factura empresarial
4. Agrega 1 representante (puede ser el mismo titular)
5. Finaliza la venta

### ✅ Caso 3: Venta Normal (DNI)
1. Selecciona DNI
2. Flujo normal existente sin cambios
3. No se muestra sección de representantes

## Ventajas del Sistema

1. **Flexibilidad**: Funciona tanto para empresas como individuos con RUC
2. **Compatibilidad**: No afecta el flujo existente para ventas normales
3. **Validación**: Controles estrictos de calidad de datos
4. **UX**: Interfaz clara con instrucciones paso a paso
5. **Escalabilidad**: Fácil agregar más funcionalidades en el futuro

## Próximos Pasos Sugeridos

1. **Testing**: Pruebas exhaustivas con diferentes escenarios
2. **Asientos**: Implementar asignación de asientos por representante
3. **Reportes**: Adaptar reportes para mostrar datos de representantes
4. **Manifiestos**: Integrar representantes en generación de manifiestos
5. **Capacitación**: Entrenar al equipo en el nuevo flujo

## Notas Técnicas

- **Performance**: Los componentes usan React Query para cache eficiente
- **Validación**: Validaciones tanto en frontend como backend esperadas
- **Estado**: Manejo de estado local con hooks de React
- **Errores**: Manejo robusto de errores con toast notifications
- **Responsive**: Interfaz adaptable a diferentes tamaños de pantalla

---

**Implementado por**: Sistema de Representantes v1.0  
**Fecha**: 24 de julio de 2025  
**Compatible con**: SaleForm.tsx existente
