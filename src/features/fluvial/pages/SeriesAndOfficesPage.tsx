import React, { useState, useMemo, useRef } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';
import { Spinner } from '../../../components/common/Spinner';
import { DocumentSeries, BranchOffice, Port } from '../../../types';
import { toast } from 'react-toastify';

// Hooks para Series
import {
  useDocumentSeries,
  useCreateDocumentSeries,
  useUpdateDocumentSeries,
  useDeactivateDocumentSeries,
} from '../../../hooks/useDocumentSeries';
import {
  DocumentSeriesCreateData,
  DocumentSeriesUpdateData,
} from '../../../services/documentSeries.service';

// Hooks para Sucursales
import {
  useBranchOffices,
  useCreateBranchOffice,
  useUpdateBranchOffice,
  useDeactivateBranchOffice,
} from '../../../hooks/useBranchOffices';
import {
  BranchOfficeCreateData,
  BranchOfficeUpdateData,
} from '../../../services/branchOffices.service';

// Hooks para Puertos
import { usePorts } from '../../../hooks/useCitiesPortsData';

// --- Constantes y Helpers ---
const DOCUMENT_TYPE_OPTIONS = [
  { code: '01', name: 'Factura Electrónica' },
  { code: '03', name: 'Boleta de Venta Electrónica' },
  { code: '07', name: 'Nota de Crédito' },
  { code: '08', name: 'Nota de Débito' },
  { code: 'COT', name: 'Cotizaciones' },
  { code: '09', name: 'Guía de Remisión del Remitente' },
  { code: '31', name: 'Guía de Remisión de Transportista' },
];

// =============== COMPONENTES DE MODAL ===============

// --- Modal de Sucursales ---
interface BranchOfficeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BranchOfficeCreateData | BranchOfficeUpdateData) => void;
  office?: BranchOffice;
  companyId: number;
  ports: Port[];
}

const BranchOfficeFormModal: React.FC<BranchOfficeFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  office,
  companyId,
  ports,
}) => {
  const isEditing = !!office;
  interface BranchOfficeFormData {
    name: string;
    code: string;
    port_id: number;
    port_name: string;
    port_address: string;
    address_line: string;
    phone: string;
    email: string;
    is_main_office: boolean;
    is_active: boolean;
  }

  const [formData, setFormData] = useState<BranchOfficeFormData>({
    name: '',
    code: '',
    port_id: 0,
    port_name: '',
    port_address: '',
    address_line: '',
    phone: '',
    email: '',
    is_main_office: false,
    is_active: true,
  });

  React.useEffect(() => {
    if (isOpen) {
      const officeObj: any = office as any;
      const initialPortId: number = (() => {
        if (isEditing) {
          if (officeObj && officeObj.port && typeof officeObj.port.id === 'number')
            return officeObj.port.id;
          return 0;
        }
        if (officeObj && officeObj.port && typeof officeObj.port.id === 'number')
          return officeObj.port.id;
        return ports.length > 0 ? ports[0].id : 0;
      })();

      setFormData({
        name: office?.name || '',
        code: office?.code || '',
        port_id: initialPortId,
        port_name: office?.port_name ?? '',
        port_address: office?.port_address ?? '',
        address_line: office?.address_line || '',
        phone: office?.phone || '',
        email: office?.email || '',
        is_main_office: office?.is_main_office || false,
        is_active: office?.is_active ?? true,
      });
    }
  }, [isOpen, office, ports]);

  const portSelectChangedRef = useRef(false);

  React.useEffect(() => {
    if (!ports || ports.length === 0) return;
    const selected = ports.find((p) => p.id === formData.port_id);
    if (!selected) return;
    if (isEditing && !portSelectChangedRef.current) return;
    setFormData((prev) => ({
      ...prev,
      port_name: prev.port_name?.trim() ? prev.port_name : selected.name || prev.port_name,
      port_address: prev.port_address?.trim()
        ? prev.port_address
        : selected.address || prev.port_address,
    }));
  }, [formData.port_id, ports, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.port_id === 0) {
      toast.error('Por favor, seleccione un puerto principal para la sucursal.');
      return;
    }
    if (!formData.port_name.trim()) {
      toast.error('Por favor, ingrese el nombre del puerto.');
      return;
    }
    if (!formData.port_address.trim()) {
      toast.error('Por favor, ingrese la dirección del puerto.');
      return;
    }
    const dataToSubmit = {
      name: formData.name,
      code: formData.code || undefined,
      port_id: formData.port_id,
      port_name: formData.port_name,
      port_address: formData.port_address,
      address_line: formData.address_line,
      phone: formData.phone,
      email: formData.email,
      is_main_office: formData.is_main_office,
      is_active: formData.is_active,
    };
    if (isEditing) {
      onSubmit(dataToSubmit);
    } else {
      onSubmit({ ...dataToSubmit, company_id: companyId });
    }
  };

  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Sucursal' : 'Nueva Sucursal'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre de la Sucursal"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Código (Opcional, 4 chars)"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            maxLength={4}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Puerto Principal (Hub)
            </label>
            <select
              value={formData.port_id}
              onChange={(e) => {
                setFormData({ ...formData, port_id: Number(e.target.value) });
                portSelectChangedRef.current = true;
              }}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value={0}>Seleccione un puerto</option>
              {ports.map((port) => (
                <option key={port.id} value={port.id}>
                  {port.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Puerto
            </label>
            <input
              type="text"
              value={formData.port_name}
              onChange={(e) => setFormData({ ...formData, port_name: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Ej: Puerto Fluvial Masusa"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección del Puerto
            </label>
            <input
              type="text"
              value={formData.port_address}
              onChange={(e) => setFormData({ ...formData, port_address: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Ej: Av. La Marina 1234"
              required
            />
          </div>
        </div>
        <Input
          label="Dirección de la Sucursal"
          value={formData.address_line}
          onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Teléfono"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="is_main_office"
              type="checkbox"
              checked={formData.is_main_office}
              onChange={(e) => setFormData({ ...formData, is_main_office: e.target.checked })}
              className="h-4 w-4 rounded"
            />
            <label htmlFor="is_main_office" className="ml-2">
              ¿Es la sucursal principal?
            </label>
          </div>
          {isEditing && (
            <div className="flex items-center">
              <input
                id="is_active_office"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded"
              />
              <label htmlFor="is_active_office" className="ml-2">
                ¿Está activa?
              </label>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">{isEditing ? 'Actualizar' : 'Crear'}</Button>
        </div>
      </form>
    </Modal>
  );
};

// --- Modal de Series ---
interface SeriesFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DocumentSeriesCreateData | DocumentSeriesUpdateData) => void;
  series?: DocumentSeries;
  branchOffices: BranchOffice[];
  preselectedBranchId?: number | null;
}

const SeriesFormModal: React.FC<SeriesFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  series,
  branchOffices,
  preselectedBranchId,
}) => {
  const isEditing = !!series;
  const [formData, setFormData] = useState({
    branch_office_id: 0,
    document_type_code: '01',
    series_code: '',
    current_number: 0,
    is_electronic: true,
    is_active: true,
  });

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        branch_office_id:
          series?.branch_office_id ||
          preselectedBranchId ||
          (branchOffices.length > 0 ? branchOffices[0].id : 0),
        document_type_code: series?.document_type_code || '01',
        series_code: series?.series_code || '',
        current_number: series?.current_number || 0,
        is_electronic: series?.is_electronic ?? true,
        is_active: series?.is_active ?? true,
      });
    }
  }, [isOpen, series, branchOffices, preselectedBranchId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[A-Z0-9]{4}$/.test(formData.series_code)) {
      toast.error('El código de serie debe tener 4 caracteres alfanuméricos (ej. F001).');
      return;
    }
    if (formData.branch_office_id === 0) {
      toast.error('Debe seleccionar una sucursal.');
      return;
    }
    const dataToSubmit = {
      branch_office_id: formData.branch_office_id,
      document_type_code: formData.document_type_code,
      series_code: formData.series_code,
      current_number: Number(formData.current_number),
      is_electronic: formData.is_electronic,
      is_active: formData.is_active,
    };
    if (isEditing) {
      onSubmit({
        branch_office_id: dataToSubmit.branch_office_id,
        current_number: dataToSubmit.current_number,
        is_active: dataToSubmit.is_active,
      });
    } else {
      onSubmit(dataToSubmit);
    }
  };

  if (!isOpen) return null;

  const inputBaseClass =
    'w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  const selectBaseClass =
    'w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  const labelBaseClass = 'block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5';
  const checkboxBaseClass =
    'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Serie' : 'Nueva Serie'} maxWidth="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Fila 1: Tipo de Documento + Código de Serie */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="document_type_code" className={labelBaseClass}>
              Tipo de Documento
            </label>
            <select
              id="document_type_code"
              value={formData.document_type_code}
              onChange={(e) => setFormData({ ...formData, document_type_code: e.target.value })}
              className={`${selectBaseClass} ${isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
              required
              disabled={isEditing}
            >
              {DOCUMENT_TYPE_OPTIONS.map((doc) => (
                <option key={doc.code} value={doc.code}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="series_code" className={labelBaseClass}>
              Código de Serie
            </label>
            <input
              id="series_code"
              type="text"
              value={formData.series_code}
              onChange={(e) =>
                setFormData({ ...formData, series_code: e.target.value.toUpperCase() })
              }
              maxLength={4}
              placeholder="Ej: F001"
              required
              disabled={isEditing}
              className={`${inputBaseClass} font-mono ${isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
            />
            <p className="mt-1 text-xs text-gray-400">4 caracteres alfanuméricos en mayúscula</p>
          </div>
        </div>

        {/* Fila 2: Sucursal + Número Actual */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="branch_office_id" className={labelBaseClass}>
              Sucursal
            </label>
            <select
              id="branch_office_id"
              value={formData.branch_office_id}
              onChange={(e) =>
                setFormData({ ...formData, branch_office_id: Number(e.target.value) })
              }
              className={selectBaseClass}
              required
            >
              <option value={0}>Seleccione una sucursal</option>
              {branchOffices.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="current_number" className={labelBaseClass}>
              Número Actual
            </label>
            <input
              id="current_number"
              type="number"
              value={String(formData.current_number)}
              onChange={(e) =>
                setFormData({ ...formData, current_number: Number(e.target.value) })
              }
              required
              min={0}
              className={`${inputBaseClass} font-mono`}
            />
          </div>
        </div>

        {/* Fila 3: Checkboxes */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 pt-1">
          <div className="flex items-center">
            <input
              id="is_electronic"
              type="checkbox"
              checked={formData.is_electronic}
              onChange={(e) => setFormData({ ...formData, is_electronic: e.target.checked })}
              className={checkboxBaseClass}
              disabled={isEditing}
            />
            <label htmlFor="is_electronic" className="ml-2 text-sm text-gray-700 select-none">
              ¿Es Electrónica?
            </label>
          </div>

          {isEditing && (
            <div className="flex items-center">
              <input
                id="is_active_series"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className={checkboxBaseClass}
              />
              <label htmlFor="is_active_series" className="ml-2 text-sm text-gray-700 select-none">
                ¿Está Activa?
              </label>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto justify-center">
            Cancelar
          </Button>
          <Button type="submit" className="w-full sm:w-auto justify-center">
            {isEditing ? 'Actualizar Serie' : 'Crear Serie'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// =============== PÁGINA PRINCIPAL ===============
export const DocumentSeriesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'offices' | 'series'>('offices');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BranchOffice | DocumentSeries | undefined>();
  const [preselectedBranchId, setPreselectedBranchId] = useState<number | null>(null);
  const [seriesView, setSeriesView] = useState<'branches' | 'branch-detail'>('branches');
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  const companyId = 1;

  // Obtención de datos
  const { data: offices = [], isLoading: isLoadingOffices } = useBranchOffices(companyId);
  const { data: series = [], isLoading: isLoadingSeries } = useDocumentSeries(companyId);
  const { data: primaryPorts = [], isLoading: isLoadingPorts } = usePorts({ portType: 'PRIMARY_HUB' });

  // Mutaciones
  const createOfficeMutation = useCreateBranchOffice();
  const updateOfficeMutation = useUpdateBranchOffice();
  const deactivateOfficeMutation = useDeactivateBranchOffice();
  const createSeriesMutation = useCreateDocumentSeries();
  const updateSeriesMutation = useUpdateDocumentSeries();
  const deactivateSeriesMutation = useDeactivateDocumentSeries();

  const handleOpenModal = (item?: BranchOffice | DocumentSeries) => {
    setEditingItem(item);
    setPreselectedBranchId(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setEditingItem(undefined);
    setPreselectedBranchId(null);
    setShowModal(false);
  };

  const handleOpenSeriesModalForBranch = (branchId: number) => {
    setEditingItem(undefined);
    setPreselectedBranchId(branchId);
    setShowModal(true);
  };

  const handleSubmit = (data: any) => {
    if (activeTab === 'offices') {
      if (editingItem) {
        updateOfficeMutation.mutate({ id: editingItem.id, data }, { onSuccess: handleCloseModal });
      } else {
        createOfficeMutation.mutate(data, { onSuccess: handleCloseModal });
      }
    } else {
      const seriesData = data as DocumentSeriesCreateData;
      if (editingItem) {
        updateSeriesMutation.mutate({ id: editingItem.id, data }, { onSuccess: handleCloseModal });
      } else {
        createSeriesMutation.mutate({ ...seriesData, company_id: companyId }, { onSuccess: handleCloseModal });
      }
    }
  };

  const handleDelete = (id: number) => {
    const confirmText =
      activeTab === 'offices'
        ? '¿Desactivar esta sucursal? Verifique que no sea la principal o no tenga usuarios asignados.'
        : '¿Desactivar esta serie? No podrá usarse para nuevos documentos.';
    if (window.confirm(confirmText)) {
      if (activeTab === 'offices') {
        deactivateOfficeMutation.mutate(id);
      } else {
        deactivateSeriesMutation.mutate(id);
      }
    }
  };

  const filteredOffices = useMemo(
    () => offices.filter((o) => o.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [offices, searchTerm]
  );

  const seriesByBranch = useMemo(() => {
    const map: Record<number, DocumentSeries[]> = {};
    series.forEach((s) => {
      if (!map[s.branch_office_id]) map[s.branch_office_id] = [];
      map[s.branch_office_id].push(s);
    });
    return map;
  }, [series]);

  const filteredOfficesForSeries = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return offices.filter((o) => {
      const matchesOffice = o.name.toLowerCase().includes(term);
      const officeSeries = seriesByBranch[o.id] || [];
      const matchesSeries = officeSeries.some(
        (s) =>
          s.series_code.toLowerCase().includes(term) ||
          (DOCUMENT_TYPE_OPTIONS.find((d) => d.code === s.document_type_code)?.name || '')
            .toLowerCase()
            .includes(term)
      );
      return matchesOffice || matchesSeries;
    });
  }, [offices, seriesByBranch, searchTerm]);

  const selectedOffice = useMemo(
    () => offices.find((o) => o.id === selectedBranchId),
    [offices, selectedBranchId]
  );

  const selectedBranchSeries = useMemo(() => {
    if (!selectedBranchId) return [];
    const term = searchTerm.toLowerCase();
    const list = seriesByBranch[selectedBranchId] || [];
    if (!term) return list;
    return list.filter(
      (s) =>
        s.series_code.toLowerCase().includes(term) ||
        (DOCUMENT_TYPE_OPTIONS.find((d) => d.code === s.document_type_code)?.name || '')
          .toLowerCase()
          .includes(term)
    );
  }, [seriesByBranch, selectedBranchId, searchTerm]);

  const isLoading = isLoadingOffices || isLoadingSeries || isLoadingPorts;

  const enterBranchDetail = (branchId: number) => {
    setSelectedBranchId(branchId);
    setSeriesView('branch-detail');
    setSearchTerm('');
  };

  const goBackToBranches = () => {
    setSeriesView('branches');
    setSelectedBranchId(null);
    setSearchTerm('');
  };

  const switchTab = (tab: 'offices' | 'series') => {
    setActiveTab(tab);
    setSearchTerm('');
    setSeriesView('branches');
    setSelectedBranchId(null);
    setPreselectedBranchId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración de Sucursales y Series</h1>
        <p className="text-gray-600">Gestiona las sucursales y las series de documentos de tu compañía.</p>
      </div>

      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
          <button
            onClick={() => switchTab('offices')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
              activeTab === 'offices'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BuildingStorefrontIcon className="h-5 w-5 mr-2" />
            Sucursales ({offices.length})
          </button>
          <button
            onClick={() => switchTab('series')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
              activeTab === 'series'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
            Series ({series.length})
          </button>
        </nav>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      ) : activeTab === 'offices' ? (
        <>
          {/* Search and Action - Offices */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:max-w-md">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                className="pl-10 p-2 border rounded-md w-full"
                placeholder="Buscar en sucursales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              onClick={() => handleOpenModal()}
              className="flex items-center justify-center w-full sm:w-auto"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nueva Sucursal
            </Button>
          </div>

          {/* Mobile Card View - Offices */}
          <div className="block lg:hidden space-y-4">
            {filteredOffices.map((office) => (
              <div key={office.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900">{office.name}</h3>
                    {office.code && <p className="text-sm text-gray-500">Código: {office.code}</p>}
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      office.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {office.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <div className="space-y-2 text-sm mb-3">
                  <div>
                    <span className="block text-xs text-gray-500">Dirección de la Sucursal</span>
                    <span className="font-medium text-gray-900">
                      {office.address_line || 'Sin dirección'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Puerto</span>
                    <span className="font-medium text-gray-900">
                      {office.port_name && office.port_name.trim() ? office.port_name : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Dirección del Puerto</span>
                    <span className="font-medium text-gray-900">
                      {office.port_address && office.port_address.trim()
                        ? office.port_address
                        : 'Sin dirección'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Contacto</span>
                    <span className="font-medium text-gray-900">{office.phone || '-'}</span>
                    {office.email && <span className="text-gray-500 block">{office.email}</span>}
                  </div>
                  {office.is_main_office && (
                    <div className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      Sucursal Principal
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleOpenModal(office)}
                    className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" /> Editar
                  </button>
                  {office.is_active && (
                    <button
                      onClick={() => handleDelete(office.id)}
                      className="flex items-center text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" /> Desactivar
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filteredOffices.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
                No se encontraron sucursales.
              </div>
            )}
          </div>

          {/* Desktop Table View - Offices */}
          <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Sucursal</th>
                  <th className="px-6 py-3">Dirección de la Sucursal</th>
                  <th className="px-6 py-3">Puerto</th>
                  <th className="px-6 py-3">Dirección del Puerto</th>
                  <th className="px-6 py-3">Contacto</th>
                  <th className="px-6 py-3 text-center">Principal</th>
                  <th className="px-6 py-3 text-center">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOffices.map((office) => (
                  <tr key={office.id}>
                    <td className="px-6 py-4">
                      <div className="font-medium">{office.name}</div>
                      <div className="text-sm text-gray-500">{office.code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {office.address_line || 'Sin dirección'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {office.port_name && office.port_name.trim() ? office.port_name : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {office.port_address && office.port_address.trim()
                          ? office.port_address
                          : 'Sin dirección'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{office.phone || '-'}</div>
                      <div className="text-sm text-gray-500">{office.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {office.is_main_office ? 'Sí' : 'No'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          office.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {office.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(office)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      {office.is_active && (
                        <button
                          onClick={() => handleDelete(office.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOffices.length === 0 && (
              <div className="p-6 text-center text-gray-500">No se encontraron sucursales.</div>
            )}
          </div>
        </>
      ) : seriesView === 'branches' ? (
        <>
          {/* Search - Series Branches View */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:max-w-md">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                className="pl-10 p-2 border rounded-md w-full"
                placeholder="Buscar sucursal o serie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Branch Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOfficesForSeries.map((office) => {
              const officeSeries = seriesByBranch[office.id] || [];
              return (
                <div
                  key={office.id}
                  onClick={() => enterBranchDetail(office.id)}
                  className="cursor-pointer bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <BuildingStorefrontIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{office.name}</h3>
                        <p className="text-sm text-gray-500">
                          {office.address_line || 'Sin dirección'}
                        </p>
                      </div>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400 shrink-0 mt-2" />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {officeSeries.length > 0 ? (
                      officeSeries.slice(0, 4).map((s) => (
                        <span
                          key={s.id}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            s.is_active
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {DOCUMENT_TYPE_OPTIONS.find((d) => d.code === s.document_type_code)
                            ?.name || s.document_type_code}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">Sin series configuradas</span>
                    )}
                    {officeSeries.length > 4 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        +{officeSeries.length - 4}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    {officeSeries.length} serie{officeSeries.length !== 1 ? 's' : ''}
                    {officeSeries.filter((s) => !s.is_active).length > 0 && (
                      <span className="ml-2 text-red-500">
                        ({officeSeries.filter((s) => !s.is_active).length} inactiva
                        {officeSeries.filter((s) => !s.is_active).length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredOfficesForSeries.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500 border border-gray-200">
              <BuildingStorefrontIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">No se encontraron sucursales</p>
              <p className="text-sm">Prueba con otro término de búsqueda.</p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Branch Detail Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={goBackToBranches}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Volver a sucursales"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedOffice?.name}</h2>
                <p className="text-sm text-gray-500">Series de documentos configuradas</p>
              </div>
            </div>
            <Button
              onClick={() =>
                selectedBranchId ? handleOpenSeriesModalForBranch(selectedBranchId) : undefined
              }
              className="flex items-center justify-center w-full sm:w-auto"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nueva Serie
            </Button>
          </div>

          {/* Search inside branch detail */}
          <div className="relative w-full sm:max-w-md">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="pl-10 p-2 border rounded-md w-full"
              placeholder="Buscar serie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Mobile Card View - Branch Series */}
          <div className="block lg:hidden space-y-4">
            {selectedBranchSeries.map((s) => (
              <div key={s.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900">
                      {DOCUMENT_TYPE_OPTIONS.find((d) => d.code === s.document_type_code)?.name ||
                        s.document_type_code}
                    </h3>
                    <p className="text-sm text-gray-500 font-mono">Serie: {s.series_code}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      s.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {s.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="space-y-2 text-sm mb-3">
                  <div>
                    <span className="block text-xs text-gray-500">Número Actual</span>
                    <span className="font-mono font-medium text-gray-900">
                      {s.current_number.toString().padStart(8, '0')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="block text-xs text-gray-500">Electrónica</span>
                      <span className="font-medium text-gray-900">
                        {s.is_electronic ? 'Sí' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleOpenModal(s)}
                    className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" /> Editar
                  </button>
                  {s.is_active && (
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="flex items-center text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" /> Desactivar
                    </button>
                  )}
                </div>
              </div>
            ))}
            {selectedBranchSeries.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500 border border-gray-200">
                No se encontraron series en esta sucursal.
              </div>
            )}
          </div>

          {/* Desktop Table View - Branch Series */}
          <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-x-auto border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Tipo Documento</th>
                  <th className="px-6 py-3">Serie</th>
                  <th className="px-6 py-3">Número Actual</th>
                  <th className="px-6 py-3 text-center">Electrónica</th>
                  <th className="px-6 py-3 text-center">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedBranchSeries.map((s) => (
                  <tr key={s.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <ClipboardDocumentListIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div className="font-medium text-gray-900">
                          {DOCUMENT_TYPE_OPTIONS.find((d) => d.code === s.document_type_code)
                            ?.name || s.document_type_code}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono">{s.series_code}</td>
                    <td className="px-6 py-4 font-mono">
                      {s.current_number.toString().padStart(8, '0')}
                    </td>
                    <td className="px-6 py-4 text-center">{s.is_electronic ? 'Sí' : 'No'}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          s.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {s.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(s)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      {s.is_active && (
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {selectedBranchSeries.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No se encontraron series en esta sucursal.
              </div>
            )}
          </div>
        </>
      )}

      {showModal &&
        (activeTab === 'offices' ? (
          <BranchOfficeFormModal
            isOpen={showModal}
            onClose={handleCloseModal}
            onSubmit={handleSubmit}
            office={editingItem as BranchOffice}
            companyId={companyId}
            ports={primaryPorts}
          />
        ) : (
          <SeriesFormModal
            isOpen={showModal}
            onClose={handleCloseModal}
            onSubmit={handleSubmit}
            series={editingItem as DocumentSeries}
            branchOffices={offices}
            preselectedBranchId={preselectedBranchId}
          />
        ))}
    </div>
  );
};
