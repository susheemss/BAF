"use client";

import { kpiStatus } from "@/lib/tms/kpi";

type Props = {
  label: string;
  value: string;
  trend?: string;
  status?: "green" | "yellow" | "red";
  kpiKey?: "onTimeRate" | "delayRate";
  numericValue?: number;
};

export default function KpiCard({
  label,
  value,
  trend,
  status,
  kpiKey,
  numericValue
}: Props) {
  const derivedStatus =
    status ??
    (kpiKey && numericValue !== undefined
      ? kpiStatus(kpiKey, numericValue)
      : "green");

  return (
    <div className="card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <span className={`pill pill-${derivedStatus}`}>
          {derivedStatus.toUpperCase()}
        </span>
        {trend ? <span className="muted">{trend}</span> : null}
      </div>
    </div>
  );
}
