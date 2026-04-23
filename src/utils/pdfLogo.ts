import jsPDF from 'jspdf';
import api from '../config/api';

interface DrawLogoOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  padding?: number;
}

/**
 * Convierte un Blob de imagen en un data URL base64.
 */
const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Error leyendo blob de imagen'));
    reader.readAsDataURL(blob);
  });

/**
 * Obtiene una imagen como data URL base64.
 *
 * Estrategia con fallback escalonado:
 * 1. Si se proporciona companyId, intenta GET /companies/{id}/logo
 *    → el backend hace proxy desde Bunny (sin CORS para el navegador)
 * 2. Intenta GET /files/proxy-image?url=... (proxy genérico del backend)
 * 3. Fetch directo (funciona en dev con proxy Vite, o si Bunny lo permite)
 */
const fetchImageAsDataUrl = async (
  imageUrl: string,
  companyId?: number
): Promise<string> => {
  // --- Estrategia 1: proxy específico de companies ---
  if (companyId != null) {
    try {
      const response = await api.get<Blob>(`/companies/${companyId}/logo`, {
        responseType: 'blob',
      });
      if (response.data && response.data.size > 0) {
        return blobToDataUrl(response.data);
      }
    } catch (e1) {
      console.warn('[pdfLogo] /companies/{id}/logo no disponible, intentando proxy genérico:', e1);
    }
  }

  // --- Estrategia 2: proxy genérico del backend ---
  try {
    const response = await api.get<Blob>('/files/proxy-image', {
      params: { url: imageUrl },
      responseType: 'blob',
    });
    if (response.data && response.data.size > 0) {
      return blobToDataUrl(response.data);
    }
  } catch (e2) {
    console.warn('[pdfLogo] Proxy genérico falló, intentando fetch directo:', e2);
  }

  // --- Estrategia 3: fetch directo ---
  const directUrl = import.meta.env.DEV
    ? `/__image-proxy?url=${encodeURIComponent(imageUrl)}`
    : imageUrl;

  const res = await fetch(directUrl, { mode: 'cors' });
  if (!res.ok) throw new Error(`HTTP ${res.status} cargando logo`);
  const blob = await res.blob();
  return blobToDataUrl(blob);
};

/**
 * Calcula las dimensiones de dibujo manteniendo el aspect ratio.
 */
const calcDrawDimensions = (
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number,
  maxHeight: number
): { w: number; h: number } => {
  const ratio = naturalWidth / naturalHeight;
  let w = maxWidth;
  let h = w / ratio;
  if (h > maxHeight) {
    h = maxHeight;
    w = h * ratio;
  }
  return { w, h };
};

export const drawLogoInPdf = async (
  pdf: jsPDF,
  logoUrl: string,
  options: DrawLogoOptions,
  companyId?: number
): Promise<boolean> => {
  if (!logoUrl || typeof logoUrl !== 'string' || logoUrl.trim() === '') {
    return false;
  }

  try {
    const dataUrl = await fetchImageAsDataUrl(logoUrl, companyId);

    // Necesitamos las dimensiones naturales: crear un Image temporal
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('No se pudo cargar dimensiones del logo'));
      el.src = dataUrl;
    });

    const padding = options.padding ?? 0;
    const maxWidth = Math.max(1, options.width - padding * 2);
    const maxHeight = Math.max(1, options.height - padding * 2);

    const { w: drawWidth, h: drawHeight } = calcDrawDimensions(
      img.naturalWidth || img.width,
      img.naturalHeight || img.height,
      maxWidth,
      maxHeight
    );

    const dx = options.x + (options.width - drawWidth) / 2;
    const dy = options.y + (options.height - drawHeight) / 2;

    pdf.addImage(dataUrl, 'PNG', dx, dy, drawWidth, drawHeight);
    return true;
  } catch (err) {
    console.warn('[pdfLogo] No se pudo cargar el logo:', err);
    return false;
  }
};

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
