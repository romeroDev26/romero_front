import jsPDF from 'jspdf';

interface DrawLogoOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  padding?: number;
}

const resolveLogoUrl = (url: string): string => {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return `/__image-proxy?url=${encodeURIComponent(url)}`;
  }

  return url;
};

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar el logo'));
    img.src = resolveLogoUrl(url);
  });

const imageToPngDataUrl = (img: HTMLImageElement): string => {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  if (!width || !height) {
    throw new Error('Dimensiones de logo inválidas');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('No se pudo obtener contexto de canvas');
  }

  context.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/png');
};

export const drawLogoInPdf = async (
  pdf: jsPDF,
  logoUrl: string,
  options: DrawLogoOptions
): Promise<boolean> => {
  if (!logoUrl || typeof logoUrl !== 'string' || logoUrl.trim() === '') {
    return false;
  }

  try {
    const img = await loadImage(logoUrl);
    const dataUrl = imageToPngDataUrl(img);

    const padding = options.padding ?? 0;
    const maxWidth = Math.max(1, options.width - padding * 2);
    const maxHeight = Math.max(1, options.height - padding * 2);

    const ratio = img.width / img.height;
    let drawWidth = maxWidth;
    let drawHeight = drawWidth / ratio;

    if (drawHeight > maxHeight) {
      drawHeight = maxHeight;
      drawWidth = drawHeight * ratio;
    }

    const dx = options.x + (options.width - drawWidth) / 2;
    const dy = options.y + (options.height - drawHeight) / 2;

    pdf.addImage(dataUrl, 'PNG', dx, dy, drawWidth, drawHeight);
    return true;
  } catch {
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
