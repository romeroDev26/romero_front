import React from 'react';
import {
  PlusCircleIcon,
  MapIcon,
  ListBulletIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Modal } from '../../../../components/common/Modal';
import { AddStopModal } from './AddStopModal';
import { RouteMapView } from './RouteMapView';
import { RouteListView } from './RouteListView';
import { StopDetailModal } from './StopDetailModal';
import { StopEditModal } from './StopEditModal';
import { useRouteMap } from '../../hooks/useRouteMap';
import { RouteWithStops } from '../../../../services/routes.service';

interface RouteMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  route?: RouteWithStops;
}

export const RouteMapModal: React.FC<RouteMapModalProps> = ({ isOpen, onClose, route }) => {
  const {
    ports,
    stops,
    viewMode,
    setViewMode,
    selectedStop,
    isStopModalOpen,
    setIsStopModalOpen,
    editingStop,
    setEditingStop,
    isAddStopModalOpen,
    setIsAddStopModalOpen,
    draggedIndex,
    dragOverItem,
    dynamicRiverPath,
    zoomLevel,
    setZoomLevel,
    viewBox,
    isPanning,
    panOffset,
    mapContainerRef,
    getRiverPosition,
    isStopFixed,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleDragStart,
    handleDragOver,
    handleDrop,
    moveStopUp,
    moveStopDown,
    handleStopClick,
    openAddStopModal,
    handleAddStop,
    removeStop,
    updateStop,
    startEditing,
    saveEdit,
    handleSubmit,
    parseDurationForUI,
    resetView,
    isSaving,
  } = useRouteMap(isOpen, route);

  if (!isOpen || !route) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="6xl">
        <div className="h-[85dvh] sm:h-[90dvh] flex flex-col">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 sm:p-6 border-b border-[#e8e8e8] bg-white shrink-0">
            <div className="min-w-0">
              <h2
                className="text-[20px] sm:text-[24px] font-medium text-[#202020] tracking-[-0.48px] truncate"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Gestión de Ruta Fluvial
              </h2>
              <p className="text-[14px] sm:text-[15px] text-[#4d4d4d] mt-0.5 truncate">{route.name}</p>
              <div className="flex items-center gap-4 mt-1.5 text-[13px] text-[#828282]">
                <span className="flex items-center gap-1">
                  <MapIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {stops.length} paradas
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#e8e8e8] rounded-[20px] text-[13px] font-medium text-[#202020] hover:bg-[#f5f5f5] transition-colors"
              >
                {viewMode === 'map' ? (
                  <>
                    <ListBulletIcon className="h-4 w-4 text-[#1F4690]" strokeWidth={1.5} />
                    <span className="hidden sm:inline">Vista Lista</span>
                    <span className="sm:hidden">Lista</span>
                  </>
                ) : (
                  <>
                    <MapIcon className="h-4 w-4 text-[#1F4690]" strokeWidth={1.5} />
                    <span className="hidden sm:inline">Vista Mapa</span>
                    <span className="sm:hidden">Mapa</span>
                  </>
                )}
              </button>

              <button
                onClick={openAddStopModal}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1F4690] hover:bg-[#163672] text-white rounded-[20px] text-[13px] font-medium transition-colors"
              >
                <PlusCircleIcon className="h-4 w-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">Agregar Parada</span>
                <span className="sm:hidden">Agregar</span>
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-hidden">
            {viewMode === 'map' ? (
              <RouteMapView
                stops={stops}
                dynamicRiverPath={dynamicRiverPath}
                viewBox={viewBox}
                zoomLevel={zoomLevel}
                panOffset={panOffset}
                isPanning={isPanning}
                mapContainerRef={mapContainerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onZoomIn={() => setZoomLevel((prev) => Math.min(2, prev + 0.2))}
                onZoomOut={() => setZoomLevel((prev) => Math.max(0.3, prev - 0.2))}
                onResetView={resetView}
                onStopClick={handleStopClick}
                getRiverPosition={getRiverPosition}
                isStopFixed={isStopFixed}
              />
            ) : (
              <RouteListView
                stops={stops}
                ports={ports}
                draggedIndex={draggedIndex}
                dragOverItem={dragOverItem}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onStopClick={handleStopClick}
                onUpdateStop={updateStop}
                onRemoveStop={removeStop}
                isStopFixed={isStopFixed}
                parseDurationForUI={parseDurationForUI}
                moveStopUp={moveStopUp}
                moveStopDown={moveStopDown}
              />
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#e8e8e8] p-3 sm:p-4 bg-white shrink-0">
            <form onSubmit={(e) => handleSubmit(e, onClose)}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="text-[13px] text-[#828282]">
                  Ruta con <span className="font-medium text-[#202020]">{stops.length}</span> paradas
                  {stops.length > 2 && (
                    <span className="ml-1 text-[#1F4690]">({stops.length - 2} intermedias)</span>
                  )}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-4 py-2 text-[13px] font-medium text-[#202020] bg-white border border-[#e8e8e8] rounded-[10px] hover:bg-[#f5f5f5] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 sm:flex-none px-4 py-2 text-[13px] font-medium text-white bg-[#1F4690] rounded-[10px] hover:bg-[#163672] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </Modal>

      {/* Modales */}
      <StopDetailModal
        isOpen={isStopModalOpen}
        onClose={() => setIsStopModalOpen(false)}
        stop={selectedStop}
        stops={stops}
        isStopFixed={isStopFixed}
        onStartEditing={(stop) => {
          startEditing(stop);
          setIsStopModalOpen(false);
        }}
      />

      <StopEditModal
        editingStop={editingStop}
        onClose={() => setEditingStop(null)}
        onSave={saveEdit}
        ports={ports}
        onChange={setEditingStop}
      />

      <AddStopModal
        isOpen={isAddStopModalOpen}
        onClose={() => setIsAddStopModalOpen(false)}
        onAddStop={handleAddStop}
        existingStops={stops}
        ports={ports}
        insertPosition={stops.length - 1}
      />
    </>
  );
};
