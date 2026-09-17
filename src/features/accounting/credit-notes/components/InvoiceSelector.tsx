// src/features/accounting/credit-notes/components/InvoiceSelector.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { /*MagnifyingGlassIcon*/ } from '@heroicons/react/24/outline';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/common/Button';
import { useVoidableInvoices } from '../../hooks/useCreditNotes';
import { invoicesService } from '../../../../services/invoices.service';
import { toast } from '@/utils/sileo-toast';
import type { Invoice } from '../../../../types';
import type { VoidableInvoice } from '../../types';

interface InvoiceSelectorProps {
	companyId: number;
	selectedInvoiceDetail: Invoice | null;
	onInvoiceSelect: (invoiceDetail: Invoice) => void;
	disabled?: boolean;
	/**
	 * Si es true, al seleccionar una factura se cerrará el modal y se navegará
	 * automáticamente a `/accounting/credit-notes/annul` pasando el detalle
	 * de la factura en location.state as { affectedInvoice }
	 */
	redirectToAnnulOnSelect?: boolean;
}

export const InvoiceSelector: React.FC<InvoiceSelectorProps> = ({
	companyId,
	selectedInvoiceDetail,
	onInvoiceSelect,
	disabled = false
	, redirectToAnnulOnSelect = false
}) => {
	const [showModal, setShowModal] = useState(false);
	const [confirmInvoice, setConfirmInvoice] = useState<Invoice | null>(null);
	const [search, setSearch] = useState('');
	const [loadingDetail, setLoadingDetail] = useState(false);
	const navigate = useNavigate();

	const { data: voidableInvoices = [], isLoading } = useVoidableInvoices(companyId);

	// La lista entrega VoidableInvoice (solo se usa su id); el detalle completo
	// se pide despues con getById.
	const selectInvoice = async (invoice: VoidableInvoice) => {
		try {
			setLoadingDetail(true);
			const invoiceDetail = await invoicesService.getById(invoice.id);
			// Si se solicita redireccionar a la página de anulación, cerramos
			// el modal y navegamos enviando el detalle en location.state
			if (redirectToAnnulOnSelect) {
				// En lugar de navegar inmediatamente, mostramos un modal de confirmación
				setShowModal(false);
				setConfirmInvoice(invoiceDetail);
				return;
			}
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
				<label className="block text-sm font-medium text-dm-text-secondary mb-1">Buscar Factura*</label>
				<div className="flex">
					<div onClick={() => !disabled && setShowModal(true)} className="flex-1 p-2 border border-dm-border-primary rounded-md bg-dm-bg-secondary cursor-pointer">
						{selectedInvoiceDetail ? (
							<div>
								<div className="font-medium">
									{selectedInvoiceDetail.series}-{String(selectedInvoiceDetail.number).padStart(8, '0')}
									<span className="ml-2 text-sm text-dm-text-muted">
										({selectedInvoiceDetail.document_type_code === '01' ? 'Factura' : 'Boleta'})
									</span>
								</div>
								<div className="text-sm text-dm-text-muted">
									{selectedInvoiceDetail.client?.name} • {new Intl.NumberFormat('es-PE', {
										style: 'currency',
										currency: 'PEN'
										}).format(selectedInvoiceDetail.total_payable)}
								</div>
							</div>
						) : (
							<div className="text-dm-text-muted">Seleccionar factura a afectar...</div>
						)}
					</div>
				</div>
			</div>

			{/* Información de la factura seleccionada */}
			{selectedInvoiceDetail && (
				<div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg">
					<h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Información de la Factura</h4>
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-blue-700 dark:text-blue-300">Cliente:</span> {selectedInvoiceDetail.client?.name}
						</div>
						<div>
							<span className="text-blue-700 dark:text-blue-300">RUC/DNI:</span> {selectedInvoiceDetail.client?.doc_number}
						</div>
						<div>
							<span className="text-blue-700 dark:text-blue-300">Fecha:</span> {new Date(selectedInvoiceDetail.issue_date).toLocaleDateString('es-PE')}
						</div>
						<div>
							<span className="text-blue-700 dark:text-blue-300">Total:</span> {new Intl.NumberFormat('es-PE', {
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
							className="w-full p-2 border border-dm-border-primary rounded-md"
						/>
					</div>
					<div className="max-h-96 overflow-y-auto">
						{isLoading ? (
							<div className="text-center py-4">
								<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
								<p className="mt-2 text-dm-text-secondary">Cargando facturas...</p>
							</div>
						) : (
							<div className="space-y-2">
								{filteredInvoices.map(invoice => (
									<div
										key={invoice.id}
										onClick={() => selectInvoice(invoice)}
										className="p-3 hover:bg-dm-bg-hover cursor-pointer border rounded-md transition-colors"
									>
										<div className="flex justify-between items-start">
											<div className="flex-1">
												<div className="font-medium">
													{invoice.series}-{String(invoice.number).padStart(8, '0')}
													<span className="ml-2 text-sm text-dm-text-muted">
														({invoice.document_type_code === '01' ? 'Factura' : 'Boleta'})
													</span>
												</div>
												<div className="text-sm text-dm-text-secondary mt-1">
													{invoice.client_name}
												</div>
												<div className="text-xs text-dm-text-muted mt-1">
													Emitida: {new Date(invoice.issue_date).toLocaleDateString('es-PE')}
												</div>
											</div>
											<div className="text-right">
												<div className="font-medium text-dm-text-primary">
													{new Intl.NumberFormat('es-PE', {
														style: 'currency',
														currency: 'PEN'
													}).format(parseFloat(invoice.total_payable))}
												</div>
											</div>
										</div>
										{loadingDetail && (
											<div className="mt-2 text-xs text-blue-600 dark:text-blue-400">Cargando detalles...</div>
										)}
									</div>
								))}
								{filteredInvoices.length === 0 && (
									<div className="text-center py-8 text-dm-text-muted">
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
					
					<div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-3">
						<div className="text-sm text-yellow-800 dark:text-yellow-300">
							<strong>Nota:</strong> Solo se muestran facturas que pueden ser afectadas por notas de crédito.
							Al seleccionar una factura, se cargarán automáticamente todos sus datos y productos.
						</div>
					</div>
				</div>
			</Modal>

			{/* Modal de confirmación: muestra detalle y botón para anular (cuando redirectToAnnulOnSelect=true) */}
			<Modal
				isOpen={!!confirmInvoice}
				onClose={() => setConfirmInvoice(null)}
				title="Confirmar anulación">
				{confirmInvoice && (
					<div className="space-y-4">
						<div>
							<div className="font-medium">{confirmInvoice.series}-{String(confirmInvoice.number).padStart(8, '0')}</div>
							<div className="text-sm text-dm-text-secondary">Cliente: {confirmInvoice.client?.name}</div>
							<div className="text-sm text-dm-text-secondary">Doc: {confirmInvoice.client?.doc_number || ''}</div>
							{confirmInvoice.client?.address && (
								<div className="text-sm text-dm-text-secondary">Dirección: {confirmInvoice.client?.address}</div>
							)}
							<div className="text-sm text-dm-text-secondary">Total: {new Intl.NumberFormat('es-PE',{style: 'currency', currency: 'PEN'}).format(confirmInvoice.total_payable)}</div>
						</div>

						{/* Resumen breve de items/servicios */}
						{confirmInvoice.items && confirmInvoice.items.length > 0 && (
							<div className="mt-2 border-t pt-2">
								<div className="text-sm font-medium text-dm-text-secondary mb-1">Servicios / Ítems incluidos</div>
								<ul className="text-sm text-dm-text-secondary list-disc pl-5 space-y-1">
									{confirmInvoice.items.slice(0,5).map((it, idx) => (
										<li key={idx}>{it.item_description || it.product_name || 'Servicio'} — {it.quantity || ''} x {new Intl.NumberFormat('es-PE',{style: 'currency', currency: 'PEN'}).format(it.unit_price || it.price_with_tax || 0)}</li>
									))}
									{confirmInvoice.items.length > 5 && <li className="text-xs text-dm-text-muted">+{confirmInvoice.items.length - 5} más</li>}
								</ul>
							</div>
						)}

						<div className="flex justify-end space-x-3 pt-4 border-t">
							<Button variant="outline" onClick={() => setConfirmInvoice(null)}>Cancelar</Button>
							<Button onClick={() => { setConfirmInvoice(null); navigate('/accounting/credit-notes/annul', { state: { affectedInvoice: confirmInvoice, simplifiedAnnul: true } }); }}>
								Anular
							</Button>
						</div>
					</div>
				)}
			</Modal>
		</>
	);
};
