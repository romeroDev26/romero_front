// src/features/fluvial/components/sales-point/representatives/RepresentativesInstructions.tsx
import { Info, Users, CreditCard, UserPlus } from 'lucide-react';

export function RepresentativesInstructions() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-blue-900 mb-2">
            Sistema de Representantes Empresariales
          </h4>
          
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
              <span>Configure la cantidad total de pasajes que desea facturar para la empresa</span>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
              <span>Haga clic en "Crear Factura Empresarial" para generar la factura principal</span>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
              <span>Agregue los representantes/empleados que viajarán usando el botón "Agregar Representante"</span>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
              <span>Cada representante aparecerá en el manifiesto con sus datos individuales</span>
            </div>
          </div>
          
          <div className="mt-3 flex items-center gap-4 text-xs text-blue-700">
            <div className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              <span>Una factura para todos</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>Múltiples pasajeros</span>
            </div>
            <div className="flex items-center gap-1">
              <UserPlus className="h-3 w-3" />
              <span>Manifiesto detallado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
