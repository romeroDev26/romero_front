// src/features/accounting/credit-notes/pages/CreditNoteNewPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
	MagnifyingGlassIcon,
	ArrowLeftIcon,
	CreditCardIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { useVoidableInvoices } from '../../hooks/useCreditNotes';
import { VoidableInvoice } from '../../types';
import { invoicesService } from '../../../../services/invoices.service';

export const CreditNoteNewPage: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [companyId] = useState(1); // TODO: Obtener del contexto de usuario
	const [searchTerm, setSearchTerm] = useState('');
  
	// Verificar si se pasó un invoice_id específico
	const invoiceIdParam = searchParams.get('invoice_id');
  
	const { data: voidableInvoices, isLoading } = useVoidableInvoices(companyId);

	// Si se pasó un invoice_id específico, navegar directamente al formulario (anulación simplificada)
	useEffect(() => {
		if (invoiceIdParam && voidableInvoices) {
			const selectedInvoice = voidableInvoices.find(inv => inv.id === parseInt(invoiceIdParam));
			if (selectedInvoice) {
				// mantener el comportamiento actual: navegar directamente a la anulación
				handleSelectInvoice(selectedInvoice);
			}
		}
	}, [invoiceIdParam, voidableInvoices]);

	// Estado para selector modal de tipo de nota
	const [modalOpen, setModalOpen] = useState(false);
	const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<any | null>(null);
	const [selectedType, setSelectedType] = useState('01');
	const [loadingInvoiceDetail, setLoadingInvoiceDetail] = useState(false);

	const creditNoteTypes: { code: string; label: string; description: string }[] = [
		{ code: '01', label: 'Anulación de la operación', description: 'Anulación total de la operación (usa endpoint simplificado).' },
		{ code: '02', label: 'Anulación por error en el RUC', description: 'Emitida cuando el RUC del cliente es incorrecto.' },
		{ code: '03', label: 'Corrección por error en la descripción', description: 'Corrección en la descripción del producto/servicio.' },
		{ code: '04', label: 'Descuento global', description: 'Aplicar descuento global sobre toda la factura.' },
		{ code: '05', label: 'Descuento por ítem', description: 'Aplicar descuento específico a productos individuales.' },
		{ code: '06', label: 'Devolución total', description: 'Devolución completa de mercadería.' },
		{ code: '07', label: 'Devolución por ítem', description: 'Devolución parcial de algunos productos específicos.' },
		{ code: '08', label: 'Bonificación', description: 'Otorgar bonificaciones o créditos adicionales al cliente.' },
		{ code: '09', label: 'Disminución en el valor', description: 'Reducción del valor por cambios en condiciones comerciales.' },
		{ code: '10', label: 'Otros conceptos', description: 'Otros ajustes no contemplados en códigos anteriores.' },
	];

	const openTypeSelector = (invoice: VoidableInvoice) => {
		setSelectedType('01');
		setModalOpen(true);
		// fetch invoice detail to have items before editing (recommended)
		(async () => {
			try {
				setLoadingInvoiceDetail(true);
				const detail = await invoicesService.getById(invoice.id);
				setSelectedInvoiceForModal(detail || invoice);
			} catch (e) {
				console.error('Could not fetch invoice detail', e);
				setSelectedInvoiceForModal(invoice);
			} finally {
				setLoadingInvoiceDetail(false);
			}
		})();
	};

	const filteredInvoices = voidableInvoices?.filter((invoice) =>
		invoice.series.toLowerCase().includes(searchTerm.toLowerCase()) ||
		invoice.number.toString().includes(searchTerm) ||
		invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase())
	) || [];

	const buildAffectedInvoice = (invoice: VoidableInvoice) => ({
		id: invoice.id,
		series: invoice.series,
		number: invoice.number,
		document_type_code: invoice.document_type_code,
		company_id: companyId,
		client: {
			id: 0, // No disponible en VoidableInvoice
			name: invoice.client_name,
			doc_number: '', // No disponible
		},
		total_payable: parseFloat(invoice.total_payable),
		issue_date: invoice.issue_date,
	});

	// Navegación directa a anulación (comportamiento original)
	const handleSelectInvoice = (invoice: VoidableInvoice) => {
		const affectedInvoice = buildAffectedInvoice(invoice);
		navigate('/accounting/credit-notes/annul', {
			state: { affectedInvoice }
		});
	};

	const handleConfirmType = () => {
		if (!selectedInvoiceForModal) return;
		const affectedInvoice = buildAffectedInvoice(selectedInvoiceForModal);
		setModalOpen(false);

		if (selectedType === '01') {
			// usar endpoint simplificado - mantener flujo existente
			navigate('/accounting/credit-notes/annul', { state: { affectedInvoice } });
		} else {
			// para otros tipos abrir el formulario completo donde se podrá editar items/montos
			const stateToSend: any = { selectedType };
			// si ya cargamos el detalle, pásalo para evitar otro fetch
			if (selectedInvoiceForModal && selectedInvoiceForModal.id === affectedInvoice.id) {
				stateToSend.affectedInvoice = selectedInvoiceForModal;
			} else {
				stateToSend.affectedInvoice = affectedInvoice;
			}

			navigate('/accounting/credit-notes/create', { state: stateToSend });
		}
	};

	const formatCurrency = (amount: string) => {
		return new Intl.NumberFormat('es-PE', {
			style: 'currency',
			currency: 'PEN'
		}).format(parseFloat(amount));
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('es-PE');
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center">
					<Button
						variant="outline"
						onClick={() => navigate('/accounting/credit-notes')}
						className="mr-4"
					>
						<ArrowLeftIcon className="h-4 w-4" />
					</Button>
					<div>
						<h1 className="text-3xl font-bold text-gray-900">Nueva Nota de Crédito</h1>
						<p className="text-gray-600">Selecciona la factura que deseas anular</p>
					</div>
				</div>
			</div>

			{/* Buscador */}
			<div className="bg-white rounded-lg shadow p-6">
				<div className="flex items-center space-x-4">
					<div className="flex-1">
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Buscar factura
						</label>
						<div className="relative">
							<MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
							<input
								type="text"
								placeholder="Buscar por serie, número o cliente..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Lista de Facturas */}
			<div className="bg-white rounded-lg shadow">
				<div className="px-6 py-4 border-b border-gray-200">
					<h2 className="text-lg font-semibold text-gray-900">
						Facturas Disponibles para Anular
					</h2>
					<p className="text-sm text-gray-600 mt-1">
						Solo se muestran facturas que pueden ser anuladas
					</p>
				</div>

				{isLoading ? (
					<div className="p-8 text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
						<p className="mt-2 text-gray-600">Cargando facturas...</p>
					</div>
				) : filteredInvoices.length === 0 ? (
					<div className="p-8 text-center">
						{voidableInvoices?.length === 0 ? (
							<div>
								<CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
								<h3 className="text-lg font-medium text-gray-900 mb-2">
									No hay facturas para anular
								</h3>
								<p className="text-gray-600">
									No se encontraron facturas que puedan ser anuladas en este momento.
								</p>
							</div>
						) : (
							<div>
								<MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
								<h3 className="text-lg font-medium text-gray-900 mb-2">
									No se encontraron resultados
								</h3>
								<p className="text-gray-600">
									No hay facturas que coincidan con tu búsqueda.
								</p>
							</div>
						)}
					</div>
				) : (
					<div className="divide-y divide-gray-200">
						{filteredInvoices.map((invoice) => (
							<div
								key={invoice.id}
								className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
								onClick={() => openTypeSelector(invoice)}
							>
								<div className="flex items-center justify-between">
									<div className="flex-1">
										<div className="flex items-center space-x-4">
											<div>
												<div className="text-sm font-medium text-gray-900">
													{invoice.series}-{String(invoice.number).padStart(8, '0')}
												</div>
												<div className="text-sm text-gray-500">
													{invoice.document_type_code === '01' ? 'Factura' : 'Boleta'}
												</div>
											</div>
											<div className="flex-1">
												<div className="text-sm font-medium text-gray-900">
													{invoice.client_name}
												</div>
												<div className="text-sm text-gray-500">
													Emitida el {formatDate(invoice.issue_date)}
												</div>
											</div>
											<div className="text-right">
												<div className="text-sm font-medium text-gray-900">
													{formatCurrency(invoice.total_payable)}
												</div>
												<div className="text-sm text-gray-500">Total</div>
											</div>
										</div>
									</div>
									<div className="ml-6">
										<Button size="sm">
											Anular
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Información adicional */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div className="flex">
					<div className="ml-3">
						<h3 className="text-sm font-medium text-blue-800">
							Información sobre Notas de Crédito
						</h3>
						<div className="mt-2 text-sm text-blue-700">
							<ul className="list-disc pl-5 space-y-1">
								<li>Solo puedes anular facturas que no hayan sido anuladas previamente</li>
								<li>La nota de crédito se generará automáticamente con todos los items</li>
								<li>El documento será enviado automáticamente a SUNAT para su procesamiento</li>
								<li>Podrás descargar el PDF una vez que SUNAT lo procese</li>
							</ul>
						</div>
					</div>
				</div>
			</div>

			{/* Modal selector de tipo de nota */}
			{modalOpen && selectedInvoiceForModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					<div className="absolute inset-0 bg-black opacity-40" onClick={() => setModalOpen(false)} />
					<div className="bg-white rounded-lg shadow-lg z-10 w-full max-w-lg p-6">
						<h3 className="text-lg font-medium text-gray-900">Selecciona el tipo de Nota de Crédito</h3>
						<p className="text-sm text-gray-600 mt-1">Elige el motivo que corresponde a esta nota para mostrar los campos adecuados.</p>

						<div className="mt-4">
							<label className="block text-sm font-medium text-gray-700">Tipo</label>
							<select
								value={selectedType}
								onChange={(e) => setSelectedType(e.target.value)}
								className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
							>
								{creditNoteTypes.map(t => (
									<option key={t.code} value={t.code}>{t.code} - {t.label}</option>
								))}
							</select>
						</div>

						<div className="mt-4 p-3 bg-gray-50 rounded">
							<p className="text-sm text-gray-700">{creditNoteTypes.find(t => t.code === selectedType)?.description}</p>
							{loadingInvoiceDetail ? (
								<div className="mt-2 text-xs text-gray-500">Cargando detalle de la factura...</div>
							) : selectedInvoiceForModal ? (
								<div className="mt-2 text-xs text-gray-500">Documento: {selectedInvoiceForModal.series}-{String(selectedInvoiceForModal.number).padStart(8, '0')} • Cliente: {selectedInvoiceForModal.client_name || selectedInvoiceForModal.client?.name} • Total: {formatCurrency(String(selectedInvoiceForModal.total_payable || selectedInvoiceForModal.total_payable))}</div>
							) : (
								<div className="mt-2 text-xs text-gray-500">Documento seleccionado</div>
							)}
						</div>

						<div className="mt-6 flex justify-end space-x-3">
							<Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
							<Button onClick={handleConfirmType}>{selectedType === '01' ? 'Usar anulación simplificada' : 'Editar nota'}</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

