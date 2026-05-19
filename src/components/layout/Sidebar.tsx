import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../types';
import { useSidebarScroll } from '../../hooks/useSidebarScroll';
import { usePermissions } from '../../hooks/usePermissions';
import { APP_VERSION } from '../../config/version';

import {
  HomeIcon, UserGroupIcon, DocumentTextIcon, CreditCardIcon, TruckIcon,
  CogIcon, XMarkIcon, ArrowRightOnRectangleIcon, ChevronDownIcon,
  UsersIcon, KeyIcon, MapIcon, BuildingOffice2Icon, CalendarDaysIcon, TicketIcon,
  ClipboardDocumentListIcon, CurrencyDollarIcon, AdjustmentsHorizontalIcon,
  ChartPieIcon, CubeIcon, ChatBubbleLeftRightIcon, BellAlertIcon, ShieldCheckIcon,
  BriefcaseIcon, SparklesIcon
} from '@heroicons/react/24/outline';

const STORAGE_KEY_EXPANDED_MENUS = 'dashboard_expanded_menus';

interface NavItem {
  name: string;
  path: string;
  icon: any;
  iconColor: string;
  isSubmenu?: boolean;
  expandKey?: string;
  subitems?: NavItem[];
  adminOnly?: boolean;
  supervisorOnly?: boolean; // Nueva propiedad para items solo para supervisor
  showBadge?: boolean; // Mostrar badge con contador
}

interface NavGroup {
  title: string;
  expandable?: boolean;
  expandKey?: string;
  icon?: any;
  iconColor?: string;
  items: NavItem[];
}

interface SidebarProps {
  currentUser?: User;
  onLogout: () => void;
  onCloseMobile: () => void;
  pendingCount?: number;
}

const navGroups: NavGroup[] = [
  {
    title: 'Navegación Principal',
    items: [
      { name: 'Inicio', path: '/', icon: HomeIcon, iconColor: 'text-green-500' },
      { name: 'Dashboard General', path: '/dashboard', icon: ChartPieIcon, iconColor: 'text-purple-500', adminOnly: true }
    ]
  },
  {
    title: 'Supervisión',
    items: [
      { 
        name: 'Solicitudes de Anulación', 
        path: '/supervisor/cancellation-requests', 
        icon: BellAlertIcon, 
        iconColor: 'text-red-500',
        supervisorOnly: true,
        showBadge: true
      }
    ]
  },
  {
    title: 'Gestión de Clientes',
    items: [
      { name: 'Clientes', path: '/clients', icon: UserGroupIcon, iconColor: 'text-orange-500' }
    ]
  },
  {
    title: 'Sistema de Transporte Fluvial',
    expandable: true,
    expandKey: 'fluvial',
    icon: ChartPieIcon,
    iconColor: 'text-blue-500',
    items: [
      {
        name: 'Configuración',
        path: '#',
        icon: AdjustmentsHorizontalIcon,
        iconColor: 'text-blue-500',
        isSubmenu: true,
        expandKey: 'fluvialConfig',
        subitems: [
          { name: 'Ciudades y Puertos', path: '/fluvial/config/cities-ports', icon: MapIcon, iconColor: 'text-blue-500' },
          { name: 'Embarcaciones', path: '/fluvial/config/vessels', icon: BuildingOffice2Icon, iconColor: 'text-blue-500' },
          { name: 'Rutas', path: '/fluvial/config/routes', icon: TruckIcon, iconColor: 'text-blue-500' },
          { name: 'Tarifas', path: '/fluvial/config/fares-by-route', icon: CurrencyDollarIcon, iconColor: 'text-blue-500' },
          { name: 'Tipos de Asiento', path: '/fluvial/config/seat-types', icon: AdjustmentsHorizontalIcon, iconColor: 'text-blue-500' },
          { name: 'Productos y Servicios', path: '/fluvial/config/products-services', icon: CubeIcon, iconColor: 'text-blue-500' },
          { name: 'Configuración de Series', path: '/fluvial/config/document-series', icon: ClipboardDocumentListIcon, iconColor: 'text-blue-500' },
        ]
      },
      {
        name: 'Operaciones',
        path: '#',
        icon: CalendarDaysIcon,
        iconColor: 'text-blue-500',
        isSubmenu: true,
        expandKey: 'fluvialOps',
        subitems: [
          { name: 'Programar Viajes', path: '/fluvial/operations/schedule-trips', icon: CalendarDaysIcon, iconColor: 'text-blue-500' },
          { name: 'Punto de Venta (Pasajes)', path: '/fluvial/operations/sales-point', icon: TicketIcon, iconColor: 'text-blue-500' },
          { name: 'Gestionar Reservas', path: '/fluvial/operations/reservations', icon: ClipboardDocumentListIcon, iconColor: 'text-blue-500' },
          { name: 'Encomiendas y Carga', path: '/fluvial/operations/cargo-sale', icon: CubeIcon, iconColor: 'text-blue-500' },
          { name: 'Venta Rápida', path: '/fluvial/operations/quick-sales', icon: BriefcaseIcon, iconColor: 'text-purple-500' },
          { name: 'Manifiestos', path: '/fluvial/operations/manifests', icon: DocumentTextIcon, iconColor: 'text-blue-500' }
        ]
      }
    ]
  },
  {
    title: 'Operaciones Comerciales',
    expandable: true,
    expandKey: 'commerce',
    icon: DocumentTextIcon,
    iconColor: 'text-green-500',
    items: [
      { name: 'Cotizaciones', path: '/sales/quotations', icon: DocumentTextIcon, iconColor: 'text-green-500' },
      { name: 'Guías de Remisión', path: '/remission-guides', icon: TruckIcon, iconColor: 'text-green-500' }
    ]
  },
  {
    title: 'Contabilidad',
    expandable: true,
    expandKey: 'accounting',
    icon: DocumentTextIcon,
    iconColor: 'text-indigo-500',
    items: [
      { name: 'Facturas/Boletas', path: '/accounting/invoices', icon: DocumentTextIcon, iconColor: 'text-indigo-500' },
      { name: 'Notas de Crédito', path: '/accounting/credit-notes', icon: DocumentTextIcon, iconColor: 'text-indigo-500' },
      { name: 'Notas de Débito', path: '/accounting/debit-notes', icon: DocumentTextIcon, iconColor: 'text-indigo-500' }
    ]
  },

  {
    title: 'Finanzas',
    items: [
      { name: 'Encomiendas por cobrar', path: '/finance/receivables', icon: CreditCardIcon, iconColor: 'text-pink-500' }
    ]
  },

  {
    title: 'Administración del Sistema',
    expandable: true,
    expandKey: 'administration',
    icon: CogIcon,
    iconColor: 'text-gray-500',
    items: [
      { name: 'Usuarios', path: '/settings/users', icon: UsersIcon, iconColor: 'text-gray-500' },
      { name: 'Roles', path: '/settings/roles', icon: KeyIcon, iconColor: 'text-gray-500' },
      { name: 'Configuración Empresa', path: '/settings/company', icon: CogIcon, iconColor: 'text-gray-500' },
      { name: 'WhatsApp', path: '/settings/whatsapp', icon: ChatBubbleLeftRightIcon, iconColor: 'text-green-500' },
      { name: 'Novedades', path: '/settings/updates', icon: SparklesIcon, iconColor: 'text-amber-500' }
    ]
  }
];

const Sidebar: React.FC<SidebarProps> = ({ currentUser, onLogout, onCloseMobile, pendingCount = 0 }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { scrollRef, handleScroll } = useSidebarScroll();
  const { hasPermission } = usePermissions();
  
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EXPANDED_MENUS);
    return saved ? JSON.parse(saved) : {};
  });

  // Filtrar grupos basados en permisos
  const filteredNavGroups = useCallback(() => {
    // Obtener el rol del usuario de manera más robusta
    let userRole = '';
    let isAdmin = false;
    let isSupervisor = false;
    if (currentUser) {
      userRole = currentUser.role?.name?.toLowerCase() ||
                 currentUser.role_name?.toLowerCase() || '';
      isAdmin = userRole === 'admin';
      isSupervisor = userRole === 'supervisor';
    }
    
    return navGroups.filter(group => {
      if (group.title === 'Navegación Principal') return true; // Siempre visible para todos los usuarios
      if (group.title === 'Supervisión') return isSupervisor || isAdmin; // Visible para supervisores y administradores
      if (group.title === 'Dashboard') return hasPermission('dashboard', undefined, userRole);
      if (group.title === 'Gestión de Clientes') return hasPermission('clients', undefined, userRole);
      if (group.title === 'Sistema de Transporte Fluvial') return hasPermission('fluvial', undefined, userRole);
      if (group.title === 'Operaciones Comerciales') return hasPermission('commerce', undefined, userRole);
      if (group.title === 'Contabilidad') return hasPermission('accounting', undefined, userRole);
      if (group.title === 'Finanzas') return hasPermission('finance', undefined, userRole);
      if (group.title === 'Administración del Sistema') return hasPermission('administration', undefined, userRole);
      return false;
    }).map(group => {
      // Filtrar items dentro del grupo
      const filteredItems = group.items.filter(item => {
        // Si el item es solo para admin, verificar que el usuario sea admin
        if (item.adminOnly && !isAdmin) {
          return false;
        }
        
        // Si el item es solo para supervisor, verificar que el usuario sea supervisor o admin
        if (item.supervisorOnly && !isSupervisor && !isAdmin) {
          return false;
        }
        
        if (item.name === 'Configuración') return isAdmin; // Solo admin puede ver configuración
        if (item.name === 'Operaciones') return hasPermission('fluvial', 'operations', userRole);
        if (item.name === 'Cotizaciones') return hasPermission('commerce', 'quotations', userRole);
        if (item.name === 'Guías de Remisión') return hasPermission('commerce', 'remission-guides', userRole);
        // Filtrar items de contabilidad por rol - SALES tiene acceso completo
        if (item.name === 'Facturas/Boletas') return hasPermission('accounting', 'invoices', userRole);
        if (item.name === 'Notas de Crédito') return hasPermission('accounting', 'credit-notes', userRole);
        if (item.name === 'Notas de Débito') return hasPermission('accounting', 'debit-notes', userRole);
        return true; // Para otros items
      }).map(item => {
        if (item.isSubmenu && item.subitems) {
          const filteredSubitems = item.subitems.filter((subitem: NavItem) => {
            if (userRole === 'driver') {
              // DRIVER solo acceso limitado a manifiestos
              return subitem.name === 'Manifiestos';
            }
            if (item.name === 'Configuración') {
              // Solo admin tiene acceso a configuración
              return isAdmin;
            }
            if (userRole === 'sales' && item.name === 'Operaciones') {
              // SALES solo lectura en operaciones
              return true;
            }
            if (userRole === 'dispatcher' && item.name === 'Operaciones') {
              // DISPATCHER CRUD en operaciones
              return true;
            }
            return true; // Por defecto mostrar
          });
          return { ...item, subitems: filteredSubitems };
        }
        return item;
      });
      
      return { ...group, items: filteredItems };
    });
  }, [currentUser, hasPermission]);

  useEffect(() => {
    const currentPath = location.pathname;
    const newExpanded: { [key: string]: boolean } = { ...expandedMenus };

    // Expandir automáticamente grupos basados en la ruta actual
    navGroups.forEach(group => {
      if (group.expandable && group.expandKey) {
        const isGroupActive = group.items.some(item =>
          currentPath.startsWith(item.path !== '#' ? item.path : '---') ||
          (item.subitems && item.subitems.some((sub: NavItem) => currentPath.startsWith(sub.path)))

        );
        if (isGroupActive) {
          newExpanded[group.expandKey] = true;

          group.items.forEach(subGroup => {
            if (subGroup.isSubmenu && subGroup.expandKey && subGroup.subitems) {
              const isSubGroupActive = subGroup.subitems.some((sub: NavItem) => currentPath.startsWith(sub.path));

              if (isSubGroupActive) {
                newExpanded[(subGroup as any).expandKey] = true;
              }
            }
          });
        }
      }
    });

    // Forzar expansión del grupo de contabilidad para SALES únicamente si está en una ruta de contabilidad
    if (currentUser) {
      const userRole = currentUser.role?.name?.toLowerCase() || currentUser.role_name?.toLowerCase() || '';
      
      // Solo expandir contabilidad para SALES si está navegando en rutas de contabilidad
      if (userRole === 'sales' && currentPath.startsWith('/accounting') && !newExpanded['accounting']) {
        newExpanded['accounting'] = true;
      }
    }

    if (JSON.stringify(expandedMenus) !== JSON.stringify(newExpanded)) {
      setExpandedMenus(newExpanded);
    }
  }, [location.pathname, currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXPANDED_MENUS, JSON.stringify(expandedMenus));
  }, [expandedMenus]);

  const toggleSubmenu = (menuKey: string) => {
    setExpandedMenus(prev => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  const renderMenuItem = useCallback((item: NavItem, isSubitem = false, level = 0) => {
    const isExpanded = item.expandKey ? expandedMenus[item.expandKey] : false;
    const baseClasses = `flex items-center w-full text-left text-sm font-medium cursor-pointer transition-all duration-200 ease-in-out rounded-lg`;
    
    let paddingClasses = 'px-4 py-3';
    if (level === 1) {
      paddingClasses = 'pl-8 pr-4 py-2.5';
    } else if (level === 2) {
      paddingClasses = 'pl-12 pr-4 py-2.5';
    } else if (isSubitem) {
      paddingClasses = 'pl-10 pr-4 py-2.5';
    }

    if (item.isSubmenu && item.expandKey) {
      return (
        <div key={item.name} className="mb-1">
          <button
            onClick={() => toggleSubmenu(item.expandKey!)}
            className={`${baseClasses} ${paddingClasses} ${
              expandedMenus[item.expandKey]
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 ${item.iconColor || 'text-gray-500'}`} />
            <span className="flex-1">{item.name}</span>
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
          <AnimatePresence initial={false}>
          {isExpanded && item.subitems && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-1 bg-gray-50/50 rounded-lg mx-2">
                <div className="py-2 space-y-1">
                  {item.subitems.map((subitem: NavItem) => renderMenuItem(subitem, true, level + 1))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      );
    }

    return (
      <NavLink
        key={item.path}
        to={item.path}
        end
        onClick={() => {
          if (onCloseMobile) onCloseMobile();
        }}
        className={({ isActive }) =>
          `${baseClasses} ${paddingClasses} mb-1 ${
            isActive
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
          }`
        }
      >
        <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 ${
          item.iconColor || 'text-gray-500'
        }`} />
        <span className="flex-1">{item.name}</span>
        {item.showBadge && pendingCount > 0 && (
          <span className="relative inline-flex">
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
            <span className="absolute top-0 right-0 inline-flex w-full h-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
          </span>
        )}
      </NavLink>
    );
  }, [expandedMenus, pendingCount]);

  const renderExpandableGroup = useCallback((group: NavGroup) => {
    const isExpanded = group.expandKey ? expandedMenus[group.expandKey] : false;

    return (
      <div key={group.title} className="mb-6">
        <button
          onClick={() => group.expandKey && toggleSubmenu(group.expandKey)}
          className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
            isExpanded
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
          }`}
        >
          {group.icon && <group.icon className={`w-5 h-5 mr-3 ${group.iconColor || 'text-gray-500'}`} />}
          <span className="flex-1">{group.title}</span>
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-1 bg-gray-50 rounded-lg mx-2">
                <div className="py-2 space-y-1">
                  {group.items.map((item: NavItem) => (
                    <div key={item.name || item.path}>
                      {renderMenuItem(item, false, 0)}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }, [expandedMenus, renderMenuItem]);

  const renderSimpleGroup = useCallback((group: NavGroup, idx: number) => (
    <div key={idx} className="mb-6">
      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {group.title}
      </div>
      <div className="space-y-1">
        {group.items.map((item: NavItem) => renderMenuItem(item, false, 0))}
      </div>
    </div>
  ), [renderMenuItem]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <ChartPieIcon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Sistema de Gestión</h2>
        </div>
        <button onClick={onCloseMobile} className="lg:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200">
          <XMarkIcon className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent'
        }}
      >
        <nav className="space-y-2">
          {filteredNavGroups().map((group, idx) =>
            group.expandable
              ? renderExpandableGroup(group)
              : renderSimpleGroup(group, idx)
          )}
        </nav>
      </div>

      <div className="px-4 py-3 border-t border-gray-100">
        <button
          onClick={() => navigate('/changelog')}
          className="flex items-center justify-between w-full group"
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 group-hover:text-[#1F4690] transition-colors">
            Versión
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 group-hover:bg-[#1F4690]/10 group-hover:text-[#1F4690] transition-colors">
            v{APP_VERSION}
          </span>
        </button>
      </div>

      <div className="p-3 border-t border-gray-100">
        <button
          className="flex items-center w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
          onClick={onLogout}
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(Sidebar);