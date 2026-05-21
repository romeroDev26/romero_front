import React, { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/utils/sileo-toast';
import { Spinner } from '../../../components/common/Spinner';
import { companiesService } from '../../../services/companies.service';
import { CompanyUpdate } from '../../../types';
import {
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon,
  KeyIcon,
  FolderOpenIcon,
  UserIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

const COMPANY_ID = 1;

const companySchema = z.object({
  ruc: z.string().length(11, 'RUC debe tener 11 dígitos'),
  business_name: z.string().min(3, 'Razón social es requerida'),
  trade_name: z.string().optional(),
  address: z.string().min(5, 'Dirección es requerida'),
  ubigeo: z.string().length(6, 'Ubigeo debe tener 6 dígitos'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  sunat_username: z.string().min(3, 'Usuario SOL es requerido'),
  detraccion_account: z.string().optional(),
  beta_mode: z.boolean(),
  sunat_password_sol: z.string().optional(),
  certificate_password: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

const fieldClass =
  'w-full rounded-[12px] border border-dm-border-primary bg-dm-bg-primary text-[14px] px-4 py-2.5 text-dm-text-primary placeholder:text-dm-text-muted focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-colors';

const labelClass = 'text-[11px] font-semibold text-dm-text-muted uppercase tracking-wider';

export const CompanySettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const certificateInputRef = useRef<HTMLInputElement>(null);

  const [showSunatPassword, setShowSunatPassword] = useState(false);
  const [showCertPassword, setShowCertPassword] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [company, setCompany] = useState<any>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ['company', COMPANY_ID],
    queryFn: () => companiesService.getById(COMPANY_ID),
    enabled: !!COMPANY_ID,
  });

  useEffect(() => {
    if (data) setCompany(data);
  }, [data]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
    getValues,
  } = useForm<CompanyFormData>({
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
    },
  });

  const handleFileUpload = async (
    file: File | undefined,
    uploadService: (id: number, file: File, password?: string) => Promise<any>,
    options: { password?: string; maxSizeMB?: number; successMsg: string; errorMsg: string }
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
    },
  });

  const onSubmit = (data: CompanyFormData) => {
    const updateData: CompanyUpdate = { ...data };
    if (!updateData.sunat_password_sol) delete updateData.sunat_password_sol;
    if (!updateData.certificate_password) delete updateData.certificate_password;
    if (Object.keys(updateData).length > 0) {
      updateMutation.mutate(updateData);
    } else {
      toast.info('No hay cambios que guardar.');
    }
  };

  const handleLogoUpload = async (file: File | undefined) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'svg', 'webp'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const isValidByType = allowedTypes.includes(file.type);
    const isValidByExtension = allowedExtensions.includes(fileExtension);

    if (!isValidByType && !isValidByExtension) {
      toast.error('Solo se permiten archivos JPG, PNG, SVG o WEBP');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('El archivo no puede ser mayor a 2MB');
      return;
    }
    try {
      setIsUploadingLogo(true);
      const result = await companiesService.uploadLogo(COMPANY_ID, file, { ...getValues() });
      setCompany((prev: any) => (prev ? { ...prev, logo_url: result.logo_url } : prev));
      toast.success('Logo actualizado');
      queryClient.invalidateQueries({ queryKey: ['company', COMPANY_ID] });
    } catch (err) {
      toast.error('Error al subir logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" color="text-[#1F4690]" />
        <p className="text-[13px] text-dm-text-muted">Cargando configuración...</p>
      </div>
    );

  if (error)
    return (
      <div className="rounded-[12px] border border-red-200 bg-red-50 dark:bg-red-950/30/40 p-5 text-center">
        <p className="text-[13px] text-red-700 dark:text-red-300">Error al cargar la información de la empresa.</p>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Page header */}
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-[8px] bg-[#1F4690]/10">
            <BuildingOfficeIcon className="w-5 h-5 text-[#1F4690]" />
          </div>
          <h1 className="text-[22px] font-semibold text-dm-text-primary tracking-tight">
            Configuración de empresa
          </h1>
        </div>
        <p className="text-[14px] text-dm-text-muted">
          Administre la identidad y credenciales de su organización
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Datos Generales ── */}
        <section className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary overflow-hidden">
          <div className="px-6 py-4 border-b border-dm-border-primary flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[6px] bg-dm-bg-secondary flex items-center justify-center">
              <InformationCircleIcon className="h-4 w-4 text-[#1F4690]" />
            </div>
            <h2 className="text-[15px] font-semibold text-dm-text-primary">Datos generales</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className={labelClass}>RUC *</label>
              <input className={fieldClass} {...register('ruc')} />
              {errors.ruc && <p className="text-[12px] text-red-600 dark:text-red-400">{errors.ruc.message}</p>}
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <label className={labelClass}>Razón social *</label>
              <input className={fieldClass} {...register('business_name')} />
              {errors.business_name && (
                <p className="text-[12px] text-red-600 dark:text-red-400">{errors.business_name.message}</p>
              )}
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <label className={labelClass}>Nombre comercial</label>
              <input className={fieldClass} {...register('trade_name')} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Teléfono</label>
              <input className={fieldClass} {...register('phone')} />
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <label className={labelClass}>Dirección fiscal *</label>
              <input className={fieldClass} {...register('address')} />
              {errors.address && (
                <p className="text-[12px] text-red-600 dark:text-red-400">{errors.address.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Ubigeo *</label>
              <input className={fieldClass} {...register('ubigeo')} />
              {errors.ubigeo && <p className="text-[12px] text-red-600 dark:text-red-400">{errors.ubigeo.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Email</label>
              <input type="email" className={fieldClass} {...register('email')} />
              {errors.email && <p className="text-[12px] text-red-600 dark:text-red-400">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <label className={labelClass}>Cuenta de detracción</label>
              <input className={fieldClass} {...register('detraccion_account')} />
            </div>
          </div>
        </section>

        {/* ── Two-column row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuración SUNAT */}
          <section className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-dm-border-primary flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[6px] bg-dm-bg-secondary flex items-center justify-center">
                  <KeyIcon className="h-4 w-4 text-[#1F4690]" />
                </div>
                <h2 className="text-[15px] font-semibold text-dm-text-primary">Configuración SUNAT</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-dm-text-muted">Modo beta</span>
                <Controller
                  name="beta_mode"
                  control={control}
                  render={({ field }) => (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        ref={field.ref}
                      />
                      <div className="w-9 h-5 bg-[#e8e8e8] rounded-full peer relative peer-checked:bg-[#1F4690] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-dm-bg-primary after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                  )}
                />
              </div>
            </div>
            <div className="p-6 space-y-4 flex-1">
              <div className="space-y-1.5">
                <label className={labelClass}>Usuario SOL *</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-dm-text-muted" />
                  <input className={`${fieldClass} pl-10`} {...register('sunat_username')} />
                </div>
                {errors.sunat_username && (
                  <p className="text-[12px] text-red-600 dark:text-red-400">{errors.sunat_username.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Contraseña SOL (dejar en blanco para no cambiar)</label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-dm-text-muted" />
                  <input
                    type={showSunatPassword ? 'text' : 'password'}
                    className={`${fieldClass} pl-10 pr-10`}
                    {...register('sunat_password_sol')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSunatPassword(!showSunatPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dm-text-muted hover:text-dm-text-primary transition-colors"
                    tabIndex={-1}
                  >
                    {showSunatPassword ? (
                      <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="p-3.5 rounded-[8px] border border-[#1F4690]/10 bg-[#1F4690]/[0.02]">
                <p className="text-[11px] leading-relaxed text-dm-text-secondary">
                  <span className="font-semibold text-[#1F4690] uppercase">Importante:</span>{' '}
                  Estas credenciales son necesarias para la emisión de comprobantes electrónicos a
                  través del sistema OSE/PSE.
                </p>
              </div>
            </div>
          </section>

          {/* Archivos Digitales */}
          <section className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-dm-border-primary flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[6px] bg-dm-bg-secondary flex items-center justify-center">
                <FolderOpenIcon className="h-4 w-4 text-[#1F4690]" />
              </div>
              <h2 className="text-[15px] font-semibold text-dm-text-primary">Archivos digitales</h2>
            </div>
            <div className="p-6 space-y-6 flex-1">
              {/* Logo */}
              <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 shrink-0 bg-dm-bg-secondary rounded-[12px] border-2 border-dashed border-dm-border-primary flex items-center justify-center overflow-hidden">
                  {company?.logo_url ? (
                    <img src={company.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <div className="bg-[#1F4690]/10 p-2 rounded-full">
                      <PhotoIcon className="h-8 w-8 text-[#1F4690]" />
                    </div>
                  )}
                  {isUploadingLogo && (
                    <div className="absolute inset-0 bg-dm-bg-primary/80 flex items-center justify-center">
                      <Spinner size="sm" />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <p className="text-[13px] font-semibold text-dm-text-primary">Logo de la empresa</p>
                  <p className="text-[11px] text-dm-text-muted">
                    Recomendado: SVG, PNG o WEBP (400×400 px)
                  </p>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="text-[11px] font-medium text-[#1F4690] bg-[#1F4690]/5 hover:bg-[#1F4690]/10 px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"
                  >
                    {isUploadingLogo ? 'Subiendo logo...' : 'Cambiar logo'}
                  </button>
                  <input
                    type="file"
                    ref={logoInputRef}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.svg,.webp,image/jpeg,image/png,image/svg+xml,image/webp"
                    onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                  />
                </div>
              </div>

              <div className="border-t border-dm-border-primary" />

              {/* Certificate */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                      <ShieldCheckIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-dm-text-primary">Certificado digital</p>
                      <p className="text-[11px] text-dm-text-muted">
                        {company?.certificate_path
                          ? 'Certificado cargado'
                          : 'No se ha cargado un certificado'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => certificateInputRef.current?.click()}
                    className="text-[11px] font-medium text-[#1F4690] hover:underline"
                  >
                    {company?.certificate_path ? 'Reemplazar' : 'Seleccionar'}
                  </button>
                  <input
                    type="file"
                    ref={certificateInputRef}
                    className="hidden"
                    accept=".pfx,.p12"
                    onChange={(e) =>
                      handleFileUpload(
                        e.target.files?.[0],
                        companiesService.uploadCertificate,
                        {
                          password: certificatePasswordForUpload,
                          successMsg: 'Certificado actualizado',
                          errorMsg: 'Error al subir certificado',
                        }
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Password del certificado</label>
                  <div className="relative">
                    <input
                      type={showCertPassword ? 'text' : 'password'}
                      className={`${fieldClass} pr-10`}
                      placeholder="Ingrese para cambiar o para subir nuevo"
                      {...register('certificate_password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCertPassword(!showCertPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dm-text-muted hover:text-dm-text-primary transition-colors"
                      tabIndex={-1}
                    >
                      {showCertPassword ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── Save button ── */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 bg-[#1F4690] text-white px-8 py-3 rounded-full text-[13px] font-medium hover:bg-[#16377a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? (
              <Spinner size="sm" color="text-white" />
            ) : (
              <ArrowDownTrayIcon className="h-4 w-4" />
            )}
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
};
