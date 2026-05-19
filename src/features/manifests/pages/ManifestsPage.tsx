//src/features/manifests/pages/ManifestsPage.tsx
import React from 'react';
import {
  DocumentTextIcon,
  BuildingOfficeIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { Ship } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { useManifestsPage } from '../hooks/useManifestsPage';
import { DateNavigator } from '../components/DateNavigator';
import { TripManifestCard } from '../components/TripManifestCard';
import { formatDateLabel } from '../utils/dateUtils';

export const ManifestsPage: React.FC = () => {
  const {
    selectedBranch,
    showBranchSelector,
    setShowBranchSelector,
    branchSelectorRef,
    selectedDate,
    setSelectedDate,
    branches,
    isLoadingBranches,
    handleBranchChange,
    tripGroups,
    datesWithManifests,
    isLoading,
    isGenerating,
    handleGenerateManifest,
    handleDownloadPDF,
    navigateToTrip,
    dailyViewError,
  } = useManifestsPage();

  // Estado sin sucursal seleccionada
  if (!selectedBranch && !isLoadingBranches) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-[#efefef] rounded-[20px] p-10 sm:p-12">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-[#1F4690]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BuildingOfficeIcon className="w-8 h-8 text-[#1F4690]" strokeWidth={1.5} />
            </div>
            <h2
              className="text-[32px] font-medium text-[#202020] tracking-[-0.64px] leading-[1.19]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Selecciona una Sucursal
            </h2>
            <p className="mt-3 text-[15px] text-[#4d4d4d] leading-[1.33]">
              Para ver los manifiestos, primero debes seleccionar una sucursal activa.
            </p>
          </div>

          <div className="space-y-3">
            {branches?.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleBranchChange(branch)}
                className="w-full flex items-center gap-4 px-5 py-4 bg-white rounded-[12px] border border-[#e8e8e8] text-left hover:border-[#1F4690]/30 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 bg-[#f5f5f5] rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[#1F4690]/10 transition-colors">
                  <BuildingOfficeIcon
                    className="w-5 h-5 text-[#828282] group-hover:text-[#1F4690] transition-colors"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[15px] font-medium text-[#202020] truncate">
                    {branch.name}
                  </span>
                  <span className="block text-[13px] text-[#828282] mt-0.5">Sucursal disponible</span>
                </div>
                <ChevronRightIcon
                  className="w-5 h-5 text-[#c4c4c4] group-hover:text-[#1F4690] transition-colors shrink-0"
                  strokeWidth={1.5}
                />
              </button>
            ))}

            {(!branches || branches.length === 0) && (
              <div className="text-center py-8">
                <p className="text-[15px] text-[#828282]">No hay sucursales disponibles</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1F4690] rounded-xl flex items-center justify-center text-white shrink-0">
            <DocumentTextIcon className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div>
            <h1
              className="text-[28px] font-medium text-[#202020] tracking-[-0.56px] leading-[1.19]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Manifiestos
            </h1>
            <p className="text-[14px] text-[#4d4d4d]">Gestión diaria de manifiestos por viaje</p>
          </div>
        </div>

        {/* Selector de Sucursal */}
        <div className="relative w-full sm:w-auto" ref={branchSelectorRef}>
          <button
            onClick={() => setShowBranchSelector(!showBranchSelector)}
            className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-2 px-4 py-2.5 bg-white border border-[#e8e8e8] rounded-[12px] text-[14px] font-medium text-[#202020] hover:bg-[#f5f5f5] transition-colors"
          >
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="w-4 h-4 text-[#828282]" strokeWidth={1.5} />
              <span className="truncate max-w-[200px]">
                {selectedBranch?.name || 'Seleccionar Sucursal'}
              </span>
            </div>
            <ChevronDownIcon className="w-4 h-4 text-[#828282]" strokeWidth={1.5} />
          </button>

          {showBranchSelector && branches && (
            <div className="absolute left-0 right-0 sm:right-auto sm:w-64 mt-2 bg-white rounded-[12px] border border-[#e8e8e8] z-50 overflow-hidden shadow-lg">
              <div className="p-2.5 border-b border-[#f0f0f0]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#828282]">
                  Seleccionar Sucursal
                </p>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {branches.map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => handleBranchChange(branch)}
                    className={`w-full text-left px-3 py-2.5 text-[13px] hover:bg-[#f5f5f5] transition-colors flex items-center gap-2 ${
                      selectedBranch?.id === branch.id
                        ? 'bg-[#1F4690]/5 text-[#1F4690]'
                        : 'text-[#202020]'
                    }`}
                  >
                    <BuildingOfficeIcon className="w-4 h-4 text-[#828282] shrink-0" strokeWidth={1.5} />
                    <span className="truncate">{branch.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navegador de Fecha */}
      <DateNavigator
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        datesWithManifests={datesWithManifests}
      />

      {/* Fecha seleccionada (título secundario) */}
      <div className="px-1">
        <h2 className="text-[16px] font-semibold text-[#202020] capitalize">
          {formatDateLabel(selectedDate)}
        </h2>
        <p className="text-[13px] text-[#828282] mt-0.5">
          {tripGroups.length} viaje{tripGroups.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Lista de Viajes */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner size="lg" />
          <p className="mt-4 text-[14px] text-[#828282]">Cargando viajes y manifiestos...</p>
        </div>
      ) : dailyViewError ? (
        <div className="bg-white rounded-2xl border border-[#e8e8e8] p-12 text-center">
          <div className="w-16 h-16 bg-[#fff1f0] rounded-2xl flex items-center justify-center mx-auto mb-5">
            <DocumentTextIcon className="w-8 h-8 text-[#cf1322]" strokeWidth={1.5} />
          </div>
          <h3 className="text-[18px] font-medium text-[#202020] mb-2">
            Error al cargar los manifiestos
          </h3>
          <p className="text-[14px] text-[#828282] max-w-md mx-auto mb-4">
            El servidor no puede procesar la solicitud debido a un problema de configuración en la API.
          </p>
        </div>
      ) : tripGroups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e8e8e8] p-12 text-center">
          <div className="w-16 h-16 bg-[#f5f5f5] rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Ship className="w-8 h-8 text-[#c4c4c4]" strokeWidth={1.5} />
          </div>
          <h3 className="text-[18px] font-medium text-[#202020] mb-2">
            No hay viajes programados
          </h3>
          <p className="text-[14px] text-[#828282] max-w-sm mx-auto">
            No se encontraron viajes para{' '}
            <span className="font-medium text-[#4d4d4d]">{formatDateLabel(selectedDate)}</span>.
            <br />
            Selecciona otra fecha o verifica la programación.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {tripGroups.map((trip) => (
            <TripManifestCard
              key={trip.id}
              trip={trip}
              isGenerating={isGenerating}
              onGenerate={handleGenerateManifest}
              onDownloadPDF={handleDownloadPDF}
              onNavigateToTrip={navigateToTrip}
            />
          ))}
        </div>
      )}
    </div>
  );
};
