"use client";

import { motion } from "framer-motion";
import { LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts";

export default function LineChartCard({
  title,
  data,
  lines
}: {
  title: string;
  data: Record<string, string | number>[];
  lines: { key: string; color: string; name: string }[];
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="control-card p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">Trend Analysis</p>
      <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip contentStyle={{ borderRadius: 10, borderColor: "#cbd5e1" }} />
            {lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                strokeWidth={2.4}
                dot={false}
                isAnimationActive
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
