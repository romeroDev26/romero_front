// src/features/quotations/components/QuotationBranchStep.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useBranchOfficesData } from '../../fluvial/hooks/useBranchOfficesData';
import { BranchOffice } from '../../../types';
import { Spinner } from '../../../components/common/Spinner';

interface QuotationBranchStepProps {
  onBranchSelect: (branch: BranchOffice) => void;
}

export const QuotationBranchStep: React.FC<QuotationBranchStepProps> = ({ onBranchSelect }) => {
  const navigate = useNavigate();
  const { data: branches = [], isLoading, error } = useBranchOfficesData();

  return (
    <div className="-mx-6 -mt-6">
      {/* Cabecera sticky */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg text-white">
              <DocumentTextIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">Nueva Cotización</h1>
              <p className="text-sm text-slate-500">Paso 1 de 3 - Selecciona la sucursal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/sales/quotations')}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </header>

      <div className="px-6 pb-8">
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
            Error al cargar las sucursales: {error.message}
          </div>
        )}

        {!isLoading && !error && branches.length === 0 && (
          <div className="text-center text-slate-500 py-16">
            <MapPinIcon className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No hay sucursales configuradas</p>
            <p className="text-sm mt-1">Contacta al administrador del sistema.</p>
          </div>
        )}

        {!isLoading && !error && branches.length > 0 && (
          <>
            <div className="max-w-2xl mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Selecciona la sucursal de origen</h2>
              <p className="text-sm text-slate-500 mt-1">
                La sucursal determina los viajes disponibles y las series de documento para la cotizacion.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => onBranchSelect(branch)}
                  className="p-6 rounded-xl border-2 border-slate-200 bg-white text-left hover:border-primary hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2.5 rounded-lg shrink-0">
                      <MapPinIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{branch.name}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {branch.port?.name || 'Puerto no asignado'}
                      </p>
                      {branch.address_line && (
                        <p className="text-xs text-slate-400 mt-1">{branch.address_line}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
