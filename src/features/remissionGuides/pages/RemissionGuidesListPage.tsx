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
  BuildingOfficeIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
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

    if (debouncedSearchTerm) {
      filtered = filtered.filter(guide =>
        ((guide as any).recipient_name || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        `${guide.series}-${guide.number}`.includes(debouncedSearchTerm) ||
        ((guide as any).vessel_name || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1F4690]/10 flex items-center justify-center shrink-0">
            <DocumentTextIcon className="w-5 h-5 text-[#1F4690]" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-dm-text-primary truncate">
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
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-dm-text-muted" strokeWidth={1.5} />
          <span className="text-[14px] text-dm-text-primary">
            {format(parseISO(item.issue_date), 'dd/MM/yyyy')}
          </span>
        </div>
      ),
    },
    {
      key: 'recipient',
      header: 'Destinatario',
      accessor: (item) => (
        <div className="flex items-center gap-2 min-w-0">
          <UserIcon className="w-4 h-4 text-dm-text-muted shrink-0" strokeWidth={1.5} />
          <span className="text-[14px] text-dm-text-primary truncate max-w-[200px]">
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
        <div className="flex items-center gap-2 min-w-0">
          <MapPinIcon className="w-4 h-4 text-dm-text-muted shrink-0" strokeWidth={1.5} />
          <span className="text-[14px] text-dm-text-primary truncate max-w-[200px]">
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
          <div className="text-[14px] font-medium text-dm-text-primary truncate">
            {item.driver_name || 'N/A'}
          </div>
          <div className="text-[12px] text-dm-text-muted truncate">Lic: {item.driver_license || 'N/A'}</div>
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#33c758]/10 flex items-center justify-center shrink-0">
            <DocumentTextIcon className="w-5 h-5 text-[#33c758]" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-dm-text-primary truncate">
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
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-dm-text-muted" strokeWidth={1.5} />
          <span className="text-[14px] text-dm-text-primary">
            {format(parseISO(item.issue_date), 'dd/MM/yyyy')}
          </span>
        </div>
      ),
    },
    {
      key: 'recipient',
      header: 'Destinatario',
      accessor: (item) => (
        <div className="flex items-center gap-2 min-w-0">
          <UserIcon className="w-4 h-4 text-dm-text-muted shrink-0" strokeWidth={1.5} />
          <span className="text-[14px] text-dm-text-primary truncate max-w-[200px]">
            {(item as any).recipient_name || ''}
          </span>
        </div>
      ),
    },
    {
      key: 'destination',
      header: 'Destino',
      accessor: (item) => (
        <div className="flex items-center gap-2 min-w-0">
          <MapPinIcon className="w-4 h-4 text-dm-text-muted shrink-0" strokeWidth={1.5} />
          <span className="text-[14px] text-dm-text-primary truncate max-w-[200px]">
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

  const statsTransportista = useMemo(() => {
    const total = transportistaGuides.length;
    const accepted = transportistaGuides.filter(g => g.sunat_status === 'ACCEPTED').length;
    const pending = transportistaGuides.filter(g => g.sunat_status === 'PENDING').length;
    const rejected = transportistaGuides.filter(g => g.sunat_status === 'REJECTED').length;
    return { total, accepted, pending, rejected };
  }, [transportistaGuides]);

  const statsRemitente = useMemo(() => {
    const total = remitenteGuides.length;
    const accepted = remitenteGuides.filter(g => g.sunat_status === 'ACCEPTED').length;
    const pending = remitenteGuides.filter(g => g.sunat_status === 'PENDING').length;
    const rejected = remitenteGuides.filter(g => g.sunat_status === 'REJECTED').length;
    return { total, accepted, pending, rejected };
  }, [remitenteGuides]);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1F4690] rounded-xl flex items-center justify-center text-white shrink-0">
            <DocumentTextIcon className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div>
            <h1
              className="text-[28px] font-medium text-dm-text-primary tracking-[-0.56px] leading-[1.19]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Guías de Remisión Electrónicas
            </h1>
            <p className="text-[14px] text-dm-text-secondary">
              Gestiona y administra todas tus guías de remisión electrónicas
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/remission-guides/new?type=transportista')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#918df6] text-white text-[14px] font-medium rounded-[12px] hover:bg-[#7a75e0] transition-colors shadow-[rgba(0,0,0,0.08)_0px_1px_1px_1px,rgba(0,0,0,0.06)_0px_0px_0px_0.5px]"
        >
          <PlusIcon className="w-4 h-4" strokeWidth={2} />
          Nueva Guía
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-dm-bg-primary rounded-2xl border border-dm-border-primary p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#1F4690]/10 rounded-xl flex items-center justify-center shrink-0">
            <TruckIcon className="w-6 h-6 text-[#1F4690]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[13px] text-dm-text-muted">Transportista</p>
            <p className="text-[24px] font-bold text-dm-text-primary leading-tight">{statsTransportista.total}</p>
          </div>
        </div>

        <div className="bg-dm-bg-primary rounded-2xl border border-dm-border-primary p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#33c758]/10 rounded-xl flex items-center justify-center shrink-0">
            <DocumentTextIcon className="w-6 h-6 text-[#33c758]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[13px] text-dm-text-muted">Remitente</p>
            <p className="text-[24px] font-bold text-dm-text-primary leading-tight">{statsRemitente.total}</p>
          </div>
        </div>

        <div className="bg-dm-bg-primary rounded-2xl border border-dm-border-primary p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#ffa600]/10 rounded-xl flex items-center justify-center shrink-0">
            <div className="w-3 h-3 rounded-full bg-[#ffa600]" />
          </div>
          <div>
            <p className="text-[13px] text-dm-text-muted">Total Pendientes</p>
            <p className="text-[24px] font-bold text-[#ffa600] leading-tight">
              {statsTransportista.pending + statsRemitente.pending}
            </p>
          </div>
        </div>

        <div className="bg-dm-bg-primary rounded-2xl border border-dm-border-primary p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#33c758]/10 rounded-xl flex items-center justify-center shrink-0">
            <div className="w-3 h-3 rounded-full bg-[#33c758]" />
          </div>
          <div>
            <p className="text-[13px] text-dm-text-muted">Total Aceptadas</p>
            <p className="text-[24px] font-bold text-[#33c758] leading-tight">
              {statsTransportista.accepted + statsRemitente.accepted}
            </p>
          </div>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-dm-bg-primary rounded-2xl border border-dm-border-primary p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="w-4 h-4 text-dm-text-muted" strokeWidth={1.5} />
          <h3 className="text-[15px] font-semibold text-dm-text-primary">Filtros</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[13px] font-medium text-dm-text-secondary mb-1.5">
              Sucursal Activa
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BuildingOfficeIcon className="w-4 h-4 text-dm-text-muted" strokeWidth={1.5} />
              </div>
              <select
                value={activeBranch?.id || ''}
                onChange={(e) => {
                  const newBranch = branches?.find(b => b.id === Number(e.target.value));
                  if (newBranch) {
                    setActiveBranch(newBranch);
                    localStorage.setItem('selectedSalesBranch', JSON.stringify(newBranch));
                  }
                }}
                className="w-full pl-10 pr-8 py-2.5 bg-dm-bg-primary border border-dm-border-primary rounded-xl text-[14px] text-dm-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-[#918df6]/30 focus:border-[#918df6] transition-colors"
                disabled={isLoadingBranches}
              >
                {branches?.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
              <ChevronDownIcon className="absolute inset-y-0 right-0 w-4 h-4 text-dm-text-muted mr-3 my-auto pointer-events-none" strokeWidth={2} />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-dm-text-secondary mb-1.5">
              Buscar
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="w-4 h-4 text-dm-text-muted" strokeWidth={1.5} />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 bg-dm-bg-primary border border-dm-border-primary rounded-xl text-[14px] text-dm-text-primary placeholder:text-dm-text-muted focus:outline-none focus:ring-2 focus:ring-[#918df6]/30 focus:border-[#918df6] transition-colors"
                placeholder="Buscar por destinatario, número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-dm-text-secondary mb-1.5">
              Estado SUNAT
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 pr-8 py-2.5 bg-dm-bg-primary border border-dm-border-primary rounded-xl text-[14px] text-dm-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-[#918df6]/30 focus:border-[#918df6] transition-colors"
              >
                <option value="">Todos los estados</option>
                <option value="PENDING">Pendiente</option>
                <option value="ACCEPTED">Aceptado</option>
                <option value="REJECTED">Rechazado</option>
                <option value="SENT">Enviado</option>
                <option value="GENERATED">Generado</option>
                <option value="SIGNED">Firmado</option>
              </select>
              <ChevronDownIcon className="absolute inset-y-0 right-0 w-4 h-4 text-dm-text-muted mr-3 my-auto pointer-events-none" strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Transportista ── */}
      <div>
        {/* Header de sección */}
        <div className="px-1 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1F4690]/10 rounded-lg flex items-center justify-center">
              <TruckIcon className="w-4 h-4 text-[#1F4690]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-dm-text-primary">
                Guías de Remisión — Transportista
              </h3>
              <p className="text-[12px] text-dm-text-muted">Document Type Code: 31 · {filteredTransportistaGuides.length} registros</p>
            </div>
          </div>
        </div>

        {/* Desktop: tabla con scrollbar visible */}
        <div className="hidden lg:block bg-dm-bg-primary rounded-2xl border border-dm-border-primary overflow-hidden">
          <div
            className="overflow-x-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#c4c4c4 #f5f5f5' }}
          >
            <DataTable
              columns={columnsTransportista}
              data={filteredTransportistaGuides}
              isLoading={isLoadingGuides}
              keyExtractor={(item) => item.id}
            />
          </div>
        </div>

        {/* Mobile/Tablet: cards */}
        <div className="lg:hidden space-y-3">
          {filteredTransportistaGuides.length === 0 && !isLoadingGuides && (
            <div className="bg-dm-bg-primary rounded-2xl border border-dm-border-primary p-8 text-center">
              <DocumentTextIcon className="w-8 h-8 text-dm-text-muted mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[14px] text-dm-text-muted">No se encontraron guías de transportista</p>
            </div>
          )}
          {isLoadingGuides && (
            <div className="bg-dm-bg-primary rounded-2xl border border-dm-border-primary p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F4690] mx-auto" />
              <p className="text-[14px] text-dm-text-muted mt-3">Cargando guías...</p>
            </div>
          )}
          {filteredTransportistaGuides.map((guide) => (
            <div key={guide.id} className="bg-dm-bg-primary rounded-2xl border border-dm-border-primary p-4 space-y-3">
              {/* Header de card */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1F4690]/10 flex items-center justify-center shrink-0">
                  <DocumentTextIcon className="w-5 h-5 text-[#1F4690]" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-dm-text-primary truncate">
                    {guide.series}-{String(guide.number).padStart(8, '0')}
                  </p>
                  <p className="text-[12px] text-dm-text-muted">
                    {format(parseISO(guide.issue_date), 'dd/MM/yyyy')}
                  </p>
                </div>
                <SunatStatusBadge status={guide.sunat_status} />
              </div>

              {/* Detalles */}
              <div className="space-y-2 pt-2 border-t border-dm-border-secondary">
                <div className="flex justify-between text-[13px]">
                  <span className="text-dm-text-muted">Destinatario</span>
                  <span className="text-dm-text-primary text-right truncate max-w-[55%]">
                    {(guide as any).recipient_name || '—'}
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-dm-text-muted">Destino</span>
                  <span className="text-dm-text-primary text-right truncate max-w-[55%]">
                    {(guide as any).destination_address || '—'}
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-dm-text-muted">Conductor</span>
                  <span className="text-dm-text-primary">{guide.driver_name || 'N/A'}</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="pt-2 border-t border-dm-border-secondary flex items-center justify-between">
                <RemissionGuideActions
                  guide={guide}
                  companyId={activeBranch?.company_id || 0}
                  showLabels
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Remitente ── */}
      <div>
        {/* Header de sección */}
        <div className="px-1 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#33c758]/10 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-4 h-4 text-[#33c758]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-dm-text-primary">
                Guías de Remisión — Remitente
              </h3>
              <p className="text-[12px] text-dm-text-muted">Document Type Code: 09 · {filteredRemitenteGuides.length} registros</p>
            </div>
          </div>
        </div>

        {/* Desktop: tabla con scrollbar visible */}
        <div className="hidden lg:block bg-dm-bg-primary rounded-2xl border border-dm-border-primary overflow-hidden">
          <div
            className="overflow-x-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#c4c4c4 #f5f5f5' }}
          >
            <DataTable
              columns={columnsRemitente}
              data={filteredRemitenteGuides}
              isLoading={isLoadingGuides}
              keyExtractor={(item) => item.id}
            />
          </div>
        </div>

        {/* Mobile/Tablet: cards */}
        <div className="lg:hidden space-y-3">
          {filteredRemitenteGuides.length === 0 && !isLoadingGuides && (
            <div className="bg-dm-bg-primary rounded-2xl border border-dm-border-primary p-8 text-center">
              <DocumentTextIcon className="w-8 h-8 text-dm-text-muted mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[14px] text-dm-text-muted">No se encontraron guías de remitente</p>
            </div>
          )}
          {isLoadingGuides && (
            <div className="bg-dm-bg-primary rounded-2xl border border-dm-border-primary p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#33c758] mx-auto" />
              <p className="text-[14px] text-dm-text-muted mt-3">Cargando guías...</p>
            </div>
          )}
          {filteredRemitenteGuides.map((guide) => (
            <div key={guide.id} className="bg-dm-bg-primary rounded-2xl border border-dm-border-primary p-4 space-y-3">
              {/* Header de card */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#33c758]/10 flex items-center justify-center shrink-0">
                  <DocumentTextIcon className="w-5 h-5 text-[#33c758]" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-dm-text-primary truncate">
                    {guide.series}-{String(guide.number).padStart(8, '0')}
                  </p>
                  <p className="text-[12px] text-dm-text-muted">
                    {format(parseISO(guide.issue_date), 'dd/MM/yyyy')}
                  </p>
                </div>
                <SunatStatusBadge status={guide.sunat_status} />
              </div>

              {/* Detalles */}
              <div className="space-y-2 pt-2 border-t border-dm-border-secondary">
                <div className="flex justify-between text-[13px]">
                  <span className="text-dm-text-muted">Destinatario</span>
                  <span className="text-dm-text-primary text-right truncate max-w-[55%]">
                    {(guide as any).recipient_name || '—'}
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-dm-text-muted">Destino</span>
                  <span className="text-dm-text-primary text-right truncate max-w-[55%]">
                    {(guide as any).destination_address || '—'}
                  </span>
                </div>
              </div>

              {/* Acciones */}
              <div className="pt-2 border-t border-dm-border-secondary flex items-center justify-between">
                <RemissionGuideSenderActions
                  guide={guide}
                  companyId={activeBranch?.company_id || 0}
                  showLabels
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
