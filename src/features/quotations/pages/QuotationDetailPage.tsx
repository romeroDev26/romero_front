// src/features/quotations/pages/QuotationDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { quotationsService } from '../services/quotations.service';
import { Quotation, QuotationStatus } from '../types';

const statusLabels: Record<QuotationStatus, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Expirada',
  CONVERTED: 'Convertida'
};

const statusColors: Record<QuotationStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-yellow-100 text-yellow-800',
  CONVERTED: 'bg-purple-100 text-purple-800'
};

export const QuotationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchQuotation(parseInt(id));
    }
  }, [id]);

  const fetchQuotation = async (quotationId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await quotationsService.getById(quotationId);
      setQuotation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cotización');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPDF = () => {
    if (quotation) {
      // Aquí implementaremos la generación de PDF
      console.log('Generar PDF para cotización:', quotation.id);
      // TODO: Implementar generación de PDF
    }
  };

  const handleSendEmail = async () => {
    if (quotation) {
      try {
        await quotationsService.sendByEmail(quotation.id);
        setQuotation(prev => prev ? { ...prev, status: 'SENT' } : null);
      } catch (err) {
        alert('Error al marcar como enviada');
      }
    }
  };

  const handleConvertToInvoice = () => {
    if (quotation) {
      navigate(`/sales/quotations/${quotation.id}/convert-to-invoice`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error: {error}</div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/sales/quotations')}
          className="mt-4"
        >
          Volver a la Lista
        </Button>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          <p>Cotización no encontrada</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/sales/quotations')}
          className="mt-4"
        >
          Volver a la Lista
        </Button>
      </div>
    );
  }

  const isExpired = new Date(quotation.valid_until) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Cotización {quotation.series}-{quotation.number.toString().padStart(6, '0')}
          </h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handlePrintPDF}>
            Imprimir PDF
          </Button>
          {quotation.status === 'DRAFT' && (
            <>
              <Button 
                variant="outline" 
                onClick={() => navigate(`/sales/quotations/${quotation.id}/edit`)}
              >
                Editar
              </Button>
              <Button onClick={handleSendEmail}>
                Enviar por Email
              </Button>
            </>
          )}
          {quotation.status === 'ACCEPTED' && (
            <Button onClick={handleConvertToInvoice}>
              Convertir a Factura
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => navigate('/sales/quotations')}
          >
            Volver
          </Button>
        </div>
      </div>

      {/* Estado y validez */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusColors[quotation.status]}`}>
                {statusLabels[quotation.status]}
              </span>
              {isExpired && quotation.status !== 'CONVERTED' && (
                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                  Expirada
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Válida hasta: {new Date(quotation.valid_until).toLocaleDateString('es-ES')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {quotation.currency_code} {parseFloat(quotation.total_payable).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              {quotation.total_in_words}
            </p>
          </div>
        </div>
      </div>

      {/* Información general */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información de la empresa */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Empresa</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Nombre:</span> {quotation.company.business_name}</p>
            <p><span className="font-medium">RUC:</span> {quotation.company.ruc}</p>
            <p><span className="font-medium">Dirección:</span> {quotation.company.address}</p>
            <p><span className="font-medium">Teléfono:</span> {quotation.company.phone}</p>
            <p><span className="font-medium">Email:</span> {quotation.company.email}</p>
          </div>
        </div>

        {/* Información del cliente */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cliente</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Nombre:</span> {quotation.client.name}</p>
            <p><span className="font-medium">Documento:</span> {quotation.client.doc_number}</p>
            <p><span className="font-medium">Dirección:</span> {quotation.client.address_line}</p>
            <p><span className="font-medium">Teléfono:</span> {quotation.client.phone}</p>
            <p><span className="font-medium">Email:</span> {quotation.client.email}</p>
          </div>
        </div>
      </div>

      {/* Información de la cotización */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles de la Cotización</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Fecha de Emisión</p>
            <p className="font-medium">{new Date(quotation.issue_date).toLocaleDateString('es-ES')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Vendedor</p>
            <p className="font-medium">{quotation.seller.full_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Moneda</p>
            <p className="font-medium">{quotation.currency_code}</p>
          </div>
          {quotation.payment_terms && (
            <div>
              <p className="text-sm text-gray-600">Términos de Pago</p>
              <p className="font-medium">{quotation.payment_terms}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Tipo de Cambio</p>
            <p className="font-medium">{quotation.exchange_rate}</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P. Unitario
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descuento
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subtotal
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IGV
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotation.items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{item.item_description}</div>
                      <div className="text-xs text-gray-500">
                        Código: {item.product_id} | Unidad: {item.unit_code}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {item.unit_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {item.discount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {(item.quantity * item.unit_price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {(item.quantity * item.unit_price * 0.18).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                    {(item.quantity * item.unit_price * 1.18).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totales */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Totales</h3>
        <div className="space-y-2 max-w-md ml-auto">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{quotation.currency_code} {parseFloat(quotation.total_taxable).toFixed(2)}</span>
          </div>
          {parseFloat(quotation.total_discount) > 0 && (
            <div className="flex justify-between">
              <span>Descuento:</span>
              <span>{quotation.currency_code} {parseFloat(quotation.total_discount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>IGV (18%):</span>
            <span>{quotation.currency_code} {parseFloat(quotation.total_igv).toFixed(2)}</span>
          </div>
          {parseFloat(quotation.total_isc) > 0 && (
            <div className="flex justify-between">
              <span>ISC:</span>
              <span>{quotation.currency_code} {parseFloat(quotation.total_isc).toFixed(2)}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>{quotation.currency_code} {parseFloat(quotation.total_payable).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notas */}
      {(quotation.notes || quotation.internal_notes) && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notas</h3>
          {quotation.notes && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Notas del Cliente:</h4>
              <p className="text-gray-700">{quotation.notes}</p>
            </div>
          )}
          {quotation.internal_notes && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Notas Internas:</h4>
              <p className="text-gray-700">{quotation.internal_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
