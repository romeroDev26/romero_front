import React from 'react';

interface StatusBadgeProps {
  isActive: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  isActive,
  activeLabel = 'Activo',
  inactiveLabel = 'Inactivo',
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-medium leading-none ${
        isActive
          ? 'bg-[#e6f7e6] text-[#237804]'
          : 'bg-[#fff1f0] text-[#cf1322]'
      } ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isActive ? 'bg-[#237804]' : 'bg-[#cf1322]'
        }`}
      />
      {isActive ? activeLabel : inactiveLabel}
    </span>
  );
};
