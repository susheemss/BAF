"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, OctagonAlert, TriangleAlert, ShieldCheck } from "lucide-react";
import Badge, { BadgeTone } from "@/components/Badge";

const iconMap = {
  normal: ShieldCheck,
  watch: TriangleAlert,
  high: TriangleAlert,
  critical: OctagonAlert
} as const;

const toneBorder: Record<BadgeTone, string> = {
  normal: "border-l-emerald-500",
  watch: "border-l-amber-500",
  high: "border-l-orange-500",
  critical: "border-l-red-500"
};

const toneIcon: Record<BadgeTone, string> = {
  normal: "text-emerald-500",
  watch: "text-amber-500",
  high: "text-orange-500",
  critical: "text-red-500"
};

export default function AlertCard({
  title,
  summary,
  detail,
  tone
}: {
  title: string;
  summary: string;
  detail: string;
  tone: BadgeTone;
}) {
  const [open, setOpen] = useState(false);
  const Icon = iconMap[tone];

  return (
    <motion.div whileHover={{ y: -2 }} className={`control-card border-l-4 p-3 ${toneBorder[tone]} ${tone === "critical" ? "shadow-[0_0_0_1px_rgba(239,68,68,0.28),0_0_20px_rgba(239,68,68,0.14)]" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Icon size={16} className={`${toneIcon[tone]} mt-0.5`} />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">{summary}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={tone} />
          <button onClick={() => setOpen((v) => !v)} className="rounded-md border border-slate-200 p-1 text-slate-500 dark:border-slate-700">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300">{detail}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
