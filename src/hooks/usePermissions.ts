// src/hooks/usePermissions.ts
import { useCallback } from 'react';

export const usePermissions = () => {
  const hasPermission = useCallback((groupKey: string, itemKey?: string, userRole?: string) => {
    if (!userRole) return false;
    const role = userRole.toLowerCase();

    // ADMIN tiene acceso total
    if (role === 'admin') return true;

    switch (groupKey) {
      case 'dashboard':
        return true; // Todos pueden ver dashboard

      case 'clients':
        return ['sales', 'dispatcher', 'accountant'].includes(role); // SALES CRUD, otros lectura

      case 'fluvial':
        if (!itemKey) return ['sales', 'dispatcher', 'driver'].includes(role);
        switch (itemKey) {
          case 'dashboard':
            return true;
          case 'config':
            return ['sales', 'dispatcher'].includes(role); // SALES lectura, DISPATCHER CRUD
          case 'operations':
            return ['sales', 'dispatcher', 'driver'].includes(role);
          case 'reports':
            return ['sales', 'dispatcher'].includes(role);
          default:
            return false;
        }

      case 'commerce':
        if (!itemKey) return ['sales', 'dispatcher'].includes(role);
        switch (itemKey) {
          case 'quotations':
            return role === 'sales';
          case 'remission-guides':
            return ['sales', 'dispatcher'].includes(role);
          default:
            return false;
        }

      case 'accounting':
        if (!itemKey) return ['sales', 'accountant'].includes(role); // SALES tiene acceso completo a facturación
        switch (itemKey) {
          case 'dashboard':
            return ['sales', 'accountant'].includes(role);
          case 'invoices':
            return ['sales', 'accountant'].includes(role); // SALES puede hacer CRUD completo
          case 'credit-notes':
            return ['sales', 'accountant'].includes(role); // SALES también puede gestionar notas de crédito
          case 'debit-notes':
            return ['sales', 'accountant'].includes(role); // SALES también puede gestionar notas de débito
          case 'summaries':
            return ['sales', 'accountant'].includes(role); // SALES puede ver resúmenes
          case 'voids':
            return ['sales', 'accountant'].includes(role); // SALES puede hacer anulaciones
          default:
            return false;
        }

      case 'finance':
        return ['sales', 'accountant'].includes(role);

      case 'administration':
        return role === 'admin';

      default:
        return false;
    }
  }, []);

  const hasRoutePermission = useCallback((path: string, userRole?: string) => {
    if (!userRole) return false;
    const role = userRole.toLowerCase();

    // ADMIN tiene acceso total
    if (role === 'admin') return true;

    // Mapear rutas a permisos
    const routePermissions: { [key: string]: string[] } = {
      '/': ['admin', 'sales', 'dispatcher', 'accountant', 'driver', 'warehouse'],
      '/clients': ['admin', 'sales', 'dispatcher', 'accountant'],
      '/fluvial/config': ['admin', 'sales', 'dispatcher'],
      '/fluvial/operations': ['admin', 'sales', 'dispatcher', 'driver'],
      '/sales/quotations': ['admin', 'sales'],
      '/remission-guides': ['admin', 'sales', 'dispatcher'],
      '/accounting': ['admin', 'sales', 'accountant'], // SALES tiene acceso completo
      '/accounting/invoices': ['admin', 'sales', 'accountant'], // SALES puede hacer todo
      '/accounting/credit-notes': ['admin', 'sales', 'accountant'], // SALES también puede gestionar notas
      '/accounting/debit-notes': ['admin', 'sales', 'accountant'], // SALES también puede gestionar notas
      '/accounting/summaries': ['admin', 'sales', 'accountant'], // SALES puede ver resúmenes
      '/accounting/voids': ['admin', 'sales', 'accountant'], // SALES puede hacer anulaciones
      '/finance': ['admin', 'sales', 'accountant'],
      '/settings': ['admin']
    };

    // Verificar rutas exactas
    if (routePermissions[path]) {
      return routePermissions[path].includes(role);
    }

    // Verificar rutas con prefijos
    for (const [route, roles] of Object.entries(routePermissions)) {
      if (path.startsWith(route) && route !== '/') {
        return roles.includes(role);
      }
    }

    return false;
  }, []);

  return { hasPermission, hasRoutePermission };
};
