'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ACCENT, LINE, axisProps, tooltipStyle } from './palette';
import type { AnalyticsResponse } from '@/types/crm.types';

const shortDate = (value: string) =>
  new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

export function LeadsOverTimeChart({ data }: { data: AnalyticsResponse['leadsOverTime'] }) {
  if (data.length === 0) {
    return <p className="py-16 text-center text-sm text-muted">За последние 30 дней заявок нет.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid stroke={LINE} vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDate} {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip
          {...tooltipStyle}
          labelFormatter={(label) => shortDate(String(label))}
          formatter={(value) => [value as number, 'Заявок']}
        />
        <Line type="monotone" dataKey="count" stroke={ACCENT} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
