// src/features/settings/pages/CompanySettingsPage.tsx
import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { companiesService } from '../../../services/companies.service';
import { CompanyUpdate } from '../../../types';

// Asumimos que la empresa tiene ID 1 (ajusta según tu caso)
const COMPANY_ID = 1;

const companySchema = z.object({
  ruc: z.string().length(11, "RUC debe tener 11 dígitos"),
  business_name: z.string().min(3, "Razón social es requerida"),
  trade_name: z.string().optional(),
  address: z.string().min(5, "Dirección es requerida"),
  ubigeo: z.string().length(6, "Ubigeo debe tener 6 dígitos"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  sunat_username: z.string().min(3, "Usuario SOL es requerido"),
  detraccion_account: z.string().optional(),
  beta_mode: z.boolean(),
  is_active: z.boolean(),
  sunat_password_sol: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

export const CompanySettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const certificateInputRef = useRef<HTMLInputElement>(null);
  const [certificatePassword, setCertificatePassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  
  // Query para obtener empresa
  const { data: company, isLoading, error } = useQuery({
    queryKey: ['company', COMPANY_ID],
    queryFn: () => companiesService.getById(COMPANY_ID),
    retry: 1
  });
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      beta_mode: company?.beta_mode ?? true,
      is_active: company?.is_active ?? true,
      ...company
    },
    values: company ? {
      ruc: company.ruc,
      business_name: company.business_name,
      trade_name: company.trade_name || '',
      address: company.address,
      ubigeo: company.ubigeo,
      phone: company.phone || '',
      email: company.email || '',
      sunat_username: company.sunat_username,
      detraccion_account: company.detraccion_account || '',
      beta_mode: company.beta_mode,
      is_active: company.is_active,
      sunat_password_sol: ''
    } : undefined
  });
  
  // Mutación para actualizar empresa
  const mutation = useMutation({
    mutationFn: (data: CompanyUpdate) => companiesService.update(COMPANY_ID, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', COMPANY_ID] });
      toast.success('Información de empresa actualizada');
      setShowPasswordFields(false);
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        toast.error('El RUC ya está en uso');
      } else {
        toast.error(error.response?.data?.detail || 'Error al actualizar información de empresa');
      }
    }
  });

  // Subir logo
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB
        toast.error('El archivo es demasiado grande. Máximo 2MB');
        return;
      }
      
      try {
        const result = await companiesService.uploadLogo(COMPANY_ID, file);
        // Actualizar la URL del logo en el estado local
        queryClient.invalidateQueries({ queryKey: ['company', COMPANY_ID] });
        toast.success('Logo actualizado correctamente');
      } catch (error) {
        toast.error('Error al subir el logo');
      }
    }
  };

  // Subir certificado
  const handleCertificateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && certificatePassword) {
      try {
        await companiesService.uploadCertificate(COMPANY_ID, file, certificatePassword);
        toast.success('Certificado digital actualizado correctamente');
        setCertificatePassword('');
      } catch (error) {
        toast.error('Error al subir el certificado');
      }
    } else if (!certificatePassword) {
      toast.error('Debe ingresar la contraseña del certificado');
    }
  };
  
  const onSubmit = (data: CompanyFormData) => {
    const updateData: CompanyUpdate = {
      ...data,
      email: data.email || undefined,
      phone: data.phone || undefined,
      trade_name: data.trade_name || undefined,
      detraccion_account: data.detraccion_account || undefined,
      sunat_password_sol: data.sunat_password_sol || undefined,
    };
    
    // Si no se ingresó contraseña de SUNAT, no la enviamos
    if (!updateData.sunat_password_sol) {
      delete updateData.sunat_password_sol;
    }
    
    mutation.mutate(updateData);
  };
  
  if (isLoading) return <Spinner />;
  
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error al cargar información de la empresa</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Configuración de Empresa</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="RUC *"
              type="text"
              error={errors.ruc?.message}
              {...register('ruc')}
            />
            
            <Input
              label="Razón Social *"
              type="text"
              error={errors.business_name?.message}
              {...register('business_name')}
            />
            
            <Input
              label="Nombre Comercial"
              type="text"
              error={errors.trade_name?.message}
              {...register('trade_name')}
            />
            
            <Input
              label="Dirección *"
              type="text"
              error={errors.address?.message}
              {...register('address')}
            />
            
            <Input
              label="Ubigeo *"
              type="text"
              error={errors.ubigeo?.message}
              {...register('ubigeo')}
            />
            
            <Input
              label="Teléfono"
              type="text"
              error={errors.phone?.message}
              {...register('phone')}
            />
            
            <Input
              label="Email"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />
            
            <Input
              label="Cuenta de Detracción"
              type="text"
              error={errors.detraccion_account?.message}
              {...register('detraccion_account')}
            />
          </div>
          
          {/* Configuración SUNAT */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración SUNAT</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Usuario SOL *"
                type="text"
                error={errors.sunat_username?.message}
                {...register('sunat_username')}
              />
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="beta_mode"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  {...register('beta_mode')}
                />
                <label htmlFor="beta_mode" className="text-sm text-gray-700">
                  Modo Beta (Usar ambiente de pruebas de SUNAT)
                </label>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Contraseña SOL
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPasswordFields(!showPasswordFields)}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    {showPasswordFields ? 'Cancelar cambio' : 'Cambiar contraseña'}
                  </button>
                </div>
                {showPasswordFields && (
                  <Input
                    type="password"
                    placeholder="Nueva contraseña SOL"
                    error={errors.sunat_password_sol?.message}
                    {...register('sunat_password_sol')}
                  />
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  {...register('is_active')}
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Empresa Activa
                </label>
              </div>
            </div>
          </div>
          
          {/* Certificado Digital */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Certificado Digital</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certificado Digital
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    ref={certificateInputRef}
                    onChange={handleCertificateUpload}
                    accept=".pfx,.p12"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => certificateInputRef.current?.click()}
                  >
                    Seleccionar Certificado
                  </Button>
                  {company?.certificate_path && (
                    <span className="ml-3 text-sm text-gray-500">
                      Certificado cargado
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Formato .pfx o .p12
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña del Certificado
                </label>
                <input
                  type="password"
                  value={certificatePassword}
                  onChange={(e) => setCertificatePassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>
          
          {/* Logo de la empresa */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Logo de la Empresa</h3>
            
            <div className="flex items-center">
              <span className="inline-block h-20 w-20 rounded-md overflow-hidden bg-gray-100 mr-4">
                {company?.logo_url ? (
                  <img 
                    src={company.logo_url} 
                    alt="Logo" 
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-300 text-gray-500">
                    Logo
                  </div>
                )}
              </span>
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                className="hidden"
                accept="image/*"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
              >
                Cambiar Logo
              </Button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              PNG o JPG, máximo 2MB. Recomendado: 500x500px
            </p>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              isLoading={isSubmitting || mutation.isPending}
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};