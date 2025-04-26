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
    .max(100, 'La contraseña es demasiado larga')
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
    formState: { errors },
  } = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
  });

  // Mutación para restablecer contraseña
  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordData) => usersService.resetPassword(data),
    onSuccess: () => {
      toast.success('Contraseña actualizada correctamente');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar contraseña');
    },
  });

  const onSubmit = (data: PasswordResetFormData) => {
    resetPasswordMutation.mutate({
      id: userId,
      password: data.password,
    });
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
          isLoading={resetPasswordMutation.isPending}
        >
          Actualizar Contraseña
        </Button>
      </div>
    </form>
  );
};