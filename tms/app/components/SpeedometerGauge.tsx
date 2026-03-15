"use client";

type Props = {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  green: number;
  yellow: number;
  lowerIsBetter?: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function statusFromThresholds(
  value: number,
  green: number,
  yellow: number,
  lowerIsBetter?: boolean
) {
  if (lowerIsBetter) {
    if (value <= green) {
      return "green";
    }
    if (value <= yellow) {
      return "yellow";
    }
    return "red";
  }
  if (value >= green) {
    return "green";
  }
  if (value >= yellow) {
    return "yellow";
  }
  return "red";
}

function valueToAngle(value: number, min: number, max: number) {
  const percent = (value - min) / (max - min || 1);
  return -90 + percent * 180;
}

export default function SpeedometerGauge({
  label,
  value,
  unit,
  min,
  max,
  green,
  yellow,
  lowerIsBetter
}: Props) {
  const clamped = clamp(value, min, max);
  const angle = valueToAngle(clamped, min, max);
  const needle = polarToCartesian(60, 60, 42, angle);

  const greenStart = lowerIsBetter ? min : green;
  const greenEnd = lowerIsBetter ? green : max;
  const yellowStart = lowerIsBetter ? green : yellow;
  const yellowEnd = lowerIsBetter ? yellow : green;
  const redStart = lowerIsBetter ? yellow : min;
  const redEnd = lowerIsBetter ? max : yellow;

  const status = statusFromThresholds(value, green, yellow, lowerIsBetter);

  return (
    <div className="card gauge-card">
      <div className="kpi-label">{label}</div>
      <svg viewBox="0 0 120 70" className="gauge-svg">
        <path
          d={describeArc(
            60,
            60,
            48,
            valueToAngle(redStart, min, max),
            valueToAngle(redEnd, min, max)
          )}
          stroke="#d0473c"
          strokeWidth="10"
          fill="none"
        />
        <path
          d={describeArc(
            60,
            60,
            48,
            valueToAngle(yellowStart, min, max),
            valueToAngle(yellowEnd, min, max)
          )}
          stroke="#d58a16"
          strokeWidth="10"
          fill="none"
        />
        <path
          d={describeArc(
            60,
            60,
            48,
            valueToAngle(greenStart, min, max),
            valueToAngle(greenEnd, min, max)
          )}
          stroke="#23b6a2"
          strokeWidth="10"
          fill="none"
        />
        <line
          x1="60"
          y1="60"
          x2={needle.x}
          y2={needle.y}
          stroke="#0c1020"
          strokeWidth="2"
        />
        <circle cx="60" cy="60" r="4" fill="#0c1020" />
      </svg>
      <div className="gauge-value">
        {value.toFixed(1)} {unit}
      </div>
      <div className={`pill pill-${status}`}>
        {status.toUpperCase()}
      </div>
    </div>
  );
}
