// src/features/settings/components/users/PasswordResetForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/utils/sileo-toast';

import { Button } from '../../../../components/common/Button';
import { Input } from '../../../../components/common/Input';
import { usersService } from '../../../../services/users.service';
import { asApiError, detailToString } from '../../../../utils/errorHandler';

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
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
  });

  const onSubmit = async (data: PasswordResetFormData) => {
    setIsSubmitting(true);
    setApiError(null);
    
    try {
      // Usamos el método update con PATCH para actualizar la contraseña
      await usersService.update(userId, {
        password: data.password
      });
      
      toast.success('Contraseña actualizada exitosamente');
      onClose();
    } catch (error) {
      const apiError = asApiError(error);
      console.error('Error al restablecer contraseña:', error);
      
      if (apiError.response) {
        if (apiError.response.status === 404) {
          setApiError('Usuario no encontrado');
          toast.error('Usuario no encontrado');
        } else if (apiError.response.status === 403) {
          setApiError('No tienes permiso para realizar esta acción');
          toast.error('No tienes permiso para realizar esta acción');
        } else if (apiError.response.status === 422) {
          // Error de validación
          const detail = detailToString(apiError.response.data?.detail);
          if (Array.isArray(detail)) {
            const message = detail.map(err => err.msg).join(', ');
            setApiError(message);
            toast.error(message);
          } else if (typeof detail === 'string') {
            setApiError(detail);
            toast.error(detail);
          } else {
            setApiError('Error de validación');
            toast.error('Error de validación');
          }
        } else if (detailToString(apiError.response.data?.detail)) {
          const detail = detailToString(apiError.response.data?.detail) ?? '';
          setApiError(detail);
          toast.error(detail);
        } else {
          setApiError('Error al actualizar la contraseña');
          toast.error('Error al actualizar la contraseña');
        }
      } else {
        setApiError('Error de conexión. Verifica tu conexión a internet.');
        toast.error('Error de conexión');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
      <div>
        <p className="text-dm-text-secondary mb-4">
          Establecer nueva contraseña para: <strong>{userName}</strong>
        </p>
        
        {apiError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-300 text-red-700 dark:text-red-300 rounded">
            {apiError}
          </div>
        )}
        
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