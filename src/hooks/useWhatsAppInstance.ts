// src/hooks/useWhatsAppInstance.ts
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { branchOfficesService } from '../services/branchOffices.service';
import { authService } from '../services/auth.service';
import { BranchOffice } from '../types';

interface WhatsAppInstanceInfo {
  instanceName: string | null;
  branchOfficeName: string | null;
  branchOfficeId: number | null;
  isLoading: boolean;
  hasInstance: boolean;
  error: string | null;
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

export default useWhatsAppInstance;
