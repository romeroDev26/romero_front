// src/features/fluvial/pages/SalesPointPage.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Users, FileText, Printer, AlertCircle, User, CreditCard, CheckCircle, ArrowLeft, X } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { 
  City, 
  AvailableTrip, 
  SeatType, 
  TripStop, 
  Client,
  ReservationFormData,
  SalesPointFormData 
} from '../../../types';

// ==================== DATOS ESTÁTICOS ====================
const CITIES: City[] = [
  { 
    id: 1, 
    name: 'Iquitos', 
    code: 'IQT', 
    ubigeo: '160101',
    department: 'Loreto',
    province: 'Maynas',
    country_code: 'PE',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  { 
    id: 2, 
    name: 'Nauta', 
    code: 'NAU', 
    ubigeo: '160201',
    department: 'Loreto',
    province: 'Loreto',
    country_code: 'PE',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  { 
    id: 3, 
    name: 'Yurimaguas', 
    code: 'YUR', 
    ubigeo: '160301',
    department: 'Loreto',
    province: 'Alto Amazonas',
    country_code: 'PE',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  { 
    id: 4, 
    name: 'Contamana', 
    code: 'CON', 
    ubigeo: '250101',
    department: 'Ucayali',
    province: 'Padre Abad',
    country_code: 'PE',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  { 
    id: 5, 
    name: 'Pucallpa', 
    code: 'PUC', 
    ubigeo: '250101',
    department: 'Ucayali',
    province: 'Coronel Portillo',
    country_code: 'PE',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

const AVAILABLE_TRIPS: AvailableTrip[] = [
  {
    trip_id: 1,
    trip_name: 'Expreso Amazonas - Yurimaguas-Tarapoto',
    route_name: 'Yurimaguas - Tarapoto',
    origin_city: 'Yurimaguas',
    destination_city: 'Tarapoto',
    vessel_name: 'Expreso Amazonas',
    departure_datetime: '2025-06-05T15:00:00Z',
    estimated_arrival_datetime: '2025-06-05T20:00:00Z',
    status: 'SCHEDULED',
    can_sell_tickets: true,
    auto_closed: false,
    total_available_seats: 24,
    total_reserved_seats: 4,
    total_confirmed_seats: 2,
    total_capacity: 30,
    sales_status: 'DISPONIBLE'
  },
  {
    trip_id: 2,
    trip_name: 'Río Grande - Yurimaguas-Iquitos',
    route_name: 'Yurimaguas - Iquitos',
    origin_city: 'Yurimaguas',
    destination_city: 'Iquitos',
    vessel_name: 'Río Grande',
    departure_datetime: '2025-06-05T08:30:00Z',
    estimated_arrival_datetime: '2025-06-05T18:30:00Z',
    status: 'SCHEDULED',
    can_sell_tickets: true,
    auto_closed: false,
    total_available_seats: 18,
    total_reserved_seats: 5,
    total_confirmed_seats: 2,
    total_capacity: 25,
    sales_status: 'DISPONIBLE'
  }
];

const SEAT_TYPES: SeatType[] = [
  { 
    id: 1, 
    name: 'Común', 
    code: 'COM', 
    price_multiplier: 1.0, 
    is_active: true, 
    display_order: 1,
    created_at: '2025-01-01T00:00:00Z'
  },
  { 
    id: 2, 
    name: 'Premium', 
    code: 'PREM', 
    price_multiplier: 1.5, 
    is_active: true, 
    display_order: 2,
    created_at: '2025-01-01T00:00:00Z'
  },
  { 
    id: 3, 
    name: 'Auxiliar', 
    code: 'AUX', 
    price_multiplier: 0.8, 
    is_active: true, 
    display_order: 3,
    created_at: '2025-01-01T00:00:00Z'
  }
];

// Datos simulados de paradas de viaje
const TRIP_STOPS: { [tripId: number]: TripStop[] } = {
  1: [
    { 
      id: 1, 
      trip_id: 1, 
      port_id: 1, 
      stop_order: 1, 
      estimated_arrival_time: '2025-06-05T15:00:00Z',
      estimated_departure_time: '2025-06-05T15:00:00Z'
    },
    { 
      id: 2, 
      trip_id: 1, 
      port_id: 2, 
      stop_order: 2, 
      estimated_arrival_time: '2025-06-05T16:30:00Z',
      estimated_departure_time: '2025-06-05T16:45:00Z'
    },
    { 
      id: 3, 
      trip_id: 1, 
      port_id: 3, 
      stop_order: 3, 
      estimated_arrival_time: '2025-06-05T18:00:00Z',
      estimated_departure_time: '2025-06-05T18:15:00Z'
    },
    { 
      id: 4, 
      trip_id: 1, 
      port_id: 4, 
      stop_order: 4, 
      estimated_arrival_time: '2025-06-05T19:30:00Z',
      estimated_departure_time: '2025-06-05T19:45:00Z'
    },
    { 
      id: 5, 
      trip_id: 1, 
      port_id: 5, 
      stop_order: 5, 
      estimated_arrival_time: '2025-06-05T20:00:00Z'
    }
  ],
  2: [
    { 
      id: 6, 
      trip_id: 2, 
      port_id: 3, 
      stop_order: 1, 
      estimated_arrival_time: '2025-06-05T08:30:00Z',
      estimated_departure_time: '2025-06-05T08:30:00Z'
    },
    { 
      id: 7, 
      trip_id: 2, 
      port_id: 2, 
      stop_order: 2, 
      estimated_arrival_time: '2025-06-05T14:00:00Z',
      estimated_departure_time: '2025-06-05T14:30:00Z'
    },
    { 
      id: 8, 
      trip_id: 2, 
      port_id: 1, 
      stop_order: 3, 
      estimated_arrival_time: '2025-06-05T18:30:00Z'
    }
  ]
};

// Mapeo de puertos para mostrar nombres
const PORT_NAMES: { [portId: number]: string } = {
  1: 'Iquitos',
  2: 'Nauta', 
  3: 'Yurimaguas',
  4: 'Contamana',
  5: 'Pucallpa'
};

const CLIENTS: Client[] = [
  {
    id: 1,
    doc_type: '1',
    doc_number: '12345678',
    name: 'Juan Pérez González',
    email: 'juan.perez@email.com',
    phone: '987654321',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 2,
    doc_type: '6',
    doc_number: '20123456789',
    name: 'Empresa ABC S.A.C.',
    email: 'ventas@empresaabc.com',
    phone: '065234567',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

// ==================== COMPONENTES ====================

// Selector de Ciudad
interface CitySelectorProps {
  selectedCity: City | null;
  onCityChange: (city: City) => void;
  cities: City[];
}

const CitySelector: React.FC<CitySelectorProps> = ({ selectedCity, onCityChange, cities }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {cities.map((city) => (
      <button
        key={city.id}
        onClick={() => onCityChange(city)}
        className={`p-6 rounded-lg border-2 transition-all ${
          selectedCity?.id === city.id
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
        }`}
      >
        <MapPin className="h-8 w-8 mx-auto mb-2" />
        <h3 className="font-semibold">{city.name}</h3>
        <p className="text-sm text-gray-500">{city.code}</p>
      </button>
    ))}
  </div>
);

// Tarjeta de Viaje
interface TripCardProps {
  trip: AvailableTrip;
  onSelect: (trip: AvailableTrip) => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onSelect }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="font-semibold text-lg text-gray-900">{trip.route_name}</h3>
        <p className="text-sm text-gray-600">{trip.vessel_name}</p>
      </div>
      <div className="flex gap-2">
        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Imprimir Manifiesto">
          <Printer className="h-5 w-5" />
        </button>
        <button className="p-2 text-gray-400 hover:text-orange-600 transition-colors" title="Aplazar Salida">
          <AlertCircle className="h-5 w-5" />
        </button>
      </div>
    </div>
    
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-gray-500" />
        <span className="text-sm">{new Date(trip.departure_datetime).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-gray-500" />
        <span className="text-sm">{trip.total_available_seats}/{trip.total_capacity} disponibles</span>
      </div>
    </div>
    
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-600">
        <span className="font-medium">{trip.origin_city}</span> → <span className="font-medium">{trip.destination_city}</span>
      </div>
      <Button
        onClick={() => onSelect(trip)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Seleccionar
      </Button>
    </div>
  </div>
);

// Selector de Asientos
interface SeatSelectorProps {
  seatTypes: SeatType[];
  selectedSeatType: SeatType | null;
  onSeatTypeChange: (seatType: SeatType) => void;
  basePrice: number;
}

const SeatSelector: React.FC<SeatSelectorProps> = ({ seatTypes, selectedSeatType, onSeatTypeChange, basePrice }) => (
  <div className="space-y-4">
    <h4 className="font-medium text-gray-700">Tipo de Asiento</h4>
    <div className="grid grid-cols-3 gap-3">
      {seatTypes.map((seatType) => (
        <button
          key={seatType.id}
          onClick={() => onSeatTypeChange(seatType)}
          className={`p-3 rounded-lg border-2 transition-all text-center ${
            selectedSeatType?.id === seatType.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="font-medium">{seatType.name}</div>
          <div className="text-sm text-gray-600">
            S/ {(basePrice * seatType.price_multiplier).toFixed(2)}
          </div>
        </button>
      ))}
    </div>
  </div>
);

// Modal de Reserva
interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: ReservationFormData) => void;
  tripInfo?: {
    route: string;
    departureTime: string;
    totalPrice: string;
  };
}

const ReservationModal: React.FC<ReservationModalProps> = ({ isOpen, onClose, onConfirm, tripInfo }) => {
  const [formData, setFormData] = useState({
    trip_id: 0,
    client_id: 0,
    boarding_stop_id: 0,
    disembarking_stop_id: 0,
    seat_type_id: 0,
    passenger_name: '',
    passenger_doc_type: '1',
    passenger_doc_number: '',
    advance_amount: 0,
    customer_phone: '',
    customer_email: ''
  });

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reservar Asiento" maxWidth="md">
      <div className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
            <select
              value={formData.passenger_doc_type}
              onChange={(e) => setFormData({...formData, passenger_doc_type: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="1">DNI</option>
              <option value="6">RUC</option>
              <option value="4">Carnet de Extranjería</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Documento</label>
            <input
              type="text"
              value={formData.passenger_doc_number}
              onChange={(e) => setFormData({...formData, passenger_doc_number: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Ingrese número"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombres Completos</label>
            <input
              type="text"
              value={formData.passenger_name}
              onChange={(e) => setFormData({...formData, passenger_name: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Nombres y apellidos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={formData.customer_phone}
              onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Número de contacto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adelanto (S/)</label>
            <input
              type="number"
              step="0.01"
              value={formData.advance_amount}
              onChange={(e) => setFormData({...formData, advance_amount: parseFloat(e.target.value) || 0})}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Monto del adelanto"
            />
          </div>

          {tripInfo && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm"><strong>Viaje:</strong> {tripInfo.route}</p>
              <p className="text-sm"><strong>Hora:</strong> {tripInfo.departureTime}</p>
              <p className="text-sm"><strong>Precio Total:</strong> S/ {tripInfo.totalPrice}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={() => onConfirm(formData as ReservationFormData)} 
            className="flex-1"
          >
            Confirmar Reserva
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Modal de Éxito
interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSale: () => void;
  saleData?: {
    clientName: string;
    docNumber: string;
    route: string;
    total: string;
  };
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, onNewSale, saleData }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="p-6 text-center">
        <div className="mb-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Venta Exitosa!</h3>
          <p className="text-gray-600">El pasaje ha sido generado correctamente</p>
        </div>

        {saleData && (
          <div className="bg-gray-50 p-4 rounded-md mb-6 text-left">
            <p className="text-sm"><strong>Cliente:</strong> {saleData.clientName}</p>
            <p className="text-sm"><strong>Documento:</strong> {saleData.docNumber}</p>
            <p className="text-sm"><strong>Viaje:</strong> {saleData.route}</p>
            <p className="text-sm"><strong>Total:</strong> S/ {saleData.total}</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              Imprimir Ticket
            </Button>
            <Button variant="outline" className="flex-1">
              Imprimir PDF
            </Button>
          </div>
          <Button onClick={onNewSale} className="w-full">
            Nueva Venta
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================
export const SalesPointPage: React.FC = () => {
  const [currentView, setCurrentView] = useState('citySelection');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTrip, setSelectedTrip] = useState<AvailableTrip | null>(null);
  const [selectedDestinationStop, setSelectedDestinationStop] = useState<TripStop | null>(null);
  const [selectedSeatType, setSelectedSeatType] = useState<SeatType | null>(null);
  const [clientData, setClientData] = useState({
    docType: '1',
    docNumber: '',
    name: '',
    phone: ''
  });
  
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<any>(null);

  // Cargar ciudad del localStorage
  useEffect(() => {
    const savedCity = localStorage.getItem('selectedFluvialCity');
    if (savedCity) {
      const city = JSON.parse(savedCity);
      setSelectedCity(city);
      setCurrentView('dashboard');
    }
  }, []);

  const handleCityChange = (city: City) => {
    setSelectedCity(city);
    localStorage.setItem('selectedFluvialCity', JSON.stringify(city));
    setCurrentView('dashboard');
  };

  const handleTripSelect = (trip: AvailableTrip) => {
    setSelectedTrip(trip);
    setCurrentView('ticketSale');
  };

  const handleDestinationChange = (stopId: string) => {
    if (!selectedTrip) return;
    const stops = TRIP_STOPS[selectedTrip.trip_id] || [];
    const stop = stops.find(s => s.id.toString() === stopId);
    setSelectedDestinationStop(stop || null);
  };

  const calculatePrice = () => {
    if (!selectedSeatType) return 0;
    const basePrice = 85.00; // Precio base simulado
    return basePrice * selectedSeatType.price_multiplier;
  };

  const handleReservation = (reservationData: ReservationFormData) => {
    console.log('Reserva creada:', reservationData);
    setShowReservationModal(false);
    
    const saleData = {
      clientName: reservationData.passenger_name,
      docNumber: reservationData.passenger_doc_number,
      route: selectedTrip?.route_name || '',
      total: calculatePrice().toFixed(2),
      type: 'reservation'
    };
    
    setLastSaleData(saleData);
    setShowSuccessModal(true);
  };

  const handleSale = () => {
    if (!clientData.name || !clientData.docNumber || !selectedSeatType || !selectedDestinationStop) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    const saleData = {
      clientName: clientData.name,
      docNumber: clientData.docNumber,
      route: `${selectedTrip?.origin_city} - ${selectedDestinationStop ? PORT_NAMES[selectedDestinationStop.port_id] : ''}`,
      total: calculatePrice().toFixed(2),
      type: 'sale'
    };
    
    setLastSaleData(saleData);
    setShowSuccessModal(true);
  };

  const handleNewSale = () => {
    setShowSuccessModal(false);
    setCurrentView('tripSelection');
    // Reset form
    setSelectedTrip(null);
    setSelectedDestinationStop(null);
    setSelectedSeatType(null);
    setClientData({ docType: '1', docNumber: '', name: '', phone: '' });
  };

  const clearForm = () => {
    setClientData({ docType: '1', docNumber: '', name: '', phone: '' });
    setSelectedSeatType(null);
    setSelectedDestinationStop(null);
  };

  // ==================== VISTAS ====================

  if (currentView === 'citySelection') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Punto de Ventas Fluvial</h1>
            <p className="text-gray-600">Seleccione la ciudad desde donde realizará las ventas</p>
          </div>
          <CitySelector 
            selectedCity={selectedCity}
            onCityChange={handleCityChange}
            cities={CITIES}
          />
        </div>
      </div>
    );
  }

  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold">Punto de Ventas - {selectedCity?.name}</h1>
                <p className="text-sm text-gray-600">Gestión de ventas de pasajes fluviales</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentView('citySelection')}
            >
              Cambiar Ciudad
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Viajes del día */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Viajes Programados para Hoy</h2>
              </div>
              <div className="p-6">
                <div className="grid gap-4">
                  {AVAILABLE_TRIPS.map((trip) => (
                    <TripCard
                      key={trip.trip_id}
                      trip={trip}
                      onSelect={handleTripSelect}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Botón Nueva Venta */}
            <div className="text-center">
              <Button
                onClick={() => setCurrentView('tripSelection')}
                className="px-8 py-4 text-lg font-semibold"
              >
                Nueva Venta de Pasaje
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'tripSelection') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">Seleccionar Viaje - {selectedCity?.name}</h1>
            <Button
              variant="outline"
              onClick={() => setCurrentView('dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Calendario */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-4">
                <Calendar className="h-6 w-6 text-blue-600" />
                <h2 className="text-lg font-semibold">Fecha de Viaje</h2>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="p-3 border border-gray-300 rounded-md text-lg"
              />
            </div>

            {/* Viajes Disponibles */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Viajes Disponibles</h2>
              <div className="grid gap-4">
                {AVAILABLE_TRIPS.map((trip) => (
                  <TripCard
                    key={trip.trip_id}
                    trip={trip}
                    onSelect={handleTripSelect}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'ticketSale' && selectedTrip) {
    const availableStops = TRIP_STOPS[selectedTrip.trip_id]?.filter(stop => stop.stop_order > 1) || [];
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold">Venta de Pasaje</h1>
              <p className="text-gray-600">{selectedTrip.route_name} - {new Date(selectedTrip.departure_datetime).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentView('tripSelection')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Formulario */}
              <div className="space-y-6">
                {/* Origen y Destino */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold mb-4">Ruta de Viaje</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
                      <input
                        type="text"
                        value={selectedTrip.origin_city || ''}
                        disabled
                        className="w-full p-3 bg-gray-100 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
                      <select
                        value={selectedDestinationStop?.id || ''}
                        onChange={(e) => handleDestinationChange(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                      >
                        <option value="">Seleccione destino</option>
                        {availableStops.map((stop) => (
                          <option key={stop.id} value={stop.id}>
                            {PORT_NAMES[stop.port_id]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Datos del Cliente */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold mb-4">Datos del Cliente</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Doc.</label>
                        <select
                          value={clientData.docType}
                          onChange={(e) => setClientData({...clientData, docType: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="1">DNI</option>
                          <option value="6">RUC</option>
                          <option value="4">C.E.</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                        <input
                          type="text"
                          value={clientData.docNumber}
                          onChange={(e) => setClientData({...clientData, docNumber: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder="Documento"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombres Completos</label>
                      <input
                        type="text"
                        value={clientData.name}
                        onChange={(e) => setClientData({...clientData, name: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Nombres y apellidos"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input
                        type="tel"
                        value={clientData.phone}
                        onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Número de contacto"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Selección de Asiento y Precio */}
              <div className="space-y-6">
                {/* Selector de Asientos */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <SeatSelector
                    seatTypes={SEAT_TYPES}
                    selectedSeatType={selectedSeatType}
                    onSeatTypeChange={setSelectedSeatType}
                    basePrice={85.00}
                  />
                </div>

                {/* Resumen de Precio */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h4 className="font-semibold mb-4">Resumen de Precio</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Precio base:</span>
                      <span>S/ 85.00</span>
                    </div>
                    {selectedSeatType && (
                      <div className="flex justify-between">
                        <span>Tipo {selectedSeatType.name}:</span>
                        <span>x{selectedSeatType.price_multiplier}</span>
                      </div>
                    )}
                    <hr />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span>S/ {calculatePrice().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={clearForm}
                    className="w-full"
                  >
                    Limpiar Datos
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowReservationModal(true)}
                    className="w-full"
                  >
                    Reservar
                  </Button>
                  <Button
                    onClick={handleSale}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Generar Venta
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modales */}
        <ReservationModal
          isOpen={showReservationModal}
          onClose={() => setShowReservationModal(false)}
          onConfirm={handleReservation}
          tripInfo={selectedTrip && selectedDestinationStop ? {
            route: `${selectedTrip.origin_city} - ${PORT_NAMES[selectedDestinationStop.port_id]}`,
            departureTime: new Date(selectedTrip.departure_datetime).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
            totalPrice: calculatePrice().toFixed(2)
          } : undefined}
        />

        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          onNewSale={handleNewSale}
          saleData={lastSaleData}
        />
      </div>
    );
  }

  return null;
};