import type { ExportRequest } from '../types/exports';

export const exportFileName = (request: ExportRequest): string => {
  const extension = request.format === 'excel' ? 'xlsx' : 'pdf';
  const title = (request.metadata?.report_title || `Reporte_${request.category}`)
    .replace(/\.(xlsx|pdf|excel)$/i, '')
    .replace(/[<>:"/\\|?*\r\n]/g, '_');
  const hasDates = title.includes(request.start_date) && title.includes(request.end_date);
  return `${title}${hasDates ? '' : `_${request.start_date}_al_${request.end_date}`}.${extension}`;
};
