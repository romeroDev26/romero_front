import React from "react";
import { Manifest } from "../types/manifest.types";
import { generatePassengerManifestPDF } from "../services/manifestPdfGeneration.service";

interface ManifestPDFGeneratorProps {
  manifestData: Manifest;
}

export const ManifestPDFGenerator: React.FC<ManifestPDFGeneratorProps> = ({
  manifestData,
}) => {
  const handleGeneratePDF = async () => {
    const { pdf } = await generatePassengerManifestPDF(manifestData);

    const blob = new Blob([pdf.output("blob")], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const handleDownloadPDF = async () => {
    const { pdf } = await generatePassengerManifestPDF(manifestData);
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

export { generatePassengerManifestPDF } from "../services/manifestPdfGeneration.service";
