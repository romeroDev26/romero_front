// src/features/accounting/credit-notes/components/CreditNoteItemsSection.tsx

import React, { useState } from 'react';
import { Control, FieldErrors, UseFormSetValue, useFieldArray } from 'react-hook-form';
import { PlusIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { Modal } from '../../../../components/common/Modal';
import { ProductService } from '../../../../types';

interface CreditNoteItemsSectionProps {
	control: Control<any>;
	errors: FieldErrors<any>;
	setValue: UseFormSetValue<any>;
	watch: (name: string) => any;
	products: ProductService[];
	loadingProducts: boolean;
}

export const CreditNoteItemsSection: React.FC<CreditNoteItemsSectionProps> = ({
	control,
	errors,
	setValue,
	watch,
	products,
	loadingProducts
}) => {
	const [showProductModal, setShowProductModal] = useState(false);
	const [selectedItemIndex, setSelectedItemIndex] = useState<number>(-1);
	const [productSearch, setProductSearch] = useState('');

	const { fields, append, remove } = useFieldArray({
		control,
		name: "items"
	});

	const addItem = () => {
		append({
			product_id: 0,
			quantity: 1,
			unit_code: 'NIU',
			unit_price: 0,
			price_with_tax: 0,
			price_type_code: '01',
			tax_category_code: '10',
			description: '',
		});
	};

	const removeItem = (index: number) => {
		if (fields.length > 1) {
			remove(index);
		}
	};

	const selectProduct = (product: ProductService) => {
		if (selectedItemIndex >= 0) {
			setValue(`items.${selectedItemIndex}.product_id`, product.id);
			setValue(`items.${selectedItemIndex}.description`, product.name);
			setValue(`items.${selectedItemIndex}.unit_price`, product.sale_price || 0);
			// Calcular precio con IGV (18%) si corresponde
			const igvApplicable = watch('igv_applicable') !== false;
			const priceWithTax = igvApplicable ? (product.sale_price || 0) * 1.18 : (product.sale_price || 0);
			setValue(`items.${selectedItemIndex}.price_with_tax`, parseFloat(priceWithTax.toFixed(10)));
			// Set tax category according to igv applicability
			setValue(`items.${selectedItemIndex}.tax_category_code`, igvApplicable ? '10' : '20');
		}
		setShowProductModal(false);
		setProductSearch('');
		setSelectedItemIndex(-1);
	};

	const openProductModal = (index: number) => {
		setSelectedItemIndex(index);
		setShowProductModal(true);
	};

	const filteredProducts = products.filter(product =>
		product.name.toLowerCase().includes(productSearch.toLowerCase())
	);

	return (
		<>
			<div className="bg-white rounded-lg shadow p-6">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-lg font-semibold text-gray-900">Items de la Nota de Crédito</h2>
					<Button type="button" variant="outline" onClick={addItem}>
						<PlusIcon className="h-4 w-4 mr-2" />
						Agregar Item
					</Button>
				</div>
				
				<div className="space-y-4">
					{fields.map((field, index) => (
						<div key={field.id} className="border rounded-lg p-4">
							<div className="flex justify-between items-start mb-3">
								<h3 className="font-medium text-gray-900">Item #{index + 1}</h3>
								{fields.length > 1 && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => removeItem(index)}
									>
										<TrashIcon className="h-4 w-4" />
									</Button>
								)}
							</div>
							
							<div className="grid grid-cols-2 gap-4">
								<div className="col-span-2">
									<label className="block text-sm font-medium text-gray-700 mb-1">Producto/Servicio*</label>
									<div className="flex">
										<div className="flex-1 p-2 border border-gray-300 rounded-l-md bg-gray-50">
											<div className="text-sm">
												{watch(`items.${index}.description`) || 'Seleccionar producto/servicio...'}
											</div>
										</div>
										<Button
											type="button"
											variant="outline"
											onClick={() => openProductModal(index)}
											className="rounded-l-none"
										>
											<MagnifyingGlassIcon className="h-4 w-4" />
										</Button>
									</div>
								</div>
								
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Cantidad*</label>
									<input 
										{...control.register(`items.${index}.quantity`, { 
											valueAsNumber: true,
											min: 0.01
										})}
										type="number"
										step="0.01"
										min="0"
										className="w-full p-2 border border-gray-300 rounded-md" 
									/>
								</div>
								
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Precio Unitario*</label>
									<input 
										{...control.register(`items.${index}.unit_price`, { 
											valueAsNumber: true,
											min: 0,
											onChange: (e) => {
												const unitPrice = parseFloat(e.target.value) || 0;
												const igvApplicable = watch('igv_applicable') !== false;
												const taxCode = watch(`items.${index}.tax_category_code`) || (igvApplicable ? '10' : '20');
												const priceWithTax = igvApplicable && taxCode === '10' ? unitPrice * 1.18 : unitPrice;
												setValue(`items.${index}.price_with_tax`, parseFloat(priceWithTax.toFixed(10)));
												setValue(`items.${index}.tax_category_code`, taxCode);
											}
										})}
										type="number"
										step="0.01"
										min="0"
										className="w-full p-2 border border-gray-300 rounded-md" 
									/>
								</div>
								
								{watch('credit_note_type_code') === '05' && (
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Descuento por ítem</label>
										<input
											{...control.register(`items.${index}.discount`, { 
												valueAsNumber: true,
												min: 0
											})}
											type="number"
											step="0.01"
											min="0"
											className="w-full p-2 border border-gray-300 rounded-md"
										/>
									</div>
								)}
								
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Precio con IGV*</label>
									<input 
										{...control.register(`items.${index}.price_with_tax`, { 
											valueAsNumber: true,
											min: 0
										})}
										type="number"
										step="0.01"
										min="0"
										className="w-full p-2 border border-gray-300 rounded-md" 
										disabled={watch('igv_applicable') === false}
									/>
								</div>
							</div>
						</div>
					))}
				</div>
				{errors.items && <p className="text-sm text-red-600 mt-2">{errors.items.message?.toString()}</p>}
			</div>

			{/* Modal de Selección de Producto */}
			<Modal
				isOpen={showProductModal}
				onClose={() => setShowProductModal(false)}
				title="Seleccionar Producto/Servicio"
			>
				<div className="space-y-4">
					<div>
						<input
							type="text"
							placeholder="Buscar producto/servicio..."
							value={productSearch}
							onChange={(e) => setProductSearch(e.target.value)}
							className="w-full p-2 border border-gray-300 rounded-md"
						/>
					</div>
					<div className="max-h-64 overflow-y-auto">
						{loadingProducts ? (
							<div className="text-center py-4">Cargando productos...</div>
						) : (
							<div className="space-y-2">
								{filteredProducts.map(product => (
									<div
										key={product.id}
										onClick={() => selectProduct(product)}
										className="p-3 hover:bg-gray-50 cursor-pointer border rounded-md"
									>
										<div className="font-medium">{product.name}</div>
										<div className="text-sm text-gray-500">S/ {product.sale_price?.toFixed(2) || '0.00'}</div>
									</div>
								))}
								{filteredProducts.length === 0 && (
									<div className="text-center py-4 text-gray-500">No se encontraron productos</div>
								)}
							</div>
						)}
					</div>
				</div>
			</Modal>
		</>
	);
};
