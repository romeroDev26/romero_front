// src/features/settings/pages/CompanySettingsPage.tsx
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';

// Este servicio tendría que ser implementado
// import { settingsService } from '../../../services/settings.service';

const companySchema = z.object({
  ruc: z.string().length(11, "RUC debe tener 11 dígitos"),
  business_name: z.string().min(3, "Razón social es requerida"),
  trade_name: z.string().optional(),
  address: z.string().min(5, "Dirección es requerida"),
  ubigeo: z.string().length(6, "Ubigeo debe tener 6 dígitos"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  sunat_username: z.string().min(3, "Usuario SOL es requerido"),
  beta_mode: z.boolean().default(true),
});

type CompanyFormData = z.infer<typeof companySchema>;

export const CompanySettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  // En un proyecto real, estos datos vendrían de una API
  // const { data: company, isLoading, error } = useQuery(
  //   ['company'], 
  //   settingsService.getCompany
  // );
  
  // Datos simulados para el ejemplo
  const company = {
    id: 1,
    ruc: '20123456789',
    business_name: 'Transportes Romero S.A.C.',
    trade_name: 'Transportes Romero',
    address: 'Av. Principal 123, Iquitos',
    ubigeo: '160101',
    phone: '065-234567',
    email: 'administracion@transportesromero.com',
    logo_url: '',
    sunat_username: 'MODDATOS',
    beta_mode: true,
  };
  
  const isLoading = false;
  const error = null;
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: company,
  });
  
  // En un proyecto real, usarías una mutación para actualizar los datos
  // const mutation = useMutation(
  //   (data: CompanyFormData) => settingsService.updateCompany(company.id, data),
  //   {
  //     onSuccess: () => {
  //       queryClient.invalidateQueries(['company']);
  //       toast.success('Información de empresa actualizada');
  //     },
  //     onError: () => {
  //       toast.error('Error al actualizar información de empresa');
  //     }
  //   }
  // );
  
  const onSubmit = (data: CompanyFormData) => {
    // mutation.mutate(data);
    // Simulación para el ejemplo
    console.log('Datos a enviar:', data);
    toast.success('Información de empresa actualizada');
  };
  
  if (isLoading) return <Spinner />;
  if (error) return <div>Error al cargar información de la empresa</div>;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Configuración de Empresa</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* RUC */}
            <Input
              label="RUC *"
              type="text"
              error={errors.ruc?.message}
              {...register('ruc')}
            />
            
            {/* Razón Social */}
            <Input
              label="Razón Social *"
              type="text"
              error={errors.business_name?.message}
              {...register('business_name')}
            />
            
            {/* Nombre Comercial */}
            <Input
              label="Nombre Comercial"
              type="text"
              error={errors.trade_name?.message}
              {...register('trade_name')}
            />
            
            {/* Dirección */}
            <Input
              label="Dirección *"
              type="text"
              error={errors.address?.message}
              {...register('address')}
            />
            
            {/* Ubigeo */}
            <Input
              label="Ubigeo *"
              type="text"
              error={errors.ubigeo?.message}
              {...register('ubigeo')}
            />
            
            {/* Teléfono */}
            <Input
              label="Teléfono"
              type="text"
              error={errors.phone?.message}
              {...register('phone')}
            />
            
            {/* Email */}
            <Input
              label="Email"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />
            
            {/* Usuario SOL */}
            <Input
              label="Usuario SOL *"
              type="text"
              error={errors.sunat_username?.message}
              {...register('sunat_username')}
            />
            
            {/* Modo Beta */}
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
          </div>
          
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
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-medium
                      file:bg-primary file:text-white
                      hover:file:bg-primary/90"
                  />
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración Visual</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo de la Empresa
              </label>
              <div className="mt-1 flex items-center">
                <span className="inline-block h-12 w-12 rounded-md overflow-hidden bg-gray-100">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-300 text-gray-500">
                      Logo
                    </div>
                  )}
                </span>
                <input
                  type="file"
                  className="ml-5 block text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-primary file:text-white
                    hover:file:bg-primary/90"
                  accept="image/*"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                PNG o JPG, máximo 2MB
              </p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={isSubmitting}
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
