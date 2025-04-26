// src/features/settings/pages/RolesPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { rolesService, CreateRoleData, UpdateRoleData } from '../../../services/roles.service';
import { Role } from '../../../types';

export const RolesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [roleNameError, setRoleNameError] = useState('');
  
  // En un proyecto real, estos datos vendrían de una API
  // const { data: roles, isLoading } = useQuery(['roles'], rolesService.getAll);
  
  // Datos simulados para el ejemplo
  const roles: Role[] = [
    { id: 1, name: 'admin', description: 'Administrador del Sistema' },
    { id: 2, name: 'sales', description: 'Personal de Ventas y Pasajes' },
    { id: 3, name: 'warehouse', description: 'Personal de Almacén/Recepción Carga' },
    { id: 4, name: 'dispatcher', description: 'Personal de Despacho/Encomiendas' },
    { id: 5, name: 'accountant', description: 'Contador' },
    { id: 6, name: 'driver', description: 'Conductor/Tripulante' }
  ];
  
  const isLoading = false;
  
  // En un proyecto real, usarías estas mutaciones
  // const createRoleMutation = useMutation(
  //   (data: CreateRoleData) => rolesService.create(data),
  //   {
  //     onSuccess: () => {
  //       queryClient.invalidateQueries(['roles']);
  //       toast.success('Rol creado correctamente');
  //       setIsCreateModalOpen(false);
  //       resetForm();
  //     },
  //     onError: (error: any) => {
  //       toast.error(error.response?.data?.message || 'Error al crear rol');
  //     }
  //   }
  // );
  
  // const updateRoleMutation = useMutation(
  //   ({ id, data }: { id: number; data: UpdateRoleData }) => rolesService.update(id, data),
  //   {
  //     onSuccess: () => {
  //       queryClient.invalidateQueries(['roles']);
  //       toast.success('Rol actualizado correctamente');
  //       setIsEditModalOpen(false);
  //       resetForm();
  //     },
  //     onError: (error: any) => {
  //       toast.error(error.response?.data?.message || 'Error al actualizar rol');
  //     }
  //   }
  // );
  
  // const deleteRoleMutation = useMutation(
  //   (id: number) => rolesService.delete(id),
  //   {
  //     onSuccess: () => {
  //       queryClient.invalidateQueries(['roles']);
  //       toast.success('Rol eliminado correctamente');
  //       setIsDeleteModalOpen(false);
  //     },
  //     onError: (error: any) => {
  //       toast.error(error.response?.data?.message || 'Error al eliminar rol');
  //     }
  //   }
  // );
  
  const resetForm = () => {
    setRoleName('');
    setRoleDescription('');
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
    setIsEditModalOpen(true);
  };
  
  const handleOpenDeleteModal = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteModalOpen(true);
  };
  
  const validateForm = (): boolean => {
    if (!roleName.trim()) {
      setRoleNameError('El nombre del rol es requerido');
      return false;
    }
    
    setRoleNameError('');
    return true;
  };
  
  const handleCreateRole = () => {
    if (!validateForm()) return;
    
    // Simulación para el ejemplo
    console.log('Creando rol:', { name: roleName, description: roleDescription });
    setTimeout(() => {
      toast.success('Rol creado correctamente');
      setIsCreateModalOpen(false);
      resetForm();
    }, 1000);
    
    // En un proyecto real, usarías:
    // createRoleMutation.mutate({ name: roleName, description: roleDescription });
  };
  
  const handleUpdateRole = () => {
    if (!validateForm() || !selectedRole) return;
    
    // Simulación para el ejemplo
    console.log('Actualizando rol:', { id: selectedRole.id, name: roleName, description: roleDescription });
    setTimeout(() => {
      toast.success('Rol actualizado correctamente');
      setIsEditModalOpen(false);
      resetForm();
    }, 1000);
    
    // En un proyecto real, usarías:
    // updateRoleMutation.mutate({ 
    //   id: selectedRole.id, 
    //   data: { name: roleName, description: roleDescription } 
    // });
  };
  
  const handleDeleteRole = () => {
    if (!selectedRole) return;
    
    // Simulación para el ejemplo
    console.log('Eliminando rol:', selectedRole.id);
    setTimeout(() => {
      toast.success('Rol eliminado correctamente');
      setIsDeleteModalOpen(false);
    }, 1000);
    
    // En un proyecto real, usarías:
    // deleteRoleMutation.mutate(selectedRole.id);
  };
  
  if (isLoading) return <Spinner />;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Roles del Sistema</h1>
        <Button
          onClick={handleOpenCreateModal}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Rol
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{role.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{role.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{role.description || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleOpenEditModal(role)}
                    className="text-primary hover:text-primary/80 mr-4"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleOpenDeleteModal(role)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
            
            {roles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No hay roles disponibles
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
            <Input
              label="Nombre del Rol *"
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              error={roleNameError}
              placeholder="ej. admin, vendedor, almacenero"
            />
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                className="block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                rows={3}
                placeholder="Descripción del rol y sus funciones"
              />
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
            <Input
              label="Nombre del Rol *"
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              error={roleNameError}
              placeholder="ej. admin, vendedor, almacenero"
            />
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                className="block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                rows={3}
                placeholder="Descripción del rol y sus funciones"
              />
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
        title="Confirmar Eliminación"
        maxWidth="sm"
      >
        <div className="p-6">
          <p className="mb-6">
            ¿Está seguro que desea eliminar el rol <strong>{selectedRole?.name}</strong>?
            Este cambio no se puede deshacer.
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
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};