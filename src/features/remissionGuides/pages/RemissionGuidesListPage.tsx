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
  MapPinIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Button } from '../../../components/common/Button';
import { DataTable, Column } from '../../../components/common/DataTable';
import { Input } from '../../../components/common/Input';
import { useDebounce } from '../../../hooks/useDebounce';
import { useBranchOfficesData } from '../../fluvial/hooks/useBranchOfficesData';
import { useRemissionGuides } from '../hooks/useRemissionGuides';
import { RemissionGuideTransportista } from '../../../types';

export const RemissionGuidesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeBranch, setActiveBranch] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: branches, isLoading: isLoadingBranches } = useBranchOfficesData();

  const companyId = activeBranch?.company_id || null;
  const { data: guides = [], isLoading: isLoadingGuides } = useRemissionGuides({ company_id: companyId });

  useEffect(() => {
    const savedBranch = localStorage.getItem('selectedSalesBranch');
    if (savedBranch) {
      setActiveBranch(JSON.parse(savedBranch));
    } else if (branches && branches.length > 0) {
      setActiveBranch(branches[0]);
    }
  }, [branches]);

  const filteredGuides = useMemo(() => {
    let filtered = guides;

    // Filtro por búsqueda
    if (debouncedSearchTerm) {
      filtered = filtered.filter(guide =>
        guide.recipient_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        `${guide.series}-${guide.number}`.includes(debouncedSearchTerm) ||
        (guide.trip?.vessel?.name || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter) {
      filtered = filtered.filter(guide => guide.sunat_status === statusFilter);
    }

    // Filtro por fecha (implementación básica)
    if (dateFilter) {
      const now = new Date();
      const days = parseInt(dateFilter);
      const filterDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(guide => new Date(guide.issue_date) >= filterDate);
    }

    return filtered;
  }, [guides, debouncedSearchTerm, statusFilter, dateFilter]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-50 text-gray-700 ring-gray-600/20';
      case 'GENERATED':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20';
      case 'SIGNED':
        return 'bg-indigo-50 text-indigo-700 ring-indigo-600/20';
      case 'SENT':
        return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
      case 'ACCEPTED':
        return 'bg-green-50 text-green-700 ring-green-600/20';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 ring-red-600/20';
      case 'OBSERVED':
        return 'bg-orange-50 text-orange-700 ring-orange-600/20';
      case 'VOIDED':
        return 'bg-purple-50 text-purple-700 ring-purple-600/20';
      case 'ERROR':
        return 'bg-red-50 text-red-700 ring-red-600/20';
      default:
        return 'bg-gray-50 text-gray-700 ring-gray-600/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'GENERATED': return 'Generado';
      case 'SIGNED': return 'Firmado';
      case 'SENT': return 'Enviado';
      case 'ACCEPTED': return 'Aceptado';
      case 'REJECTED': return 'Rechazado';
      case 'OBSERVED': return 'Observado';
      case 'VOIDED': return 'Anulado';
      case 'ERROR': return 'Error';
      default: return status;
    }
  };

  const columns: Column<RemissionGuideTransportista>[] = [
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
          <div>
            <div className="text-sm font-semibold text-gray-900">
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
            {format(new Date(item.issue_date), 'dd/MM/yyyy')}
          </span>
        </div>
      ),
    },
    {
      key: 'trip',
      header: 'Viaje / Embarcación',
      accessor: (item) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <TruckIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{item.trip?.trip_name || 'N/A'}</div>
            <div className="text-xs text-gray-500">{item.trip?.vessel?.name || 'N/A'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'recipient',
      header: 'Destinatario',
      accessor: (item) => (
        <div className="flex items-center space-x-2">
          <UserIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">{item.recipient_name}</span>
        </div>
      ),
    },
    {
      key: 'destination',
      header: 'Destino',
      accessor: (item) => (
        <div className="flex items-center space-x-2">
          <MapPinIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">{item.destination_address}</span>
        </div>
      ),
    },
    {
      key: 'driver',
      header: 'Conductor',
      accessor: (item) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{item.driver_name || 'N/A'}</div>
          <div className="text-xs text-gray-500">Lic: {item.driver_license || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado SUNAT',
      accessor: (item) => (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClass(item.sunat_status)}`}>
          {getStatusText(item.sunat_status)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      accessor: (item) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate(`/remission-guides/${item.id}`)}
            className="inline-flex items-center p-1.5 border border-transparent rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Ver detalles"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate(`/remission-guides/${item.id}/edit`)}
            className="inline-flex items-center p-1.5 border border-transparent rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
            title="Editar"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  // Estadísticas rápidas
  const stats = useMemo(() => {
    const total = guides.length;
    const accepted = guides.filter(g => g.sunat_status === 'ACCEPTED').length;
    const pending = guides.filter(g => g.sunat_status === 'PENDING').length;
    const rejected = guides.filter(g => g.sunat_status === 'REJECTED').length;
    
    return { total, accepted, pending, rejected };
  }, [guides]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="mt-4 flex md:ml-4 md:mt-0">
              <Button
                onClick={() => navigate('/remission-guides/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nueva Guía de Remisión
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                <p className="text-sm font-medium text-gray-600">Aceptadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
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
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <div className="h-4 w-4 bg-red-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rechazadas</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

              {/* Período */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                >
                  <option value="">Todo el tiempo</option>
                  <option value="7">Última semana</option>
                  <option value="30">Último mes</option>
                  <option value="90">Últimos 3 meses</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Guías de Remisión ({filteredGuides.length})
              </h3>
              {searchTerm && (
                <div className="text-sm text-gray-500">
                  Filtrando por: "{searchTerm}"
                </div>
              )}
            </div>
          </div>
          
          <DataTable
            columns={columns}
            data={filteredGuides}
            isLoading={isLoadingGuides}
            keyExtractor={(item) => item.id}
            onEdit={(item) => navigate(`/remission-guides/${item.id}`)}
          />
        </div>
      </div>
    </div>
  );
};