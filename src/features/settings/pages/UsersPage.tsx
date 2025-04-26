// src/features/settings/pages/UsersPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PencilIcon, TrashIcon, PlusIcon, KeyIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
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
  
  // En un proyecto real, estos datos vendrían de una API - Actualizado para React Query v5
  // const { data, isLoading } = useQuery({
  //   queryKey: ['users', { q: searchTerm, role_id: roleFilter !== 'ALL' ? roleFilter : undefined, is_active: statusFilter !== 'ALL' ? statusFilter === 'ACTIVE' : undefined }],
  //   queryFn: () => usersService.search({ 
  //     q: searchTerm, 
  //     role_id: roleFilter !== 'ALL' ? roleFilter : undefined, 
  //     is_active: statusFilter !== 'ALL' ? statusFilter === 'ACTIVE' : undefined 
  //   })
  // });
  
  // const users = data?.data || [];
  
  // Datos simulados para el ejemplo
  const users = [
    { 
      id: '1', 
      email: 'admin@transportesromero.com',
      full_name: 'Administrador Principal',
      role: { id: 1, name: 'admin', description: 'Administrador del Sistema' },
      role_id: 1,
      is_active: true,
      created_at: '2025-01-01T00:00:00-05:00',
      updated_at: '2025-01-01T00:00:00-05:00'
    },
    { 
      id: '2', 
      email: 'ventas@transportesromero.com',
      full_name: 'Usuario de Ventas',
      role: { id: 2, name: 'sales', description: 'Personal de Ventas' },
      role_id: 2,
      is_active: true,
      created_at: '2025-01-02T00:00:00-05:00',
      updated_at: '2025-01-02T00:00:00-05:00'
    },
    { 
      id: '3', 
      email: 'almacen@transportesromero.com',
      full_name: 'Usuario de Almacén',
      role: { id: 3, name: 'warehouse', description: 'Personal de Almacén' },
      role_id: 3,
      is_active: true,
      created_at: '2025-01-03T00:00:00-05:00',
      updated_at: '2025-01-03T00:00:00-05:00'
    },
    { 
      id: '4', 
      email: 'contabilidad@transportesromero.com',
      full_name: 'Usuario de Contabilidad',
      role: { id: 5, name: 'accountant', description: 'Contador' },
      role_id: 5,
      is_active: false,
      created_at: '2025-01-04T00:00:00-05:00',
      updated_at: '2025-01-04T00:00:00-05:00'
    },
    { 
      id: '5', 
      email: 'despacho@transportesromero.com',
      full_name: 'Usuario de Despacho',
      role: { id: 4, name: 'dispatcher', description: 'Personal de Despacho' },
      role_id: 4,
      is_active: true,
      created_at: '2025-01-05T00:00:00-05:00',
      updated_at: '2025-01-05T00:00:00-05:00'
    },
    { 
      id: '6', 
      email: 'conductor@transportesromero.com',
      full_name: 'Conductor Principal',
      role: { id: 6, name: 'driver', description: 'Conductor/Tripulante' },
      role_id: 6,
      is_active: true,
      created_at: '2025-01-06T00:00:00-05:00',
      updated_at: '2025-01-06T00:00:00-05:00'
    }
  ];
  
  const isLoading = false;
  
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
    // En un proyecto real, llamarías a una API
    // usersService.toggleActiveStatus(user.id, !user.is_active);
    
    const newStatus = !user.is_active;
    console.log(`Cambiando estado de usuario ${user.id} a ${newStatus ? 'Activo' : 'Inactivo'}`);
    
    toast.success(`Usuario ${newStatus ? 'activado' : 'desactivado'} correctamente`);
  };
  
  const confirmDeleteUser = () => {
    if (!selectedUser) return;
    
    // En un proyecto real, llamarías a una API
    // usersService.delete(selectedUser.id);
    
    console.log('Eliminando usuario:', selectedUser.id);
    
    toast.success('Usuario eliminado correctamente');
    setIsDeleteModalOpen(false);
  };
  
  if (isLoading) return <Spinner />;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios del Sistema</h1>
        <div className="flex space-x-2">
          <Link 
            to="/settings/roles"
            className="bg-secondary text-white py-2 px-4 rounded-md font-medium hover:bg-secondary/90 transition-colors duration-200 inline-flex items-center"
          >
            Gestionar Roles
          </Link>
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
                    {user.role?.description || user.role?.name || 'Sin rol'}
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