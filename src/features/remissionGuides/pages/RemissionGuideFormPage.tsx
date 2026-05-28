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
import { FormStepContentSender } from '../components/FormStepContentSender';
import { TypeSelectionModal } from '../components/TypeSelectionModal';

// Types
import { BranchOffice } from '../../../types';
import { AvailableTripByPort } from '../../../services/trips.service';

export const RemissionGuideFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState<BranchOffice | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<AvailableTripByPort | null>(null);
  const [selectedType, setSelectedType] = useState<'transportista' | 'remitente' | null>(null);
  const [currentStep, setCurrentStep] = useState<'type' | 'branch' | 'trip' | 'form'>('type');

  // Intentar recuperar sucursal guardada al cargar
  useEffect(() => {
    const savedBranch = localStorage.getItem('selectedSalesBranch');
    if (savedBranch) {
      try {
        const branch = JSON.parse(savedBranch);
        setSelectedBranch(branch);
        setCurrentStep('type'); // Cambiar a 'type' en lugar de 'trip'
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

  const handleTypeSelect = (type: 'transportista' | 'remitente') => {
    setSelectedType(type);
    if (type === 'remitente') {
      // Para remitente, ir directamente al formulario sin seleccionar viaje
      setCurrentStep('form');
    } else {
      // Para transportista, ir a seleccionar sucursal primero
      if (selectedBranch) {
        setCurrentStep('trip');
      } else {
        setCurrentStep('branch');
      }
    }
  };

  const handleTripSelect = (trip: AvailableTripByPort) => {
    setSelectedTrip(trip);
    setCurrentStep('form');
  };


  const handleBackToType = () => {
    setSelectedType(null);
    setSelectedTrip(null);
    setCurrentStep('type');
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
    <div className="-mx-4 w-full min-h-[calc(100vh-10rem)] lg:-mx-6">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 pb-10">
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
              <h1 className="text-3xl font-bold text-dm-text-primary">Nueva Guía de Remisión</h1>
              <p className="text-dm-text-secondary mt-1">Cree una nueva guía de remisión</p>
            </div>
            
            <div className="flex items-center space-x-3">
              {currentStep === 'form' && selectedType === 'transportista' && (
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
        {currentStep === 'branch' && selectedType && (
          <BranchStepContent 
            selectedBranch={selectedBranch}
            onBranchSelect={handleBranchSelect}
          />
        )}

        {currentStep === 'type' && (
          <TypeSelectionModal
            isOpen={currentStep === 'type'}
            onClose={() => navigate('/remission-guides')}
            onSelectType={handleTypeSelect}
          />
        )}

        {currentStep === 'trip' && selectedBranch && selectedType && (
          <TripStepContent
            selectedBranch={selectedBranch}
            onTripSelect={handleTripSelect}
          />
        )}

        {currentStep === 'form' && (
          selectedType === 'remitente' ? (
            <FormStepContentSender
              selectedTrip={null}
              onBack={handleBackToType}
            />
          ) : selectedTrip ? (
            <FormStepContent
              selectedTrip={selectedTrip}
              onBack={handleBackToTrip}
            />
          ) : null
        )}
      </div>
    </div>
  );
};