"use client";

import { useMemo, useState } from "react";

type Item = { kpi: string; value: number | string; unit: string };

type Props = {
  tabs: Record<string, Item[]>;
};

const ORDER = ["1-2", "3-4", "5-8", "9-11", "12-16", "17-18"];
const TAB_LABELS: Record<string, string> = {
  "1-2": "Inbound Velocity",
  "3-4": "Receiving Quality",
  "5-8": "Yard Dwell & Throughput",
  "9-11": "Fulfillment Accuracy",
  "12-16": "Order Cycle Efficiency",
  "17-18": "Dispatch Backlog"
};

export default function KpiWorkbookTabs({ tabs }: Props) {
  const available = useMemo(() => ORDER.filter((tab) => tabs?.[tab]?.length), [tabs]);
  const [active, setActive] = useState<string>(available[0] || "1-2");

  const rows = tabs?.[active] || [];

  return (
    <div className="control-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">WMS Formula KPI Tabs (System Performance Excluded)</h3>
        <p className="text-xs text-slate-600">Sheet1 KPIs 1-18 mapped across workbook tabs</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {ORDER.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`rounded border px-2 py-1 text-xs ${
              active === tab ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"
            }`}
          >
            {TAB_LABELS[tab] || tab}
          </button>
        ))}
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-300 text-slate-600">
              <th className="py-2 pr-4">KPI</th>
              <th className="py-2 pr-4">Value</th>
              <th className="py-2">Unit</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="py-3 text-slate-600" colSpan={3}>
                  No KPI rows available for this tab yet.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.kpi} className="border-b border-slate-200 text-slate-800">
                <td className="py-2 pr-4">{row.kpi}</td>
                <td className="py-2 pr-4">{row.value}</td>
                <td className="py-2">{row.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
