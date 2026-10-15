import { describe, it, expect } from 'vitest';
import { exportFileName } from './exportFileName';

describe('nombres de reportes', () => {
  it.each(['excel', 'pdf'] as const)('conserva ambos extremos del periodo en %s', format => {
    const extension = format === 'excel' ? 'xlsx' : 'pdf';
    expect(exportFileName({ category: 'branch_global', format, start_date: '2026-10-01', end_date: '2026-10-14', metadata: { report_title: `Reporte Global por Sucursal.${extension}` } }))
      .toBe(`Reporte Global por Sucursal_2026-10-01_al_2026-10-14.${extension}`);
  });
  it('evita fechas duplicadas y reemplaza caracteres no permitidos', () => {
    expect(exportFileName({ category: 'branch_global', format: 'excel', start_date: '2026-10-14', end_date: '2026-10-14', metadata: { report_title: 'Caja:NAUTA_2026-10-14_al_2026-10-14.xlsx' } }))
      .toBe('Caja_NAUTA_2026-10-14_al_2026-10-14.xlsx');
  });
});
