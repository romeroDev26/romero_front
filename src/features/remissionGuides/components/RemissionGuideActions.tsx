// src/features/remissionGuides/components/RemissionGuideActions.tsx

import React, { useState } from 'react';
import { 
  ArrowPathIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  PaperAirplaneIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { RemissionGuideTransportista } from '../../../types';
import { 
  useProcessSunatGuide,
  useCheckTicketStatus,
  useProcessCdr
} from '../hooks/useRemissionGuides';
import RemissionGuideSunatStatusModal from './RemissionGuideSunatStatusModal.tsx';
import { RemissionGuidePDFModal } from './RemissionGuidePDFModal';

interface RemissionGuideActionsProps {
  guide: RemissionGuideTransportista;
  onView?: (guide: RemissionGuideTransportista) => void;
  onEdit?: (guide: RemissionGuideTransportista) => void;
  companyId: number;
  showLabels?: boolean;
  size?: 'sm' | 'md';
}

export const RemissionGuideActions: React.FC<RemissionGuideActionsProps> = ({
  guide,
  companyId,
  showLabels = false,
  size = 'sm'
}) => {
  const [showSunatModal, setShowSunatModal] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);

  const processSunatMutation = useProcessSunatGuide();
  const checkTicketMutation = useCheckTicketStatus();
  const processCdrMutation = useProcessCdr();

  const handleProcessSunat = () => {
    processSunatMutation.mutate({
      guideId: guide.id,
      data: { company_id: companyId }
    });
  };

  const handleCheckTicketStatus = () => {
    if (!guide.sunat_ticket) return;
    
    checkTicketMutation.mutate({
      guideId: guide.id,
      data: { 
        company_id: companyId,
        ticket: guide.sunat_ticket
      }
    });
  };

  const handleProcessCdr = () => {
    processCdrMutation.mutate({
      guideId: guide.id,
      data: { company_id: companyId }
    });
  };

  const getActionButtons = () => {
    const buttons = [];
    const isLoading = processSunatMutation.isPending || 
                     checkTicketMutation.isPending || 
                     processCdrMutation.isPending;

    // Ver detalles (siempre disponible)
    buttons.push(
      <Button
        key="view"
        variant="outline"
        size={size}
        onClick={() => setShowPDFModal(true)}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:bg-blue-950/30"
        title="Ver PDF de la guía"
      >
        <EyeIcon className="h-4 w-4" />
        {showLabels && <span className="ml-1">Ver PDF</span>}
      </Button>
    );

    // Acciones específicas según estado
    switch (guide.sunat_status) {
      case 'SIGNED':
        buttons.push(
          <Button
            key="process"
            variant="outline"
            size={size}
            onClick={handleProcessSunat}
            disabled={isLoading}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            title="Enviar a SUNAT"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
            {showLabels && <span className="ml-1">Enviar a SUNAT</span>}
          </Button>
        );
        break;

      case 'SENT':
        buttons.push(
          <Button
            key="check"
            variant="outline"
            size={size}
            onClick={handleCheckTicketStatus}
            disabled={isLoading || !guide.sunat_ticket}
            className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50"
            title="Consultar estado"
          >
            <ArrowPathIcon className="h-4 w-4" />
            {showLabels && <span className="ml-1">Consultar Estado</span>}
          </Button>
        );
        break;

      case 'ACCEPTED':
        buttons.push(
          <Button
            key="process-cdr"
            variant="outline"
            size={size}
            onClick={handleProcessCdr}
            disabled={isLoading}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:bg-blue-950/30"
            title="Procesar CDR"
          >
            <CheckCircleIcon className="h-4 w-4" />
            {showLabels && <span className="ml-1">Procesar CDR</span>}
          </Button>
        );
        break;

      case 'RECEIVED':
        // Botón para descargar CDR si está disponible
        if (guide.cdr_file_path) {
          buttons.push(
            <Button
              key="download-cdr"
              variant="outline"
              size={size}
              onClick={() => window.open(guide.cdr_file_path, '_blank')}
              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:text-green-300 hover:bg-green-50 dark:bg-green-950/30"
              title="Descargar CDR"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              {showLabels && <span className="ml-1">Descargar CDR</span>}
            </Button>
          );
        }
        break;
    }

    // Estado SUNAT (siempre disponible después de PENDING)
    if (guide.sunat_status !== 'PENDING') {
      buttons.push(
        <Button
          key="sunat-status"
          variant="outline"
          size={size}
          onClick={() => setShowSunatModal(true)}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:bg-indigo-950/30"
          title="Ver estado SUNAT"
        >
          <ClockIcon className="h-4 w-4" />
          {showLabels && <span className="ml-1">Estado SUNAT</span>}
        </Button>
      );
    }

    return buttons;
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        {getActionButtons()}
      </div>

      {/* Modal de estado SUNAT */}
      <RemissionGuideSunatStatusModal
        isOpen={showSunatModal}
        onClose={() => setShowSunatModal(false)}
        guide={guide}
        companyId={companyId}
      />

      {/* Modal de visualización de PDF */}
      <RemissionGuidePDFModal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        pdfUrl={guide.pdf_file_path || null}
        guideNumber={`${guide.series}-${String(guide.number).padStart(8, '0')}`}
        guideType="transportista"
      />
    </>
  );
};
