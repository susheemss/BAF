export default function RiskBadge({ risk }: { risk: "normal" | "watch" | "high" | "critical" }) {
  const map = {
    normal: "bg-emerald-100 text-emerald-900 border-emerald-300",
    watch: "bg-amber-100 text-amber-900 border-amber-300",
    high: "bg-orange-100 text-orange-900 border-orange-300",
    critical: "bg-rose-100 text-rose-900 border-rose-300"
  } as const;

  return (
    <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${map[risk]}`}>
      {risk}
    </span>
  );
}
