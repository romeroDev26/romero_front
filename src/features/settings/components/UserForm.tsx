// src/features/settings/components/UserForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';

import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { RoleSelector } from './users/RoleSelector';
import { User } from '../../../types';
import { usersService } from '../../../services/users.service';

const baseUserSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().min(3, 'Nombre completo es requerido'),
  role_id: z.number({
    required_error: 'Rol es requerido',
  }).min(1, 'Debe seleccionar un rol válido'),
  is_active: z.boolean(),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres').optional(),
  confirm_password: z.string().optional(),
});

type UserFormData = {
  email: string;
  full_name: string;
  role_id: number;
  is_active: boolean;
  password?: string;
  confirm_password?: string;
};

interface CreateUserData {
  email: string;
  full_name: string;
  role_id: number;
  is_active: boolean;
  password: string;
}

interface UpdateUserData {
  email: string;
  full_name: string;
  role_id: number;
  is_active: boolean;
  password?: string;
}

interface UserFormProps {
  initialData?: User;
  onClose: () => void;
  isCreate: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({ initialData, onClose, isCreate }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UserFormData>({
    resolver: zodResolver(baseUserSchema),
    defaultValues: {
      email: initialData?.email ?? '',
      full_name: initialData?.full_name ?? '',
      role_id: initialData?.role_id ?? initialData?.role?.id ?? 0,
      is_active: initialData?.is_active ?? true,
      password: '',
      confirm_password: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const roleId = watch('role_id');

  const handleRoleChange = React.useCallback((value: number) => {
    setValue('role_id', value, { shouldValidate: true });
  }, [setValue]);

  const onSubmit = handleSubmit(async (formData: UserFormData) => {
    setIsSubmitting(true);
    
    try {
      if (isCreate) {
        if (!formData.password) {
          toast.error('La contraseña es requerida para crear un usuario');
          setIsSubmitting(false);
          return;
        }
        
        const createData: CreateUserData = {
          email: formData.email,
          full_name: formData.full_name,
          role_id: formData.role_id,
          is_active: formData.is_active,
          password: formData.password
        };
        
        await usersService.create(createData);
        toast.success('Usuario creado correctamente');
      } else if (initialData?.id) {
        const updateData: UpdateUserData = {
          email: formData.email,
          full_name: formData.full_name,
          role_id: formData.role_id,
          is_active: formData.is_active,
          ...(formData.password ? { password: formData.password } : {})
        };
        
        await usersService.update(initialData.id, updateData);
        toast.success('Usuario actualizado correctamente');
      }
      
      onClose();
    } catch (error) {
      toast.error('Ocurrió un error al guardar el usuario');
    } finally {
      setIsSubmitting(false);
    }
  });
  
  return (
    <form onSubmit={onSubmit} className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email */}
        <Input
          label="Email *"
          type="email"
          error={errors.email?.message}
          {...register('email')}
        />
        
        {/* Nombre Completo */}
        <Input
          label="Nombre Completo *"
          type="text"
          error={errors.full_name?.message}
          {...register('full_name')}
        />
        
        {/* Rol */}
        <div>
          <RoleSelector
            value={roleId}
            onChange={handleRoleChange}
            error={errors.role_id?.message}
          />
        </div>
        
        {/* Estado */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_active"
            className="rounded border-gray-300 text-primary focus:ring-primary"
            {...register('is_active')}
          />
          <label htmlFor="is_active" className="text-sm text-gray-700">
            Usuario Activo
          </label>
        </div>
        
        {/* Contraseña (solo en creación) */}
        {isCreate && (
          <>
            <Input
              label="Contraseña *"
              type="password"
              error={errors.password?.message}
              {...register('password')}
            />
            
            <Input
              label="Confirmar Contraseña *"
              type="password"
              error={errors.confirm_password?.message}
              {...register('confirm_password')}
            />
          </>
        )}
      </div>
      
      <div className="mt-8 flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
        >
          {isCreate ? 'Crear Usuario' : 'Actualizar Usuario'}
        </Button>
      </div>
    </form>
  );
};