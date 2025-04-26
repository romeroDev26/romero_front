// src/features/settings/pages/UsersPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PencilIcon, TrashIcon, PlusIcon, KeyIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { UserForm } from '../components/UserForm';
import { UserFilters } from '../components/users/UserFilters';
import { PasswordResetForm } from '../components/users/PasswordResetForm';
import { usersService } from '../../../services/users.service';
import { User } from '../../../types';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Fetch de usuarios
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: usersService.getAll,
  });
  
  // Mutación para cambiar el estado del usuario
  const toggleUserStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => {
      return usersService.toggleActiveStatus(id, isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Estado del usuario actualizado correctamente');
    },
    onError: (error: any) => {
      toast.error('Error al actualizar el estado del usuario');
      console.error('Error:', error);
    }
  });
  
  // Mutación para eliminar un usuario
  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => {
      return usersService.toggleActiveStatus(id, false); // No hay endpoint para eliminar, solo desactivamos
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario eliminado correctamente');
      setIsDeleteModalOpen(false);
    },
    onError: (error: any) => {
      toast.error('Error al eliminar el usuario');
      console.error('Error:', error);
    }
  });

  // Filtrar usuarios según criterios
  let filteredUsers = users;
  
  // Filtrar por rol
  if (roleFilter !== 'ALL') {
    filteredUsers = filteredUsers.filter(user => user.role_id === roleFilter);
  }
  
  // Filtrar por estado
  if (statusFilter !== 'ALL') {
    filteredUsers = filteredUsers.filter(
      user => statusFilter === 'ACTIVE' ? user.is_active : !user.is_active
    );
  }
  
  // Filtrar por búsqueda
  if (searchTerm) {
    filteredUsers = filteredUsers.filter(user => 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  const handleCreateUser = () => {
    setIsCreateModalOpen(true);
  };
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };
  
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };
  
  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setIsResetPasswordModalOpen(true);
  };
  
  const handleToggleUserStatus = (user: User) => {
    toggleUserStatusMutation.mutate({ id: user.id, isActive: !user.is_active });
  };
  
  const confirmDeleteUser = () => {
    if (!selectedUser) return;
    deleteUserMutation.mutate(selectedUser.id);
  };
  
  if (isLoading) return <Spinner />;
  
  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">Error al cargar usuarios</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}>
          Reintentar
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios del Sistema</h1>
        <div className="flex space-x-2">
          <Button
            onClick={handleCreateUser}
            className="flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>
      
      {/* Filtros */}
      <UserFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        showAdvancedFilters={showAdvancedFilters}
        setShowAdvancedFilters={setShowAdvancedFilters}
      />
      
      {/* Tabla de usuarios */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{user.full_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {user.role?.name || 'Sin rol'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`h-2.5 w-2.5 rounded-full mr-2 ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <button
                      onClick={() => handleToggleUserStatus(user)}
                      className={`text-sm ${user.is_active ? 'text-green-800 hover:text-green-900' : 'text-red-800 hover:text-red-900'}`}
                    >
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleResetPassword(user)}
                    className="text-gray-600 hover:text-gray-900 mr-3"
                    title="Cambiar contraseña"
                  >
                    <KeyIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleEditUser(user)}
                    className="text-primary hover:text-primary/80 mr-3"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
            
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No se encontraron usuarios
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Modal para crear usuario */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nuevo Usuario"
        maxWidth="lg"
      >
        <UserForm 
          onClose={() => setIsCreateModalOpen(false)} 
          isCreate={true}
        />
      </Modal>
      
      {/* Modal para editar usuario */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Usuario"
        maxWidth="lg"
      >
        <UserForm 
          initialData={selectedUser || undefined}
          onClose={() => setIsEditModalOpen(false)}
          isCreate={false}
        />
      </Modal>
      
      {/* Modal para confirmar eliminación */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
      >
        <div className="p-6">
          <p className="mb-4">
            ¿Está seguro que desea eliminar al usuario <strong>{selectedUser?.full_name}</strong>?
          </p>
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteUser}
              isLoading={deleteUserMutation.isPending}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Modal para resetear contraseña */}
      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title="Cambiar Contraseña"
      >
        {selectedUser && (
          <PasswordResetForm
            userId={selectedUser.id}
            userName={selectedUser.full_name}
            onClose={() => setIsResetPasswordModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
};