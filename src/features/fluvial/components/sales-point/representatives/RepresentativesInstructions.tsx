// src/features/fluvial/components/sales-point/representatives/RepresentativesInstructions.tsx
import { Info, CreditCard, Users, FileCheck } from 'lucide-react';

export function RepresentativesInstructions() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
          <Info className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-blue-900 mb-3 text-base">
            Sistema de Facturación Empresarial
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span className="text-sm text-blue-800">Configure la cantidad total de pasajes para la empresa</span>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span className="text-sm text-blue-800">Agregue los datos de cada representante que viajará</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span className="text-sm text-blue-800">Asigne asientos específicos o permita elección libre</span>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span className="text-sm text-blue-800">Genere la factura empresarial con el manifiesto detallado</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-6 text-xs text-blue-700 bg-white bg-opacity-60 rounded-lg py-3 px-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span className="font-medium">Una factura unificada</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="font-medium">Múltiples pasajeros</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileCheck className="h-4 w-4" />
              <span className="font-medium">Manifiesto completo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}