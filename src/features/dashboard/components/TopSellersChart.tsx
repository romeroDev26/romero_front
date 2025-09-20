import React from 'react';

interface SellerData {
  name: string;
  total_invoices: number;
  total_amount: string;
}

interface TopSellersChartProps {
  sellersSummary: Record<string, SellerData>;
  isLoading?: boolean;
}

export const TopSellersChart: React.FC<TopSellersChartProps> = ({ 
  sellersSummary, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Convertir el objeto a array y ordenar por monto de ventas
  const chartData = Object.entries(sellersSummary)
    .map(([sellerId, seller]) => ({
      name: seller.name,
      amount: parseFloat(seller.total_amount),
      invoices: seller.total_invoices,
      sellerId: sellerId
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10); // Solo top 10

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Top 10 Vendedores por Monto de Ventas
      </h3>
      
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 mb-3">Ranking Detallado</h4>
        <div className="space-y-3">
          {chartData.map((seller, index) => (
            <div key={seller.sellerId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <span className={`
                    inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white
                    ${index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-yellow-600' : 'bg-blue-500'}
                  `}>
                    {index + 1}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {seller.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {seller.invoices} facturas
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg text-gray-900">
                  S/ {seller.amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-600">
                  S/ {(seller.amount / seller.invoices).toFixed(0)} prom.
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Estadísticas totales */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {chartData.length}
              </div>
              <div className="text-sm text-gray-600 font-medium">Vendedores</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                S/ {chartData.reduce((sum, seller) => sum + seller.amount, 0).toLocaleString('es-PE')}
              </div>
              <div className="text-sm text-gray-600 font-medium">Total Ventas</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};