import RiskBadge from "./RiskBadge";

export default function KPICard({
  label,
  value,
  trend,
  risk
}: {
  label: string;
  value: string;
  trend: string;
  risk: "normal" | "watch" | "high" | "critical";
}) {
  return (
    <div className="control-card p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-slate-700">{trend}</p>
        <RiskBadge risk={risk} />
      </div>
    </div>
  );
}
