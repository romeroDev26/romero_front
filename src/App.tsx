// src/App.tsx
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Dashboard } from './components/layout/Dashboard';
import { LoginPage } from './features/auth/pages/LoginPage';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { Spinner } from './components/common/Spinner';

// Páginas del dashboard (carga inmediata)
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { ReportsPage } from './features/dashboard/pages/ReportsPage';
import { WelcomePage } from './features/dashboard/pages/WelcomePage';
import { SellerStatisticsListPage } from './features/dashboard/pages/SellerStatisticsListPage';
import { SellerStatisticsDetailPage } from './features/dashboard/pages/SellerStatisticsDetailPage';

// Lazy loading para componentes pesados
const ClientsListPage = React.lazy(() => import('./features/clients/pages/ClientsListPage').then(module => ({ default: module.ClientsListPage })));
const ClientFormPage = React.lazy(() => import('./features/clients/pages/ClientFormPage').then(module => ({ default: module.ClientFormPage })));

// Páginas de configuración (lazy)
const CompanySettingsPage = React.lazy(() => import('./features/settings/pages/CompanySettingsPage').then(module => ({ default: module.CompanySettingsPage })));
const UsersPage = React.lazy(() => import('./features/settings/pages/UsersPage').then(module => ({ default: module.UsersPage })));
const RolesPage = React.lazy(() => import('./features/settings/pages/RolesPage').then(module => ({ default: module.RolesPage })));
const SettingsIndexPage = React.lazy(() => import('./features/settings/pages/SettingslndexPage'));

// Páginas de ventas (lazy)
const QuotationsListPage = React.lazy(() => import('./features/sales/pages/QuotationsListPage').then(module => ({ default: module.QuotationsListPage })));
const QuotationNewPage = React.lazy(() => import('./features/quotations/pages/QuotationNewPage').then(module => ({ default: module.QuotationNewPage })));
const QuotationDetailPage = React.lazy(() => import('./features/quotations/pages/QuotationDetailPage').then(module => ({ default: module.QuotationDetailPage })));

// Páginas de guías de remisión (lazy)
const RemissionGuidesListPage = React.lazy(() => import('./features/remissionGuides/pages/RemissionGuidesListPage').then(module => ({ default: module.RemissionGuidesListPage })));
const RemissionGuideFormPage = React.lazy(() => import('./features/remissionGuides/pages/RemissionGuideFormPage').then(module => ({ default: module.RemissionGuideFormPage })));
const RemissionGuideDetailPage = React.lazy(() => import('./features/remissionGuides/pages/RemissionGuideDetailPage').then(module => ({ default: module.RemissionGuideDetailPage })));

// Páginas del módulo fluvial (lazy)
const SalesPointPage = React.lazy(() => import('./features/fluvial/pages/SalesPointPage').then(module => ({ default: module.SalesPointPage })));
const CitiesPortsPage = React.lazy(() => import('./features/fluvial/pages/CitiesPortsPage').then(module => ({ default: module.CitiesPortsPage })));
const VesselsPage = React.lazy(() => import('./features/fluvial/pages/VesselsPage').then(module => ({ default: module.VesselsPage })));
const FaresByRoutePage = React.lazy(() => import('./features/fluvial/pages/FaresByRoutePage').then(module => ({ default: module.FaresByRoutePage })));
const RoutesPage = React.lazy(() => import('./features/fluvial/pages/RoutesPage').then(module => ({ default: module.RoutesPage })));
const SeatTypesPage = React.lazy(() => import('./features/fluvial/pages/SeatTypesPage').then(module => ({ default: module.SeatTypesPage })));
const ProductsServicesPage = React.lazy(() => import('./features/fluvial/pages/ProductsServicesPage.tsx').then(module => ({ default: module.ProductsServicesPage })));
const ScheduleTripsPage = React.lazy(() => import('./features/fluvial/pages/ScheduleTripsPage').then(module => ({ default: module.ScheduleTripsPage })));
const SeriesAndOfficesPage = React.lazy(() => import('./features/fluvial/pages/SeriesAndOfficesPage').then(module => ({ default: module.DocumentSeriesPage })));
const ReservationsPage = React.lazy(() => import('./features/fluvial/pages/ReservationsPage').then(module => ({ default: module.ReservationsPage })));
const CargoSalePage = React.lazy(() => import('./features/cargo/pages/CargoSalePage').then(module => ({ default: module.CargoSalePage })));
const ManifestsPage = React.lazy(() => import('./features/manifests/pages/ManifestsPage').then(module => ({ default: module.ManifestsPage })));
const TripManifestsPage = React.lazy(() => import('./features/manifests/pages/TripManifestsPage').then(module => ({ default: module.TripManifestsPage })));

// Páginas de contabilidad (lazy)
const InvoicesListPage = React.lazy(() => import('./features/accounting/pages/InvoicesListPage').then(module => ({ default: module.InvoicesListPage })));
const InvoiceDetailPage = React.lazy(() => import('./features/accounting/pages/InvoiceDetailPage').then(module => ({ default: module.InvoiceDetailPage })));
const CreditNotesListPage = React.lazy(() => import('./features/accounting/credit-notes/pages/CreditNotesListPage').then(module => ({ default: module.CreditNotesListPage })));
const CreditNoteNewPage = React.lazy(() => import('./features/accounting/credit-notes/pages/CreditNoteNewPage').then(module => ({ default: module.CreditNoteNewPage })));
const CreditNoteFullFormPage = React.lazy(() => import('./features/accounting/credit-notes/pages/CreditNoteFullFormPage').then(module => ({ default: module.CreditNoteFullFormPage })));
const CreditNoteAnnulFormPage = React.lazy(() => import('./features/accounting/credit-notes/pages/CreditNoteAnnulFormPage').then(module => ({ default: module.CreditNoteAnnulFormPage })));
const CreditNoteDetailPage = React.lazy(() => import('./features/accounting/credit-notes/pages/CreditNoteDetailPage').then(module => ({ default: module.CreditNoteDetailPage })));
const DebitNotesListPage = React.lazy(() => import('./features/accounting/debit-notes/pages/DebitNotesListPage').then(module => ({ default: module.DebitNotesListPage })));
const DebitNoteNewPage = React.lazy(() => import('./features/accounting/debit-notes/pages/DebitNoteNewPage').then(module => ({ default: module.DebitNoteNewPage })));
const DebitNoteFormPage = React.lazy(() => import('./features/accounting/debit-notes/pages/DebitNoteFormPage').then(module => ({ default: module.DebitNoteFormPage })));
const DebitNoteDetailPage = React.lazy(() => import('./features/accounting/debit-notes/pages/DebitNoteDetailPage').then(module => ({ default: module.DebitNoteDetailPage })));
const DailySummariesListPage = React.lazy(() => import('./features/accounting/daily-summaries/pages/DailySummariesListPage').then(module => ({ default: module.DailySummariesListPage })));
const DailySummaryFormPage = React.lazy(() => import('./features/accounting/daily-summaries/pages/DailySummaryFormPage').then(module => ({ default: module.DailySummaryFormPage })));
const DailySummaryDetailPage = React.lazy(() => import('./features/accounting/daily-summaries/pages/DailySummaryDetailPage').then(module => ({ default: module.DailySummaryDetailPage })));
const VoidDocumentsListPage = React.lazy(() => import('./features/accounting/pages/VoidDocumentsListPage').then(module => ({ default: module.VoidDocumentsListPage })));
const VoidDocumentFormPage = React.lazy(() => import('./features/accounting/pages/VoidDocumentFormPage').then(module => ({ default: module.VoidDocumentFormPage })));
const VoidDocumentDetailPage = React.lazy(() => import('./features/accounting/pages/VoidDocumentDetailPage').then(module => ({ default: module.VoidDocumentDetailPage })));

// Páginas de finanzas (lazy)
const ReceivablesPage = React.lazy(() => import('./features/finance/pages/ReceivablesPage'));
const ExpensesPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Gastos</h1><p>Gestión de gastos operativos</p></div>;

// Crear cliente para React Query
export const queryClient = new QueryClient({
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
          <Route path="/welcome" element={
            <PrivateRoute>
              <WelcomePage />
            </PrivateRoute>
          } />
          
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }>
            {/* Página de inicio para todos los usuarios */}
            <Route index element={<WelcomePage />} />
            {/* Dashboard analítico solo para administradores */}
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="dashboard/seller-statistics" element={<SellerStatisticsListPage />} />
            <Route path="dashboard/seller-statistics/:userId" element={<SellerStatisticsDetailPage />} />
            <Route path="reports" element={<ReportsPage />} />
            
            {/* Gestión de Clientes */}
            <Route path="clients" element={
              <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                <ClientsListPage />
              </Suspense>
            } />
            <Route path="clients/new" element={
              <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                <ClientFormPage />
              </Suspense>
            } />
            <Route path="clients/:id" element={
              <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                <ClientFormPage />
              </Suspense>
            } />
            
            {/* Sistema de Transporte Fluvial */}
            <Route path="fluvial">
              {/* Configuración Fluvial */}
              <Route path="config">
                <Route path="cities-ports" element={
                  <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                    <CitiesPortsPage />
                  </Suspense>
                } />
                <Route path="vessels" element={
                  <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                    <VesselsPage />
                  </Suspense>
                } />
                <Route path="routes" element={
                  <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                    <RoutesPage />
                  </Suspense>
                } />
                <Route path="fares-by-route" element={
                  <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                    <FaresByRoutePage />
                  </Suspense>
                } />
                <Route path="seat-types" element={
                  <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                    <SeatTypesPage />
                  </Suspense>
                } />
                <Route path="products-services" element={
                  <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                    <ProductsServicesPage />
                  </Suspense>
                } />
                <Route path="document-series" element={
                  <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                    <SeriesAndOfficesPage />
                  </Suspense>
                } />
                <Route path="series-and-offices" element={
                  <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                    <SeriesAndOfficesPage />
                  </Suspense>
                } />
              </Route>
              
              {/* Operaciones Fluviales */}
              <Route path="operations">
                <Route path="schedule-trips" element={
                  <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                    <ScheduleTripsPage />
                  </Suspense>
                } />
                <Route path="sales-point" element={
                  <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                    <SalesPointPage />
                  </Suspense>
                } />
                <Route path="reservations" element={
                  <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                    <ReservationsPage />
                  </Suspense>
                } />
                <Route path="cargo-sale" element={
                  <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                    <CargoSalePage />
                  </Suspense>
                } />
                <Route path="manifests" element={
                  <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                    <ManifestsPage />
                  </Suspense>
                } />
                <Route path="manifests/trip/:tripId" element={
                  <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                    <TripManifestsPage />
                  </Suspense>
                } />
              </Route>
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
              <Route path="invoices" element={
                <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                  <InvoicesListPage />
                </Suspense>
              } />
              <Route path="invoices/:id" element={
                <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                  <InvoiceDetailPage />
                </Suspense>
              } />
              <Route path="credit-notes" element={
                <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                  <CreditNotesListPage />
                </Suspense>
              } />
              <Route path="credit-notes/new" element={
                <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                  <CreditNoteNewPage />
                </Suspense>
              } />
              <Route path="credit-notes/create" element={
                <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                  <CreditNoteFullFormPage />
                </Suspense>
              } />
              <Route path="credit-notes/annul" element={
                <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                  <CreditNoteAnnulFormPage />
                </Suspense>
              } />
              <Route path="credit-notes/:id" element={
                <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                  <CreditNoteDetailPage />
                </Suspense>
              } />
              <Route path="debit-notes" element={
                <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                  <DebitNotesListPage />
                </Suspense>
              } />
              <Route path="debit-notes/new" element={
                <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                  <DebitNoteNewPage />
                </Suspense>
              } />
              <Route path="debit-notes/create" element={
                <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                  <DebitNoteFormPage />
                </Suspense>
              } />
              <Route path="debit-notes/:id" element={
                <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                  <DebitNoteDetailPage />
                </Suspense>
              } />
              <Route path="summaries" element={
                <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                  <DailySummariesListPage />
                </Suspense>
              } />
              <Route path="summaries/new" element={
                <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                  <DailySummaryFormPage />
                </Suspense>
              } />
              <Route path="summaries/:id" element={
                <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                  <DailySummaryDetailPage />
                </Suspense>
              } />
              <Route path="voids" element={
                <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                  <VoidDocumentsListPage />
                </Suspense>
              } />
              <Route path="voids/new" element={
                <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                  <VoidDocumentFormPage />
                </Suspense>
              } />
              <Route path="voids/:id" element={
                <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
                  <VoidDocumentDetailPage />
                </Suspense>
              } />
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