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
} from '@heroicons/react/24/outline';

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

const fieldClass =
  'w-full rounded-lg border border-slate-200 bg-slate-50 text-sm px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors';

const labelClass = 'text-xs font-bold text-slate-500 uppercase tracking-wider';

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

  const { register, handleSubmit, formState: { errors }, reset, control, watch, getValues } = useForm<CompanyFormData>({
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
    }
  });

  const onSubmit = (data: CompanyFormData) => {
    const updateData: CompanyUpdate = { ...data };
    if (!updateData.sunat_password_sol) delete updateData.sunat_password_sol;
    if (!updateData.certificate_password) delete updateData.certificate_password;
    if (Object.keys(updateData).length > 0) {
      updateMutation.mutate(updateData);
    } else {
      toast.info("No hay cambios que guardar.");
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
      setCompany((prev: any) => prev ? { ...prev, logo_url: result.logo_url } : prev);
      toast.success('Logo actualizado');
      queryClient.invalidateQueries({ queryKey: ['company', COMPANY_ID] });
    } catch (err) {
      toast.error('Error al subir logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  if (error) return <div className="p-4 text-center text-red-600 bg-red-100 rounded-md">Error al cargar la información de la empresa.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración de Empresa</h1>
        <p className="text-xs text-slate-500 mt-1">Administre la identidad y credenciales de su organización</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* ── Datos Generales ── */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <InformationCircleIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Datos Generales</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className={labelClass}>RUC *</label>
              <input className={fieldClass} {...register('ruc')} />
              {errors.ruc && <p className="text-xs text-red-500">{errors.ruc.message}</p>}
            </div>
            <div className="space-y-1 lg:col-span-2">
              <label className={labelClass}>Razón Social *</label>
              <input className={fieldClass} {...register('business_name')} />
              {errors.business_name && <p className="text-xs text-red-500">{errors.business_name.message}</p>}
            </div>
            <div className="space-y-1 lg:col-span-2">
              <label className={labelClass}>Nombre Comercial</label>
              <input className={fieldClass} {...register('trade_name')} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Teléfono</label>
              <input className={fieldClass} {...register('phone')} />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <label className={labelClass}>Dirección Fiscal *</label>
              <input className={fieldClass} {...register('address')} />
              {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Ubigeo *</label>
              <input className={fieldClass} {...register('ubigeo')} />
              {errors.ubigeo && <p className="text-xs text-red-500">{errors.ubigeo.message}</p>}
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Email</label>
              <input type="email" className={fieldClass} {...register('email')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-1 lg:col-span-2">
              <label className={labelClass}>Cuenta de Detracción</label>
              <input className={fieldClass} {...register('detraccion_account')} />
            </div>
          </div>
        </section>

        {/* ── Two-column row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuración SUNAT */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyIcon className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Configuración SUNAT</h2>
              </div>
              {/* Toggle switch for beta_mode */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Modo Beta</span>
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
                      <div className="w-9 h-5 bg-slate-200 rounded-full peer relative peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
                    </label>
                  )}
                />
              </div>
            </div>
            <div className="p-6 space-y-4 flex-1">
              <div className="space-y-1">
                <label className={labelClass}>Usuario SOL *</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input className={`${fieldClass} pl-9`} {...register('sunat_username')} />
                </div>
                {errors.sunat_username && <p className="text-xs text-red-500">{errors.sunat_username.message}</p>}
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Contraseña SOL (dejar en blanco para no cambiar)</label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showSunatPassword ? 'text' : 'password'}
                    className={`${fieldClass} pl-9 pr-9`}
                    {...register('sunat_password_sol')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSunatPassword(!showSunatPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showSunatPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-[10px] leading-relaxed text-slate-600">
                  <span className="font-bold text-primary uppercase">Importante:</span> Estas credenciales son necesarias para la emisión de comprobantes electrónicos a través del sistema OSE/PSE.
                </p>
              </div>
            </div>
          </section>

          {/* Archivos Digitales */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <FolderOpenIcon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Archivos Digitales</h2>
            </div>
            <div className="p-6 space-y-6 flex-1">
              {/* Logo */}
              <div className="flex items-center gap-6">
                <div className="relative w-20 h-20 shrink-0 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                  {company?.logo_url ? (
                    <img src={company.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <div className="bg-primary/20 p-2 rounded-full">
                      <PhotoIcon className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  {isUploadingLogo && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Spinner size="sm" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold">Logo de la Empresa</p>
                  <p className="text-xs text-slate-500">Recomendado: SVG, PNG o WEBP (400×400 px)</p>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="text-xs bg-white border border-slate-300 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isUploadingLogo ? 'Subiendo logo...' : 'Cambiar Logo'}
                  </button>
                  <input
                    type="file"
                    ref={logoInputRef}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.svg,.webp,image/jpeg,image/png,image/svg+xml,image/webp"
                    onChange={e => handleLogoUpload(e.target.files?.[0])}
                  />
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Certificate */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Certificado Digital</p>
                      <p className="text-[10px] text-slate-500">
                        {company?.certificate_path ? 'Certificado cargado' : 'No se ha cargado un certificado'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => certificateInputRef.current?.click()}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    {company?.certificate_path ? 'Reemplazar' : 'Seleccionar'}
                  </button>
                  <input
                    type="file"
                    ref={certificateInputRef}
                    className="hidden"
                    accept=".pfx,.p12"
                    onChange={e => handleFileUpload(
                      e.target.files?.[0],
                      companiesService.uploadCertificate,
                      { password: certificatePasswordForUpload, successMsg: 'Certificado actualizado', errorMsg: 'Error al subir certificado' }
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Password del Certificado</label>
                  <div className="relative">
                    <input
                      type={showCertPassword ? 'text' : 'password'}
                      className={`${fieldClass} pr-9`}
                      placeholder="Ingrese para cambiar o para subir nuevo"
                      {...register('certificate_password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCertPassword(!showCertPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showCertPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── Save button ── */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
          >
            {updateMutation.isPending ? (
              <Spinner size="sm" />
            ) : (
              <ArrowDownTrayIcon className="h-5 w-5" />
            )}
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
};
