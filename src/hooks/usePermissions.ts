// src/hooks/usePermissions.ts
import { useCallback } from 'react';

export const usePermissions = () => {
  const hasPermission = useCallback((groupKey: string, itemKey?: string, userRole?: string) => {
    if (!userRole) return false;
    const role = userRole.toLowerCase();

    // ADMIN tiene acceso total
    if (role === 'admin') return true;

    // SUPERVISOR tiene los mismos permisos que SALES + permisos especiales de supervisión
    if (role === 'supervisor') {
      if (groupKey === 'supervisor') return true;
      // Para cualquier otro caso, el supervisor tiene los mismos permisos que SALES
      // Continuamos evaluando como si fuera SALES
    }

    switch (groupKey) {
      case 'dashboard':
        return role === 'admin'; // Solo administradores pueden acceder al dashboard analítico

      case 'supervisor':
        return role === 'supervisor' || role === 'admin'; // Supervisores y administradores

      case 'clients':
        return ['sales', 'supervisor', 'dispatcher', 'accountant'].includes(role); // SALES, SUPERVISOR CRUD, otros lectura

      case 'fluvial':
        if (!itemKey) return ['sales', 'supervisor', 'dispatcher', 'driver'].includes(role);
        switch (itemKey) {
          case 'dashboard':
            return true;
          case 'config':
            return role === 'admin'; // Solo administradores pueden acceder a configuración
          case 'operations':
            return ['sales', 'supervisor', 'dispatcher', 'driver'].includes(role);
          case 'reports':
            return ['sales', 'supervisor', 'dispatcher'].includes(role);
          default:
            return false;
        }

      case 'commerce':
        if (!itemKey) return ['sales', 'supervisor', 'dispatcher'].includes(role);
        switch (itemKey) {
          case 'quotations':
            return ['sales', 'supervisor'].includes(role);
          case 'remission-guides':
            return ['sales', 'supervisor', 'dispatcher'].includes(role);
          default:
            return false;
        }

      case 'accounting':
        if (!itemKey) return ['sales', 'supervisor', 'accountant'].includes(role); // SALES y SUPERVISOR tienen acceso completo a facturación
        switch (itemKey) {
          case 'dashboard':
            return ['sales', 'supervisor', 'accountant'].includes(role);
          case 'invoices':
            return ['sales', 'supervisor', 'accountant'].includes(role); // SALES y SUPERVISOR pueden hacer CRUD completo
          case 'credit-notes':
            return ['sales', 'supervisor', 'accountant'].includes(role); // SALES y SUPERVISOR también pueden gestionar notas de crédito
          case 'debit-notes':
            return ['sales', 'supervisor', 'accountant'].includes(role); // SALES y SUPERVISOR también pueden gestionar notas de débito
          default:
            return false;
        }

      case 'finance':
        return ['sales', 'supervisor', 'accountant'].includes(role);

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
      '/': ['admin', 'sales', 'supervisor', 'dispatcher', 'accountant', 'driver', 'warehouse'], // Dashboard principal para todos los usuarios
      '/welcome': ['admin', 'sales', 'supervisor', 'dispatcher', 'accountant', 'driver', 'warehouse'], // Página de bienvenida para todos
      '/clients': ['admin', 'sales', 'supervisor', 'dispatcher', 'accountant'],
      '/fluvial/config': ['admin'], // Solo admin puede acceder a configuración
      '/fluvial/operations': ['admin', 'sales', 'supervisor', 'dispatcher', 'driver'],
      '/sales/quotations': ['admin', 'sales', 'supervisor'],
      '/remission-guides': ['admin', 'sales', 'supervisor', 'dispatcher'],
      '/accounting': ['admin', 'sales', 'supervisor', 'accountant'], // SALES y SUPERVISOR tienen acceso completo
      '/accounting/invoices': ['admin', 'sales', 'supervisor', 'accountant'], // SALES y SUPERVISOR pueden hacer todo
      '/accounting/credit-notes': ['admin', 'sales', 'supervisor', 'accountant'], // SALES y SUPERVISOR también pueden gestionar notas
      '/accounting/debit-notes': ['admin', 'sales', 'supervisor', 'accountant'], // SALES y SUPERVISOR también pueden gestionar notas
      '/finance': ['admin', 'sales', 'supervisor', 'accountant'],
      '/supervisor': ['admin', 'supervisor'], // Solo supervisor y admin
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
