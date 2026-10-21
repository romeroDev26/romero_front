import axios from 'axios';

export function axiosErrorDetail(error: unknown, fallback?: string): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (typeof first === 'object' && first && 'msg' in first) {
        return String((first as { msg: string }).msg);
      }
    }
    if (error.response?.status === 403) {
      return 'No tienes permiso para esta operación.';
    }
    if (error.response?.status === 503) {
      return 'La reprogramación pendiente aún no está habilitada en el servidor. Avise a sistemas.';
    }
  }
  return fallback || 'Ocurrió un error al comunicarse con el servidor.';
}
