// src/components/layout/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  ChevronDownIcon,
  ChevronRightIcon,
  UsersIcon,
  KeyIcon,
  MapIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  TicketIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  AdjustmentsHorizontalIcon,
  ChartPieIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { authService } from '../../services/auth.service';
import { toast } from 'react-toastify';
import { User } from '../../types';

// Keys para localStorage
const STORAGE_KEYS = {
  EXPANDED_MENUS: 'dashboard_expanded_menus',
  SIDEBAR_HIDDEN: 'dashboard_sidebar_hidden'
};

export const Dashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estados del sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false); // Para móvil
  const [sidebarHidden, setSidebarHidden] = useState(() => {
    // En móvil siempre empieza oculto
    if (window.innerWidth < 1024) return true;
    // En desktop recupera del localStorage
    const saved = localStorage.getItem(STORAGE_KEYS.SIDEBAR_HIDDEN);
    return saved ? JSON.parse(saved) : false;
  });
  
  // Estados para controlar submenús expandibles
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPANDED_MENUS);
    return saved ? JSON.parse(saved) : {
      fluvial: false,
      fluvialConfig: false,
      fluvialOps: false,
      commerce: false,
      administration: false,
    };
  });
  
  // Efecto para expandir menús basado en la ruta actual
  useEffect(() => {
    const currentPath = location.pathname;
    const newExpandedMenus = { ...expandedMenus };
    let shouldUpdate = false;
    
    // Sistema Fluvial
    if (currentPath.startsWith('/fluvial')) {
      if (!newExpandedMenus.fluvial) {
        newExpandedMenus.fluvial = true;
        shouldUpdate = true;
      }
      
      // Configuración
      if (currentPath.startsWith('/fluvial/config')) {
        if (!newExpandedMenus.fluvialConfig) {
          newExpandedMenus.fluvialConfig = true;
          shouldUpdate = true;
        }
      }
      
      // Operaciones
      if (currentPath.startsWith('/fluvial/operations')) {
        if (!newExpandedMenus.fluvialOps) {
          newExpandedMenus.fluvialOps = true;
          shouldUpdate = true;
        }
      }
    }
    
    // Operaciones Comerciales
    if (currentPath.startsWith('/sales') || 
        currentPath.startsWith('/invoices') || 
        currentPath.startsWith('/credit-notes') || 
        currentPath.startsWith('/debit-notes') || 
        currentPath.startsWith('/remission-guides')) {
      if (!newExpandedMenus.commerce) {
        newExpandedMenus.commerce = true;
        shouldUpdate = true;
      }
    }
    
    // Administración del Sistema
    if (currentPath.startsWith('/settings')) {
      if (!newExpandedMenus.administration) {
        newExpandedMenus.administration = true;
        shouldUpdate = true;
      }
    }
    
    if (shouldUpdate) {
      setExpandedMenus(newExpandedMenus);
      localStorage.setItem(STORAGE_KEYS.EXPANDED_MENUS, JSON.stringify(newExpandedMenus));
    }
  }, [location.pathname]);
  
  // Guardar estado del sidebar hidden (solo en desktop)
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_HIDDEN, JSON.stringify(sidebarHidden));
    }
  }, [sidebarHidden]);
  
  // Guardar estado de menús expandidos
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPANDED_MENUS, JSON.stringify(expandedMenus));
  }, [expandedMenus]);
  
  // Manejar cambios de tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarHidden(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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
    // Limpiar localStorage al cerrar sesión
    localStorage.removeItem(STORAGE_KEYS.EXPANDED_MENUS);
    localStorage.removeItem(STORAGE_KEYS.SIDEBAR_HIDDEN);
    authService.logout();
    navigate('/login');
  };
  
  const toggleSubmenu = (menuKey: string) => {
    setExpandedMenus(prev => {
      const newState = {
        ...prev,
        [menuKey]: !prev[menuKey]
      };
      // Guardar inmediatamente en localStorage
      localStorage.setItem(STORAGE_KEYS.EXPANDED_MENUS, JSON.stringify(newState));
      return newState;
    });
  };
  
  const toggleSidebar = () => {
    // En móvil usa el estado temporal
    if (window.innerWidth < 1024) {
      setSidebarOpen(!sidebarOpen);
    } else {
      // En desktop alterna el estado persistente
      setSidebarHidden(!sidebarHidden);
    }
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
            { name: 'Tipos de Asiento', path: '/fluvial/config/seat-types', icon: AdjustmentsHorizontalIcon },
            { name: 'Productos y Servicios', path: '/fluvial/config/products-services', icon: CubeIcon }
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
    const itemClasses = `flex items-center px-${isSubitem ? '6' : '3'} py-2 text-[14px] rounded ${!item.isSubmenu ? 'hover:bg-primary/80' : ''} transition-colors`;
    
    if (item.isSubmenu) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleSubmenu(item.expandKey)}
            className={`${itemClasses} w-full text-left text-white`}
          >
            <item.icon className="w-6 h-6 mr-3" />
            <span className="flex-1">{item.name}</span>
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
          {isExpanded && item.subitems && (
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
      >
        <item.icon className="w-6 h-6 mr-3" />
        <span>{item.name}</span>
      </NavLink>
    );
  };
  
  // Función para renderizar un grupo expandible
  const renderExpandableGroup = (group: any) => {
    const isExpanded = expandedMenus[group.expandKey];
    
    return (
      <div key={group.title} className="mb-4">
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
        
        {isExpanded && (
          <div className="space-y-1">
            {group.items.map((item: any) => renderMenuItem(item))}
          </div>
        )}
      </div>
    );
  };
  
  // Componente del Sidebar
  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between h-16 px-4 border-b border-primary-dark">
        <h1 className="text-xl font-bold">Transportes Romero</h1>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
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
      
      {/* Información del usuario */}
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
    </>
  );
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar para móvil (overlay) */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        
        <div className="fixed inset-y-0 left-0 flex flex-col w-64 max-w-xs bg-primary text-white shadow-xl">
          <SidebarContent />
        </div>
      </div>
      
      {/* Sidebar para escritorio */}
      <div className={`hidden lg:flex lg:flex-shrink-0 transition-all duration-300 ${sidebarHidden ? 'lg:w-0' : 'lg:w-64'}`}>
        <div className={`flex flex-col w-64 bg-primary text-white transition-opacity duration-300 ${sidebarHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <SidebarContent />
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Barra superior */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center space-x-4">
              {/* Botón para mostrar/ocultar sidebar */}
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={sidebarHidden ? "Mostrar menú" : "Ocultar menú"}
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
              
              {/* Información del usuario */}
              <div>
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                    <span className="text-sm text-gray-500">Cargando usuario...</span>
                  </div>
                ) : error ? (
                  <span className="text-sm text-red-500">Error al cargar usuario</span>
                ) : currentUser ? (
                  <span className="text-sm text-gray-600">
                    Usuario: <strong>{currentUser.full_name}</strong>
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">Usuario no disponible</span>
                )}
              </div>
            </div>
            
            {/* Puedes agregar más elementos al navbar aquí */}
            <div className="flex items-center space-x-4">
              {/* Por ejemplo: notificaciones, perfil, etc. */}
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