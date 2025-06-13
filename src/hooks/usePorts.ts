// src/hooks/usePorts.ts
import { useState, useEffect } from 'react';
import { portsConfigService } from '../services/ports.cities.service';
import { Port } from '../types';

interface UsePortsReturn {
  ports: Port[];
  loading: boolean;
  error: string | null;
}

export const usePorts = (companyId: number): UsePortsReturn => {
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPorts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await portsConfigService.getAll({ 
          company_id: companyId,
          limit: 100,
          is_active: true 
        });
        setPorts(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Error al cargar los puertos');
        console.error('Error loading ports:', err);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      loadPorts();
    }
  }, [companyId]);

  return { ports, loading, error };
};