// src/features/fluvial/components/sales-point/SaleForm.tsx
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Ship, Clock, AlertTriangle, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../../../../components/common/Button';
import { BranchOffice } from '../../../../types';
import { AvailableTripByPort } from '../../../../services/trips.service';
import { PassengerDataForm } from './PassengerDataForm';
import { SeatAndFareSelector } from './SeatAndFareSelector';
import { PriceSummary } from './PriceSummary';
import { SunatDocType, SunatInvoiceType, SunatTaxCategory, SunatLegendCode } from '../../types/sunat.types';
import { useFindFare } from '../../hooks/useFindFare';
import { useTripDetails } from '../../hooks/useTripDetails';
import { useSeatTypesData } from '../../hooks/useSeatTypesData';

// Cambia la importación de ServiceCategory a un enum (si tienes acceso a los tipos)
// Si ServiceCategory es un type, define un enum aquí:
export enum ServiceCategoryEnum {
  PASAJES = 'PASAJES',
  // ...otros valores si existen...
}

// Tipado para el estado del formulario de pasajero
interface PassengerData {
  docType: string;
  docNumber: string;
  name: string;
  address: string;
}

interface SaleFormProps {
  trip: AvailableTripByPort;
  branch: BranchOffice;
  onBack: () => void;
  onSaleSuccess: () => void;
}

export const SaleForm: React.FC<SaleFormProps> = ({ trip, branch, onBack, onSaleSuccess }) => {
  const [selectedDestinationId, setSelectedDestinationId] = useState<number | null>(null);
  const [selectedSeatTypeId, setSelectedSeatTypeId] = useState<number | null>(null);
  const [passengerData, setPassengerData] = useState<PassengerData>({
    docType: SunatDocType.DNI,
    docNumber: '',
    name: '',
    address: '',
  });
  const [isExonerated, setIsExonerated] = useState(true);

  // Hook 1: Buscar tarifa
  const { data: foundFare } = useFindFare({
    originPortId: branch.port_id,
    destinationPortId: selectedDestinationId,
    serviceCategory: ServiceCategoryEnum.PASAJES
  });

  // Hook 2: Obtener detalles del viaje
  const { data: tripDetails } = useTripDetails(trip.id);

  // Hook 3: Obtener TODOS los tipos de asiento
  const { data: allSeatTypes = [] } = useSeatTypesData();

  // Lógica de cálculo de precio corregida
  const { basePrice, seatMultiplier } = useMemo(() => {
    const price = foundFare?.price ?? null;

    // Buscamos el multiplicador en la lista global de tipos de asiento
    const multiplier = allSeatTypes.find(st => st.id === selectedSeatTypeId)?.price_multiplier ?? 1.0;
    return { basePrice: price, seatMultiplier: multiplier };
  }, [foundFare, selectedSeatTypeId, allSeatTypes]);

  const handleConfirmSale = () => {
    if (!selectedDestinationId || !selectedSeatTypeId || !passengerData.name || !passengerData.docNumber) {
      alert("Por favor, complete todos los campos: Destino, Asiento y Datos del Cliente.");
      return;
    }

    const invoiceType = passengerData.docType === SunatDocType.RUC
      ? SunatInvoiceType.FACTURA
      : SunatInvoiceType.BOLETA;

    const finalPrice = basePrice ? basePrice * seatMultiplier : 0;
    const payload = {
      document_type_code: invoiceType,
      series: invoiceType === '01' ? 'F001' : 'B001',
      issue_date: format(new Date(), 'yyyy-MM-dd'),
      currency_code: 'PEN',
      items: [
        {
          quantity: 1,
          item_description: `Pasaje de ${branch.port?.name} a [Nombre Destino]`,
          unit_code: 'NIU',
          unit_price: finalPrice,
          tax_category_code: isExonerated ? SunatTaxCategory.EXONERADO : SunatTaxCategory.GRAVADO,
        }
      ],
      legends: [
        { code: SunatLegendCode.MONTO_EN_LETRAS, value: 'CIEN CON 00/100 SOLES' },
        ...(isExonerated ? [{ code: SunatLegendCode.LEYENDA_AMAZONIA_SERVICIOS, value: "SERVICIOS PRESTADOS EN LA AMAZONÍA PARA SER CONSUMIDOS EN LA MISMA" }] : [])
      ],
    };

    console.log("PAYLOAD A ENVIAR A SUNAT API:", JSON.stringify(payload, null, 2));
    alert("Venta confirmada. Revisa la consola para ver el payload.");
    onSaleSuccess();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6 pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Registrar Venta de Pasaje</h1>
          <p className="text-gray-600">Desde: <span className="font-semibold">{branch.name}</span></p>
        </div>
        <Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-6 flex items-center gap-4 text-sm">
        <Ship className="h-5 w-5 text-blue-700" />
        <span className="font-semibold">{trip.trip_name} ({trip.vessel_name})</span>
        <Clock className="h-5 w-5 text-blue-700 ml-auto" />
        <span>{format(new Date(trip.estimated_departure_time), 'dd/MM/yyyy hh:mm a')}</span>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <SeatAndFareSelector
              tripId={trip.id}
              originPortId={branch.port_id!}
              selectedDestinationId={selectedDestinationId}
              onDestinationChange={setSelectedDestinationId}
              selectedSeatTypeId={selectedSeatTypeId}
              onSeatTypeChange={setSelectedSeatTypeId}
            />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <PassengerDataForm
              passengerData={passengerData}
              setPassengerData={setPassengerData}
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-6">
            <PriceSummary
              basePrice={basePrice}
              seatMultiplier={seatMultiplier}
              isExonerated={isExonerated}
              onExoneratedChange={setIsExonerated}
            />
            <div className="space-y-3">
              <Button onClick={handleConfirmSale} className="w-full bg-green-600 hover:bg-green-700 text-lg py-3">
                <CreditCard className="h-5 w-5 mr-2"/>
                Generar y Cobrar
              </Button>
            </div>
            {!basePrice && (
              <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-md">
                <AlertTriangle className="h-4 w-4" />
                <span>Seleccione un destino para ver el precio.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
