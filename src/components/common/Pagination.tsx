// src/components/common/Pagination.tsx
import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  total,
  limit,
  onPageChange,
  loading = false,
}) => {
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, total);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5;

    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, currentPage + 2);

      if (start > 1) {
        pages.push(1);
        if (start > 2) {
          pages.push('...');
        }
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 py-4">
      <div className="text-[13px] text-[#828282]">
        Mostrando{' '}
        <span className="font-medium text-[#202020]">{startItem}</span> a{' '}
        <span className="font-medium text-[#202020]">{endItem}</span> de{' '}
        <span className="font-medium text-[#202020]">{total}</span> registros
      </div>

      <div className="flex items-center gap-1.5">
        {/* Botón Anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-[#e8e8e8] bg-white text-[#4d4d4d] text-[13px] font-medium hover:bg-[#f5f5f5] hover:text-[#202020] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1" strokeWidth={1.5} />
          Anterior
        </button>

        {/* Números de página */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2 py-1 text-[13px] text-[#828282]">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  disabled={loading}
                  className={`inline-flex items-center justify-center min-w-[36px] h-[36px] rounded-lg text-[13px] font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-[#1F4690] text-white'
                      : 'bg-white text-[#4d4d4d] border border-[#e8e8e8] hover:bg-[#f5f5f5] hover:text-[#202020]'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Botón Siguiente */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-[#e8e8e8] bg-white text-[#4d4d4d] text-[13px] font-medium hover:bg-[#f5f5f5] hover:text-[#202020] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
          <ChevronRightIcon className="h-4 w-4 ml-1" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};
