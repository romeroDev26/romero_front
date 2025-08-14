import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

// Componentes
import { Button } from '../../../components/common/Button';
import { StepIndicator } from '../components/StepIndicator';
import { BranchStepContent } from '../components/BranchStepContent';
import { TripStepContent } from '../components/TripStepContent';
import { FormStepContent } from '../components/FormStepContent';

// Types
import { BranchOffice } from '../../../types';
import { AvailableTripByPort } from '../../../services/trips.service';

export const RemissionGuideFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState<BranchOffice | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<AvailableTripByPort | null>(null);
  const [currentStep, setCurrentStep] = useState<'branch' | 'trip' | 'form'>('branch');

  // Intentar recuperar sucursal guardada al cargar
  useEffect(() => {
    const savedBranch = localStorage.getItem('selectedSalesBranch');
    if (savedBranch) {
      try {
        const branch = JSON.parse(savedBranch);
        setSelectedBranch(branch);
        setCurrentStep('trip');
      } catch (error) {
        console.error('Error parsing saved branch:', error);
        localStorage.removeItem('selectedSalesBranch');
      }
    }
  }, []);

  const handleBranchSelect = (branch: BranchOffice) => {
    setSelectedBranch(branch);
    setCurrentStep('trip');
  };

  const handleTripSelect = (trip: AvailableTripByPort) => {
    setSelectedTrip(trip);
    setCurrentStep('form');
  };

  const handleBackToBranch = () => {
    setSelectedBranch(null);
    setSelectedTrip(null);
    setCurrentStep('branch');
  };

  const handleBackToTrip = () => {
    setSelectedTrip(null);
    setCurrentStep('trip');
  };

  const handleResetForm = () => {
    setSelectedTrip(null);
    setCurrentStep('trip');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/remission-guides')}
                  className="flex items-center"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Volver
                </Button>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Nueva Guía de Remisión</h1>
              <p className="text-gray-600 mt-1">Cree una nueva guía de remisión transportista</p>
            </div>
            
            <div className="flex items-center space-x-3">
              {currentStep === 'form' && (
                <Button 
                  variant="outline" 
                  onClick={handleResetForm}
                  className="flex items-center"
                >
                  Reiniciar
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Indicador de pasos */}
        <StepIndicator currentStep={currentStep} />

        {/* Renderizado condicional por pasos */}
        {currentStep === 'branch' && (
          <BranchStepContent 
            selectedBranch={selectedBranch}
            onBranchSelect={handleBranchSelect}
          />
        )}

        {currentStep === 'trip' && selectedBranch && (
          <TripStepContent
            selectedBranch={selectedBranch}
            onTripSelect={handleTripSelect}
            onBack={handleBackToBranch}
          />
        )}

        {currentStep === 'form' && selectedTrip && (
          <FormStepContent
            selectedTrip={selectedTrip}
            onBack={handleBackToTrip}
          />
        )}
      </div>
    </div>
  );
};