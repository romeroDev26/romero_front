// src/features/settings/pages/UsersPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { UserForm } from '../components/UserForm';

// Este servicio tendría que ser implementado
// import { usersService } from '../../../services/users.service';

export const UsersPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // En un proyecto real, estos datos vendrían de una API
  // const { data: users, isLoading } = useQuery(['users'], usersService.getAll);
  
  // Datos simulados para el ejemplo
  const users = [
    { 
      id: '1', 
      email: 'admin@transportesromero.com',
      full_name: 'Administrador Principal',
      role: { id: 1, name: 'admin', description: 'Administrador del Sistema' },
      is_active: true
    },
    { 
      id: '2', 
      email: 'ventas@transportesromero.com',
      full_name: 'Usuario de Ventas',
      role: { id: 2, name: 'sales', description: 'Personal de Ventas' },
      is_active: true
    },
    { 
      id: '3', 
      email: 'almacen@transportesromero.com',
      full_name: 'Usuario de Almacén',
      role: { id: 3, name: 'warehouse', description: 'Personal de Almacén' },
      is_active: true
    },
    { 
      id: '4', 
      email: 'contabilidad@transportesromero.com',
      full_name: 'Usuario de Contabilidad',
      role: { id: 4, name: 'accountant', description: 'Contador' },
      is_active: false
    }
  ];
  
  const isLoading = false;
  
  const handleCreateUser = () => {
    setIsCreateModalOpen(true);
  };
  
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };
  
  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };
  
  const confirmDeleteUser = () => {
    // En un proyecto real, llamarías a una API
    // usersService.delete(selectedUser.id);
    console.log('Eliminando usuario:', selectedUser.id);
    setIsDeleteModalOpen(false);
  };
  
  if (isLoading) return <Spinner />;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios del Sistema</h1>
        <Button
          onClick={handleCreateUser}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Usuario
        </Button>
      </div>
      
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
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{user.full_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {user.role.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="text-primary hover:text-primary/80 mr-4"
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
          initialData={selectedUser}
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
    </div>
  );
};
