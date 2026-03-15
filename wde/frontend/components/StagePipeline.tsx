export default function StagePipeline({
  stages
}: {
  stages: { name: string; duration: string; status: "normal" | "watch" | "high" | "critical" }[];
}) {
  const border = {
    normal: "border-emerald-500/60",
    watch: "border-yellow-500/60",
    high: "border-orange-500/60",
    critical: "border-rose-500/60"
  } as const;

  return (
    <div className="grid gap-3 md:grid-cols-5">
      {stages.map((stage) => (
        <div key={stage.name} className={`control-card border-l-4 p-3 ${border[stage.status]}`}>
          <p className="text-xs text-slate-600">{stage.name}</p>
          <p className="mt-1 text-base font-semibold text-slate-900">{stage.duration}</p>
        </div>
      ))}
    </div>
  );
}
