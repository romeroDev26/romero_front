// src/features/settings/pages/UsersPage.tsx
import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from '@/utils/sileo-toast';
import { PencilIcon, TrashIcon, PlusIcon, KeyIcon } from '@heroicons/react/24/outline';

import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { UserForm } from '../components/UserForm';
import { UserFilters } from '../components/users/UserFilters';
import { PasswordResetForm } from '../components/users/PasswordResetForm';
import { usersService } from '../../../services/users.service';
import { User } from '../../../types';
import { usePermissions } from '../../../hooks/usePermissions';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
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
  
  // Consulta para obtener usuarios
  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getAll(),
  });
  
  // Mutación para eliminar usuario
  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => usersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario eliminado correctamente');
      setIsDeleteModalOpen(false);
    },
    onError: () => {
      toast.error('Error al eliminar el usuario');
    }
  });
  
  // Mutación para cambiar estado del usuario
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      usersService.toggleActiveStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Estado del usuario actualizado correctamente');
    },
    onError: () => {
      toast.error('Error al actualizar el estado del usuario');
    }
  });
  
  // Filtrar usuarios según criterios
  const filteredUsers = users ? users.filter(user => {
    // Filtro por búsqueda
    const matchesSearch = searchTerm === '' || 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por rol
    const matchesRole = roleFilter === 'ALL' || user.role_id === roleFilter;
    
    // Filtro por estado
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' ? user.is_active : !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  }) : [];
  
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
    toggleStatusMutation.mutate({ 
      id: user.id, 
      isActive: !user.is_active 
    });
  };
  
  const confirmDeleteUser = () => {
    if (!selectedUser) return;
    deleteUserMutation.mutate(selectedUser.id);
  };
  
  const handleFormClose = (shouldRefresh: boolean = false) => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    
    if (shouldRefresh) {
      refetch();
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Usuarios del Sistema</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {hasPermission('settings', 'users', 'admin') && (
              <Button
                onClick={handleCreateUser}
                className="flex items-center justify-center w-full"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nuevo Usuario
              </Button>
            )}
          </div>
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
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error al cargar usuarios. Por favor, intente nuevamente.
        </div>
      )}
      
      {/* Loading spinner */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        /* Tabla de usuarios */
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
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
                  Supervisor
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
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{user.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {user.role_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.supervisor_name ? (
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{user.supervisor_name}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Sin supervisor</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`h-2.5 w-2.5 rounded-full mr-2 ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {hasPermission('settings', 'users', 'admin') ? (
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className={`text-sm ${user.is_active ? 'text-green-800 hover:text-green-900' : 'text-red-800 hover:text-red-900'}`}
                          >
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </button>
                        ) : (
                          <span className={`text-sm ${user.is_active ? 'text-green-800' : 'text-red-800'}`}>
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {hasPermission('settings', 'users', 'admin') && (
                        <>
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
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal para crear usuario */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => handleFormClose(false)}
        title="Nuevo Usuario"
        maxWidth="lg"
      >
        <UserForm 
          onClose={(refresh) => handleFormClose(refresh)} 
          isCreate={true}
        />
      </Modal>
      
      {/* Modal para editar usuario */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => handleFormClose(false)}
        title="Editar Usuario"
        maxWidth="lg"
      >
        <UserForm 
          initialData={selectedUser || undefined}
          onClose={(refresh) => handleFormClose(refresh)}
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