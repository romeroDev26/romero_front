// src/components/layout/Sidebar.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { User } from '../../types';
import { useSidebarScroll } from '../../hooks/useSidebarScroll';
import {
  HomeIcon, UserGroupIcon, DocumentTextIcon, CreditCardIcon, TruckIcon,
  ChartBarIcon, CogIcon, XMarkIcon, ArrowRightOnRectangleIcon, ChevronDownIcon,
  UsersIcon, KeyIcon, MapIcon, BuildingOffice2Icon, CalendarDaysIcon, TicketIcon,
  ClipboardDocumentListIcon, CurrencyDollarIcon, AdjustmentsHorizontalIcon,
  ChartPieIcon, CubeIcon
} from '@heroicons/react/24/outline';

const STORAGE_KEY_EXPANDED_MENUS = 'dashboard_expanded_menus';

interface SidebarProps {
  currentUser?: User;
  onLogout: () => void;
  onCloseMobile: () => void;
}

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
          { name: 'Productos y Servicios', path: '/fluvial/config/products-services', icon: CubeIcon },
          { name: 'Configuración de Series', path: '/fluvial/config/document-series', icon: ClipboardDocumentListIcon },
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

const Sidebar: React.FC<SidebarProps> = ({ currentUser, onLogout, onCloseMobile }) => {
  const location = useLocation();
  const { scrollRef, handleScroll } = useSidebarScroll();
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EXPANDED_MENUS);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    const currentPath = location.pathname;
    const newExpanded: { [key: string]: boolean } = {};

    navGroups.forEach(group => {
      if (group.expandable) {
        const isGroupActive = group.items.some(item =>
          currentPath.startsWith(item.path !== '#' ? item.path : '---') ||
          (item.subitems && item.subitems.some(sub => currentPath.startsWith(sub.path)))
        );
        if (isGroupActive) {
          newExpanded[group.expandKey] = true;

          group.items.forEach(subGroup => {
            if (subGroup.isSubmenu) {
              const isSubGroupActive = subGroup.subitems.some(sub => currentPath.startsWith(sub.path));
              if (isSubGroupActive) {
                newExpanded[subGroup.expandKey] = true;
              }
            }
          });
        }
      }
    });

    if (JSON.stringify(expandedMenus) !== JSON.stringify(newExpanded)) {
      setExpandedMenus(newExpanded);
    }
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXPANDED_MENUS, JSON.stringify(expandedMenus));
  }, [expandedMenus]);

  const toggleSubmenu = (menuKey: string) => {
    setExpandedMenus(prev => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  const getRoleDisplay = (user: User | undefined) => {
    if (!user) return '';
    return user.role?.description || user.role?.name || user.role_name || 'Sin rol';
  };

  const renderMenuItem = useCallback((item: any, isSubitem = false, level = 0) => {
    const isExpanded = item.expandKey ? expandedMenus[item.expandKey] : false;

    const baseClasses = `flex items-center w-full text-left text-sm font-medium cursor-pointer transition-all duration-200 ease-in-out rounded-lg`;

    let paddingClasses = isSubitem ? 'pl-10 pr-4 py-2.5' : 'px-4 py-3';
    if (level > 0) {
      paddingClasses = `pl-${10 + level * 4} pr-4 py-2.5`;
    }

    if (item.isSubmenu) {
      return (
        <div key={item.name} className="mb-1">
          <button
            onClick={() => toggleSubmenu(item.expandKey)}
            className={`${baseClasses} ${paddingClasses} ${
              expandedMenus[item.expandKey]
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="flex-1">{item.name}</span>
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isExpanded && item.subitems && (
            <div className="mt-1 bg-gray-50/50 rounded-lg mx-2">
              <div className="py-2 space-y-1">
                {item.subitems.map((subitem: any) => renderMenuItem(subitem, true, level + 1))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.path}
        to={item.path}
        end
        className={({ isActive }) =>
          `${baseClasses} ${paddingClasses} mb-1 ${
            isActive
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
          }`
        }
      >
        <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
        <span>{item.name}</span>
      </NavLink>
    );
  }, [expandedMenus]);

  const renderExpandableGroup = useCallback((group: any) => {
    const isExpanded = expandedMenus[group.expandKey];

    return (
      <div key={group.title} className="mb-6">
        <button
          onClick={() => toggleSubmenu(group.expandKey)}
          className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
            isExpanded
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
          }`}
        >
          <group.icon className="w-5 h-5 mr-3" />
          <span className="flex-1">{group.title}</span>
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isExpanded && (
          <div className="mt-1 bg-gray-50 rounded-lg mx-2 overflow-hidden">
            <div className="py-2 space-y-1">
              {group.items.map((item: any) => (
                <div key={item.name || item.path}>
                  {renderMenuItem(item, false, 0)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }, [expandedMenus, renderMenuItem]);

  const renderSimpleGroup = useCallback((group: any, idx: number) => (
    <div key={idx} className="mb-6">
      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {group.title}
      </div>
      <div className="space-y-1">
        {group.items.map((item: any) => renderMenuItem(item, false, 0))}
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
          <h2 className="text-lg font-semibold text-gray-800">Transportes Romero</h2>
        </div>
        <button onClick={onCloseMobile} className="lg:hidden p-1 rounded-md hover:bg-gray-100">
          <XMarkIcon className="w-5 h-5 text-gray-500" />
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
          {navGroups.map((group, idx) =>
            group.expandable
              ? renderExpandableGroup(group)
              : renderSimpleGroup(group, idx)
          )}
        </nav>
      </div>
      {currentUser && (
        <div className="p-4 border-t border-gray-100">
          <div className="text-sm text-gray-600 mb-2">
            <div className="font-medium">{currentUser.full_name}</div>
            <div className="text-xs text-gray-500">{getRoleDisplay(currentUser)}</div>
          </div>
        </div>
      )}
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
