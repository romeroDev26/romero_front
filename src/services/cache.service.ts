// src/services/cache.service.ts
/**
 * Servicio centralizado para manejo de caché y limpieza de datos de sesión
 */

import { queryClient } from '../App';

export interface CacheCleanupOptions {
  clearQueryClient?: boolean;
  preserveKeys?: string[];
}

export const cacheService = {
  /**
   * Limpia completamente todos los datos de localStorage y sessionStorage
   * relacionados con la sesión del usuario
   */
  clearAll: (options: CacheCleanupOptions = {}): void => {
    const { preserveKeys = [], clearQueryClient: shouldClearQueryClient = true } = options;

    // Limpiar React Query cache si está habilitado
    if (shouldClearQueryClient) {
      try {
        queryClient.clear();
      } catch (error) {
        // Silenciosamente manejar error de limpieza
      }
    }

    // Keys específicas de localStorage que deben limpiarse al logout
    const localStorageKeysToRemove = [
      // Autenticación
      'authToken',
      'user',
      'token',
      'userInfo',
      
      // Dashboard y UI
      'dashboard_expanded_menus',
      'dashboard_sidebar_hidden', 
      'dashboard_sidebar_scroll',
      
      // Punto de venta y sucursales
      'selectedSalesBranch',
      'lastSoldTripId',
      
      // Series de documentos
      'lastUsedBoletaSeries',
      'lastUsedFacturaSeries',
      'lastUsedCreditNoteSeries',
      'lastUsedDebitNoteSeries',
      
      // Series de cotizaciones (patrón dinámico)
      // Estas se limpiarán con el método de pattern matching
    ];

    // Limpiar keys específicas de localStorage
    localStorageKeysToRemove.forEach(key => {
      if (!preserveKeys.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    // Limpiar keys con patrones específicos de localStorage
    const localStoragePatterns = [
      /^quotationSeries_branch_\d+$/, // Series de cotizaciones por sucursal
      /^lastUsed.*Series$/,           // Cualquier serie "lastUsed"
      /^selectedSalesBranch_.*$/,     // Variaciones de sucursal seleccionada
    ];

    cacheService.removeByPattern(localStorage, localStoragePatterns, preserveKeys);

    // Keys específicas de sessionStorage que deben limpiarse
    const sessionStorageKeysToRemove = [
      'debitNoteAffectedInvoice',
      'creditNoteAffectedInvoice',
      'tempFormData',
    ];

    sessionStorageKeysToRemove.forEach(key => {
      if (!preserveKeys.includes(key)) {
        sessionStorage.removeItem(key);
      }
    });

    // Limpiar keys con patrones específicos de sessionStorage
    const sessionStoragePatterns = [
      /^seat_reservations_trip_\d+$/,    // Reservas de asientos por viaje
      /^temp_session_\w+$/,             // Sesiones temporales
      /^seatSelection_.*$/,             // Selecciones de asientos
    ];

    cacheService.removeByPattern(sessionStorage, sessionStoragePatterns, preserveKeys);
  },

  /**
   * Remueve items de storage basado en patrones regex
   */
  removeByPattern: (storage: Storage, patterns: RegExp[], preserveKeys: string[] = []): void => {
    const keysToRemove: string[] = [];
    
    // Iterar sobre todas las keys del storage
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && !preserveKeys.includes(key)) {
        // Verificar si la key coincide con algún patrón
        const matchesPattern = patterns.some(pattern => pattern.test(key));
        if (matchesPattern) {
          keysToRemove.push(key);
        }
      }
    }

    // Remover las keys encontradas
    keysToRemove.forEach(key => {
      storage.removeItem(key);
    });
  },

  /**
   * Limpia solo datos específicos de autenticación
   */
  clearAuthData: (): void => {
    const authKeys = ['authToken', 'user', 'token', 'userInfo'];
    authKeys.forEach(key => localStorage.removeItem(key));
  },

  /**
   * Limpia solo datos de UI y preferencias del usuario
   */
  clearUIPreferences: (): void => {
    const uiKeys = [
      'dashboard_expanded_menus',
      'dashboard_sidebar_hidden',
      'dashboard_sidebar_scroll'
    ];
    uiKeys.forEach(key => localStorage.removeItem(key));
  },

  /**
   * Limpia solo datos de sesión operacional (punto de venta, reservas, etc.)
   */
  clearOperationalData: (): void => {
    // localStorage operacional
    const operationalKeys = [
      'selectedSalesBranch',
      'lastSoldTripId',
      'lastUsedBoletaSeries',
      'lastUsedFacturaSeries', 
      'lastUsedCreditNoteSeries',
      'lastUsedDebitNoteSeries'
    ];
    
    operationalKeys.forEach(key => localStorage.removeItem(key));

    // Limpiar sessionStorage operacional
    cacheService.removeByPattern(sessionStorage, [
      /^seat_reservations_trip_\d+$/,
      /^temp_session_\w+$/,
      /^seatSelection_.*$/,
    ]);

    // Limpiar keys de series específicas de cotizaciones
    cacheService.removeByPattern(localStorage, [
      /^quotationSeries_branch_\d+$/
    ]);
  },

  /**
   * Obtiene información de debug sobre el estado actual del cache
   */
  getCacheInfo: (): { localStorage: string[]; sessionStorage: string[]; total: number } => {
    const localStorageKeys: string[] = [];
    const sessionStorageKeys: string[] = [];

    // Obtener keys de localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) localStorageKeys.push(key);
    }

    // Obtener keys de sessionStorage  
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) sessionStorageKeys.push(key);
    }

    return {
      localStorage: localStorageKeys.sort(),
      sessionStorage: sessionStorageKeys.sort(),
      total: localStorageKeys.length + sessionStorageKeys.length
    };
  }
};