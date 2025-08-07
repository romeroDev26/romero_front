import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  EyeIcon,
  UsersIcon,
  CubeIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { Ship } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { DataTable } from '../../../components/common/DataTable';
// import ManifestDetails from '../components/ManifestDetails';
import { manifestService } from '../services/manifest.service';
import { Manifest } from '../types/manifest.types';

// Tipo para viajes agrupados
interface GroupedTrip {
  trip_id: number;
  route_name: string;
  vessel_name: string;
  departure_datetime: string;
  passenger_manifest?: Manifest;
  cargo_manifest?: Manifest;
  created_at: string;
}
import { useBranchOfficesData } from '../../fluvial/hooks/useBranchOfficesData';
import { BranchOffice } from '../../../types';

export const ManifestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState<BranchOffice | null>(null);
  const [showBranchSelector, setShowBranchSelector] = useState(false);

  // Hook para obtener sucursales
  const { data: branches, isLoading: isLoadingBranches } = useBranchOfficesData();

  // Cargar sucursal seleccionada desde localStorage al inicio
  useEffect(() => {
    const savedBranch = localStorage.getItem('selectedSalesBranch');
    if (savedBranch) {
      try {
        const branch: BranchOffice = JSON.parse(savedBranch);
        setSelectedBranch(branch);
      } catch (error) {
        console.error('Error parsing saved branch:', error);
        localStorage.removeItem('selectedSalesBranch');
      }
    }
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = () => {
      if (showBranchSelector) {
        setShowBranchSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBranchSelector]);

  // Query para obtener la lista de manifiestos por sucursal
  const { 
    data: manifests = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['manifests', selectedBranch?.id],
    queryFn: () => {
      if (!selectedBranch?.id) {
        return [];
      }
      return manifestService.getManifestsByBranchOffice(selectedBranch.id);
    },
    enabled: !!selectedBranch?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1
  });

  const handleBranchChange = (branch: BranchOffice) => {
    setSelectedBranch(branch);
    localStorage.setItem('selectedSalesBranch', JSON.stringify(branch));
    setShowBranchSelector(false);
  };

  const handleViewDetails = (trip: GroupedTrip) => {
    // Navegar a la página de manifiestos del viaje
    navigate(`/fluvial/operations/manifests/trip/${trip.trip_id}`);
  };

  // Función para agrupar manifiestos por viaje
  const groupManifestsByTrip = (manifests: Manifest[]) => {
    const grouped = new Map<number, {
      trip_id: number;
      route_name: string;
      vessel_name: string;
      departure_datetime: string;
      passenger_manifest?: Manifest;
      cargo_manifest?: Manifest;
      created_at: string;
    }>();

    manifests.forEach(manifest => {
      if (!grouped.has(manifest.trip_id)) {
        grouped.set(manifest.trip_id, {
          trip_id: manifest.trip_id,
          route_name: manifest.route_name || 'Sin ruta',
          vessel_name: manifest.vessel_name || 'Sin embarcación',
          departure_datetime: manifest.departure_datetime || manifest.created_at,
          created_at: manifest.created_at,
        });
      }

      const group = grouped.get(manifest.trip_id)!;
      if (manifest.manifest_type === 'PASSENGER') {
        group.passenger_manifest = manifest;
      } else if (manifest.manifest_type === 'CARGO') {
        group.cargo_manifest = manifest;
      }
    });

    return Array.from(grouped.values());
  };

  // Agrupar los manifiestos por viaje
  const groupedTrips = manifests ? groupManifestsByTrip(manifests) : [];

  // Columnas para viajes agrupados
  const columns = [
    {
      key: 'trip_info',
      header: 'Viaje',
      accessor: (trip: GroupedTrip) => (
        <div className="flex flex-col">
          <div className="flex items-center space-x-2 mb-1">
            <MapPinIcon className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-900">{trip.route_name}</span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <CalendarDaysIcon className="w-3 h-3" />
              <span>{new Date(trip.departure_datetime).toLocaleDateString('es-ES')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-3 h-3" />
              <span>{new Date(trip.departure_datetime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'vessel',
      header: 'Embarcación',
      accessor: (trip: GroupedTrip) => (
        <div className="flex items-center space-x-2">
          <Ship className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-gray-900">{trip.vessel_name}</span>
        </div>
      )
    },
    {
      key: 'manifests',
      header: 'Manifiestos',
      accessor: (trip: GroupedTrip) => (
        <div className="flex space-x-2">
          {trip.passenger_manifest ? (
            <div className="flex items-center space-x-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs">
              <UsersIcon className="w-3 h-3" />
              <span>Pasajeros ({trip.passenger_manifest.total_passengers})</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-xs">
              <UsersIcon className="w-3 h-3" />
              <span>Sin gen.</span>
            </div>
          )}
          {trip.cargo_manifest ? (
            <div className="flex items-center space-x-1 bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs">
              <CubeIcon className="w-3 h-3" />
              <span>Carga ({trip.cargo_manifest.total_cargo_weight_kg} Kg)</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-xs">
              <CubeIcon className="w-3 h-3" />
              <span>Sin gen.</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Estado',
      accessor: (trip: GroupedTrip) => {
        const hasPassenger = !!trip.passenger_manifest;
        const hasCargo = !!trip.cargo_manifest;
        
        if (hasPassenger && hasCargo) {
          return (
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
              Completo
            </span>
          );
        } else if (hasPassenger || hasCargo) {
          return (
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
              Parcial
            </span>
          );
        } else {
          return (
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
              Sin gen.
            </span>
          );
        }
      }
    },
    {
      key: 'created_at',
      header: 'Fecha Creación',
      accessor: (trip: GroupedTrip) => (
        <span className="text-sm text-gray-600">
          {new Date(trip.created_at).toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      )
    }
  ];

  // const actions = [
  //   {
  //     label: 'Ver Detalles',
  //     icon: EyeIcon,
  //     onClick: (manifest: Manifest) => handleViewDetails(manifest),
  //     variant: 'secondary' as const
  //   }
  // ];

  // Si no hay sucursal seleccionada
  if (!selectedBranch && !isLoadingBranches) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <BuildingOfficeIcon className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-yellow-800 font-medium text-lg mb-2">Selecciona una Sucursal</h3>
          <p className="text-yellow-600 mb-4">
            Para ver los manifiestos, primero debes seleccionar una sucursal.
          </p>
          <div className="space-y-2 max-w-md mx-auto">
            {branches?.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleBranchChange(branch)}
                className="w-full px-4 py-2 text-left hover:bg-yellow-100 rounded-lg transition-colors border border-yellow-200"
              >
                <span className="font-medium">{branch.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error al cargar manifiestos</h3>
          <p className="text-red-600 text-sm mt-1">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            className="mt-3"
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manifiestos</h1>
              <p className="text-gray-600">Gestión de manifiestos de pasajeros y carga</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Selector de Sucursal */}
            <div className="flex items-center space-x-2">
              <BuildingOfficeIcon className="w-5 h-5 text-gray-500" />
              <div className="relative">
                <button
                  onClick={() => setShowBranchSelector(!showBranchSelector)}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {selectedBranch?.name || 'Seleccionar Sucursal'}
                  </span>
                  <AdjustmentsHorizontalIcon className="w-4 h-4 text-gray-500" />
                </button>
                
                {showBranchSelector && branches && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-2 border-b border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Seleccionar Sucursal
                      </p>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {branches.map((branch) => (
                        <button
                          key={branch.id}
                          onClick={() => handleBranchChange(branch)}
                          className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${
                            selectedBranch?.id === branch.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{branch.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Manifiestos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Manifiestos - {selectedBranch?.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {manifests.length} manifiestos encontrados
              </p>
            </div>
            
            {selectedBranch && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <BuildingOfficeIcon className="w-4 h-4" />
                <span>Sucursal activa: {selectedBranch.name}</span>
              </div>
            )}
          </div>
        </div>

        <DataTable<GroupedTrip>
          data={groupedTrips}
          columns={columns}
          keyExtractor={(trip) => trip.trip_id.toString()}
          isLoading={isLoading}
          emptyMessage="No hay manifiestos generados"
          customActions={(trip) => (
            <button
              onClick={() => handleViewDetails(trip)}
              className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
            >
              <EyeIcon className="w-4 h-4 mr-1" />
              Ver Detalles
            </button>
          )}
        />
      </div>
    </div>
  );
};
