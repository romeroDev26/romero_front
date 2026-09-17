// src/features/accounting/credit-notes/components/ClientInfoSection.tsx

import React, { useState } from 'react';
import { Controller, Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { Modal } from '../../../../components/common/Modal';
import { Client } from '../../../../types';
import type { CreditNoteFormData } from '../creditNoteSchema';
import type { DocumentSeries } from '../../../../types';

interface ClientInfoSectionProps {
	control: Control<CreditNoteFormData>;
	setValue: UseFormSetValue<CreditNoteFormData>;
	errors: FieldErrors<CreditNoteFormData>;
	clients: Client[];
	selectedClient?: Client;
	loadingClients: boolean;
	availableSeries: DocumentSeries[];
	loadingSeries: boolean;
}

export const ClientInfoSection: React.FC<ClientInfoSectionProps> = ({
	control,
	setValue,
	errors,
	clients,
	selectedClient,
	loadingClients,
	availableSeries,
	loadingSeries
}) => {
	const [showClientModal, setShowClientModal] = useState(false);
	const [clientSearch, setClientSearch] = useState('');

	const selectClient = (client: Client) => {
		setValue('client_id', client.id);
		setShowClientModal(false);
		setClientSearch('');
	};

	const filteredClients = clients.filter(client =>
		client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
		client.doc_number?.toLowerCase().includes(clientSearch.toLowerCase())
	);

	return (
		<>
			<div className="bg-dm-bg-primary rounded-lg shadow p-6">
				<h2 className="text-lg font-semibold text-dm-text-primary mb-4">Información del Cliente</h2>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-dm-text-secondary mb-1">Cliente*</label>
						<div className="flex">
							<div className="flex-1 p-2 border border-dm-border-primary rounded-l-md bg-dm-bg-secondary">
								{selectedClient ? (
									<div>
										<div className="font-medium">{selectedClient.name}</div>
										<div className="text-sm text-dm-text-muted">{selectedClient.doc_number}</div>
									</div>
								) : (
									<div className="text-dm-text-muted">Seleccionar cliente...</div>
								)}
							</div>
							<Button
								type="button"
								variant="outline"
								onClick={() => setShowClientModal(true)}
								className="rounded-l-none"
							>
								<MagnifyingGlassIcon className="h-4 w-4" />
							</Button>
						</div>
						{errors.client_id && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.client_id.message?.toString()}</p>}
					</div>
					<div>
						<label className="block text-sm font-medium text-dm-text-secondary mb-1">Serie NC*</label>
						<Controller
							name="series"
							control={control}
							render={({ field }) => (
								<select {...field} className="w-full p-2 border border-dm-border-primary rounded-md">
									{loadingSeries ? (
										<option>Cargando series...</option>
									) : (
										<>
											<option value="">Seleccionar serie...</option>
											{availableSeries.map(series => (
												<option key={series.id} value={series.series_code}>
													{series.series_code}
												</option>
											))}
										</>
									)}
								</select>
							)}
						/>
						{errors.series && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.series.message?.toString()}</p>}
					</div>
				</div>
			</div>

			{/* Modal de Selección de Cliente */}
			<Modal
				isOpen={showClientModal}
				onClose={() => setShowClientModal(false)}
				title="Seleccionar Cliente"
			>
				<div className="space-y-4">
					<div>
						<input
							type="text"
							placeholder="Buscar cliente..."
							value={clientSearch}
							onChange={(e) => setClientSearch(e.target.value)}
							className="w-full p-2 border border-dm-border-primary rounded-md"
						/>
					</div>
					<div className="max-h-64 overflow-y-auto">
						{loadingClients ? (
							<div className="text-center py-4">Cargando clientes...</div>
						) : (
							<div className="space-y-2">
								{filteredClients.map(client => (
									<div
										key={client.id}
										onClick={() => selectClient(client)}
										className="p-3 hover:bg-dm-bg-hover cursor-pointer border rounded-md"
									>
										<div className="font-medium">{client.name}</div>
										<div className="text-sm text-dm-text-muted">{client.doc_number}</div>
									</div>
								))}
								{filteredClients.length === 0 && (
									<div className="text-center py-4 text-dm-text-muted">No se encontraron clientes</div>
								)}
							</div>
						)}
					</div>
				</div>
			</Modal>
		</>
	);
};
