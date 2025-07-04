// src/features/fluvial/components/vessels/VesselFormModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/common/Modal';
import { Input } from '../../../../components/common/Input';
import { Button } from '../../../../components/common/Button';
import { Vessel } from '../../../../types';
import { useCreateVessel, useUpdateVessel } from '../../hooks/useVesselsData';
import { 
  VesselCreateData, 
  vesselHelpers,
  vesselValidations 
} from '../../../../services/vessels.service';

// Tipo para el formulario con capacidades como string
type VesselFormData = Omit<VesselCreateData, 'capacity_weight_kg' | 'capacity_packages' | 'capacity_passengers'> & {
  capacity_weight_kg: string;
  capacity_packages: string;
  capacity_passengers: string;
};

interface VesselFormProps {
  isOpen: boolean;
  onClose: () => void;
  vessel?: Vessel; // El vessel que se está editando
}

export const VesselFormModal: React.FC<VesselFormProps> = ({ isOpen, onClose, vessel }) => {
  const createVesselMutation = useCreateVessel();
  const updateVesselMutation = useUpdateVessel();

  const getInitialFormData = (): VesselFormData => ({
    registration_number: '',
    name: '',
    capacity_weight_kg: '0',
    capacity_packages: '0',
    capacity_passengers: '0',
    company_id: vesselHelpers.getCurrentCompanyId(),
    is_active: true
  });

  const [formData, setFormData] = useState<VesselFormData>(getInitialFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (vessel) {
        // Editando una embarcación existente - convertir números a strings
        setFormData({
          registration_number: vessel.registration_number,
          name: vessel.name,
          capacity_weight_kg: String(vessel.capacity_weight_kg || 0),
          capacity_packages: String(vessel.capacity_packages || 0),
          capacity_passengers: String(vessel.capacity_passengers || 0),
          company_id: vessel.company_id || vesselHelpers.getCurrentCompanyId(),
          is_active: vessel.is_active
        });
      } else {
        // Creando una nueva embarcación
        setFormData({
          ...getInitialFormData(),
          registration_number: vesselHelpers.generateRegistrationNumber(), // Matrícula automática
        });
      }
      setErrors({}); // Limpiar errores al abrir el modal
    }
  }, [vessel, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // Para campos de capacidad, solo permitir números
    if (type === 'text' && name.startsWith('capacity_') && !/^\d*$/.test(value)) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Función para limpiar el campo cuando tiene focus y vale 0
  const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '0') {
      setFormData(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };
  
  // Función para restaurar 0 si el campo está vacío al perder focus
  const handleNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      setFormData(prev => ({ ...prev, [e.target.name]: '0' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!vesselValidations.validateRegistrationNumber(formData.registration_number)) {
      newErrors.registration_number = 'Formato inválido (ej: IQ-12345-AB)';
    }
    
    // Convertir strings a números para validación
    const dataToValidate = {
      ...formData,
      capacity_passengers: parseInt(formData.capacity_passengers, 10) || 0,
      capacity_weight_kg: parseInt(formData.capacity_weight_kg, 10) || 0,
      capacity_packages: parseInt(formData.capacity_packages, 10) || 0,
    };
    
    const capacityErrors = vesselValidations.validateCapacities(dataToValidate);
    if (capacityErrors.length > 0) newErrors.capacity = capacityErrors.join(', ');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Convertir strings a números para envío
    const dataToSubmit: VesselCreateData = {
      ...formData,
      capacity_passengers: parseInt(formData.capacity_passengers, 10) || 0,
      capacity_weight_kg: parseInt(formData.capacity_weight_kg, 10) || 0,
      capacity_packages: parseInt(formData.capacity_packages, 10) || 0,
    };

    try {
      if (vessel) {
        // Lógica de actualización
        await updateVesselMutation.mutateAsync({ id: vessel.id, data: dataToSubmit });
      } else {
        // Lógica de creación
        await createVesselMutation.mutateAsync(dataToSubmit);
      }
      onClose(); // Cerrar el modal solo si la mutación tiene éxito
    } catch (error) {
      // El error ya se maneja en el hook (toast)
      console.error('Failed to save vessel:', error);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={vessel ? `Editar: ${vessel.name}` : 'Nueva Embarcación'}
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm text-gray-600 mb-4">
          Complete los detalles de la embarcación. La matrícula se genera automáticamente.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Input
            label="Número de Matrícula"
            name="registration_number"
            value={formData.registration_number}
            onChange={handleChange}
            error={errors.registration_number}
            placeholder="IQ-12345-AB"
            required
          />
          <Input
            label="Nombre de la Embarcación"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label="Capacidad Pasajeros"
            name="capacity_passengers"
            type="text"
            value={formData.capacity_passengers}
            onChange={handleChange}
            onFocus={handleNumberFocus}
            onBlur={handleNumberBlur}
            placeholder="0"
          />
          <Input
            label="Capacidad Peso (kg)"
            name="capacity_weight_kg"
            type="text"
            value={formData.capacity_weight_kg}
            onChange={handleChange}
            onFocus={handleNumberFocus}
            onBlur={handleNumberBlur}
            placeholder="0"
          />
          <Input
            label="Capacidad Bultos"
            name="capacity_packages"
            type="text"
            value={formData.capacity_packages}
            onChange={handleChange}
            onFocus={handleNumberFocus}
            onBlur={handleNumberBlur}
            placeholder="0"
          />
        </div>
        {errors.capacity && <p className="text-sm text-red-600 mt-1">{errors.capacity}</p>}

        <div className="flex items-center pt-2">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="ml-3 block text-sm font-medium text-gray-900">
            Embarcación activa
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            isLoading={createVesselMutation.isPending || updateVesselMutation.isPending}
          >
            {vessel ? 'Actualizar' : 'Crear Embarcación'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};