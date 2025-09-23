import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  UsersIcon,
  CubeIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  TruckIcon,
  EyeIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { manifestService } from '../services/manifest.service';
import { Manifest } from '../types/manifest.types';

export const TripManifestsPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'passenger' | 'cargo'>('passenger');

  // Query para obtener manifiestos del trip específico
  const { 
    data: manifests = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['trip-manifests', tripId],
    queryFn: async () => {
      if (!tripId) return [];

      // Obtener sucursal seleccionada desde localStorage
      try {
        const selectedBranch = localStorage.getItem('selectedSalesBranch');
        if (!selectedBranch) {
          throw new Error('No hay sucursal seleccionada');
        }
        const branchData = JSON.parse(selectedBranch);

        // Primero intentar obtener la lista desde la cache de react-query para evitar nuevas peticiones
        const cached = queryClient.getQueryData<any[]>(['manifests', branchData.id]);
        if (cached && Array.isArray(cached)) {
          return cached.filter(m => m.trip_id === parseInt(tripId));
        }

        // Si no hay cache disponible, hacer una única llamada por sucursal y filtrar localmente
        const branchManifests = await manifestService.getManifestsByBranchOffice(branchData.id);
        return branchManifests.filter(m => m.trip_id === parseInt(tripId));
      } catch (error) {
        console.error('Error al obtener manifiestos por viaje usando lista de sucursal:', error);
        return [];
      }
    },
    enabled: !!tripId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: false
  });

  const passengerManifest = manifests.find(m => m.manifest_type === 'PASSENGER');
  const cargoManifest = manifests.find(m => m.manifest_type === 'CARGO');
  const tripInfo = manifests[0]; // Información común del viaje

  const handleDownloadPDF = (pdfUrl: string, manifestNumber: string) => {
    if (!pdfUrl) {
      toast.error('PDF no disponible');
      return;
    }

    // Crear link de descarga
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${manifestNumber}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderManifestCard = (manifest: Manifest | undefined, type: 'passenger' | 'cargo') => {
    const isPassenger = type === 'passenger';
    const Icon = isPassenger ? UsersIcon : CubeIcon;
    const title = isPassenger ? 'Manifiesto de Pasajeros' : 'Manifiesto de Carga';
    const bgColor = isPassenger ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200';
    const iconColor = isPassenger ? 'text-blue-600' : 'text-green-600';

    if (!manifest) {
      return (
        <div className={`${bgColor} border-2 border-dashed rounded-lg p-8 text-center`}>
          <Icon className={`w-12 h-12 ${iconColor} mx-auto mb-4 opacity-50`} />
          <h3 className="text-lg font-medium text-gray-600 mb-2">{title}</h3>
          <p className="text-gray-500">No generado para este viaje</p>
        </div>
      );
    }

    return (
      <div className={`${bgColor.replace('50', '25')} border rounded-lg p-6`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 ${bgColor} rounded-lg`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">#{manifest.manifest_number}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              manifest.status === 'GENERATED' 
                ? 'bg-green-100 text-green-800' 
                : manifest.status === 'DRAFT'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {manifest.status === 'GENERATED' ? 'Generado' : manifest.status === 'DRAFT' ? 'Borrador' : manifest.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm font-medium text-gray-700">Fecha de Generación</p>
            <p className="text-sm text-gray-600">
              {(() => {
                const dateToUse = manifest.generated_by_user?.created_at || manifest.created_at;
                const parsedDate = manifestService.parseDate(dateToUse);
                return parsedDate 
                  ? parsedDate.toLocaleDateString('es-ES')
                  : 'Fecha no disponible';
              })()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Generado por</p>
            <p className="text-sm text-gray-600">
              {manifest.generated_by_user?.full_name || 
               manifest.generated_by_name || 
               manifest.generated_by || 
               'Usuario desconocido'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isPassenger ? 'Total Pasajeros' : 'Total de carga'}
            </p>
            <p className="text-sm text-gray-600">
              {isPassenger ? manifest.total_passengers : `${manifest.total_cargo_weight_kg}`}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Última Actualización</p>
            <p className="text-sm text-gray-600">
              {new Date(manifest.updated_at).toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>

        {manifest.observations && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-1">Observaciones</p>
            <p className="text-sm text-gray-600 bg-white rounded border p-3">
              {manifest.observations}
            </p>
          </div>
        )}

        {/* PDF Viewer */}
        {manifest.pdf_file_path ? (
          <div className="space-y-4">
            <div className="bg-white rounded border p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">Vista Previa del PDF</p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(manifest.pdf_file_path!, '_blank')}
                    className="flex items-center space-x-1"
                  >
                    <EyeIcon className="w-4 h-4" />
                    <span>Ver Completo</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadPDF(manifest.pdf_file_path!, manifest.manifest_number)}
                    className="flex items-center space-x-1"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    <span>Descargar</span>
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded border" style={{ height: '80vh', minHeight: '520px' }}>
                <iframe
                  src={manifest.pdf_file_path}
                  className="w-full h-full rounded"
                  title={`PDF ${title}`}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <DocumentTextIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">PDF no disponible</p>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando manifiestos del viaje...</p>
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
        </div>
      </div>
    );
  }

  if (!tripInfo) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-medium">No se encontraron manifiestos</h3>
          <p className="text-yellow-600 text-sm mt-1">
            No existen manifiestos para el viaje solicitado. Asegúrate de haber seleccionado una sucursal y de que el viaje tenga manifiestos generados.
          </p>
          <div className="mt-3 space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate('/fluvial/operations/manifests')}
              className="text-sm"
            >
              Volver a la lista
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="text-sm"
            >
              Recargar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con información del viaje */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/fluvial/operations/manifests')}
              className="flex items-center space-x-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Volver</span>
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TruckIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Manifiestos del Viaje
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  <div className="flex items-center space-x-1">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{tripInfo.route_name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TruckIcon className="w-4 h-4" />
                    <span>{tripInfo.vessel_name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>{new Date(tripInfo.departure_datetime!).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="w-4 h-4" />
                    <span>{new Date(tripInfo.departure_datetime!).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('passenger')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'passenger'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <UsersIcon className="w-4 h-4" />
                <span>Manifiesto de Pasajeros</span>
                {passengerManifest && (
                  <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-full text-xs">
                    {passengerManifest.total_passengers}
                  </span>
                )}
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('cargo')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cargo'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CubeIcon className="w-4 h-4" />
                <span>Manifiesto de Carga</span>
                {cargoManifest && (
                  <span className="bg-green-100 text-green-800 py-1 px-2 rounded-full text-xs">
                    {cargoManifest.total_cargo_weight_kg}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>

        {/* Contenido de tabs */}
        <div className="p-6">
          {activeTab === 'passenger' && renderManifestCard(passengerManifest, 'passenger')}
          {activeTab === 'cargo' && renderManifestCard(cargoManifest, 'cargo')}
        </div>
      </div>
    </div>
  );
};
