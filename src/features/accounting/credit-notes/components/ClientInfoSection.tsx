// src/features/accounting/credit-notes/components/ClientInfoSection.tsx

import React, { useState } from 'react';
import { Controller, Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { Modal } from '../../../../components/common/Modal';
import { Client } from '../../../../types';

interface ClientInfoSectionProps {
	control: Control<any>;
	setValue: UseFormSetValue<any>;
	errors: FieldErrors<any>;
	clients: Client[];
	selectedClient?: Client;
	loadingClients: boolean;
	availableSeries: any[];
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
			<div className="bg-white rounded-lg shadow p-6">
				<h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h2>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Cliente*</label>
						<div className="flex">
							<div className="flex-1 p-2 border border-gray-300 rounded-l-md bg-gray-50">
								{selectedClient ? (
									<div>
										<div className="font-medium">{selectedClient.name}</div>
										<div className="text-sm text-gray-500">{selectedClient.doc_number}</div>
									</div>
								) : (
									<div className="text-gray-400">Seleccionar cliente...</div>
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
						{errors.client_id && <p className="text-sm text-red-600 mt-1">{errors.client_id.message?.toString()}</p>}
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Serie NC*</label>
						<Controller
							name="series"
							control={control}
							render={({ field }) => (
								<select {...field} className="w-full p-2 border border-gray-300 rounded-md">
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
						{errors.series && <p className="text-sm text-red-600 mt-1">{errors.series.message?.toString()}</p>}
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
							className="w-full p-2 border border-gray-300 rounded-md"
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
										className="p-3 hover:bg-gray-50 cursor-pointer border rounded-md"
									>
										<div className="font-medium">{client.name}</div>
										<div className="text-sm text-gray-500">{client.doc_number}</div>
									</div>
								))}
								{filteredClients.length === 0 && (
									<div className="text-center py-4 text-gray-500">No se encontraron clientes</div>
								)}
							</div>
						)}
					</div>
				</div>
			</Modal>
		</>
	);
};
