// src/features/settings/components/users/PasswordResetForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
  });

  const onSubmit = async (data: PasswordResetFormData) => {
    setIsSubmitting(true);
    
    try {
      await usersService.resetPassword({
        id: userId,
        password: data.password
      });
      
      toast.success('Contraseña actualizada correctamente');
      onClose();
    } catch (error: any) {
      console.error('Error al restablecer contraseña:', error);
      toast.error(error.response?.data?.detail || 'Error al actualizar contraseña');
    } finally {
      setIsSubmitting(false);
    }
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