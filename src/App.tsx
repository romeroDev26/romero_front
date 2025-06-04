// src/App.tsx
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ClientsListPage } from "./features/clients/pages/ClientsListPage";
import { ClientFormPage } from "./features/clients/pages/ClientFormPage";
import { Dashboard } from './components/layout/Dashboard';
import { LoginPage } from './features/auth/pages/LoginPage';
import { PrivateRoute } from './components/auth/PrivateRoute';

// Páginas del dashboard
import { DashboardPage } from './features/dashboard/pages/DashboardPage';

// Páginas de configuración
import { CompanySettingsPage } from './features/settings/pages/CompanySettingsPage';
import { UsersPage } from './features/settings/pages/UsersPage';
import { RolesPage } from './features/settings/pages/RolesPage'; 
import SettingsIndexPage from './features/settings/pages/SettingslndexPage';

// Páginas de ventas (cotizaciones - se mantienen para casos especiales)
import { QuotationsListPage } from './features/sales/pages/QuotationsListPage';
import { QuotationFormPage } from './features/sales/pages/QuotationFormPage';

// Páginas de guías de remisión (importante para carga)
import { RemissionGuidesListPage } from './features/remissionGuides/pages/RemissionGuidesListPage';
import { RemissionGuideFormPage } from './features/remissionGuides/pages/RemissionGuideFormPage';

// Páginas del módulo fluvial
import { SalesPointPage } from './features/fluvial/pages/SalesPointPage';
import { FluvialDashboardPage } from './features/fluvial/pages/FluvialDashboardPage';
import { CitiesPortsPage } from './features/fluvial/pages/CitiesPortsPage';
import { VesselsPage } from './features/fluvial/pages/VesselsPage';

// Configuración Fluvial (páginas restantes como placeholders)
const RoutesPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Rutas</h1><p>Gestión de rutas fluviales</p></div>;
const FaresPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Tarifas</h1><p>Gestión de tarifas por tramo</p></div>;
const SeatTypesPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Tipos de Asiento</h1><p>Gestión de tipos de asiento</p></div>;

// Operaciones Fluviales
const ScheduleTripsPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Programar Viajes</h1><p>Programación de viajes y itinerarios</p></div>;
const ReservationsPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Gestionar Reservas</h1><p>Gestión de reservas y separaciones</p></div>;
const ManifestsPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Manifiestos</h1><p>Generación y gestión de manifiestos</p></div>;

// Reportes Fluviales
const FluvialReportsPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Reportes Fluviales</h1><p>Reportes específicos del transporte fluvial</p></div>;

// Páginas de finanzas
const ReceivablesPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Cuentas por Cobrar</h1><p>Gestión de cuentas por cobrar</p></div>;
const ExpensesPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Gastos</h1><p>Gestión de gastos operativos</p></div>;

// Crear cliente para React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }>
            {/* Dashboard Principal */}
            <Route index element={<DashboardPage />} />
            
            {/* Gestión de Clientes */}
            <Route path="clients" element={<ClientsListPage />} />
            <Route path="clients/new" element={<ClientFormPage />} />
            <Route path="clients/:id" element={<ClientFormPage />} />
            
            {/* Sistema de Transporte Fluvial */}
            <Route path="fluvial">
              <Route path="dashboard" element={<FluvialDashboardPage />} />
              
              {/* Configuración Fluvial */}
              <Route path="config">
                <Route path="cities-ports" element={<CitiesPortsPage />} />
                <Route path="vessels" element={<VesselsPage />} />
                <Route path="routes" element={<RoutesPage />} />
                <Route path="fares" element={<FaresPage />} />
                <Route path="seat-types" element={<SeatTypesPage />} />
              </Route>
              
              {/* Operaciones Fluviales */}
              <Route path="operations">
                <Route path="schedule-trips" element={<ScheduleTripsPage />} />
                <Route path="sales-point" element={<SalesPointPage />} />
                <Route path="reservations" element={<ReservationsPage />} />
                <Route path="manifests" element={<ManifestsPage />} />
              </Route>
              
              {/* Reportes Fluviales */}
              <Route path="reports" element={<FluvialReportsPage />} />
            </Route>
            
            {/* Operaciones Comerciales */}
            <Route path="sales">
              <Route path="quotations" element={<QuotationsListPage />} />
              <Route path="quotations/new" element={<QuotationFormPage />} />
              <Route path="quotations/:id" element={<QuotationFormPage />} />
            </Route>
            
            {/* Facturas */}
            <Route path="invoices" element={<div className="p-6"><h1 className="text-2xl font-bold">Lista de Facturas</h1></div>} />
            <Route path="invoices/:id" element={<div className="p-6"><h1 className="text-2xl font-bold">Detalle/Edición de Factura</h1></div>} />
            
            {/* Notas de Crédito */}
            <Route path="credit-notes" element={<div className="p-6"><h1 className="text-2xl font-bold">Notas de Crédito</h1></div>} />
            <Route path="credit-notes/:id" element={<div className="p-6"><h1 className="text-2xl font-bold">Detalle/Edición de Nota de Crédito</h1></div>} />
            
            {/* Notas de Débito */}
            <Route path="debit-notes" element={<div className="p-6"><h1 className="text-2xl font-bold">Notas de Débito</h1></div>} />
            <Route path="debit-notes/:id" element={<div className="p-6"><h1 className="text-2xl font-bold">Detalle/Edición de Nota de Débito</h1></div>} />
            
            {/* Guías de Remisión (importante para carga) */}
            <Route path="remission-guides" element={<RemissionGuidesListPage />} />
            <Route path="remission-guides/new" element={<RemissionGuideFormPage />} />
            <Route path="remission-guides/:id" element={<RemissionGuideFormPage />} />
            
            {/* Reportes SUNAT */}
            <Route path="sunat-reports" element={<div className="p-6"><h1 className="text-2xl font-bold">Reportes SUNAT</h1></div>} />
            
            {/* Finanzas */}
            <Route path="finance">
              <Route path="receivables" element={<ReceivablesPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
            </Route>
            
            {/* Configuración del Sistema */}
            <Route path="settings">
              <Route index element={<SettingsIndexPage />} /> 
              <Route path="company" element={<CompanySettingsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="roles" element={<RolesPage />} />
            </Route>
          </Route>
          
          {/* Ruta para manejar páginas no encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </QueryClientProvider>
  );
}

export default App;