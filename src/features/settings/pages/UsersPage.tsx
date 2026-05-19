// src/features/settings/pages/UsersPage.tsx
import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from '@/utils/sileo-toast';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  KeyIcon,
  UsersIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';

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

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getAll(),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => usersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario eliminado correctamente');
      setIsDeleteModalOpen(false);
    },
    onError: () => {
      toast.error('Error al eliminar el usuario');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersService.toggleActiveStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Estado del usuario actualizado correctamente');
    },
    onError: () => {
      toast.error('Error al actualizar el estado del usuario');
    },
  });

  const filteredUsers = users
    ? users.filter((user) => {
        const matchesSearch =
          searchTerm === '' ||
          user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || user.role_id === roleFilter;
        const matchesStatus =
          statusFilter === 'ALL' ||
          (statusFilter === 'ACTIVE' ? user.is_active : !user.is_active);
        return matchesSearch && matchesRole && matchesStatus;
      })
    : [];

  const handleCreateUser = () => setIsCreateModalOpen(true);

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
    toggleStatusMutation.mutate({ id: user.id, isActive: !user.is_active });
  };

  const confirmDeleteUser = () => {
    if (!selectedUser) return;
    deleteUserMutation.mutate(selectedUser.id);
  };

  const handleFormClose = (shouldRefresh: boolean = false) => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    if (shouldRefresh) refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-[8px] bg-[#1F4690]/10">
              <UsersIcon className="w-5 h-5 text-[#1F4690]" />
            </div>
            <h1 className="text-[22px] font-semibold text-[#202020] tracking-tight">
              Usuarios del sistema
            </h1>
          </div>
          <p className="text-[14px] text-[#828282]">
            Gestiona los usuarios, roles y permisos de acceso.
          </p>
        </div>
        {hasPermission('settings', 'users', 'admin') && (
          <Button
            onClick={handleCreateUser}
            className="inline-flex items-center gap-2 rounded-full px-5"
          >
            <PlusIcon className="h-4 w-4" />
            Nuevo usuario
          </Button>
        )}
      </header>

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

      {/* Error */}
      {error && (
        <div className="rounded-[12px] border border-red-200 bg-red-50/40 p-4">
          <p className="text-[13px] text-red-700">
            Error al cargar usuarios. Por favor, intente nuevamente.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Spinner size="lg" color="text-[#1F4690]" />
          <p className="text-[13px] text-[#828282]">Cargando usuarios...</p>
        </div>
      ) : (
        /* Tabla */
        <div className="bg-white rounded-[12px] border border-[#e8e8e8] overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-[20px] bg-[#f5f5f5]">
                <InboxIcon className="w-8 h-8 text-[#828282]" />
              </div>
              <div className="text-center">
                <p className="text-[15px] font-medium text-[#202020]">No se encontraron usuarios</p>
                <p className="text-[13px] text-[#828282] mt-1">
                  {searchTerm
                    ? `No hay resultados para "${searchTerm}"`
                    : 'Los usuarios aparecerán aquí cuando se creen.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fafafa] border-b border-[#e8e8e8]">
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-[#828282] uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-[#828282] uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-[#828282] uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-[#828282] uppercase tracking-wider">
                      Supervisor
                    </th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-[#828282] uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-[#828282] uppercase tracking-wider text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f5f5]">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#fafafa]/60 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1F4690]/10 flex items-center justify-center text-[#1F4690] font-bold text-[11px] flex-shrink-0">
                            {user.full_name
                              .split(' ')
                              .slice(0, 2)
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </div>
                          <span className="text-[13px] font-medium text-[#202020]">
                            {user.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[13px] text-[#4d4d4d]">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#1F4690]/5 text-[#1F4690] border border-[#1F4690]/10">
                          {user.role_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[13px] text-[#4d4d4d]">
                        {user.supervisor_name ? (
                          <span className="font-medium text-[#202020]">{user.supervisor_name}</span>
                        ) : (
                          <span className="text-[#c4c4c4] italic">Sin supervisor</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasPermission('settings', 'users', 'admin') ? (
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                              user.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.is_active ? 'bg-emerald-500' : 'bg-red-500'
                              }`}
                            />
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                              user.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-red-50 text-red-700 border-red-100'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.is_active ? 'bg-emerald-500' : 'bg-red-500'
                              }`}
                            />
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {hasPermission('settings', 'users', 'admin') && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleResetPassword(user)}
                              className="flex items-center justify-center w-8 h-8 rounded-full text-[#828282] hover:text-[#1F4690] hover:bg-[#1F4690]/5 transition-colors"
                              title="Cambiar contraseña"
                            >
                              <KeyIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="flex items-center justify-center w-8 h-8 rounded-full text-[#828282] hover:text-[#1F4690] hover:bg-[#1F4690]/5 transition-colors"
                              title="Editar"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="flex items-center justify-center w-8 h-8 rounded-full text-[#828282] hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Eliminar"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredUsers.length > 0 && (
            <div className="px-6 py-3.5 bg-[#fafafa] border-t border-[#e8e8e8]">
              <p className="text-[12px] text-[#828282]">
                Mostrando {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modales */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => handleFormClose(false)}
        title="Nuevo Usuario"
        maxWidth="lg"
      >
        <UserForm onClose={(refresh) => handleFormClose(refresh)} isCreate={true} />
      </Modal>

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

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar eliminación"
      >
        <div className="p-6">
          <p className="text-[14px] text-[#4d4d4d] mb-6">
            ¿Está seguro que desea eliminar al usuario{' '}
            <span className="font-semibold text-[#202020]">{selectedUser?.full_name}</span>?
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="rounded-full px-5"
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteUser}
              isLoading={deleteUserMutation.isPending}
              className="rounded-full px-5"
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title="Cambiar contraseña"
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
