import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  UserGroupIcon, 
  ShoppingCartIcon, 
  DocumentTextIcon,
  CreditCardIcon,
  TruckIcon,
  CubeIcon,
  ChartBarIcon,
  CogIcon,
  XMarkIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';

export const Dashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };
  
  const navGroups = [
    {
      title: 'Dashboard',
      items: [
        { name: 'Dashboard', path: '/', icon: HomeIcon }
      ]
    },
    {
      title: 'Gestión de Clientes y Proveedores',
      items: [
        { name: 'Clientes', path: '/clients', icon: UserGroupIcon },
        { name: 'Proveedores', path: '/suppliers', icon: UserGroupIcon }
      ]
    },
    {
      title: 'Gestión de Productos e Inventario',
      items: [
        { name: 'Productos', path: '/products', icon: CubeIcon },
        { name: 'Inventario', path: '/inventory', icon: ShoppingCartIcon }
      ]
    },
    {
      title: 'Operaciones Comerciales',
      items: [
        { name: 'Ventas', path: '/sales', icon: ChartBarIcon },
        { name: 'Facturas', path: '/invoices', icon: DocumentTextIcon },
        { name: 'Notas de Crédito', path: '/credit-notes', icon: DocumentTextIcon },
        { name: 'Notas de Débito', path: '/debit-notes', icon: DocumentTextIcon },
        { name: 'Guías de Remisión', path: '/remission-guides', icon: TruckIcon }
      ]
    },
    {
      title: 'Informes y Reportes',
      items: [
        { name: 'Reportes SUNAT', path: '/sunat-reports', icon: DocumentTextIcon }
      ]
    },
    {
      title: 'Finanzas y Configuración',
      items: [
        { name: 'Finanzas', path: '/finance', icon: CreditCardIcon },
        { name: 'Configuración', path: '/settings', icon: CogIcon }
      ]
    }
  ];
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar para móvil */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        
        <div className="fixed inset-y-0 left-0 flex flex-col w-64 max-w-xs bg-primary text-white shadow-xl">
          <div className="flex items-center justify-between h-16 px-4 border-b border-primary-dark">
            <h1 className="text-xl font-bold">Transportes Romero</h1>
            <button onClick={() => setSidebarOpen(false)}>
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <nav className="px-2 py-4">
              {navGroups.map((group, idx) => (
                <div key={idx} className="mb-4">
                  <h2 className="px-4 text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
                    {group.title}
                  </h2>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center px-4 py-2 text-sm rounded-md ${
                            isActive 
                              ? 'bg-secondary text-white' 
                              : 'text-white hover:bg-primary/80'
                          }`
                        }
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span>{item.name}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
          
          <div className="p-4 border-t border-primary/30">
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-primary/80 rounded-md"
              onClick={handleLogout}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
      
      {/* Sidebar para escritorio */}
      <div className={`hidden lg:flex lg:flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
        <div className="flex flex-col w-full bg-primary text-white">
          <div className="flex items-center h-16 px-4 border-b border-primary/30 justify-between">
            {!isCollapsed && <h1 className="text-xl font-bold">Transportes Romero</h1>}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-full hover:bg-primary/80"
            >
              <ChevronLeftIcon className={`w-6 h-6 transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <nav className="px-2 py-4">
              {navGroups.map((group, idx) => (
                <div key={idx} className="mb-4">
                  {!isCollapsed && (
                    <h2 className="px-4 text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
                      {group.title}
                    </h2>
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center px-4 py-2 text-sm rounded-md ${
                            isActive 
                              ? 'bg-secondary text-white' 
                              : 'text-white hover:bg-primary/80'
                          }`
                        }
                        title={isCollapsed ? item.name : undefined}
                      >
                        <item.icon className={`w-5 h-5 ${!isCollapsed && 'mr-3'}`} />
                        {!isCollapsed && <span>{item.name}</span>}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
          
          <div className="p-4 border-t border-primary/30">
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-primary/80 rounded-md"
              onClick={handleLogout}
              title={isCollapsed ? "Cerrar Sesión" : undefined}
            >
              <ArrowRightOnRectangleIcon className={`w-5 h-5 ${!isCollapsed && 'mr-3'}`} />
              {!isCollapsed && "Cerrar Sesión"}
            </button>
          </div>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Barra superior */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            
            <div className="ml-4 lg:ml-0">
              <span className="text-sm text-gray-600">Usuario: Admin</span>
            </div>
          </div>
        </header>
        
        {/* Área de contenido */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
