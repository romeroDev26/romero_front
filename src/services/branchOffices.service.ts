//src/services/branchOffices.service.ts
import api from '../config/api';
import { BranchOffice } from '../types';

// Interfaces para creación y actualización
export interface BranchOfficeCreateData {
  company_id: number;
  name: string;
  code?: string;
  port_id: number;
  address_line: string;
  phone?: string;
  email?: string;
  is_main_office?: boolean;
}

export interface BranchOfficeUpdateData {
  name?: string;
  code?: string;
  port_id?: number;
  address_line?: string;
  phone?: string;
  email?: string;
  is_main_office?: boolean;
  is_active?: boolean;
}

export const branchOfficesService = {
  getAllByCompany: async (companyId: number): Promise<BranchOffice[]> => {
    const response = await api.get<BranchOffice[]>(`/config/branch-offices/by-company/${companyId}`);
    return response.data;
  },

  create: async (data: BranchOfficeCreateData): Promise<BranchOffice> => {
    const response = await api.post<BranchOffice>('/config/branch-offices/', data);
    return response.data;
  },

  update: async (officeId: number, data: BranchOfficeUpdateData): Promise<BranchOffice> => {
    const response = await api.patch<BranchOffice>(`/config/branch-offices/${officeId}`, data);
    return response.data;
  },

  deactivate: async (officeId: number): Promise<BranchOffice> => {
    const response = await api.delete<BranchOffice>(`/config/branch-offices/${officeId}`);
    return response.data;
  },
};