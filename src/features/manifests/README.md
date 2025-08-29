# Sistema de Manifiestos - Documentación

## Descripción General

El sistema de manifiestos ha sido actualizado para generar PDFs con el nuevo formato solicitado, que incluye:

1. **Header con información de la empresa**: Logo, nombre, RUC, dirección y teléfono
2. **Título del manifiesto**: "MANIFIESTO DE PASAJEROS" con número de manifiesto
3. **Tabla de pasajeros** con los campos específicos: N°, APELLIDOS Y NOMBRES, N° IDENTIDAD, VENDEDOR, ASIENTO, ORIGEN, DESTINO, TELÉFONO

## Estructura de Datos

### Nueva Interface `Manifest`

```typescript
interface Manifest {
  id: number;
  trip_id: number;
  manifest_number: string;
  generation_date: string;
  generated_by: string;
  printed_at?: string | null;
  printed_by?: string | null;
  status: "DRAFT" | "GENERATED" | "PRINTED" | "CANCELLED";
  total_passengers: number;
  total_cargo_weight_kg: number;
  observations?: string | null;
  pdf_file_path?: string | null;
  created_at: string;
  updated_at: string;
  manifest_type: "PASSENGER" | "CARGO";
  departure_datetime?: string;
  trip_status?: string;
  route_name?: string;
  vessel_name?: string;
  generated_by_name?: string;
  company?: Company;
  items: ManifestItem[];
}
```

### Interface `ManifestItem`

```typescript
interface ManifestItem {
  item_order: number;
  item_type: "PASSENGER" | "CARGO";
  seat_assignment_id: number;
  passenger_name: string;
  passenger_doc_type: string;
  passenger_doc_number: string;
  boarding_port_name: string;
  disembarking_port_name: string;
  seat_type_name: string;
  seat_number: string | null;
  special_notes?: string | null;
}
```

### Interface `Company`

```typescript
interface Company {
  id: number;
  name: string;
  ruc: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string;
}
```

## Componentes Actualizados

### 1. ManifestPDFGenerator

Genera PDFs con el nuevo formato solicitado.

**Uso:**

```tsx
import { ManifestPDFGenerator } from "../components/ManifestPDFGenerator";

<ManifestPDFGenerator manifestData={manifestData} />;
```

**Características:**

- Header con información de la empresa
- Logo de la empresa (si está disponible en `company.logo_url`)
- Tabla con campos específicos requeridos
- Formato A4 optimizado para impresión

### 2. ManifestPreviewModal

Modal de previsualización con vista previa HTML y generación de PDF.

**Uso:**

```tsx
import { ManifestPreviewModal } from "../components/ManifestPreviewModal";

<ManifestPreviewModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  manifestData={manifestData}
/>;
```

**Características:**

- Vista previa HTML que coincide con el PDF
- Botones para imprimir, descargar y guardar PDF
- Subida automática del PDF al backend
- Manejo de errores

### 3. ManifestDetails

Componente para mostrar detalles completos del manifiesto.

**Uso:**

```tsx
import ManifestDetails from "../components/ManifestDetails";

<ManifestDetails manifest={manifest} onClose={() => setShowDetails(false)} />;
```

**Características:**

- Vista detallada de la información del manifiesto
- Tabla adaptativa según el tipo (PASSENGER/CARGO)
- Información del viaje y empresa
- Botón de descarga de PDF

## API Integration

### Estructura de Respuesta Esperada

El backend debe devolver manifiestos con la siguiente estructura (basada en `API.md`):

```json
{
  "id": 17,
  "trip_id": 200,
  "manifest_number": "MP00000005",
  "generation_date": "2025-08-06 16:54:33",
  "generated_by": "fb408cb6-9b5e-443e-840c-072a9f825a0f",
  "status": "GENERATED",
  "total_passengers": 26,
  "total_cargo_weight_kg": 0.0,
  "manifest_type": "PASSENGER",
  "departure_datetime": "2025-08-04 14:00:00",
  "route_name": "Nauta - Yurimaguas",
  "vessel_name": "Romero XV",
  "generated_by_name": "test system",
  "company": {
    "id": 1,
    "name": "EMPRESA DE TRANSPORTES ROMERO S.R.L.",
    "ruc": "20167700277",
    "address": "MZA. B LOTE. 19 Z.I. ZONA INDUSTRIAL (TALARA ALTA) PIURA - TALARA - PARIÑAS",
    "phone": "968574321",
    "email": "romero@example.com.pe",
    "logo_url": "https://romero-cdn.b-cdn.net/1/2025/07/logos/logo_romero.png"
  },
  "items": [
    {
      "item_order": 1,
      "item_type": "PASSENGER",
      "seat_assignment_id": 292,
      "passenger_name": "Juan Pérez",
      "passenger_doc_type": "1",
      "passenger_doc_number": "12345678",
      "boarding_port_name": "Nauta",
      "disembarking_port_name": "Yurimaguas",
      "seat_type_name": "Estáticos",
      "seat_number": "A01",
      "special_notes": null
    }
  ]
}
```

### Servicios

Los servicios en `manifest.service.ts` están configurados para trabajar con las nuevas interfaces:

- `getManifests()`: Obtiene lista de manifiestos
- `getManifestById(id)`: Obtiene manifiesto específico
- `createManifest(data)`: Crea nuevo manifiesto
- `uploadManifestPDF(id, file, type)`: Sube PDF generado
- `generateManifestPDF(id)`: Genera PDF desde el backend

## Configuración del PDF

### Campos de la Tabla

La tabla del PDF incluye los siguientes campos en este orden:

1. **N°**: Número secuencial
2. **APELLIDOS Y NOMBRES**: `passenger_name`
3. **DOC DE IDENT**: Tipo de documento + número (`passenger_doc_type` + `passenger_doc_number`)
4. **NACIONALIDAD**: Nombre o código de país (`passenger_country_name` o `passenger_country_code`)
5. **VENDEDOR**: Primer nombre del generador (`generated_by_name`)
6. **ASIENTO**: Número de asiento (`seat_number`)
7. **ORIGEN**: Puerto de embarque (`boarding_port_name`)
8. **DESTINO**: Puerto de desembarque (`disembarking_port_name`)
9. **TELÉFONO**: Por implementar (actualmente "N/A")

### Formato del Header

El header incluye:

- Logo de la empresa (si está disponible)
- Nombre de la empresa
- RUC
- Dirección completa
- Teléfono
- Línea separadora
- Título "MANIFIESTO DE PASAJEROS"
- Número de manifiesto

## Pendientes y TODOs

1. **Logo de la empresa**: Implementar carga de imagen desde URL al PDF
2. **Teléfono del pasajero**: Agregar cuando esté disponible en la API
3. **Información adicional del vendedor**: Expandir información cuando esté disponible
4. **Optimización del PDF**: Manejo de páginas múltiples si hay muchos pasajeros
5. **Validación de datos**: Verificar que todos los campos requeridos estén presentes

## Migración desde Versión Anterior

Si tienes componentes usando la estructura anterior con `passengers` y `cargo_items`, actualiza para usar:

- `manifest.items` en lugar de `manifest.passengers` o `manifest.cargo_items`
- `manifest.vessel_name` en lugar de `manifest.trip.vessel.name`
- `manifest.route_name` en lugar de `manifest.trip.route.name`
- `manifest.departure_datetime` en lugar de `manifest.trip.departure_date`

## Ejemplo de Uso Completo

```tsx
import React, { useState } from "react";
import { ManifestPreviewModal } from "../components/ManifestPreviewModal";
import { Manifest } from "../types/manifest.types";

export const MyComponent: React.FC = () => {
  const [showPreview, setShowPreview] = useState(false);
  const [manifestData, setManifestData] = useState<Manifest | null>(null);

  const handleShowManifest = (manifest: Manifest) => {
    setManifestData(manifest);
    setShowPreview(true);
  };

  return (
    <div>
      {/* Tu contenido aquí */}

      {showPreview && manifestData && (
        <ManifestPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          manifestData={manifestData}
        />
      )}
    </div>
  );
};
```
