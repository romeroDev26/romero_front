// src/features/fluvial/pages/SalesPointPage.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BranchOffice } from '../../../types';
import { AvailableTripByPort } from '../../../services/trips.service';

// Importa los nuevos componentes que has creado
import { BranchSelector } from '../components/sales-point/BranchSelector';
import { TripSelection } from '../components/sales-point/TripSelection';
import { SaleForm } from '../components/sales-point/SaleForm';

// Definimos los posibles pasos/vistas del wizard
type SalesPointView = 'branchSelection' | 'tripSelection' | 'saleForm';

export const SalesPointPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<SalesPointView>('branchSelection');
  const [selectedBranch, setSelectedBranch] = useState<BranchOffice | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<AvailableTripByPort | null>(null);
  const location = useLocation();

  // Comprobar si venimos de la página de reservas
  const reservationToConfirm = location.state?.reservationToConfirm;
  const tripIdToLoad = location.state?.tripId;

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

  // Si hay un tripId desde el estado de la navegación, lo usamos para cargar el viaje
  useEffect(() => {
    if (tripIdToLoad) {
      // Aquí puedes implementar la lógica para cargar el viaje basado en tripIdToLoad
      // Por ahora, solo se establece un viaje de ejemplo
      const exampleTrip: AvailableTripByPort = {
        id: tripIdToLoad,
        trip_name: "Example Trip",
        vessel_name: "Example Vessel",
        status: "SCHEDULED",
        estimated_departure_time: new Date().toISOString(),
        estimated_arrival_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours later
      };
      setSelectedTrip(exampleTrip);
      setCurrentView('saleForm');
    }
  }, [tripIdToLoad]);

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

  const handleTripSelect = (trip: AvailableTripByPort) => {
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
            onSaleSuccess={handleBackToTripSelection}
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
