// src/features/dashboard/pages/SellerStatisticsDetailPage.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersService } from '../../../services/users.service';
import { useSellerDetailedStats } from '../../../hooks/useSellerDetailedStats';
import { getLocalDateString, getStartOfMonth } from '../../../utils/dateUtils';
import { 
  ArrowLeft, 
  Download, 
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Spinner } from '../../../components/common/Spinner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { SellerDetailedInvoice } from '../../../types/sellerDetailedReport';
import { exportSellerStatsToExcel } from '../../../utils/exportToExcel';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

export const SellerStatisticsDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  // Estados para fechas usando funciones de zona horaria local
  const [startDate, setStartDate] = useState(getStartOfMonth());
  const [endDate, setEndDate] = useState(getLocalDateString());
  
  // Estado para expandir tablas
  const [expandedInvoice, setExpandedInvoice] = useState<number | null>(null);

  // Obtener información del usuario
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersService.getById(userId!),
    enabled: !!userId,
  });

  // Obtener estadísticas
  const { data, metrics, isLoading, error } = useSellerDetailedStats({
    userId: userId!,
    startDate,
    endDate,
    enabled: !!userId,
  });

  const handleExport = () => {
    if (!data || !user) {
      alert('No hay datos para exportar');
      return;
    }
    
    exportSellerStatsToExcel(
      data,
      user.full_name || 'Vendedor',
      startDate,
      endDate
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error al cargar estadísticas</p>
        </div>
      </div>
    );
  }

  const invoices = data?.items || [];

  return (
    <div className="p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/seller-statistics')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Estadísticas de {user?.full_name || 'Vendedor'}
            </h1>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-5 h-5" />
          Exportar
        </button>
      </div>

      {/* Filtros de Fecha */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">Desde:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Hasta:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Métricas Principales */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Facturas</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.total_invoices}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-gray-900">
                  S/ {metrics.total_revenue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pasajeros</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.total_passengers}</p>
              </div>
              <Users className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ticket Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  S/ {metrics.average_ticket.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ventas Diarias */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas Diarias</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.daily_sales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#3B82F6" name="Monto" />
                <Line type="monotone" dataKey="invoices" stroke="#10B981" name="Facturas" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Métodos de Pago */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Métodos de Pago</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(metrics.payment_methods_breakdown).map(([name, value]) => ({
                    name,
                    value,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: S/ ${entry.value.toFixed(0)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.keys(metrics.payment_methods_breakdown).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Rutas */}
          {metrics.top_routes.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Rutas</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.top_routes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="route" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3B82F6" name="Ingresos" />
                  <Bar dataKey="passengers" fill="#10B981" name="Pasajeros" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tipos de Documento */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Documento</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(metrics.document_types_breakdown).map(([name, value]) => ({
                    name,
                    value,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.keys(metrics.document_types_breakdown).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabla de Facturas */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detalle de Facturas</h3>
          <p className="text-sm text-gray-600 mt-1">
            {invoices.length} facturas encontradas
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sucursal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado SUNAT / Negocio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalles
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron facturas en el período seleccionado
                  </td>
                </tr>
              ) : (
                invoices.map((invoice: SellerDetailedInvoice) => (
                  <React.Fragment key={invoice.invoice_id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.document_type}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.series}-{invoice.correlative}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(invoice.issue_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.client_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.client_doc_type}: {invoice.client_document_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.branch_office_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {invoice.currency} {parseFloat(invoice.total_amount).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {invoice.payment_method}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {/* Estado SUNAT */}
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              invoice.sunat_status === 'ACEPTADO'
                                ? 'bg-green-100 text-green-800'
                                : invoice.sunat_status === 'RECHAZADO'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {invoice.sunat_status}
                          </span>
                          {/* Estado del Negocio */}
                          {invoice.business_status === 'CANCELLED' && (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
                              Cancelado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() =>
                            setExpandedInvoice(
                              expandedInvoice === invoice.invoice_id ? null : invoice.invoice_id
                            )
                          }
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                        >
                          {expandedInvoice === invoice.invoice_id ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Ocultar
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Ver
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Detalles expandibles */}
                    {expandedInvoice === invoice.invoice_id && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            {/* Items */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Ítems:</h4>
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                  <thead>
                                    <tr className="bg-gray-100">
                                      <th className="px-3 py-2 text-left">Producto/Servicio</th>
                                      <th className="px-3 py-2 text-left">Cantidad</th>
                                      <th className="px-3 py-2 text-left">Precio Unit.</th>
                                      <th className="px-3 py-2 text-left">Total</th>
                                      <th className="px-3 py-2 text-left">Detalles</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {invoice.items.map((item, idx) => (
                                      <tr key={idx} className="border-t">
                                        <td className="px-3 py-2">{item.product_name}</td>
                                        <td className="px-3 py-2">{item.quantity}</td>
                                        <td className="px-3 py-2">S/ {parseFloat(item.unit_price).toFixed(2)}</td>
                                        <td className="px-3 py-2 font-semibold">
                                          S/ {parseFloat(item.total_amount).toFixed(2)}
                                        </td>
                                        <td className="px-3 py-2">
                                          {item.seat_number && <div>Asiento: {item.seat_number}</div>}
                                          {item.route_name && <div>Ruta: {item.route_name}</div>}
                                          {item.vessel_name && <div>Embarcación: {item.vessel_name}</div>}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Representantes */}
                            {invoice.representatives && invoice.representatives.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Representantes:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {invoice.representatives.map((rep, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded border">
                                      <p className="font-medium">{rep.name}</p>
                                      <p className="text-sm text-gray-600">
                                        {rep.doc_type}: {rep.doc_number}
                                      </p>
                                      {rep.seat_number && (
                                        <p className="text-sm text-gray-600">Asiento: {rep.seat_number}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
