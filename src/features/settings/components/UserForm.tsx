// src/features/settings/components/UserForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';

// Este servicio tendría que ser implementado
// import { usersService } from '../../../services/users.service';

const userSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().min(3, 'Nombre completo es requerido'),
  role_id: z.number({
    required_error: 'Rol es requerido',
  }),
  is_active: z.boolean().default(true),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres').optional(),
  confirm_password: z.string().optional(),
}).refine((data) => !data.password || data.password === data.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  initialData?: any;
  onClose: () => void;
  isCreate: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({ initialData, onClose, isCreate }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: initialData ? {
      ...initialData,
      role_id: initialData.role?.id,
    } : {
      is_active: true,
      role_id: 0,
    },
  });
  
  const onSubmit = (data: UserFormData) => {
    // En un proyecto real, llamarías a una API
    // if (isCreate) {
    //   usersService.create(data);
    // } else {
    //   usersService.update(initialData.id, data);
    // }
    console.log('Guardando usuario:', data);
    onClose();
  };
  
  // Datos simulados para los roles
  const roles = [
    { id: 1, name: 'admin', description: 'Administrador del Sistema' },
    { id: 2, name: 'sales', description: 'Personal de Ventas' },
    { id: 3, name: 'warehouse', description: 'Personal de Almacén' },
    { id: 4, name: 'accountant', description: 'Contador' },
  ];
  
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rol *
          </label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            {...register('role_id', { valueAsNumber: true })}
          >
            <option value={0}>Seleccione un rol</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.description}
              </option>
            ))}
          </select>
          {errors.role_id && (
            <p className="mt-1 text-sm text-red-600">{errors.role_id.message}</p>
          )}
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
        
        {/* Contraseña (solo en creación o reset) */}
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
