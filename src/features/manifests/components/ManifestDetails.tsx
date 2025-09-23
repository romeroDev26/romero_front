import React from 'react';
import { 
  DocumentArrowDownIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  CubeIcon,
  InformationCircleIcon,
  UserIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Manifest } from '../types/manifest.types';
import { manifestService } from '../services/manifest.service';
import { generatePassengerManifestPDF } from './ManifestPDFGenerator';
import { toast } from 'react-toastify';

interface ManifestDetailsProps {
  manifest: Manifest;
  onClose: () => void;
}

const ManifestDetails: React.FC<ManifestDetailsProps> = ({ manifest, onClose }) => {
  const handleDownloadPDF = async () => {
    try {
      const blob = await manifestService.generateManifestPDF(manifest.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `manifiesto-${manifest.manifest_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF descargado correctamente');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Error al descargar el PDF');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GENERATED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'GENERATED':
        return 'Generado';
      case 'DRAFT':
        return 'Borrador';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const ManifestIcon = manifest.manifest_type === 'PASSENGER' ? UsersIcon : CubeIcon;

  return (
    <div className="space-y-6">
      {/* Header del manifiesto */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <ManifestIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Manifiesto #{manifest.manifest_number}
              </h2>
              <p className="text-gray-600">
                {manifest.manifest_type === 'PASSENGER' ? 'Manifiesto de Pasajeros' : 'Manifiesto de Carga'}
              </p>
              <div className="mt-2">
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(manifest.status)}`}>
                  {getStatusDisplay(manifest.status)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-right text-sm text-gray-600">
            <p>Generado: {(() => {
              const dateToUse = manifest.generated_by_user?.created_at || manifest.created_at;
              const parsedDate = manifestService.parseDate(dateToUse);
              return parsedDate 
                ? parsedDate.toLocaleString('es-ES')
                : 'Fecha no disponible';
            })()}</p>
            {manifest.updated_at !== manifest.created_at && (
              <p>Actualizado: {new Date(manifest.updated_at).toLocaleString('es-ES')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Información del viaje */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Viaje</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center">
              <MapPinIcon className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <span className="text-sm text-gray-600">Ruta:</span>
                <p className="font-medium">
                  {manifest.route_name || 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <CalendarDaysIcon className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <span className="text-sm text-gray-600">Fecha de Salida:</span>
                <p className="font-medium">
                  {manifest.departure_datetime ? new Date(manifest.departure_datetime).toLocaleDateString('es-PE') : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <ClockIcon className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <span className="text-sm text-gray-600">Hora de Salida:</span>
                <p className="font-medium">
                  {manifest.departure_datetime ? new Date(manifest.departure_datetime).toLocaleTimeString('es-PE') : 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <TruckIcon className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <span className="text-sm text-gray-600">Embarcación:</span>
                <p className="font-medium">{manifest.vessel_name || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido específico del manifiesto */}
      {manifest.manifest_type === 'PASSENGER' && manifest.items && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UsersIcon className="w-5 h-5 mr-2" />
            Pasajeros ({manifest.total_passengers})
          </h3>
          
          <div className="overflow-x-auto flex justify-center">
            <table className="min-w-max table-auto mx-auto divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N°
                  </th>
                  <th className="px-8 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pasajero
                  </th>
                  <th className="px-8 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-8 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nacionalidad
                  </th>
                  <th className="px-8 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asiento
                  </th>
                  <th className="px-8 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origen - Destino
                  </th>
                  <th className="px-8 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-8 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo Asiento
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {manifest.items
                  .sort((a, b) => a.item_order - b.item_order)
                  .map((item, index) => (
                  <tr key={item.seat_assignment_id}>
                    <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {item.passenger_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.passenger_doc_type === '1' ? 'DNI' : item.passenger_doc_type === '2' ? 'CE' : 'PAS'}: {item.passenger_doc_number}
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900">
                      {
                        // Priorizar nombre de nacionalidad; si código 'PE' mostrar 'PERÚ'; si no mostrar código o 'N/A'
                        item.passenger_country_name
                          ? item.passenger_country_name
                          : item.passenger_country_code
                          ? item.passenger_country_code === 'PE'
                            ? 'PERÚ'
                            : item.passenger_country_code
                          : 'N/A'
                      }
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                        {item.seat_number || 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full mr-1">
                        {item.boarding_port_name}
                      </span>
                      →
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full ml-1">
                        {item.disembarking_port_name}
                      </span>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.passenger_phone || 'N/A'}
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.seat_type_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900">
              Total Pasajeros: {manifest.total_passengers}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Información detallada de asientos y rutas disponible
            </p>
          </div>
        </div>
      )}

      {manifest.manifest_type === 'CARGO' && manifest.items && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CubeIcon className="w-5 h-5 mr-2" />
            Carga y Encomiendas ({manifest.items.length})
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N°
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remitente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origen - Destino
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {manifest.items
                  .map((item, index) => (
                  <tr key={item.parcel_number || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {item.parcel_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.passenger_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.passenger_doc_type === '1' ? 'DNI' : item.passenger_doc_type === '2' ? 'CE' : 'PAS'}: {item.passenger_doc_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full mr-1">
                        {item.boarding_port_name}
                      </span>
                      →
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full ml-1">
                        {item.disembarking_port_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.special_notes || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900">Total Items: {manifest.items.length}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Total de carga: {manifest.total_cargo_weight_kg}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Tipo: {manifest.manifest_type}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Observaciones */}
      {manifest.observations && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <InformationCircleIcon className="w-5 h-5 mr-2" />
            Observaciones
          </h3>
          <p className="text-gray-700 whitespace-pre-wrap">
            {manifest.observations}
          </p>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          variant="secondary"
          onClick={onClose}
        >
          Cerrar
        </Button>
        
        {manifest.status === 'GENERATED' && (
          <>
            <Button
              variant="outline"
              onClick={async () => {
                // Descargar PDF generado localmente por el frontend (usa la nueva plantilla)
                try {
                  const { pdf } = generatePassengerManifestPDF(manifest);
                  const blob = new Blob([pdf.output('blob')], { type: 'application/pdf' });
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `manifiesto-${manifest.manifest_number}-local.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                  toast.success('PDF (local) descargado correctamente');
                } catch (e) {
                  console.error('Error descargando PDF local:', e);
                  toast.error('Error al descargar PDF (local)');
                }
              }}
              className="flex items-center space-x-2"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span>Descargar PDF (local)</span>
            </Button>

            <Button
              variant="primary"
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span>Descargar PDF (backend)</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ManifestDetails;
