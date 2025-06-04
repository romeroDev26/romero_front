// src/features/fluvial/pages/SeatTypesPage.tsx
import React, { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, AdjustmentsHorizontalIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';
import { SeatType } from '../../../types';

// Datos estáticos simulados
const SEAT_TYPES_DATA: SeatType[] = [
  { 
    id: 1, 
    name: 'Económico', 
    code: 'ECO', 
    description: 'Asiento estándar con servicios básicos',
    price_multiplier: 1.0, 
    is_active: true, 
    display_order: 1,
    created_at: '2025-01-01T00:00:00Z'
  },
  { 
    id: 2, 
    name: 'Premium', 
    code: 'PREM', 
    description: 'Asiento premium con servicios adicionales y mayor comodidad',
    price_multiplier: 1.5, 
    is_active: true, 
    display_order: 2,
    created_at: '2025-01-01T00:00:00Z'
  },
  { 
    id: 3, 
    name: 'VIP', 
    code: 'VIP', 
    description: 'Asiento VIP con todos los servicios incluidos',
    price_multiplier: 2.0, 
    is_active: true, 
    display_order: 3,
    created_at: '2025-01-01T00:00:00Z'
  },
  { 
    id: 4, 
    name: 'Auxiliar', 
    code: 'AUX', 
    description: 'Asiento auxiliar con tarifa reducida',
    price_multiplier: 0.8, 
    is_active: true, 
    display_order: 4,
    created_at: '2025-01-01T00:00:00Z'
  },
  { 
    id: 5, 
    name: 'Estudiante', 
    code: 'EST', 
    description: 'Tarifa especial para estudiantes con descuento',
    price_multiplier: 0.7, 
    is_active: true, 
    display_order: 5,
    created_at: '2025-01-01T00:00:00Z'
  },
  { 
    id: 6, 
    name: 'Niño', 
    code: 'NIÑO', 
    description: 'Tarifa especial para menores de edad',
    price_multiplier: 0.5, 
    is_active: true, 
    display_order: 6,
    created_at: '2025-01-01T00:00:00Z'
  },
  { 
    id: 7, 
    name: 'Tercera Edad', 
    code: 'TE', 
    description: 'Tarifa preferencial para adultos mayores',
    price_multiplier: 0.6, 
    is_active: false, 
    display_order: 7,
    created_at: '2025-01-01T00:00:00Z'
  }
];

// Formulario de tipos de asiento
interface SeatTypeFormData {
  name: string;
  code: string;
  description: string;
  price_multiplier: number;
  is_active: boolean;
  display_order: number;
}

const SeatTypeFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SeatTypeFormData) => void;
  seatType?: SeatType;
}> = ({ isOpen, onClose, onSubmit, seatType }) => {
  const [formData, setFormData] = useState<SeatTypeFormData>({
    name: seatType?.name || '',
    code: seatType?.code || '',
    description: seatType?.description || '',
    price_multiplier: seatType?.price_multiplier || 1.0,
    is_active: seatType?.is_active ?? true,
    display_order: seatType?.display_order || 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={seatType ? 'Editar Tipo de Asiento' : 'Nuevo Tipo de Asiento'} maxWidth="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombre *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Premium, Económico"
            required
          />
          <Input
            label="Código *"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
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
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="1.0"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Factor que se multiplica por la tarifa base (1.0 = precio normal, 1.5 = 50% más caro, 0.8 = 20% descuento)
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Orden de Visualización
            </label>
            <input
              type="number"
              min="1"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
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

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            {seatType ? 'Actualizar' : 'Crear'} Tipo de Asiento
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Componente para mostrar el preview del precio
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

export const SeatTypesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [seatTypes, setSeatTypes] = useState<SeatType[]>(SEAT_TYPES_DATA);
  
  // Estados para modales
  const [showSeatTypeModal, setShowSeatTypeModal] = useState(false);
  const [editingSeatType, setEditingSeatType] = useState<SeatType | undefined>();

  // Filtrar tipos de asiento según búsqueda
  const filteredSeatTypes = seatTypes
    .filter(seatType =>
      seatType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seatType.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seatType.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.display_order - b.display_order);

  const handleCreateSeatType = (data: SeatTypeFormData) => {
    const newSeatType: SeatType = {
      id: Math.max(...seatTypes.map(st => st.id)) + 1,
      ...data,
      created_at: new Date().toISOString()
    };
    setSeatTypes([...seatTypes, newSeatType]);
    console.log('Tipo de asiento creado:', newSeatType);
  };

  const handleUpdateSeatType = (data: SeatTypeFormData) => {
    if (!editingSeatType) return;
    
    const updatedSeatTypes = seatTypes.map(seatType =>
      seatType.id === editingSeatType.id
        ? { ...seatType, ...data }
        : seatType
    );
    setSeatTypes(updatedSeatTypes);
    setEditingSeatType(undefined);
    console.log('Tipo de asiento actualizado:', data);
  };

  const handleDeleteSeatType = (seatTypeId: number) => {
    if (confirm('¿Está seguro de eliminar este tipo de asiento?')) {
      setSeatTypes(seatTypes.filter(seatType => seatType.id !== seatTypeId));
      console.log('Tipo de asiento eliminado:', seatTypeId);
    }
  };

  const handleToggleStatus = (seatTypeId: number) => {
    const updatedSeatTypes = seatTypes.map(seatType =>
      seatType.id === seatTypeId
        ? { ...seatType, is_active: !seatType.is_active }
        : seatType
    );
    setSeatTypes(updatedSeatTypes);
  };

  const handleMoveOrder = (seatTypeId: number, direction: 'up' | 'down') => {
    const index = seatTypes.findIndex(st => st.id === seatTypeId);
    if (index === -1) return;
    
    const newSeatTypes = [...seatTypes];
    const current = newSeatTypes[index];
    
    if (direction === 'up' && index > 0) {
      const previous = newSeatTypes[index - 1];
      current.display_order = previous.display_order;
      previous.display_order = current.display_order + 1;
    } else if (direction === 'down' && index < newSeatTypes.length - 1) {
      const next = newSeatTypes[index + 1];
      current.display_order = next.display_order;
      next.display_order = current.display_order - 1;
    }
    
    setSeatTypes(newSeatTypes);
  };

  // Calcular estadísticas
  const stats = {
    total: seatTypes.length,
    active: seatTypes.filter(st => st.is_active).length,
    inactive: seatTypes.filter(st => !st.is_active).length,
    withDiscount: seatTypes.filter(st => st.price_multiplier < 1.0).length,
    withSurcharge: seatTypes.filter(st => st.price_multiplier > 1.0).length
  };

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

      {/* Lista de tipos de asiento */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orden
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo de Asiento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Multiplicador
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Impacto en Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSeatTypes.map((seatType, index) => (
              <tr key={seatType.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{seatType.display_order}</span>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleMoveOrder(seatType.id, 'up')}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        title="Mover arriba"
                      >
                        <ArrowUpIcon className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleMoveOrder(seatType.id, 'down')}
                        disabled={index === filteredSeatTypes.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        title="Mover abajo"
                      >
                        <ArrowDownIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium text-gray-900">{seatType.name}</div>
                    {seatType.description && (
                      <div className="text-sm text-gray-500">{seatType.description}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {seatType.code}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">
                    x{seatType.price_multiplier.toFixed(1)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <PricePreview multiplier={seatType.price_multiplier} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleStatus(seatType.id)}
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                      seatType.is_active 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {seatType.is_active ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingSeatType(seatType);
                        setShowSeatTypeModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="Editar tipo de asiento"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSeatType(seatType.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Eliminar tipo de asiento"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSeatTypes.length === 0 && (
        <div className="text-center py-12">
          <AdjustmentsHorizontalIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tipos de asiento</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No se encontraron tipos de asiento que coincidan con la búsqueda' : 'Comience agregando un nuevo tipo de asiento'}
          </p>
        </div>
      )}

      {/* Modal */}
      <SeatTypeFormModal
        isOpen={showSeatTypeModal}
        onClose={() => setShowSeatTypeModal(false)}
        onSubmit={editingSeatType ? handleUpdateSeatType : handleCreateSeatType}
        seatType={editingSeatType}
      />
    </div>
  );
};