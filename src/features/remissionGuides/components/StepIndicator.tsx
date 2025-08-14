import React from 'react';
import {
  TruckIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface StepIndicatorProps {
  currentStep: 'branch' | 'trip' | 'form';
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => (
  <div className="flex items-center justify-center mb-8">
    <div className="flex items-center space-x-8">
      {/* Paso 1 */}
      <div className="flex items-center space-x-3">
        <div className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
          currentStep === 'trip' 
            ? 'bg-blue-600 text-white shadow-lg' 
            : 'bg-green-600 text-white shadow-lg'
        }`}>
          {currentStep === 'trip' ? (
            <TruckIcon className="h-6 w-6" />
          ) : (
            <CheckCircleIcon className="h-6 w-6" />
          )}
          {currentStep === 'form' && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className={`text-sm font-semibold ${
            currentStep === 'trip' ? 'text-blue-600' : 'text-green-600'
          }`}>
            Paso 1
          </span>
          <span className={`text-xs ${
            currentStep === 'trip' ? 'text-blue-500' : 'text-green-500'
          }`}>
            Seleccionar Viaje
          </span>
        </div>
      </div>

      {/* Línea conectora */}
      <div className={`h-1 w-24 rounded-full transition-all duration-300 ${
        currentStep === 'form' ? 'bg-green-600' : 'bg-gray-300'
      }`}></div>

      {/* Paso 2 */}
      <div className="flex items-center space-x-3">
        <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
          currentStep === 'form' 
            ? 'bg-blue-600 text-white shadow-lg' 
            : 'bg-gray-300 text-gray-500'
        }`}>
          <DocumentTextIcon className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className={`text-sm font-semibold ${
            currentStep === 'form' ? 'text-blue-600' : 'text-gray-500'
          }`}>
            Paso 2
          </span>
          <span className={`text-xs ${
            currentStep === 'form' ? 'text-blue-500' : 'text-gray-400'
          }`}>
            Completar Datos
          </span>
        </div>
      </div>
    </div>
  </div>
);
