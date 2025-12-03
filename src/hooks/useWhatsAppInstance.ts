// src/hooks/useWhatsAppInstance.ts
import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { branchOfficesService } from '../services/branchOffices.service';
import { authService } from '../services/auth.service';
import { whatsappConfigService } from '../services/whatsappConfig.service';
import { BranchOffice } from '../types';

interface WhatsAppInstanceInfo {
  instanceName: string | null;
  branchOfficeName: string | null;
  branchOfficeId: number | null;
  isLoading: boolean;
  hasInstance: boolean;
  error: string | null;
}

// Información extendida con estado de conexión y fallback
interface WhatsAppInstanceWithConnectionInfo extends WhatsAppInstanceInfo {
  isConnected: boolean;
  isCheckingConnection: boolean;
  // Información de fallback (sucursal alternativa)
  fallbackInstanceName: string | null;
  fallbackBranchOfficeName: string | null;
  fallbackBranchOfficeId: number | null;
  hasFallback: boolean;
  usingFallback: boolean;
  // Instancia efectiva a usar (la original si está conectada, o el fallback)
  effectiveInstanceName: string | null;
  effectiveBranchOfficeName: string | null;
}

/**
 * Hook para obtener la instancia de WhatsApp de una sucursal específica
 * @param branchOfficeId ID de la sucursal (opcional, usa la del usuario si no se especifica)
 */
export const useWhatsAppInstance = (branchOfficeId?: number | null): WhatsAppInstanceInfo => {
  const currentUser = authService.getCurrentUser();
  const companyId = currentUser?.company_id || Number(localStorage.getItem('company_id')) || 1;
  
  // Si no se proporciona un branch_office_id, usar el del usuario actual
  const targetBranchOfficeId = branchOfficeId ?? currentUser?.default_branch_office_id;

  // Obtener todas las sucursales de la empresa
  const { data: branchOffices = [], isLoading, error } = useQuery({
    queryKey: ['branchOffices', companyId],
    queryFn: () => branchOfficesService.getAllByCompany(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  const instanceInfo = useMemo((): WhatsAppInstanceInfo => {
    if (isLoading) {
      return {
        instanceName: null,
        branchOfficeName: null,
        branchOfficeId: targetBranchOfficeId ?? null,
        isLoading: true,
        hasInstance: false,
        error: null,
      };
    }

    if (error) {
      return {
        instanceName: null,
        branchOfficeName: null,
        branchOfficeId: targetBranchOfficeId ?? null,
        isLoading: false,
        hasInstance: false,
        error: 'Error al cargar información de sucursales',
      };
    }

    if (!targetBranchOfficeId) {
      return {
        instanceName: null,
        branchOfficeName: null,
        branchOfficeId: null,
        isLoading: false,
        hasInstance: false,
        error: 'No se ha especificado una sucursal',
      };
    }

    const branchOffice = branchOffices.find((b: BranchOffice) => b.id === targetBranchOfficeId);
    
    if (!branchOffice) {
      return {
        instanceName: null,
        branchOfficeName: null,
        branchOfficeId: targetBranchOfficeId,
        isLoading: false,
        hasInstance: false,
        error: 'Sucursal no encontrada',
      };
    }

    const instanceName = branchOffice.whatsapp_instance_name;
    
    return {
      instanceName: instanceName || null,
      branchOfficeName: branchOffice.name,
      branchOfficeId: branchOffice.id,
      isLoading: false,
      hasInstance: !!instanceName,
      error: instanceName ? null : `La sucursal "${branchOffice.name}" no tiene WhatsApp configurado`,
    };
  }, [branchOffices, targetBranchOfficeId, isLoading, error]);

  return instanceInfo;
};

/**
 * Hook para obtener la instancia de WhatsApp basándose en el nombre de la sucursal
 * Útil cuando solo tienes el nombre de la sucursal (ej: desde BackendInvoiceData)
 */
export const useWhatsAppInstanceByName = (branchOfficeName: string | null): WhatsAppInstanceInfo => {
  const currentUser = authService.getCurrentUser();
  const companyId = currentUser?.company_id || Number(localStorage.getItem('company_id')) || 1;

  // Obtener todas las sucursales de la empresa
  const { data: branchOffices = [], isLoading, error } = useQuery({
    queryKey: ['branchOffices', companyId],
    queryFn: () => branchOfficesService.getAllByCompany(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const instanceInfo = useMemo((): WhatsAppInstanceInfo => {
    if (isLoading) {
      return {
        instanceName: null,
        branchOfficeName,
        branchOfficeId: null,
        isLoading: true,
        hasInstance: false,
        error: null,
      };
    }

    if (error) {
      return {
        instanceName: null,
        branchOfficeName,
        branchOfficeId: null,
        isLoading: false,
        hasInstance: false,
        error: 'Error al cargar información de sucursales',
      };
    }

    if (!branchOfficeName) {
      return {
        instanceName: null,
        branchOfficeName: null,
        branchOfficeId: null,
        isLoading: false,
        hasInstance: false,
        error: 'No se ha especificado una sucursal',
      };
    }

    // Buscar por nombre (case insensitive)
    const branchOffice = branchOffices.find(
      (b: BranchOffice) => b.name.toLowerCase() === branchOfficeName.toLowerCase()
    );
    
    if (!branchOffice) {
      return {
        instanceName: null,
        branchOfficeName,
        branchOfficeId: null,
        isLoading: false,
        hasInstance: false,
        error: `Sucursal "${branchOfficeName}" no encontrada`,
      };
    }

    const instanceName = branchOffice.whatsapp_instance_name;
    
    return {
      instanceName: instanceName || null,
      branchOfficeName: branchOffice.name,
      branchOfficeId: branchOffice.id,
      isLoading: false,
      hasInstance: !!instanceName,
      error: instanceName ? null : `La sucursal "${branchOffice.name}" no tiene WhatsApp configurado`,
    };
  }, [branchOffices, branchOfficeName, isLoading, error]);

  return instanceInfo;
};

/**
 * Hook avanzado para obtener la instancia de WhatsApp con verificación de conexión y fallback automático
 * Si la sucursal no tiene WhatsApp o está desconectada, busca otra sucursal conectada como alternativa
 */
export const useWhatsAppInstanceWithFallback = (branchOfficeName: string | null): WhatsAppInstanceWithConnectionInfo => {
  const currentUser = authService.getCurrentUser();
  const companyId = currentUser?.company_id || Number(localStorage.getItem('company_id')) || 1;

  // Estados para la verificación de conexión
  const [connectionStates, setConnectionStates] = useState<Record<string, { isConnected: boolean; checked: boolean }>>({});
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  // Obtener todas las sucursales de la empresa
  const { data: branchOffices = [], isLoading, error } = useQuery({
    queryKey: ['branchOffices', companyId],
    queryFn: () => branchOfficesService.getAllByCompany(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  // Sucursales con instancia de WhatsApp
  const branchesWithWhatsApp = useMemo(() => 
    branchOffices.filter((b: BranchOffice) => b.whatsapp_instance_name),
    [branchOffices]
  );

  // Verificar estado de conexión de todas las instancias
  useEffect(() => {
    const checkConnections = async () => {
      if (branchesWithWhatsApp.length === 0 || isLoading) return;

      setIsCheckingConnection(true);
      const newStates: Record<string, { isConnected: boolean; checked: boolean }> = {};

      await Promise.all(
        branchesWithWhatsApp.map(async (branch: BranchOffice) => {
          if (branch.whatsapp_instance_name) {
            try {
              const status = await whatsappConfigService.getConnectionStatus(branch.whatsapp_instance_name);
              newStates[branch.whatsapp_instance_name] = {
                isConnected: status.is_connected && status.connection_state === 'open',
                checked: true,
              };
            } catch {
              newStates[branch.whatsapp_instance_name] = {
                isConnected: false,
                checked: true,
              };
            }
          }
        })
      );

      setConnectionStates(newStates);
      setIsCheckingConnection(false);
    };

    checkConnections();
  }, [branchesWithWhatsApp, isLoading]);

  const instanceInfo = useMemo((): WhatsAppInstanceWithConnectionInfo => {
    // Estado de carga inicial
    if (isLoading || isCheckingConnection) {
      return {
        instanceName: null,
        branchOfficeName,
        branchOfficeId: null,
        isLoading: true,
        hasInstance: false,
        error: null,
        isConnected: false,
        isCheckingConnection: true,
        fallbackInstanceName: null,
        fallbackBranchOfficeName: null,
        fallbackBranchOfficeId: null,
        hasFallback: false,
        usingFallback: false,
        effectiveInstanceName: null,
        effectiveBranchOfficeName: null,
      };
    }

    if (error) {
      return {
        instanceName: null,
        branchOfficeName,
        branchOfficeId: null,
        isLoading: false,
        hasInstance: false,
        error: 'Error al cargar información de sucursales',
        isConnected: false,
        isCheckingConnection: false,
        fallbackInstanceName: null,
        fallbackBranchOfficeName: null,
        fallbackBranchOfficeId: null,
        hasFallback: false,
        usingFallback: false,
        effectiveInstanceName: null,
        effectiveBranchOfficeName: null,
      };
    }

    // Buscar la sucursal principal
    const primaryBranch = branchOfficeName
      ? branchOffices.find((b: BranchOffice) => b.name.toLowerCase() === branchOfficeName.toLowerCase())
      : null;

    const primaryInstanceName = primaryBranch?.whatsapp_instance_name || null;
    const primaryIsConnected = primaryInstanceName 
      ? connectionStates[primaryInstanceName]?.isConnected || false 
      : false;

    // Buscar un fallback (otra sucursal con WhatsApp conectado)
    const fallbackBranch = branchesWithWhatsApp.find((b: BranchOffice) => {
      if (!b.whatsapp_instance_name) return false;
      if (b.id === primaryBranch?.id) return false; // No usar la misma sucursal
      return connectionStates[b.whatsapp_instance_name]?.isConnected || false;
    });

    const fallbackInstanceName = fallbackBranch?.whatsapp_instance_name || null;
    const fallbackBranchOfficeName = fallbackBranch?.name || null;
    const fallbackBranchOfficeId = fallbackBranch?.id || null;
    const hasFallback = !!fallbackInstanceName;

    // Determinar si necesitamos usar el fallback
    const needsFallback = !primaryInstanceName || !primaryIsConnected;
    const usingFallback = needsFallback && hasFallback;

    // Instancia efectiva a usar
    const effectiveInstanceName = usingFallback ? fallbackInstanceName : primaryInstanceName;
    const effectiveBranchOfficeName = usingFallback ? fallbackBranchOfficeName : (primaryBranch?.name || null);

    // Determinar el mensaje de error apropiado
    let errorMessage: string | null = null;
    if (!primaryBranch) {
      errorMessage = branchOfficeName ? `Sucursal "${branchOfficeName}" no encontrada` : 'No se ha especificado una sucursal';
    } else if (!primaryInstanceName) {
      errorMessage = `La sucursal "${primaryBranch.name}" no tiene WhatsApp configurado`;
    } else if (!primaryIsConnected && !hasFallback) {
      errorMessage = `La sucursal "${primaryBranch.name}" tiene WhatsApp desconectado y no hay alternativas disponibles`;
    }

    return {
      instanceName: primaryInstanceName,
      branchOfficeName: primaryBranch?.name || branchOfficeName,
      branchOfficeId: primaryBranch?.id || null,
      isLoading: false,
      hasInstance: !!primaryInstanceName,
      error: errorMessage,
      isConnected: primaryIsConnected,
      isCheckingConnection: false,
      fallbackInstanceName,
      fallbackBranchOfficeName,
      fallbackBranchOfficeId,
      hasFallback,
      usingFallback,
      effectiveInstanceName,
      effectiveBranchOfficeName,
    };
  }, [branchOffices, branchOfficeName, branchesWithWhatsApp, connectionStates, isLoading, isCheckingConnection, error]);

  return instanceInfo;
};

export default useWhatsAppInstance;
