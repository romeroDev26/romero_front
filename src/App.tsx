import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Dashboard } from './components/layout/Dashboard';
import { LoginPage } from './features/auth/pages/LoginPage';
import { authService } from './services/auth.service';
import { JSX } from 'react';

// Páginas (importarlas según las vayas creando)
// import { HomePage } from './features/home/pages/HomePage';
// import { ClientsListPage } from './features/clients/pages/ClientsListPage';
// import { ClientDetailPage } from './features/clients/pages/ClientDetailPage';
// import { ClientCreatePage } from './features/clients/pages/ClientCreatePage';
// import { ClientEditPage } from './features/clients/pages/ClientEditPage';

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
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
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
            {/* Rutas anidadas dentro del dashboard */}
            <Route index element={<div>Dashboard</div>} />
            <Route path="clients" element={<div>Clientes</div>} />
            <Route path="suppliers" element={<div>Proveedores</div>} />
            <Route path="products" element={<div>Productos</div>} />
            <Route path="inventory" element={<div>Inventario</div>} />
            <Route path="sales" element={<div>Ventas</div>} />
            <Route path="invoices" element={<div>Facturas</div>} />
            <Route path="credit-notes" element={<div>Notas de Crédito</div>} />
            <Route path="debit-notes" element={<div>Notas de Débito</div>} />
            <Route path="remission-guides" element={<div>Guías de Remisión</div>} />
            <Route path="sunat-reports" element={<div>Reportes SUNAT</div>} />
            <Route path="finance" element={<div>Finanzas</div>} />
            <Route path="settings" element={<div>Configuración</div>} />
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
