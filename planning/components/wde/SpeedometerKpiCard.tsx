"use client";

type Props = {
  title: string;
  value: number | string;
  unit: string;
  maxValue?: number;
  onClick?: () => void;
};

function toNumber(v: number | string): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

type ThresholdProfile = {
  lower: number;
  upper: number;
  higherIsBetter: boolean;
  scaleMax?: number;
};

function getThresholdProfile(title: string, unit: string, fallbackMax?: number): ThresholdProfile {
  const k = title.toLowerCase();

  if (k.includes("receiving accuracy")) return { lower: 95, upper: 98, higherIsBetter: true, scaleMax: 100 };
  if (k.includes("order fill rate")) return { lower: 92, upper: 97, higherIsBetter: true, scaleMax: 100 };
  if (k.includes("on-time dispatch")) return { lower: 90, upper: 96, higherIsBetter: true, scaleMax: 100 };

  if (k.includes("dock-to-stock")) return { lower: 2.5, upper: 4, higherIsBetter: false, scaleMax: 8 };
  if (k.includes("grn-to-stock")) return { lower: 2, upper: 3.5, higherIsBetter: false, scaleMax: 8 };
  if (k.includes("yard to dock")) return { lower: 20, upper: 40, higherIsBetter: false, scaleMax: 90 };
  if (k.includes("average waiting time")) return { lower: 30, upper: 60, higherIsBetter: false, scaleMax: 120 };
  if (k.includes("maximum waiting time")) return { lower: 60, upper: 120, higherIsBetter: false, scaleMax: 240 };
  if (k.includes("minimum waiting time")) return { lower: 15, upper: 30, higherIsBetter: false, scaleMax: 60 };
  if (k.includes("order cycle time")) return { lower: 12, upper: 24, higherIsBetter: false, scaleMax: 48 };

  if (k.includes("short qty")) return { lower: 100, upper: 300, higherIsBetter: false };
  if (k.includes("total mismatch qty")) return { lower: 50, upper: 200, higherIsBetter: false };
  if (k.includes("order pendency percentage")) return { lower: 5, upper: 12, higherIsBetter: false, scaleMax: 30 };
  if (k.includes("order pendency count")) return { lower: 50, upper: 150, higherIsBetter: false };

  if (k.includes("shipped qty")) return { lower: 0.6, upper: 0.85, higherIsBetter: true };

  if (unit === "%") return { lower: 70, upper: 90, higherIsBetter: true, scaleMax: 100 };
  return { lower: 0.6, upper: 0.85, higherIsBetter: true, scaleMax: fallbackMax };
}

export default function SpeedometerKpiCard({ title, value, unit, maxValue, onClick }: Props) {
  const numeric = toNumber(value);
  const profile = getThresholdProfile(title, unit, maxValue);
  const resolvedScaleMax =
    typeof profile.scaleMax === "number" && profile.scaleMax > 0
      ? profile.scaleMax
      : typeof maxValue === "number" && maxValue > 0
        ? maxValue
        : 0;
  const hasScale = numeric !== null && resolvedScaleMax > 0;
  const pct = hasScale ? Math.max(0, Math.min(1, numeric / resolvedScaleMax)) : 0;

  const normalizeThreshold = (raw: number) => {
    if (raw <= 1) return raw;
    if (resolvedScaleMax <= 0) return 0;
    return Math.max(0, Math.min(1, raw / resolvedScaleMax));
  };

  const low = normalizeThreshold(profile.lower);
  const mid = normalizeThreshold(profile.upper);

  const cx = 90;
  const cy = 90;
  const r = 68;

  const pointOnArc = (p: number) => {
    const clamped = Math.max(0, Math.min(1, p));
    const theta = Math.PI * (1 - clamped);
    return {
      x: cx + r * Math.cos(theta),
      y: cy - r * Math.sin(theta)
    };
  };

  const arcPath = (from: number, to: number) => {
    const start = pointOnArc(from);
    const end = pointOnArc(to);
    return `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;
  };

  const angle = Math.PI * (1 - pct);
  const needleX = cx + r * Math.cos(angle);
  const needleY = cy - r * Math.sin(angle);

  return (
    <div
      className={`rounded-xl border border-slate-200 p-4 dark:border-slate-700 ${onClick ? "cursor-pointer transition-shadow hover:shadow-md hover:border-brand-primary" : ""}`}
      onClick={onClick}
      title={onClick ? `Click to drill down into ${title}` : undefined}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        {onClick && (
          <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400 dark:bg-slate-800">
            drill down ↗
          </span>
        )}
      </div>

      <div className="mt-2 grid place-content-center">
        <svg width="180" height="110" viewBox="0 0 180 110" role="img" aria-label={title}>
          {profile.higherIsBetter ? (
            <>
              <path d={arcPath(0, low)} fill="none" stroke="#ef4444" strokeWidth="12" strokeLinecap="round" />
              <path d={arcPath(low, mid)} fill="none" stroke="#f59e0b" strokeWidth="12" />
              <path d={arcPath(mid, 1)} fill="none" stroke="#22c55e" strokeWidth="12" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d={arcPath(0, low)} fill="none" stroke="#22c55e" strokeWidth="12" strokeLinecap="round" />
              <path d={arcPath(low, mid)} fill="none" stroke="#f59e0b" strokeWidth="12" />
              <path d={arcPath(mid, 1)} fill="none" stroke="#ef4444" strokeWidth="12" strokeLinecap="round" />
            </>
          )}
          <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#0B1F3B" strokeWidth="3" />
          <circle cx={cx} cy={cy} r="5" fill="#0B1F3B" />
        </svg>
      </div>

      <p className="text-center text-3xl font-bold text-brand-primary dark:text-slate-100">{value}</p>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">{unit || "Data Not Available"}</p>
      {!hasScale && <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">Data Not Available</p>}
    </div>
  );
}
