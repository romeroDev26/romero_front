import React from 'react';
import { RouteMetric } from '../../../types/reports';

interface PopularRoutesChartProps {
  routes: RouteMetric; // Ahora es un diccionario, no array
  isLoading?: boolean;
}

export const PopularRoutesChart: React.FC<PopularRoutesChartProps> = ({ 
  routes, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Convertir el diccionario a array y tomar el top 8 ordenados por monto
  // Backend envía: { "IQUITOS - NAUTA": { cantidad: 2, monto: 15.0 } }
  const routesArray = Object.entries(routes || {}).map(([name, data]) => ({
    route_name: name,
    total_amount: data.monto,
    count: data.cantidad,
  }));
  
  const popularRoutes = routesArray
    .sort((a, b) => b.total_amount - a.total_amount)
    .slice(0, 8);

  if (popularRoutes.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Rutas Más Populares
        </h3>
        <div className="text-center py-8 text-gray-500">
          No hay datos de rutas disponibles
        </div>
      </div>
    );
  }

  const totalRevenue = popularRoutes.reduce((sum, route) => sum + route.total_amount, 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Rutas Más Populares
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de rutas */}
        <div className="space-y-3">
          {popularRoutes.map((route, index) => {
            const percentage = (route.total_amount / totalRevenue) * 100;
            
            return (
              <div key={route.route_name} className="relative">
                {/* Barra de progreso de fondo */}
                <div className="bg-gray-100 rounded-lg p-4 relative overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-blue-100 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                  
                  {/* Contenido */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`
                        inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white
                        ${index === 0 ? 'bg-green-500' : 
                          index === 1 ? 'bg-blue-500' : 
                          index === 2 ? 'bg-purple-500' : 'bg-gray-500'}
                      `}>
                        {index + 1}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {route.route_name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        S/ {route.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-gray-600">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Estadísticas resumen */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Estadísticas de Rutas</h4>
          
          {/* Métricas principales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {popularRoutes.length}
              </div>
              <div className="text-sm text-blue-700">Rutas Activas</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                S/ {totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
              </div>
              <div className="text-sm text-green-700">Total Ingresos</div>
            </div>
          </div>

          {/* Ruta más popular */}
          {popularRoutes.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">🏆 Ruta Más Popular</h5>
              <div className="text-lg font-semibold text-blue-600">
                {popularRoutes[0].route_name}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                S/ {popularRoutes[0].total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })} en ventas
              </div>
            </div>
          )}

          {/* Promedio por ruta */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">📊 Promedios</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ingresos por ruta:</span>
                <span className="font-medium">
                  S/ {Math.round(totalRevenue / popularRoutes.length).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};