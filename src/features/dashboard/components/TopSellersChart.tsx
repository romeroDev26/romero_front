import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { SellerMetric } from '../../../types/reports';

// Tooltip personalizado elegante
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 shadow-lg rounded-lg border border-gray-100">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-indigo-500" />
          <span className="text-gray-600">Ventas:</span>
          <span className="font-semibold text-gray-900">
            S/ {Number(payload[0].value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

interface TopSellersChartProps {
  sellers: SellerMetric;
  isLoading?: boolean;
}

export const TopSellersChart: React.FC<TopSellersChartProps> = ({ 
  sellers,
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Convertir el diccionario a array y tomar el top 10 ordenados por monto
  const sellersArray = Object.entries(sellers || {}).map(([, data]) => ({
    seller_name: data.nombre,
    net_sales: data.monto,
    count: data.cantidad,
  }));
  
  const top10Sellers = sellersArray
    .sort((a, b) => b.net_sales - a.net_sales)
    .slice(0, 10);

  // Datos para el gráfico de barras horizontal
  const chartData = top10Sellers.map((seller, index) => ({
    name: seller.seller_name.length > 15 ? seller.seller_name.substring(0, 15) + '...' : seller.seller_name,
    fullName: seller.seller_name,
    value: seller.net_sales,
    rank: index + 1,
  })).reverse(); // Invertir para que el #1 esté arriba

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        Top 10 Vendedores por Monto de Ventas
      </h3>
      
      <ResponsiveContainer width="100%" height={350}>
        <BarChart 
          data={chartData} 
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <defs>
            <linearGradient id="sellersGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            horizontal={false}
            stroke="#f0f0f0"
          />
          <XAxis 
            type="number"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
          />
          <YAxis 
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            width={75}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }} />
          <Bar 
            dataKey="value" 
            fill="url(#sellersGradient)"
            radius={[0, 6, 6, 0]}
            maxBarSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
      
      {/* Estadísticas totales */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-6 text-center">
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-indigo-600">
              {top10Sellers.length}
            </div>
            <div className="text-sm text-gray-600 font-medium">Vendedores</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              S/ {top10Sellers.reduce((sum, seller) => sum + seller.net_sales, 0).toLocaleString('es-PE')}
            </div>
            <div className="text-sm text-gray-600 font-medium">Total Ventas</div>
          </div>
        </div>
      </div>
    </div>
  );
};