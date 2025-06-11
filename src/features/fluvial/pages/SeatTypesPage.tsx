// src/features/fluvial/pages/SeatTypesPage.tsx
import React, { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, AdjustmentsHorizontalIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';
import { DataTable, Column, useConfirmDelete } from '../../../components/common/DataTable';
import { SeatType } from '../../../types';
import {
  useSeatTypes,
  useCreateSeatType,
  useUpdateSeatType,
  useDeleteSeatType,
  useUpdateSeatTypeOrder
} from '../hooks/useSeatTypesData';
import { SeatTypeCreateData } from '../../../services/seat-types.service';

// ========================================
// FORMULARIO DE TIPOS DE ASIENTO
// ========================================
interface SeatTypeFormProps {
  isOpen: boolean;
  onClose: () => void;
  seatType?: SeatType;
}

const SeatTypeFormModal: React.FC<SeatTypeFormProps> = ({ isOpen, onClose, seatType }) => {
  const createSeatType = useCreateSeatType();
  const updateSeatType = useUpdateSeatType();
  
  const [formData, setFormData] = useState<SeatTypeCreateData>({
    name: '',
    code: '',
    description: '',
    price_multiplier: 1.0,
    display_order: 1,
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (seatType) {
      setFormData({
        name: seatType.name,
        code: seatType.code,
        description: seatType.description || '',
        price_multiplier: seatType.price_multiplier,
        display_order: seatType.display_order,
        is_active: seatType.is_active
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        price_multiplier: 1.0,
        display_order: 1,
        is_active: true
      });
    }
    setErrors({});
  }, [seatType, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'El código es requerido';
    } else if (formData.code.length > 10) {
      newErrors.code = 'El código debe tener máximo 10 caracteres';
    }
    
    if (formData.price_multiplier <= 0 || formData.price_multiplier > 10) {
      newErrors.price_multiplier = 'El multiplicador debe estar entre 0.1 y 10.0';
    }
    
    if (formData.display_order < 1) {
      newErrors.display_order = 'El orden debe ser mayor a 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (seatType) {
        await updateSeatType.mutateAsync({ id: seatType.id, data: formData });
      } else {
        await createSeatType.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      // Los errores ya se manejan en los hooks
    }
  };

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={seatType ? 'Editar Tipo de Asiento' : 'Nuevo Tipo de Asiento'} 
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombre *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            placeholder="Ej: Premium, Económico"
            required
          />
          <Input
            label="Código *"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            error={errors.code}
            placeholder="Ej: PREM, ECO"
            maxLength={10}
            required
          />
        </div>

        <Input
          label="Descripción"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descripción detallada del tipo de asiento"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Multiplicador de Precio *
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="10.0"
              value={formData.price_multiplier}
              onChange={(e) => setFormData({ ...formData, price_multiplier: parseFloat(e.target.value) || 1.0 })}
              className={`w-full p-2 border rounded-md ${
                errors.price_multiplier ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="1.0"
              required
            />
            {errors.price_multiplier && (
              <p className="mt-1 text-sm text-red-600">{errors.price_multiplier}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Factor que se multiplica por la tarifa base (1.0 = precio normal, 1.5 = 50% más caro, 0.8 = 20% descuento)
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Orden de Visualización *
            </label>
            <input
              type="number"
              min="1"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
              className={`w-full p-2 border rounded-md ${
                errors.display_order ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.display_order && (
              <p className="mt-1 text-sm text-red-600">{errors.display_order}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Orden en que aparece en las listas
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
            Tipo de asiento activo
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            isLoading={createSeatType.isPending || updateSeatType.isPending}
          >
            {seatType ? 'Actualizar' : 'Crear'} Tipo de Asiento
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ========================================
// COMPONENTE PARA MOSTRAR EL PREVIEW DEL PRECIO
// ========================================
const PricePreview: React.FC<{ multiplier: number; basePrice?: number }> = ({ multiplier, basePrice = 85.00 }) => {
  const finalPrice = basePrice * multiplier;
  const discount = basePrice - finalPrice;
  
  return (
    <div className="text-xs text-gray-600">
      {multiplier === 1.0 ? (
        <span>Precio normal</span>
      ) : multiplier > 1.0 ? (
        <span className="text-red-600">+S/ {(finalPrice - basePrice).toFixed(2)} (+{((multiplier - 1) * 100).toFixed(0)}%)</span>
      ) : (
        <span className="text-green-600">-S/ {Math.abs(discount).toFixed(2)} (-{((1 - multiplier) * 100).toFixed(0)}%)</span>
      )}
      <div className="text-gray-500">
        Base S/ {basePrice.toFixed(2)} → Final S/ {finalPrice.toFixed(2)}
      </div>
    </div>
  );
};

// ========================================
// COMPONENTE PRINCIPAL
// ========================================
export const SeatTypesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  
  // Estados para modales
  const [showSeatTypeModal, setShowSeatTypeModal] = useState(false);
  const [editingSeatType, setEditingSeatType] = useState<SeatType | undefined>();

  // Queries
  const { data: seatTypes = [], isLoading, error } = useSeatTypes(showOnlyActive);
  
  // Mutations
  const deleteSeatType = useDeleteSeatType();
  const updateSeatTypeOrder = useUpdateSeatTypeOrder();
  const updateSeatType = useUpdateSeatType();

  // Confirmación de eliminación
  const handleDeleteSeatType = useConfirmDelete(
    (seatType: SeatType) => deleteSeatType.mutate(seatType.id),
    (seatType: SeatType) => `¿Está seguro de desactivar el tipo de asiento ${seatType.name}? Esta acción puede afectar la venta de tickets con este tipo.`
  );

  // Filtrar tipos de asiento según búsqueda
  const filteredSeatTypes = seatTypes
    .filter(seatType =>
      seatType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seatType.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seatType.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.display_order - b.display_order);

  // Manejar cambio de estado
  const handleToggleStatus = async (seatType: SeatType) => {
    try {
      await updateSeatType.mutateAsync({ 
        id: seatType.id, 
        data: { is_active: !seatType.is_active } 
      });
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  // Manejar cambio de orden
  const handleMoveOrder = async (seatTypeId: number, direction: 'up' | 'down') => {
    const index = filteredSeatTypes.findIndex(st => st.id === seatTypeId);
    if (index === -1) return;
    
    const updatedSeatTypes = [...filteredSeatTypes];
    
    if (direction === 'up' && index > 0) {
      // Intercambiar con el anterior
      const temp = updatedSeatTypes[index].display_order;
      updatedSeatTypes[index].display_order = updatedSeatTypes[index - 1].display_order;
      updatedSeatTypes[index - 1].display_order = temp;
    } else if (direction === 'down' && index < updatedSeatTypes.length - 1) {
      // Intercambiar con el siguiente
      const temp = updatedSeatTypes[index].display_order;
      updatedSeatTypes[index].display_order = updatedSeatTypes[index + 1].display_order;
      updatedSeatTypes[index + 1].display_order = temp;
    } else {
      return; // No hay cambio
    }
    
    // Actualizar el orden en el backend
    const seatTypesToUpdate = updatedSeatTypes.map(st => ({
      id: st.id,
      display_order: st.display_order
    }));
    
    await updateSeatTypeOrder.mutateAsync({ seatTypes: seatTypesToUpdate });
  };

  // Calcular estadísticas
  const stats = {
    total: seatTypes.length,
    active: seatTypes.filter(st => st.is_active).length,
    inactive: seatTypes.filter(st => !st.is_active).length,
    withDiscount: seatTypes.filter(st => st.price_multiplier < 1.0).length,
    withSurcharge: seatTypes.filter(st => st.price_multiplier > 1.0).length
  };

  // Columnas para la tabla
  const columns: Column<SeatType>[] = [
    {
      key: 'order',
      header: 'Orden',
      accessor: (seatType) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{seatType.display_order}</span>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleMoveOrder(seatType.id, 'up')}
              disabled={filteredSeatTypes.findIndex(st => st.id === seatType.id) === 0}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              title="Mover arriba"
            >
              <ArrowUpIcon className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleMoveOrder(seatType.id, 'down')}
              disabled={filteredSeatTypes.findIndex(st => st.id === seatType.id) === filteredSeatTypes.length - 1}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              title="Mover abajo"
            >
              <ArrowDownIcon className="h-3 w-3" />
            </button>
          </div>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Tipo de Asiento',
      accessor: (seatType) => (
        <div>
          <div className="font-medium text-gray-900">{seatType.name}</div>
          {seatType.description && (
            <div className="text-sm text-gray-500">{seatType.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Código',
      accessor: (seatType) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {seatType.code}
        </span>
      ),
    },
    {
      key: 'multiplier',
      header: 'Multiplicador',
      accessor: (seatType) => (
        <div className="font-medium text-gray-900">
          x{seatType.price_multiplier.toFixed(1)}
        </div>
      ),
    },
    {
      key: 'price_impact',
      header: 'Impacto en Precio',
      accessor: (seatType) => <PricePreview multiplier={seatType.price_multiplier} />,
    },
    {
      key: 'status',
      header: 'Estado',
      accessor: (seatType) => (
        <button
          onClick={() => handleToggleStatus(seatType)}
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
            seatType.is_active 
              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
              : 'bg-red-100 text-red-800 hover:bg-red-200'
          }`}
        >
          {seatType.is_active ? 'Activo' : 'Inactivo'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tipos de Asiento</h1>
          <p className="text-gray-600">Gestiona los tipos de asiento y sus multiplicadores de precio</p>
        </div>
      </div>

      {/* Filtros y acciones */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4 items-center flex-grow">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              placeholder="Buscar tipos de asiento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <label className="flex items-center whitespace-nowrap">
            <input
              type="checkbox"
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
              className="mr-2"
            />
            Solo activos
          </label>
        </div>
        
        <Button
          onClick={() => {
            setEditingSeatType(undefined);
            setShowSeatTypeModal(true);
          }}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Tipo de Asiento
        </Button>
      </div>

      {/* Resumen de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <AdjustmentsHorizontalIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tipos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <AdjustmentsHorizontalIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <AdjustmentsHorizontalIcon className="h-8 w-8 text-gray-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactivos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <AdjustmentsHorizontalIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Con Descuento</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withDiscount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <AdjustmentsHorizontalIcon className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Con Recargo</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withSurcharge}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de tipos de asiento */}
      <DataTable
        data={filteredSeatTypes}
        columns={columns}
        isLoading={isLoading}
        error={error}
        onEdit={(seatType) => {
          setEditingSeatType(seatType);
          setShowSeatTypeModal(true);
        }}
        onDelete={handleDeleteSeatType}
        keyExtractor={(seatType) => seatType.id}
        emptyMessage="No se encontraron tipos de asiento"
      />

      {/* Modal */}
      <SeatTypeFormModal
        isOpen={showSeatTypeModal}
        onClose={() => {
          setShowSeatTypeModal(false);
          setEditingSeatType(undefined);
        }}
        seatType={editingSeatType}
      />
    </div>
  );
};