'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/**
 * The visual charts only. Each card also shows the same numbers as text
 * (for screen readers and for anyone who prefers numbers), so these are
 * hidden from assistive technology.
 */

export interface ChartBar {
  label: string;
  value: number;
}

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--card)',
  color: 'var(--foreground)',
  fontSize: 12,
};

export function BarsChart({
  data,
  layout = 'columns',
  valueLabel,
}: {
  data: ChartBar[];
  /** columns: bars go up (weeks) · rows: bars go across (statuses). */
  layout?: 'columns' | 'rows';
  valueLabel: string;
}) {
  const rows = layout === 'rows';
  return (
    <div aria-hidden="true" className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          // The numbers are offered as text instead, so the chart itself stays
          // out of the keyboard order (Recharts adds a keyboard layer by default).
          accessibilityLayer={false}
          data={data}
          layout={rows ? 'vertical' : 'horizontal'}
          margin={{ top: 4, right: 8, bottom: 0, left: rows ? 8 : -24 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            horizontal={!rows}
            vertical={rows}
          />
          {rows ? (
            <>
              <XAxis type="number" allowDecimals={false} hide />
              <YAxis
                type="category"
                dataKey="label"
                width={80}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              />
            </>
          )}
          <Tooltip
            cursor={{ fill: 'var(--muted)' }}
            contentStyle={tooltipStyle}
            formatter={(value) => [value, valueLabel]}
          />
          <Bar
            dataKey="value"
            fill="var(--lavender)"
            radius={rows ? [0, 6, 6, 0] : [6, 6, 0, 0]}
            maxBarSize={36}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
