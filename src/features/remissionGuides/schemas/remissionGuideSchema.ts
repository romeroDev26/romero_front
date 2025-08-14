import { z } from 'zod';

export const remissionGuideItemSchema = z.object({
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  unit_code: z.string().min(1, 'La unidad es requerida'),
  description: z.string().min(1, 'La descripción es requerida'),
  internal_code: z.string().optional(),
  invoice_item_id: z.number().optional(),
});

export const remissionGuideSchema = z.object({
  document_type_code: z.string(),
  series: z.string().min(1, 'La serie es requerida'),
  issue_date: z.date({ required_error: 'La fecha de emisión es requerida' }),
  shipment_start_date: z.date({ required_error: 'La fecha de traslado es requerida' }),
  total_gross_weight: z.number().min(0.01, 'El peso bruto debe ser mayor a 0'),
  weight_unit_code: z.string(),
  
  sender_doc_type: z.string().min(1, 'Tipo de documento del remitente requerido'),
  sender_doc_number: z.string().min(1, 'Número de documento del remitente requerido'),
  sender_name: z.string().min(1, 'Nombre del remitente requerido'),
  
  recipient_doc_type: z.string().min(1, 'Tipo de documento del destinatario requerido'),
  recipient_doc_number: z.string().min(1, 'Número de documento del destinatario requerido'),
  recipient_name: z.string().min(1, 'Nombre del destinatario requerido'),

  origin_ubigeo: z.string().length(6, 'El Ubigeo de origen debe tener 6 dígitos'),
  origin_address: z.string().min(1, 'La dirección de origen es requerida'),
  destination_ubigeo: z.string().length(6, 'El Ubigeo de destino debe tener 6 dígitos'),
  destination_address: z.string().min(1, 'La dirección de destino es requerida'),

  transport_mode_code: z.string(),
  trip_id: z.number({ required_error: 'Debe seleccionar un viaje' }),
  vessel_id: z.number({ required_error: 'El viaje debe tener una embarcación' }),
  
  driver_doc_type: z.string().min(1, 'Tipo de documento del conductor requerido'),
  driver_doc_number: z.string().min(1, 'Número de documento del conductor requerido'),
  driver_name: z.string().min(1, 'Nombre del conductor requerido'),
  driver_license: z.string().min(1, 'Licencia del conductor requerida'),
  
  observation: z.string().optional(),
  items: z.array(remissionGuideItemSchema).min(1, 'Debe cargar al menos un ítem a la guía'),
});

export type RemissionGuideFormData = z.infer<typeof remissionGuideSchema>;
