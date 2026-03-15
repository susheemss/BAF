import RiskBadge from "./RiskBadge";

export default function DriftAlert({
  title,
  detail,
  risk
}: {
  title: string;
  detail: string;
  risk: "normal" | "watch" | "high" | "critical";
}) {
  return (
    <div className="control-card flex items-start justify-between gap-3 p-4">
      <div>
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        <p className="mt-1 text-xs text-slate-700">{detail}</p>
      </div>
      <RiskBadge risk={risk} />
    </div>
  );
}
