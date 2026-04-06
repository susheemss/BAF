"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

type Item = { label: string; value: number; color: string };

export default function RiskDonut({ data }: { data: Item[] }) {
  const total = useMemo(() => data.reduce((a, b) => a + b.value, 0), [data]);

  return (
    <div className="control-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Risk Distribution</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={60} outerRadius={90}>
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-slate-600">Total alerts: {total}</p>
    </div>
  );
}
