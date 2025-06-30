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
    return <div className="text-center text-red-500 p-8">Error al cargar las sucursales: {error.message}</div>;
  }
  
  if (branches.length === 0) {
      return <div className="text-center text-gray-500 p-8">No hay sucursales configuradas.</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Punto de Venta Fluvial</h1>
          <p className="text-gray-600">Seleccione la sucursal para iniciar las operaciones</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => onBranchSelect(branch)}
              className="p-6 rounded-lg border-2 text-center transition-all bg-white hover:border-blue-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <MapPin className="h-10 w-10 mx-auto mb-3 text-blue-600" />
              <h3 className="font-semibold text-lg">{branch.name}</h3>
              <p className="text-sm text-gray-500">{branch.port?.name || 'Puerto no asignado'}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};