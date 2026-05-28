// src/features/accounting/credit-notes/components/CreditNoteSidebar.tsx

import React, { useState } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { Button } from '../../../../components/common/Button';
import { Modal } from '../../../../components/common/Modal';
import { toast } from '@/utils/sileo-toast';

interface CreditNoteSidebarProps {
	creditNoteTypeCode: string;
	items: any[];
	setValue: UseFormSetValue<any>;
}

export const CreditNoteSidebar: React.FC<CreditNoteSidebarProps> = ({
	creditNoteTypeCode,
	items,
	setValue
}) => {
	const [discountMode, setDiscountMode] = useState<'field' | 'unit_price'>('field');
	const [globalDiscountAmount, setGlobalDiscountAmount] = useState<number>(0);
	const [decreaseAmount, setDecreaseAmount] = useState<number>(0);
	const [showDecreaseModal, setShowDecreaseModal] = useState(false);
	const [decreaseMode, setDecreaseMode] = useState<'global' | 'per_item'>('global');

	const applyDecreaseProportionally = () => {
		if (!Array.isArray(items) || items.length === 0) return;

		const totalOriginal = items.reduce((acc: number, it: any) => acc + (parseFloat(it.unit_price || 0) * (parseFloat(it.quantity || 0) || 1)), 0);
		if (decreaseAmount <= 0 || decreaseAmount > totalOriginal) {
			toast.error('El monto de disminución debe ser mayor a 0 y menor o igual al total original');
			return;
		}

		// Aplicar disminución proporcionalmente por item
		items.forEach((it: any, idx: number) => {
			const itemTotal = (parseFloat(it.unit_price || 0) * (parseFloat(it.quantity || 0) || 1));
			const proportion = itemTotal / totalOriginal;
			const reductionForItem = decreaseAmount * proportion;
			const reductionPerUnit = reductionForItem / (parseFloat(it.quantity || 0) || 1);
			const newUnitPrice = Math.max(0, (parseFloat(it.unit_price || 0) - reductionPerUnit));
			setValue(`items.${idx}.unit_price`, parseFloat(newUnitPrice.toFixed(10)));
			// recalcular price_with_tax
			setValue(`items.${idx}.price_with_tax`, parseFloat((newUnitPrice * 1.18).toFixed(10)));
		});

		toast.success('Disminución aplicada a los ítems');
	};

	const applyGlobalDiscount = () => {
		if (!Array.isArray(items) || items.length === 0) return;

		const totalOriginal = items.reduce((acc: number, it: any) => acc + (parseFloat(it.unit_price || 0) * (parseFloat(it.quantity || 0) || 1)), 0);
		if (globalDiscountAmount <= 0 || globalDiscountAmount > totalOriginal) {
			toast.error('El monto del descuento debe ser mayor a 0 y menor o igual al total original');
			return;
		}

		// Distribuir proporcionalmente
		items.forEach((it: any, idx: number) => {
			const itemTotal = (parseFloat(it.unit_price || 0) * (parseFloat(it.quantity || 0) || 1));
			const proportion = itemTotal / totalOriginal;
			const discountForItem = globalDiscountAmount * proportion;

			if (discountMode === 'field') {
				// poner discount como monto por ítem
				setValue(`items.${idx}.discount`, parseFloat(discountForItem.toFixed(10)));
			} else {
				// reducir unit_price proporcionalmente
				const reductionPerUnit = discountForItem / (parseFloat(it.quantity || 0) || 1);
				const newUnitPrice = Math.max(0, (parseFloat(it.unit_price || 0) - reductionPerUnit));
				setValue(`items.${idx}.unit_price`, parseFloat(newUnitPrice.toFixed(10)));
				setValue(`items.${idx}.price_with_tax`, parseFloat((newUnitPrice * 1.18).toFixed(10)));
			}
		});

		toast.success('Descuento global aplicado');
	};

	return (
		<>
			<div className="bg-dm-bg-primary rounded-lg shadow p-6">
				<h2 className="text-lg font-semibold text-dm-text-primary mb-4">Información Importante</h2>
				<div className="space-y-3 text-sm text-dm-text-secondary">
					<div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3">
						<p className="font-medium text-blue-800 dark:text-blue-300 mb-1">Información</p>
						<ul className="space-y-1 text-blue-700 dark:text-blue-300">
							<li>• Las notas de crédito reducen la deuda del cliente</li>
							<li>• Se enviarán automáticamente a SUNAT</li>
							<li>• Verificar todos los datos antes de crear</li>
							<li>• El documento afectado debe existir y estar válido</li>
						</ul>
					</div>

					{/* Ayuda específica para tipo 09 - Disminución en el valor */}
					{creditNoteTypeCode === '09' && (
						<div className="mt-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-3">
							<p className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">Disminución en el valor (Tipo 09)</p>
							<p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">Puedes aplicar una disminución global o editar por ítem en una ventana aparte.</p>
							<div className="flex items-center space-x-2">
								<input
									type="number"
									step="0.01"
									min="0"
									value={decreaseAmount}
									onChange={(e) => setDecreaseAmount(parseFloat(e.target.value || '0'))}
									className="w-full p-2 border border-yellow-300 rounded-md bg-dm-bg-primary"
									placeholder="S/ 0.00"
								/>
								<Button onClick={applyDecreaseProportionally} variant="outline">Aplicar</Button>
								<Button onClick={() => setShowDecreaseModal(true)}>Editar</Button>
							</div>
						</div>
					)}

					{/* Ayuda específica para tipo 04 - Descuento global */}
					{creditNoteTypeCode === '04' && (
						<div className="mt-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 rounded-lg p-3">
							<p className="font-medium text-green-800 dark:text-green-300 mb-2">Descuento global (Tipo 04)</p>
							<p className="text-sm text-green-700 dark:text-green-300 mb-2">Ingrese el monto total de descuento y seleccione cómo aplicarlo.</p>
							<div className="space-y-2">
								<div className="flex items-center space-x-2">
									<select 
										value={discountMode} 
										onChange={(e) => setDiscountMode(e.target.value as any)} 
										className="p-2 border rounded-md"
									>
										<option value="field">Usar campo discount por ítem</option>
										<option value="unit_price">Modificar unit_price</option>
									</select>
								</div>
								<div className="flex items-center space-x-2">
									<input
										type="number"
										step="0.01"
										min="0"
										value={globalDiscountAmount}
										onChange={(e) => setGlobalDiscountAmount(parseFloat(e.target.value || '0'))}
										className="w-full p-2 border border-green-300 rounded-md bg-dm-bg-primary"
										placeholder="S/ 0.00"
									/>
									<Button onClick={applyGlobalDiscount} variant="outline">Aplicar</Button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Modal para editar disminución (tipo 09) */}
			<Modal isOpen={showDecreaseModal} onClose={() => setShowDecreaseModal(false)} title="Editar Disminución">
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-dm-text-secondary mb-1">Modo de edición</label>
						<div className="flex space-x-2">
							<button
								type="button"
								onClick={() => setDecreaseMode('global')}
								className={`px-3 py-2 rounded-md border ${decreaseMode === 'global' ? 'bg-dm-bg-secondary border-dm-border-primary' : 'bg-dm-bg-primary border-dm-border-primary'}`}
							>
								Global
							</button>
							<button
								type="button"
								onClick={() => setDecreaseMode('per_item')}
								className={`px-3 py-2 rounded-md border ${decreaseMode === 'per_item' ? 'bg-dm-bg-secondary border-dm-border-primary' : 'bg-dm-bg-primary border-dm-border-primary'}`}
							>
								Por ítem
							</button>
						</div>
					</div>

					{decreaseMode === 'global' && (
						<div>
							<label className="block text-sm font-medium text-dm-text-secondary mb-1">Monto total a disminuir</label>
							<div className="flex space-x-2">
								<input
									type="number"
									step="0.01"
									min="0"
									value={decreaseAmount}
									onChange={(e) => setDecreaseAmount(parseFloat(e.target.value || '0'))}
									className="w-full p-2 border border-dm-border-primary rounded-md"
								/>
								<Button 
									onClick={() => { 
										applyDecreaseProportionally(); 
										setShowDecreaseModal(false); 
									}} 
									variant="outline"
								>
									Aplicar
								</Button>
							</div>
						</div>
					)}

					{decreaseMode === 'per_item' && (
						<div className="space-y-3 max-h-64 overflow-y-auto">
							{items && items.map((it: any, idx: number) => (
								<div key={idx} className="flex items-center space-x-2 border-b pb-2">
									<div className="flex-1">
										<div className="text-sm font-medium">{it.description || `Item ${idx + 1}`}</div>
										<div className="text-xs text-dm-text-muted">Cantidad: {it.quantity}</div>
									</div>
									<div className="w-36">
										<label className="text-xs text-dm-text-muted">Descuento</label>
										<input
											type="number"
											step="0.01"
											min="0"
											defaultValue={it.discount || 0}
											onChange={(e) => setValue(`items.${idx}.discount`, parseFloat(e.target.value || '0'))}
											className="w-full p-2 border border-dm-border-primary rounded-md"
										/>
									</div>
									<div className="w-36">
										<label className="text-xs text-dm-text-muted">Nuevo unit_price</label>
										<input
											type="number"
											step="0.01"
											min="0"
											defaultValue={it.unit_price}
											onChange={(e) => {
												const v = parseFloat(e.target.value || '0');
												setValue(`items.${idx}.unit_price`, v);
												setValue(`items.${idx}.price_with_tax`, parseFloat((v * 1.18).toFixed(10)));
											}}
											className="w-full p-2 border border-dm-border-primary rounded-md"
										/>
									</div>
								</div>
							))}

							<div className="flex justify-end pt-2 space-x-2">
								<Button onClick={() => setShowDecreaseModal(false)} variant="outline">Cerrar</Button>
								<Button onClick={() => { setShowDecreaseModal(false); toast.success('Cambios aplicados'); }}>
									Aplicar cambios
								</Button>
							</div>
						</div>
					)}
				</div>
			</Modal>
		</>
	);
};
