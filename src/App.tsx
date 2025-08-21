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

// Páginas de ventas (cotizaciones)
import { QuotationsListPage } from './features/sales/pages/QuotationsListPage';
import { QuotationNewPage } from './features/quotations/pages/QuotationNewPage';
import { QuotationDetailPage } from './features/quotations/pages/QuotationDetailPage';

// Páginas de guías de remisión (importante para carga)
import { RemissionGuidesListPage } from './features/remissionGuides/pages/RemissionGuidesListPage';
import { RemissionGuideFormPage } from './features/remissionGuides/pages/RemissionGuideFormPage';
import { RemissionGuideDetailPage } from './features/remissionGuides/pages/RemissionGuideDetailPage';

// Páginas del módulo fluvial
import { SalesPointPage } from './features/fluvial/pages/SalesPointPage';
import { FluvialDashboardPage } from './features/fluvial/pages/FluvialDashboardPage';
import { CitiesPortsPage } from './features/fluvial/pages/CitiesPortsPage';
import { VesselsPage } from './features/fluvial/pages/VesselsPage';
import { FaresPage } from './features/fluvial/pages/FaresPage';
import { RoutesPage } from './features/fluvial/pages/RoutesPage';
import { SeatTypesPage } from './features/fluvial/pages/SeatTypesPage';
import { ProductsServicesPage } from './features/fluvial/pages/ProductsServicesPage.tsx';
import { ScheduleTripsPage } from './features/fluvial/pages/ScheduleTripsPage';
import { DocumentSeriesPage as SeriesAndOfficesPage } from './features/fluvial/pages/SeriesAndOfficesPage';
import { ReservationsPage } from './features/fluvial/pages/ReservationsPage';
import { CargoSalePage } from './features/cargo/pages/CargoSalePage';
import { ManifestsPage } from './features/manifests/pages/ManifestsPage';
import { TripManifestsPage } from './features/manifests/pages/TripManifestsPage';

//páginas de contabilidad
import { InvoiceDetailPage } from './features/accounting/pages/InvoiceDetailPage';
import { InvoicesListPage } from './features/accounting/pages/InvoicesListPage';
import { CreditNoteAnnulFormPage } from './features/accounting/pages/CreditNoteFormPage';
import { CreditNoteNewPage } from './features/accounting/pages/CreditNoteNewPage';
import { CreditNoteFullFormPage } from './features/accounting/pages/CreditNoteFullFormPage';
import { CreditNotesListPage } from './features/accounting/pages/CreditNotesListPage';
import { CreditNoteDetailPage } from './features/accounting/pages/CreditNoteDetailPage';
import { DebitNotesListPage } from './features/accounting/pages/DebitNotesListPage';
import { DebitNoteFormPage } from './features/accounting/pages/DebitNoteFormPage';
import { DebitNoteDetailPage } from './features/accounting/pages/DebitNoteDetailPage';
import { AccountingDashboardPage } from './features/accounting/pages/AccountingDashboardPage';
import { DailySummariesListPage } from './features/accounting/pages/DailySummariesListPage';
import { DailySummaryFormPage } from './features/accounting/pages/DailySummaryFormPage';
import { DailySummaryDetailPage } from './features/accounting/pages/DailySummaryDetailPage';
import { VoidDocumentsListPage } from './features/accounting/pages/VoidDocumentsListPage';
import { VoidDocumentFormPage } from './features/accounting/pages/VoidDocumentFormPage';
import { VoidDocumentDetailPage } from './features/accounting/pages/VoidDocumentDetailPage';

// Reportes Fluviales (pendientes de implementar)
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
                <Route path="products-services" element={<ProductsServicesPage />} />
                <Route path="document-series" element={<SeriesAndOfficesPage />} />
                <Route path="series-and-offices" element={<SeriesAndOfficesPage />} />
              </Route>
              
              {/* Operaciones Fluviales */}
              <Route path="operations">
                <Route path="schedule-trips" element={<ScheduleTripsPage />} />
                <Route path="sales-point" element={<SalesPointPage />} />
                <Route path="reservations" element={<ReservationsPage />} />
                <Route path="cargo-sale" element={<CargoSalePage />} />
                <Route path="manifests" element={<ManifestsPage />} />
                <Route path="manifests/trip/:tripId" element={<TripManifestsPage />} />
              </Route>
              
              {/* Reportes Fluviales */}
              <Route path="reports" element={<FluvialReportsPage />} />
            </Route>
            
            {/* Operaciones Comerciales */}
            <Route path="sales">
              <Route path="quotations" element={<QuotationsListPage />} />
              <Route path="quotations/new" element={<QuotationNewPage />} />
              <Route path="quotations/:id" element={<QuotationDetailPage />} />
              <Route path="quotations/:id/edit" element={<QuotationDetailPage />} />
            </Route>
            
            {/* Contabilidad */}
            <Route path="accounting">
              <Route path="dashboard" element={<AccountingDashboardPage />} />
              <Route path="invoices" element={<InvoicesListPage />} />
              <Route path="invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="credit-notes" element={<CreditNotesListPage />} />
              <Route path="credit-notes/new" element={<CreditNoteNewPage />} />
              <Route path="credit-notes/create" element={<CreditNoteFullFormPage />} />
              <Route path="credit-notes/annul" element={<CreditNoteAnnulFormPage />} />
              <Route path="credit-notes/:id" element={<CreditNoteDetailPage />} />
              <Route path="debit-notes" element={<DebitNotesListPage />} />
              <Route path="debit-notes/new" element={<DebitNoteFormPage />} />
              <Route path="debit-notes/:id" element={<DebitNoteDetailPage />} />
              <Route path="summaries" element={<DailySummariesListPage />} />
              <Route path="summaries/new" element={<DailySummaryFormPage />} />
              <Route path="summaries/:id" element={<DailySummaryDetailPage />} />
              <Route path="voids" element={<VoidDocumentsListPage />} />
              <Route path="voids/new" element={<VoidDocumentFormPage />} />
              <Route path="voids/:id" element={<VoidDocumentDetailPage />} />
            </Route>
            
            {/* Guías de Remisión (importante para carga) */}
            <Route path="remission-guides" element={<RemissionGuidesListPage />} />
            <Route path="remission-guides/new" element={<RemissionGuideFormPage />} />
            <Route path="remission-guides/:id" element={<RemissionGuideDetailPage />} />
            <Route path="remission-guides/:id/edit" element={<RemissionGuideFormPage />} />
            
            {/* Reportes SUNAT eliminados */}
            
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