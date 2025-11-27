//src/features/manifests/components/ManifestPreviewModal.tsx
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  DocumentArrowDownIcon,
  XMarkIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../../components/common/Button";
import { Modal } from "../../../components/common/Modal";
import { manifestService } from "../services/manifest.service";
import { Manifest } from "../types/manifest.types";

interface ManifestPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  manifestData: Manifest;
}

export const ManifestPreviewModal: React.FC<ManifestPreviewModalProps> = ({
  isOpen,
  onClose,
  manifestData,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (isOpen && manifestData) generatePDFPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, manifestData]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const generatePDFPreview = async () => {
    setIsGeneratingPDF(true);
    try {
      const blob = await generatePDFBlob();
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      try {
        const file = new File(
          [blob],
          `manifiesto-${manifestData.id}.pdf`,
          { type: "application/pdf" }
        );
        await manifestService.uploadManifestPDF(manifestData.id, file, "a4");
        toast.success("PDF generado y subido automáticamente al sistema");
      } catch (uploadError) {
        console.warn("No se pudo subir PDF automáticamente:", uploadError);
        toast.warn("PDF generado, no se subió automáticamente");
      }
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      toast.error("Error al generar la previsualización del PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generatePDFBlob = async (): Promise<Blob> => {
    // Orientación: horizontal para ambos tipos (pasajeros y carga)
    const orientation = "l"; // Siempre horizontal
    const pdf = new jsPDF(orientation, "mm", "a4");
    const pageWidth = pdf.internal.pageSize.width;
    // Margen optimizado de 6mm para ambos tipos para mejor legibilidad
    const margin = 6;
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
          await new Promise((res, rej) => {
            img.onload = () => res(img);
            img.onerror = rej;
            img.src = company.logo_url as string;
          });
          pdf.addImage(img, "PNG", logoX, logoY, logoW, logoH);
        } else {
          // Placeholder para logo
          pdf.setDrawColor(200, 200, 200);
          pdf.rect(logoX, logoY, logoW, logoH);
          pdf.setFontSize(8);
          const logoText = "LOGO";
          const logoTextWidth = pdf.getTextWidth(logoText);
          pdf.text(logoText, logoX + (logoW - logoTextWidth) / 2, logoY + logoH / 2);
        }
      } catch (e) {
        // Placeholder para logo si falla la carga
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
      pdf.text(String((company as any).business_name || (company as any).trade_name || "N/A"), infoX, logoY + 4);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      // Dividir la dirección en líneas si es muy larga
      const addressLines = pdf.splitTextToSize(String(company.address || "N/A"), maxInfoWidth);
      let addressY = logoY + 8;
      for (let i = 0; i < Math.min(addressLines.length, 2); i++) {
        pdf.text(addressLines[i], infoX, addressY);
        addressY += 4;
      }

      pdf.text(`Tel: ${String(company.phone || "N/A")}`, infoX, addressY);
      pdf.text(String(company.email || "N/A"), infoX, addressY + 4);

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
      const rucText = String(company.ruc || "N/A");
      const rucWidth = pdf.getTextWidth(rucText);
      pdf.text(rucText, boxX + boxW / 2 - rucWidth / 2, boxY + 5);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      const docType =
        manifestData.manifest_type === "CARGO"
          ? "MANIFIESTO DE CARGA"
          : "MANIFIESTO DE PASAJEROS";
      const docTypeWidth = pdf.getTextWidth(docType);
      pdf.text(docType, boxX + boxW / 2 - docTypeWidth / 2, boxY + 13);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      // Correlativo: PASSENGER -> MP########, CARGO -> MC########, fallback id
      let correlativo = String(manifestData.id || "N/A");
      if (manifestData.manifest_type === "PASSENGER") {
        correlativo = `MP${String(manifestData.id || "").padStart(8, "0")}`;
      } else if (manifestData.manifest_type === "CARGO") {
        correlativo = `MC${String(manifestData.id || "").padStart(8, "0")}`;
      }
      const correlativoWidth = pdf.getTextWidth(correlativo);
      pdf.text(correlativo, boxX + boxW / 2 - correlativoWidth / 2, boxY + 21);

      currentY += Math.max(logoH, boxH) + 8;
    }

    // Información de viaje en la parte inferior del header
    const depInfo = (manifestData as any).trip_info?.departure_datetime
      ? new Date((manifestData as any).trip_info.departure_datetime)
      : null;
    const fechaSalida = depInfo ? depInfo.toLocaleDateString("es-PE") : "N/A";
    const horaSalida = depInfo
      ? depInfo.toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

    // Tamaño de fuente optimizado: 10 para ambos tipos
    const infoFontSize = 10;
    pdf.setFontSize(infoFontSize);

    // Diseño de 3 columnas para ambos tipos (pasajeros y carga)
    if (manifestData.manifest_type === "PASSENGER") {
      // Calcular anchos de columna para mejor distribución en horizontal
      const col1X = margin;
      const col2X = margin + 95;
      const col3X = margin + 190;

      // Primera fila
      pdf.setFont("helvetica", "bold");
      pdf.text("FECHA SALIDA:", col1X, currentY);
      pdf.setFont("helvetica", "normal");
      pdf.text(String(fechaSalida), col1X + 32, currentY);

      pdf.setFont("helvetica", "bold");
      pdf.text("ORIGEN:", col2X, currentY);
      pdf.setFont("helvetica", "normal");
      pdf.text(String((manifestData as any).trip_info?.origin_port_name || "N/A"), col2X + 20, currentY);

      pdf.setFont("helvetica", "bold");
      pdf.text("PLACA:", col3X, currentY);
      pdf.setFont("helvetica", "normal");
      pdf.text(String((manifestData as any).trip_info?.vehicle_license_plate || "N/A"), col3X + 17, currentY);

      currentY += 6;

      // Segunda fila
      pdf.setFont("helvetica", "bold");
      pdf.text("HORA DE SALIDA:", col1X, currentY);
      pdf.setFont("helvetica", "normal");
      pdf.text(String(horaSalida), col1X + 35, currentY);

      pdf.setFont("helvetica", "bold");
      pdf.text("DESTINO:", col2X, currentY);
      pdf.setFont("helvetica", "normal");
      pdf.text(String((manifestData as any).trip_info?.destination_port_name || "N/A"), col2X + 22, currentY);

      const vehicleName = String((manifestData as any).trip_info?.vehicle_model || "N/A");
      pdf.setFont("helvetica", "bold");
      pdf.text("Embarcación:", col3X, currentY);
      pdf.setFont("helvetica", "normal");
      pdf.text(vehicleName, col3X + 28, currentY);

      currentY += 6;

      // Tercera fila - Total
      pdf.setFont("helvetica", "bold");
      pdf.text(`Total de Pasajeros: ${(manifestData as any).data?.length || 0}`, col1X, currentY);

      currentY += 4;
    } else {
      // Diseño de 3 columnas para carga (igual que pasajeros)
      const col1X = margin;
      const col2X = margin + 95;
      const col3X = margin + 190;

      // Primera fila
      pdf.setFont("helvetica", "bold");
      pdf.text("FECHA SALIDA:", col1X, currentY);
      pdf.setFont("helvetica", "normal");
      pdf.text(String(fechaSalida), col1X + 32, currentY);

      pdf.setFont("helvetica", "bold");
      pdf.text("ORIGEN:", col2X, currentY);
      pdf.setFont("helvetica", "normal");
      pdf.text(String((manifestData as any).trip_info?.origin_port_name || "N/A"), col2X + 20, currentY);

      pdf.setFont("helvetica", "bold");
      pdf.text("PLACA:", col3X, currentY);
      pdf.setFont("helvetica", "normal");
      pdf.text(String((manifestData as any).trip_info?.vehicle_license_plate || "N/A"), col3X + 17, currentY);

      currentY += 6;

      // Segunda fila
      pdf.setFont("helvetica", "bold");
      pdf.text("HORA DE SALIDA:", col1X, currentY);
      pdf.setFont("helvetica", "normal");
      pdf.text(String(horaSalida), col1X + 35, currentY);

      pdf.setFont("helvetica", "bold");
      pdf.text("DESTINO:", col2X, currentY);
      pdf.setFont("helvetica", "normal");
      pdf.text(String((manifestData as any).trip_info?.destination_port_name || "N/A"), col2X + 22, currentY);

      const vehicleName = String((manifestData as any).trip_info?.vehicle_model || "N/A");
      pdf.setFont("helvetica", "bold");
      pdf.text("Embarcación:", col3X, currentY);
      pdf.setFont("helvetica", "normal");
      pdf.text(vehicleName, col3X + 28, currentY);

      currentY += 6;

      // Tercera fila - Total
      pdf.setFont("helvetica", "bold");
      const rawTotalCargo = (manifestData as any).total_cargo_weight_kg;
      const totalCargo =
        rawTotalCargo && !isNaN(Number(rawTotalCargo))
          ? Math.round(Number(rawTotalCargo))
          : ((manifestData as any).data?.length || 0);
      pdf.text(`Total de carga: ${totalCargo}`, col1X, currentY);

      currentY += 4;
    }

    // Tables
    if (manifestData.manifest_type === "CARGO") {
      const grouped = (manifestData as any).cargo_grouped_by_stops;
      if (
        grouped &&
        Array.isArray(grouped.groups) &&
        grouped.groups.length > 0
      ) {
        let globalItemNumber = 1; // Numeración continua entre grupos

        for (const group of grouped.groups) {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(10);
          // Ruta: usar guión simple para mejor visualización
          const origin = (group.origin_port_name || "N/A")
            .toString()
            .toUpperCase();
          const dest = (group.destination_port_name || "N/A")
            .toString()
            .toUpperCase();
          const routeText = `${origin} - ${dest}`;
          const routeTextWidth = pdf.getTextWidth(routeText);
          pdf.text(routeText, pageWidth / 2 - routeTextWidth / 2, currentY);
          currentY += 8;

          const tableData = (group.items || []).map((item: any) => {
            // Formatear contactos: R: (remitente) D: (destinatario) con salto de línea
            let contactos = "";
            const remitentePhone =
              item.remitente_phone && item.remitente_phone.trim() !== ""
                ? item.remitente_phone
                : null;
            const destinatarioPhone =
              item.destinatario_phone && item.destinatario_phone.trim() !== ""
                ? item.destinatario_phone
                : null;

            if (remitentePhone) contactos += `R: ${remitentePhone}`;
            if (destinatarioPhone) {
              if (contactos) contactos += "\n";
              contactos += `D: ${destinatarioPhone}`;
            }
            if (!contactos) contactos = "N/A";

            // Formatear descripción: separar por "-" y agregar viñetas
            let formattedDescription = item.cargo_description || "N/A";
            if (formattedDescription !== "N/A" && formattedDescription.includes("-")) {
              const items = formattedDescription.split("-").map((i: string) => i.trim()).filter((i: string) => i.length > 0);
              if (items.length > 1) {
                formattedDescription = items.map((i: string) => `• ${i}`).join("\n");
              }
            }

            return [
              item.parcel_number || globalItemNumber++, // Usar parcel_number si existe, sino numeración continua
              formattedDescription,
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
                "N°",
                "DESCRIPCIÓN",
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
              textColor: [255, 255, 255],
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
      } else if ((manifestData as any).data && (manifestData as any).data.length > 0) {
        const tableData = (manifestData as any).data.map((item: any, idx: number) => {
          // Formatear contactos: R: (remitente) D: (destinatario) con salto de línea
          let contactos = "";
          const remitentePhone =
            item.remitente_phone && item.remitente_phone.trim() !== ""
              ? item.remitente_phone
              : null;
          const destinatarioPhone =
            item.destinatario_phone && item.destinatario_phone.trim() !== ""
              ? item.destinatario_phone
              : null;

          if (remitentePhone) contactos += `R: ${remitentePhone}`;
          if (destinatarioPhone) {
            if (contactos) contactos += "\n";
            contactos += `D: ${destinatarioPhone}`;
          }
          if (!contactos) contactos = "N/A";

            // Formatear descripción: separar por "-" y agregar viñetas
            let formattedDescription = item.cargo_description || "N/A";
            if (formattedDescription !== "N/A" && formattedDescription.includes("-")) {
              const items = formattedDescription.split("-").map((i: string) => i.trim()).filter((i: string) => i.length > 0);
              if (items.length > 1) {
                formattedDescription = items.map((i: string) => `• ${i}`).join("\n");
              }
            }

            // normalizar estado de pago (soporta "PAGADO"/"PENDIENTE" y "PAID"/"PENDING")
            const rawStatus = (item.payment_status || "").toString().toUpperCase();
            const paymentStatus =
              rawStatus === "PAID" || rawStatus === "PAGADO"
                ? "PAGADO"
                : rawStatus === "PENDING" || rawStatus === "PENDIENTE"
                ? "PENDIENTE"
                : item.payment_status || "N/A";

            return [
              item.parcel_number || (idx + 1).toString(), // Usar parcel_number si existe, sino numeración por índice
              formattedDescription,
              item.remitente_nombre || "N/A",
              item.remitente_doc?.replace("1-", "DNI: ") || "N/A",
              item.destinatario_nombre || "N/A",
              item.destinatario_doc?.replace("1-", "DNI: ") || "N/A",
              contactos, // Mostrar teléfonos en formato R: D:
              item.amount ? `S/ ${Number(item.amount).toFixed(2)}` : "N/A",
              paymentStatus,
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
              "N°",
              "DESCRIPCIÓN",
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
            textColor: [255, 255, 255],
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
      // PASAJEROS: usar el mismo estilo que la tabla de carga y centrar correctamente
      if ((manifestData as any).data && (manifestData as any).data.length > 0) {
        const tableData = (manifestData as any).data.map((item: any, idx: number) => {
          // Vendedor: preferir seller_name, luego generated_by_username/ generated_by, fallback
          const sellerDisplay =
            item.seller_name ||
            (manifestData as any).generated_by_username ||
            (manifestData as any).generated_by ||
            "VENDEDOR";

          const identityLabel =
            item.document_type === "1"
              ? "DNI"
              : item.document_type === "2"
              ? "CE"
              : "PAS";

          // Nacionalidad: preferir passenger_country_name, luego code -> nombre, sino N/A
          let nationality = "N/A";
          if (item.passenger_country_name) {
            nationality = item.passenger_country_name;
          } else if (item.passenger_country_code) {
            nationality =
              item.passenger_country_code === "PE"
                ? "PERÚ"
                : item.passenger_country_code;
          }

          return [
            (idx + 1).toString(),
            item.full_name || "N/A",
            `${identityLabel}: ${item.document_number || "N/A"}`,
            nationality,
            sellerDisplay,
            item.seat_number || "N/A",
            item.boarding_port || "N/A",
            item.destination_port || "N/A",
            item.phone || "N/A",
          ];
        });

        // Configurar anchos de columna optimizados para mejor visualización
        const initialColWidths = [12, 48, 26, 24, 18, 22, 20, 20, 18];
        const availableWidth = pageWidth - margin * 2;
        let totalTableWidth = initialColWidths.reduce((s, w) => s + w, 0);
        let adjustedColWidths = [...initialColWidths];

        if (totalTableWidth > availableWidth) {
          // Escalar hacia abajo proporcionalmente cuando excede el área imprimible
          const scale = availableWidth / totalTableWidth;
          adjustedColWidths = initialColWidths.map((w) =>
            Math.floor(w * scale)
          );
          // corregir posible exceso por redondeo
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
          // Si hay espacio, ampliar moderadamente la tabla (hasta 30%) para buena legibilidad
          const expansionFactor = 1.30; // hasta +30%
          const desiredWidth = Math.round(totalTableWidth * expansionFactor);
          let extra = Math.max(0, desiredWidth - totalTableWidth);
          adjustedColWidths = [...initialColWidths];
          const expandOrder = [1, 5, 3, 2, 4, 6, 7, 8, 0];
          let idx = 0;
          while (extra > 0) {
            const column = expandOrder[idx % expandOrder.length];
            adjustedColWidths[column] = adjustedColWidths[column] + 1;
            extra -= 1;
            idx += 1;
          }
          totalTableWidth = adjustedColWidths.reduce((s, w) => s + w, 0);
        }

        // Centrar la tabla incluso si esto coloca parte fuera del margen del PDF
        const leftMargin = (pageWidth - totalTableWidth) / 2;

        const passengerColumnStyles: any = {
          0: { halign: "center", cellWidth: adjustedColWidths[0] },
          1: { halign: "left", cellWidth: adjustedColWidths[1] },
          2: {
            halign: "center",
            cellWidth: adjustedColWidths[2],
            overflow: "ellipsize",
          },
          3: { halign: "center", cellWidth: adjustedColWidths[3] },
          4: { halign: "center", cellWidth: adjustedColWidths[4] },
          5: { halign: "center", cellWidth: adjustedColWidths[5] }, // ASIENTO sin overflow
          6: { halign: "center", cellWidth: adjustedColWidths[6] },
          7: { halign: "center", cellWidth: adjustedColWidths[7] },
          8: { halign: "center", cellWidth: adjustedColWidths[8] },
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
          styles: {
            fontSize: 9.5,
            cellPadding: 3,
            halign: "center",
            valign: "middle",
          },
          headStyles: {
            fillColor: [100, 100, 100], // Mismo color gris que la tabla de carga
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9.5,
            halign: "center",
            valign: "middle",
          },
          columnStyles: passengerColumnStyles,
          margin: { left: leftMargin, right: leftMargin },
          tableWidth: "auto",
          theme: "grid",
        });
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

    // Observaciones
    if (manifestData.observations) {
      const finalY = (pdf as any).lastAutoTable?.finalY || currentY + 20;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("Observaciones:", margin, finalY + 10);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(
        pdf.splitTextToSize(String(manifestData.observations), pageWidth - margin * 2),
        margin,
        finalY + 16
      );
    }

    const blob = pdf.output("blob");
    return blob;
  };

  const handleDownloadPDF = async () => {
    try {
      const blob = await generatePDFBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `manifiesto-${manifestData.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF descargado correctamente");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Error al descargar el PDF");
    }
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    const w = window.open(pdfUrl);
    w?.focus();
    w?.print();
  };

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" maxWidth="6xl">
      <div className="space-y-4">
        <div className="flex items-start justify-between pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Vista Previa -{" "}
              {manifestData.manifest_type === "CARGO"
                ? "Manifiesto de Carga"
                : "Manifiesto de Pasajeros"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              N° {manifestData.id}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg" style={{ height: "70vh" }}>
          {isGeneratingPDF ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">
                  Generando previsualización del PDF...
                </p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full rounded-lg border-0"
              title="Previsualización del Manifiesto"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">
                Error al generar la previsualización
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={handleClose}>
            Cerrar
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={!pdfUrl}
            className="flex items-center space-x-2"
          >
            <PrinterIcon className="w-4 h-4" />
            <span>Imprimir</span>
          </Button>
          <Button
            variant="primary"
            onClick={handleDownloadPDF}
            className="flex items-center space-x-2"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            <span>Descargar PDF</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
