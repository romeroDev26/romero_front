import React, { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { companiesService } from '../../../services/companies.service';
import { CompanyUpdate } from '../../../types';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

// Asumimos que la empresa activa para la configuración tiene un ID conocido (ej. 1)
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
  sunat_password_sol: z.string().optional(),
  certificate_password: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

export const CompanySettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const certificateInputRef = useRef<HTMLInputElement>(null);

  const [showSunatPassword, setShowSunatPassword] = useState(false);
  const [showCertPassword, setShowCertPassword] = useState(false);

  const { data: company, isLoading, error } = useQuery({
    queryKey: ['company', COMPANY_ID],
    queryFn: () => companiesService.getById(COMPANY_ID),
    enabled: !!COMPANY_ID,
  });

  const { register, handleSubmit, formState: { errors }, reset, control, watch } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      ruc: '',
      business_name: '',
      trade_name: '',
      address: '',
      ubigeo: '',
      phone: '',
      email: '',
      sunat_username: '',
      detraccion_account: '',
      beta_mode: true,
      sunat_password_sol: '',
      certificate_password: '',
    }
  });

  const certificatePasswordForUpload = watch('certificate_password');

  useEffect(() => {
    if (company) {
      reset({
        ruc: company.ruc || '',
        business_name: company.business_name || '',
        trade_name: company.trade_name || '',
        address: company.address || '',
        ubigeo: company.ubigeo || '',
        phone: company.phone || '',
        email: company.email || '',
        sunat_username: company.sunat_username || '',
        detraccion_account: company.detraccion_account || '',
        beta_mode: company.beta_mode ?? true,
        sunat_password_sol: '',
        certificate_password: '',
      });
    }
  }, [company, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: CompanyUpdate) => companiesService.update(COMPANY_ID, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', COMPANY_ID] });
      toast.success('Información de la empresa actualizada exitosamente.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Error al actualizar la empresa.');
    }
  });

  const onSubmit = (data: CompanyFormData) => {
    const updateData: CompanyUpdate = { ...data };

    if (!updateData.sunat_password_sol) {
      delete updateData.sunat_password_sol;
    }

    if (!updateData.certificate_password) {
      delete updateData.certificate_password;
    }

    if (Object.keys(updateData).length > 0) {
      updateMutation.mutate(updateData);
    } else {
      toast.info("No hay cambios que guardar.");
    }
  };

  const handleFileUpload = async (
    file: File | undefined,
    uploadService: (id: number, file: File, password?: string) => Promise<any>,
    options: { password?: string, maxSizeMB?: number, successMsg: string, errorMsg: string }
  ) => {
    if (!file) return;

    if (options.maxSizeMB && file.size > options.maxSizeMB * 1024 * 1024) {
      toast.error(`El archivo es demasiado grande. Máximo ${options.maxSizeMB}MB.`);
      return;
    }

    try {
      if (uploadService === companiesService.uploadCertificate && !options.password) {
        toast.error('Se requiere la contraseña para subir el certificado.');
        return;
      }

      await uploadService(COMPANY_ID, file, options.password);
      toast.success(options.successMsg);
      queryClient.invalidateQueries({ queryKey: ['company', COMPANY_ID] });

    } catch (err) {
      toast.error(options.errorMsg);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
  if (error) return <div className="p-4 text-center text-red-600 bg-red-100 rounded-md">Error al cargar la información de la empresa. Por favor, intente de nuevo.</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración de Empresa</h1>
        <p className="mt-1 text-sm text-gray-600">Administra los datos fiscales y credenciales de tu compañía.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4"><h2 className="text-lg font-semibold text-gray-900">Datos Generales</h2></div>
          <div className="border-t border-gray-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="RUC *" {...register('ruc')} error={errors.ruc?.message} />
            <Input label="Razón Social *" {...register('business_name')} error={errors.business_name?.message} />
            <Input label="Nombre Comercial" {...register('trade_name')} error={errors.trade_name?.message} />
            <Input label="Dirección Fiscal *" {...register('address')} error={errors.address?.message} />
            <Input label="Ubigeo *" {...register('ubigeo')} error={errors.ubigeo?.message} />
            <Input label="Teléfono" {...register('phone')} error={errors.phone?.message} />
            <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
            <Input label="Cuenta de Detracción" {...register('detraccion_account')} error={errors.detraccion_account?.message} />
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4"><h2 className="text-lg font-semibold text-gray-900">Configuración SUNAT</h2></div>
          <div className="border-t border-gray-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Usuario SOL *" {...register('sunat_username')} error={errors.sunat_username?.message} />
            <div className="relative">
              <Input label="Contraseña SOL (si desea cambiar)" type={showSunatPassword ? 'text' : 'password'} {...register('sunat_password_sol')} error={errors.sunat_password_sol?.message} />
              <button
                type="button"
                onClick={() => setShowSunatPassword(!showSunatPassword)}
                className="absolute right-3 top-8 text-gray-500"
                tabIndex={-1}
              >
                {showSunatPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
            <div className="md:col-span-2 flex items-start space-x-3 pt-2">
              <Controller
                name="beta_mode"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="beta_mode"
                    checked={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-1"
                  />
                )}
              />
              <div><label htmlFor="beta_mode" className="font-medium text-gray-900">Modo Beta</label><p className="text-sm text-gray-500">Enviar comprobantes al ambiente de pruebas de SUNAT.</p></div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4"><h2 className="text-lg font-semibold text-gray-900">Archivos Digitales</h2></div>
          <div className="border-t border-gray-200 p-6 space-y-6">
            <div className="flex items-center gap-4">
              <img src={company?.logo_url || 'https://via.placeholder.com/80'} alt="Logo" className="h-20 w-20 rounded-md object-cover bg-gray-200" />
              <div>
                <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()}>Cambiar Logo</Button>
                <p className="mt-1 text-sm text-gray-500">PNG, JPG, máx 2MB.</p>
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e.target.files?.[0], companiesService.uploadLogo, { successMsg: 'Logo actualizado', errorMsg: 'Error al subir logo', maxSizeMB: 2 })} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div>
                <label className="block text-sm font-medium text-gray-700">Certificado Digital (.pfx)</label>
                <Button type="button" variant="outline" className="mt-1" onClick={() => certificateInputRef.current?.click()}>{company?.certificate_path ? 'Reemplazar' : 'Seleccionar'}</Button>
                <p className="mt-1 text-sm text-gray-500">{company?.certificate_path ? `Certificado cargado.` : 'No se ha cargado un certificado.'}</p>
                <input
                  type="file"
                  ref={certificateInputRef}
                  className="hidden"
                  accept=".pfx,.p12"
                  onChange={(e) => handleFileUpload(
                    e.target.files?.[0],
                    companiesService.uploadCertificate,
                    {
                      password: certificatePasswordForUpload,
                      successMsg: 'Certificado actualizado',
                      errorMsg: 'Error al subir certificado'
                    }
                  )}
                />
              </div>
              <div>
                <div className="relative">
                  <Input
                    label="Contraseña del Certificado"
                    type={showCertPassword ? 'text' : 'password'}
                    {...register('certificate_password')}
                    error={errors.certificate_password?.message}
                    placeholder="Ingrese para cambiar o para subir nuevo"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCertPassword(!showCertPassword)}
                    className="absolute right-3 top-8 text-gray-500"
                    tabIndex={-1}
                  >
                    {showCertPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" isLoading={updateMutation.isPending}>Guardar Cambios</Button>
        </div>
      </form>
    </div>
  );
};
