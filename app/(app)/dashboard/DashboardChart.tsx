'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface DashboardChartProps {
  data: {
    date: string;
    totale: number;
  }[];
}

export function DashboardChart({ data }: DashboardChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickFormatter={(value) => `€${value}`}
          />
          <Tooltip
            cursor={{ fill: '#F9FAFB' }}
            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
            formatter={(value: number) => [formatCurrency(value), 'Totale']}
            labelStyle={{ color: '#111827', fontWeight: 500, marginBottom: '4px' }}
          />
          <Bar 
            dataKey="totale" 
            fill="#4F46E5" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
