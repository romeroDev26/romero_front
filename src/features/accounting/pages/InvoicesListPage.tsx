// src/features/accounting/pages/InvoicesListPage.tsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/utils/sileo-toast';
import { format, parseISO } from 'date-fns';
import { 
  MagnifyingGlassIcon, 
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  MinusIcon,
  CodeBracketIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { DataTable, Column } from '../../../components/common/DataTable';
import { Input } from '../../../components/common/Input';
import { useDebounce } from '../../../hooks/useDebounce';
import { InvoiceStatusBadge } from '../components/InvoiceStatusBadge';
import { DateRangeFilter, DateFilterOption } from '../../dashboard/components/DateRangeFilter';
import { invoicesService, InvoiceFilters } from '../../../services/invoices.service';
import { Invoice } from '../../../types';
import { getCurrencySymbol } from '../../../utils/currency';

export const InvoicesListPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Estados para los filtros
  const [clientSearch, setClientSearch] = useState('');
  const [sunatStatusFilter, setSunatStatusFilter] = useState('');
  
  // Filtros de fecha (usando DateRangeFilter)
  const [dateOption, setDateOption] = useState<DateFilterOption>('custom');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [series, setSeries] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(20);
  
  const debouncedClientSearch = useDebounce(clientSearch, 300);
  const debouncedSeries = useDebounce(series, 300);
  const debouncedDocumentNumber = useDebounce(documentNumber, 300);

  // TODO: Obtener company_id del contexto de autenticación
  const companyId = 1;

  // Construir filtros para la API
  const filters: InvoiceFilters = useMemo(() => {
    const baseFilters: InvoiceFilters = {
      company_id: companyId,
      skip: currentPage * itemsPerPage,
      limit: itemsPerPage,
    };

    if (debouncedClientSearch) baseFilters.client_search = debouncedClientSearch;
    if (sunatStatusFilter) baseFilters.sunat_status = sunatStatusFilter as any;
    
    if (startDate) baseFilters.start_date = format(startDate, 'yyyy-MM-dd');
    if (endDate) baseFilters.end_date = format(endDate, 'yyyy-MM-dd');
    
    if (debouncedSeries) baseFilters.series = debouncedSeries;
    if (debouncedDocumentNumber) baseFilters.number = parseInt(debouncedDocumentNumber) || undefined;

    return baseFilters;
  }, [companyId, currentPage, itemsPerPage, debouncedClientSearch, sunatStatusFilter, startDate, endDate, debouncedSeries, debouncedDocumentNumber]);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => invoicesService.getInvoices(filters),
    staleTime: 1000 * 60, // Cache por 1 minuto - se invalida automaticamente al cambiar filtros
  });

  // Limpiar filtros y resetear paginación cuando cambia la fecha
  const handleDateChange = (newStart: Date | null, newEnd: Date | null) => {
    setStartDate(newStart);
    setEndDate(newEnd);
    setCurrentPage(0);
  };

  const handleOptionChange = (option: DateFilterOption) => {
    setDateOption(option);
    setCurrentPage(0);
  };

  // Funciones para manejar cambios en filtros que deben resetear la paginación
  const handleClientSearchChange = (value: string) => {
    setClientSearch(value);
    setCurrentPage(0);
  };

  const handleSunatStatusChange = (value: string) => {
    setSunatStatusFilter(value);
    setCurrentPage(0);
  };

  const handleSeriesChange = (value: string) => {
    setSeries(value);
    setCurrentPage(0);
  };

  const handleDocumentNumberChange = (value: string) => {
    setDocumentNumber(value);
    setCurrentPage(0);
  };

  const handleClearFilters = () => {
    setClientSearch('');
    setSunatStatusFilter('');
    setSeries('');
    setDocumentNumber('');
    setDateOption('custom');
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(0);
  };

  // Función para navegar entre páginas
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Componente de paginación simple
  const PaginationControls = () => {
    const hasNextPage = invoices.length === itemsPerPage; // Si recibimos el límite completo, probablemente hay más páginas
    const hasPrevPage = currentPage > 0;

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-700">
          <span>
            Página {currentPage + 1} • Mostrando {invoices.length} registros
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrevPage}
            className="flex items-center"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNextPage}
            className="flex items-center"
          >
            Siguiente
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  };

  const getDocumentTypeLabel = (code: string) => {
    const types: Record<string, string> = {
      '01': 'Factura',
      '03': 'Boleta',
      '07': 'Nota de Crédito',
      '08': 'Nota de Débito'
    };
    return types[code] || code;
  };

  /** Nombre de archivo SUNAT si viene en la URL (p. ej. .../20478966653-03-B0D1-00000584.xml). */
  const getSignedXmlDownloadFileName = (invoice: Invoice): string => {
    const url = invoice.signed_xml_file_path;
    if (!url) return `${invoice.series}-${String(invoice.number).padStart(8, '0')}.xml`;
    try {
      const last = new URL(url).pathname.split('/').filter(Boolean).pop();
      if (last?.toLowerCase().endsWith('.xml')) return last;
    } catch {
      /* URL inválida: usar respaldo */
    }
    return `${invoice.series}-${String(invoice.number).padStart(8, '0')}.xml`;
  };

  /**
   * Descarga el XML al disco: primero el backend (mismo origen, sin CORS); si falla, intento directo al CDN
   * (solo funciona si el CDN expone CORS al origen del panel).
   */
  const downloadSignedXmlToDisk = async (invoice: Invoice) => {
    const url = invoice.signed_xml_file_path;
    const fallbackName = getSignedXmlDownloadFileName(invoice);
    try {
      let blob: Blob;
      let fileName = fallbackName;

      try {
        const r = await invoicesService.fetchSignedXmlBlob(invoice.id);
        blob = r.blob;
        if (r.fileNameFromHeader) fileName = r.fileNameFromHeader;
      } catch {
        if (!url) throw new Error('NO_XML_SOURCE');
        blob = await invoicesService.getPublicCdnFileBlob(url);
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.warning(
        'No se pudo descargar el XML. El almacenamiento en CDN no permite leer el archivo desde el panel (CORS). Hace falta el endpoint GET /sunat/invoices/{id}/signed-xml en el backend o habilitar CORS en Bunny. Mientras tanto use Ctrl+S en la previsualización.'
      );
    }
  };

  /**
   * Ventana emergente para leer el XML. No usar noopener en la cadena de features: en Chromium
   * window.open devuelve null aunque la ventana se haya abierto, y el toast de “bloqueada” es un falso positivo.
   * En paralelo intenta la descarga automática al disco.
   */
  const handlePreviewSignedXml = (invoice: Invoice) => {
    const url = invoice.signed_xml_file_path;
    if (!url) return;
    const preview = window.open(url, '_blank', 'width=960,height=720');
    if (!preview) {
      toast.error('El navegador bloqueó la ventana emergente. Permite ventanas emergentes para este sitio.');
    }
    void downloadSignedXmlToDisk(invoice);
  };

  const columns: Column<Invoice>[] = [
    {
      key: 'document',
      header: 'Documento',
      accessor: (invoice: Invoice) => (
        <div>
          <div className="font-medium text-gray-900">
            {getDocumentTypeLabel(invoice.document_type_code)}
          </div>
          <div className="text-sm text-gray-500">
            {invoice.series}-{String(invoice.number).padStart(8, '0')}
          </div>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Cliente',
      className: 'max-w-[160px] xl:max-w-[220px]',
      accessor: (invoice: Invoice) => (
        <div className="max-w-[160px] xl:max-w-[220px]">
          <div
            className="font-medium text-gray-900 truncate"
            title={invoice.client?.name || 'Cliente no disponible'}
          >
            {invoice.client?.name || 'Cliente no disponible'}
          </div>
          <div className="text-sm text-gray-500 truncate" title={invoice.client?.doc_number}>
            {invoice.client?.doc_number}
          </div>
        </div>
      ),
    },
    {
      key: 'issue_date',
      header: 'Fecha',
      accessor: (invoice: Invoice) => (
        <div className="text-sm text-gray-900">
          {format(parseISO(invoice.issue_date), 'dd/MM/yyyy')}
        </div>
      ),
    },
    {
      key: 'sunat_status',
      header: 'Estado SUNAT / Negocio',
      accessor: (invoice: Invoice) => (
        <InvoiceStatusBadge 
          sunatStatus={invoice.sunat_status} 
          businessStatus={invoice.business_status}
        />
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      accessor: (invoice: Invoice) => (
        <div className="text-right">
          <div className="font-medium text-gray-900">
            {getCurrencySymbol(invoice.currency_code)} {invoice.total_payable}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
          <p className="text-gray-600">Gestión de comprobantes electrónicos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full md:w-auto">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Rango de Fechas
            </label>
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onDateChange={handleDateChange}
              selectedOption={dateOption}
              onOptionChange={handleOptionChange}
            />
          </div>
          
          {(clientSearch || sunatStatusFilter || series || documentNumber || startDate || endDate) && (
            <div className="flex justify-end self-end md:self-auto mb-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="text-gray-500 bg-white hover:bg-gray-50 border-gray-200 shadow-sm flex items-center mb-0 md:mt-6"
              >
                <XMarkIcon className="w-4 h-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Cliente
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <Input
                type="text"
                placeholder="DNI, RUC o nombre..."
                value={clientSearch}
                onChange={(e) => handleClientSearchChange(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Serie
            </label>
            <Input
              type="text"
              placeholder="Ej: F001, B001..."
              value={series}
              onChange={(e) => handleSeriesChange(e.target.value)}
              className="bg-gray-50 border-gray-200 focus:bg-white transition-colors uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Número
            </label>
            <Input
              type="number"
              placeholder="Número correlativo"
              value={documentNumber}
              onChange={(e) => handleDocumentNumberChange(e.target.value)}
              className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Estado SUNAT
            </label>
            <select
              value={sunatStatusFilter}
              onChange={(e) => handleSunatStatusChange(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm text-gray-700"
            >
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="GENERATED">Generado</option>
              <option value="SIGNED">Firmado</option>
              <option value="SENT">Enviado</option>
              <option value="ACCEPTED">Aceptado</option>
              <option value="REJECTED">Rechazado</option>
              <option value="OBSERVED">Observado</option>
              <option value="VOIDED">Anulado</option>
              <option value="ERROR">Error</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border">
        <DataTable
          columns={columns}
          data={invoices}
          isLoading={isLoading}
          keyExtractor={(item) => item.id}
          customActions={(invoice) => (
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/accounting/invoices/${invoice.id}`)}
                title="Ver detalle"
              >
                <EyeIcon className="h-4 w-4" />
              </Button>
              
              {invoice.signed_xml_file_path && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePreviewSignedXml(invoice)}
                  title="Previsualizar XML y descargar archivo"
                >
                  <CodeBracketIcon className="h-4 w-4" />
                </Button>
              )}
              
              {invoice.cdr_file_path && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(invoice.cdr_file_path!, '_blank')}
                  title="Descargar CDR"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </Button>
              )}
              
              {/* Solo mostrar acciones de notas si el documento está aceptado por SUNAT y no cancelado por el negocio */}
              {invoice.sunat_status === 'ACCEPTED' && invoice.business_status !== 'CANCELLED' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => navigate(`/accounting/credit-notes/new?invoice_id=${invoice.id}`)}
                    title="Crear Nota de Crédito"
                  >
                    <MinusIcon className="h-4 w-4" />
                  </Button>
                  
                  {/* No mostrar opción de nota de débito si el documento tiene estado INCREASED */}
                  {invoice.business_status !== 'INCREASED' && (
                    <Button
                      size="sm"
                      variant="outline" 
                      className="text-green-600 border-green-300 hover:bg-green-50"
                      onClick={() => navigate(`/accounting/debit-notes/new?invoice_id=${invoice.id}`)}
                      title="Crear Nota de Débito"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
          emptyMessage={
            clientSearch || series || documentNumber || sunatStatusFilter || startDate || endDate || dateOption !== 'custom'
              ? 'No se encontraron facturas con los filtros aplicados'
              : 'No se encontraron facturas'
          }
        />
        
        {/* Controles de paginación */}
        {!isLoading && invoices.length > 0 && <PaginationControls />}
      </div>
    </div>
  );
}; 