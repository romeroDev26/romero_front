# Guía Frontend: Uso de Trip Stops para Facturas

Mira mi backend como tal me da esta estructura de datos para los viajes, y necesito que el frontend use correctamente los boarding_stop_id y disembarking_stop_id para crear facturas normales y de empresa.
## Resumen

Esta guía explica cómo el frontend debe obtener y usar correctamente los boarding_stop_id y disembarking_stop_id para crear *facturas normales* y *facturas de empresa* usando el endpoint existente.

*Aplica para:*
- ✅ Facturas normales: POST /api/v1/invoices/
- ✅ Facturas de empresa: POST /api/v1/invoices/company-with-representatives

## Endpoint a Utilizar

*No necesitas un nuevo endpoint.* Usa el endpoint existente:


GET /api/v1/operations/trips/{trip_id}


*Ejemplo:*

GET https://romeroapi-production.up.railway.app/api/v1/operations/trips/189


## Estructura de la Respuesta

El endpoint devuelve un objeto con la siguiente estructura relevante:

json
{
  "id": 189,
  "trip_name": "Nauta - Yurimaguas - 2025-07-26 18:00",
  "route": {
    "name": "Nauta - Yurimaguas",
    "origin_port_id": 14,
    "destination_port_id": 15
  },
  "stops": [
    {
      "id": 1269,
      "trip_id": 189,
      "port_id": 14,
      "stop_order": 1,
      "estimated_arrival_time": "2025-07-26T18:00:00-05:00",
      "estimated_departure_time": "2025-07-26T18:15:00-05:00",
      "port": {
        "name": "Nauta",
        "id": 14,
        "port_type": "PRIMARY_HUB"
      }
    },
    {
      "id": 1270,
      "trip_id": 189,
      "port_id": 17,
      "stop_order": 2,
      "port": {
        "name": "Arauante",
        "id": 17,
        "port_type": "SECONDARY_STOP"
      }
    }
    // ... más stops
  ]
}


## Información Clave del Array stops

Cada elemento en el array stops contiene:

- **id**: ✅ **Este es el trip_stop_id que necesitas** para boarding_stop_id y disembarking_stop_id
- **port.name**: Nombre del puerto para mostrar al usuario
- **stop_order**: Orden del stop en la ruta (1, 2, 3, etc.)
- **port_id*: ❌ **NO uses este* para la factura de empresa

## Ejemplo de Stops Disponibles (Trip 189)

| Stop Order | Stop ID | Puerto | Uso |
|------------|---------|--------|-----------|
| 1 | *1269* | Nauta | boarding_stop_id |
| 2 | *1270* | Arauante | boarding_stop_id o disembarking_stop_id |
| 3 | *1271* | Lagunas | boarding_stop_id o disembarking_stop_id |
| 4 | *1272* | Maypuco | boarding_stop_id o disembarking_stop_id |
| 5 | *1273* | Porgreso | boarding_stop_id o disembarking_stop_id |
| 6 | *1274* | Providencia | boarding_stop_id o disembarking_stop_id |
| 7 | *1275* | San Luis | boarding_stop_id o disembarking_stop_id |
| 8 | *1276* | Santa Cruz | boarding_stop_id o disembarking_stop_id |
| 9 | *1277* | Tamarate | boarding_stop_id o disembarking_stop_id |
| 10 | *1278* | Tipishca | boarding_stop_id o disembarking_stop_id |
| 11 | *1279* | Yurimaguas | disembarking_stop_id |

## Implementación en JavaScript/React

### 1. Obtener los Stops del Viaje

javascript
const fetchTripStops = async (tripId) => {
  try {
    const response = await fetch(`/api/v1/operations/trips/${tripId}`);
    const tripData = await response.json();
    
    // Extraer y ordenar los stops
    const stops = tripData.stops.sort((a, b) => a.stop_order - b.stop_order);
    
    return stops;
  } catch (error) {
    console.error('Error fetching trip stops:', error);
    throw error;
  }
};


### 2. Crear Opciones para Selectores

javascript
const createStopOptions = (stops) => {
  return stops.map(stop => ({
    value: stop.id, // ¡IMPORTANTE: usar stop.id, NO port_id!
    label: `${stop.port.name} (Parada ${stop.stop_order})`,
    stopOrder: stop.stop_order,
    portName: stop.port.name
  }));
};


### 3. Validación de Stops

javascript
const validateStops = (stops, boardingStopId, disembarkingStopId) => {
  const boardingStop = stops.find(s => s.id === boardingStopId);
  const disembarkingStop = stops.find(s => s.id === disembarkingStopId);
  
  if (!boardingStop || !disembarkingStop) {
    throw new Error('Stops no encontrados');
  }
  
  if (boardingStop.stop_order >= disembarkingStop.stop_order) {
    throw new Error('El stop de embarque debe ser anterior al de desembarque');
  }
  
  if (boardingStopId === disembarkingStopId) {
    throw new Error('Los stops de embarque y desembarque deben ser diferentes');
  }
  
  return true;
};


### 4. Componente React Ejemplo

jsx
import React, { useState, useEffect } from 'react';

const TripStopSelector = ({ tripId, onStopsChange }) => {
  const [stops, setStops] = useState([]);
  const [boardingStopId, setBoardingStopId] = useState('');
  const [disembarkingStopId, setDisembarkingStopId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStops = async () => {
      try {
        setLoading(true);
        const tripStops = await fetchTripStops(tripId);
        setStops(tripStops);
      } catch (error) {
        console.error('Error loading stops:', error);
      } finally {
        setLoading(false);
      }
    };

    if (tripId) {
      loadStops();
    }
  }, [tripId]);

  useEffect(() => {
    if (boardingStopId && disembarkingStopId) {
      try {
        validateStops(stops, parseInt(boardingStopId), parseInt(disembarkingStopId));
        onStopsChange({
          boardingStopId: parseInt(boardingStopId),
          disembarkingStopId: parseInt(disembarkingStopId)
        });
      } catch (error) {
        console.error('Validation error:', error.message);
        onStopsChange(null);
      }
    }
  }, [boardingStopId, disembarkingStopId, stops]);

  if (loading) return <div>Cargando stops...</div>;

  const stopOptions = createStopOptions(stops);

  return (
    <div>
      <div>
        <label>Stop de Embarque:</label>
        <select 
          value={boardingStopId} 
          onChange={(e) => setBoardingStopId(e.target.value)}
        >
          <option value="">Seleccionar...</option>
          {stopOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label>Stop de Desembarque:</label>
        <select 
          value={disembarkingStopId} 
          onChange={(e) => setDisembarkingStopId(e.target.value)}
        >
          <option value="">Seleccionar...</option>
          {stopOptions
            .filter(option => !boardingStopId || option.stopOrder > stops.find(s => s.id === parseInt(boardingStopId))?.stop_order)
            .map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          }
        </select>
      </div>
    </div>
  );
};


## JSON Final para Facturas

### Factura Normal

Para facturas normales, incluye los boarding_stop_id y disembarking_stop_id en cada item:

json
{
  "client_id": 123,
  "document_type_code": "01",
  "series": "F001",
  "issue_date": "2025-01-15",
  "currency_code": "PEN",
  "items": [
    {
      "trip_id": 189,
      "boarding_trip_stop_id": 1269,
      "disembarking_trip_stop_id": 1279,
      "seat_number": "A1",
      "seat_type_id": 1,
      "passenger_document_type": "DNI",
      "passenger_document_number": "12345678",
      "passenger_full_name": "Juan Pérez",
      "unit_price": 50.00,
      "quantity": 1
    }
  ]
}


### Factura de Empresa

Para facturas de empresa, los boarding_stop_id y disembarking_stop_id van a nivel raíz:

json
{
  "trip_id": 189,
  "boarding_stop_id": 1269,
  "disembarking_stop_id": 1279,
  "company_data": {
    "ruc": "20123456789",
    "business_name": "Empresa Test",
    "address": "Dirección Test"
  },
  "representatives": [
    {
      "document_type": "DNI",
      "document_number": "12345678",
      "full_name": "Juan Pérez",
      "seat_number": "A1"
    }
  ]
}


## Puntos Críticos a Recordar

### ✅ Hacer

1. **Usar stop.id** del array stops para boarding_stop_id y disembarking_stop_id
2. *Validar el orden:* boarding_stop_order < disembarking_stop_order
3. *Validar que sean diferentes:* boarding_stop_id ≠ disembarking_stop_id
4. *Mostrar nombres amigables* en la UI pero enviar los IDs correctos
5. *Manejar errores* de validación apropiadamente

### ❌ No Hacer

1. **NO usar port_id** para la factura de empresa
2. *NO usar IDs hardcodeados* de desarrollo
3. *NO permitir* que el stop de embarque sea posterior al de desembarque
4. *NO permitir* stops iguales para embarque y desembarque

## Errores Comunes y Soluciones

### Error: "Boarding stop not found: 14"

*Causa:* Estás enviando un port_id (14) en lugar del trip_stop_id (1269).

*Solución:* Usar stop.id del array stops, no port_id.

### Error: "Invalid stop order"

*Causa:* El stop de embarque tiene un stop_order mayor o igual al de desembarque.

*Solución:* Validar que boarding_stop_order < disembarking_stop_order.

### Error: "Stops must be different"

*Causa:* Estás enviando el mismo ID para embarque y desembarque.

*Solución:* Validar que boarding_stop_id ≠ disembarking_stop_id.

## Endpoints de Destino

Una vez que tengas los datos correctos, envía el JSON a:

### Para Facturas Normales:

POST /api/v1/invoices/


### Para Facturas de Empresa:

POST /api/v1/invoices/company-with-representatives


## Diferencias Clave

| Aspecto | Factura Normal | Factura de Empresa |
|---------|----------------|--------------------|
| *Stop IDs* | En cada item como boarding_trip_stop_id y disembarking_trip_stop_id | A nivel raíz como boarding_stop_id y disembarking_stop_id |
| *Pasajeros* | Un pasajero por item | Múltiples representantes |
| *Estructura* | Array de items con detalles individuales | Datos de empresa + array de representantes |
| *Validación* | Por cada item individualmente | Una vez para toda la factura |

Con este enfoque, el frontend podrá manejar correctamente los trip stops para ambos tipos de facturas sin necesidad de endpoints adicionales.