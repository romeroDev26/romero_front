// src/components/common/DataTable.tsx
import React from 'react';
import { PencilIcon, TrashIcon, InboxIcon } from '@heroicons/react/24/outline';
import { Spinner } from './Spinner';

export interface Column<T> {
  key: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

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
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Spinner size="lg" color="text-[#1F4690]" />
        <p className="text-[13px] text-[#828282]">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-[20px] bg-red-50">
          <InboxIcon className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-[15px] font-medium text-[#202020]">Error al cargar los datos</p>
          <p className="text-[13px] text-[#828282] mt-1">
            {typeof error.message === 'string' ? error.message : 'Ocurrió un error inesperado'}
          </p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-[20px] bg-[#f5f5f5]">
          <InboxIcon className="w-8 h-8 text-[#828282]" />
        </div>
        <div className="text-center">
          <p className="text-[15px] font-medium text-[#202020]">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const hasActions = showActions && (onEdit || onDelete || customActions);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-[#fafafa] border-b border-[#e8e8e8]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3.5 text-left text-[11px] font-semibold text-[#828282] uppercase tracking-wider ${
                  column.className || ''
                }`}
              >
                {column.header}
              </th>
            ))}
            {hasActions && (
              <th className="px-6 py-3.5 text-right text-[11px] font-semibold text-[#828282] uppercase tracking-wider">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f5f5f5]">
          {data.map((item, index) => {
            const rowKey = keyExtractor(item) ?? `row-${index}`;

            return (
              <tr key={rowKey} className="hover:bg-[#fafafa]/60 transition-colors">
                {columns.map((column) => {
                  const cellKey = `${rowKey}-${column.key}`;
                  return (
                    <td
                      key={cellKey}
                      className={`px-6 py-4 whitespace-nowrap text-[13px] text-[#202020] ${column.className || ''}`}
                    >
                      {column.accessor(item)}
                    </td>
                  );
                })}
                {hasActions && (
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="flex items-center justify-center w-8 h-8 rounded-full text-[#828282] hover:text-[#1F4690] hover:bg-[#1F4690]/5 transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          className="flex items-center justify-center w-8 h-8 rounded-full text-[#828282] hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Desactivar"
                        >
                          <TrashIcon className="h-4 w-4" strokeWidth={1.5} />
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
  );
}

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
