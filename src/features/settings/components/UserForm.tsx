// src/features/settings/components/UserForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { RoleSelector } from './users/RoleSelector';
import { User } from '../../../types';
import { usersService } from '../../../services/users.service';

// Schema base para usuarios
const baseUserSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().min(3, 'Nombre completo es requerido'),
  role_id: z.number({
    required_error: 'Rol es requerido',
  }).min(1, 'Debe seleccionar un rol válido'),
  is_active: z.boolean().default(true),
});

// Schema para crear un usuario (password requerido)
const createUserSchema = baseUserSchema.extend({
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
});

// Schema para actualizar un usuario (password opcional)
const updateUserSchema = baseUserSchema.extend({
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres').optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
type UpdateUserFormData = z.infer<typeof updateUserSchema>;

interface UserFormProps {
  initialData?: User;
  onClose: () => void;
  isCreate: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({ initialData, onClose, isCreate }) => {
  const queryClient = useQueryClient();

  const formSchema = isCreate ? createUserSchema : updateUserSchema;

  // Valores iniciales para el formulario
  const defaultValues = {
    email: initialData?.email || '',
    full_name: initialData?.full_name || '',
    role_id: initialData?.role_id || 0,
    is_active: initialData?.is_active ?? true,
    password: '',
  };

  // Configuración del formulario
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    setValue,
    watch 
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  // Mutación para crear usuario
  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserFormData) => usersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario creado correctamente');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear usuario');
    }
  });

  // Mutación para actualizar usuario
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserFormData }) => 
      usersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario actualizado correctamente');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar usuario');
    }
  });

  // Manejar cambio de rol
  const roleId = watch('role_id');
  const handleRoleChange = (value: number) => {
    setValue('role_id', value, { shouldValidate: true });
  };

  // Manejar envío del formulario
  const onSubmit = (data: CreateUserFormData | UpdateUserFormData) => {
    if (isCreate) {
      createUserMutation.mutate(data as CreateUserFormData);
    } else if (initialData?.id) {
      // Si es actualización, eliminar password si está vacío
      const updateData = { ...data };
      if (!updateData.password) {
        delete (updateData as any).password;
      }
      updateUserMutation.mutate({ id: initialData.id, data: updateData as UpdateUserFormData });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6">
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
        
        {/* Contraseña (obligatoria en creación, opcional en edición) */}
        <Input
          label={isCreate ? "Contraseña *" : "Contraseña (Dejar en blanco para no cambiar)"}
          type="password"
          error={errors.password?.message}
          {...register('password')}
        />
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
          isLoading={isSubmitting || createUserMutation.isPending || updateUserMutation.isPending}
        >
          {isCreate ? 'Crear Usuario' : 'Actualizar Usuario'}
        </Button>
      </div>
    </form>
  );
};