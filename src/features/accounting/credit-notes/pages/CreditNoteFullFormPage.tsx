// src/features/accounting/credit-notes/pages/CreditNoteFullFormPage.tsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from '@/utils/sileo-toast';

import { Button } from '../../../../components/common/Button';
import { useCreateCreditNote } from '../../hooks/useCreditNotes';
import { CreditNoteCreateData } from '../../types';
import { useAccountingDocumentSeriesForBranch } from '../../../../hooks/useAccountingDocumentSeries';
import { clientsService } from '../../../../services/clients.service';
import { invoicesService } from '../../../../services/invoices.service';
import { productsServicesService } from '../../../../services/products-services.service';
import { authService } from '../../../../services/auth.service';
import { Client, ProductService, User } from '../../../../types';

// Importar componentes modularizados
import {
	AffectedDocumentSection,
	CreditNoteReasonSection,
	CreditNoteItemsSection,
	CreditNoteSidebar
} from '../components';
import { Controller } from 'react-hook-form';

import { creditNoteSchema, type CreditNoteFormData } from '../creditNoteSchema';
import type { Invoice } from '../../../../types';

export const CreditNoteFullFormPage: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	// Lo que envia la pantalla anterior al navegar hacia el formulario
	const { affectedInvoice, selectedType } =
		(location.state as {
			affectedInvoice?: Invoice;
			selectedType?: string;
		}) || {};
	const { mutate: createCreditNote, isPending } = useCreateCreditNote();
	const queryClient = useQueryClient();
  
	// Estados locales
	const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<Invoice | null>(null);
  
	// Hook de usuario actual
	const { data: currentUser } = useQuery<User>({
		queryKey: ['currentUser'],
		queryFn: async (): Promise<User> => {
			const data = await authService.getProfile();
			return data;
		},
		staleTime: 1000 * 60 * 5,
		retry: 1
	});

	// Cargar datos reales
	const { data: clients = [] } = useQuery<Client[]>({
		queryKey: ['clients', currentUser?.company_id],
		queryFn: () => clientsService.getAll(),
		enabled: !!currentUser?.company_id,
	});

	const { data: products = [], isLoading: loadingProducts } = useQuery<ProductService[]>({
		queryKey: ['products-services', currentUser?.company_id],
		queryFn: () => productsServicesService.getActive(),
		enabled: !!currentUser?.company_id,
	});

	// Series de documentos contables
	const { availableCreditNoteSeries } = useAccountingDocumentSeriesForBranch(
		currentUser?.default_branch_office_id || null, 
		currentUser?.company_id || 0
	);

	const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<CreditNoteFormData>({
		resolver: zodResolver(creditNoteSchema),
		defaultValues: {
			client_id: 0,
			series: '',
			currency_code: 'PEN',
			affected_document_type_code: '01',
			affected_document_series_number: '',
			credit_note_type_code: '01',
			reason: '',
			items: [{
				product_id: 0,
				quantity: 1,
				unit_code: 'NIU',
				unit_price: 0,
				price_with_tax: 0,
				price_type_code: '01',
				tax_category_code: '10',
				description: '',
			}]
			,
			igv_applicable: true
		}
	});

	const { append, remove } = useFieldArray({
		control,
		name: "items"
	});

	// Si venimos desde la selección rápida, cargar la factura completa y prellenar
	const { data: invoiceData } = useQuery<Invoice | null>({
		queryKey: ['invoice', affectedInvoice?.id],
		queryFn: async () => affectedInvoice && affectedInvoice.id ? await invoicesService.getById(affectedInvoice.id) : null,
		enabled: !!affectedInvoice?.id,
	});

	useEffect(() => {
		if (invoiceData) {
			handleInvoiceSelect(invoiceData);
		}
	}, [invoiceData]);

	// Seleccionar serie por defecto
	useEffect(() => {
		if (availableCreditNoteSeries.length > 0) {
			const savedSeries = localStorage.getItem('lastUsedCreditNoteSeries');
			const seriesExists = availableCreditNoteSeries.find(s => s.series_code === savedSeries);
			if (seriesExists && savedSeries) {
				setValue('series', savedSeries);
			} else {
				setValue('series', availableCreditNoteSeries[0].series_code);
			}
		}
	}, [availableCreditNoteSeries, setValue]);

	// Auto-seleccionar cliente
	// - Si hay un cliente guardado en localStorage lo usamos
	// - Si solo existe un cliente en la compañía, lo seleccionamos automáticamente
	useEffect(() => {
		const currentClientId = watch('client_id');
		if ((!currentClientId || currentClientId === 0) && clients.length > 0) {
			const saved = localStorage.getItem('lastUsedClientId');
			const savedId = saved ? parseInt(saved, 10) : NaN;
			if (!isNaN(savedId) && clients.some(c => c.id === savedId)) {
				setValue('client_id', savedId);
			} else if (clients.length === 1) {
				setValue('client_id', clients[0].id);
			}
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [clients]);

	// Guardar en localStorage cuando el cliente cambia para futuras autoselecciones
	useEffect(() => {
		const id = watch('client_id');
		if (id && id > 0) {
			localStorage.setItem('lastUsedClientId', String(id));
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [watch('client_id')]);

	// Función para manejar la selección de factura
	const handleInvoiceSelect = (invoiceDetail: Invoice) => {
		try {
			setSelectedInvoiceDetail(invoiceDetail);
			
			// Autocompletar campos del formulario
			if (invoiceDetail.client?.id) {
				setValue('client_id', invoiceDetail.client.id);
			}
			setValue('affected_document_type_code', invoiceDetail.document_type_code);
			setValue('affected_document_series_number', `${invoiceDetail.series}-${String(invoiceDetail.number).padStart(8, '0')}`);
			setValue('currency_code', invoiceDetail.currency_code);
			// If invoice series matches one of the available credit note series, preselect it
			if (invoiceDetail.series && availableCreditNoteSeries && availableCreditNoteSeries.length > 0) {
				const match = availableCreditNoteSeries.find((s) => s.series_code === invoiceDetail.series);
				if (match) setValue('series', invoiceDetail.series);
			}
			
			// Cargar los items de la factura original
			if (invoiceDetail.items && invoiceDetail.items.length > 0) {
				// Limpiar items existentes
				remove();
				
				// Determine if IGV applies: any item with igv_percentage > 0 or tax_category_code === '10'
				const igvApplicable = invoiceDetail.items.some((it) => {
					const igvPerc = parseFloat(String(it.igv_percentage ?? '0'));
					return igvPerc > 0 || it.tax_category_code === '10';
				});
				setValue('igv_applicable', igvApplicable);

				// Agregar items de la factura, respetando tax_category_code
				invoiceDetail.items.forEach((item, index) => {
					const inferredTax = item.tax_category_code || (parseFloat(String(item.igv_percentage ?? '0')) > 0 ? '10' : '20');
					const itemData = {
						product_id: item.product_id || 0,
						quantity: parseFloat(String(item.quantity)) || 1,
						unit_code: item.unit_code || 'NIU',
						unit_price: parseFloat(String(item.unit_price)) || 0,
						price_with_tax: parseFloat(String(item.price_with_tax)) || 0,
						price_type_code: item.price_type_code || '01',
						tax_category_code: inferredTax,
						description: item.item_description || item.product_name || '',
						discount: 0,
					};

					if (index === 0) {
						setValue('items.0', itemData);
					} else {
						append(itemData);
					}
				});
			}
			
			// Si se pasó un tipo seleccionado, aplicarlo
			if (selectedType) {
				setValue('credit_note_type_code', selectedType);
			}
		} catch (e) {
			console.error('Error prefilling credit note from invoice:', e);
		}
	};

	const onSubmit: SubmitHandler<CreditNoteFormData> = (data) => {
		if (!currentUser?.company_id) {
			toast.error("No se pudo obtener la información de la empresa");
			return;
		}

		// Guardar serie usada
		localStorage.setItem('lastUsedCreditNoteSeries', data.series);

		const payload: CreditNoteCreateData = {
			company_id: currentUser.company_id,
			client_id: data.client_id,
			series: data.series,
			currency_code: data.currency_code,
			issue_date: new Date().toISOString().split('T')[0],
			issue_time: new Date().toTimeString().split(' ')[0],
			affected_document_type_code: data.affected_document_type_code,
			affected_document_series_number: data.affected_document_series_number,
			credit_note_type_code: data.credit_note_type_code,
			reason: data.reason,
			items: data.items.map(item => ({
				product_id: item.product_id,
				quantity: item.quantity,
				unit_code: item.unit_code,
				unit_price: parseFloat(item.unit_price.toFixed(10)),
				price_with_tax: parseFloat(item.price_with_tax.toFixed(10)),
				price_type_code: item.price_type_code,
				tax_category_code: item.tax_category_code,
				description: item.description,
				...(item.discount ? { discount: typeof item.discount === 'number' ? parseFloat(item.discount.toFixed ? item.discount.toFixed(10) : String(item.discount)) : parseFloat(String(item.discount)) } : {}),
			})),
		};

		createCreditNote(payload, {
			onSuccess: async () => {
				await queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
				navigate('/accounting/credit-notes');
			}
		});
	};

	// selectedClient removed - client is handled as hidden field and via stored values
	const watchedItems = watch('items');

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
						<p className="text-dm-text-secondary">Crear una nota de crédito detallada con items</p>
					</div>
				</div>
			</div>

			{/* Alerta informativa sobre series */}
			<div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg p-4">
				<div className="flex">
					<div className="flex-shrink-0">
						<svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
							<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
						</svg>
					</div>
					<div className="ml-3">
						<h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
							Requisito importante de SUNAT
						</h3>
						<div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
							<p>
								Según normativa SUNAT, <strong>la serie de la nota de crédito debe ser la misma que la serie del comprobante que afecta</strong>.
							</p>
							<p className="mt-1">
								Ejemplo: Si el comprobante es <code className="bg-amber-100 px-1 py-0.5 rounded">B004-00000123</code>, 
								la serie de la nota de crédito debe ser <code className="bg-amber-100 px-1 py-0.5 rounded">B004</code>.
							</p>
							<p className="mt-2 font-medium">
								📝 Por favor, verifique que la serie seleccionada coincida con la del comprobante a afectar.
							</p>
						</div>
					</div>
				</div>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Información Principal */}
					<div className="lg:col-span-2 space-y-6">
												{/* Campos ocultos: client_id y series (la selección se hace desde la factura) */}
												<Controller
													name="client_id"
													control={control}
													render={({ field }) => <input type="hidden" {...field} />}
												/>
												<Controller
													name="series"
													control={control}
													render={({ field }) => <input type="hidden" {...field} />}
												/>

						{/* Documento Afectado */}
						<AffectedDocumentSection
							control={control}
							errors={errors}
							companyId={currentUser?.company_id || 0}
							selectedInvoiceDetail={selectedInvoiceDetail}
							onInvoiceSelect={handleInvoiceSelect}
							redirectToAnnulOnSelect={true}
						/>

						{/* Motivo */}
						<CreditNoteReasonSection
							control={control}
							errors={errors}
							watch={watch}
						/>

						{/* Items */}
						<CreditNoteItemsSection
							control={control}
							errors={errors}
							setValue={setValue}
							watch={watch}
							products={products}
							loadingProducts={loadingProducts}
						/>
					</div>

					{/* Panel Lateral */}
					<div className="space-y-6">
						<CreditNoteSidebar
							creditNoteTypeCode={watch('credit_note_type_code')}
							items={watchedItems}
							setValue={setValue}
						/>
					</div>
				</div>

				{/* Botones de Acción */}
				<div className="flex justify-end space-x-3 pt-6 border-t">
					<Button type="button" variant="outline" onClick={() => navigate('/accounting/credit-notes')}>
						Cancelar
					</Button>
					<Button type="submit" isLoading={isPending}>
						Crear Nota de Crédito
					</Button>
				</div>
			</form>
		</div>
	);
};
