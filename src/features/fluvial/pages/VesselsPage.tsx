// src/features/fluvial/pages/VesselsPage.tsx
import React, { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, PresentationChartBarIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { useConfirmDelete } from '../../../components/common/DataTable'; // Este hook es útil aquí también
import { Vessel } from '../../../types';
import {
  useVessels,
  useVessel,
  useDeleteVessel,
} from '../hooks/useVesselsData';
import { VesselWithConfigurations } from '../../../services/vessels.service';

// Importar los nuevos componentes
import { VesselCard } from '../components/vessels/VesselCard';
// Asumiendo que has movido los modales a sus propios archivos
import { VesselFormModal } from '../components/vessels/VesselFormModal'; 
import { SeatConfigModal } from '../components/vessels/SeatConfigModal.tsx';

export const VesselsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  // Estados para controlar los modales
  const [isVesselModalOpen, setIsVesselModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<VesselWithConfigurations | undefined>();

  // ID para el hook useVessel (para obtener detalles y configuraciones)
  const [configuringVesselId, setConfiguringVesselId] = useState<number | null>(null);

  // Hooks de React Query
  const { data: vessels = [], isLoading, error } = useVessels(showOnlyActive);
  const { data: vesselForConfig } = useVessel(configuringVesselId);
  const deleteVesselMutation = useDeleteVessel();
  
  // Hook para la confirmación de borrado
  const handleDeleteVessel = useConfirmDelete(
    (vessel: Vessel) => deleteVesselMutation.mutate(vessel.id),
    (vessel: Vessel) => `¿Está seguro de desactivar la embarcación "${vessel.name}"? Esta acción no se puede deshacer.`
  );
  
  // Lógica de filtrado
  const filteredVessels = vessels.filter(vessel =>
    vessel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vessel.registration_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers para abrir modales
  const handleOpenNewVesselModal = () => {
    setSelectedVessel(undefined);
    setIsVesselModalOpen(true);
  };
  
  const handleEditVessel = (vessel: VesselWithConfigurations) => {
    setSelectedVessel(vessel);
    setIsVesselModalOpen(true);
  };

  const handleConfigureVessel = (vessel: VesselWithConfigurations) => {
    // Usamos el hook useVessel para cargar los detalles completos, incluyendo seat_configurations.
    setConfiguringVesselId(vessel.id); 
    setIsConfigModalOpen(true);
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }
  
  if (error) {
    return <div className="text-center py-12 text-red-600">Error al cargar las embarcaciones.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Embarcaciones</h1>
          <p className="text-gray-600">Administra la flota de embarcaciones de la compañía.</p>
        </div>
      </div>

      {/* Barra de filtros y acciones */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center p-4 bg-white rounded-lg shadow-sm border">
        <div className="relative flex-grow w-full sm:w-auto sm:max-w-xs">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm p-2"
            placeholder="Buscar por nombre o matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center whitespace-nowrap text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
            />
            Mostrar solo activas
          </label>
          <Button onClick={handleOpenNewVesselModal} className="flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Nueva Embarcación
          </Button>
        </div>
      </div>

      {/* Grilla de embarcaciones */}
      {filteredVessels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVessels.map((vessel) => (
            <VesselCard
              key={vessel.id}
              vessel={vessel as VesselWithConfigurations} // Aseguramos el tipo
              onEdit={handleEditVessel}
              onConfigure={handleConfigureVessel}
              onDelete={handleDeleteVessel}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg border-dashed border-2 border-gray-300">
          <PresentationChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron embarcaciones</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Prueba con otro término de búsqueda.' : 'Crea una nueva embarcación para empezar.'}
          </p>
        </div>
      )}

      {/* Renderizado de los modales */}
      {isVesselModalOpen && (
        <VesselFormModal
          isOpen={isVesselModalOpen}
          onClose={() => setIsVesselModalOpen(false)}
          vessel={selectedVessel}
        />
      )}
      
      {isConfigModalOpen && (
         <SeatConfigModal
            isOpen={isConfigModalOpen && !!vesselForConfig}
            onClose={() => {
              setIsConfigModalOpen(false);
              setConfiguringVesselId(null);
            }}
            vessel={vesselForConfig ?? undefined}
        />
      )}
    </div>
  );
};