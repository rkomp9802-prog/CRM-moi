'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { STATUS_COLORS, SURFACE, tooltipStyle } from './palette';
import { LEAD_STATUS_LABELS, type AnalyticsResponse } from '@/types/crm.types';

export function StatusBreakdownChart({ data }: { data: AnalyticsResponse['statusBreakdown'] }) {
  if (data.length === 0) {
    return <p className="py-16 text-center text-sm text-muted">Заявок пока нет.</p>;
  }

  const chartData = data.map((item) => ({
    name: LEAD_STATUS_LABELS[item.status],
    value: item.count,
    color: STATUS_COLORS[item.status],
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>
          {chartData.map((item) => (
            <Cell key={item.name} fill={item.color} stroke={SURFACE} strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
