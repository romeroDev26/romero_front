# Enfoque de Cotizaciones Dinámicas - Transportes Romero

## Objetivo
Implementar un sistema de cotización flexible y ágil, que permita a los vendedores cotizar servicios de pasajeros, encomiendas y carga, adaptándose a cualquier requerimiento del cliente, con estructura libre y automatización de cálculos.

---

## 1. Búsqueda y Selección de Cliente
- **Consulta dinámica de documento de identidad:**
  - Permitir buscar clientes por DNI o RUC.
  - Si el cliente no existe, permitir crear uno rápidamente desde el formulario.
  - Mostrar datos básicos: nombre, documento, dirección, teléfono.

---

## 2. Selección de Servicio
- **Servicios disponibles:**
  - Transporte de pasajeros
  - Transporte de encomiendas
  - Transporte de carga
- El vendedor selecciona el servicio a cotizar.
- Según el servicio, se pueden mostrar campos sugeridos (ejemplo: tipo de asiento, embarcación, ruta, tipo de carga, unidad, etc.), pero siempre permitiendo edición libre.

---

## 3. Estructura del Item de Cotización
- **Campos principales:**
  - Cantidad
  - Unidad (Und, KGM, etc.)
  - Descripción libre (editable)
  - Precio unitario (editable)
  - Descuento (opcional)
  - Importe total (calculado automáticamente)
- **Ejemplo de estructura:**

```typescript
{
  cantidad: number,
  unidad: string,
  descripcion: string,
  precio_unitario: number,
  descuento: number,
  importe_total: number
}
```

---

## 4. Flujo de Cotización
1. Buscar o crear cliente por DNI/RUC.
2. Seleccionar servicio a cotizar.
3. Agregar uno o varios items:
   - Completar cantidad, unidad, descripción y precio unitario.
   - El sistema calcula el total automáticamente.
4. Agregar observaciones y condiciones (ejemplo: días de salida, horarios, requisitos, etc.).
5. Mostrar resumen de cotización, incluyendo datos bancarios para pago.
6. Guardar y enviar cotización.

---

## 5. Ejemplo Visual (Basado en la imagen)
- **Encabezado:** Datos de empresa y cliente.
- **Tabla de cotización:**
  - Cantidad | Unidad | Descripción | Descuento | Precio Unitario | Importe Total
- **Observaciones:** Campo libre para detalles adicionales.
- **Datos bancarios:** Tabla con cuentas y CCI.

---

## 6. Ventajas del Enfoque
- Flexibilidad total para el vendedor.
- Cotizaciones rápidas y personalizadas.
- Automatización de cálculos.
- Adaptable a cualquier tipo de servicio.
- Escalable para agregar más estructura en el futuro.

---

## 7. Siguientes pasos técnicos
- Crear componente de búsqueda dinámica de clientes por DNI/RUC.
- Implementar formulario de cotización con estructura libre y campos automáticos.
- Permitir edición libre de descripción y precio unitario.
- Automatizar cálculo de totales y descuentos.
- Integrar datos bancarios y observaciones en el resumen final.

---

## 8. Generación de PDF de la Cotización
- El sistema debe permitir generar un PDF de la cotización con el formato visual acordado.
- El PDF debe incluir:
  - Encabezado con datos de empresa y cliente
  - Tabla de cotización (cantidad, unidad, descripción, descuento, precio unitario, importe total)
  - Observaciones y condiciones
  - **Tabla de cuentas bancarias para depósito** al final, como en el ejemplo visual
- La generación del PDF se realizará **en base a la respuesta del backend** al registrar la cotización.
  - El backend devolverá los datos necesarios: logo, información de la empresa, número de serie, datos del cliente, items cotizados, observaciones y cuentas bancarias.
  - El frontend usará esta respuesta para construir el PDF con todos los datos oficiales y visuales requeridos.
- El PDF debe ser descargable y enviable al cliente.
