// src/features/accounting/credit-notes/components/CreditNoteReasonSection.tsx

import React from 'react';
import { Controller, Control, FieldErrors } from 'react-hook-form';

// Catálogo 09 de SUNAT para motivos de Nota de Crédito
const CREDIT_NOTE_REASONS = [
	{ code: '01', description: 'Anulación de la operación', help: 'Anulación total de la operación por devolución total de mercadería' },
	{ code: '02', description: 'Anulación por error en el RUC', help: 'Cuando se emitió el comprobante con un RUC incorrecto' },
	{ code: '03', description: 'Corrección por error en la descripción', help: 'Cuando hay errores en la descripción del producto/servicio' },
	{ code: '04', description: 'Descuento global', help: 'Aplicar un descuento general sobre toda la factura' },
	{ code: '05', description: 'Descuento por ítem', help: 'Aplicar descuento específico a productos individuales' },
	{ code: '06', description: 'Devolución total', help: 'Devolución completa de mercadería' },
	{ code: '07', description: 'Devolución por ítem', help: 'Devolución parcial de algunos productos específicos' },
	{ code: '08', description: 'Bonificación', help: 'Otorgar bonificaciones o créditos adicionales al cliente' },
	{ code: '09', description: 'Disminución en el valor', help: 'Reducción del valor por cambios en condiciones comerciales' },
	{ code: '10', description: 'Otros conceptos', help: 'Para otros conceptos no contemplados en los códigos anteriores' },
];

interface CreditNoteReasonSectionProps {
	control: Control<any>;
	errors: FieldErrors<any>;
	watch: (name: string) => any;
}

export const CreditNoteReasonSection: React.FC<CreditNoteReasonSectionProps> = ({
	control,
	errors,
	watch
}) => {
	return (
		<div className="bg-white rounded-lg shadow p-6">
			<h2 className="text-lg font-semibold text-gray-900 mb-4">Motivo de la Nota de Crédito</h2>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Motivo*</label>
					<Controller
						name="credit_note_type_code"
						control={control}
						render={({ field }) => (
							<select {...field} className="w-full p-2 border border-gray-300 rounded-md">
								{CREDIT_NOTE_REASONS.map(reason => (
									<option key={reason.code} value={reason.code}>
										{reason.code} - {reason.description}
									</option>
								))}
							</select>
						)}
					/>
					{errors.credit_note_type_code && (
						<p className="text-sm text-red-600 mt-1">{errors.credit_note_type_code.message?.toString()}</p>
					)}
					
					{/* Ayuda contextual */}
					{watch('credit_note_type_code') && (
						<div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
							<p className="text-sm text-blue-800">
								<strong>ℹ️ Información:</strong> {CREDIT_NOTE_REASONS.find(r => r.code === watch('credit_note_type_code'))?.help}
							</p>
						</div>
					)}
				</div>
				
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Descripción*</label>
					<Controller
						name="reason"
						control={control}
						render={({ field }) => (
							<textarea
								{...field}
								rows={3}
								className="w-full p-2 border border-gray-300 rounded-md"
								placeholder="Ej: Devolución total de productos por defecto de calidad"
							/>
						)}
					/>
					{errors.reason && (
						<p className="text-sm text-red-600 mt-1">{errors.reason.message?.toString()}</p>
					)}
				</div>
			</div>
		</div>
	);
};
