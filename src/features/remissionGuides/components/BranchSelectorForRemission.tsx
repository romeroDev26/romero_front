// src/features/remissionGuides/components/BranchSelectorForRemission.tsx
import React from 'react';
import { BuildingOfficeIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { BranchOffice } from '../../../types';
import { useBranchOfficesData } from '../../fluvial/hooks/useBranchOfficesData';

interface BranchSelectorForRemissionProps {
  onBranchSelect: (branch: BranchOffice) => void;
}

export const BranchSelectorForRemission: React.FC<BranchSelectorForRemissionProps> = ({ 
  onBranchSelect 
}) => {
  const { data: branches, isLoading } = useBranchOfficesData();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-600">Cargando sucursales...</span>
      </div>
    );
  }

  if (!branches || branches.length === 0) {
    return (
      <div className="text-center py-12">
        <BuildingOfficeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay sucursales disponibles</h3>
        <p className="text-gray-600">No se encontraron sucursales para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-lg">
            <BuildingOfficeIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Seleccionar Sucursal</h2>
            <p className="text-blue-100">Elija la sucursal desde donde se emitirá la guía de remisión</p>
          </div>
        </div>
      </div>
      
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="group cursor-pointer bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300 rounded-xl p-6 transition-all duration-200 hover:shadow-md"
              onClick={() => onBranchSelect(branch)}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-lg transition-colors duration-200">
                    <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-900 truncate">
                    {branch.name}
                  </h3>
                  
                  {branch.address_line && (
                    <div className="flex items-center mt-2 text-sm text-gray-600 group-hover:text-blue-700">
                      <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{branch.address_line}</span>
                    </div>
                  )}
                  
                  {(branch.district || branch.province || branch.department) && (
                    <div className="mt-1 text-xs text-gray-500 group-hover:text-blue-600">
                      {[branch.district, branch.province, branch.department].filter(Boolean).join(', ')}
                    </div>
                  )}

                  {branch.port && (
                    <div className="mt-2 text-xs text-blue-600 bg-blue-100 group-hover:bg-blue-200 px-2 py-1 rounded-full inline-block">
                      Puerto: {branch.port.name}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full group-hover:border-blue-400 group-hover:text-blue-600"
                >
                  Seleccionar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
