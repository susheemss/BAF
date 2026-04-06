"use client";

type Bar = { label: string; value: number };

export default function BarChart({
  title,
  bars,
  unit
}: {
  title: string;
  bars: Bar[];
  unit: string;
}) {
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  return (
    <div className="card">
      <div className="kpi-label">{title}</div>
      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="muted" style={{ fontSize: 12 }}>
              {bar.label}
            </div>
            <div
              style={{
                height: 10,
                borderRadius: 999,
                background: "rgba(10, 124, 95, 0.15)",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  width: `${(bar.value / max) * 100}%`,
                  height: "100%",
                  background: "#0a7c5f"
                }}
              />
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              {bar.value.toFixed(1)} {unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
