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
import { useChartTheme } from '../../../hooks/useChartTheme';

// Tooltip personalizado elegante
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dm-bg-primary px-4 py-3 shadow-lg rounded-lg border border-dm-border-secondary">
        <p className="text-sm font-medium text-dm-text-primary mb-2">{label}</p>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-indigo-500" />
          <span className="text-dm-text-secondary">Ventas:</span>
          <span className="font-semibold text-dm-text-primary">
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
  totalVentas?: number;
  isLoading?: boolean;
}

export const TopSellersChart: React.FC<TopSellersChartProps> = ({ 
  sellers,
  totalVentas,
  isLoading = false 
}) => {
  const chartTheme = useChartTheme();
  if (isLoading) {
    return (
      <div className="bg-dm-bg-primary rounded-lg border border-dm-border-primary p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-dm-bg-secondary rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-dm-bg-secondary rounded"></div>
            ))}
          </div>
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

  const computedTotal = top10Sellers.reduce((sum, seller) => sum + seller.net_sales, 0);
  const totalSales = totalVentas ?? computedTotal;

  // Datos para el gráfico de barras horizontal
  const chartData = top10Sellers.map((seller) => ({
    name: seller.seller_name.length > 20 ? seller.seller_name.substring(0, 20) + '...' : seller.seller_name,
    fullName: seller.seller_name,
    value: seller.net_sales,
    count: seller.count,
  })).reverse(); // Invertir para que el mayor esté arriba

  return (
    <div className="bg-dm-bg-primary rounded-lg border border-dm-border-primary p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-dm-text-primary">
            Rendimiento de Vendedores
          </h3>
          <p className="text-xs text-dm-text-muted mt-1">
            Top {top10Sellers.length} por volumen de ventas
          </p>
        </div>
        <span className="text-xs text-dm-text-muted bg-dm-bg-secondary px-2.5 py-1 rounded-md">
          S/ {totalSales.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </span>
      </div>
      
      <ResponsiveContainer width="100%" height={350}>
        <BarChart 
          data={chartData} 
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <defs>
            <linearGradient id="sellersGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.8} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            horizontal={false}
            stroke={chartTheme.grid}
          />
          <XAxis 
            type="number"
            tick={{ fontSize: 11, fill: chartTheme.axis }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
          />
          <YAxis 
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: chartTheme.axis }}
            axisLine={false}
            tickLine={false}
            width={95}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: chartTheme.barHover }} />
          <Bar 
            dataKey="value" 
            fill="url(#sellersGradient)"
            radius={[0, 6, 6, 0]}
            maxBarSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};