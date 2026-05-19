// src/features/remissionGuides/components/ItemsForGuideModal.tsx

import React, { useState, useCallback } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { ItemForGuide } from '../../../services/invoices.service';
import { useItemsForGuide } from '../hooks/useItemsForGuide';

export interface RemissionGuideFormItem {
  quantity: number;
  unit_code: string;
  description: string;
  internal_code?: string;
  invoice_item_id: number;
}

interface ItemsForGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: number;
  onSelectItems: (items: ItemForGuide[]) => void;
}

export const ItemsForGuideModal: React.FC<ItemsForGuideModalProps> = ({
  isOpen,
  onClose,
  tripId,
  onSelectItems,
}) => {
  const { data: items = [], isLoading, error } = useItemsForGuide(tripId);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const handleToggleItem = useCallback((itemId: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === items.length && items.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map((i) => i.invoice_item_id)));
    }
  }, [items, selectedItems.size]);

  const handleConfirmSelection = () => {
    const selectedApiItems = items.filter((item) =>
      selectedItems.has(item.invoice_item_id)
    );
    onSelectItems(selectedApiItems);
    onClose();
  };

  const formatInvoiceNumber = (sourceInvoiceNumber?: string) => {
    if (!sourceInvoiceNumber) return '—';
    const [, invoiceInfo] = sourceInvoiceNumber.split(': ') || ['', ''];
    const [series, numberStr] = invoiceInfo.split('-') || ['', ''];
    const number = parseInt(numberStr) || 0;
    if (!series || !number) return sourceInvoiceNumber;
    return `${series}-${String(number).padStart(8, '0')}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="3xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h2
            className="font-medium tracking-tight"
            style={{
              fontFamily: "'Saira', 'Montserrat', ui-sans-serif, system-ui, sans-serif",
              fontSize: '18px',
              lineHeight: '1.25',
              color: '#202020',
            }}
          >
            Cargar encomiendas pendientes
          </h2>
          <p
            style={{
              fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
              fontSize: '15px',
              lineHeight: '1.33',
              color: '#828282',
            }}
          >
            Seleccione las encomiendas que desea incluir en la guía de remisión.
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Spinner />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: '#828282',
              }}
            >
              Cargando encomiendas…
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="rounded-lg p-4"
            style={{ backgroundColor: '#fafafa', border: '1px solid #e8e8e8' }}
          >
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '15px',
                lineHeight: '1.33',
                color: '#202020',
              }}
            >
              Error al cargar los ítems:{' '}
              {error instanceof Error ? error.message : 'Ocurrió un error'}
            </p>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleSelectAll}
                className="transition-colors duration-200"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  lineHeight: '1.25',
                  color: '#202020',
                  borderBottom: '2px solid #202020',
                  padding: '0 2px 2px',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#ff682c';
                  (e.currentTarget as HTMLButtonElement).style.borderBottomColor = '#ff682c';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#202020';
                  (e.currentTarget as HTMLButtonElement).style.borderBottomColor = '#202020';
                }}
              >
                {selectedItems.size === items.length && items.length > 0
                  ? 'Deseleccionar todo'
                  : 'Seleccionar todo'}
              </button>

              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  lineHeight: '1.25',
                  color: '#828282',
                }}
              >
                {selectedItems.size} de {items.length} seleccionados
              </span>
            </div>

            {/* Table */}
            {items.length === 0 ? (
              <div
                className="rounded-lg flex flex-col items-center justify-center py-16 px-6 text-center"
                style={{
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                }}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#828282"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-3"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '15px',
                    lineHeight: '1.33',
                    color: '#202020',
                    fontWeight: 500,
                  }}
                >
                  No hay encomiendas pendientes
                </p>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    lineHeight: '1.33',
                    color: '#828282',
                    marginTop: '4px',
                  }}
                >
                  Este viaje no tiene ítems disponibles para guía de remisión.
                </p>
              </div>
            ) : (
              <div
                className="overflow-hidden"
                style={{
                  borderRadius: '8px',
                  border: '1px solid #e8e8e8',
                }}
              >
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr style={{ backgroundColor: '#efefef' }}>
                        <th
                          className="text-left px-4 py-3"
                          style={{ width: '48px' }}
                        >
                          <span className="sr-only">Seleccionar</span>
                        </th>
                        <th
                          className="text-left px-4 py-3"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '12px',
                            lineHeight: '1.5',
                            color: '#4d4d4d',
                            fontWeight: 500,
                            letterSpacing: '0.02em',
                            textTransform: 'uppercase',
                          }}
                        >
                          Comprobante
                        </th>
                        <th
                          className="text-left px-4 py-3"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '12px',
                            lineHeight: '1.5',
                            color: '#4d4d4d',
                            fontWeight: 500,
                            letterSpacing: '0.02em',
                            textTransform: 'uppercase',
                          }}
                        >
                          Descripción
                        </th>
                        <th
                          className="text-left px-4 py-3"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '12px',
                            lineHeight: '1.5',
                            color: '#4d4d4d',
                            fontWeight: 500,
                            letterSpacing: '0.02em',
                            textTransform: 'uppercase',
                          }}
                        >
                          Destinatario
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => {
                        const isSelected = selectedItems.has(item.invoice_item_id);
                        const isLast = index === items.length - 1;

                        return (
                          <tr
                            key={item.invoice_item_id}
                            onClick={() => handleToggleItem(item.invoice_item_id)}
                            className="transition-colors duration-150 cursor-pointer"
                            style={{
                              backgroundColor: isSelected ? '#f5f5f5' : '#ffffff',
                              borderBottom: isLast ? 'none' : '1px solid #e8e8e8',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#fafafa';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#ffffff';
                              }
                            }}
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleItem(item.invoice_item_id)}
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label={`Seleccionar encomienda ${item.item_description}`}
                                  className="cursor-pointer"
                                  style={{
                                    width: '18px',
                                    height: '18px',
                                    accentColor: '#202020',
                                    cursor: 'pointer',
                                  }}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className="inline-block rounded px-2 py-0.5"
                                style={{
                                  fontFamily: "'Inter', sans-serif",
                                  fontSize: '13px',
                                  lineHeight: '1.25',
                                  color: '#202020',
                                  backgroundColor: '#efefef',
                                  borderRadius: '4px',
                                  fontWeight: 500,
                                  letterSpacing: '-0.01em',
                                }}
                              >
                                {formatInvoiceNumber(item.source_invoice_number)}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span
                                style={{
                                  fontFamily: "'Inter', sans-serif",
                                  fontSize: '15px',
                                  lineHeight: '1.33',
                                  color: '#202020',
                                  fontWeight: isSelected ? 500 : 400,
                                }}
                              >
                                {item.item_description}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span
                                style={{
                                  fontFamily: "'Inter', sans-serif",
                                  fontSize: '15px',
                                  lineHeight: '1.33',
                                  color: '#4d4d4d',
                                }}
                              >
                                {item.client_name || (
                                  <span style={{ color: '#828282' }}>N/A</span>
                                )}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              <div>
                {selectedItems.size > 0 && (
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      lineHeight: '1.25',
                      color: '#202020',
                    }}
                  >
                    <strong>{selectedItems.size}</strong>{' '}
                    {selectedItems.size === 1 ? 'ítem seleccionado' : 'ítems seleccionados'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmSelection}
                  disabled={selectedItems.size === 0}
                  className="transition-all duration-200"
                  style={{
                    backgroundColor: selectedItems.size === 0 ? '#e8e8e8' : '#202020',
                    color: selectedItems.size === 0 ? '#828282' : '#ffffff',
                    borderRadius: '20px',
                    border: 'none',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '15px',
                    lineHeight: '1.25',
                    fontWeight: 500,
                  }}
                >
                  Añadir a la guía
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
