import { AlertTriangle, CheckCircle2, ShieldAlert, TriangleAlert } from "lucide-react";

export type BadgeTone = "normal" | "watch" | "high" | "critical";

const styles: Record<BadgeTone, string> = {
  normal: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
  watch: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
  high: "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
  critical: "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
};

const icons = {
  normal: CheckCircle2,
  watch: AlertTriangle,
  high: TriangleAlert,
  critical: ShieldAlert
} as const;

export default function Badge({ tone, label }: { tone: BadgeTone; label?: string }) {
  const Icon = icons[tone];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${styles[tone]}`}>
      <Icon size={11} /> {label || tone}
    </span>
  );
}
