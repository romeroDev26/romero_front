// src/App.tsx
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Dashboard } from './components/layout/Dashboard';
import { LoginPage } from './features/auth/pages/LoginPage';
import { authService } from './services/auth.service';

// Páginas del dashboard
import { DashboardPage } from './features/dashboard/pages/DashboardPage';

// Páginas de configuración
import { CompanySettingsPage } from './features/settings/pages/CompanySettingsPage';
import { UsersPage } from './features/settings/pages/UsersPage';

// Páginas de ventas
import { QuotationsListPage } from './features/sales/pages/QuotationsListPage';
import { QuotationFormPage } from './features/sales/pages/QuotationFormPage';

// Páginas de guías de remisión
import { RemissionGuidesListPage } from './features/remissionGuides/pages/RemissionGuidesListPage';
import { RemissionGuideFormPage } from './features/remissionGuides/pages/RemissionGuideFormPage';

// Páginas de productos
import { ProductsListPage } from './features/products/pages/ProductsListPage';
import { ProductFormPage } from './features/products/pages/ProductFormPage';
import { JSX } from 'react';

// Crear cliente para React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Componente para proteger rutas
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  // TODO: Implementar validación de autenticación en el futuro
  // const isAuthenticated = authService.isAuthenticated();
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" />;
  // }
  
  return children;
};

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
            {/* Dashboard */}
            <Route index element={<DashboardPage />} />
            
            {/* Clientes */}
            <Route path="clients" element={<div>Lista de Clientes</div>} />
            <Route path="clients/:id" element={<div>Detalle/Edición de Cliente</div>} />
            
            {/* Proveedores */}
            <Route path="suppliers" element={<div>Lista de Proveedores</div>} />
            <Route path="suppliers/:id" element={<div>Detalle/Edición de Proveedor</div>} />
            
            {/* Productos y Servicios */}
            <Route path="products" element={<ProductsListPage />} />
            <Route path="products/:id" element={<ProductFormPage />} />
            
            {/* Inventario */}
            <Route path="inventory" element={<div>Inventario</div>} />
            
            {/* Ventas */}
            <Route path="sales">
              <Route index element={<div>Menú de Ventas</div>} />
              <Route path="quotations" element={<QuotationsListPage />} />
              <Route path="quotations/:id" element={<QuotationFormPage />} />
              <Route path="orders" element={<div>Órdenes de Venta</div>} />
              <Route path="orders/:id" element={<div>Detalle/Edición de Orden</div>} />
            </Route>
            
            {/* Facturas */}
            <Route path="invoices" element={<div>Lista de Facturas</div>} />
            <Route path="invoices/:id" element={<div>Detalle/Edición de Factura</div>} />
            
            {/* Notas de Crédito */}
            <Route path="credit-notes" element={<div>Notas de Crédito</div>} />
            <Route path="credit-notes/:id" element={<div>Detalle/Edición de Nota de Crédito</div>} />
            
            {/* Notas de Débito */}
            <Route path="debit-notes" element={<div>Notas de Débito</div>} />
            <Route path="debit-notes/:id" element={<div>Detalle/Edición de Nota de Débito</div>} />
            
            {/* Guías de Remisión */}
            <Route path="remission-guides" element={<RemissionGuidesListPage />} />
            <Route path="remission-guides/:id" element={<RemissionGuideFormPage />} />
            
            {/* Reportes SUNAT */}
            <Route path="sunat-reports" element={<div>Reportes SUNAT</div>} />
            
            {/* Finanzas */}
            <Route path="finance">
              <Route index element={<div>Menú de Finanzas</div>} />
              <Route path="receivables" element={<div>Cuentas por Cobrar</div>} />
              <Route path="payables" element={<div>Cuentas por Pagar</div>} />
              <Route path="expenses" element={<div>Gastos</div>} />
            </Route>
            
            {/* Configuración */}
            <Route path="settings">
              <Route index element={<div>Menú de Configuración</div>} />
              <Route path="company" element={<CompanySettingsPage />} />
              <Route path="users" element={<UsersPage />} />
            </Route>
          </Route>
          
          {/* Ruta para manejar páginas no encontradas */}
          <Route path="*" element={<div>Página no encontrada</div>} />
        </Routes>
        
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
