import React from 'react';
import {
  TruckIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface StepIndicatorProps {
  currentStep: 'branch' | 'type' | 'trip' | 'form';
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => (
  <div className="flex items-center justify-center mb-8">
    <div className="flex items-center space-x-8">
      {/* Paso 1: Tipo de Guía */}
      <div className="flex items-center space-x-3">
        <div className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
          ['branch', 'trip', 'form'].includes(currentStep) 
            ? 'bg-green-600 text-white shadow-lg' 
            : 'bg-blue-600 text-white shadow-lg'
        }`}>
          {['branch', 'trip', 'form'].includes(currentStep) ? (
            <CheckCircleIcon className="h-6 w-6" />
          ) : (
            <DocumentTextIcon className="h-6 w-6" />
          )}
        </div>
        <div className="flex flex-col">
          <span className={`text-sm font-semibold ${
            ['branch', 'trip', 'form'].includes(currentStep) ? 'text-green-600' : 'text-blue-600'
          }`}>
            Paso 1
          </span>
          <span className={`text-xs ${
            ['branch', 'trip', 'form'].includes(currentStep) ? 'text-green-500' : 'text-blue-500'
          }`}>
            Tipo de Guía
          </span>
        </div>
      </div>

      {/* Línea conectora 1 */}
      <div className={`h-1 w-16 rounded-full transition-all duration-300 ${
        ['trip', 'form'].includes(currentStep) ? 'bg-green-600' : 'bg-gray-300'
      }`}></div>

      {/* Paso 2: Sucursal */}
      <div className="flex items-center space-x-3">
        <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
          ['trip', 'form'].includes(currentStep) 
            ? 'bg-green-600 text-white shadow-lg' 
            : currentStep === 'branch' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-gray-300 text-gray-500'
        }`}>
          {['trip', 'form'].includes(currentStep) ? (
            <CheckCircleIcon className="h-6 w-6" />
          ) : (
            <UserIcon className="h-6 w-6" />
          )}
        </div>
        <div className="flex flex-col">
          <span className={`text-sm font-semibold ${
            ['trip', 'form'].includes(currentStep) ? 'text-green-600' : currentStep === 'branch' ? 'text-blue-600' : 'text-gray-500'
          }`}>
            Paso 2
          </span>
          <span className={`text-xs ${
            ['trip', 'form'].includes(currentStep) ? 'text-green-500' : currentStep === 'branch' ? 'text-blue-500' : 'text-gray-400'
          }`}>
            Sucursal
          </span>
        </div>
      </div>

      {/* Línea conectora 2 */}
      <div className={`h-1 w-16 rounded-full transition-all duration-300 ${
        currentStep === 'form' ? 'bg-green-600' : 'bg-gray-300'
      }`}></div>

      {/* Paso 3: Viaje */}
      <div className="flex items-center space-x-3">
        <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
          currentStep === 'form' 
            ? 'bg-green-600 text-white shadow-lg' 
            : currentStep === 'trip' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-gray-300 text-gray-500'
        }`}>
          {currentStep === 'form' ? (
            <CheckCircleIcon className="h-6 w-6" />
          ) : (
            <TruckIcon className="h-6 w-6" />
          )}
        </div>
        <div className="flex flex-col">
          <span className={`text-sm font-semibold ${
            currentStep === 'form' ? 'text-green-600' : currentStep === 'trip' ? 'text-blue-600' : 'text-gray-500'
          }`}>
            Paso 3
          </span>
          <span className={`text-xs ${
            currentStep === 'form' ? 'text-green-500' : currentStep === 'trip' ? 'text-blue-500' : 'text-gray-400'
          }`}>
            Viaje
          </span>
        </div>
      </div>

      {/* Línea conectora 3 */}
      <div className={`h-1 w-16 rounded-full transition-all duration-300 ${
        currentStep === 'form' ? 'bg-green-600' : 'bg-gray-300'
      }`}></div>

      {/* Paso 4: Formulario */}
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
            Paso 4
          </span>
          <span className={`text-xs ${
            currentStep === 'form' ? 'text-blue-500' : 'text-gray-400'
          }`}>
            Datos
          </span>
        </div>
      </div>
    </div>
  </div>
);
