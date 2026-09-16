// src/features/settings/pages/RolesPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { toast } from '@/utils/sileo-toast';

import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { rolesService, CreateRoleData, UpdateRoleData } from '../../../services/roles.service';
import { Role } from '../../../types';
import { usePermissions } from '../../../hooks/usePermissions';
import { asApiError, getErrorMessage } from '../../../utils/errorHandler';

export const RolesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [roleIsActive, setRoleIsActive] = useState(true);
  const [roleNameError, setRoleNameError] = useState('');
  
  const formatRoleName = (name: string): string => {
    return name.toLowerCase().trim().replace(/\s+/g, '_');
  };

  // Query para obtener todos los roles
  const { data: roles, isLoading, error } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesService.getAll(),
    retry: 1
  });
  
  // Mutación para crear rol
  const createRoleMutation = useMutation({
    mutationFn: (data: CreateRoleData) => rolesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Rol creado correctamente');
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      const apiError = asApiError(error);
      if (apiError.response?.status === 409) {
        setRoleNameError('Ya existe un rol con este nombre');
      } else {
        const message = getErrorMessage(error, 'Error al crear rol');
        toast.error(message);
      }
    }
  });
  
  // Mutación para actualizar rol
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoleData }) => 
      rolesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Rol actualizado correctamente');
      setIsEditModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      const apiError = asApiError(error);
      if (apiError.response?.status === 409) {
        setRoleNameError('Ya existe un rol con este nombre');
      } else {
        const message = getErrorMessage(error, 'Error al actualizar rol');
        toast.error(message);
      }
    }
  });
  
  // Mutación para desactivar rol
  const deleteRoleMutation = useMutation({
    mutationFn: (id: number) => rolesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Rol desactivado correctamente');
      setIsDeleteModalOpen(false);
    },
    onError: (error) => {
      const apiError = asApiError(error);
      if (apiError.response?.status === 409) {
        toast.error('No se puede desactivar el rol porque está asignado a usuarios activos');
      } else {
        const message = getErrorMessage(error, 'Error al desactivar rol');
        toast.error(message);
      }
    }
  });
  
  const resetForm = () => {
    setRoleName('');
    setRoleDescription('');
    setRoleIsActive(true);
    setRoleNameError('');
  };
  
  const handleOpenCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };
  
  const handleOpenEditModal = (role: Role) => {
    setSelectedRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setRoleIsActive(role.is_active ?? true);
    setIsEditModalOpen(true);
  };
  
  const handleOpenDeleteModal = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteModalOpen(true);
  };
  
  const validateForm = (): boolean => {
    setRoleNameError('');
    
    if (!roleName.trim()) {
      setRoleNameError('El nombre del rol es requerido');
      return false;
    }

    // Formatear el nombre automáticamente
    const formattedName = formatRoleName(roleName);
    setRoleName(formattedName);
    
    return true;
  };
  
  const handleCreateRole = () => {
    if (!validateForm()) return;
    
    createRoleMutation.mutate({ 
      name: formatRoleName(roleName), 
      description: roleDescription || undefined,
      is_active: roleIsActive 
    });
  };
  
  const handleUpdateRole = () => {
    if (!validateForm() || !selectedRole) return;
    
    updateRoleMutation.mutate({ 
      id: selectedRole.id, 
      data: { 
        name: formatRoleName(roleName), 
        description: roleDescription || undefined,
        is_active: roleIsActive 
      } 
    });
  };
  
  const handleDeleteRole = () => {
    if (!selectedRole) return;
    deleteRoleMutation.mutate(selectedRole.id);
  };
  
  if (isLoading) return <Spinner />;
  
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">Error al cargar los roles. Por favor, intente nuevamente.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-dm-bg-primary rounded-lg shadow-sm p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-2xl font-bold text-dm-text-primary">Roles del Sistema</h1>
          {hasPermission('settings', 'roles', 'admin') && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={handleOpenCreateModal}
                className="flex items-center justify-center w-full"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nuevo Rol
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Desktop Table */}
      <div className="hidden md:block bg-dm-bg-primary rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-dm-border-primary">
          <thead className="bg-dm-bg-secondary">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Nombre
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Descripción
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-dm-bg-primary divide-y divide-dm-border-primary">
            {roles?.map((role) => (
              <tr key={role.id} className="hover:bg-dm-bg-hover">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-dm-text-primary">{role.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-dm-text-primary">{role.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-dm-text-muted">{role.description || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    role.is_active ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                  }`}>
                    {role.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {hasPermission('settings', 'roles', 'admin') && (
                    <>
                      <button
                        onClick={() => handleOpenEditModal(role)}
                        className="text-primary hover:text-primary/80 mr-4"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(role)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200"
                        disabled={!role.is_active}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {(!roles || roles.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-dm-text-muted">
                  No hay roles disponibles
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {roles?.map((role) => (
          <div
            key={role.id}
            className="bg-dm-bg-primary rounded-xl shadow-sm border border-dm-border-primary p-4 transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-dm-bg-secondary flex items-center justify-center text-dm-text-muted shrink-0">
                  <UserGroupIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-dm-text-primary truncate">{role.name}</h3>
                  <p className="text-xs text-dm-text-muted truncate">{role.description || 'Sin descripción'}</p>
                </div>
              </div>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full shrink-0 self-center ${
                role.is_active ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
              }`}>
                {role.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            {hasPermission('settings', 'roles', 'admin') && (
              <div className="flex items-center justify-end gap-2 border-t border-dm-border-primary pt-3">
                <button
                  onClick={() => handleOpenEditModal(role)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <PencilIcon className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleOpenDeleteModal(role)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  disabled={!role.is_active}
                >
                  <TrashIcon className="h-4 w-4" />
                  Desactivar
                </button>
              </div>
            )}
          </div>
        ))}

        {(!roles || roles.length === 0) && (
          <div className="bg-dm-bg-primary rounded-xl shadow-sm border border-dm-border-primary py-14 text-center">
            <UserGroupIcon className="w-12 h-12 text-dm-text-muted mx-auto mb-4" />
            <p className="text-dm-text-muted">No hay roles disponibles</p>
          </div>
        )}
      </div>
      
      {/* Modal para crear rol */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nuevo Rol"
        maxWidth="md"
      >
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <Input
                label="Nombre del Rol *"
                type="text"
                value={roleName}
                onChange={(e) => {
                  setRoleName(e.target.value);
                  setRoleNameError('');
                }}
                error={roleNameError}
                placeholder="ej. admin, vendedor, almacenero"
              />
              <p className="mt-1 text-sm text-dm-text-muted">
                El nombre se convertirá automáticamente a minúsculas y los espacios se reemplazarán por guiones bajos (_)
              </p>
              {roleName && roleName !== formatRoleName(roleName) && (
                <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                  Se guardará como: {formatRoleName(roleName)}
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                Descripción
              </label>
              <textarea
                className="block w-full rounded-md border-dm-border-primary shadow-sm p-2 border"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                rows={3}
                placeholder="Descripción del rol y sus funciones"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active_create"
                checked={roleIsActive}
                onChange={(e) => setRoleIsActive(e.target.checked)}
                className="rounded border-dm-border-primary text-primary focus:ring-primary"
              />
              <label htmlFor="is_active_create" className="ml-2 text-sm text-dm-text-secondary">
                Rol Activo
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreateRole}
              isLoading={createRoleMutation.isPending}
            >
              Crear Rol
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Modal para editar rol */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Rol"
        maxWidth="md"
      >
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <Input
                label="Nombre del Rol *"
                type="text"
                value={roleName}
                onChange={(e) => {
                  setRoleName(e.target.value);
                  setRoleNameError('');
                }}
                error={roleNameError}
                placeholder="ej. admin, vendedor, almacenero"
              />
              <p className="mt-1 text-sm text-dm-text-muted">
                El nombre se convertirá automáticamente a minúsculas y los espacios se reemplazarán por guiones bajos (_)
              </p>
              {roleName && roleName !== formatRoleName(roleName) && (
                <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                  Se guardará como: {formatRoleName(roleName)}
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                Descripción
              </label>
              <textarea
                className="block w-full rounded-md border-dm-border-primary shadow-sm p-2 border"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                rows={3}
                placeholder="Descripción del rol y sus funciones"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active_edit"
                checked={roleIsActive}
                onChange={(e) => setRoleIsActive(e.target.checked)}
                className="rounded border-dm-border-primary text-primary focus:ring-primary"
              />
              <label htmlFor="is_active_edit" className="ml-2 text-sm text-dm-text-secondary">
                Rol Activo
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleUpdateRole}
              isLoading={updateRoleMutation.isPending}
            >
              Actualizar Rol
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Modal para confirmar eliminación */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Desactivación"
        maxWidth="sm"
      >
        <div className="p-6">
          <p className="mb-6">
            ¿Está seguro que desea desactivar el rol <strong>{selectedRole?.name}</strong>?
            Este rol no podrá ser asignado a nuevos usuarios.
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteRole}
              isLoading={deleteRoleMutation.isPending}
            >
              Desactivar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};