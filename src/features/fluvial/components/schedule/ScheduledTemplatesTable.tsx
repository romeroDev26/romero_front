// src/features/fluvial/components/schedule/ScheduledTemplatesTable.tsx
import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { ScheduledRouteTemplate } from '../../../../types';

interface Props {
  templates: ScheduledRouteTemplate[];
  onEdit: (template: ScheduledRouteTemplate) => void;
  onDelete: (template: ScheduledRouteTemplate) => void;
}

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Mi\u00e9rcoles', 'Jueves', 'Viernes', 'S\u00e1bado', 'Domingo'];

export const ScheduledTemplatesTable: React.FC<Props> = ({
  templates,
  onEdit,
  onDelete,
}) => {
  if (!templates.length) {
    return (
      <div className="text-center py-4 text-gray-500">
        No hay plantillas configuradas.
      </div>
    );
  }

  const getDayOfWeekLabel = (day: number) => {
    // day_of_week: 1=Lunes, 7=Domingo. Nuestro array es 0-indexed.
    return DAYS_OF_WEEK[day - 1] || 'D\u00eda inv\u00e1lido';
  };

  return (
    <>
      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">{template.template_name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {template.route?.origin_port?.name} → {template.route?.destination_port?.name}
                </p>
              </div>
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  template.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {template.is_active ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            <div className="space-y-2 text-sm mb-3">
              <div>
                <span className="block text-xs text-gray-500">Ruta</span>
                <span className="font-medium text-gray-900">{template.route?.name}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500">Embarcaci\u00f3n</span>
                <span className="font-medium text-gray-900">
                  {template.vessel?.name || <span className="text-gray-400">No asignada</span>}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-xs text-gray-500">D\u00eda Salida</span>
                  <span className="font-medium text-gray-900">{getDayOfWeekLabel(template.day_of_week)}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500">Hora Salida</span>
                  <span className="font-medium text-gray-900 font-mono">{template.departure_time.substring(0, 5)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => onEdit(template)}
                className="flex items-center text-sm"
              >
                <PencilIcon className="h-4 w-4 mr-1" /> Editar
              </Button>
              <Button
                variant="outline"
                onClick={() => onDelete(template)}
                className="flex items-center text-sm text-red-600 hover:text-red-800"
              >
                <TrashIcon className="h-4 w-4 mr-1" /> Desactivar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre Plantilla
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ruta
              </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Embarcaci\u00f3n
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                D\u00eda Salida
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hora Salida
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {templates.map((template) => (
              <tr key={template.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{template.template_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{template.route?.name}</div>
                  <div className="text-sm text-gray-500">
                      {template.route?.origin_port?.name} → {template.route?.destination_port?.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {template.vessel?.name || <span className="text-gray-400">No asignada</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {getDayOfWeekLabel(template.day_of_week)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {/* La hora viene en "HH:MM:SS", la mostramos como "HH:mm" */}
                  {template.departure_time.substring(0, 5)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      template.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {template.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onEdit(template)}
                      className="p-1"
                      title="Editar"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onDelete(template)}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Desactivar"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};