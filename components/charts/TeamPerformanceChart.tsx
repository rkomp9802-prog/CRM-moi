'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ACCENT, ACCENT_FADED, CURSOR_FILL, LINE, axisProps, tooltipStyle } from './palette';
import type { AnalyticsResponse } from '@/types/crm.types';

type TeamPerformance = NonNullable<AnalyticsResponse['teamPerformance']>;

export function TeamPerformanceChart({ data }: { data: TeamPerformance }) {
  if (data.length === 0) {
    return <p className="py-16 text-center text-sm text-muted">Сотрудников пока нет.</p>;
  }

  const chartData = data.map((item) => ({
    name: item.userName,
    Успешных: item.won,
    Всего: item.total,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid stroke={LINE} vertical={false} />
        <XAxis dataKey="name" interval={0} {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip {...tooltipStyle} cursor={{ fill: CURSOR_FILL }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Всего" fill={ACCENT_FADED} radius={[3, 3, 0, 0]} maxBarSize={36} />
        <Bar dataKey="Успешных" fill={ACCENT} radius={[3, 3, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
