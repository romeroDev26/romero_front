// src/features/fluvial/components/sales-point/BranchSelector.tsx
import React from 'react';
import { MapPin } from 'lucide-react';
import { useBranchOfficesData } from '../../hooks/useBranchOfficesData';
import { BranchOffice } from '../../../../types';
import { Spinner } from '../../../../components/common/Spinner';

interface BranchSelectorProps {
  onBranchSelect: (branch: BranchOffice) => void;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({ onBranchSelect }) => {
  const { data: branches = [], isLoading, error } = useBranchOfficesData();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500 dark:text-red-400 p-8">Error al cargar las sucursales: {error.message}</div>;
  }
  
  if (branches.length === 0) {
      return <div className="text-center text-dm-text-muted p-8">No hay sucursales configuradas.</div>;
  }

  return (
    <div className="w-full px-4 py-8 lg:px-6 lg:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="text-center mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-dm-text-primary mb-2">Punto de Venta Fluvial</h1>
          <p className="text-sm lg:text-base text-dm-text-secondary">Seleccione la sucursal para iniciar las operaciones</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => onBranchSelect(branch)}
              className="p-5 lg:p-6 rounded-lg border-2 text-center transition-all bg-dm-bg-primary hover:border-blue-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <MapPin className="h-8 w-8 lg:h-10 lg:w-10 mx-auto mb-2 lg:mb-3 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-base lg:text-lg">{branch.name}</h3>
              <p className="text-xs lg:text-sm text-dm-text-muted">{branch.port?.name || 'Puerto no asignado'}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};