import type { LeadStatus } from '@/types/crm.types';

// Те же цвета, что у бейджей статусов, — чтобы график и список читались как одно целое.
export const STATUS_COLORS: Record<LeadStatus, string> = {
  new: '#8b8d95',
  in_progress: '#7a9bff',
  waiting: '#e0a95c',
  won: '#6ec98a',
  lost: '#f28a8c',
};

export const INK = '#e8e8ea';
export const MUTED = '#9a9ba1';
export const LINE = '#2a2c31';
export const SURFACE = '#191b1f';
export const ACCENT = '#7a9bff';
// Приглушённый парный цвет к ACCENT. Им же recharts красит подпись в легенде,
// поэтому он должен оставаться читаемым на тёмной плашке, а не только на графике.
export const ACCENT_FADED = '#6b7cab';

/** Подсветка столбца под курсором — еле заметное осветление, а не белая плашка. */
export const CURSOR_FILL = 'rgb(255 255 255 / 0.04)';

export const axisProps = {
  stroke: MUTED,
  fontSize: 12,
  tickLine: false,
  axisLine: { stroke: LINE },
} as const;

// recharts рисует подсказку своим div со светлым фоном по умолчанию — задаём цвета явно.
export const tooltipStyle = {
  contentStyle: {
    borderRadius: 6,
    border: `1px solid ${LINE}`,
    backgroundColor: SURFACE,
    color: INK,
    fontSize: 12,
    boxShadow: '0 4px 12px rgb(0 0 0 / 0.4)',
  },
  labelStyle: { color: MUTED },
} as const;
