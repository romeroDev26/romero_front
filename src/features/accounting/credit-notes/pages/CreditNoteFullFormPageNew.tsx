// src/features/accounting/credit-notes/pages/CreditNoteFullFormPage.tsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

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
	ClientInfoSection,
	AffectedDocumentSection,
	CreditNoteReasonSection,
	CreditNoteItemsSection,
	CreditNoteSidebar
} from '../components';

// Esquema de validación según estructura del backend
const creditNoteSchema = z.object({
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
});

type CreditNoteFormData = z.infer<typeof creditNoteSchema>;

export const CreditNoteFullFormPage: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { affectedInvoice, selectedType } = (location.state as any) || {};
	const { mutate: createCreditNote, isPending } = useCreateCreditNote();
  
	// Estados locales
	const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<any>(null);
  
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
	const { data: clients = [], isLoading: loadingClients } = useQuery<Client[]>({
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
	const { availableCreditNoteSeries, isLoading: loadingSeries } = useAccountingDocumentSeriesForBranch(
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
		}
	});

	const { append, remove } = useFieldArray({
		control,
		name: "items"
	});

	// Si venimos desde la selección rápida, cargar la factura completa y prellenar
	const { data: invoiceData } = useQuery<any>({
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

	// Función para manejar la selección de factura
	const handleInvoiceSelect = (invoiceDetail: any) => {
		try {
			setSelectedInvoiceDetail(invoiceDetail);
			
			// Autocompletar campos del formulario
			if (invoiceDetail.client?.id) {
				setValue('client_id', invoiceDetail.client.id);
			}
			setValue('affected_document_type_code', invoiceDetail.document_type_code);
			setValue('affected_document_series_number', `${invoiceDetail.series}-${String(invoiceDetail.number).padStart(8, '0')}`);
			setValue('currency_code', invoiceDetail.currency_code);
			
			// Cargar los items de la factura original
			if (invoiceDetail.items && invoiceDetail.items.length > 0) {
				// Limpiar items existentes
				remove();
				
				// Agregar items de la factura
				invoiceDetail.items.forEach((item: any, index: number) => {
					const itemData = {
						product_id: item.product_id || 0,
						quantity: parseFloat(item.quantity) || 1,
						unit_code: item.unit_code || 'NIU',
						unit_price: parseFloat(item.unit_price) || 0,
						price_with_tax: parseFloat(item.price_with_tax) || 0,
						price_type_code: item.price_type_code || '01',
						tax_category_code: item.tax_category_code || '10',
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
			onSuccess: () => {
				navigate('/accounting/credit-notes');
			}
		});
	};

	const selectedClient = clients.find(c => c.id === watch('client_id'));
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
						<h1 className="text-3xl font-bold text-gray-900">Nueva Nota de Crédito</h1>
						<p className="text-gray-600">Crear una nota de crédito detallada con items</p>
					</div>
				</div>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Información Principal */}
					<div className="lg:col-span-2 space-y-6">
						{/* Datos del Cliente */}
						<ClientInfoSection
							control={control}
							setValue={setValue}
							errors={errors}
							clients={clients}
							selectedClient={selectedClient}
							loadingClients={loadingClients}
							availableSeries={availableCreditNoteSeries}
							loadingSeries={loadingSeries}
						/>

						{/* Documento Afectado */}
						<AffectedDocumentSection
							control={control}
							errors={errors}
							companyId={currentUser?.company_id || 0}
							selectedInvoiceDetail={selectedInvoiceDetail}
							onInvoiceSelect={handleInvoiceSelect}
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
