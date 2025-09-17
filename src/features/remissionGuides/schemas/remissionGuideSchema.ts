import { z } from 'zod';

export const remissionGuideItemSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  unit_measure: z.string().min(1, 'La unidad de medida es requerida'),
  unit_code: z.string().min(1, 'El código de unidad es requerido'),
  weight: z.number().min(0, 'El peso debe ser mayor o igual a 0'),
  unit_weight: z.number().min(0, 'El peso unitario debe ser mayor o igual a 0').optional(),
  product_code: z.string().optional(),
  internal_code: z.string().optional(),
  invoice_item_id: z.number().optional(),
});

export const remissionGuidePartySchema = z.object({
  document_type_code: z.string().min(1, 'Tipo de documento requerido'),
  document_number: z.string().min(1, 'Número de documento requerido'),
  business_name: z.string().min(1, 'Nombre o razón social requerido'),
});

export const remissionGuideAddressSchema = z.object({
  ubigeo_code: z.string().length(6, 'El código ubigeo debe tener 6 dígitos'),
  address: z.string().min(1, 'La dirección es requerida'),
});

export const remissionGuideTransportistaSchema = z.object({
  document_type_code: z.literal('31'),
  series: z.string().min(1, 'La serie es requerida'),
  issue_date: z.date({ required_error: 'La fecha de emisión es requerida' }),
  transfer_reason_code: z.string().min(1, 'El código de motivo de traslado es requerido'),
  transfer_reason_description: z.string().min(1, 'La descripción del motivo de traslado es requerida'),
  transfer_start_date: z.date({ required_error: 'La fecha de inicio de traslado es requerida' }),
  gross_total_weight: z.number().min(0.01, 'El peso bruto total debe ser mayor a 0'),
  number_of_packages: z.number().min(1, 'El número de paquetes debe ser mayor a 0'),
  transport_mode_code: z.string().min(1, 'El código de modo de transporte es requerido'),
  sender: remissionGuidePartySchema,
  receiver: remissionGuidePartySchema,
  origin_address: remissionGuideAddressSchema,
  destination_address: remissionGuideAddressSchema,
  driver_doc_type: z.string().min(1, 'Tipo de documento del conductor requerido'),
  driver_doc_number: z.string().min(1, 'Número de documento del conductor requerido'),
  driver_name: z.string().min(1, 'Nombre del conductor requerido'),
  driver_license: z.string().min(1, 'Licencia del conductor requerida'),
  observation: z.string().optional(),
  items: z.array(remissionGuideItemSchema).min(1, 'Debe incluir al menos un ítem'),
  // Campos opcionales para el formulario
  trip_id: z.number().optional(),
  vessel_id: z.number().optional(),
  branch_office_id: z.number().optional(),
  document_series_id: z.number().optional(),
});

export const remissionGuideRemitenteSchema = z.object({
  document_type_code: z.literal('09'),
  series: z.string().min(1, 'La serie es requerida'),
  issue_date: z.date({ required_error: 'La fecha de emisión es requerida' }),
  transfer_reason_code: z.string().min(1, 'El código de motivo de traslado es requerido'),
  transfer_reason_description: z.string().min(1, 'La descripción del motivo de traslado es requerida'),
  transfer_start_date: z.date({ required_error: 'La fecha de inicio de traslado es requerida' }),
  gross_total_weight: z.number().min(0.01, 'El peso bruto total debe ser mayor a 0'),
  number_of_packages: z.number().min(1, 'El número de paquetes debe ser mayor a 0'),
  transport_mode_code: z.string().min(1, 'El código de modo de transporte es requerido'),
  sender: remissionGuidePartySchema,
  receiver: remissionGuidePartySchema,
  origin_address: remissionGuideAddressSchema,
  destination_address: remissionGuideAddressSchema,
  driver_doc_type: z.string().min(1, 'Tipo de documento del conductor requerido'),
  driver_doc_number: z.string().min(1, 'Número de documento del conductor requerido'),
  driver_name: z.string().min(1, 'Nombre del conductor requerido'),
  driver_license: z.string().min(1, 'Licencia del conductor requerida'),
  observation: z.string().optional(),
  related_voucher: z.string().optional(),
  items: z.array(remissionGuideItemSchema).min(1, 'Debe incluir al menos un ítem'),
  // Campos opcionales para el formulario
  trip_id: z.number().optional(),
  vessel_id: z.number().optional(),
  branch_office_id: z.number().optional(),
  document_series_id: z.number().optional(),
});

export type RemissionGuideTransportistaFormData = z.infer<typeof remissionGuideTransportistaSchema>;
export type RemissionGuideRemitenteFormData = z.infer<typeof remissionGuideRemitenteSchema>;
