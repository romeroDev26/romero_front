import React from 'react';
import { RemissionGuideTripSelector } from './RemissionGuideTripSelector';
import { BranchOffice } from '../../../types';
import { AvailableTripByPort } from '../../../services/trips.service';

interface TripStepContentProps {
  selectedBranch: BranchOffice;
  onTripSelect: (trip: AvailableTripByPort) => void;
  onBack: () => void;
}

export const TripStepContent: React.FC<TripStepContentProps> = ({
  selectedBranch,
  onTripSelect,
  onBack,
}) => {
  return (
    <div className="max-w-7xl mx-auto">
      <RemissionGuideTripSelector
        branch={selectedBranch}
        onTripSelect={onTripSelect}
        onBack={onBack}
      />
    </div>
  );
};
