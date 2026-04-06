import RiskBadge from "./RiskBadge";

const rows = [
  { lane: "North Retail", backlog: 31, sla: "84%", risk: "high" as const },
  { lane: "Ecom Prime", backlog: 12, sla: "97%", risk: "normal" as const },
  { lane: "South Express", backlog: 27, sla: "89%", risk: "watch" as const },
  { lane: "Cross Dock", backlog: 44, sla: "78%", risk: "critical" as const }
];

export default function OpsQueueTable() {
  return (
    <div className="control-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Lane Queue Control</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-300 text-slate-600">
              <th className="py-2 pr-4">Lane</th>
              <th className="py-2 pr-4">Backlog</th>
              <th className="py-2 pr-4">SLA</th>
              <th className="py-2">Risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.lane} className="border-b border-slate-200 text-slate-800">
                <td className="py-2 pr-4">{row.lane}</td>
                <td className="py-2 pr-4">{row.backlog}</td>
                <td className="py-2 pr-4">{row.sla}</td>
                <td className="py-2"><RiskBadge risk={row.risk} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
