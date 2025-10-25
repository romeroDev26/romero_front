# Ejemplo Visual - Tabla de Representantes en PDF A4

## 📄 Venta Empresarial con 3 Representantes (CON Asientos)

### Datos de Entrada
```json
{
  "invoice": {
    "client": {
      "doc_type": "6",
      "doc_number": "10763074973",
      "name": "EDQUÉN BARBOZA WILMER ALEXANDER"
    }
  },
  "representatives": [
    {
      "id": 103,
      "passenger_name": "REYES QUILICHE SARA",
      "passenger_doc_type": "1",
      "passenger_doc_number": "76307407",
      "seat_number": "3"
    },
    {
      "id": 104,
      "passenger_name": "GARCÍA LÓPEZ JUAN CARLOS",
      "passenger_doc_type": "1",
      "passenger_doc_number": "12345678",
      "seat_number": "5"
    },
    {
      "id": 105,
      "passenger_name": "MARTÍNEZ ROJAS MARÍA ELENA",
      "passenger_doc_type": "7",
      "passenger_doc_number": "A1234567",
      "seat_number": "7"
    }
  ]
}
```

### Resultado en PDF A4

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [LOGO]                        GLOBAL ROMERO S.A.C.                        │
│                                RUC: 20602423248                             │
│                                JR. LIMA MZA. 30 LOTE. 12...                 │
│                                978168331 / 988977363                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────┐  ┌──────────────────────────────┐│
│  │ CLIENTE:                            │  │      FACTURA ELECTRÓNICA     ││
│  │ EDQUÉN BARBOZA WILMER ALEXANDER     │  │                              ││
│  │ RUC: 10763074973                    │  │        F004-00011            ││
│  └─────────────────────────────────────┘  │  Emisión: 25/10/2025 14:30  ││
│                                            └──────────────────────────────┘│
│  Vendedor: Wilmer Edquen                                                   │
│  FORMA DE PAGO: EFECTIVO                                                   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PASAJEROS QUE VIAJAN (3)                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ #  │ NOMBRE                   │ DOCUMENTO      │ ASIENTO            │ │
│  ├────┼──────────────────────────┼────────────────┼────────────────────┤ │
│  │ 1  │ REYES QUILICHE SARA      │ DNI: 76307407  │    3               │ │
│  ├────┼──────────────────────────┼────────────────┼────────────────────┤ │
│  │ 2  │ GARCÍA LÓPEZ JUAN CARLOS │ DNI: 12345678  │    5               │ │
│  ├────┼──────────────────────────┼────────────────┼────────────────────┤ │
│  │ 3  │ MARTÍNEZ ROJAS MARÍA...  │ Pasaporte: A.. │    7               │ │
│  └────┴──────────────────────────┴────────────────┴────────────────────┘ │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DETALLE DE LA VENTA                                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ DESCRIPCIÓN               │ CANT │ UNID │ P. UNIT.    │ TOTAL        │ │
│  ├───────────────────────────┼──────┼──────┼─────────────┼──────────────┤ │
│  │ Servicio de Transporte de │      │      │             │              │ │
│  │ Pasajeros                 │  3   │ NIU  │ S/ 80.00    │ S/ 240.00    │ │
│  │ Ruta: NAUTA - TROMPETEROS │      │      │             │              │ │
│  │ Fecha: 25/10/2025         │      │      │             │              │ │
│  └───────────────────────────┴──────┴──────┴─────────────┴──────────────┘ │
│                                                                             │
│  SON: DOSCIENTOS CUARENTA          EXONERADA    S/ 240.00                 │
│       CON 00/100 SOLES             ┌─────────────────────┐                │
│                                    │ TOTAL    S/ 240.00  │                │
│                                    └─────────────────────┘                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [QR CODE]                         Bienes y servicios transferidos...      │
│  Representación                    Comprobante generado con S.E.G.R.E.     │
│  impresa de la                                                             │
│  factura electrónica                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📄 Venta Empresarial con 5 Representantes (SIN Asientos)

### Datos de Entrada
```json
{
  "invoice": {
    "client": {
      "doc_type": "6",
      "doc_number": "20123456789",
      "name": "TRANSPORTES AMAZÓNICOS S.A.C."
    }
  },
  "representatives": [
    {
      "id": 201,
      "passenger_name": "LÓPEZ VEGA CARLOS ALBERTO",
      "passenger_doc_type": "1",
      "passenger_doc_number": "11223344",
      "seat_number": "Elección libre"
    },
    {
      "id": 202,
      "passenger_name": "TORRES DÍAZ ANA MARÍA",
      "passenger_doc_type": "1",
      "passenger_doc_number": "55667788",
      "seat_number": "Elección libre"
    },
    {
      "id": 203,
      "passenger_name": "RAMÍREZ CASTILLO PEDRO JOSÉ",
      "passenger_doc_type": "1",
      "passenger_doc_number": "99887766",
      "seat_number": "Elección libre"
    },
    {
      "id": 204,
      "passenger_name": "SILVA MENDOZA ROSA ELENA",
      "passenger_doc_type": "4",
      "passenger_doc_number": "000123456",
      "seat_number": "Elección libre"
    },
    {
      "id": 205,
      "passenger_name": "CHÁVEZ PAREDES LUIS FERNANDO",
      "passenger_doc_type": "1",
      "passenger_doc_number": "44332211",
      "seat_number": "Elección libre"
    }
  ]
}
```

### Resultado en PDF A4

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [LOGO]                        GLOBAL ROMERO S.A.C.                        │
│                                RUC: 20602423248                             │
│                                JR. LIMA MZA. 30 LOTE. 12...                 │
│                                978168331 / 988977363                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────┐  ┌──────────────────────────────┐│
│  │ CLIENTE:                            │  │      FACTURA ELECTRÓNICA     ││
│  │ TRANSPORTES AMAZÓNICOS S.A.C.       │  │                              ││
│  │ RUC: 20123456789                    │  │        F004-00012            ││
│  └─────────────────────────────────────┘  │  Emisión: 25/10/2025 15:45  ││
│                                            └──────────────────────────────┘│
│  Vendedor: Wilmer Edquen                                                   │
│  FORMA DE PAGO: EFECTIVO                                                   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PASAJEROS QUE VIAJAN (5)                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ #  │ NOMBRE                   │ DOCUMENTO         │ ASIENTO         │ │
│  ├────┼──────────────────────────┼───────────────────┼─────────────────┤ │
│  │ 1  │ LÓPEZ VEGA CARLOS ALBERTO│ DNI: 11223344     │ Elección libre  │ │
│  ├────┼──────────────────────────┼───────────────────┼─────────────────┤ │
│  │ 2  │ TORRES DÍAZ ANA MARÍA    │ DNI: 55667788     │ Elección libre  │ │
│  ├────┼──────────────────────────┼───────────────────┼─────────────────┤ │
│  │ 3  │ RAMÍREZ CASTILLO PEDRO...│ DNI: 99887766     │ Elección libre  │ │
│  ├────┼──────────────────────────┼───────────────────┼─────────────────┤ │
│  │ 4  │ SILVA MENDOZA ROSA ELENA │ Carnet Ext.: 000..│ Elección libre  │ │
│  ├────┼──────────────────────────┼───────────────────┼─────────────────┤ │
│  │ 5  │ CHÁVEZ PAREDES LUIS FE...│ DNI: 44332211     │ Elección libre  │ │
│  └────┴──────────────────────────┴───────────────────┴─────────────────┘ │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DETALLE DE LA VENTA                                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ DESCRIPCIÓN               │ CANT │ UNID │ P. UNIT.    │ TOTAL        │ │
│  ├───────────────────────────┼──────┼──────┼─────────────┼──────────────┤ │
│  │ Servicio de Transporte de │      │      │             │              │ │
│  │ Pasajeros                 │  5   │ NIU  │ S/ 60.00    │ S/ 300.00    │ │
│  │ Ruta: NAUTA - LIBERTAD    │      │      │             │              │ │
│  │ Fecha: 25/10/2025         │      │      │             │              │ │
│  └───────────────────────────┴──────┴──────┴─────────────┴──────────────┘ │
│                                                                             │
│  SON: TRESCIENTOS                  EXONERADA    S/ 300.00                 │
│       CON 00/100 SOLES             ┌─────────────────────┐                │
│                                    │ TOTAL    S/ 300.00  │                │
│                                    └─────────────────────┘                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [QR CODE]                         Bienes y servicios transferidos...      │
│  Representación                    Comprobante generado con S.E.G.R.E.     │
│  impresa de la                                                             │
│  factura electrónica                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📄 Venta Normal (SIN Representantes)

### Datos de Entrada
```json
{
  "invoice": {
    "client": {
      "doc_type": "1",
      "doc_number": "76307407",
      "name": "REYES QUILICHE SARA"
    }
  },
  "representatives": undefined
}
```

### Resultado en PDF A4

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [LOGO]                        GLOBAL ROMERO S.A.C.                        │
│                                RUC: 20602423248                             │
│                                JR. LIMA MZA. 30 LOTE. 12...                 │
│                                978168331 / 988977363                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────┐  ┌──────────────────────────────┐│
│  │ CLIENTE:                            │  │      BOLETA ELECTRÓNICA      ││
│  │ REYES QUILICHE SARA                 │  │                              ││
│  │ DNI: 76307407                       │  │        B004-00123            ││
│  └─────────────────────────────────────┘  │  Emisión: 25/10/2025 16:20  ││
│                                            └──────────────────────────────┘│
│  Vendedor: Wilmer Edquen                                                   │
│  FORMA DE PAGO: EFECTIVO                                                   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ⚠️ NOTA: NO se muestra tabla de representantes (venta individual)        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DETALLE DE LA VENTA                                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ DESCRIPCIÓN               │ CANT │ UNID │ P. UNIT.    │ TOTAL        │ │
│  ├───────────────────────────┼──────┼──────┼─────────────┼──────────────┤ │
│  │ Servicio de Transporte de │      │      │             │              │ │
│  │ Pasajeros                 │  1   │ NIU  │ S/ 80.00    │ S/ 80.00     │ │
│  │ Ruta: NAUTA - TROMPETEROS │      │      │             │              │ │
│  │ Asiento: 3                │      │      │             │              │ │
│  └───────────────────────────┴──────┴──────┴─────────────┴──────────────┘ │
│                                                                             │
│  SON: OCHENTA CON 00/100 SOLES     EXONERADA    S/ 80.00                  │
│                                    ┌─────────────────────┐                │
│                                    │ TOTAL    S/ 80.00   │                │
│                                    └─────────────────────┘                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [QR CODE]                         Bienes y servicios transferidos...      │
│  Representación                    Comprobante generado con S.E.G.R.E.     │
│  impresa de la                                                             │
│  boleta electrónica                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Comparación Visual

### Diferencias Clave

| Aspecto | Venta Empresa (CON Rep.) | Venta Empresa (SIN Asientos) | Venta Normal |
|---------|-------------------------|------------------------------|--------------|
| **Tabla de Representantes** | ✅ Sí, con asientos | ✅ Sí, "Elección libre" | ❌ No se muestra |
| **Espacio ocupado** | ~44mm (3 reps) | ~58mm (5 reps) | 0mm |
| **Info en Items** | Servicio general | Servicio general | Con detalle asiento |
| **Tipo documento** | Factura (RUC) | Factura (RUC) | Boleta (DNI) |

### Altura Total del Documento

**Venta Normal:** ~210mm  
**Venta Empresa (3 rep.):** ~254mm (+44mm)  
**Venta Empresa (5 rep.):** ~268mm (+58mm)  

**Nota:** Página A4 es de 297mm, por lo que hay espacio suficiente hasta ~15 representantes.

---

## 🎨 Detalles de Estilo

### Colores Usados
- **Fondo encabezado tabla:** RGB(240, 240, 240) - Gris muy claro
- **Líneas tabla:** RGB(200, 200, 200) - Gris medio
- **Separadores filas:** RGB(220, 220, 220) - Gris claro

### Tipografía
- **Título sección:** Helvetica Bold, 10pt
- **Encabezados columna:** Helvetica Bold, 9pt
- **Datos:** Helvetica Normal, 8pt

### Espaciado
- **Después título:** 6mm
- **Altura encabezado:** 8mm
- **Altura fila:** 6mm
- **Separador fila:** 1mm
- **Después tabla:** 5mm

---

## ✅ Validación Visual

### Checklist de Diseño
- [x] Tabla alineada con márgenes del documento
- [x] Columnas bien distribuidas (sin sobreposición)
- [x] Nombres largos truncados correctamente
- [x] Tipos de documento legibles
- [x] Números de asiento visibles
- [x] Líneas separadoras consistentes
- [x] Espacio suficiente antes y después
- [x] Contador de pasajeros en título

### Pruebas Visuales Realizadas
- ✅ 1 representante
- ✅ 3 representantes
- ✅ 5 representantes
- ✅ 10 representantes
- ✅ Nombres cortos
- ✅ Nombres largos
- ✅ Con asientos
- ✅ Sin asientos (elección libre)

---

## 📝 Notas Finales

Esta visualización muestra cómo se renderiza la tabla de representantes en el PDF A4 en diferentes escenarios. La implementación es flexible y se adapta automáticamente al tipo de venta, mostrando la tabla solo cuando es necesario.
