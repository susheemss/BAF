"use client";

type Props = {
  severity: "Critical" | "Warning";
  kpi: string;
  scope: string;
  message: string;
};

export default function AlertCard({ severity, kpi, scope, message }: Props) {
  return (
    <div className="alert">
      <span className={`badge ${severity === "Critical" ? "critical" : "warning"}`}>
        {severity}
      </span>
      <div>
        <h4>{kpi}</h4>
        <div className="muted">{scope}</div>
        <div>{message}</div>
      </div>
    </div>
  );
}
