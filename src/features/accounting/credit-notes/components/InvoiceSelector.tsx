// src/features/accounting/credit-notes/components/InvoiceSelector.tsx

import React, { useState } from 'react';
import { /*MagnifyingGlassIcon*/ } from '@heroicons/react/24/outline';
import { Modal } from '../../../../components/common/Modal';
import { useVoidableInvoices } from '../../hooks/useCreditNotes';
import { invoicesService } from '../../../../services/invoices.service';
import { toast } from 'react-toastify';

interface InvoiceSelectorProps {
	companyId: number;
	selectedInvoiceDetail: any;
	onInvoiceSelect: (invoiceDetail: any) => void;
	disabled?: boolean;
}

export const InvoiceSelector: React.FC<InvoiceSelectorProps> = ({
	companyId,
	selectedInvoiceDetail,
	onInvoiceSelect,
	disabled = false
}) => {
	const [showModal, setShowModal] = useState(false);
	const [search, setSearch] = useState('');
	const [loadingDetail, setLoadingDetail] = useState(false);

	const { data: voidableInvoices = [], isLoading } = useVoidableInvoices(companyId);

	const selectInvoice = async (invoice: any) => {
		try {
			setLoadingDetail(true);
			const invoiceDetail = await invoicesService.getById(invoice.id);
			onInvoiceSelect(invoiceDetail);
			setShowModal(false);
			setSearch('');
			toast.success('Datos de la factura cargados correctamente');
		} catch (error) {
			console.error('Error al cargar detalle de factura:', error);
			toast.error('Error al cargar los datos de la factura');
		} finally {
			setLoadingDetail(false);
		}
	};

	const filteredInvoices = voidableInvoices.filter(invoice =>
		invoice.series.toLowerCase().includes(search.toLowerCase()) ||
		invoice.number.toString().includes(search) ||
		invoice.client_name.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<>
			<div className="mb-4">
				<label className="block text-sm font-medium text-gray-700 mb-1">Buscar Factura*</label>
				<div className="flex">
					<div onClick={() => !disabled && setShowModal(true)} className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-50 cursor-pointer">
						{selectedInvoiceDetail ? (
							<div>
								<div className="font-medium">
									{selectedInvoiceDetail.series}-{String(selectedInvoiceDetail.number).padStart(8, '0')}
									<span className="ml-2 text-sm text-gray-500">
										({selectedInvoiceDetail.document_type_code === '01' ? 'Factura' : 'Boleta'})
									</span>
								</div>
								<div className="text-sm text-gray-500">
									{selectedInvoiceDetail.client?.name}  {new Intl.NumberFormat('es-PE', {
										style: 'currency',
										currency: 'PEN'
										}).format(selectedInvoiceDetail.total_payable)}
								</div>
							</div>
						) : (
							<div className="text-gray-400">Seleccionar factura a afectar...</div>
						)}
					</div>
				</div>
			</div>

			{/* Información de la factura seleccionada */}
			{selectedInvoiceDetail && (
				<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
					<h4 className="text-sm font-medium text-blue-800 mb-2">Información de la Factura</h4>
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-blue-700">Cliente:</span> {selectedInvoiceDetail.client?.name}
						</div>
						<div>
							<span className="text-blue-700">RUC/DNI:</span> {selectedInvoiceDetail.client?.doc_number}
						</div>
						<div>
							<span className="text-blue-700">Fecha:</span> {new Date(selectedInvoiceDetail.issue_date).toLocaleDateString('es-PE')}
						</div>
						<div>
							<span className="text-blue-700">Total:</span> {new Intl.NumberFormat('es-PE', {
								style: 'currency',
								currency: 'PEN'
							}).format(selectedInvoiceDetail.total_payable)}
						</div>
					</div>
				</div>
			)}

			{/* Modal de Selección */}
			<Modal
				isOpen={showModal}
				onClose={() => setShowModal(false)}
				title="Seleccionar Factura a Afectar"
			>
				<div className="space-y-4">
					<div>
						<input
							type="text"
							placeholder="Buscar por serie, número o cliente..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full p-2 border border-gray-300 rounded-md"
						/>
					</div>
					<div className="max-h-96 overflow-y-auto">
						{isLoading ? (
							<div className="text-center py-4">
								<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
								<p className="mt-2 text-gray-600">Cargando facturas...</p>
							</div>
						) : (
							<div className="space-y-2">
								{filteredInvoices.map(invoice => (
									<div
										key={invoice.id}
										onClick={() => selectInvoice(invoice)}
										className="p-3 hover:bg-gray-50 cursor-pointer border rounded-md transition-colors"
									>
										<div className="flex justify-between items-start">
											<div className="flex-1">
												<div className="font-medium">
													{invoice.series}-{String(invoice.number).padStart(8, '0')}
													<span className="ml-2 text-sm text-gray-500">
														({invoice.document_type_code === '01' ? 'Factura' : 'Boleta'})
													</span>
												</div>
												<div className="text-sm text-gray-600 mt-1">
													{invoice.client_name}
												</div>
												<div className="text-xs text-gray-500 mt-1">
													Emitida: {new Date(invoice.issue_date).toLocaleDateString('es-PE')}
												</div>
											</div>
											<div className="text-right">
												<div className="font-medium text-gray-900">
													{new Intl.NumberFormat('es-PE', {
														style: 'currency',
														currency: 'PEN'
													}).format(parseFloat(invoice.total_payable))}
												</div>
											</div>
										</div>
										{loadingDetail && (
											<div className="mt-2 text-xs text-blue-600">Cargando detalles...</div>
										)}
									</div>
								))}
								{filteredInvoices.length === 0 && (
									<div className="text-center py-8 text-gray-500">
										{voidableInvoices.length === 0 ? (
											<div>
												<div className="text-lg mb-2">📄</div>
												<div>No hay facturas disponibles para anular</div>
											</div>
										) : (
											<div>No se encontraron facturas que coincidan con la búsqueda</div>
										)}
									</div>
								)}
							</div>
						)}
					</div>
					
					<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
						<div className="text-sm text-yellow-800">
							<strong>Nota:</strong> Solo se muestran facturas que pueden ser afectadas por notas de crédito.
							Al seleccionar una factura, se cargarán automáticamente todos sus datos y productos.
						</div>
					</div>
				</div>
			</Modal>
		</>
	);
};
