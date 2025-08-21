import React, { useState, useMemo, useRef } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, ClipboardDocumentListIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';
import { Spinner } from '../../../components/common/Spinner';
import { DocumentSeries, BranchOffice, Port } from '../../../types';
import { toast } from 'react-toastify';

// Hooks para Series
import { useDocumentSeries, useCreateDocumentSeries, useUpdateDocumentSeries, useDeactivateDocumentSeries } from '../../../hooks/useDocumentSeries';
import { DocumentSeriesCreateData, DocumentSeriesUpdateData } from '../../../services/documentSeries.service';

// Hooks para Sucursales
import { useBranchOffices, useCreateBranchOffice, useUpdateBranchOffice, useDeactivateBranchOffice } from '../../../hooks/useBranchOffices';
import { BranchOfficeCreateData, BranchOfficeUpdateData } from '../../../services/branchOffices.service';

// Hooks para Puertos (necesario para el dropdown en el modal de sucursales)
import { usePorts } from '../../../hooks/useCitiesPortsData';

// --- Constantes y Helpers ---
const DOCUMENT_TYPE_OPTIONS = [
  { code: '01', name: 'Factura Electrónica' }, { code: '03', name: 'Boleta de Venta Electrónica' },
  { code: '07', name: 'Nota de Crédito' }, { code: '08', name: 'Nota de Débito' },
  { code: '31', name: 'Guía de Remisión' },
];

// =============== COMPONENTES DE MODAL ===============

// --- Modal de Sucursales ---
interface BranchOfficeFormModalProps {
  isOpen: boolean; onClose: () => void;
  onSubmit: (data: BranchOfficeCreateData | BranchOfficeUpdateData) => void;
  office?: BranchOffice; companyId: number; ports: Port[];
}

const BranchOfficeFormModal: React.FC<BranchOfficeFormModalProps> = ({ isOpen, onClose, onSubmit, office, companyId, ports }) => {
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
    name: '', code: '', port_id: 0, port_name: '', port_address: '', address_line: '', phone: '', email: '', is_main_office: false, is_active: true
  });

  React.useEffect(() => {
    if (isOpen) {
      const officeObj: any = office as any;
      const initialPortId: number = (() => {
        // Prefer the explicit port object id if available. If editing and none, keep 0 (no selection).
        if (isEditing) {
          if (officeObj && officeObj.port && typeof officeObj.port.id === 'number') return officeObj.port.id;
          return 0;
        }
        // Creating: try to preselect linked port if provided, otherwise default to first available port.
        if (officeObj && officeObj.port && typeof officeObj.port.id === 'number') return officeObj.port.id;
        return ports.length > 0 ? ports[0].id : 0;
      })();

      setFormData({
        name: office?.name || '',
        code: office?.code || '',
        // If editing: keep the office's port_id as-is (may be null/0) so we don't auto-select the first port.
        // If creating: default to first available port when none provided.
        port_id: initialPortId,
        // IMPORTANT: do NOT fallback to office.port.* here. We must show only explicit branch-office fields when editing.
        // Keep port_name/port_address empty if not provided by the office itself.
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

  // Auto-fill port_name / port_address when user selects a port from dropdown
  // Ref to detect when the user changes the port select. We only want to autofill after user interaction,
  // not automatically when opening the modal for editing (to avoid inheriting linked port data).
  const portSelectChangedRef = useRef(false);

  React.useEffect(() => {
    if (!ports || ports.length === 0) return;
    const selected = ports.find(p => p.id === formData.port_id);
    if (!selected) return;

    // If editing and the user didn't change the select, skip autofill to avoid inheriting the linked port data.
    if (isEditing && !portSelectChangedRef.current) return;

    // Populate only when user selected a port (or when creating and user changed it).
    setFormData(prev => ({
      ...prev,
      port_name: prev.port_name?.trim() ? prev.port_name : (selected.name || prev.port_name),
      port_address: prev.port_address?.trim() ? prev.port_address : (selected.address || prev.port_address),
    }));
  }, [formData.port_id, ports, isEditing]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.port_id === 0) {
      toast.error("Por favor, seleccione un puerto principal para la sucursal.");
      return;
    }
    if (!formData.port_name.trim()) {
      toast.error("Por favor, ingrese el nombre del puerto.");
      return;
    }
    if (!formData.port_address.trim()) {
      toast.error("Por favor, ingrese la dirección del puerto.");
      return;
    }
    const dataToSubmit = {
      name: formData.name, code: formData.code || undefined, port_id: formData.port_id,
      port_name: formData.port_name, port_address: formData.port_address,
      address_line: formData.address_line, phone: formData.phone, email: formData.email,
      is_main_office: formData.is_main_office, is_active: formData.is_active,
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
        <Input label="Nombre de la Sucursal" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Código (Opcional, 4 chars)" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} maxLength={4} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Puerto Principal (Hub)</label>
            <select value={formData.port_id} onChange={e => { setFormData({...formData, port_id: Number(e.target.value)}); portSelectChangedRef.current = true; }} className="w-full p-2 border border-gray-300 rounded-md" required>
              <option value={0}>Seleccione un puerto</option>
              {ports.map(port => <option key={port.id} value={port.id}>{port.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Puerto</label>
            <input 
              type="text"
              value={formData.port_name} 
              onChange={e => setFormData({...formData, port_name: e.target.value})} 
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Ej: Puerto Fluvial Masusa"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección del Puerto</label>
            <input 
              type="text"
              value={formData.port_address} 
              onChange={e => setFormData({...formData, port_address: e.target.value})} 
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Ej: Av. La Marina 1234"
              required 
            />
          </div>
        </div>
        <Input label="Dirección de la Sucursal" value={formData.address_line} onChange={e => setFormData({...formData, address_line: e.target.value})} required/>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Teléfono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center"><input id="is_main_office" type="checkbox" checked={formData.is_main_office} onChange={e => setFormData({...formData, is_main_office: e.target.checked})} className="h-4 w-4 rounded" /><label htmlFor="is_main_office" className="ml-2">¿Es la sucursal principal?</label></div>
          {isEditing && <div className="flex items-center"><input id="is_active_office" type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="h-4 w-4 rounded" /><label htmlFor="is_active_office" className="ml-2">¿Está activa?</label></div>}
        </div>
        <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">{isEditing ? 'Actualizar' : 'Crear'}</Button></div>
      </form>
    </Modal>
  );
};

// --- Modal de Series ---
interface SeriesFormModalProps {
  isOpen: boolean; onClose: () => void;
  onSubmit: (data: DocumentSeriesCreateData | DocumentSeriesUpdateData) => void;
  series?: DocumentSeries; branchOffices: BranchOffice[];
}

const SeriesFormModal: React.FC<SeriesFormModalProps> = ({ isOpen, onClose, onSubmit, series, branchOffices }) => {
  const isEditing = !!series;
  const [formData, setFormData] = useState({
    branch_office_id: 0, document_type_code: '01', series_code: '',
    current_number: 0, is_electronic: true, is_active: true,
  });

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        branch_office_id: series?.branch_office_id || (branchOffices.length > 0 ? branchOffices[0].id : 0),
        document_type_code: series?.document_type_code || '01',
        series_code: series?.series_code || '', current_number: series?.current_number || 0,
        is_electronic: series?.is_electronic ?? true, is_active: series?.is_active ?? true,
      });
    }
  }, [isOpen, series, branchOffices]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[A-Z0-9]{4}$/.test(formData.series_code)) { toast.error('El código de serie debe tener 4 caracteres alfanuméricos (ej. F001).'); return; }
    if (formData.branch_office_id === 0) { toast.error('Debe seleccionar una sucursal.'); return; }
    const dataToSubmit = {
        branch_office_id: formData.branch_office_id, document_type_code: formData.document_type_code,
        series_code: formData.series_code, current_number: Number(formData.current_number),
        is_electronic: formData.is_electronic, is_active: formData.is_active,
    };
    if (isEditing) {
        onSubmit({ branch_office_id: dataToSubmit.branch_office_id, current_number: dataToSubmit.current_number, is_active: dataToSubmit.is_active });
    } else {
        onSubmit(dataToSubmit);
    }
  };
  
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Serie' : 'Nueva Serie'}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
                <select value={formData.document_type_code} onChange={(e) => setFormData({ ...formData, document_type_code: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md" required disabled={isEditing}>
                    {DOCUMENT_TYPE_OPTIONS.map(doc => <option key={doc.code} value={doc.code}>{doc.name}</option>)}
                </select>
            </div>
            <Input label="Código de Serie (ej. F001)" value={formData.series_code} onChange={(e) => setFormData({ ...formData, series_code: e.target.value.toUpperCase() })} maxLength={4} required disabled={isEditing} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
                <select value={formData.branch_office_id} onChange={e => setFormData({...formData, branch_office_id: Number(e.target.value)})} className="w-full p-2 border border-gray-300 rounded-md" required>
                    <option value={0}>Seleccione una sucursal</option>
                    {branchOffices.map(office => <option key={office.id} value={office.id}>{office.name}</option>)}
                </select>
            </div>
            <Input label="Número Actual" type="number" value={String(formData.current_number)} onChange={(e) => setFormData({ ...formData, current_number: Number(e.target.value) })} required min={0} />
        </div>
        <div className="flex items-center justify-between">
            <div className="flex items-center"><input id="is_electronic" type="checkbox" checked={formData.is_electronic} onChange={(e) => setFormData({ ...formData, is_electronic: e.target.checked })} className="h-4 w-4 rounded" disabled={isEditing} /><label htmlFor="is_electronic" className="ml-2">¿Es Electrónica?</label></div>
            {isEditing && <div className="flex items-center"><input id="is_active_series" type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4 rounded" /><label htmlFor="is_active_series" className="ml-2">¿Está Activa?</label></div>}
        </div>
        <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">{isEditing ? 'Actualizar' : 'Crear'}</Button></div>
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
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setEditingItem(undefined);
    setShowModal(false);
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
    const confirmText = activeTab === 'offices' 
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

  const filteredOffices = useMemo(() => offices.filter(o => o.name.toLowerCase().includes(searchTerm.toLowerCase())), [offices, searchTerm]);
  const filteredSeries = useMemo(() => series.filter(s => s.series_code.toLowerCase().includes(searchTerm.toLowerCase())), [series, searchTerm]);

  const isLoading = isLoadingOffices || isLoadingSeries || isLoadingPorts;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración de Sucursales y Series</h1>
        <p className="text-gray-600">Gestiona las sucursales y las series de documentos de tu compañía.</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button onClick={() => setActiveTab('offices')} className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'offices' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><BuildingStorefrontIcon className="h-5 w-5 mr-2"/>Sucursales ({offices.length})</button>
          <button onClick={() => setActiveTab('series')} className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'series' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><ClipboardDocumentListIcon className="h-5 w-5 mr-2"/>Series ({series.length})</button>
        </nav>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative max-w-md">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" className="pl-10 p-2 border rounded-md w-full" placeholder={`Buscar en ${activeTab === 'offices' ? 'sucursales' : 'series'}...`} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />{activeTab === 'offices' ? 'Nueva Sucursal' : 'Nueva Serie'}
        </Button>
      </div>

      {isLoading ? <div className="flex justify-center items-center h-64"><Spinner/></div> : (
        activeTab === 'offices' ? (
          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50"><tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          <th className="px-6 py-3">Sucursal</th>
          <th className="px-6 py-3">Dirección de la Sucursal</th>
          <th className="px-6 py-3">Puerto</th>
          <th className="px-6 py-3">Dirección del Puerto</th>
          <th className="px-6 py-3">Contacto</th>
          <th className="px-6 py-3 text-center">Principal</th>
          <th className="px-6 py-3 text-center">Estado</th>
          <th className="px-6 py-3 text-right">Acciones</th>
        </tr></thead>
        <tbody className="divide-y divide-gray-200">
          {filteredOffices.map(office => (<tr key={office.id}>
            <td className="px-6 py-4">
              <div className="font-medium">{office.name}</div>
              <div className="text-sm text-gray-500">{office.code}</div>
            </td>
            <td className="px-6 py-4"><div className="text-sm text-gray-700">{office.address_line || 'Sin dirección'}</div></td>
            <td className="px-6 py-4"><div className="text-sm">{office.port_name && office.port_name.trim() ? office.port_name : 'N/A'}</div></td>
            <td className="px-6 py-4"><div className="text-sm text-gray-500">{office.port_address && office.port_address.trim() ? office.port_address : 'Sin dirección'}</div></td>
            <td className="px-6 py-4"><div className="text-sm">{office.phone || '-'}</div><div className="text-sm text-gray-500">{office.email || '-'}</div></td>
            <td className="px-6 py-4 text-center">{office.is_main_office ? 'Sí' : 'No'}</td>
            <td className="px-6 py-4 text-center"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${office.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{office.is_active ? 'Activa' : 'Inactiva'}</span></td>
            <td className="px-6 py-4 text-right space-x-2">
              <button onClick={() => handleOpenModal(office)} className="text-blue-600 hover:text-blue-900"><PencilIcon className="h-5 w-5"/></button>
              {office.is_active && <button onClick={() => handleDelete(office.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-5 w-5"/></button>}
            </td>
          </tr>))}
        </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50"><tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Tipo Documento</th><th className="px-6 py-3">Serie</th>
                    <th className="px-6 py-3">Número Actual</th><th className="px-6 py-3">Sucursal Asignada</th>
                    <th className="px-6 py-3 text-center">Electrónica</th><th className="px-6 py-3 text-center">Estado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                </tr></thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSeries.map(s => (<tr key={s.id}><td className="px-6 py-4"><div className="flex items-center"><ClipboardDocumentListIcon className="h-5 w-5 text-gray-400 mr-3" /><div className="font-medium text-gray-900">{DOCUMENT_TYPE_OPTIONS.find(d => d.code === s.document_type_code)?.name || s.document_type_code}</div></div></td>
                        <td className="px-6 py-4 font-mono">{s.series_code}</td><td className="px-6 py-4 font-mono">{s.current_number.toString().padStart(8, '0')}</td>
                        <td className="px-6 py-4">{offices.find(o => o.id === s.branch_office_id)?.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-center">{s.is_electronic ? 'Sí' : 'No'}</td>
                        <td className="px-6 py-4 text-center"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${s.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s.is_active ? 'Activo' : 'Inactivo'}</span></td>
                        <td className="px-6 py-4 text-right space-x-2">
                            <button onClick={() => handleOpenModal(s)} className="text-blue-600 hover:text-blue-900"><PencilIcon className="h-5 w-5"/></button>
                            {s.is_active && <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-5 w-5"/></button>}
                        </td>
                    </tr>))}
                </tbody>
            </table>
          </div>
        )
      )}

      {showModal && (activeTab === 'offices' ? (
        <BranchOfficeFormModal isOpen={showModal} onClose={handleCloseModal} onSubmit={handleSubmit} office={editingItem as BranchOffice} companyId={companyId} ports={primaryPorts} />
      ) : (
        <SeriesFormModal isOpen={showModal} onClose={handleCloseModal} onSubmit={handleSubmit} series={editingItem as DocumentSeries} branchOffices={offices} />
      ))}
    </div>
  );
};