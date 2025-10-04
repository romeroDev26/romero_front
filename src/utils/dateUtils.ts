/**
 * Utilidades para manejo de fechas en zona horaria local
 */

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD en la zona horaria local
 * Evita problemas de conversión UTC que pueden causar que la fecha sea incorrecta
 */
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Obtiene la fecha de hace N días en formato YYYY-MM-DD en zona horaria local
 */
export const getDaysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return getLocalDateString(date);
};

/**
 * Obtiene la fecha de hace N meses en formato YYYY-MM-DD en zona horaria local
 */
export const getMonthsAgo = (months: number): string => {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return getLocalDateString(date);
};

/**
 * Convierte una fecha string en formato YYYY-MM-DD a un objeto Date en zona horaria local
 */
export const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Incrementa una fecha en N días y retorna en formato YYYY-MM-DD
 */
export const addDays = (dateString: string, days: number): string => {
  const date = parseLocalDate(dateString);
  date.setDate(date.getDate() + days);
  return getLocalDateString(date);
};

/**
 * Incrementa una fecha en N meses y retorna en formato YYYY-MM-DD
 */
export const addMonths = (dateString: string, months: number): string => {
  const date = parseLocalDate(dateString);
  date.setMonth(date.getMonth() + months);
  return getLocalDateString(date);
};

/**
 * Verifica si una fecha es hoy
 */
export const isToday = (dateString: string): boolean => {
  return dateString === getLocalDateString();
};

/**
 * Obtiene el primer día del mes actual
 */
export const getStartOfMonth = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

/**
 * Obtiene el último día del mes actual
 */
export const getEndOfMonth = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthStr = String(month + 1).padStart(2, '0');
  return `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
};
