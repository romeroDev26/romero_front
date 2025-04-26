// src/features/settings/components/users/PasswordResetForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { useMutation } from '@tanstack/react-query';

import { Button } from '../../../../components/common/Button';
import { Input } from '../../../../components/common/Input';
import { usersService, ResetPasswordData } from '../../../../services/users.service';

interface PasswordResetFormProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

const passwordResetSchema = z.object({
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña es demasiado larga'),
  confirm_password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
});

type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  userId,
  userName,
  onClose,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
  });

  // En un proyecto real, usarías esta mutación - Actualizada para React Query v5
  // const resetPassword = useMutation({
  //   mutationFn: (data: ResetPasswordData) => usersService.resetPassword(data),
  //   onSuccess: () => {
  //     toast.success('Contraseña actualizada correctamente');
  //     onClose();
  //   },
  //   onError: (error: any) => {
  //     toast.error(error.response?.data?.message || 'Error al actualizar contraseña');
  //   },
  // });

  const onSubmit = (data: PasswordResetFormData) => {
    // Simular el reseteo de contraseña
    console.log('Reseteando contraseña para usuario:', userId);
    console.log('Nueva contraseña:', data.password);
    
    // Simular success
    setTimeout(() => {
      toast.success('Contraseña actualizada correctamente');
      onClose();
    }, 1000);

    // En un proyecto real, usarías:
    // resetPassword.mutate({
    //   id: userId,
    //   password: data.password,
    //   confirm_password: data.confirm_password,
    // });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
      <div>
        <p className="text-gray-700 mb-4">
          Establecer nueva contraseña para: <strong>{userName}</strong>
        </p>
        
        <Input
          label="Nueva Contraseña *"
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
      </div>
      
      <div className="flex justify-end space-x-3">
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
          Actualizar Contraseña
        </Button>
      </div>
    </form>
  );
};