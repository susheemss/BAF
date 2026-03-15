"use client";

type Point = { label: string; value: number };

function buildPath(points: Point[], width: number, height: number, max: number) {
  if (points.length === 0) {
    return "";
  }
  const stepX = width / Math.max(points.length - 1, 1);
  return points
    .map((point, index) => {
      const x = index * stepX;
      const y = height - (point.value / max) * height;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function buildAreaPath(
  points: Point[],
  width: number,
  height: number,
  max: number
) {
  if (points.length === 0) {
    return "";
  }
  const stepX = width / Math.max(points.length - 1, 1);
  const line = points
    .map((point, index) => {
      const x = index * stepX;
      const y = height - (point.value / max) * height;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  return `${line} L ${width} ${height} L 0 ${height} Z`;
}

export default function LineChart({
  title,
  points
}: {
  title: string;
  points: Point[];
}) {
  const width = 320;
  const height = 140;
  const max = Math.max(...points.map((point) => point.value), 1);
  const path = buildPath(points, width, height, max);
  const areaPath = buildAreaPath(points, width, height, max);
  const labelEvery = Math.max(1, Math.ceil(points.length / 5));

  return (
    <div className="card chart-card">
      <div className="kpi-label">{title}</div>
      {points.length === 0 ? (
        <div className="chart-empty">No data for current filters.</div>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="180">
          <defs>
            <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1f4ed8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1f4ed8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={width} height={height} fill="#f8f9fd" />
          <path d={areaPath} fill="url(#lineFill)" />
          <path d={path} fill="none" stroke="#1f4ed8" strokeWidth="3" />
          {points.map((point, index) => {
            if (index % labelEvery !== 0 && index !== points.length - 1) {
              return null;
            }
            const x = (width / Math.max(points.length - 1, 1)) * index;
            return (
              <text
                key={point.label}
                x={x}
                y={height + 14}
                textAnchor="middle"
                fontSize="10"
                fill="#5d667a"
              >
                {point.label}
              </text>
            );
          })}
        </svg>
      )}
    </div>
  );
}
