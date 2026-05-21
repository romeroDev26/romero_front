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
						<h1 className="text-3xl font-bold text-dm-text-primary">Nueva Nota de Crédito</h1>
						<p className="text-dm-text-secondary">Selecciona la factura que deseas anular</p>
					</div>
				</div>
			</div>

			{/* Buscador */}
			<div className="bg-dm-bg-primary rounded-lg shadow p-6">
				<div className="flex items-center space-x-4">
					<div className="flex-1">
						<label className="block text-sm font-medium text-dm-text-secondary mb-1">
							Buscar factura
						</label>
						<div className="relative">
							<MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-dm-text-muted" />
							<input
								type="text"
								placeholder="Buscar por serie, número o cliente..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 border border-dm-border-primary rounded-md focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Lista de Facturas */}
			<div className="bg-dm-bg-primary rounded-lg shadow">
				<div className="px-6 py-4 border-b border-dm-border-primary">
					<h2 className="text-lg font-semibold text-dm-text-primary">
						Facturas Disponibles para Anular
					</h2>
					<p className="text-sm text-dm-text-secondary mt-1">
						Solo se muestran facturas que pueden ser anuladas
					</p>
				</div>

				{isLoading ? (
					<div className="p-8 text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
						<p className="mt-2 text-dm-text-secondary">Cargando facturas...</p>
					</div>
				) : filteredInvoices.length === 0 ? (
					<div className="p-8 text-center">
						{voidableInvoices?.length === 0 ? (
							<div>
								<CreditCardIcon className="h-12 w-12 text-dm-text-muted mx-auto mb-4" />
								<h3 className="text-lg font-medium text-dm-text-primary mb-2">
									No hay facturas para anular
								</h3>
								<p className="text-dm-text-secondary">
									No se encontraron facturas que puedan ser anuladas en este momento.
								</p>
							</div>
						) : (
							<div>
								<MagnifyingGlassIcon className="h-12 w-12 text-dm-text-muted mx-auto mb-4" />
								<h3 className="text-lg font-medium text-dm-text-primary mb-2">
									No se encontraron resultados
								</h3>
								<p className="text-dm-text-secondary">
									No hay facturas que coincidan con tu búsqueda.
								</p>
							</div>
						)}
					</div>
				) : (
					<div className="divide-y divide-dm-border-primary">
						{filteredInvoices.map((invoice) => {
							const isCancelled = invoice.business_status === 'CANCELLED';
							const isIncreased = invoice.business_status === 'INCREASED';
							
							return (
								<div
									key={invoice.id}
									className={`p-6 transition-colors ${
										isCancelled 
											? 'bg-dm-bg-secondary cursor-not-allowed opacity-60' 
											: 'hover:bg-dm-bg-hover cursor-pointer'
									}`}
									onClick={() => !isCancelled && handleSelectInvoice(invoice)}
								>
									<div className="flex items-center justify-between">
										<div className="flex-1">
											<div className="flex items-center space-x-4">
												<div>
													<div className={`text-sm font-medium ${isCancelled ? 'text-dm-text-muted' : 'text-dm-text-primary'}`}>
														{invoice.series}-{String(invoice.number).padStart(8, '0')}
													</div>
													<div className="text-sm text-dm-text-muted">
														{invoice.document_type_code === '01' ? 'Factura' : 'Boleta'}
														{isCancelled && (
															<span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
																CANCELADO
															</span>
														)}
														{isIncreased && (
															<span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300">
																AUMENTADO
															</span>
														)}
													</div>
												</div>
												<div className="flex-1">
													<div className={`text-sm font-medium ${isCancelled ? 'text-dm-text-muted' : 'text-dm-text-primary'}`}>
														{invoice.client_name}
													</div>
													<div className="text-sm text-dm-text-muted">
														Emitida el {formatDate(invoice.issue_date)}
													</div>
												</div>
												<div className="text-right">
													<div className={`text-sm font-medium ${isCancelled ? 'text-dm-text-muted' : 'text-dm-text-primary'}`}>
														{formatCurrency(invoice.total_payable)}
													</div>
													<div className="text-sm text-dm-text-muted">Total</div>
												</div>
											</div>
										</div>
										<div className="ml-6">
											<Button 
												size="sm" 
												disabled={isCancelled}
												className={isCancelled ? 'opacity-50 cursor-not-allowed' : ''}
											>
												{isCancelled ? 'No disponible' : 'Anular'}
											</Button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Información adicional */}
			<div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 rounded-lg p-4">
				<div className="flex">
					<div className="ml-3">
						<h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
							Información sobre Notas de Crédito
						</h3>
						<div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
							<ul className="list-disc pl-5 space-y-1">
								<li>Solo puedes anular facturas que no hayan sido anuladas previamente</li>
								<li>Las facturas marcadas como "CANCELADO" no pueden ser anuladas nuevamente</li>
								<li>Las facturas marcadas como "AUMENTADO" pueden ser anuladas si es necesario</li>
								<li>La nota de crédito se generará automáticamente con todos los items</li>
								<li>El documento será enviado automáticamente a SUNAT para su procesamiento</li>
								<li>Podrás descargar el PDF una vez que SUNAT lo procese</li>
							</ul>
						</div>
					</div>
				</div>
			</div>

			{/* Modal selector de tipo de nota eliminado: la selección ahora redirige directamente a la anulación simplificada */}
		</div>
	);
};

