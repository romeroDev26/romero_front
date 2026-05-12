import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  EyeIcon,
  UsersIcon,
  CubeIcon,
  ChevronRightIcon,
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
  const [selectedBranch, setSelectedBranch] = useState<BranchOffice | null>(() => {
    const savedBranch = localStorage.getItem('selectedSalesBranch');
    if (savedBranch) {
      try {
        return JSON.parse(savedBranch) as BranchOffice;
      } catch (error) {
        console.error('Error parsing saved branch:', error);
        localStorage.removeItem('selectedSalesBranch');
        return null;
      }
    }
    return null;
  });
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const branchSelectorRef = useRef<HTMLDivElement>(null);
  const [mobileTab, setMobileTab] = useState<'all' | 'passenger' | 'cargo'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Hook para obtener sucursales
  const { data: branches, isLoading: isLoadingBranches } = useBranchOfficesData();

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!showBranchSelector) {
        return;
      }

      if (branchSelectorRef.current && !branchSelectorRef.current.contains(event.target as Node)) {
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
    setCurrentPage(1);
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
  const filteredTrips = groupedTrips.filter((trip) => {
    if (mobileTab === 'passenger') return !!trip.passenger_manifest;
    if (mobileTab === 'cargo') return !!trip.cargo_manifest;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTrips.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedTrips = filteredTrips.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [mobileTab]);

  const getTripStatus = (trip: GroupedTrip) => {
    const hasPassenger = !!trip.passenger_manifest;
    const hasCargo = !!trip.cargo_manifest;

    if (hasPassenger && hasCargo) {
      return {
        label: 'Completo',
        className: 'bg-[#e6f7e6] text-[#237804]',
      };
    }

    if (hasPassenger || hasCargo) {
      return {
        label: 'Parcial',
        className: 'bg-[#fffbe6] text-[#d48806]',
      };
    }

    return {
      label: 'Sin gen.',
      className: 'bg-[#f5f5f5] text-[#828282]',
    };
  };

  // Columnas para viajes agrupados
  const columns = [
    {
      key: 'trip_info',
      header: 'Viaje',
      accessor: (trip: GroupedTrip) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <MapPinIcon className="w-4 h-4 text-[#828282]" strokeWidth={1.5} />
            <span className="font-medium text-[#202020]">{trip.route_name}</span>
          </div>
          <div className="flex items-center gap-4 text-[13px] text-[#4d4d4d]">
            <div className="flex items-center gap-1">
              <CalendarDaysIcon className="w-3 h-3 text-[#828282]" strokeWidth={1.5} />
              <span>{new Date(trip.departure_datetime).toLocaleDateString('es-ES')}</span>
            </div>
            <div className="flex items-center gap-1">
              <ClockIcon className="w-3 h-3 text-[#828282]" strokeWidth={1.5} />
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
        <div className="flex items-center gap-2">
          <Ship className="w-4 h-4 text-[#1F4690]" strokeWidth={1.5} />
          <span className="font-medium text-[#202020]">{trip.vessel_name}</span>
        </div>
      )
    },
    {
      key: 'manifests',
      header: 'Manifiestos',
      accessor: (trip: GroupedTrip) => (
        <div className="flex gap-2">
          {trip.passenger_manifest ? (
            <div className="inline-flex items-center gap-1 bg-[#1F4690]/5 text-[#1F4690] px-2 py-1 rounded-[8px] text-[12px] font-medium">
              <UsersIcon className="w-3 h-3" strokeWidth={1.5} />
              <span>Pasajeros ({trip.passenger_manifest.total_passengers})</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 bg-[#f5f5f5] text-[#828282] px-2 py-1 rounded-[8px] text-[12px] font-medium">
              <UsersIcon className="w-3 h-3" strokeWidth={1.5} />
              <span>Sin gen.</span>
            </div>
          )}
          {trip.cargo_manifest ? (
            <div className="inline-flex items-center gap-1 bg-[#36D399]/10 text-[#237804] px-2 py-1 rounded-[8px] text-[12px] font-medium">
              <CubeIcon className="w-3 h-3" strokeWidth={1.5} />
              <span>Carga ({trip.cargo_manifest.total_cargo_weight_kg})</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 bg-[#f5f5f5] text-[#828282] px-2 py-1 rounded-[8px] text-[12px] font-medium">
              <CubeIcon className="w-3 h-3" strokeWidth={1.5} />
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium rounded-full bg-[#e6f7e6] text-[#237804]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#237804]" />
              Completo
            </span>
          );
        } else if (hasPassenger || hasCargo) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium rounded-full bg-[#fffbe6] text-[#d48806]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d48806]" />
              Parcial
            </span>
          );
        } else {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium rounded-full bg-[#f5f5f5] text-[#828282]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#828282]" />
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
        <span className="text-[13px] text-[#4d4d4d]">
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
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-[#efefef] rounded-[20px] p-10 sm:p-12">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-[#1F4690]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BuildingOfficeIcon className="w-8 h-8 text-[#1F4690]" strokeWidth={1.5} />
            </div>
            <h2
              className="text-[32px] font-medium text-[#202020] tracking-[-0.64px] leading-[1.19]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Selecciona una Sucursal
            </h2>
            <p className="mt-3 text-[15px] text-[#4d4d4d] leading-[1.33]">
              Para ver los manifiestos, primero debes seleccionar una sucursal activa.
            </p>
          </div>

          <div className="space-y-3">
            {branches?.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleBranchChange(branch)}
                className="w-full flex items-center gap-4 px-5 py-4 bg-white rounded-[12px] border border-[#e8e8e8] text-left hover:border-[#1F4690]/30 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 bg-[#f5f5f5] rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[#1F4690]/10 transition-colors">
                  <BuildingOfficeIcon className="w-5 h-5 text-[#828282] group-hover:text-[#1F4690] transition-colors" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[15px] font-medium text-[#202020] truncate">
                    {branch.name}
                  </span>
                  <span className="block text-[13px] text-[#828282] mt-0.5">
                    Sucursal disponible
                  </span>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-[#c4c4c4] group-hover:text-[#1F4690] transition-colors shrink-0" strokeWidth={1.5} />
              </button>
            ))}

            {(!branches || branches.length === 0) && (
              <div className="text-center py-8">
                <p className="text-[15px] text-[#828282]">No hay sucursales disponibles</p>
              </div>
            )}
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
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1F4690] rounded-xl flex items-center justify-center text-white shrink-0">
            <DocumentTextIcon className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div>
            <h1
              className="text-[28px] font-medium text-[#202020] tracking-[-0.56px] leading-[1.19]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Manifiestos
            </h1>
            <p className="text-[14px] text-[#4d4d4d]">Gestión de manifiestos de pasajeros y carga</p>
          </div>
        </div>

        {/* Selector de Sucursal */}
        <div className="relative w-full sm:w-auto" ref={branchSelectorRef}>
          <button
            onClick={() => setShowBranchSelector(!showBranchSelector)}
            className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-2 px-4 py-2.5 bg-white border border-[#e8e8e8] rounded-[12px] text-[14px] font-medium text-[#202020] hover:bg-[#f5f5f5] transition-colors"
          >
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="w-4 h-4 text-[#828282]" strokeWidth={1.5} />
              <span className="truncate max-w-[200px]">{selectedBranch?.name || 'Seleccionar Sucursal'}</span>
            </div>
            <AdjustmentsHorizontalIcon className="w-4 h-4 text-[#828282]" strokeWidth={1.5} />
          </button>

          {showBranchSelector && branches && (
            <div className="absolute left-0 right-0 sm:right-auto sm:w-64 mt-2 bg-white rounded-[12px] border border-[#e8e8e8] z-50 overflow-hidden">
              <div className="p-2.5 border-b border-[#f0f0f0]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#828282]">
                  Seleccionar Sucursal
                </p>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {branches.map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => handleBranchChange(branch)}
                    className={`w-full text-left px-3 py-2.5 text-[13px] hover:bg-[#f5f5f5] transition-colors flex items-center gap-2 ${
                      selectedBranch?.id === branch.id ? 'bg-[#1F4690]/5 text-[#1F4690]' : 'text-[#202020]'
                    }`}
                  >
                    <BuildingOfficeIcon className="w-4 h-4 text-[#828282] shrink-0" strokeWidth={1.5} />
                    <span className="truncate">{branch.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs móviles */}
      <div className="md:hidden bg-white rounded-[12px] border border-[#e8e8e8] p-1">
        <nav className="flex items-center gap-1">
          <button
            onClick={() => setMobileTab('all')}
            className={`flex-1 py-2 rounded-[10px] text-[13px] font-medium transition-colors ${
              mobileTab === 'all' ? 'bg-[#1F4690] text-white' : 'text-[#4d4d4d] hover:bg-[#f5f5f5]'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setMobileTab('passenger')}
            className={`flex-1 py-2 rounded-[10px] text-[13px] font-medium transition-colors ${
              mobileTab === 'passenger' ? 'bg-[#1F4690] text-white' : 'text-[#4d4d4d] hover:bg-[#f5f5f5]'
            }`}
          >
            Pasajeros
          </button>
          <button
            onClick={() => setMobileTab('cargo')}
            className={`flex-1 py-2 rounded-[10px] text-[13px] font-medium transition-colors ${
              mobileTab === 'cargo' ? 'bg-[#1F4690] text-white' : 'text-[#4d4d4d] hover:bg-[#f5f5f5]'
            }`}
          >
            Carga
          </button>
        </nav>
      </div>

      {/* Lista de Manifiestos */}
      <div className="bg-white rounded-[12px] border border-[#e8e8e8]">
        <div className="p-4 md:p-6 border-b border-[#f0f0f0]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-[16px] font-semibold text-[#202020]">
                Manifiestos — {selectedBranch?.name}
              </h2>
              <p className="text-[13px] text-[#828282] mt-1">
                {filteredTrips.length} viajes con manifiestos encontrados
              </p>
            </div>

            {selectedBranch && (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-[13px] text-[#828282]">
                  Mostrando {filteredTrips.length === 0 ? 0 : startIndex + 1}–
                  {Math.min(startIndex + pageSize, filteredTrips.length)} de {filteredTrips.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={safePage === 1}
                    className="px-2.5 py-1.5 rounded-[8px] border border-[#e8e8e8] text-[13px] text-[#4d4d4d] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="px-2 text-[13px] text-[#202020] font-medium">
                    {safePage}/{totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={safePage === totalPages}
                    className="px-2.5 py-1.5 rounded-[8px] border border-[#e8e8e8] text-[13px] text-[#4d4d4d] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vista móvil: tarjetas */}
        <div className="md:hidden p-4 space-y-4">
          {isLoading ? (
            <div className="py-10 text-center text-[14px] text-[#828282]">Cargando manifiestos...</div>
          ) : paginatedTrips.length === 0 ? (
            <div className="py-10 text-center text-[14px] text-[#828282]">No hay manifiestos generados</div>
          ) : (
            paginatedTrips.map((trip, index) => {
              const status = getTripStatus(trip);

              return (
                <div
                  key={trip.trip_id}
                  className="bg-white rounded-[12px] border border-[#e8e8e8] overflow-hidden"
                >
                  {/* Header: ruta + estado */}
                  <div className="p-4">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div className="flex items-center gap-1.5">
                        <MapPinIcon className="w-3.5 h-3.5 text-[#828282]" strokeWidth={1.5} />
                        <span className="text-[11px] font-semibold text-[#828282] uppercase tracking-wider">
                          VIAJE #{trip.trip_id}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-[8px] text-[10px] font-bold uppercase shrink-0 ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <h3 className="text-[16px] font-medium text-[#202020] leading-snug">
                      {trip.route_name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[13px] text-[#828282] mt-1">
                      <Ship className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                      <span>{trip.vessel_name}</span>
                    </div>
                  </div>

                  {/* Manifest Grid: Pasajeros + Carga */}
                  <div className="grid grid-cols-2 gap-0 border-t border-[#f0f0f0]">
                    {/* Pasajeros */}
                    <div className="p-4 border-r border-[#f0f0f0]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-md bg-[#1F4690]/5 flex items-center justify-center text-[#1F4690]">
                          <UsersIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </div>
                        <span className="text-[11px] font-semibold text-[#828282] uppercase tracking-wider">
                          Pasajeros
                        </span>
                      </div>
                      <p className="text-[20px] font-semibold text-[#202020] leading-none">
                        {trip.passenger_manifest ? trip.passenger_manifest.total_passengers : '—'}
                      </p>
                      <span className={`inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium ${trip.passenger_manifest ? 'text-[#237804]' : 'text-[#828282]'}`}>
                        <span className={`w-1 h-1 rounded-full ${trip.passenger_manifest ? 'bg-[#237804]' : 'bg-[#c4c4c4]'}`} />
                        {trip.passenger_manifest ? 'Generado' : 'Sin gen.'}
                      </span>
                    </div>

                    {/* Carga */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-md bg-[#36D399]/10 flex items-center justify-center text-[#237804]">
                          <CubeIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </div>
                        <span className="text-[11px] font-semibold text-[#828282] uppercase tracking-wider">
                          Carga
                        </span>
                      </div>
                      <p className="text-[20px] font-semibold text-[#202020] leading-none">
                        {trip.cargo_manifest ? `${trip.cargo_manifest.total_cargo_weight_kg}` : '—'}
                      </p>
                      <span className="text-[11px] text-[#828282] mt-0.5 block">
                        {trip.cargo_manifest ? 'kg generados' : 'Sin gen.'}
                      </span>
                    </div>
                  </div>

                  {/* Footer info: fechas */}
                  <div className="px-4 py-3 border-t border-[#f0f0f0] bg-[#fafafa] space-y-1.5">
                    <div className="flex items-center gap-2 text-[12px] text-[#828282]">
                      <CalendarDaysIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                      <span>
                        Salida: {new Date(trip.departure_datetime).toLocaleDateString('es-ES')} {new Date(trip.departure_datetime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-[#828282]">
                      <ClockIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                      <span>
                        Creado: {new Date(trip.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })} {new Date(trip.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="p-3 border-t border-[#f0f0f0]">
                    <button
                      onClick={() => handleViewDetails(trip)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1F4690] hover:bg-[#163672] text-white text-[13px] font-medium rounded-[10px] transition-colors active:scale-[0.98]"
                    >
                      <EyeIcon className="w-4 h-4" strokeWidth={1.5} />
                      Ver detalles del viaje
                      <ChevronRightIcon className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Vista desktop: tabla */}
        <div className="hidden md:block">
          <DataTable<GroupedTrip>
            data={paginatedTrips}
            columns={columns}
            keyExtractor={(trip) => trip.trip_id.toString()}
            isLoading={isLoading}
            emptyMessage="No hay manifiestos generados"
            customActions={(trip) => (
              <button
                onClick={() => handleViewDetails(trip)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#1F4690] hover:bg-[#1F4690]/5 rounded-[8px] transition-colors"
              >
                <EyeIcon className="w-4 h-4" strokeWidth={1.5} />
                Ver
              </button>
            )}
          />
        </div>

        {/* Paginación móvil */}
        {!isLoading && filteredTrips.length > 0 && (
          <div className="md:hidden px-4 pb-4">
            <div className="border border-[#e8e8e8] rounded-[12px] p-3 flex items-center justify-between text-[13px] text-[#4d4d4d]">
              <span className="text-[#828282]">
                {safePage}/{totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage === 1}
                  className="px-3 py-1.5 rounded-[8px] border border-[#e8e8e8] text-[#4d4d4d] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safePage === totalPages}
                  className="px-3 py-1.5 rounded-[8px] border border-[#e8e8e8] text-[#4d4d4d] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
