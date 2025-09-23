import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  TruckIcon,
  DocumentTextIcon,
  UserIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { Button } from '../../../components/common/Button';
import { DataTable, Column } from '../../../components/common/DataTable';
import { SunatStatusBadge } from '../../accounting/components/SunatStatusBadge';
import { RemissionGuideActions } from '../components/RemissionGuideActions';
import { RemissionGuideSenderActions } from '../components/RemissionGuideSenderActions';
import { useDebounce } from '../../../hooks/useDebounce';
import { useBranchOfficesData } from '../../fluvial/hooks/useBranchOfficesData';
import { useRemissionGuidesByBranchOffice } from '../hooks/useRemissionGuides';
import { RemissionGuideTransportista, RemissionGuideRemitente } from '../../../types';

export const RemissionGuidesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeBranch, setActiveBranch] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: branches, isLoading: isLoadingBranches } = useBranchOfficesData();

  const branchOfficeId = activeBranch?.id || null;
  const { data: guidesData, isLoading: isLoadingGuides } = useRemissionGuidesByBranchOffice(branchOfficeId);

  const transportistaGuides = guidesData?.transportista || [];
  const remitenteGuides = guidesData?.remitente || [];

  useEffect(() => {
    const savedBranch = localStorage.getItem('selectedSalesBranch');
    if (savedBranch) {
      setActiveBranch(JSON.parse(savedBranch));
    } else if (branches && branches.length > 0) {
      setActiveBranch(branches[0]);
    }
  }, [branches]);

  const filterGuides = (guides: any[]) => {
    let filtered = guides;

    // Filtro por búsqueda
    if (debouncedSearchTerm) {
      filtered = filtered.filter(guide =>
        ((guide as any).recipient_name || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        `${guide.series}-${guide.number}`.includes(debouncedSearchTerm) ||
        ((guide as any).vessel_name || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter) {
      filtered = filtered.filter(guide => guide.sunat_status === statusFilter);
    }

    return filtered;
  };

  const filteredTransportistaGuides = filterGuides(transportistaGuides);
  const filteredRemitenteGuides = filterGuides(remitenteGuides);

    const columnsTransportista: Column<RemissionGuideTransportista>[] = [
    {
      key: 'number',
      header: 'Número',
      accessor: (item) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <DocumentTextIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {item.series}-{String(item.number).padStart(8, '0')}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'issue_date',
      header: 'Fecha Emisión',
      accessor: (item) => (
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">
            {format(parseISO(item.issue_date), 'dd/MM/yyyy')}
          </span>
        </div>
      ),
    },
    {
      key: 'recipient',
      header: 'Destinatario',
      accessor: (item) => (
        <div className="flex items-center space-x-2 min-w-0">
          <UserIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-900 truncate max-w-[200px]">
            {((item as any).recipient_name || '').length > 25 
              ? ((item as any).recipient_name || '').substring(0, 25) + '...' 
              : (item as any).recipient_name || ''}
          </span>
        </div>
      ),
    },
    {
      key: 'destination',
      header: 'Destino',
      accessor: (item) => (
        <div className="flex items-center space-x-2 min-w-0">
          <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-900 truncate max-w-[200px]">
            {((item as any).destination_address || '').length > 25 
              ? ((item as any).destination_address || '').substring(0, 25) + '...' 
              : (item as any).destination_address || ''}
          </span>
        </div>
      ),
    },
    {
      key: 'driver',
      header: 'Conductor',
      accessor: (item) => (
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {item.driver_name || 'N/A'}
          </div>
          <div className="text-xs text-gray-500 truncate">Lic: {item.driver_license || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado SUNAT',
      accessor: (item) => (
        <SunatStatusBadge status={item.sunat_status} />
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      accessor: (item) => (
        <RemissionGuideActions
          guide={item}
          companyId={activeBranch?.company_id || 0}
        />
      ),
    },
  ];

  const columnsRemitente: Column<RemissionGuideRemitente>[] = [
    {
      key: 'number',
      header: 'Número',
      accessor: (item) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
              <DocumentTextIcon className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {item.series}-{String(item.number).padStart(8, '0')}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'issue_date',
      header: 'Fecha Emisión',
      accessor: (item) => (
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">
            {format(parseISO(item.issue_date), 'dd/MM/yyyy')}
          </span>
        </div>
      ),
    },
    {
      key: 'recipient',
      header: 'Destinatario',
      accessor: (item) => (
        <div className="flex items-center space-x-2 min-w-0">
          <UserIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-900 truncate">
            {(item as any).recipient_name || ''}
          </span>
        </div>
      ),
    },
    {
      key: 'destination',
      header: 'Destino',
      accessor: (item) => (
        <div className="flex items-center space-x-2 min-w-0">
          <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-900 truncate">
            {(item as any).destination_address || ''}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado SUNAT',
      accessor: (item) => (
        <SunatStatusBadge status={item.sunat_status} />
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      accessor: (item) => (
        <RemissionGuideSenderActions
          guide={item}
          companyId={activeBranch?.company_id || 0}
        />
      ),
    },
  ];

  // Estadísticas rápidas para transportista
  const statsTransportista = useMemo(() => {
    const total = transportistaGuides.length;
    const accepted = transportistaGuides.filter(g => g.sunat_status === 'ACCEPTED').length;
    const pending = transportistaGuides.filter(g => g.sunat_status === 'PENDING').length;
    const rejected = transportistaGuides.filter(g => g.sunat_status === 'REJECTED').length;
    
    return { total, accepted, pending, rejected };
  }, [transportistaGuides]);

  // Estadísticas rápidas para remitente
  const statsRemitente = useMemo(() => {
    const total = remitenteGuides.length;
    const accepted = remitenteGuides.filter(g => g.sunat_status === 'ACCEPTED').length;
    const pending = remitenteGuides.filter(g => g.sunat_status === 'PENDING').length;
    const rejected = remitenteGuides.filter(g => g.sunat_status === 'REJECTED').length;
    
    return { total, accepted, pending, rejected };
  }, [remitenteGuides]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full xl:max-w-8xl 2xl:max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                Guías de Remisión Electrónicas
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Gestiona y administra todas tus guías de remisión electrónicas
              </p>
            </div>
            <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
              <Button
                onClick={() => navigate('/remission-guides/new?type=transportista')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nueva Guía
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards Globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Transportista</p>
                <p className="text-2xl font-bold text-gray-900">{statsTransportista.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Remitente</p>
                <p className="text-2xl font-bold text-gray-900">{statsRemitente.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <div className="h-4 w-4 bg-yellow-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{statsTransportista.pending + statsRemitente.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Aceptadas</p>
                <p className="text-2xl font-bold text-green-600">{statsTransportista.accepted + statsRemitente.accepted}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sucursal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sucursal Activa
                </label>
                <select
                  value={activeBranch?.id || ''}
                  onChange={(e) => {
                    const newBranch = branches?.find(b => b.id === Number(e.target.value));
                    if (newBranch) {
                      setActiveBranch(newBranch);
                      localStorage.setItem('selectedSalesBranch', JSON.stringify(newBranch));
                    }
                  }}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                  disabled={isLoadingBranches}
                >
                  {branches?.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>

              {/* Búsqueda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Buscar por destinatario, número..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado SUNAT
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                >
                  <option value="">Todos los estados</option>
                  <option value="PENDING">Pendiente</option>
                  <option value="ACCEPTED">Aceptado</option>
                  <option value="REJECTED">Rechazado</option>
                  <option value="SENT">Enviado</option>
                  <option value="GENERATED">Generado</option>
                  <option value="SIGNED">Firmado</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla Transportista */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <TruckIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Guías de Remisión - Transportista ({filteredTransportistaGuides.length})
                  </h3>
                  <p className="text-sm text-gray-500">Document Type Code: 31</p>
                </div>
              </div>
              {searchTerm && (
                <div className="text-sm text-gray-500">
                  Filtrando por: "{searchTerm}"
                </div>
              )}
            </div>
          </div>
          
          <DataTable
            columns={columnsTransportista}
            data={filteredTransportistaGuides}
            isLoading={isLoadingGuides}
            keyExtractor={(item) => item.id}
          />
        </div>

        {/* Tabla Remitente */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <DocumentTextIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Guías de Remisión - Remitente ({filteredRemitenteGuides.length})
                  </h3>
                  <p className="text-sm text-gray-500">Document Type Code: 09</p>
                </div>
              </div>
              {searchTerm && (
                <div className="text-sm text-gray-500">
                  Filtrando por: "{searchTerm}"
                </div>
              )}
            </div>
          </div>
          
          <DataTable
            columns={columnsRemitente}
            data={filteredRemitenteGuides}
            isLoading={isLoadingGuides}
            keyExtractor={(item) => item.id}
          />
        </div>
      </div>
    </div>
  );
};