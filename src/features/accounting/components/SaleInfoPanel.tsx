// src/features/accounting/components/SaleInfoPanel.tsx

import React from 'react';
import {
  ClockIcon,
  UserIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ArrowLongRightIcon,
  IdentificationIcon,
  PhoneIcon,
  CubeIcon,
  CheckCircleIcon,
  UserCircleIcon,
  PencilIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import { Ship } from 'lucide-react';
import { Invoice } from '../../../types';
import { Button } from '../../../components/common/Button';
import { getSaleKind } from '../../../utils/getSaleKind';
import { invoiceToSplitPaymentData } from '../../../utils/invoicePaymentMapper';
import { getPaymentMethodName } from '../../../utils/paymentMethods';
import { getCurrencySymbol } from '../../../utils/currency';
import { formatDateTime } from '../../../utils/formatDateTime';

type IconType = React.ComponentType<{ className?: string }>;

// Icono por código de método de pago (heroicons outline)
const PAYMENT_METHOD_ICONS: Record<string, IconType> = {
  EFE: BanknotesIcon,
  YAP: DevicePhoneMobileIcon,
  PLN: DevicePhoneMobileIcon,
  TRF: BuildingLibraryIcon,
  DEP: BuildingLibraryIcon,
  OTR: CreditCardIcon,
};

const getPaymentMethodIcon = (code: string): IconType => PAYMENT_METHOD_ICONS[code] || CreditCardIcon;

// Fila label → valor reutilizable dentro del panel
const InfoRow: React.FC<{
  icon?: IconType;
  label: string;
  value?: React.ReactNode;
  valueClassName?: string;
}> = ({ icon: Icon, label, value, valueClassName }) => (
  <div className="flex items-start justify-between gap-3 py-2">
    <span className="flex items-center gap-2 text-sm text-dm-text-secondary flex-shrink-0">
      {Icon && <Icon className="h-4 w-4 text-dm-text-muted" />}
      {label}
    </span>
    <span className={`text-sm text-dm-text-primary text-right min-w-0 break-words ${valueClassName ?? ''}`}>
      {value ?? '—'}
    </span>
  </div>
);

// Card de sección con el patrón nativo de la app
const SectionCard: React.FC<{
  title: string;
  icon: IconType;
  iconClassName?: string;
  className?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon: Icon, iconClassName, className, action, children }) => (
  <div className={`bg-dm-bg-primary rounded-lg shadow-sm border p-4 sm:p-6 ${className ?? 'border-dm-border-primary'}`}>
    <div className="flex items-center justify-between gap-3 mb-2">
      <div className="flex items-center space-x-2">
        <Icon className={`h-5 w-5 ${iconClassName ?? 'text-dm-text-secondary'}`} />
        <h2 className="font-semibold text-dm-text-primary">{title}</h2>
      </div>
      {action}
    </div>
    {children}
  </div>
);

interface SaleInfoPanelProps {
  invoice: Invoice;
  onEditPayment: () => void;
  canEditPayment: boolean;
  /** Muestra la card de Emisión (fecha, vendedor, sucursal). Default true.
   *  En el modal post-venta se omite: el vendedor acaba de emitir la venta. */
  showEmission?: boolean;
}

/**
 * Panel presentacional con la información estructurada de una venta.
 * Sin fetch ni estado: solo renderiza lo que ya devuelve GET /sunat/invoices/{id}.
 */
export const SaleInfoPanel: React.FC<SaleInfoPanelProps> = ({
  invoice,
  onEditPayment,
  canEditPayment,
  showEmission = true,
}) => {
  const currencySymbol = getCurrencySymbol(invoice.currency_code);
  const kind = getSaleKind(invoice);
  const firstItem = invoice.items?.[0];

  // --- Pago ---
  const paymentData = invoiceToSplitPaymentData(invoice);
  const paymentRows = [
    {
      key: 'm1',
      method: paymentData.paymentMethod1,
      amount: paymentData.amount1,
      operationCode: paymentData.operationCode1,
    },
    ...(paymentData.isSplitPayment
      ? [{
          key: 'm2',
          method: paymentData.paymentMethod2,
          amount: paymentData.amount2,
          operationCode: paymentData.operationCode2,
        }]
      : []),
  ];
  const totalPayable = Number(invoice.total_payable);
  const totalPaid = paymentRows.reduce((sum, row) => sum + row.amount, 0);
  const cuadra = Math.abs(totalPaid - totalPayable) < 0.01;

  // --- Detalle según tipo de venta ---
  const tramo = firstItem?.boarding_port_name && firstItem?.disembarking_port_name
    ? `${firstItem.boarding_port_name} → ${firstItem.disembarking_port_name}`
    : (firstItem?.boarding_port_name ?? firstItem?.disembarking_port_name ?? undefined);

  const docTypeLabel = invoice.client?.doc_type === '6' ? 'RUC' : 'DNI';

  return (
    <div className="space-y-4">
      {/* Emisión (opcional: se omite en el modal post-venta) */}
      {showEmission && (
      <SectionCard title="Emisión" icon={ClockIcon}>
        <div className="divide-y divide-dm-border-secondary">
          <InfoRow
            icon={CalendarDaysIcon}
            label="Fecha y hora"
            value={formatDateTime(invoice.issue_date, invoice.issue_time)}
          />
          <InfoRow
            icon={UserIcon}
            label="Realizado por"
            value={invoice.seller?.full_name}
          />
          <InfoRow
            icon={BuildingStorefrontIcon}
            label="Sucursal"
            value={invoice.branch_office_name}
          />
        </div>
      </SectionCard>
      )}

      {/* Pago (destacada) */}
      <SectionCard
        title="Pago"
        icon={CreditCardIcon}
        iconClassName="text-emerald-600 dark:text-emerald-400"
        className="border-emerald-300 dark:border-emerald-800"
        action={canEditPayment ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onEditPayment}
            className="flex items-center text-emerald-600 dark:text-emerald-400 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            title="Editar método de pago (solo control interno)"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Editar pago
          </Button>
        ) : undefined}
      >
        {invoice.payment_terms_description && (
          <div className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="text-dm-text-secondary">Condición</span>
            <span className="font-medium text-dm-text-primary">{invoice.payment_terms_description}</span>
          </div>
        )}

        <div className="space-y-2 mt-2">
          {paymentRows.map((row) => {
            const MethodIcon = getPaymentMethodIcon(row.method);
            return (
              <div
                key={row.key}
                className="flex items-center justify-between gap-3 rounded-lg bg-dm-bg-secondary px-3 py-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <MethodIcon className="h-5 w-5 text-dm-text-secondary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-dm-text-primary">
                      {getPaymentMethodName(row.method)}
                    </p>
                    {row.operationCode && (
                      <p className="text-xs text-dm-text-muted truncate" title={row.operationCode}>
                        Nro. op: {row.operationCode}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-dm-text-primary flex-shrink-0">
                  {currencySymbol} {Number(row.amount).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 pt-3 mt-2 border-t border-dm-border-primary">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-dm-text-secondary">
            {cuadra && <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />}
            Total pagado
          </span>
          <span className={`text-base font-bold ${cuadra ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {currencySymbol} {totalPaid.toFixed(2)}
          </span>
        </div>
      </SectionCard>

      {/* Detalle según tipo de venta */}
      {kind === 'pasaje' && (
        <SectionCard title="Viaje" icon={Ship} iconClassName="text-blue-600 dark:text-blue-400">
          <div className="divide-y divide-dm-border-secondary">
            <InfoRow icon={MapIcon} label="Ruta" value={firstItem?.route_name} />
            <InfoRow
              icon={Ship}
              label="Embarcación"
              value={firstItem?.vehicle_name
                ? `${firstItem.vehicle_name}${firstItem.seat_number ? ` · Asiento ${firstItem.seat_number}` : ''}`
                : undefined}
            />
            <InfoRow icon={ArrowLongRightIcon} label="Tramo" value={tramo} />
          </div>
        </SectionCard>
      )}

      {kind === 'encomienda' && (
        <SectionCard title="Encomienda" icon={CubeIcon} iconClassName="text-orange-600 dark:text-orange-400">
          <div className="divide-y divide-dm-border-secondary">
            <InfoRow
              icon={CubeIcon}
              label="Nº de encomienda"
              value={firstItem?.parcel_number != null ? String(firstItem.parcel_number) : undefined}
            />
            <InfoRow icon={UserIcon} label="Destinatario" value={firstItem?.recipient_name} />
            <InfoRow icon={IdentificationIcon} label="Documento" value={firstItem?.recipient_doc_number} />
            <InfoRow icon={PhoneIcon} label="Teléfono" value={firstItem?.recipient_phone} />
            <InfoRow icon={ArrowLongRightIcon} label="Tramo" value={tramo} />
          </div>
        </SectionCard>
      )}

      {/* Cliente y totales */}
      <SectionCard title="Cliente y totales" icon={UserCircleIcon}>
        <div className="pb-2 mb-1 border-b border-dm-border-secondary">
          <p className="text-sm font-medium text-dm-text-primary break-words">
            {invoice.client?.name ?? '—'}
          </p>
          {invoice.client?.doc_number && (
            <p className="text-xs text-dm-text-muted mt-0.5">
              {docTypeLabel} {invoice.client.doc_number}
            </p>
          )}
        </div>
        <div className="divide-y divide-dm-border-secondary">
          <InfoRow
            label="Op. exonerada"
            value={`${currencySymbol} ${Number(invoice.total_exonerated).toFixed(2)}`}
          />
          <div className="flex items-center justify-between gap-3 py-2">
            <span className="text-sm font-semibold text-dm-text-secondary">Total</span>
            <span className="text-base font-bold text-dm-text-primary">
              {currencySymbol} {totalPayable.toFixed(2)}
            </span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

export default SaleInfoPanel;
