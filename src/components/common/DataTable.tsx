// src/components/common/DataTable.tsx
import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
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
      <div className="bg-white rounded-[12px] border border-[#e8e8e8] p-10">
        <div className="flex justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-[12px] border border-[#e8e8e8] p-10">
        <div className="text-center text-[#cf1322]">
          <p className="font-medium text-[15px]">Error al cargar los datos</p>
          <p className="text-[13px] mt-1 text-[#4d4d4d]">
            {typeof error.message === 'string' ? error.message : 'Ocurrió un error inesperado'}
          </p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-[12px] border border-[#e8e8e8] p-10">
        <div className="text-center text-[#828282]">
          <p className="text-[15px]">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const hasActions = showActions && (onEdit || onDelete || customActions);

  return (
    <div className="bg-white rounded-[12px] border border-[#e8e8e8] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-[#f5f5f5]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-5 py-3.5 text-left text-[13px] font-medium text-[#4d4d4d] tracking-normal ${
                    column.className || ''
                  }`}
                >
                  {column.header}
                </th>
              ))}
              {hasActions && (
                <th className="px-5 py-3.5 text-right text-[13px] font-medium text-[#4d4d4d]">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8e8e8]">
            {data.map((item, index) => {
              const rowKey = keyExtractor(item) ?? `row-${index}`;

              return (
                <tr key={rowKey} className="hover:bg-[#f5f5f5]/60 transition-colors">
                  {columns.map((column) => {
                    const cellKey = `${rowKey}-${column.key}`;
                    return (
                      <td
                        key={cellKey}
                        className={`px-5 py-4 whitespace-nowrap text-[14px] text-[#202020] ${column.className || ''}`}
                      >
                        {column.accessor(item)}
                      </td>
                    );
                  })}
                  {hasActions && (
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-3">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="text-[#828282] hover:text-[#1F4690] transition-colors"
                            title="Editar"
                          >
                            <PencilIcon className="h-4 w-4" strokeWidth={1.5} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(item)}
                            className="text-[#828282] hover:text-[#cf1322] transition-colors"
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
