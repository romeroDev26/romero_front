// src/features/cargo/types/cargo-ui.types.ts

import { ProductService } from "../../../types";

// Representa los datos de un destinatario que se capturan en el formulario.
export interface RecipientData {
  isSameAsSender: boolean;
  name: string;
  docType: string;
  docNumber: string;
  phone: string;
}

// Representa una línea de encomienda en la pantalla de venta.
// No se guarda en la base de datos, es solo para el estado de la UI.
export interface CargoItemData {
  id: string; // Un ID temporal para manejar el estado en el frontend (ej. crypto.randomUUID())
  product: ProductService; // El servicio de encomienda seleccionado (ej. "Envío Mediano")
  quantity: number;
  description: string; // Descripción específica del paquete (ej. "Caja con repuestos")
  price: number; // Precio unitario del servicio
  recipient: RecipientData;
}