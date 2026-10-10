/** Trip search returns Lima wall time without an offset; never interpret it as browser time. */
export function tripDateTime(value: string): Date {
  return new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value.replace(' ', 'T')}-05:00`);
}
