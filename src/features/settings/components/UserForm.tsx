// src/features/settings/components/UserForm.tsx
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';

import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { RoleSelector } from './users/RoleSelector';
import { User } from '../../../types';
import { usersService } from '../../../services/users.service';

// Esquema base para ambos casos
const userSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().min(3, 'Nombre completo es requerido'),
  role_id: z.number({
    required_error: 'Rol es requerido',
  }).min(1, 'Debe seleccionar un rol válido'),
  is_active: z.boolean().default(true),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres').optional(),
  confirm_password: z.string().optional(),
})
.refine(data => (!data.password && !data.confirm_password) || (data.password === data.confirm_password), {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
});

interface UserFormProps {
  initialData?: User;
  onClose: () => void;
  isCreate: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({ initialData, onClose, isCreate }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      ...initialData,
      role_id: initialData?.role_id ?? initialData?.role?.id,
      is_active: initialData?.is_active ?? true,
      email: initialData?.email ?? '',
      full_name: initialData?.full_name ?? '',
    },
    mode: 'onChange',
  });
  
  const roleId = watch('role_id');
  
  const handleRoleChange = React.useCallback((value: number) => {
    setValue('role_id', value, { shouldValidate: true });
  }, [setValue]);
  
  const onSubmit: SubmitHandler<z.infer<typeof userSchema>> = (data) => {
    setIsSubmitting(true);
    
    // Verificar contraseñas si es creación
    if (isCreate && (!data.password || !data.confirm_password)) {
      toast.error('La contraseña es requerida para crear un usuario');
      setIsSubmitting(false);
      return;
    }
    
    // Simular el proceso de guardado
    setTimeout(() => {
      console.log('Datos del formulario:', data);
      
      if (isCreate) {
        // En un proyecto real, llamarías al servicio:
        // usersService.create({
        //   email: data.email,
        //   full_name: data.full_name,
        //   role_id: data.role_id,
        //   password: data.password!,
        //   is_active: data.is_active
        // });
        
        toast.success('Usuario creado correctamente');
      } else {
        // En un proyecto real, llamarías al servicio:
        // usersService.update(initialData!.id, {
        //   email: data.email,
        //   full_name: data.full_name,
        //   role_id: data.role_id,
        //   is_active: data.is_active
        // });
        
        toast.success('Usuario actualizado correctamente');
      }
      
      setIsSubmitting(false);
      onClose();
    }, 1000);
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