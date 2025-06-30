// src/features/fluvial/pages/SalesPointPage.tsx
import React, { useState, useEffect } from 'react';
import { BranchOffice } from '../../../types';

// Importa los nuevos componentes que has creado
import { BranchSelector } from '../components/sales-point/BranchSelector';
import { TripSelection } from '../components/sales-point/TripSelection';
import { SaleForm } from '../components/sales-point/SaleForm';

// Definimos los posibles pasos/vistas del wizard
type SalesPointView = 'branchSelection' | 'tripSelection' | 'saleForm';

export const SalesPointPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<SalesPointView>('branchSelection');
  const [selectedBranch, setSelectedBranch] = useState<BranchOffice | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null); // Tipar mejor más adelante

  // Efecto para leer la sucursal guardada en el localStorage al cargar la página
  useEffect(() => {
    const savedBranchJson = localStorage.getItem('selectedSalesBranch');
    if (savedBranchJson) {
      try {
        const savedBranch = JSON.parse(savedBranchJson);
        setSelectedBranch(savedBranch);
        setCurrentView('tripSelection'); // Si ya hay sucursal, vamos directo a seleccionar viaje
      } catch (e) {
        console.error("Error parsing saved branch office", e);
        localStorage.removeItem('selectedSalesBranch');
      }
    }
  }, []);

  // --- Handlers para navegar entre los pasos del wizard ---

  const handleBranchSelect = (branch: BranchOffice) => {
    setSelectedBranch(branch);
    localStorage.setItem('selectedSalesBranch', JSON.stringify(branch));
    setCurrentView('tripSelection');
  };
  
  const handleChangeBranch = () => {
      localStorage.removeItem('selectedSalesBranch');
      setSelectedBranch(null);
      setSelectedTrip(null);
      setCurrentView('branchSelection');
  };

  const handleTripSelect = (trip: any) => { // Tipar mejor más adelante
    setSelectedTrip(trip);
    setCurrentView('saleForm');
  };
  
  const handleBackToTripSelection = () => {
      setSelectedTrip(null);
      setCurrentView('tripSelection');
  };

  // --- Renderizado condicional basado en la vista actual ---

  const renderCurrentView = () => {
    switch (currentView) {
      case 'branchSelection':
        return <BranchSelector onBranchSelect={handleBranchSelect} />;
      
      case 'tripSelection':
        if (!selectedBranch) return null; // Fallback por si algo sale mal
        return (
          <TripSelection 
            branch={selectedBranch} 
            onTripSelect={handleTripSelect} 
            onChangeBranch={handleChangeBranch}
          />
        );

      case 'saleForm':
        if (!selectedTrip || !selectedBranch) return null; // Fallback
        return (
          <SaleForm 
            trip={selectedTrip} 
            branch={selectedBranch}
            onBack={handleBackToTripSelection}
            onSaleSuccess={() => { /* Lógica para después de la venta */
                handleBackToTripSelection(); // Volver a la selección de viaje
            }}
          />
        );

      default:
        return <BranchSelector onBranchSelect={handleBranchSelect} />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-full">
      {renderCurrentView()}
    </div>
  );
};