// src/test/factories.ts

import type { Representative, Infant } from '../features/fluvial/components/sales-point/core/types';
import type { SeatMapItem, SeatType } from '../types';

/**
 * Fábricas de datos para los tests.
 *
 * Rellenan los campos obligatorios de cada tipo y dejan sobrescribir solo los
 * que importan en cada caso. Antes cada test armaba objetos parciales con
 * `as any`, lo que además de anular el tipo hacía que un cambio de contrato
 * pasara desapercibido.
 */

export const makeSeatType = (overrides: Partial<SeatType> = {}): SeatType => ({
	id: 1,
	name: 'VIP',
	code: 'VIP',
	price_multiplier: 1,
	is_active: true,
	display_order: 1,
	created_at: '2026-01-01T00:00:00Z',
	...overrides,
});

export const makeSeat = (overrides: Partial<SeatMapItem> = {}): SeatMapItem => ({
	id: 1,
	trip_id: 1,
	vessel_seat_config_id: 1,
	seat_number: 'A1',
	status: 'AVAILABLE',
	notes: '',
	seat_type: makeSeatType(),
	...overrides,
});

export const makeRepresentative = (
	overrides: Partial<Representative> = {}
): Representative => ({
	document_type: '1',
	document_number: '11111111',
	name: 'Representante',
	phone: null,
	...overrides,
});

export const makeInfant = (overrides: Partial<Infant> = {}): Infant => ({
	full_name: 'Bebé',
	birth_date: '2024-01-01',
	gender: 'M',
	relationship: 'madre',
	...overrides,
});
