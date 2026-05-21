import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { BranchSelectorForRemission } from './BranchSelectorForRemission';
import { BranchOffice } from '../../../types';

interface BranchStepContentProps {
  selectedBranch: BranchOffice | null;
  onBranchSelect: (branch: BranchOffice) => void;
}

export const BranchStepContent: React.FC<BranchStepContentProps> = ({
  selectedBranch,
  onBranchSelect,
}) => {
  const navigate = useNavigate();

  // Si no hay sucursal seleccionada, mostrar mensaje de requerimiento
  if (!selectedBranch) {
    return (
      <div className="min-h-screen bg-dm-bg-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-dm-bg-primary rounded-2xl shadow-xl p-12 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/40 mb-6">
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-dm-text-primary mb-4">Sucursal Requerida</h2>
            <p className="text-dm-text-secondary mb-8 max-w-md mx-auto">
              Para crear una guía de remisión, primero debe seleccionar una sucursal activa en el punto de venta.
            </p>
            <Button 
              onClick={() => navigate('/fluvial/operations/sales-point')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <BuildingOfficeIcon className="h-5 w-5 mr-2" />
              Ir a Punto de Venta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <BranchSelectorForRemission onBranchSelect={onBranchSelect} />
    </div>
  );
};
