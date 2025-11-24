import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Manifest } from "../types/manifest.types";

export const generatePassengerManifestPDF = (
  manifestData: Manifest
): { pdf: jsPDF; blob: Blob } => {
  // Orientación: horizontal para pasajeros, vertical para carga
  const orientation = manifestData.manifest_type === "PASSENGER" ? "l" : "p";
  const pdf = new jsPDF(orientation, "mm", "a4");
  const pageWidth = pdf.internal.pageSize.width;
  // Margen optimizado para pasajeros (6mm) para balance entre legibilidad y diseño
  const margin = manifestData.manifest_type === "PASSENGER" ? 6 : 15;
  let currentY = 20;

  // NUEVO HEADER SEGÚN DISEÑO DEL CLIENTE
  if (manifestData.company) {
    const company = manifestData.company;

    // Lado izquierdo: Logo y datos de empresa
    const logoX = margin;
    const logoY = currentY;
    const logoW = 45;
    const logoH = 20;

    try {
      if (company.logo_url) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = company.logo_url as string;
        // Placeholder para logo
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(logoX, logoY, logoW, logoH);
        pdf.setFontSize(8);
        pdf.text("LOGO", logoX + logoW / 2, logoY + logoH / 2, {
          align: "center",
        });
      } else {
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(logoX, logoY, logoW, logoH);
        pdf.setFontSize(8);
        pdf.text("LOGO", logoX + logoW / 2, logoY + logoH / 2, {
          align: "center",
        });
      }
    } catch (e) {
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(logoX, logoY, logoW, logoH);
      pdf.setFontSize(8);
      pdf.text("LOGO", logoX + logoW / 2, logoY + logoH / 2, {
        align: "center",
      });
    }

    // Info empresa (al lado del logo)
    const infoX = logoX + logoW + 5;
    const maxInfoWidth = pageWidth - infoX - 75; // Dejar más espacio para el recuadro

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(company.name, infoX, logoY + 4);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    // Dividir la dirección en líneas si es muy larga
    const addressLines = pdf.splitTextToSize(company.address, maxInfoWidth);
    let addressY = logoY + 8;
    for (let i = 0; i < Math.min(addressLines.length, 2); i++) {
      pdf.text(addressLines[i], infoX, addressY);
      addressY += 4;
    }

    pdf.text(`Tel: ${company.phone}`, infoX, addressY);
    pdf.text(company.email, infoX, addressY + 4);

    // Lado derecho: Recuadro con RUC, TIPO DE DOC, CORRELATIVO
    const boxW = 50;
    const boxH = 25;
    const boxX = pageWidth - margin - boxW;
    const boxY = logoY;

    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.rect(boxX, boxY, boxW, boxH);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text(company.ruc, boxX + boxW / 2, boxY + 5, { align: "center" });

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    const docType =
      manifestData.manifest_type === "CARGO"
        ? "MANIFIESTO DE CARGA"
        : "MANIFIESTO DE PASAJEROS";
    pdf.text(docType, boxX + boxW / 2, boxY + 13, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(manifestData.manifest_number, boxX + boxW / 2, boxY + 21, {
      align: "center",
    });

    currentY += Math.max(logoH, boxH) + 8;
  }

  // Información de viaje en la parte inferior del header
  const depInfo = manifestData.departure_datetime
    ? new Date(manifestData.departure_datetime)
    : null;
  const fechaSalida = depInfo ? depInfo.toLocaleDateString("es-PE") : "N/A";
  const horaSalida = depInfo
    ? depInfo.toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  // Tamaño de fuente optimizado para pasajeros
  const infoFontSize = manifestData.manifest_type === "PASSENGER" ? 10 : 9;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(infoFontSize);

  // Para pasajeros (horizontal): distribuir en 3 columnas con más espacio
  // Para carga (vertical): mantener diseño en 2 columnas
  if (manifestData.manifest_type === "PASSENGER") {
    // Calcular anchos de columna para mejor distribución en horizontal
    const col1X = margin;
    const col2X = margin + 95;
    const col3X = margin + 190;

    // Primera fila
    pdf.setFont("helvetica", "bold");
    pdf.text("FECHA SALIDA:", col1X, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(fechaSalida, col1X + 32, currentY);

    pdf.setFont("helvetica", "bold");
    pdf.text("ORIGEN:", col2X, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(manifestData.origin_port_name || "N/A", col2X + 20, currentY);

    pdf.setFont("helvetica", "bold");
    pdf.text("PLACA:", col3X, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(manifestData.vessel_registration_number || "N/A", col3X + 17, currentY);

    currentY += 6;

    // Segunda fila
    pdf.setFont("helvetica", "bold");
    pdf.text("HORA DE SALIDA:", col1X, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(horaSalida, col1X + 35, currentY);

    pdf.setFont("helvetica", "bold");
    pdf.text("DESTINO:", col2X, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(manifestData.destination_port_name || "N/A", col2X + 22, currentY);

    const vehicleName = manifestData.trip_info?.vehicle_model || "N/A";
    pdf.setFont("helvetica", "bold");
    pdf.text("Embarcación:", col3X, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(vehicleName, col3X + 28, currentY);

    currentY += 6;

    // Tercera fila - Total
    pdf.setFont("helvetica", "bold");
    pdf.text(`Total de Pasajeros: ${manifestData.total_passengers}`, col1X, currentY);

    currentY += 10;
  } else {
    // Diseño original para carga (vertical)
    pdf.text("FECHA SALIDA:", margin, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(fechaSalida, margin + 30, currentY);

    pdf.setFont("helvetica", "bold");
    pdf.text("HORA DE SALIDA:", pageWidth / 2 + 10, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(horaSalida, pageWidth / 2 + 40, currentY);

    currentY += 6;

    pdf.setFont("helvetica", "bold");
    pdf.text("ORIGEN:", margin, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(manifestData.origin_port_name || "N/A", margin + 20, currentY);

    pdf.setFont("helvetica", "bold");
    pdf.text("DESTINO:", pageWidth / 2 + 10, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(manifestData.destination_port_name || "N/A", pageWidth / 2 + 30, currentY);

    const vehicleName = manifestData.trip_info?.vehicle_model || "N/A";
    const embarcacionX = pageWidth - margin - 50;
    pdf.setFont("helvetica", "bold");
    pdf.text("Embarcación:", embarcacionX, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(vehicleName, embarcacionX + 25, currentY);

    currentY += 6;

    pdf.setFont("helvetica", "bold");
    pdf.text("PLACA:", margin, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(manifestData.vessel_registration_number || "N/A", margin + 15, currentY);

    currentY += 10;

    pdf.setFont("helvetica", "bold");
    pdf.text(`Total de carga: ${Math.round(manifestData.total_cargo_weight_kg)}`, margin, currentY);
    
    currentY += 12;
  }

  // TABLAS
  if (manifestData.manifest_type === "CARGO") {
    // Reutilizar la lógica existente para cargo (agrupado o plano)
    const grouped = (manifestData as any).cargo_grouped_by_stops;
    if (grouped && Array.isArray(grouped.groups) && grouped.groups.length > 0) {
      let globalItemNumber = 1; // Numeración continua entre grupos

      for (const group of grouped.groups) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        const origin = (group.origin_port_name || "N/A").toString();
        const dest = (group.destination_port_name || "N/A").toString();
        pdf.text(`${origin} → ${dest}`, pageWidth / 2, currentY, {
          align: "center",
        });
        currentY += 8;

        const tableData = (group.items || []).map((item: any) => {
          // Formatear contactos: R: (remitente) D: (destinatario) con salto de línea
          let contactos = "";
          const remitentePhone = item.remitente_phone && item.remitente_phone.trim() !== "" ? item.remitente_phone : null;
          const destinatarioPhone = item.destinatario_phone && item.destinatario_phone.trim() !== "" ? item.destinatario_phone : null;
          
          if (remitentePhone) contactos += `R: ${remitentePhone}`;
          if (destinatarioPhone) {
            if (contactos) contactos += "\n";
            contactos += `D: ${destinatarioPhone}`;
          }
          if (!contactos) contactos = "N/A";

          return [
            globalItemNumber++, // Numeración continua
            item.cargo_description || "N/A",
            item.cargo_weight_kg || "N/A", // Usar el valor directo del JSON (ej: "1 unidad")
            item.remitente_nombre || "N/A",
            item.remitente_doc?.replace("1-", "DNI: ") || "N/A",
            item.destinatario_nombre || "N/A",
            item.destinatario_doc?.replace("1-", "DNI: ") || "N/A",
            contactos, // Mostrar teléfonos en formato R: D:
            item.amount ? `S/ ${item.amount.toFixed(2)}` : "N/A",
            item.payment_status === "PAID"
              ? "PAGADO"
              : item.payment_status === "PENDING"
              ? "PENDIENTE"
              : item.payment_status || "N/A",
          ];
        });

        const columnStyles: any = {
          0: { halign: "center", cellWidth: 8 },
          1: { halign: "left", cellWidth: 30 }, // Reducido para hacer espacio
          2: { halign: "center", cellWidth: 15 }, // Reducido para hacer espacio
          3: { halign: "left", cellWidth: 24 },
          4: { halign: "center", cellWidth: 18 },
          5: { halign: "left", cellWidth: 24 },
          6: { halign: "center", cellWidth: 18 },
          7: { halign: "center", cellWidth: 20 },
          8: { halign: "center", cellWidth: 15 }, // Nueva columna Monto
          9: { halign: "center", cellWidth: 18 }, // Nueva columna Estado
        };

        autoTable(pdf, {
          startY: currentY,
          head: [
            [
              "N°",
              "DESCRIPCIÓN",
              "CANTIDAD",
              "REMITENTE",
              "DOC. REM.",
              "DESTINATARIO",
              "DOC. DEST.",
              "CONTACTO",
              "MONTO",
              "ESTADO",
            ],
          ],
          body: tableData,
          styles: {
            fontSize: 6,
            cellPadding: 1.5,
            halign: "center",
            valign: "middle",
          },
          headStyles: {
            fillColor: [100, 100, 100],
            textColor: 255,
            fontStyle: "bold",
            fontSize: 6,
          },
          columnStyles,
          margin: { left: 11, right: 17 }, // 11mm izquierda, 17mm derecha
          tableWidth: "wrap",
          theme: "grid",
        });

        const finalY = (pdf as any).lastAutoTable?.finalY || currentY + 8;
        const groupItemCount = group.items?.length || 0; // Contar elementos en lugar de sumar pesos
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.text(`Total: ${groupItemCount}`, margin, finalY + 8); // Mostrar cantidad de elementos
        currentY = finalY + 16;
      }
    } else if (manifestData.items && manifestData.items.length > 0) {
      const tableData = manifestData.items
        .sort((a: any, b: any) => a.item_order - b.item_order)
        .map((item: any, idx: number) => {
        // Formatear contactos: R: (remitente) D: (destinatario) con salto de línea
        let contactos = "";
        const remitentePhone = item.remitente_phone && item.remitente_phone.trim() !== "" ? item.remitente_phone : null;
        const destinatarioPhone = item.destinatario_phone && item.destinatario_phone.trim() !== "" ? item.destinatario_phone : null;
        
        if (remitentePhone) contactos += `R: ${remitentePhone}`;
        if (destinatarioPhone) {
          if (contactos) contactos += "\n";
          contactos += `D: ${destinatarioPhone}`;
        }
        if (!contactos) contactos = "N/A";

        return [
          (idx + 1).toString(),
          item.cargo_description || "N/A",
          item.cargo_weight_kg || "N/A", // Usar el valor directo del JSON (ej: "1 unidad")
          item.remitente_nombre || "N/A",
          item.remitente_doc?.replace("1-", "DNI: ") || "N/A",
          item.destinatario_nombre || "N/A",
          item.destinatario_doc?.replace("1-", "DNI: ") || "N/A",
          contactos, // Mostrar teléfonos en formato R: D:
          item.amount ? `S/ ${item.amount.toFixed(2)}` : "N/A",
          item.payment_status === "PAID"
            ? "PAGADO"
            : item.payment_status === "PENDING"
            ? "PENDIENTE"
            : item.payment_status || "N/A",
        ];
      });

      const columnStyles2: any = {
        0: { halign: "center", cellWidth: 8 },
        1: { halign: "left", cellWidth: 30 }, // Reducido para hacer espacio
        2: { halign: "center", cellWidth: 15 }, // Reducido para hacer espacio
        3: { halign: "left", cellWidth: 24 },
        4: { halign: "center", cellWidth: 18 },
        5: { halign: "left", cellWidth: 24 },
        6: { halign: "center", cellWidth: 18 },
        7: { halign: "center", cellWidth: 20 },
        8: { halign: "center", cellWidth: 15 }, // Nueva columna Monto
        9: { halign: "center", cellWidth: 18 }, // Nueva columna Estado
      };

      autoTable(pdf, {
        startY: currentY,
        head: [
          [
            "N°",
            "DESCRIPCIÓN",
            "CANTIDAD",
            "REMITENTE",
            "DOC. REM.",
            "DESTINATARIO",
            "DOC. DEST.",
            "CONTACTO",
            "MONTO",
            "ESTADO",
          ],
        ],
        body: tableData,
        styles: {
          fontSize: 6,
          cellPadding: 1.5,
          halign: "center",
          valign: "middle",
        },
        headStyles: {
          fillColor: [100, 100, 100],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 6,
        },
        columnStyles: columnStyles2,
        margin: { left: 11, right: 17 }, // 11mm izquierda, 17mm derecha
        tableWidth: "wrap",
        theme: "grid",
      });
    } else {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text("No hay registros de carga para mostrar.", margin, currentY);
      currentY += 8;
    }
  } else {
    // PASAJEROS: construir tabla centrada y con estilo similar a carga
    if (manifestData.items && manifestData.items.length > 0) {
      const tableData = manifestData.items
        .sort((a: any, b: any) => a.item_order - b.item_order)
        .map((item: any, idx: number) => {
        const rawSeller =
          item.seller_name ??
          item?.seller?.name ??
          manifestData.generated_by_user?.full_name ??
          manifestData.generated_by_name ??
          manifestData.generated_by;
        const sellerDisplay = rawSeller
          ? String(rawSeller).trim().split(" ")[0]
          : "VENDEDOR";
        const identityLabel =
          item.passenger_doc_type === "1"
            ? "DNI"
            : item.passenger_doc_type === "2"
            ? "CE"
            : "PAS";
        let nationality = "N/A";
        if (item.passenger_country_name)
          nationality = item.passenger_country_name;
        else if (item.passenger_country_code) {
          nationality =
            item.passenger_country_code === "PE"
              ? "PERÚ"
              : item.passenger_country_code;
        }
        return [
          (idx + 1).toString(),
          item.passenger_name || "N/A",
          `${identityLabel}: ${item.passenger_doc_number || "N/A"}`,
          nationality,
          sellerDisplay,
          item.seat_number || "N/A",
          item.boarding_port_name || "N/A",
          item.disembarking_port_name || "N/A",
          item.passenger_phone || "N/A",
        ];
      });

      // Column widths (mm) y centrado
      // Ajuste de anchos optimizado para mejor visualización de todas las columnas
      const colWidths = [12, 54, 28, 20, 22, 20, 22, 22, 20];
      // Ajustar si la tabla excede el ancho disponible
      const availableWidth = pageWidth - margin * 2;
      let totalTableWidth = colWidths.reduce((s, w) => s + w, 0);
      let adjustedColWidths = [...colWidths];
      if (totalTableWidth > availableWidth) {
        const scale = availableWidth / totalTableWidth;
        adjustedColWidths = colWidths.map((w) => Math.floor(w * scale));
        // corregir redondeo si hace falta
        let sumAdj = adjustedColWidths.reduce((s, w) => s + w, 0);
        let i = adjustedColWidths.length - 1;
        while (sumAdj > availableWidth && i >= 0) {
          const reduceBy = Math.min(sumAdj - availableWidth, 1);
          adjustedColWidths[i] = Math.max(6, adjustedColWidths[i] - reduceBy);
          sumAdj = adjustedColWidths.reduce((s, w) => s + w, 0);
          i -= 1;
        }
        totalTableWidth = adjustedColWidths.reduce((s, w) => s + w, 0);
      } else {
        // Si hay espacio, ampliar la tabla moderadamente (hasta 30%) para buena legibilidad
        // NOTA: permitimos que la tabla quede fuera del margen si es necesario, siempre y cuando esté centrada
        const expansionFactor = 1.30; // hasta +30%
        const desiredWidth = Math.round(totalTableWidth * expansionFactor);
        if (desiredWidth > totalTableWidth) {
          let extra = desiredWidth - totalTableWidth;
          // distribuir extra: favorecer columna 1 (nombres), 5 (asiento) y 3 (nacionalidad)
          const priority = [1, 5, 3, 2, 4, 6, 7, 8, 0];
          let pi = 0;
          while (extra > 0) {
            const col = priority[pi % priority.length];
            adjustedColWidths[col] = adjustedColWidths[col] + 1;
            extra -= 1;
            pi += 1;
          }
          totalTableWidth = adjustedColWidths.reduce((s, w) => s + w, 0);
        }
      }
      // Centrar la tabla incluso si eso significa reducir el leftMargin por debajo del margen habitual
      const leftMargin = (pageWidth - totalTableWidth) / 2;
      const passengerColumnStyles: any = {
        0: { halign: "center", cellWidth: adjustedColWidths[0] },
        1: { halign: "left", cellWidth: adjustedColWidths[1] },
        2: {
          halign: "center",
          cellWidth: adjustedColWidths[2],
          overflow: "ellipsize",
        }, // DOC DE IDENT
        3: { halign: "center", cellWidth: adjustedColWidths[3] }, // NACIONALIDAD
        4: { halign: "center", cellWidth: adjustedColWidths[4] }, // VENDEDOR
        5: { halign: "center", cellWidth: adjustedColWidths[5] }, // ASIENTO (sin overflow para mostrar texto completo)
        6: { halign: "center", cellWidth: adjustedColWidths[6] }, // ORIGEN
        7: { halign: "center", cellWidth: adjustedColWidths[7] }, // DESTINO
        8: { halign: "center", cellWidth: adjustedColWidths[8] }, // TELÉFONO
      };

      autoTable(pdf, {
        startY: currentY,
        head: [
          [
            "N°",
            "APELLIDOS Y NOMBRES",
            "DOC DE IDENT",
            "NACIONALIDAD",
            "VENDEDOR",
            "ASIENTO",
            "ORIGEN",
            "DESTINO",
            "TELÉFONO",
          ],
        ],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [100, 100, 100],
          textColor: 255,
          fontSize: 8.5,
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
        },
        bodyStyles: { fontSize: 8.5, cellPadding: 3, valign: "middle" },
        columnStyles: passengerColumnStyles,
        margin: { left: leftMargin, right: leftMargin },
        tableWidth: "auto",
        styles: {
          overflow: "linebreak",
          fontSize: 8.5,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
      });
      const lastY = (pdf as any).lastAutoTable?.finalY || currentY;
      currentY = lastY + 8;
    } else {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(
        "No hay registros para mostrar en este manifiesto.",
        margin,
        currentY
      );
      currentY += 8;
    }
  }

  // OBSERVACIONES
  if (manifestData.observations) {
    const finalY = (pdf as any).lastAutoTable?.finalY || currentY + 20;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("Observaciones:", margin, finalY + 8);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(
      pdf.splitTextToSize(manifestData.observations, pageWidth - margin * 2),
      margin,
      finalY + 14
    );
    currentY = finalY + 24;
  }

  // FOOTER
  const footerY = pdf.internal.pageSize.height - 25;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.3);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(
    `Generado el: ${new Date().toLocaleString("es-PE")}`,
    margin,
    footerY + 3
  );
  if (manifestData.generated_by_user?.full_name)
    pdf.text(`Por: ${manifestData.generated_by_user.full_name}`, margin, footerY + 8);
  else if (manifestData.generated_by_name)
    pdf.text(`Por: ${manifestData.generated_by_name}`, margin, footerY + 8);
  pdf.text(
    "Sistema de Gestión - Transportes Romero",
    pageWidth - margin - 60,
    footerY + 3
  );

  // Crear blob del PDF y devolver
  const blob = new Blob([pdf.output("blob")], { type: "application/pdf" });
  return { pdf, blob };
};

// Props del componente
interface ManifestPDFGeneratorProps {
  manifestData: Manifest;
}

// Componente React para generar y manejar el PDF
export const ManifestPDFGenerator: React.FC<ManifestPDFGeneratorProps> = ({
  manifestData,
}) => {
  const handleGeneratePDF = () => {
    const { pdf } = generatePassengerManifestPDF(manifestData);

    // Abrir en nueva ventana para previsualización
    const blob = new Blob([pdf.output("blob")], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

    // Limpiar el URL después de un tiempo
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const handleDownloadPDF = () => {
    const { pdf } = generatePassengerManifestPDF(manifestData);
    pdf.save(`manifiesto-${manifestData.manifest_number}.pdf`);
  };

  return (
    <div className="flex space-x-3">
      <button
        onClick={handleGeneratePDF}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Vista Previa
      </button>
      <button
        onClick={handleDownloadPDF}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        Descargar
      </button>
    </div>
  );
};
