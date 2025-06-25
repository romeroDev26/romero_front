import React, { useState, useMemo } from 'react';
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

// Hooks para Puertos
import { usePorts } from '../../../hooks/useCitiesPortsData';

// Constantes y Helpers
const DOCUMENT_TYPE_OPTIONS = [
  { code: '01', name: 'Factura Electrónica' },
  { code: '03', name: 'Boleta de Venta Electrónica' },
  { code: '07', name: 'Nota de Crédito' },
  { code: '08', name: 'Nota de Débito' },
  { code: '09', name: 'Guía de Remisión' },
];

// Modal de Sucursales
interface BranchOfficeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BranchOfficeCreateData | BranchOfficeUpdateData) => void;
  office?: BranchOffice;
  companyId: number;
  ports: Port[];
}

const BranchOfficeFormModal: React.FC<BranchOfficeFormModalProps> = ({ isOpen, onClose, onSubmit, office, companyId, ports }) => {
  const isEditing = !!office;
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    port_id: 0,
    address_line: '',
    phone: '',
    email: '',
    is_main_office: false,
    is_active: true,
  });

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: office?.name || '',
        code: office?.code || '',
        port_id: office?.port_id || (ports.length > 0 ? ports[0].id : 0),
        address_line: office?.address_line || '',
        phone: office?.phone || '',
        email: office?.email || '',
        is_main_office: office?.is_main_office || false,
        is_active: office?.is_active ?? true,
      });
    }
  }, [isOpen, office, ports]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.port_id === 0) {
      toast.error("Por favor, seleccione un puerto principal para la sucursal.");
      return;
    }
    const dataToSubmit = {
      name: formData.name,
      code: formData.code || undefined,
      port_id: formData.port_id,
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
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Input label="Nombre de la Sucursal" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Código (Opcional, 4 chars)" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} maxLength={4} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Puerto Principal (Hub)</label>
            <select value={formData.port_id} onChange={(e) => setFormData({ ...formData, port_id: Number(e.target.value) })} className="w-full p-2 border border-gray-300 rounded-md" required>
              <option value={0}>Seleccione un puerto</option>
              {ports.map((port) => (
                <option key={port.id} value={port.id}>
                  {port.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Input label="Dirección de la Sucursal" value={formData.address_line} onChange={(e) => setFormData({ ...formData, address_line: e.target.value })} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Teléfono" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input id="is_main_office" type="checkbox" checked={formData.is_main_office} onChange={(e) => setFormData({ ...formData, is_main_office: e.target.checked })} className="h-4 w-4" />
            <label htmlFor="is_main_office" className="ml-2">¿Es la sucursal principal?</label>
          </div>
          {isEditing && (
            <div className="flex items-center">
              <input id="is_active_office" type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4" />
              <label htmlFor="is_active_office" className="ml-2">¿Está activa?</label>
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

// Modal de Series
interface SeriesFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DocumentSeriesCreateData | DocumentSeriesUpdateData) => void;
  series?: DocumentSeries;
  branchOffices: BranchOffice[];
}

const SeriesFormModal: React.FC<SeriesFormModalProps> = ({ isOpen, onClose, onSubmit, series, branchOffices }) => {
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
        branch_office_id: series?.branch_office_id || (branchOffices.length > 0 ? branchOffices[0].id : 0),
        document_type_code: series?.document_type_code || '01',
        series_code: series?.series_code || '',
        current_number: series?.current_number || 0,
        is_electronic: series?.is_electronic ?? true,
        is_active: series?.is_active ?? true,
      });
    }
  }, [isOpen, series, branchOffices]);

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
    if (isEditing) onSubmit({ branch_office_id: formData.branch_office_id, current_number: Number(formData.current_number), is_active: formData.is_active });
    else onSubmit({ ...formData, current_number: Number(formData.current_number) });
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Serie' : 'Nueva Serie'}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
            <select value={formData.document_type_code} onChange={(e) => setFormData({ ...formData, document_type_code: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md" required disabled={isEditing}>
              {DOCUMENT_TYPE_OPTIONS.map((doc) => (
                <option key={doc.code} value={doc.code}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>
          <Input label="Código de Serie (ej. F001)" value={formData.series_code} onChange={(e) => setFormData({ ...formData, series_code: e.target.value.toUpperCase() })} maxLength={4} required disabled={isEditing} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
            <select value={formData.branch_office_id} onChange={(e) => setFormData({ ...formData, branch_office_id: Number(e.target.value) })} className="w-full p-2 border border-gray-300 rounded-md" required>
              <option value={0}>Seleccione una sucursal</option>
              {branchOffices.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name}
                </option>
              ))}
            </select>
          </div>
          <Input label="Número Actual" type="number" value={String(formData.current_number)} onChange={(e) => setFormData({ ...formData, current_number: Number(e.target.value) })} required min={0} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input id="is_electronic" type="checkbox" checked={formData.is_electronic} onChange={(e) => setFormData({ ...formData, is_electronic: e.target.checked })} className="h-4 w-4" disabled={isEditing} />
            <label htmlFor="is_electronic" className="ml-2">¿Es Electrónica?</label>
          </div>
          {isEditing && (
            <div className="flex items-center">
              <input id="is_active" type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4" />
              <label htmlFor="is_active" className="ml-2">¿Está Activa?</label>
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

// Página Principal
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

  // Mutaciones para Sucursales y Series
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
      if (editingItem) updateOfficeMutation.mutate({ id: editingItem.id, data }, { onSuccess: handleCloseModal });
      else createOfficeMutation.mutate(data, { onSuccess: handleCloseModal });
    } else {
      if (editingItem) updateSeriesMutation.mutate({ id: editingItem.id, data }, { onSuccess: handleCloseModal });
      else createSeriesMutation.mutate({ ...data, company_id: companyId }, { onSuccess: handleCloseModal });
    }
  };

  const handleDelete = (id: number) => {
    const confirmText = activeTab === 'offices' ? '¿Desactivar esta sucursal? Verifique que no sea la principal o no tenga usuarios asignados.' : '¿Desactivar esta serie? No podrá usarse para nuevos documentos.';
    if (window.confirm(confirmText)) {
      if (activeTab === 'offices') deactivateOfficeMutation.mutate(id);
      else deactivateSeriesMutation.mutate(id);
    }
  };

  const filteredOffices = useMemo(() => offices.filter((o) => o.name.toLowerCase().includes(searchTerm.toLowerCase())), [offices, searchTerm]);
  const filteredSeries = useMemo(() => series.filter((s) => s.series_code.toLowerCase().includes(searchTerm.toLowerCase())), [series, searchTerm]);

  const isLoading = isLoadingOffices || isLoadingSeries || isLoadingPorts;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración de Sucursales y Series</h1>
        <p className="text-gray-600">Gestiona las sucursales y las series de documentos de tu compañía.</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button onClick={() => setActiveTab('offices')} className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'offices' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <BuildingStorefrontIcon className="h-5 w-5 mr-2" /> Sucursales ({offices.length})
          </button>
          <button onClick={() => setActiveTab('series')} className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'series' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <ClipboardDocumentListIcon className="h-5 w-5 mr-2" /> Series ({series.length})
          </button>
        </nav>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" className="pl-10 p-2 border rounded-md w-full" placeholder={`Buscar en ${activeTab === 'offices' ? 'sucursales' : 'series'}...`} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" /> {activeTab === 'offices' ? 'Nueva Sucursal' : 'Nueva Serie'}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      ) : activeTab === 'offices' ? (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Sucursal</th>
                <th className="px-6 py-3 text-left">Puerto Asociado</th>
                <th className="px-6 py-3 text-left">Contacto</th>
                <th className="px-6 py-3 text-center">Principal</th>
                <th className="px-6 py-3 text-center">Estado</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredOffices.map((office) => (
                <tr key={office.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium">{office.name}</div>
                    <div className="text-sm text-gray-500">{office.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{office.port?.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{office.port?.city?.name || 'Sin ciudad'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{office.phone}</div>
                    <div className="text-sm text-gray-500">{office.email}</div>
                  </td>
                  <td className="px-6 py-4 text-center">{office.is_main_office ? 'Sí' : 'No'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${office.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{office.is_active ? 'Activa' : 'Inactiva'}</span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleOpenModal(office)} className="text-blue-600 hover:text-blue-900">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    {office.is_active && (
                      <button onClick={() => handleDelete(office.id)} className="text-red-600 hover:text-red-900">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Tipo Documento</th>
                <th className="px-6 py-3 text-left">Serie</th>
                <th className="px-6 py-3 text-left">Número Actual</th>
                <th className="px-6 py-3 text-left">Sucursal Asignada</th>
                <th className="px-6 py-3 text-center">Electrónica</th>
                <th className="px-6 py-3 text-center">Estado</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSeries.map((s) => (
                <tr key={s.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <ClipboardDocumentListIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="font-medium text-gray-900">{DOCUMENT_TYPE_OPTIONS.find((d) => d.code === s.document_type_code)?.name || s.document_type_code}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono">{s.series_code}</td>
                  <td className="px-6 py-4 font-mono">{s.current_number.toString().padStart(8, '0')}</td>
                  <td className="px-6 py-4">{offices.find((o) => o.id === s.branch_office_id)?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-center">{s.is_electronic ? 'Sí' : 'No'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${s.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s.is_active ? 'Activo' : 'Inactivo'}</span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleOpenModal(s)} className="text-blue-600 hover:text-blue-900">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    {s.is_active && (
                      <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-900">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (activeTab === 'offices' ? (
        <BranchOfficeFormModal isOpen={showModal} onClose={handleCloseModal} onSubmit={handleSubmit} office={editingItem as BranchOffice} companyId={companyId} ports={primaryPorts} />
      ) : (
        <SeriesFormModal isOpen={showModal} onClose={handleCloseModal} onSubmit={handleSubmit} series={editingItem as DocumentSeries} branchOffices={offices} />
      ))}
    </div>
  );
};
