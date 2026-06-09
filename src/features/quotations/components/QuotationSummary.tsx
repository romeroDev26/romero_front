import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { Spinner } from '../../../components/common/Spinner';
import { SimpleItem } from './QuotationItemsManager';

interface QuotationSummaryProps {
  items: SimpleItem[];
  includeIGV: boolean;
  isLoading: boolean;
  isDisabled: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  className?: string;
  compact?: boolean;
  showSecurity?: boolean;
  stickySidebar?: boolean;
}

export const QuotationSummary: React.FC<QuotationSummaryProps> = ({
  items,
  includeIGV,
  isLoading,
  isDisabled,
  onSubmit,
  onCancel,
  className,
  compact = false,
  showSecurity = true,
  stickySidebar = false,
}) => {
  const subtotal = items.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0);
  const totalDiscount = items.reduce((sum, item) => sum + item.descuento, 0);
  const net = subtotal - totalDiscount;
  const igv = includeIGV ? net * 0.18 : 0;
  const total = net + igv;

  const fmt = (n: number) =>
    `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className={`${className || 'space-y-6'} h-full`}>
      {/* Tarjeta principal resumen */}
      <div className={`bg-dm-bg-primary rounded-xl border border-dm-border-primary shadow-sm ${stickySidebar ? 'sticky top-6' : ''} ${compact ? 'p-4' : 'p-6'}`}>
        <div className={`${stickySidebar ? 'max-h-[calc(100vh-120px)] overflow-y-auto' : ''}`}>
        <h3 className={`font-bold text-dm-text-primary ${compact ? 'text-base mb-4' : 'text-lg mb-6'}`}>Resumen</h3>

        {/* Números */}
        <div className={`text-sm ${compact ? 'space-y-2.5' : 'space-y-4'}`}>
          <div className="flex justify-between text-dm-text-muted">
            <span>Subtotal</span>
            <span className="text-dm-text-primary font-medium">{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between text-dm-text-muted">
            <span>Descuentos</span>
            <span className="text-dm-text-primary font-medium">-{fmt(totalDiscount)}</span>
          </div>
          {includeIGV && (
            <div className="flex justify-between text-dm-text-muted">
              <span>IGV (18%)</span>
              <span className="text-dm-text-primary font-medium">{fmt(igv)}</span>
            </div>
          )}
          <div className={`border-t border-dm-border-secondary flex justify-between items-end ${compact ? 'pt-2' : 'pt-4'}`}>
            <span className="font-bold text-dm-text-primary">Total Neto</span>
            <span className="text-2xl font-black text-primary">{fmt(total)}</span>
          </div>
        </div>

        {/* Botones */}
        <div className={`${compact ? 'mt-4' : 'mt-8'} space-y-3`}>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isDisabled || isLoading}
            className={`w-full flex items-center justify-center gap-2 px-4 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${compact ? 'py-3.5' : 'py-3'}`}
          >
            {isLoading ? (
              <Spinner size="sm" color="text-white" />
            ) : (
              <PaperAirplaneIcon className="h-4 w-4" />
            )}
            {isLoading ? 'Creando...' : 'Crear Cotización'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className={`w-full px-4 text-sm font-semibold text-dm-text-secondary bg-dm-bg-secondary hover:bg-dm-bg-hover rounded-lg transition-all ${compact ? 'py-3' : 'py-3'}`}
          >
            Cancelar Operación
          </button>
        </div>

        {/* Seguridad */}
        {showSecurity && (
          <div className="mt-8 flex items-start gap-3 bg-primary/5 border border-primary/10 rounded-lg p-4">
            <ShieldCheckIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wide">Seguridad</p>
              <p className="text-[10px] text-dm-text-muted leading-tight mt-0.5">
                Esta cotización cumple con los estándares fiscales vigentes.
              </p>
            </div>
          </div>
        )}
        </div>
      </div>

    </div>
  );
};
