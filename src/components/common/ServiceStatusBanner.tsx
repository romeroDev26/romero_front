import React from 'react';
import {
  ExclamationTriangleIcon,
  CircleStackIcon,
  SignalSlashIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';
import { useSystemStatusStore, FailedService } from '@/stores/systemStatus.store';

const config: Record<
  NonNullable<FailedService>,
  {
    label: string;
    message: string;
    bg: string;
    icon: React.ElementType;
  }
> = {
  api: {
    label: 'Servidor no disponible',
    message:
      'El sistema principal no responde. Algunas funciones pueden no operar correctamente hasta que se restablezca el servicio.',
    bg: 'bg-red-600',
    icon: ServerIcon,
  },
  database: {
    label: 'Base de datos en mantenimiento',
    message:
      'La base de datos no está respondiendo. El sistema está temporalmente inoperante. Por favor, espere mientras resolvemos el problema.',
    bg: 'bg-amber-600',
    icon: CircleStackIcon,
  },
  network: {
    label: 'Problema de conectividad',
    message:
      'No se puede establecer conexión con los servicios del sistema. Verifique su conexión a internet o intente nuevamente en unos momentos.',
    bg: 'bg-red-600',
    icon: SignalSlashIcon,
  },
};

interface ServiceStatusBannerProps {
  compact?: boolean;
}

export const ServiceStatusBanner: React.FC<ServiceStatusBannerProps> = ({ compact = false }) => {
  const isReachable = useSystemStatusStore((s) => s.isReachable);
  const failedService = useSystemStatusStore((s) => s.failedService);

  // No mostrar mientras no se haya determinado el estado inicial
  if (isReachable === null) return null;

  // Todo en orden
  if (isReachable === true) return null;

  // Caído: elegir configuración según servicio fallido
  const key = failedService || 'api';
  const { label, message, bg, icon: Icon } = config[key];

  if (compact) {
    return (
      <div
        className={`${bg} text-white px-3 py-2 rounded-lg shadow-sm`}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold leading-4">{label}</p>
            <p className="text-[11px] opacity-90 leading-4 truncate">{message}</p>
          </div>
          <ExclamationTriangleIcon className="w-4 h-4 opacity-80 flex-shrink-0" aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${bg} text-white px-4 py-3 shadow-sm`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3 max-w-7xl mx-auto">
        <div className="flex-shrink-0 mt-0.5">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-5">{label}</p>
          <p className="text-sm opacity-90 leading-5 mt-0.5">{message}</p>
        </div>
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="w-5 h-5 opacity-80" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};

export default ServiceStatusBanner;
