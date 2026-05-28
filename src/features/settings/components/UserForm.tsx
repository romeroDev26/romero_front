// src/features/settings/components/UserForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/utils/sileo-toast';

import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { RoleSelector } from './users/RoleSelector';
import { SupervisorSelector } from './users/SupervisorSelector';
import { User } from '../../../types';
import { usersService, CreateUserData, UpdateUserData } from '../../../services/users.service';

// Esquema de validación para creación de usuario
const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().min(3, 'Nombre completo es requerido'),
  role_id: z.number({
    required_error: 'Rol es requerido',
  }).min(1, 'Debe seleccionar un rol válido'),
  is_active: z.boolean().default(true),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
  confirm_password: z.string().min(6, 'Confirme su contraseña'),
}).refine(data => data.password === data.confirm_password, {
  message: "Las contraseñas no coinciden",
  path: ["confirm_password"],
});

// Esquema de validación para actualización de usuario
const updateUserSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().min(3, 'Nombre completo es requerido'),
  role_id: z.number({
    required_error: 'Rol es requerido',
  }).min(1, 'Debe seleccionar un rol válido'),
  is_active: z.boolean().default(true),
  supervisor_id: z.string().optional().nullable(),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres').optional().or(z.literal('')),
  confirm_password: z.string().optional().or(z.literal('')),
}).refine(data => !data.password || data.password === data.confirm_password, {
  message: "Las contraseñas no coinciden",
  path: ["confirm_password"],
});

type BaseUserFormData = {
  email: string;
  full_name: string;
  role_id: number;
  is_active: boolean;
};

type CreateUserFormData = BaseUserFormData & {
  password: string;
  confirm_password: string;
};

type UpdateUserFormData = BaseUserFormData & {
  supervisor_id?: string | null;
  password?: string;
  confirm_password?: string;
};

interface UserFormProps {
  initialData?: User;
  onClose: (shouldRefresh?: boolean) => void;
  isCreate: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({ initialData, onClose, isCreate }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    setValue, 
    watch 
  } = useForm<any>({
    // @ts-ignore - Resolver dinámico entre create y update schemas
    resolver: zodResolver(isCreate ? createUserSchema : updateUserSchema),
    defaultValues: {
      email: initialData?.email || '',
      full_name: initialData?.full_name || '',
      role_id: initialData?.role_id || 0,
      is_active: initialData?.is_active ?? true,
      supervisor_id: initialData?.supervisor_id || undefined,
      password: '',
      confirm_password: '',
    },
  });

  const roleId = watch('role_id');
  const supervisorId = watch('supervisor_id');

  const handleRoleChange = (value: number) => {
    setValue('role_id', value, { shouldValidate: true });
  };

  const handleSupervisorChange = (value: string | null) => {
    setValue('supervisor_id', value || undefined, { shouldValidate: true });
  };

  const onSubmit = async (formData: any) => {
    setIsSubmitting(true);
    
    try {
      if (isCreate) {
        // Crear nuevo usuario
        const createData: CreateUserData = {
          email: formData.email,
          full_name: formData.full_name,
          role_id: formData.role_id,
          is_active: formData.is_active,
          password: formData.password,
        };
        
        await usersService.create(createData);
        toast.success('Usuario creado correctamente');
        onClose(true);
      } else if (initialData?.id) {
        // Actualizar usuario existente usando PATCH
        const updateData: UpdateUserData = {
          email: formData.email,
          full_name: formData.full_name,
          role_id: formData.role_id,
          is_active: formData.is_active,
        };
        
        // Incluir supervisor_id (puede ser null para remover supervisor)
        if (formData.supervisor_id !== undefined) {
          updateData.supervisor_id = formData.supervisor_id || null;
        }
        
        // Incluir contraseña solo si fue proporcionada
        if (formData.password && formData.password.length > 0) {
          updateData.password = formData.password;
        }
        
        await usersService.update(initialData.id, updateData);
        toast.success('Usuario actualizado correctamente');
        onClose(true);
      }
    } catch (error: any) {
      console.error('Error al guardar usuario:', error);
      
      if (error.response?.status === 422) {
        // Error de validación
        const detail = error.response.data?.detail;
        if (Array.isArray(detail)) {
          const message = detail.map(err => err.msg).join(', ');
          toast.error(message);
        } else if (typeof detail === 'string') {
          toast.error(detail);
        } else {
          toast.error('Error de validación');
        }
      } else {
        toast.error(error.response?.data?.detail || 'Ocurrió un error al guardar el usuario');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6">
      {/* Información Básica */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-dm-text-secondary mb-4 pb-2 border-b border-dm-border-primary">
          Información Básica
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre Completo */}
          <Input
            label="Nombre Completo *"
            type="text"
            error={errors.full_name?.message as string | undefined}
            {...register('full_name')}
          />
          
          {/* Email */}
          <Input
            label="Email *"
            type="email"
            error={errors.email?.message as string | undefined}
            {...register('email')}
          />
        </div>
      </div>

      {/* Asignaciones y Permisos */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-dm-text-secondary mb-4 pb-2 border-b border-dm-border-primary">
          Asignaciones y Permisos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rol */}
          <div>
            <RoleSelector
              value={roleId}
              onChange={handleRoleChange}
              error={errors.role_id?.message as string | undefined}
            />
          </div>
          
          {/* Supervisor - Solo en modo edición */}
          {!isCreate && (
            <div>
              <SupervisorSelector
                value={supervisorId || undefined}
                onChange={handleSupervisorChange}
                error={errors.supervisor_id?.message as string | undefined}
                currentUserId={initialData?.id}
              />
            </div>
          )}
          
          {/* Estado - Ocupa toda la fila si es creación */}
          <div className={`flex items-center ${isCreate ? 'md:col-span-2' : ''}`}>
            <div className="flex items-center h-11 space-x-3 px-3 py-2 bg-dm-bg-secondary rounded-lg border border-dm-border-primary">
              <input
                type="checkbox"
                id="is_active"
                className="w-4 h-4 rounded border-dm-border-primary text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500"
                {...register('is_active')}
              />
              <label htmlFor="is_active" className="text-sm font-medium text-dm-text-secondary cursor-pointer select-none">
                Usuario Activo
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Seguridad */}
      {(isCreate || true) && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-dm-text-secondary mb-4 pb-2 border-b border-dm-border-primary">
            Seguridad
          </h3>
          {!isCreate && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Deje los campos en blanco para mantener la contraseña actual
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contraseña */}
            <Input
              label={isCreate ? "Contraseña *" : "Nueva Contraseña"}
              type="password"
              placeholder={isCreate ? "Mínimo 6 caracteres" : "Dejar en blanco si no desea cambiar"}
              error={errors.password?.message as string | undefined}
              {...register('password')}
            />
            
            {/* Confirmar Contraseña */}
            <Input
              label={isCreate ? "Confirmar Contraseña *" : "Confirmar Nueva Contraseña"}
              type="password"
              placeholder={isCreate ? "Repita la contraseña" : "Confirme la nueva contraseña"}
              error={errors.confirm_password?.message as string | undefined}
              {...register('confirm_password')}
            />
          </div>
        </div>
      )}
      
      {/* Botones de Acción */}
      <div className="mt-8 pt-6 border-t border-dm-border-primary flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => onClose()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isCreate ? 'Crear Usuario' : 'Actualizar Usuario'}
        </Button>
      </div>
    </form>
  );
};