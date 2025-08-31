import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  SearchIcon,
  FilterIcon,
  CheckCircleIcon,
  XCircleIcon,
  RefreshCwIcon,
  CalendarIcon,
  TruckIcon,
  UserIcon,
  CreditCardIcon
} from 'lucide-react';
import { useReceivables } from '../hooks/useReceivables';
import { useBranchOffices } from '../../../hooks/useBranchOffices';
import { authService } from '../../../services/auth.service';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Spinner } from '../../../components/common/Spinner';
import { Modal } from '../../../components/common/Modal';

const ReceivablesPage: React.FC = () => {
  const [companyId, setCompanyId] = useState<number | undefined>();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Obtener companyId del usuario actual
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCompanyId(user.company_id);
    }
  }, []);

  const { data: branchOffices = [], isLoading: loadingBranchOffices } = useBranchOffices(companyId);

  const {
    items,
    loading,
    error,
    filters,
    pagination,
    total,
    totalPages,
    updateFilters,
    clearFilters,
    goToPage,
    changePageSize,
    markAsPaid,
    refresh,
    isMarkingPaid
  } = useReceivables();

  const [showFilters, setShowFilters] = useState(false);

  const handleMarkAsPaidClick = (item: any) => {
    setSelectedItem(item);
    setShowConfirmModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedItem) return;
    
    const success = await markAsPaid(selectedItem.invoice_item_id || selectedItem.id);
    if (success) {
      setShowConfirmModal(false);
      setSelectedItem(null);
    }
  };

  const handleCancelPayment = () => {
    setShowConfirmModal(false);
    setSelectedItem(null);
  };

  const getStatusColor = (status: string) => {
    return status === 'PAGADO' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (status: string) => {
    return status === 'PAGADO' ? (
      <CheckCircleIcon className="w-4 h-4" />
    ) : (
      <XCircleIcon className="w-4 h-4" />
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Encomiendas por Cobrar</h1>
              <p className="text-gray-600 mt-1">
                Gestión y seguimiento de encomiendas pendientes de cobro
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <FilterIcon className="w-4 h-4" />
                Filtros
              </Button>
              <Button
                variant="outline"
                onClick={refresh}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <CreditCardIcon className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Encomiendas</p>
                  <p className="text-2xl font-bold text-blue-800">{total}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center">
                <XCircleIcon className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-600">Pendientes</p>
                  <p className="text-2xl font-bold text-red-800">
                    {items.filter(item => item.payment_status === 'NO PAGADO').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center">
                <CheckCircleIcon className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-600">Pagadas</p>
                  <p className="text-2xl font-bold text-green-800">
                    {items.filter(item => item.payment_status === 'PAGADO').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <TruckIcon className="w-8 h-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-600">Monto Total</p>
                  <p className="text-2xl font-bold text-yellow-800">
                    S/ {items.reduce((acc, item) => acc + item.amount, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Filtros de Búsqueda</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sucursal
                </label>
                <select
                  value={filters.branch_office_id || ''}
                  onChange={(e) => updateFilters({
                    branch_office_id: e.target.value ? Number(e.target.value) : null
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                  disabled={loadingBranchOffices}
                >
                  <option value="">Todas las sucursales</option>
                  {branchOffices.map((office) => (
                    <option key={office.id} value={office.id}>
                      {office.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado de Pago
                </label>
                <select
                  value={filters.payment_status || ''}
                  onChange={(e) => updateFilters({
                    payment_status: e.target.value as 'NO PAGADO' | 'PAGADO' | null
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="">Todos</option>
                  <option value="NO PAGADO">No Pagado</option>
                  <option value="PAGADO">Pagado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <Input
                  type="date"
                  value={filters.start_date || ''}
                  onChange={(e) => updateFilters({ start_date: e.target.value || null })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin
                </label>
                <Input
                  type="date"
                  value={filters.end_date || ''}
                  onChange={(e) => updateFilters({ end_date: e.target.value || null })}
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de encomiendas */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Spinner />
              <p className="mt-2 text-gray-600">Cargando encomiendas...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              <XCircleIcon className="w-12 h-12 mx-auto mb-4" />
              <p>Error al cargar las encomiendas: {error}</p>
              <Button onClick={refresh} className="mt-4">
                Reintentar
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <SearchIcon className="w-12 h-12 mx-auto mb-4" />
              <p>No se encontraron encomiendas con los filtros aplicados.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Encomienda
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remitente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Destinatario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Viaje
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900">#{item.id}</div>
                            <div className="text-sm text-gray-600">{item.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="font-medium text-gray-900">{item.sender_name}</div>
                              <div className="text-sm text-gray-600">{item.sender_doc_number}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="font-medium text-gray-900">{item.recipient_name}</div>
                              <div className="text-sm text-gray-600">{item.recipient_doc_number}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <TruckIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="font-medium text-gray-900">{item.trip_name}</div>
                              <div className="text-sm text-gray-600">Sucursal: {item.branch_office_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">
                            S/ {item.amount.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.payment_status)}`}>
                            {getStatusIcon(item.payment_status)}
                            <span className="ml-1">{item.payment_status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-900">
                              {format(new Date(item.created_at), 'dd/MM/yyyy', { locale: es })}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {item.payment_status === 'NO PAGADO' && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkAsPaidClick(item)}
                              disabled={isMarkingPaid}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              Marcar Pagada
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button
                    variant="outline"
                    onClick={() => goToPage(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => goToPage(Math.min(totalPages, pagination.page + 1))}
                    disabled={pagination.page === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando{' '}
                      <span className="font-medium">
                        {(pagination.page - 1) * pagination.page_size + 1}
                      </span>{' '}
                      a{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.page_size, total)}
                      </span>{' '}
                      de{' '}
                      <span className="font-medium">{total}</span>{' '}
                      resultados
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-700">Filas por página:</label>
                      <select
                        value={pagination.page_size}
                        onChange={(e) => changePageSize(Number(e.target.value))}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm text-gray-700">
                        Página {pagination.page} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(pagination.page + 1)}
                        disabled={pagination.page === totalPages}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de confirmación de pago */}
      <Modal
        isOpen={showConfirmModal}
        onClose={handleCancelPayment}
        title="Confirmar Pago de Encomienda"
        maxWidth="lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            {/* Detalles de la encomienda */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Detalles de la Encomienda #{selectedItem.id}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Remitente</h4>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{selectedItem.sender_name}</p>
                    <p>DNI/RUC: {selectedItem.sender_doc_number}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Destinatario</h4>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{selectedItem.recipient_name}</p>
                    <p>DNI/RUC: {selectedItem.recipient_doc_number}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Viaje</h4>
                  <div className="text-sm text-gray-600">
                    <p>{selectedItem.trip_name}</p>
                    <p>Sucursal: {selectedItem.branch_office_name}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Monto</h4>
                  <div className="text-lg font-bold text-green-600">
                    S/ {selectedItem.amount.toFixed(2)}
                  </div>
                </div>
              </div>
              
              {selectedItem.description && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Descripción</h4>
                  <p className="text-sm text-gray-600">{selectedItem.description}</p>
                </div>
              )}
            </div>

            {/* Mensaje de confirmación */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">
                    Confirmar Pago
                  </h4>
                  <p className="mt-1 text-sm text-yellow-700">
                    ¿Está seguro de que desea marcar esta encomienda como pagada? 
                    Esta acción confirmará que el cliente ha pagado el monto de S/ {selectedItem.amount.toFixed(2)} 
                    y que la encomienda ha sido entregada correctamente.
                  </p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={handleCancelPayment}
                disabled={isMarkingPaid}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmPayment}
                disabled={isMarkingPaid}
                className="bg-green-600 hover:bg-green-700"
              >
                {isMarkingPaid ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Confirmar Pago
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReceivablesPage;
