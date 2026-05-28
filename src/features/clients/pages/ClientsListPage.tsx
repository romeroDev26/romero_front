// src/features/clients/pages/ClientsListPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { toast } from '@/utils/sileo-toast';

import { Spinner } from '../../../components/common/Spinner';
import { Modal } from '../../../components/common/Modal';
import { clientsService } from '../../../services/clients.service';
import { Client, DocType } from '../../../types';

// Función helper para obtener el texto del tipo de documento
const getDocTypeDisplay = (type: string): string => {
  switch (type as DocType) {
    case '1': return 'DNI';
    case '4': return 'Carnet de Extranjería';
    case '6': return 'RUC';
    case '7': return 'Pasaporte';
    case '0': return 'Otros';
    default: return 'Desconocido';
  }
};

// Función helper para formatear la dirección completa
const formatAddress = (client: Client): string => {
  const addressParts: string[] = [];

  if (client.address_line) {
    addressParts.push(client.address_line);
  }

  // Construir la dirección administrativa
  const administrativeParts: string[] = [];
  if (client.district) administrativeParts.push(client.district);
  if (client.province) administrativeParts.push(client.province);
  if (client.department) administrativeParts.push(client.department);

  if (administrativeParts.length > 0) {
    addressParts.push(administrativeParts.join(', '));
  }

  return addressParts.join(' - ') || '-';
};

// Función helper para obtener el nombre del país
const getCountryName = (countryCode?: string): string => {
  const countries: { [key: string]: string } = {
    'PE': 'Perú',
    'CO': 'Colombia',
    'EC': 'Ecuador',
    'BO': 'Bolivia',
    'BR': 'Brasil',
    'AR': 'Argentina',
    'CL': 'Chile',
    'US': 'Estados Unidos',
    'ES': 'España',
  };

  return countryCode ? countries[countryCode] || countryCode : '';
};

export const ClientsListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estados para filtros y modales
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDocType, setFilterDocType] = useState<DocType | 'ALL'>('ALL');
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [filterCountry, setFilterCountry] = useState<string>('ALL');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

  // Query para obtener clientes
  const {
    data: clients,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutación para eliminar cliente
  const deleteClientMutation = useMutation({
    mutationFn: (id: number) => clientsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente eliminado correctamente');
      setIsDeleteModalOpen(false);
      setSelectedClient(null);
    },
    onError: (error: any) => {
      console.error('Error eliminando cliente:', error);
      if (error.response?.status === 403) {
        toast.error('No tienes permisos para eliminar clientes');
      } else if (error.response?.status === 404) {
        toast.error('Cliente no encontrado');
      } else {
        toast.error(error.response?.data?.detail || 'Error al eliminar cliente');
      }
    }
  });

  // Obtener países únicos para el filtro
  const uniqueCountries = clients ? Array.from(new Set(
    clients
      .map(client => client.country_code)
      .filter(Boolean)
  )).sort() : [];

  // Filtrar clientes según criterios (optimizado con useMemo)
  const filteredClients = useMemo(() => {
    if (!clients) return [];

    const searchLower = searchTerm.toLowerCase();

    return clients.filter(client => {
      // Filtro por tipo de documento
      if (filterDocType !== 'ALL' && client.doc_type !== filterDocType) return false;

      // Filtro por estado
      if (filterActive === 'ACTIVE' && !client.is_active) return false;
      if (filterActive === 'INACTIVE' && client.is_active) return false;

      // Filtro por país
      if (filterCountry !== 'ALL' && client.country_code !== filterCountry) return false;

      // Filtro por búsqueda (optimizado)
      if (searchTerm !== '') {
        const nameLower = client.name.toLowerCase();
        const emailLower = client.email?.toLowerCase() || '';
        const addressLower = client.address_line?.toLowerCase() || '';
        const departmentLower = client.department?.toLowerCase() || '';
        const provinceLower = client.province?.toLowerCase() || '';
        const districtLower = client.district?.toLowerCase() || '';

        if (
          !nameLower.includes(searchLower) &&
          !client.doc_number.includes(searchTerm) &&
          !emailLower.includes(searchLower) &&
          !(client.phone && client.phone.includes(searchTerm)) &&
          !addressLower.includes(searchLower) &&
          !departmentLower.includes(searchLower) &&
          !provinceLower.includes(searchLower) &&
          !districtLower.includes(searchLower)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [clients, searchTerm, filterDocType, filterActive, filterCountry]);

  // Ajustar la página actual si cambia la cantidad de elementos filtrados
  const totalPages = Math.max(1, Math.ceil(filteredClients.length / itemsPerPage));

  useEffect(() => {
    // Si los filtros cambian, volver a la primera página
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterDocType, filterActive, filterCountry, clients?.length]);

  useEffect(() => {
    // Asegurar que la página actual no exceda el total de páginas
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedClient) {
      deleteClientMutation.mutate(selectedClient.id);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#1F4690]/10">
              <UsersIcon className="h-6 w-6 text-[#1F4690]" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-[32px] font-medium text-dm-text-primary tracking-[-0.64px] leading-[1.19]" style={{ fontFamily: "'Inter', sans-serif" }}>
                Clientes
              </h1>
              <p className="mt-1 text-[15px] text-dm-text-secondary leading-[1.33]">
                Gestiona tu base de datos de clientes
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="rounded-full px-4 py-2.5 bg-dm-bg-primary border border-dm-border-primary text-[14px] font-medium text-dm-text-primary hover:bg-dm-bg-secondary"
          >
            Reintentar
          </button>
        </div>
        <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-6">
          <h3 className="text-[15px] font-medium text-dm-text-primary">Error al cargar clientes</h3>
          <p className="mt-1 text-[13px] text-dm-text-secondary">No se pudieron cargar los clientes. Por favor, intente nuevamente.</p>
          <button
            onClick={handleRefresh}
            className="mt-4 rounded-full px-4 py-2.5 bg-dm-bg-primary border border-dm-border-primary text-[14px] font-medium text-dm-text-primary hover:bg-dm-bg-secondary"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#1F4690]/10">
            <UsersIcon className="h-6 w-6 text-[#1F4690]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-[32px] font-medium text-dm-text-primary tracking-[-0.64px] leading-[1.19]" style={{ fontFamily: "'Inter', sans-serif" }}>
              Clientes
            </h1>
            <p className="mt-1 text-[15px] text-dm-text-secondary leading-[1.33]">
              Gestiona tu base de datos de clientes
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Spinner size="md" />
          <p className="text-[14px] text-dm-text-muted">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#1F4690]/10">
            <UsersIcon className="h-6 w-6 text-[#1F4690]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-[32px] font-medium text-dm-text-primary tracking-[-0.64px] leading-[1.19]" style={{ fontFamily: "'Inter', sans-serif" }}>
              Clientes
            </h1>
            <p className="mt-1 text-[15px] text-dm-text-secondary leading-[1.33]">
              Gestiona tu base de datos de clientes
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            className="rounded-full px-4 py-2.5 bg-dm-bg-primary border border-dm-border-primary text-[14px] font-medium text-dm-text-primary hover:bg-dm-bg-secondary flex-1 sm:flex-none"
          >
            Actualizar
          </button>
          <button
            onClick={() => navigate('/clients/new')}
            className="rounded-full px-5 py-2.5 bg-[#1F4690] hover:bg-[#163672] text-white text-[14px] font-medium flex items-center flex-1 sm:flex-none justify-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4 lg:p-5">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          {/* Campo de búsqueda de cliente */}
          <div className="relative flex-1 min-w-0 w-full">
            <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
              Búsqueda de cliente
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-dm-text-muted" />
              </div>
              <input
                type="text"
                className="pl-10 block w-full min-w-0 px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-primary placeholder:text-dm-text-muted focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all"
                placeholder="Buscar por nombre, documento, email, teléfono o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Fila de filtros: Documento, Estado y País */}
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-end w-full lg:w-auto">
            <div className="relative w-full sm:w-auto">
              <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
                Documento
              </label>
              <div className="relative">
                <select
                  className="peer w-full sm:w-auto appearance-none px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-primary focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all min-w-[200px] pr-10"
                  value={filterDocType}
                  onChange={(e) => setFilterDocType(e.target.value as DocType | 'ALL')}
                >
                  <option value="ALL">Todos los documentos</option>
                  <option value="6">RUC</option>
                  <option value="1">DNI</option>
                  <option value="4">Carnet de Extranjería</option>
                  <option value="7">Pasaporte</option>
                  <option value="0">Otros</option>
                </select>
                <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dm-text-muted rotate-90 pointer-events-none transition-transform duration-200 peer-focus:-rotate-90" />
              </div>
            </div>

            <div className="relative w-full sm:w-auto">
              <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
                Estado
              </label>
              <div className="relative">
                <select
                  className="peer w-full sm:w-auto appearance-none px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-primary focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all min-w-[160px] pr-10"
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                >
                  <option value="ALL">Todos los estados</option>
                  <option value="ACTIVE">Activos</option>
                  <option value="INACTIVE">Inactivos</option>
                </select>
                <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dm-text-muted rotate-90 pointer-events-none transition-transform duration-200 peer-focus:-rotate-90" />
              </div>
            </div>

            {uniqueCountries.length > 0 && (
              <div className="relative w-full sm:w-auto">
                <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
                  País
                </label>
                <div className="relative">
                  <select
                    className="peer w-full sm:w-auto appearance-none px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-primary focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all min-w-[160px] pr-10"
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                  >
                    <option value="ALL">Todos los países</option>
                    {uniqueCountries.map((countryCode) => (
                      <option key={countryCode} value={countryCode}>
                        {getCountryName(countryCode)}
                      </option>
                    ))}
                  </select>
                  <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dm-text-muted rotate-90 pointer-events-none transition-transform duration-200 peer-focus:-rotate-90" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      {clients && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4 text-center">
            <div className="text-[24px] font-semibold text-dm-text-primary">{clients.length}</div>
            <div className="text-[13px] text-dm-text-muted">Total</div>
          </div>
          <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4 text-center">
            <div className="text-[24px] font-semibold text-dm-text-primary">
              {clients.filter(c => c.is_active).length}
            </div>
            <div className="text-[13px] text-dm-text-muted">Activos</div>
          </div>
          <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4 text-center">
            <div className="text-[24px] font-semibold text-dm-text-primary">
              {clients.filter(c => !c.is_active).length}
            </div>
            <div className="text-[13px] text-dm-text-muted">Inactivos</div>
          </div>
          <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4 text-center">
            <div className="text-[24px] font-semibold text-dm-text-primary">
              {clients.filter(c => c.doc_type === '6').length}
            </div>
            <div className="text-[13px] text-dm-text-muted">Empresas (RUC)</div>
          </div>
        </div>
      )}

      {/* Vista de Tarjetas (Móvil) */}
      <div className="block lg:hidden space-y-4">
        {paginatedClients.map((client) => (
          <div key={client.id} className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary overflow-hidden">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-[14px] font-medium text-dm-text-primary">{client.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="rounded-full px-2.5 py-0.5 text-[12px] font-medium bg-dm-bg-secondary text-dm-text-muted">
                      {getDocTypeDisplay(client.doc_type)}
                    </span>
                    <span className="text-[13px] font-mono text-dm-text-secondary">
                      {client.doc_number}
                    </span>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium bg-dm-bg-secondary ${client.is_active ? 'text-[#10c22b]' : 'text-[#cf1322]'}`}>
                  {client.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="space-y-2 text-[13px] text-dm-text-secondary">
                {client.address_line && (
                  <div className="flex items-start gap-2">
                    <span className="font-medium min-w-[70px] text-dm-text-primary">Dirección:</span>
                    <span>{formatAddress(client)}</span>
                  </div>
                )}
                {(client.email || client.phone) && (
                  <div className="flex items-start gap-2">
                    <span className="font-medium min-w-[70px] text-dm-text-primary">Contacto:</span>
                    <div className="flex flex-col">
                      {client.email && <span>{client.email}</span>}
                      {client.phone && <span>{client.phone}</span>}
                    </div>
                  </div>
                )}
                {client.country_code && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium min-w-[70px] text-dm-text-primary">País:</span>
                    <span>{getCountryName(client.country_code)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 py-3 border-t border-dm-border-secondary bg-dm-bg-secondary flex justify-end gap-2">
              <button
                onClick={() => navigate(`/clients/${client.id}`)}
                className="flex items-center justify-center h-9 w-9 rounded-full bg-dm-bg-secondary hover:bg-dm-bg-hover transition-colors"
                title="Editar cliente"
              >
                <PencilIcon className="h-4 w-4 text-dm-text-secondary" />
              </button>
              <button
                onClick={() => handleDelete(client)}
                className="flex items-center justify-center h-9 w-9 rounded-full bg-dm-bg-secondary hover:bg-dm-bg-hover transition-colors"
                title="Eliminar cliente"
              >
                <TrashIcon className="h-4 w-4 text-[#cf1322]" />
              </button>
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-6 text-center">
            <p className="text-[14px] text-dm-text-muted">
              {clients && clients.length > 0
                ? 'No se encontraron clientes con los filtros aplicados'
                : 'No hay clientes registrados'
              }
            </p>
          </div>
        )}
      </div>

      {/* Tabla de clientes (Desktop) */}
      <div className="hidden lg:block bg-dm-bg-primary rounded-[12px] border border-dm-border-primary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dm-border-secondary">
            <thead className="bg-dm-bg-secondary">
              <tr>
                <th scope="col" className="px-5 py-3.5 text-left text-[13px] font-medium text-dm-text-secondary uppercase tracking-wider">
                  Tipo Doc.
                </th>
                <th scope="col" className="px-5 py-3.5 text-left text-[13px] font-medium text-dm-text-secondary uppercase tracking-wider">
                  Número Doc.
                </th>
                <th scope="col" className="px-5 py-3.5 text-left text-[13px] font-medium text-dm-text-secondary uppercase tracking-wider">
                  Nombre / Razón Social
                </th>
                <th scope="col" className="px-5 py-3.5 text-left text-[13px] font-medium text-dm-text-secondary uppercase tracking-wider">
                  Dirección
                </th>
                <th scope="col" className="px-5 py-3.5 text-left text-[13px] font-medium text-dm-text-secondary uppercase tracking-wider">
                  Contacto
                </th>
                <th scope="col" className="px-5 py-3.5 text-left text-[13px] font-medium text-dm-text-secondary uppercase tracking-wider">
                  País
                </th>
                <th scope="col" className="px-5 py-3.5 text-left text-[13px] font-medium text-dm-text-secondary uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-5 py-3.5 text-right text-[13px] font-medium text-dm-text-secondary uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dm-border-secondary">
              {paginatedClients.map((client) => (
                <tr key={client.id} className="hover:bg-dm-bg-secondary/60 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="rounded-full px-2.5 py-0.5 text-[12px] font-medium bg-dm-bg-secondary text-dm-text-muted">
                      {getDocTypeDisplay(client.doc_type)}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap font-mono text-[14px] text-dm-text-primary">
                    {client.doc_number}
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-[14px] font-medium text-dm-text-primary">{client.name}</div>
                    {client.ubigeo && (
                      <div className="text-[12px] text-dm-text-muted mt-0.5">Ubigeo: {client.ubigeo}</div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-[14px] text-dm-text-primary max-w-xs">
                      {formatAddress(client)}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-[14px]">
                      {client.email && (
                        <div className="text-dm-text-primary">{client.email}</div>
                      )}
                      {client.phone && (
                        <div className="text-dm-text-muted">{client.phone}</div>
                      )}
                      {!client.email && !client.phone && (
                        <span className="text-dm-text-muted">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-[14px] text-dm-text-primary">
                    {getCountryName(client.country_code) || '-'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium bg-dm-bg-secondary ${client.is_active ? 'text-[#10c22b]' : 'text-[#cf1322]'}`}>
                      {client.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/clients/${client.id}`)}
                        className="flex items-center justify-center h-9 w-9 rounded-full bg-dm-bg-secondary hover:bg-dm-bg-hover transition-colors"
                        title="Editar cliente"
                      >
                        <PencilIcon className="h-4 w-4 text-dm-text-secondary" />
                      </button>
                      <button
                        onClick={() => handleDelete(client)}
                        className="flex items-center justify-center h-9 w-9 rounded-full bg-dm-bg-secondary hover:bg-dm-bg-hover transition-colors"
                        title="Eliminar cliente"
                      >
                        <TrashIcon className="h-4 w-4 text-[#cf1322]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-4 text-center text-[14px] text-dm-text-muted">
                    {clients && clients.length > 0
                      ? 'No se encontraron clientes con los filtros aplicados'
                      : 'No hay clientes registrados'
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Controles de paginación */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4 gap-4 sm:gap-0">
        <div className="text-[13px] text-dm-text-muted text-center sm:text-left">
          Mostrando <span className="font-medium text-dm-text-primary">{filteredClients.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage + 1)}</span>
          {' - '}
          <span className="font-medium text-dm-text-primary">{Math.min(currentPage * itemsPerPage, filteredClients.length)}</span>
          {' de '}
          <span className="font-medium text-dm-text-primary">{filteredClients.length}</span>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className={`px-3 py-1.5 rounded-[12px] text-[13px] border border-dm-border-primary ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dm-bg-secondary text-dm-text-primary'}`}>
            &laquo;
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1.5 rounded-[12px] text-[13px] border border-dm-border-primary ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dm-bg-secondary text-dm-text-primary'}`}>
            &lsaquo;
          </button>

          {/* Números de página simples: mostrar algunas páginas alrededor de la actual */}
          <div className="hidden sm:flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`px-3 py-1.5 rounded-[12px] text-[13px] border ${p === currentPage ? 'bg-[#1F4690] text-white border-[#1F4690]' : 'border-dm-border-primary hover:bg-dm-bg-secondary text-dm-text-primary'}`}>
                {p}
              </button>
            ))}
          </div>

          {/* Versión móvil de números de página (solo actual/total) */}
          <div className="sm:hidden text-[13px] text-dm-text-muted px-2">
            {currentPage} / {totalPages}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1.5 rounded-[12px] text-[13px] border border-dm-border-primary ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dm-bg-secondary text-dm-text-primary'}`}>
            &rsaquo;
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1.5 rounded-[12px] text-[13px] border border-dm-border-primary ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dm-bg-secondary text-dm-text-primary'}`}>
            &raquo;
          </button>
        </div>
      </div>

      {/* Modal de confirmación para eliminar */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
        maxWidth="sm"
      >
        <div className="rounded-[20px] border border-dm-border-primary overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-amber-500/10 shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 dark:text-amber-400" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[15px] font-medium text-dm-text-primary">¿Eliminar cliente?</h3>
                <p className="mt-1 text-[14px] text-dm-text-secondary">
                  ¿Está seguro que desea eliminar el cliente{' '}
                  <strong className="text-dm-text-primary">{selectedClient?.name}</strong>?
                </p>
                <p className="mt-1 text-[13px] text-dm-text-muted">
                  Esta acción desactivará el cliente en el sistema.
                </p>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-dm-border-secondary bg-dm-bg-secondary flex justify-end gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="rounded-full px-4 py-2.5 bg-dm-bg-primary border border-dm-border-primary text-[14px] font-medium text-dm-text-primary hover:bg-dm-bg-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleteClientMutation.isPending}
              className="rounded-full px-5 py-2.5 bg-[#cf1322] hover:bg-[#a8101c] text-white text-[14px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteClientMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
