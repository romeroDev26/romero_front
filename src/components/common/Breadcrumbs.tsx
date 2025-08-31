import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/solid';
import { Link, useLocation } from 'react-router-dom';

const routeNameMap: { [key: string]: string } = {
  // Rutas base
  'clients': 'Clientes',
  'sales': 'Ventas',
  'invoices': 'Facturas',
  'credit-notes': 'Notas de Crédito',
  'debit-notes': 'Notas de Débito',
  'remission-guides': 'Guías de Remisión',
  'sunat-reports': 'Reportes SUNAT',
  'finance': 'Finanzas',
  'settings': 'Configuración',
  
  // Sistema Fluvial
  'fluvial': 'Sistema Fluvial',
  'dashboard': 'Dashboard',
  'config': 'Configuración',
  'operations': 'Operaciones',
  'reports': 'Reportes',
  
  // Configuración Fluvial
  'cities-ports': 'Ciudades y Puertos',
  'vessels': 'Embarcaciones',
  'routes': 'Rutas',
  'fares': 'Tarifas',
  'seat-types': 'Tipos de Asiento',
  
  // Operaciones Fluviales
  'schedule-trips': 'Programar Viajes',
  'sales-point': 'Punto de Ventas',
  'reservations': 'Gestionar Reservas',
  'manifests': 'Manifiestos',
  
  // Finanzas
  'receivables': 'Encomiendas por Cobrar',
  'expenses': 'Gastos',
  'payables': 'Cuentas por Pagar',
  
  // Ventas
  'quotations': 'Cotizaciones',
  'orders': 'Órdenes de Venta',
  
  // Contabilidad
  'accounting': 'Contabilidad',
  
  // Configuración
  'users': 'Usuarios',
  'roles': 'Roles',
  'company': 'Empresa',
  
  // Acciones comunes
  'new': 'Nuevo',
  'edit': 'Editar',
  'view': 'Ver'
};

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-600 py-4">
      <Link
        to="/"
        className="flex items-center hover:text-primary transition-colors"
      >
        <HomeIcon className="h-4 w-4" />
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        return (
          <div key={name} className="flex items-center">
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            {isLast ? (
              <span className="ml-1 font-medium text-primary capitalize">
                {routeNameMap[name.toLowerCase()] || name.replace(/-/g, ' ')}
              </span>
            ) : (
              <Link
                to={routeTo}
                className="ml-1 hover:text-primary transition-colors capitalize"
              >
                {routeNameMap[name.toLowerCase()] || name.replace(/-/g, ' ')}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;