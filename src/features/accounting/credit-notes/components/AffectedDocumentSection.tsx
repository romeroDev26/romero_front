// src/features/accounting/credit-notes/components/AffectedDocumentSection.tsx

import React from 'react';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { InvoiceSelector } from './InvoiceSelector';

interface AffectedDocumentSectionProps {
	control: Control<any>;
	errors: FieldErrors<any>;
	companyId: number;
	selectedInvoiceDetail: any;
	onInvoiceSelect: (invoiceDetail: any) => void;
	/** Si true, al seleccionar una factura se navegará a la página de anulación */
	redirectToAnnulOnSelect?: boolean;
}

export const AffectedDocumentSection: React.FC<AffectedDocumentSectionProps> = ({
	control,
	errors,
	companyId,
	selectedInvoiceDetail,
	onInvoiceSelect,
	redirectToAnnulOnSelect = false,
}) => {
	return (
		<div className="bg-white rounded-lg shadow p-6">
			<h2 className="text-lg font-semibold text-gray-900 mb-4">Documento Afectado</h2>
			
			{/* Selector de Factura */}
			<InvoiceSelector
				companyId={companyId}
				selectedInvoiceDetail={selectedInvoiceDetail}
				onInvoiceSelect={onInvoiceSelect}
				redirectToAnnulOnSelect={redirectToAnnulOnSelect}
			/>

			{/* Campos autocompletados (readonly) */}
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Tipo*</label>
					<Controller
						name="affected_document_type_code"
						control={control}
						render={({ field }) => (
							<select {...field} disabled className="w-full p-2 border border-gray-300 rounded-md bg-gray-50">
								<option value="01">01 - Factura</option>
								<option value="03">03 - Boleta</option>
							</select>
						)}
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Serie-Número*</label>
					<Controller
						name="affected_document_series_number"
						control={control}
						render={({ field }) => (
							<input 
								{...field} 
								placeholder="Seleccione una factura"
								disabled
								className="w-full p-2 border border-gray-300 rounded-md bg-gray-50" 
							/>
						)}
					/>
					{errors.affected_document_series_number && (
						<p className="text-sm text-red-600 mt-1">{errors.affected_document_series_number.message?.toString()}</p>
					)}
				</div>
			</div>
		</div>
	);
};
