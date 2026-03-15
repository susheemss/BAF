"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function DonutChartCard({
  title,
  data
}: {
  title: string;
  data: { label: string; value: number; color: string }[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="control-card p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">Risk Mix</p>
      <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <div className="relative mt-2 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={70} outerRadius={98} isAnimationActive>
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => `${((v / total) * 100).toFixed(1)}%`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Total Alerts</p>
          <p className="text-2xl font-bold text-brand-primary dark:text-slate-100">{total}</p>
        </div>
      </div>
    </motion.div>
  );
}
