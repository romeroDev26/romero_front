// src/components/layout/Dashboard.tsx
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Breadcrumbs from '../common/Breadcrumbs';
import { 
  HomeIcon, 
  UserGroupIcon,
  BuildingOfficeIcon,
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
  ChevronLeftIcon,
  UsersIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { authService } from '../../services/auth.service';
import { toast } from 'react-toastify';
import { User } from '../../types';

export const Dashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  
  const { data: currentUser, isLoading, error } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<User> => {
      try {
        const data = await authService.getProfile();
        return data;
      } catch (error: any) {
        console.error('Error al obtener el perfil del usuario:', error);
        if (error.response?.status === 401) {
          handleLogout();
        } else {
          toast.error('No se pudo cargar la información del usuario');
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1
  });
  
  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };
  
  // Función para obtener el nombre del rol formateado
  const getRoleDisplay = (user: User | undefined) => {
    if (!user) return '';
    
    // Primero intentamos usar role_name (que es lo que devuelve el backend)
    if (user.role_name) {
      // Si role_name es un string, lo usamos directamente
      if (typeof user.role_name === 'string') {
        return user.role_name;
      }
    }
    
    // Si no hay role_name, intentamos usar el objeto role
    if (user.role?.description) {
      return user.role.description;
    }
    
    if (user.role?.name) {
      return user.role.name;
    }
    
    return 'Sin rol';
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
        { name: 'Proveedores', path: '/suppliers', icon: BuildingOfficeIcon }
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
      title: 'Finanzas',
      items: [
        { name: 'Finanzas', path: '/finance', icon: CreditCardIcon }
      ]
    },
    {
      title: 'Administración del Sistema',
      items: [
        { name: 'Usuarios', path: '/settings/users', icon: UsersIcon },
        { name: 'Roles', path: '/settings/roles', icon: KeyIcon },
        { name: 'Configuración', path: '/settings/company', icon: CogIcon }
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
          
          {/* Información del usuario en el sidebar móvil */}
          {currentUser && (
            <div className="p-4 border-t border-primary/30">
              <div className="text-sm text-white/80 mb-2">
                <div className="font-medium">{currentUser.full_name}</div>
                <div className="text-xs text-white/60">{getRoleDisplay(currentUser)}</div>
              </div>
            </div>
          )}
          
          <div className="p-2 border-t border-primary/30">
            <button
              className="flex items-center w-full px-3 py-1.5 text-[13px] text-white hover:bg-primary/80 rounded"
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
          <div className="flex items-center h-14 px-3 border-b border-primary/30 justify-between">
            {!isCollapsed && <h1 className="text-lg font-semibold">Transportes Romero</h1>}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-full hover:bg-primary/80"
            >
              <ChevronLeftIcon className={`w-6 h-6 transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-dark scrollbar-track-transparent">
            <nav className="px-1 py-2">
              {navGroups.map((group, idx) => (
                <div key={idx} className="mb-4">
                  {!isCollapsed && (
                    <h2 className="px-3 text-[13px] font-medium text-white/60 uppercase tracking-wider mb-2">
                      {group.title}
                    </h2>
                  )}
                  <div className={`space-y-1 ${isCollapsed ? 'border-b border-primary/30 pb-4' : ''}`}>
                    {group.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2 text-[14px] rounded ${isActive ? 'bg-secondary text-white' : 'text-white hover:bg-primary/80'}`
                        }
                        title={isCollapsed ? item.name : undefined}
                      >
                        <item.icon className={`w-6 h-6 ${!isCollapsed && 'mr-3'}`} />
                        {!isCollapsed && <span>{item.name}</span>}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
          
          {/* Información del usuario en el sidebar desktop */}
          {currentUser && !isCollapsed && (
            <div className="p-3 border-t border-primary/30">
              <div className="text-sm text-white/80">
                <div className="font-medium">{currentUser.full_name}</div>
                <div className="text-xs text-white/60">{getRoleDisplay(currentUser)}</div>
              </div>
            </div>
          )}
          
          <div className="p-2 border-t border-primary/30">
            <button
              className="flex items-center w-full px-3 py-1.5 text-[13px] text-white hover:bg-primary/80 rounded"
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
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                  <span className="text-sm text-gray-500">Cargando usuario...</span>
                </div>
              ) : error ? (
                <span className="text-sm text-red-500">Error al cargar usuario</span>
              ) : currentUser ? (
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-sm text-gray-600">
                      Usuario: <strong>{currentUser.full_name}</strong>
                    </span>
                    <span className="mx-2 text-gray-400">|</span>
                    <span className="text-sm text-gray-600">
                      Rol: <strong>{getRoleDisplay(currentUser)}</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-gray-500">Usuario no disponible</span>
              )}
            </div>
            
            {/* Puedes agregar más elementos en el header aquí, como notificaciones, etc. */}
          </div>
        </header>
        
        {/* Área de contenido */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100">
          <div className="px-6">
            <Breadcrumbs />
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
};