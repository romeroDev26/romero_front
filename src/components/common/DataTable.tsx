// src/components/common/DataTable.tsx
import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Spinner } from './Spinner';

// La interfaz Column se mantiene igual
export interface Column<T> {
  key: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

// La interfaz DataTableProps se mantiene igual
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  error?: any;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  showActions?: boolean;
  customActions?: (item: T) => React.ReactNode;
}

// El componente DataTable con las correcciones
export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  error = null,
  onEdit,
  onDelete,
  keyExtractor,
  emptyMessage = 'No se encontraron registros',
  showActions = true,
  customActions,
}: DataTableProps<T>) {
  
  // Las secciones isLoading, error y data.length === 0 se mantienen igual
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center text-red-600">
          <p className="font-semibold">Error al cargar los datos</p>
          <p className="text-sm mt-1">{typeof error.message === 'string' ? error.message : 'Ocurrió un error inesperado'}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center text-gray-500">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const hasActions = showActions && (onEdit || onDelete || customActions);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.className || ''
                  }`}
                >
                  {column.header}
                </th>
              ))}
              {hasActions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => {
              // Lógica robusta para la key de la fila
              const rowKey = keyExtractor(item) ?? `row-${index}`;

              return (
                <tr key={rowKey} className="hover:bg-gray-50">
                  {columns.map((column) => {
                    // Lógica robusta para la key de la celda
                    const cellKey = `${rowKey}-${column.key}`;
                    return (
                      <td
                        key={cellKey}
                        className={`px-6 py-4 whitespace-nowrap ${column.className || ''}`}
                      >
                        {column.accessor(item)}
                      </td>
                    );
                  })}
                  {hasActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(item)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                        {customActions && customActions(item)}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// El hook se mantiene igual, está perfecto.
export const useConfirmDelete = (
  onConfirm: (item: any) => void,
  getMessage: (item: any) => string
) => {
  const handleDelete = (item: any) => {
    const message = getMessage(item);
    if (window.confirm(message)) {
      onConfirm(item);
    }
  };

  return handleDelete;
};