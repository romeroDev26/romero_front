// src/features/fluvial/pages/SalesPointPage.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BranchOffice } from '../../../types';
import { AvailableTripByPort } from '../../../services/trips.service';
import { useTripDetails } from '../hooks/useTripDetails';
import { BranchSelector } from '../components/sales-point/BranchSelector';
import { TripSelection } from '../components/sales-point/TripSelection';
import { SaleForm } from '../components/sales-point/SaleForm';
import { Spinner } from '../../../components/common/Spinner';
import { toast } from 'react-toastify';

type SalesPointView = 'branchSelection' | 'tripSelection' | 'saleForm' | 'loading';

export const SalesPointPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<SalesPointView>('branchSelection');
  const [selectedBranch, setSelectedBranch] = useState<BranchOffice | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<AvailableTripByPort | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const reservationToConfirm = location.state?.reservationToConfirm;
  const [tripIdToLoad, setTripIdToLoad] = useState<number | null>(reservationToConfirm?.trip_id || null);
  const { data: tripDetails } = useTripDetails(tripIdToLoad);

  useEffect(() => {
    const savedBranchJson = localStorage.getItem('selectedSalesBranch');
    if (savedBranchJson) {
      try {
        const savedBranch = JSON.parse(savedBranchJson);
        setSelectedBranch(savedBranch);
        if (!reservationToConfirm) {
          setCurrentView('tripSelection');
        }
      } catch (e) {
        console.error("Error parsing saved branch office", e);
        localStorage.removeItem('selectedSalesBranch');
      }
    }
  }, [reservationToConfirm]);

  useEffect(() => {
    if (tripIdToLoad && !selectedTrip) {
      setCurrentView('loading');
      if (tripDetails) {
        const tripForSaleForm: AvailableTripByPort = {
          id: tripDetails.id,
          trip_name: tripDetails.trip_name || 'Viaje sin nombre',
          vessel_name: tripDetails.vessel?.name || 'Embarcación sin nombre',
          status: tripDetails.status,
          estimated_departure_time: tripDetails.departure_datetime,
          estimated_arrival_time: tripDetails.estimated_arrival_datetime || '',
        };
        setSelectedTrip(tripForSaleForm);
        setCurrentView('saleForm');
      }
    }
  }, [tripIdToLoad, tripDetails, selectedTrip]);

  // Efecto para cargar automáticamente el último viaje vendido después de recarga
  useEffect(() => {
    const lastSoldTripId = localStorage.getItem('lastSoldTripId');
    if (lastSoldTripId && !tripIdToLoad && !selectedTrip) {
      // Limpiar el localStorage para evitar bucles
      localStorage.removeItem('lastSoldTripId');
      // Establecer el trip ID para cargar
      setTripIdToLoad(parseInt(lastSoldTripId));
    }
  }, [tripIdToLoad, selectedTrip]);

  const handleBranchSelect = (branch: BranchOffice) => {
    setSelectedBranch(branch);
    localStorage.setItem('selectedSalesBranch', JSON.stringify(branch));
    setCurrentView('tripSelection');
  };

  const cleanUpStateAndNavigate = (view: SalesPointView) => {
    setSelectedTrip(null);
    setTripIdToLoad(null);
    navigate('.', { replace: true, state: {} });
    setCurrentView(view);
  };

  const handleChangeBranch = () => {
    localStorage.removeItem('selectedSalesBranch');
    setSelectedBranch(null);
    cleanUpStateAndNavigate('branchSelection');
  };

  const handleTripSelect = (trip: AvailableTripByPort) => {
    setSelectedTrip(trip);
    setCurrentView('saleForm');
  };

  const handleBackToTripSelection = () => {
    cleanUpStateAndNavigate('tripSelection');
  };

  const handleSaleSuccess = () => {
    toast.success("Venta completada exitosamente. Recargando página...");
    
    // Guardar el ID del viaje actual en localStorage para mantenerlo después de la recarga
    if (selectedTrip) {
      localStorage.setItem('lastSoldTripId', selectedTrip.id.toString());
    }
    
    // Recargar la página completamente para asegurar sincronización del WebSocket
    setTimeout(() => {
      window.location.reload();
    }, 1000); // Dar tiempo para que se muestre el toast
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'loading':
        return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
      case 'branchSelection':
        return <BranchSelector onBranchSelect={handleBranchSelect} />;
      case 'tripSelection':
        if (!selectedBranch) return null;
        return (
          <TripSelection
            branch={selectedBranch}
            onTripSelect={handleTripSelect}
            onChangeBranch={handleChangeBranch}
          />
        );
      case 'saleForm':
        if (!selectedTrip || !selectedBranch) return null;
        return (
          <SaleForm
            trip={selectedTrip}
            branch={selectedBranch}
            onBack={handleBackToTripSelection}
            onSaleSuccess={handleSaleSuccess}
            reservationToConfirm={reservationToConfirm}
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
