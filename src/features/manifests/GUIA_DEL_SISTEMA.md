# Guía del Sistema — Resumen funcional

Fecha: 15 de agosto de 2025

Breve: Guía orientada al cliente que resume qué hace la plataforma, los módulos disponibles, las funciones relevantes para el negocio, los flujos críticos, integraciones y pasos recomendados. Incluye estimaciones aproximadas en soles peruanos (PEN) basadas en lo ya implementado.

---

## 1. Resumen ejecutivo

Plataforma para la gestión comercial y logística orientada a transporte fluvial y terrestre. Permite administrar sucursales, series y documentos electrónicos (facturas, boletas, notas y guías de remisión transportista), operar punto de venta, gestionar viajes/encomiendas, generar PDFs y comunicarse con SUNAT para el envío y seguimiento de comprobantes.

---

## 2. Guía por módulos (descripción + coste estimado)

Notas sobre estimaciones: los valores son aproximados y expresados en soles (PEN). Incluyen análisis corto, ajustes menores y pruebas básicas. No incluyen costes de infraestructura externa (certificados digitales, ambientes SUNAT, hosting) ni integraciones específicas adicionales.

- Tasa de referencia usada para cálculo: estimaciones por módulo en función del alcance actual implementado en el frontend.

### Módulo: Dashboard / Panel
- Qué incluye: vistas resumen, métricas y accesos rápidos.
- Estado: Implementado (básico).
- Estimación: S/. 1,200 – S/. 2,000
- Justificación: desarrollo UI y algunos endpoints de resumen.

### Módulo: Sucursales y Puertos
- Qué incluye: crear/editar sucursales, asignación a puertos, datos de contacto.
- Estado: Implementado.
- Estimación: S/. 800 – S/. 1,500

### Módulo: Series de documentos
- Qué incluye: crear series por sucursal, control de numeración, validaciones.
- Estado: Implementado.
- Estimación: S/. 600 – S/. 1,000

### Módulo: Punto de venta / Ventas
- Qué incluye: flujo de venta, resumen de impuestos, emisión de tickets y facturas.
- Estado: Implementado (funcionalidades principales).
- Estimación: S/. 2,500 – S/. 4,000

### Módulo: Cotizaciones
- Qué incluye: creación y conversión a venta.
- Estado: Implementado.
- Estimación: S/. 800 – S/. 1,200

### Módulo: Guías de remisión (GRE)
- Qué incluye: creación de guías transportista, carga de ítems desde encomiendas, validaciones, envío a SUNAT y seguimiento de estados.
- Estado: Implementado (flujo completo en frontend + hooks/servicios).
- Estimación: S/. 3,000 – S/. 5,000
- Notas: crítico para operación logística; pruebas con SUNAT y firma digital pueden aumentar coste.

### Módulo: Viajes / Embarcaciones
- Qué incluye: gestión de viajes, detalles de embarcaciones y asociación de encomiendas.
- Estado: Implementado.
- Estimación: S/. 1,000 – S/. 1,800

### Módulo: Inventario y Productos/Servicios
- Qué incluye: catálogo de ítems, códigos, unidades y tarifas.
- Estado: Implementado (básico/medio).
- Estimación: S/. 1,500 – S/. 2,500

### Módulo: Contabilidad / Documentos electrónicos
- Qué incluye: emisión de facturas/boletas, notas, integración con servicios contables y tipos documentales.
- Estado: Implementado (integración básica y emisión desde UI).
- Estimación: S/. 1,200 – S/. 2,000

### Módulo: Usuarios y Roles
- Qué incluye: administración de usuarios, asignación de roles y permisos básicos.
- Estado: Implementado (funciones básicas).
- Estimación: S/. 600 – S/. 1,000

### Integraciones: SUNAT, PDF, Almacenamiento
- Qué incluye: generación de XML, firma, envío a SUNAT, generación de PDF y almacenamiento de CDR/XML/PDF.
- Estado: Implementado (servicios y plantillas básicos).
- Estimación: S/. 1,500 – S/. 3,000

### QA, Pruebas y Automatización
- Qué incluye: pruebas E2E/Smoke/Unit mínimas y correcciones detectadas.
- Estimación: S/. 1,500 – S/. 3,000

### Deployment, certificados y soporte inicial
- Qué incluye: preparación de despliegue, configuración de certificados de firma (si aplica) y soporte inicial.
- Estimación: S/. 800 – S/. 1,500

---

## 3. Resumen económico aproximado (suma de rangos)

- Coste mínimo aproximado: S/. 17,000
- Coste máximo aproximado: S/. 29,500

> Nota: estos totales suman estimaciones por módulo. Dependiendo del alcance real, pruebas adicionales y complejidad del backend/SUNAT, el coste final puede variar.

---

## 4. Flujos críticos (resumidos)

- Crear una serie:
  1. Ir a Configuración → Series.
  2. Seleccionar tipo de documento, sucursal y código de serie (ej. T001).
  3. Definir número inicial y si es electrónica.
  4. Guardar — serie disponible para emisión.

- Crear Guía de Remisión (Transportista):
  1. Seleccionar viaje o encomienda.
  2. Cargar ítems desde encomiendas (autocompletado cuando corresponde).
  3. Completar conductor, fechas, peso y direcciones de origen/destino.
  4. Generar guía (se crea en backend y queda en estado inicial).
  5. Enviar a SUNAT (opción en UI) → consultar ticket → procesar CDR.

---

## 5. Riesgos y notas importantes

- Certificados de firma digital: comprobar validez y entorno (prueba / producción).
- Confirmar con TI del cliente el código oficial a usar para cada tipo documental (ya se estandarizó `31` para guías transportista).
- Política de retención de archivos (XML/CDR) y backups.
- Coordinar pruebas con SUNAT en ambientes de sandbox antes de producción.

---

## 6. Próximos pasos recomendados

1. Validar alcance y confirmar módulos que se deberán adaptar o ampliar.
2. Realizar demo dirigida al cliente (recorrer 3 casos: crear serie, venta y crear+enviar guía).
3. Ejecutar plan UAT y checklist de migración (si aplica).
4. Preparar cotización formal con desglose por módulos y plazos.

---

## 7. Mensaje corto para el cliente

> "La plataforma gestiona todo el ciclo de documentación electrónica y operaciones logísticas: administración de sucursales y series, emisión de facturas/tickets y guías de remisión transportista, integración con SUNAT para envío y procesamiento del CDR, y generación de PDFs y reportes. Está preparada para operar desde puntos de venta y administrar viajes/encomiendas con trazabilidad completa."

---

Si quieres, genero la cotización formal en PDF con fechas estimadas por módulo o preparo el guion para la demo; dime cuál prefieres y lo dejo listo.
