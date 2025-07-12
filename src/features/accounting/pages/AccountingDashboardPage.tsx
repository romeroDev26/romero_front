// src/features/accounting/pages/AccountingDashboardPage.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export const AccountingDashboardPage: React.FC = () => {
  // TODO: Implementar hooks para obtener estadísticas reales
  const stats = {
    pendingInvoices: 12,
    acceptedInvoices: 156,
    rejectedInvoices: 3,
    pendingCreditNotes: 2,
    pendingSummaries: 1,
    pendingVoids: 0
  };

  const quickActions = [
    {
      title: 'Crear Nota de Crédito',
      description: 'Anular una venta existente',
      icon: CreditCardIcon,
      path: '/accounting/credit-notes/new',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Generar Resumen Diario',
      description: 'Informar boletas a SUNAT',
      icon: DocumentTextIcon,
      path: '/accounting/summaries',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Comunicación de Baja',
      description: 'Anular facturas no entregadas',
      icon: ExclamationTriangleIcon,
      path: '/accounting/voids',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      title: 'Ver Facturas',
      description: 'Gestionar comprobantes',
      icon: DocumentTextIcon,
      path: '/accounting/invoices',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  const statusCards = [
    {
      title: 'Pendientes de SUNAT',
      value: stats.pendingInvoices + stats.pendingCreditNotes,
      icon: ClockIcon,
      color: 'text-yellow-600 bg-yellow-100',
      description: 'Documentos enviados esperando respuesta'
    },
    {
      title: 'Aceptados por SUNAT',
      value: stats.acceptedInvoices,
      icon: CheckCircleIcon,
      color: 'text-green-600 bg-green-100',
      description: 'Documentos procesados correctamente'
    },
    {
      title: 'Rechazados por SUNAT',
      value: stats.rejectedInvoices,
      icon: XCircleIcon,
      color: 'text-red-600 bg-red-100',
      description: 'Documentos con errores'
    },
    {
      title: 'Resúmenes Pendientes',
      value: stats.pendingSummaries,
      icon: ChartBarIcon,
      color: 'text-blue-600 bg-blue-100',
      description: 'Lotes de resumen esperando procesamiento'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Contable</h1>
          <p className="text-gray-600">Panel de control para gestión contable y SUNAT</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">{card.description}</p>
          </div>
        ))}
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.path}
                className={`${action.color} text-white rounded-lg p-4 transition-colors duration-200`}
              >
                <div className="flex items-center">
                  <action.icon className="h-8 w-8" />
                  <div className="ml-3">
                    <h3 className="font-semibold">{action.title}</h3>
                    <p className="text-sm opacity-90">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Información Adicional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas Actividades */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Últimas Actividades</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-600">Factura F001-123 aceptada por SUNAT</span>
                <span className="ml-auto text-gray-400">Hace 2 min</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-600">Nota de Crédito BC01-45 creada</span>
                <span className="ml-auto text-gray-400">Hace 15 min</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-gray-600">Resumen RC-20250711-001 enviado</span>
                <span className="ml-auto text-gray-400">Hace 1 hora</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recordatorios */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recordatorios</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Resumen diario pendiente</p>
                  <p className="text-xs text-gray-500">Falta generar el resumen del día anterior</p>
                </div>
              </div>
              <div className="flex items-start">
                <ClockIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Documentos en espera</p>
                  <p className="text-xs text-gray-500">3 documentos pendientes de respuesta de SUNAT</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
