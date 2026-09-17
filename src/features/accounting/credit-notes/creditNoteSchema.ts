// src/features/accounting/credit-notes/creditNoteSchema.ts

import { z } from 'zod';

/**
 * Esquema de validación del formulario de nota de crédito, según la estructura
 * que espera el backend.
 *
 * Vive aparte de la página porque las secciones del formulario
 * (AffectedDocumentSection, ClientInfoSection, CreditNoteItemsSection,
 * CreditNoteReasonSection, CreditNoteSidebar) necesitan el tipo para declarar
 * sus props de react-hook-form. Antes lo tenían como `Control<any>`, con lo que
 * ningún nombre de campo se verificaba contra el esquema.
 */
export const creditNoteSchema = z.object({
	client_id: z.number().min(1, "Debe seleccionar un cliente."),
	series: z.string().min(1, "La serie es requerida."),
	currency_code: z.string().min(1, "La moneda es requerida."),
	affected_document_type_code: z.string().min(1, "Tipo de documento afectado requerido."),
	affected_document_series_number: z.string().min(1, "Serie y número del documento afectado requeridos."),
	credit_note_type_code: z.string().min(1, "Debe seleccionar un motivo."),
	reason: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
	items: z.array(z.object({
		product_id: z.number().min(1, "Debe seleccionar un producto."),
		quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0."),
		unit_code: z.string().min(1, "El código de unidad es requerido."),
		unit_price: z.number().min(0, "El precio unitario no puede ser negativo."),
		discount: z.number().min(0, "El descuento no puede ser negativo.").optional(),
		price_with_tax: z.number().min(0, "El precio con impuesto no puede ser negativo."),
		price_type_code: z.string().min(1, "El código de precio es requerido."),
		tax_category_code: z.string().min(1, "La categoría del impuesto es requerida."),
		description: z.string().min(1, "La descripción es requerida."),
	})).min(1, "Debe agregar al menos un item."),
	igv_applicable: z.boolean().optional(),
});

export type CreditNoteFormData = z.infer<typeof creditNoteSchema>;
