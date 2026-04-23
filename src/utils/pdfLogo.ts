import jsPDF from 'jspdf';

interface DrawLogoOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  padding?: number;
}

/**
 * Convierte un Blob en data URL base64.
 */
const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Error leyendo blob'));
    reader.readAsDataURL(blob);
  });

/**
 * Descarga la imagen desde la URL y la convierte en data URL base64.
 *
 * En desarrollo usa el proxy local de Vite (`/__image-proxy`) para
 * evitar el bloqueo CORS de Bunny en localhost.
 *
 * En producción hace fetch directo. Si Bunny bloquea el origen
 * (CORS), la función retorna null y se muestra el placeholder.
 * La solución permanente es configurar Bunny CDN para permitir
 * todos los subdominios de Vercel (`*.vercel.app`).
 */
const fetchImageAsDataUrl = async (imageUrl: string): Promise<string | null> => {
  const url = import.meta.env.DEV
    ? `/__image-proxy?url=${encodeURIComponent(imageUrl)}`
    : imageUrl;

  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return blobToDataUrl(blob);
  } catch {
    return null;
  }
};

/**
 * Dibuja el logo de la empresa en el PDF.
 * Si no se puede cargar la imagen (p. ej. CORS en dominios de staging),
 * retorna false y el llamador debe mostrar un placeholder.
 *
 * Uso:
 *   const ok = await drawLogoInPdf(pdf, company.logoUrl, { x, y, width, height });
 *   if (!ok) drawLogoPlaceholder(pdf, x, y, width, height);
 */
export const drawLogoInPdf = async (
  pdf: jsPDF,
  logoUrl: string,
  options: DrawLogoOptions
): Promise<boolean> => {
  if (!logoUrl || typeof logoUrl !== 'string' || !logoUrl.trim()) {
    return false;
  }

  try {
    const dataUrl = await fetchImageAsDataUrl(logoUrl);
    if (!dataUrl) return false;

    // Obtener dimensiones naturales a partir del data URL
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('No se pudo leer dimensiones del logo'));
      el.src = dataUrl;
    });

    const padding = options.padding ?? 0;
    const maxW = Math.max(1, options.width - padding * 2);
    const maxH = Math.max(1, options.height - padding * 2);

    const ratio = (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
    let drawW = maxW;
    let drawH = drawW / ratio;
    if (drawH > maxH) {
      drawH = maxH;
      drawW = drawH * ratio;
    }

    const dx = options.x + (options.width - drawW) / 2;
    const dy = options.y + (options.height - drawH) / 2;

    pdf.addImage(dataUrl, 'PNG', dx, dy, drawW, drawH);
    return true;
  } catch (err) {
    console.warn('[pdfLogo] No se pudo cargar el logo:', err);
    return false;
  }
};

/**
 * Dibuja un rectángulo con texto de placeholder cuando no hay logo disponible.
 */
export const drawLogoPlaceholder = (
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  text = 'LOGO'
): void => {
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(x, y, width, height);
  pdf.setFontSize(8);
  pdf.text(text, x + width / 2, y + height / 2, { align: 'center' });
};
