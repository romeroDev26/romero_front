import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Manifest } from "../types/manifest.types";
import { drawLogoInPdf, drawLogoPlaceholder } from "../../../utils/pdfLogo";
import { getDocumentCompanyInfo } from "../../../utils/documentCompanyInfo";

export const generatePassengerManifestPDF = async (
  manifestData: Manifest
): Promise<{ pdf: jsPDF; blob: Blob }> => {
  const rawManifest = manifestData as any;
  const passengerItems = Array.isArray(rawManifest.data) && rawManifest.data.length > 0
    ? rawManifest.data
    : (manifestData.items || []);
  const cargoItems = manifestData.items && manifestData.items.length > 0
    ? manifestData.items
    : (Array.isArray(rawManifest.data) ? rawManifest.data : []);

  // OrientaciÃ³n: horizontal para ambos tipos (pasajeros y carga)
  const orientation = "l"; // Siempre horizontal
  const pdf = new jsPDF(orientation, "mm", "a4");
  const pageWidth = pdf.internal.pageSize.width;
  // Margen optimizado de 6mm para ambos tipos para mejor legibilidad
  const margin = 6;
  let currentY = 20;
  const company = await getDocumentCompanyInfo();

  // NUEVO HEADER SEGÃšN DISEÃ‘O DEL CLIENTE
  // Lado izquierdo: Logo y datos de empresa
  const logoX = margin;
  const logoY = currentY;
  const logoW = 45;
  const logoH = 20;

  try {
    if (company.logoUrl) {
      const hasLogo = await drawLogoInPdf(pdf, company.logoUrl, {
        x: logoX,
        y: logoY,
        width: logoW,
        height: logoH,
      });

      if (!hasLogo) {
        drawLogoPlaceholder(pdf, logoX, logoY, logoW, logoH);
      }
    } else {
      drawLogoPlaceholder(pdf, logoX, logoY, logoW, logoH);
    }
  } catch (e) {
    drawLogoPlaceholder(pdf, logoX, logoY, logoW, logoH);
  }

  // Info empresa (al lado del logo)
  const infoX = logoX + logoW + 5;
  const maxInfoWidth = pageWidth - infoX - 75; // Dejar mÃ¡s espacio para el recuadro

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text(company.businessName, infoX, logoY + 4);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  // Dividir la direcciÃ³n en lÃ­neas si es muy larga
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

  // InformaciÃ³n de viaje en la parte inferior del header
  const departureDateTime = manifestData.departure_datetime || rawManifest.trip_info?.departure_datetime;
  const depInfo = departureDateTime
    ? new Date(departureDateTime)
    : null;
  const fechaSalida = depInfo ? depInfo.toLocaleDateString("es-PE") : "N/A";
  const horaSalida = depInfo
    ? depInfo.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    })
    : "N/A";

  // TamaÃ±o de fuente optimizado: 10 para ambos tipos
  const infoFontSize = 10;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(infoFontSize);

  // DiseÃ±o de 3 columnas para ambos tipos (pasajeros y carga)
  if (manifestData.manifest_type === "PASSENGER") {
    // Calcular anchos de columna para mejor distribuciÃ³n en horizontal
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
    const originPort = manifestData.origin_port_name || rawManifest.trip_info?.origin_port_name || "N/A";
    pdf.text(originPort, col2X + 20, currentY);

    pdf.setFont("helvetica", "bold");
    pdf.text("PLACA:", col3X, currentY);
    pdf.setFont("helvetica", "normal");
    const vesselPlate = manifestData.vessel_registration_number || rawManifest.trip_info?.vehicle_license_plate || "N/A";
    pdf.text(vesselPlate, col3X + 17, currentY);

    currentY += 6;

    // Segunda fila
    pdf.setFont("helvetica", "bold");
    pdf.text("HORA DE SALIDA:", col1X, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(horaSalida, col1X + 35, currentY);

    pdf.setFont("helvetica", "bold");
    pdf.text("DESTINO:", col2X, currentY);
    pdf.setFont("helvetica", "normal");
    const destinationPort = manifestData.destination_port_name || rawManifest.trip_info?.destination_port_name || "N/A";
    pdf.text(destinationPort, col2X + 22, currentY);

    const vehicleName = manifestData.trip_info?.vehicle_model || rawManifest.trip_info?.vehicle_model || "N/A";
    pdf.setFont("helvetica", "bold");
    pdf.text("Embarcacion:", col3X - 5, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(vehicleName, col3X + 23, currentY);

    currentY += 6;

    // Tercera fila - Total
    pdf.setFont("helvetica", "bold");
    const totalPassengers = manifestData.total_passengers || passengerItems.length;
    pdf.text(`Total de Pasajeros: ${totalPassengers}`, col1X, currentY);

    currentY += 10;
  } else {
    // Diseño de 3 columnas para carga (igual que pasajeros)
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
    const originPort = manifestData.origin_port_name || rawManifest.trip_info?.origin_port_name || "N/A";
    pdf.text(originPort, col2X + 20, currentY);

    pdf.setFont("helvetica", "bold");
    pdf.text("PLACA:", col3X, currentY);
    pdf.setFont("helvetica", "normal");
    const vesselPlate = manifestData.vessel_registration_number || rawManifest.trip_info?.vehicle_license_plate || "N/A";
    pdf.text(vesselPlate, col3X + 17, currentY);

    currentY += 6;

    // Segunda fila
    pdf.setFont("helvetica", "bold");
    pdf.text("HORA DE SALIDA:", col1X, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(horaSalida, col1X + 35, currentY);

    pdf.setFont("helvetica", "bold");
    pdf.text("DESTINO:", col2X, currentY);
    pdf.setFont("helvetica", "normal");
    const destinationPort = manifestData.destination_port_name || rawManifest.trip_info?.destination_port_name || "N/A";
    pdf.text(destinationPort, col2X + 22, currentY);

    const vehicleName = manifestData.trip_info?.vehicle_model || rawManifest.trip_info?.vehicle_model || "N/A";
    pdf.setFont("helvetica", "bold");
    pdf.text("Embarcacion:", col3X - 5, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(vehicleName, col3X + 23, currentY);

    currentY += 6;

    // Tercera fila - Total
    pdf.setFont("helvetica", "bold");
    const rawTotalCargo = manifestData.total_cargo_weight_kg;
    const totalCargo = rawTotalCargo && !isNaN(Number(rawTotalCargo))
      ? Math.round(Number(rawTotalCargo))
      : (cargoItems.length || 0);
    pdf.text(`Total de carga: ${totalCargo}`, col1X, currentY);

    currentY += 10;
  }

  // TABLAS
  if (manifestData.manifest_type === "CARGO") {
    // Reutilizar la lÃ³gica existente para cargo (agrupado o plano)
    const grouped = (manifestData as any).cargo_grouped_by_stops;
    if (grouped && Array.isArray(grouped.groups) && grouped.groups.length > 0) {
      let globalItemNumber = 1; // NumeraciÃ³n continua entre grupos
      const pageHeight = pdf.internal.pageSize.height;
      const bottomMargin = 20; // Margen inferior mÃ­nimo
      const minSpaceForGroupHeader = 50; // Espacio mÃ­nimo necesario para tÃ­tulo + al menos 1 fila de tabla

      for (const group of grouped.groups) {
        // Verificar si hay espacio suficiente para el tÃ­tulo del grupo + header de tabla
        // Si no hay espacio, crear nueva pÃ¡gina
        if (currentY + minSpaceForGroupHeader > pageHeight - bottomMargin) {
          pdf.addPage();
          currentY = 20; // Reiniciar posiciÃ³n Y en la nueva pÃ¡gina
        }

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        const origin = (group.origin_port_name || "N/A").toString();
        const dest = (group.destination_port_name || "N/A").toString();
        pdf.text(`${origin} â†’ ${dest}`, pageWidth / 2, currentY, {
          align: "center",
        });
        currentY += 8;

        const tableData = (group.items || []).map((item: any) => {
          // Formatear contactos: R: (remitente) D: (destinatario) con salto de lÃ­nea
          let contactos = "";
          const remitentePhone = item.remitente_phone && item.remitente_phone.trim() !== "" ? item.remitente_phone : null;
          const destinatarioPhone = item.destinatario_phone && item.destinatario_phone.trim() !== "" ? item.destinatario_phone : null;

          if (remitentePhone) contactos += `R: ${remitentePhone}`;
          if (destinatarioPhone) {
            if (contactos) contactos += "\n";
            contactos += `D: ${destinatarioPhone}`;
          }
          if (!contactos) contactos = "N/A";

          // Formatear descripciÃ³n: separar por "-" y agregar viÃ±etas
          let formattedDescription = item.cargo_description || "N/A";
          if (formattedDescription !== "N/A" && formattedDescription.includes("-")) {
            const items = formattedDescription.split("-").map((i: string) => i.trim()).filter((i: string) => i.length > 0);
            if (items.length > 1) {
              formattedDescription = items.map((i: string) => `â€¢ ${i}`).join("\n");
            }
          }

          return [
            globalItemNumber++, // NumeraciÃ³n continua
            formattedDescription,
            item.remitente_nombre || "N/A",
            item.remitente_doc?.replace("1-", "DNI: ") || "N/A",
            item.destinatario_nombre || "N/A",
            item.destinatario_doc?.replace("1-", "DNI: ") || "N/A",
            contactos, // Mostrar telÃ©fonos en formato R: D:
            item.amount ? `S/ ${item.amount.toFixed(2)}` : "N/A",
            item.payment_status === "PAID"
              ? "PAGADO"
              : item.payment_status === "PENDING"
                ? "PENDIENTE"
                : item.payment_status || "N/A",
          ];
        });

        // Anchos optimizados para formato horizontal con mejor legibilidad (sin columna CANTIDAD)
        const initialColWidths = [12, 52, 40, 28, 40, 28, 32, 22, 24];
        const availableWidth = pageWidth - margin * 2;
        let totalTableWidth = initialColWidths.reduce((s, w) => s + w, 0);
        let adjustedColWidths = [...initialColWidths];

        if (totalTableWidth > availableWidth) {
          const scale = availableWidth / totalTableWidth;
          adjustedColWidths = initialColWidths.map((w) => Math.floor(w * scale));
          let sumAdj = adjustedColWidths.reduce((s, w) => s + w, 0);
          let i = adjustedColWidths.length - 1;
          while (sumAdj > availableWidth && i >= 0) {
            const reduceBy = Math.min(sumAdj - availableWidth, 1);
            adjustedColWidths[i] = Math.max(8, adjustedColWidths[i] - reduceBy);
            sumAdj = adjustedColWidths.reduce((s, w) => s + w, 0);
            i -= 1;
          }
          totalTableWidth = adjustedColWidths.reduce((s, w) => s + w, 0);
        }

        // Centrar la tabla
        const leftMargin = (pageWidth - totalTableWidth) / 2;

        const columnStyles: any = {
          0: { halign: "center", cellWidth: adjustedColWidths[0] },
          1: { halign: "left", cellWidth: adjustedColWidths[1] },
          2: { halign: "left", cellWidth: adjustedColWidths[2] },
          3: { halign: "center", cellWidth: adjustedColWidths[3] },
          4: { halign: "left", cellWidth: adjustedColWidths[4] },
          5: { halign: "center", cellWidth: adjustedColWidths[5] },
          6: { halign: "center", cellWidth: adjustedColWidths[6] },
          7: { halign: "center", cellWidth: adjustedColWidths[7] },
          8: { halign: "center", cellWidth: adjustedColWidths[8] },
        };

        autoTable(pdf, {
          startY: currentY,
          head: [
            [
              "NÂ°",
              "DESCRIPCIÃ“N",
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
            fontSize: 9.5,
            cellPadding: 3,
            halign: "center",
            valign: "middle",
          },
          headStyles: {
            fillColor: [100, 100, 100],
            textColor: 255,
            fontStyle: "bold",
            fontSize: 9.5,
            halign: "center",
            valign: "middle",
          },
          columnStyles,
          margin: { left: leftMargin, right: leftMargin },
          tableWidth: "auto",
          theme: "grid",
        });

        const finalY = (pdf as any).lastAutoTable?.finalY || currentY + 8;
        const groupItemCount = group.items?.length || 0; // Contar elementos en lugar de sumar pesos
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.text(`Total: ${groupItemCount}`, margin, finalY + 8); // Mostrar cantidad de elementos
        currentY = finalY + 16;
      }
    } else if (cargoItems && cargoItems.length > 0) {
      const tableData = cargoItems
        .sort((a: any, b: any) => a.item_order - b.item_order)
        .map((item: any, idx: number) => {
          // Formatear contactos: R: (remitente) D: (destinatario) con salto de lÃ­nea
          let contactos = "";
          const remitentePhone = item.remitente_phone && item.remitente_phone.trim() !== "" ? item.remitente_phone : null;
          const destinatarioPhone = item.destinatario_phone && item.destinatario_phone.trim() !== "" ? item.destinatario_phone : null;

          if (remitentePhone) contactos += `R: ${remitentePhone}`;
          if (destinatarioPhone) {
            if (contactos) contactos += "\n";
            contactos += `D: ${destinatarioPhone}`;
          }
          if (!contactos) contactos = "N/A";

          // Formatear descripciÃ³n: separar por "-" y agregar viÃ±etas
          let formattedDescription = item.cargo_description || "N/A";
          if (formattedDescription !== "N/A" && formattedDescription.includes("-")) {
            const items = formattedDescription.split("-").map((i: string) => i.trim()).filter((i: string) => i.length > 0);
            if (items.length > 1) {
              formattedDescription = items.map((i: string) => `â€¢ ${i}`).join("\n");
            }
          }

          return [
            (idx + 1).toString(),
            formattedDescription,
            item.remitente_nombre || "N/A",
            item.remitente_doc?.replace("1-", "DNI: ") || "N/A",
            item.destinatario_nombre || "N/A",
            item.destinatario_doc?.replace("1-", "DNI: ") || "N/A",
            contactos, // Mostrar telÃ©fonos en formato R: D:
            item.amount ? `S/ ${item.amount.toFixed(2)}` : "N/A",
            item.payment_status === "PAID"
              ? "PAGADO"
              : item.payment_status === "PENDING"
                ? "PENDIENTE"
                : item.payment_status || "N/A",
          ];
        });

      // Anchos optimizados para formato horizontal con mejor legibilidad (sin columna CANTIDAD)
      const initialColWidths = [12, 52, 40, 28, 40, 28, 32, 22, 24];
      const availableWidth = pageWidth - margin * 2;
      let totalTableWidth = initialColWidths.reduce((s, w) => s + w, 0);
      let adjustedColWidths = [...initialColWidths];

      if (totalTableWidth > availableWidth) {
        const scale = availableWidth / totalTableWidth;
        adjustedColWidths = initialColWidths.map((w) => Math.floor(w * scale));
        let sumAdj = adjustedColWidths.reduce((s, w) => s + w, 0);
        let i = adjustedColWidths.length - 1;
        while (sumAdj > availableWidth && i >= 0) {
          const reduceBy = Math.min(sumAdj - availableWidth, 1);
          adjustedColWidths[i] = Math.max(8, adjustedColWidths[i] - reduceBy);
          sumAdj = adjustedColWidths.reduce((s, w) => s + w, 0);
          i -= 1;
        }
        totalTableWidth = adjustedColWidths.reduce((s, w) => s + w, 0);
      }

      // Centrar la tabla
      const leftMargin = (pageWidth - totalTableWidth) / 2;

      const columnStyles2: any = {
        0: { halign: "center", cellWidth: adjustedColWidths[0] },
        1: { halign: "left", cellWidth: adjustedColWidths[1] },
        2: { halign: "left", cellWidth: adjustedColWidths[2] },
        3: { halign: "center", cellWidth: adjustedColWidths[3] },
        4: { halign: "left", cellWidth: adjustedColWidths[4] },
        5: { halign: "center", cellWidth: adjustedColWidths[5] },
        6: { halign: "center", cellWidth: adjustedColWidths[6] },
        7: { halign: "center", cellWidth: adjustedColWidths[7] },
        8: { halign: "center", cellWidth: adjustedColWidths[8] },
      };

      autoTable(pdf, {
        startY: currentY,
        head: [
          [
            "NÂ°",
            "DESCRIPCIÃ“N",
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
          fontSize: 9.5,
          cellPadding: 3,
          halign: "center",
          valign: "middle",
        },
        headStyles: {
          fillColor: [100, 100, 100],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 9.5,
          halign: "center",
          valign: "middle",
        },
        columnStyles: columnStyles2,
        margin: { left: leftMargin, right: leftMargin },
        tableWidth: "auto",
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
    if (passengerItems && passengerItems.length > 0) {
      const tableData = passengerItems
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
          const passengerDocType = item.passenger_doc_type || item.document_type;
          const identityLabel =
            passengerDocType === "1"
              ? "DNI"
              : passengerDocType === "2"
                ? "CE"
                : "PAS";
          let nationality = "N/A";
          if (item.passenger_country_name)
            nationality = item.passenger_country_name;
          else if (item.passenger_country_code) {
            nationality =
              item.passenger_country_code === "PE"
                ? "PERÃš"
                : item.passenger_country_code;
          }
          return [
            (idx + 1).toString(),
            item.passenger_name || item.full_name || "N/A",
            `${identityLabel}: ${item.passenger_doc_number || item.document_number || "N/A"}`,
            nationality,
            sellerDisplay,
            item.seat_number || "N/A",
            item.boarding_port_name || item.boarding_port || "N/A",
            item.disembarking_port_name || item.destination_port || "N/A",
            item.passenger_phone || item.phone || "N/A",
          ];
        });

      // Column widths (mm) y centrado
      // Ajuste de anchos optimizado para mejor visualizaciÃ³n de todas las columnas
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
        // NOTA: permitimos que la tabla quede fuera del margen si es necesario, siempre y cuando estÃ© centrada
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
          fontSize: 9.5,
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
        },
        bodyStyles: { fontSize: 9.5, cellPadding: 3, valign: "middle" },
        columnStyles: passengerColumnStyles,
        margin: { left: leftMargin, right: leftMargin },
        tableWidth: "auto",
        styles: {
          overflow: "linebreak",
          fontSize: 9.5,
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
  const systemName = company.businessName !== "N/A" ? `Sistema de Gestion - ${company.businessName.trim()}` : "Sistema de Gestion";
  pdf.text(
    systemName,
    pageWidth - margin - 80,
    footerY + 3
  );

  // Crear blob del PDF y devolver
  const blob = new Blob([pdf.output("blob")], { type: "application/pdf" });
  return { pdf, blob };
};

