'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ACCENT, CURSOR_FILL, LINE, axisProps, tooltipStyle } from './palette';
import { LEAD_SOURCE_LABELS, type AnalyticsResponse } from '@/types/crm.types';

export function SourceBreakdownChart({ data }: { data: AnalyticsResponse['sourceBreakdown'] }) {
  if (data.length === 0) {
    return <p className="py-16 text-center text-sm text-muted">Заявок пока нет.</p>;
  }

  const chartData = data.map((item) => ({
    name: LEAD_SOURCE_LABELS[item.source],
    count: item.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid stroke={LINE} vertical={false} />
        <XAxis dataKey="name" interval={0} {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip {...tooltipStyle} cursor={{ fill: CURSOR_FILL }} formatter={(value) => [value as number, 'Заявок']} />
        <Bar dataKey="count" fill={ACCENT} radius={[3, 3, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}
