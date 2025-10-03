import { useState, useEffect } from 'react';
import { productsServicesService } from '../../../services/products-services.service';
import { ProductService } from '../../../types';
import { toast } from 'react-toastify';

export const useProductServices = () => {
  const [services, setServices] = useState<ProductService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError(null);
      try {
        // Obtener solo servicios activos
        const data = await productsServicesService.getServices({ is_active: true });
        setServices(data);
      } catch (err) {
        const errorMessage = 'Error al cargar los servicios';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return { services, loading, error };
};
