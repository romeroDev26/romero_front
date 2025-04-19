// src/features/dashboard/pages/DashboardPage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  DocumentTextIcon, 
  UsersIcon, 
  TruckIcon, 
  CubeIcon,
  ExclamationCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { Spinner } from '../../../components/common/Spinner';

// Supongamos que tienes estos servicios
// import { dashboardService } from '../../../services/dashboard.service';
// import { invoicesService } from '../../../services/invoices.service';

export const DashboardPage: React.FC = () => {
  // En un caso real, usarías estos queries para obtener datos del backend
  // const { data: stats, isLoading } = useQuery(['dashboardStats'], dashboardService.getStats);
  // const { data: recentInvoices } = useQuery(['recentInvoices'], invoicesService.getRecent);
  
  // Datos simulados para el ejemplo
  const stats = {
    pendingInvoices: 5,
    totalClients: 120,
    activeRemissionGuides: 8,
    totalProducts: 245,
    pendingSunatDocuments: 3,
    recentActivity: 15
  };
  
  const recentInvoices = [
    { id: 1, series: 'F001', number: '00123', client: 'Empresa ABC S.A.C.', amount: 1250.50, status: 'ACCEPTED', date: '2025-04-18' },
    { id: 2, series: 'F001', number: '00124', client: 'Distribuidora XYZ E.I.R.L.', amount: 3456.20, status: 'PENDING', date: '2025-04-19' },
    { id: 3, series: 'B001', number: '00089', client: 'Juan Pérez', amount: 120.00, status: 'ACCEPTED', date: '2025-04-19' },
  ];
  
  const isLoading = false;
  
  if (isLoading) return <Spinner />;
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
      
      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Facturas pendientes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <DocumentTextIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h2 className="text-gray-500 text-sm">Facturas Pendientes</h2>
              <p className="text-2xl font-semibold">{stats.pendingInvoices}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/invoices" className="text-primary hover:text-primary/80 text-sm">
              Ver Facturas →
            </Link>
          </div>
        </div>
        
        {/* Total de clientes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-secondary/10 text-secondary">
              <UsersIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h2 className="text-gray-500 text-sm">Total de Clientes</h2>
              <p className="text-2xl font-semibold">{stats.totalClients}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/clients" className="text-secondary hover:text-secondary/80 text-sm">
              Ver Clientes →
            </Link>
          </div>
        </div>
        
        {/* Guías de remisión activas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-accent/10 text-accent">
              <TruckIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h2 className="text-gray-500 text-sm">Guías de Remisión Activas</h2>
              <p className="text-2xl font-semibold">{stats.activeRemissionGuides}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/remission-guides" className="text-accent hover:text-accent/80 text-sm">
              Ver Guías →
            </Link>
          </div>
        </div>
        
        {/* Total de productos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-info/10 text-info">
              <CubeIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h2 className="text-gray-500 text-sm">Total de Productos</h2>
              <p className="text-2xl font-semibold">{stats.totalProducts}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/products" className="text-info hover:text-info/80 text-sm">
              Ver Productos →
            </Link>
          </div>
        </div>
        
        {/* Documentos SUNAT pendientes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-warning/10 text-warning">
              <ExclamationCircleIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h2 className="text-gray-500 text-sm">Documentos SUNAT Pendientes</h2>
              <p className="text-2xl font-semibold">{stats.pendingSunatDocuments}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/sunat-reports" className="text-warning hover:text-warning/80 text-sm">
              Ver Documentos →
            </Link>
          </div>
        </div>
        
        {/* Actividad reciente */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-success/10 text-success">
              <ClockIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h2 className="text-gray-500 text-sm">Actividad Reciente</h2>
              <p className="text-2xl font-semibold">{stats.recentActivity}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/" className="text-success hover:text-success/80 text-sm">
              Ver Actividad →
            </Link>
          </div>
        </div>
      </div>
      
      {/* Facturas recientes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Facturas Recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Serie-Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/invoices/${invoice.id}`} className="text-primary hover:text-primary/80">
                      {invoice.series}-{invoice.number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {invoice.client}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {invoice.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    S/ {invoice.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${invoice.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : 
                        invoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {invoice.status === 'ACCEPTED' ? 'Aceptada' : 
                       invoice.status === 'PENDING' ? 'Pendiente' : 'Error'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200">
          <Link to="/invoices" className="text-primary hover:text-primary/80">
            Ver todas las facturas →
          </Link>
        </div>
      </div>
    </div>
  );
};
