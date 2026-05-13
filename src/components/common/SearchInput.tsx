import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Buscar...',
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-5 w-5 text-[#828282]" strokeWidth={1.5} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-4 py-3 rounded-[20px] bg-[#f5f5f5] border border-[#e8e8e8] text-[15px] text-[#202020] placeholder:text-[#828282] focus:border-[#1F4690] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1F4690]/10 transition-all"
      />
    </div>
  );
};
