"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import Badge, { BadgeTone } from "@/components/Badge";

const riskAccent: Record<BadgeTone, string> = {
  normal: "border-l-emerald-500",
  watch: "border-l-amber-500",
  high: "border-l-orange-500",
  critical: "border-l-red-500"
};

export default function KPIWidget({
  title,
  value,
  suffix,
  trend,
  risk,
  tooltip,
  sparkline
}: {
  title: string;
  value: number;
  suffix?: string;
  trend: string;
  risk: BadgeTone;
  tooltip: string;
  sparkline?: number[];
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 700;
    const step = Math.max(value / (duration / 16), 0.1);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  const data = useMemo(() => (sparkline ?? []).map((v, i) => ({ i, v })), [sparkline]);

  return (
    <motion.div
      title={tooltip}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      className={`control-card h-[172px] border-l-4 p-4 ${riskAccent[risk]}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <Badge tone={risk} />
      </div>

      <p className="mt-3 text-3xl font-bold text-brand-primary dark:text-slate-100">
        {display.toFixed(value % 1 === 0 ? 0 : 2)}{suffix || ""}
      </p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{trend}</p>

      <div className="mt-3 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <Area type="monotone" dataKey="v" stroke="#00B3A4" fill="#00B3A4" fillOpacity={0.16} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
