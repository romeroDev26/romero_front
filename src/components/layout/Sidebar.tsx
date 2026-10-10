import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../types';
import { useSidebarScroll } from '../../hooks/useSidebarScroll';
import { usePermissions } from '../../hooks/usePermissions';
import { SearchInput } from '../common/SearchInput';
import { APP_VERSION } from '../../config/version';

import {
  HomeIcon, UserGroupIcon, DocumentTextIcon, CreditCardIcon, TruckIcon,
  CogIcon, XMarkIcon, ArrowRightOnRectangleIcon, ChevronDownIcon,
  UsersIcon, KeyIcon, MapIcon, BuildingOffice2Icon, CalendarDaysIcon, TicketIcon,
  ClipboardDocumentListIcon, CurrencyDollarIcon, AdjustmentsHorizontalIcon,
  ChartPieIcon, CubeIcon, ChatBubbleLeftRightIcon, BellAlertIcon, ShieldCheckIcon,
  BriefcaseIcon, SparklesIcon, BanknotesIcon
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
  supervisorOnly?: boolean;
  showBadge?: boolean;
  external?: boolean;
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
      { name: 'Inicio', path: '/', icon: HomeIcon, iconColor: 'text-green-500 dark:text-green-400' },
      { name: 'Dashboard General', path: '/dashboard', icon: ChartPieIcon, iconColor: 'text-purple-500 dark:text-purple-400', adminOnly: true }
    ]
  },
  {
    title: 'Supervisión',
    items: [
      {
        name: 'Solicitudes de Anulación',
        path: '/supervisor/cancellation-requests',
        icon: BellAlertIcon,
        iconColor: 'text-red-500 dark:text-red-400',
        supervisorOnly: true,
        showBadge: true
      }
    ]
  },
  {
    title: 'Gestión de Clientes',
    items: [
      { name: 'Clientes', path: '/clients', icon: UserGroupIcon, iconColor: 'text-orange-500 dark:text-orange-400' }
    ]
  },
  {
    title: 'Sistema de Transporte Fluvial',
    expandable: true,
    expandKey: 'fluvial',
    icon: ChartPieIcon,
    iconColor: 'text-blue-500 dark:text-blue-400',
    items: [
      {
        name: 'Configuración',
        path: '#',
        icon: AdjustmentsHorizontalIcon,
        iconColor: 'text-blue-500 dark:text-blue-400',
        isSubmenu: true,
        expandKey: 'fluvialConfig',
        subitems: [
          { name: 'Ciudades y Puertos', path: '/fluvial/config/cities-ports', icon: MapIcon, iconColor: 'text-blue-500 dark:text-blue-400' },
          { name: 'Embarcaciones', path: '/fluvial/config/vessels', icon: BuildingOffice2Icon, iconColor: 'text-blue-500 dark:text-blue-400' },
          { name: 'Rutas', path: '/fluvial/config/routes', icon: TruckIcon, iconColor: 'text-blue-500 dark:text-blue-400' },
          { name: 'Tarifas', path: '/fluvial/config/fares-by-route', icon: CurrencyDollarIcon, iconColor: 'text-blue-500 dark:text-blue-400' },
          { name: 'Tipos de Asiento', path: '/fluvial/config/seat-types', icon: AdjustmentsHorizontalIcon, iconColor: 'text-blue-500 dark:text-blue-400' },
          { name: 'Productos y Servicios', path: '/fluvial/config/products-services', icon: CubeIcon, iconColor: 'text-blue-500 dark:text-blue-400' },
          { name: 'Configuración de Series', path: '/fluvial/config/document-series', icon: ClipboardDocumentListIcon, iconColor: 'text-blue-500 dark:text-blue-400' },
        ]
      },
      {
        name: 'Operaciones',
        path: '#',
        icon: CalendarDaysIcon,
        iconColor: 'text-blue-500 dark:text-blue-400',
        isSubmenu: true,
        expandKey: 'fluvialOps',
        subitems: [
          { name: 'Programar Viajes', path: '/fluvial/operations/schedule-trips', icon: CalendarDaysIcon, iconColor: 'text-blue-500 dark:text-blue-400' },
          { name: 'Punto de Venta (Pasajes)', path: '/fluvial/operations/sales-point', icon: TicketIcon, iconColor: 'text-blue-500 dark:text-blue-400' },
          { name: 'Gestionar Reservas', path: '/fluvial/operations/reservations', icon: ClipboardDocumentListIcon, iconColor: 'text-blue-500 dark:text-blue-400' },
          { name: 'Encomiendas y Carga', path: '/fluvial/operations/cargo-sale', icon: CubeIcon, iconColor: 'text-blue-500 dark:text-blue-400' },
          { name: 'Venta Rápida', path: '/fluvial/operations/quick-sales', icon: BriefcaseIcon, iconColor: 'text-purple-500 dark:text-purple-400' },
          { name: 'Manifiestos', path: '/fluvial/operations/manifests', icon: DocumentTextIcon, iconColor: 'text-blue-500 dark:text-blue-400' }
        ]
      }
    ]
  },
  {
    title: 'Operaciones Comerciales',
    expandable: true,
    expandKey: 'commerce',
    icon: DocumentTextIcon,
    iconColor: 'text-green-500 dark:text-green-400',
    items: [
      { name: 'Cotizaciones', path: '/sales/quotations', icon: DocumentTextIcon, iconColor: 'text-green-500 dark:text-green-400' },
      { name: 'Guías de Remisión', path: '/remission-guides', icon: TruckIcon, iconColor: 'text-green-500 dark:text-green-400' }
    ]
  },
  {
    title: 'Contabilidad',
    expandable: true,
    expandKey: 'accounting',
    icon: DocumentTextIcon,
    iconColor: 'text-indigo-500 dark:text-indigo-400',
    items: [
      { name: 'Facturas/Boletas', path: '/accounting/invoices', icon: DocumentTextIcon, iconColor: 'text-indigo-500 dark:text-indigo-400' },
      { name: 'Notas de Crédito', path: '/accounting/credit-notes', icon: DocumentTextIcon, iconColor: 'text-indigo-500 dark:text-indigo-400' },
      { name: 'Notas de Débito', path: '/accounting/debit-notes', icon: DocumentTextIcon, iconColor: 'text-indigo-500 dark:text-indigo-400' }
    ]
  },

  {
    title: 'Gestión de viajes y cobros',
    items: [
      { name: 'Reprogramaciones pendientes', path: '/accounting/reprogramming', icon: DocumentTextIcon, iconColor: 'text-amber-500' },
      { name: 'Encomiendas por cobrar', path: '/finance/receivables', icon: CreditCardIcon, iconColor: 'text-pink-500 dark:text-pink-400' }
    ]
  },

  {
    title: 'Administración del Sistema',
    expandable: true,
    expandKey: 'administration',
    icon: CogIcon,
    iconColor: 'text-dm-text-muted',
    items: [
      { name: 'Usuarios', path: '/settings/users', icon: UsersIcon, iconColor: 'text-dm-text-muted' },
      { name: 'Roles', path: '/settings/roles', icon: KeyIcon, iconColor: 'text-dm-text-muted' },
      { name: 'Configuración Empresa', path: '/settings/company', icon: CogIcon, iconColor: 'text-dm-text-muted' },
      { name: 'WhatsApp', path: '/settings/whatsapp', icon: ChatBubbleLeftRightIcon, iconColor: 'text-green-500 dark:text-green-400' },
      {
        name: 'Conciliación Bancaria',
        path: 'https://romero-conciliacion.vercel.app/',
        icon: BanknotesIcon,
        iconColor: 'text-sky-500 dark:text-sky-400',
        adminOnly: true,
        external: true,
      },
      { name: 'Novedades', path: '/settings/updates', icon: SparklesIcon, iconColor: 'text-amber-500 dark:text-amber-400' }
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

  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar grupos basados en permisos
  const filteredNavGroups = useCallback(() => {
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
      if (group.title === 'Navegación Principal') return true;
      if (group.title === 'Supervisión') return isSupervisor || isAdmin;
      if (group.title === 'Dashboard') return hasPermission('dashboard', undefined, userRole);
      if (group.title === 'Gestión de Clientes') return hasPermission('clients', undefined, userRole);
      if (group.title === 'Sistema de Transporte Fluvial') return hasPermission('fluvial', undefined, userRole);
      if (group.title === 'Operaciones Comerciales') return hasPermission('commerce', undefined, userRole);
      if (group.title === 'Contabilidad') return hasPermission('accounting', undefined, userRole);
      if (group.title === 'Gestión de viajes y cobros') return hasPermission('finance', undefined, userRole) || ['admin', 'supervisor', 'sales', 'seller'].includes(userRole);
      if (group.title === 'Administración del Sistema') return hasPermission('administration', undefined, userRole);
      return false;
    }).map(group => {
      const filteredItems = group.items.filter(item => {
        if (item.adminOnly && !isAdmin) {
          return false;
        }
        if (item.supervisorOnly && !isSupervisor && !isAdmin) {
          return false;
        }
        if (item.name === 'Configuración') return isAdmin;
        if (item.name === 'Operaciones') return hasPermission('fluvial', 'operations', userRole);
        if (item.name === 'Cotizaciones') return hasPermission('commerce', 'quotations', userRole);
        if (item.name === 'Guías de Remisión') return hasPermission('commerce', 'remission-guides', userRole);
        if (item.name === 'Facturas/Boletas') return hasPermission('accounting', 'invoices', userRole);
        if (item.name === 'Encomiendas por cobrar') return hasPermission('finance', undefined, userRole);
        if (item.name === 'Reprogramaciones pendientes') return ['admin', 'supervisor', 'sales', 'seller'].includes(userRole?.toLowerCase() || '');
        if (item.name === 'Notas de Crédito') return hasPermission('accounting', 'credit-notes', userRole);
        if (item.name === 'Notas de Débito') return hasPermission('accounting', 'debit-notes', userRole);
        return true;
      }).map(item => {
        if (item.isSubmenu && item.subitems) {
          const filteredSubitems = item.subitems.filter((subitem: NavItem) => {
            if (userRole === 'driver') {
              return subitem.name === 'Manifiestos';
            }
            if (item.name === 'Configuración') {
              return isAdmin;
            }
            if (userRole === 'sales' && item.name === 'Operaciones') {
              return true;
            }
            if (userRole === 'dispatcher' && item.name === 'Operaciones') {
              return true;
            }
            return true;
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

    if (currentUser) {
      const userRole = currentUser.role?.name?.toLowerCase() || currentUser.role_name?.toLowerCase() || '';
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

  const isSearching = searchQuery.trim().length > 0;

  const searchedNavGroups = useMemo(() => {
    if (!isSearching) return filteredNavGroups();

    const query = searchQuery.trim().toLowerCase();
    const matches = (name: string) => name.toLowerCase().includes(query);

    return filteredNavGroups()
      .map(group => {
        const filteredItems = group.items
          .map(item => {
            if (item.subitems && item.subitems.length > 0) {
              const filteredSubitems = item.subitems.filter(sub => matches(sub.name));
              const itemMatches = matches(item.name);
              if (itemMatches || filteredSubitems.length > 0) {
                return { ...item, subitems: itemMatches ? item.subitems : filteredSubitems };
              }
              return null;
            }
            return matches(item.name) ? item : null;
          })
          .filter((item): item is NavItem => item !== null);

        return { ...group, items: filteredItems };
      })
      .filter(group => group.items.length > 0);
  }, [searchQuery, filteredNavGroups, isSearching]);

  const renderMenuItem = useCallback((item: NavItem, isSubitem = false, level = 0) => {
    const isExpanded = item.expandKey ? (isSearching ? true : expandedMenus[item.expandKey]) : false;
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
                ? 'bg-dm-bg-accent text-dm-text-accent'
                : 'text-dm-text-secondary hover:bg-dm-bg-hover hover:text-dm-text-primary'
            }`}
          >
            <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 ${item.iconColor || 'text-dm-text-muted'}`} />
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
              <div className="mt-1 bg-dm-bg-secondary/50 rounded-lg mx-2">
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

    if (item.external) {
      return (
        <a
          key={item.path}
          href={item.path}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
          }}
          className={`${baseClasses} ${paddingClasses} mb-1 text-dm-text-secondary hover:bg-dm-bg-hover hover:text-dm-text-primary`}
        >
          <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 ${item.iconColor || 'text-dm-text-muted'}`} />
          <span className="flex-1">{item.name}</span>
        </a>
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
              ? 'bg-dm-bg-accent text-dm-text-accent'
              : 'text-dm-text-secondary hover:bg-dm-bg-hover hover:text-dm-text-primary'
          }`
        }
      >
        <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 ${
          item.iconColor || 'text-dm-text-muted'
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
  }, [expandedMenus, pendingCount, isSearching]);

  const renderExpandableGroup = useCallback((group: NavGroup) => {
    const isExpanded = group.expandKey ? (isSearching ? true : expandedMenus[group.expandKey]) : false;

    return (
      <div key={group.title} className="mb-6">
        <button
          onClick={() => group.expandKey && toggleSubmenu(group.expandKey)}
          className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
            isExpanded
              ? 'bg-dm-bg-accent text-dm-text-accent'
              : 'text-dm-text-secondary hover:bg-dm-bg-hover hover:text-dm-text-primary'
          }`}
        >
          {group.icon && <group.icon className={`w-5 h-5 mr-3 ${group.iconColor || 'text-dm-text-muted'}`} />}
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
              <div className="mt-1 bg-dm-bg-secondary rounded-lg mx-2">
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
  }, [expandedMenus, renderMenuItem, isSearching]);

  const renderSimpleGroup = useCallback((group: NavGroup, idx: number) => (
    <div key={idx} className="mb-6">
      <div className="px-4 py-2 text-xs font-semibold text-dm-text-muted uppercase tracking-wide mb-3">
        {group.title}
      </div>
      <div className="space-y-1">
        {group.items.map((item: NavItem) => renderMenuItem(item, false, 0))}
      </div>
    </div>
  ), [renderMenuItem]);

  return (
    <div className="flex flex-col h-full bg-dm-bg-primary rounded-xl shadow-lg border border-dm-border-primary">
      <div className="flex items-center justify-between p-6 border-b border-dm-border-secondary">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <ChartPieIcon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-dm-text-primary">Sistema de Gestión</h2>
        </div>
        <button onClick={onCloseMobile} className="lg:hidden p-2 rounded-md hover:bg-dm-bg-hover focus:outline-none focus:ring-2 focus:ring-dm-border-primary">
          <XMarkIcon className="w-6 h-6 text-dm-text-muted" />
        </button>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--border-primary) transparent'
        }}
      >
        <div className="mb-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar opciones..."
          />
          {isSearching && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-dm-text-muted">
                {searchedNavGroups.reduce((acc, g) => acc + g.items.length + g.items.reduce((a, i) => a + (i.subitems?.length ?? 0), 0), 0)} resultado(s)
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-primary hover:text-primary-dark font-medium transition-colors"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>
        <nav className="space-y-2">
          {searchedNavGroups.map((group, idx) =>
            group.expandable
              ? renderExpandableGroup(group)
              : renderSimpleGroup(group, idx)
          )}
        </nav>
      </div>

      <div className="px-4 py-3 border-t border-dm-border-secondary">
        <button
          onClick={() => navigate('/changelog')}
          className="flex items-center justify-between w-full group"
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-dm-text-muted group-hover:text-primary transition-colors">
            Versión
          </span>
          <span className="rounded-full bg-dm-bg-badge px-2 py-0.5 text-[10px] font-semibold text-dm-text-secondary group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            v{APP_VERSION}
          </span>
        </button>
      </div>

      <div className="p-3 border-t border-dm-border-secondary">
        <button
          className="flex items-center w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-500/10 rounded-lg transition-all duration-200"
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
