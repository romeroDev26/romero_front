import React, { useState } from 'react';
import { Ship } from 'lucide-react';
import { TripsCalendarReport } from './TripsCalendarReport';
import { VesselsRangeReport } from './VesselsRangeReport';

type OperationsTab = 'trips' | 'vessels';

export const OperationsReportsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<OperationsTab>('trips');

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl border border-dm-border-primary bg-dm-bg-secondary p-1">
        <TabButton
          active={activeTab === 'trips'}
          onClick={() => setActiveTab('trips')}
          label="Por viaje"
        />
        <TabButton
          active={activeTab === 'vessels'}
          onClick={() => setActiveTab('vessels')}
          label="Por embarcación"
          icon={<Ship className="h-4 w-4" />}
        />
      </div>

      {activeTab === 'trips' ? <TripsCalendarReport /> : <VesselsRangeReport />}
    </div>
  );
};

function TabButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-dm-bg-primary text-dm-text-primary shadow-sm'
          : 'text-dm-text-muted hover:text-dm-text-primary'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
