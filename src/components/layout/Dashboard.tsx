// src/components/layout/Dashboard.tsx
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Breadcrumbs from '../common/Breadcrumbs';
import { 
  HomeIcon, 
  UserGroupIcon,
  DocumentTextIcon,
  CreditCardIcon,
  TruckIcon,
  ChartBarIcon,
  CogIcon,
  XMarkIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  UsersIcon,
  KeyIcon,
  // Iconos específicos para transporte fluvial
  MapIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  TicketIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  AdjustmentsHorizontalIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';
import { authService } from '../../services/auth.service';
import { toast } from 'react-toastify';
import { User } from '../../types';

export const Dashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  
  // Estados para controlar submenús expandibles
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({
    fluvial: false,
    fluvialConfig: false,
    fluvialOps: false,
    commerce: false,
    administration: false,
  });
  
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
  
  const toggleSubmenu = (menuKey: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };
  
  // Función para obtener el nombre del rol formateado
  const getRoleDisplay = (user: User | undefined) => {
    if (!user) return '';
    
    if (user.role_name) {
      if (typeof user.role_name === 'string') {
        return user.role_name;
      }
    }
    
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
        { name: 'Dashboard General', path: '/', icon: HomeIcon }
      ]
    },
    {
      title: 'Gestión de Clientes',
      items: [
        { name: 'Clientes', path: '/clients', icon: UserGroupIcon }
      ]
    },
    {
      title: 'Sistema de Transporte Fluvial',
      expandable: true,
      expandKey: 'fluvial',
      icon: ChartPieIcon,
      items: [
        { name: 'Dashboard Fluvial', path: '/fluvial/dashboard', icon: ChartBarIcon },
        { 
          name: 'Configuración', 
          path: '#', 
          icon: AdjustmentsHorizontalIcon, 
          isSubmenu: true,
          expandKey: 'fluvialConfig',
          subitems: [
            { name: 'Ciudades y Puertos', path: '/fluvial/config/cities-ports', icon: MapIcon },
            { name: 'Embarcaciones', path: '/fluvial/config/vessels', icon: BuildingOffice2Icon },
            { name: 'Rutas', path: '/fluvial/config/routes', icon: TruckIcon },
            { name: 'Tarifas', path: '/fluvial/config/fares', icon: CurrencyDollarIcon },
            { name: 'Tipos de Asiento', path: '/fluvial/config/seat-types', icon: AdjustmentsHorizontalIcon }
          ]
        },
        { 
          name: 'Operaciones', 
          path: '#', 
          icon: CalendarDaysIcon, 
          isSubmenu: true,
          expandKey: 'fluvialOps',
          subitems: [
            { name: 'Programar Viajes', path: '/fluvial/operations/schedule-trips', icon: CalendarDaysIcon },
            { name: 'Punto de Ventas', path: '/fluvial/operations/sales-point', icon: TicketIcon },
            { name: 'Gestionar Reservas', path: '/fluvial/operations/reservations', icon: ClipboardDocumentListIcon },
            { name: 'Manifiestos', path: '/fluvial/operations/manifests', icon: DocumentTextIcon }
          ]
        },
        { name: 'Reportes Fluviales', path: '/fluvial/reports', icon: ChartBarIcon }
      ]
    },
    {
      title: 'Operaciones Comerciales',
      expandable: true,
      expandKey: 'commerce',
      icon: DocumentTextIcon,
      items: [
        { name: 'Cotizaciones', path: '/sales/quotations', icon: DocumentTextIcon },
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
        { name: 'Cuentas por Cobrar', path: '/finance/receivables', icon: CreditCardIcon },
        { name: 'Gastos', path: '/finance/expenses', icon: CreditCardIcon }
      ]
    },
    {
      title: 'Administración del Sistema',
      expandable: true,
      expandKey: 'administration',
      icon: CogIcon,
      items: [
        { name: 'Usuarios', path: '/settings/users', icon: UsersIcon },
        { name: 'Roles', path: '/settings/roles', icon: KeyIcon },
        { name: 'Configuración Empresa', path: '/settings/company', icon: CogIcon }
      ]
    }
  ];
  
  // Función para renderizar un item del menú
  const renderMenuItem = (item: any, isSubitem = false) => {
    const isExpanded = item.expandKey ? expandedMenus[item.expandKey] : false;
    const itemClasses = `flex items-center ${isCollapsed ? 'justify-center' : ''} px-${isSubitem ? '6' : '3'} py-2 text-[14px] rounded ${!item.isSubmenu ? 'hover:bg-primary/80' : ''} transition-colors`;
    
    if (item.isSubmenu) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleSubmenu(item.expandKey)}
            className={`${itemClasses} w-full text-left text-white`}
            title={isCollapsed ? item.name : undefined}
          >
            <item.icon className={`w-6 h-6 ${!isCollapsed && 'mr-3'}`} />
            {!isCollapsed && (
              <>
                <span className="flex-1">{item.name}</span>
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </>
            )}
          </button>
          {!isCollapsed && isExpanded && item.subitems && (
            <div className="ml-6 mt-1 space-y-1">
              {item.subitems.map((subitem: any) => renderMenuItem(subitem, true))}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) =>
          `${itemClasses} ${isActive ? 'bg-secondary text-white' : 'text-white'}`
        }
        title={isCollapsed ? item.name : undefined}
      >
        <item.icon className={`w-6 h-6 ${!isCollapsed && 'mr-3'}`} />
        {!isCollapsed && <span>{item.name}</span>}
      </NavLink>
    );
  };
  
  // Función para renderizar un grupo expandible
  const renderExpandableGroup = (group: any) => {
    const isExpanded = expandedMenus[group.expandKey];
    
    return (
      <div key={group.title} className="mb-4">
        {!isCollapsed && (
          <button
            onClick={() => toggleSubmenu(group.expandKey)}
            className="flex items-center justify-between w-full px-3 text-[13px] font-medium text-white/60 uppercase tracking-wider mb-2 hover:text-white/80 transition-colors"
          >
            <div className="flex items-center">
              <group.icon className="w-4 h-4 mr-2" />
              <span>{group.title}</span>
            </div>
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
        )}
        
        {(isCollapsed || isExpanded) && (
          <div className={`space-y-1 ${isCollapsed ? 'border-b border-primary/30 pb-4' : ''}`}>
            {group.items.map((item: any) => renderMenuItem(item))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar para móvil */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        
        <div className="fixed inset-y-0 left-0 flex flex-col w-64 max-w-xs bg-primary text-white shadow-xl">
          <div className="flex items-center justify-between h-16 px-4 border-b border-primary-dark">
            <h1 className="text-xl font-bold">Transportes Fluviales</h1>
            <button onClick={() => setSidebarOpen(false)}>
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <nav className="px-2 py-4">
              {navGroups.map((group, idx) => (
                group.expandable ? renderExpandableGroup(group) : (
                  <div key={idx} className="mb-4">
                    <h2 className="px-4 text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
                      {group.title}
                    </h2>
                    <div className="space-y-1">
                      {group.items.map((item) => renderMenuItem(item))}
                    </div>
                  </div>
                )
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
            {!isCollapsed && <h1 className="text-lg font-semibold">Transportes Fluviales</h1>}
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
                group.expandable ? renderExpandableGroup(group) : (
                  <div key={idx} className="mb-4">
                    {!isCollapsed && (
                      <h2 className="px-3 text-[13px] font-medium text-white/60 uppercase tracking-wider mb-2">
                        {group.title}
                      </h2>
                    )}
                    <div className={`space-y-1 ${isCollapsed ? 'border-b border-primary/30 pb-4' : ''}`}>
                      {group.items.map((item) => renderMenuItem(item))}
                    </div>
                  </div>
                )
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
                  </div>
                </div>
              ) : (
                <span className="text-sm text-gray-500">Usuario no disponible</span>
              )}
            </div>
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