"use client";

import React from "react";

export type DrilldownData = {
  kpi: string;
  kpiValue?: string;
  kpiStatus?: "green" | "yellow" | "red";
  subtitle?: string;
  columns: string[];
  rows: (string | number)[][];
};

type Props = { data: DrilldownData | null; onClose: () => void };

const STATUS_CONFIG = {
  green:  { bg: "rgba(35,182,162,0.12)",  text: "#0b7666", border: "rgba(35,182,162,0.3)",  label: "On Target"     },
  yellow: { bg: "rgba(213,138,22,0.13)",  text: "#a16207", border: "rgba(213,138,22,0.3)",  label: "Needs Attention" },
  red:    { bg: "rgba(208,71,60,0.12)",   text: "#9b1c1c", border: "rgba(208,71,60,0.3)",   label: "Below Target"  },
};

const th: React.CSSProperties = {
  padding: "10px 16px",
  textAlign: "left",
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "1px",
  color: "#5d667a",
  whiteSpace: "nowrap",
  background: "#f4f6fb",
  borderBottom: "1px solid rgba(12,16,32,0.08)",
};

const td: React.CSSProperties = {
  padding: "13px 16px",
  fontSize: "13px",
  borderBottom: "1px solid rgba(12,16,32,0.06)",
  color: "#0c1020",
};

export default function DrilldownModal({ data, onClose }: Props) {
  if (!data) return null;

  const sc = data.kpiStatus ? STATUS_CONFIG[data.kpiStatus] : null;
  const hasRows = data.rows.length > 0;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(8,12,28,0.52)", backdropFilter: "blur(8px)",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%", maxWidth: "780px",
          borderRadius: "22px",
          background: "white",
          border: "1px solid rgba(12,16,32,0.10)",
          boxShadow: "0 48px 96px rgba(8,12,28,0.28)",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          maxHeight: "90vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{
          padding: "24px 28px 20px",
          borderBottom: "1px solid rgba(12,16,32,0.08)",
          background: "linear-gradient(135deg,#f8faff 0%,#ffffff 100%)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span style={{
                display: "inline-block",
                fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px",
                textTransform: "uppercase", color: "#1f4ed8",
                background: "rgba(31,78,216,0.10)", padding: "3px 8px",
                borderRadius: "6px", marginBottom: "8px",
              }}>
                KPI Drill-Down
              </span>
              <h2 style={{
                fontFamily: "var(--font-display)", fontSize: "22px",
                fontWeight: 700, color: "#0c1020", letterSpacing: "-0.3px",
              }}>
                {data.kpi}
              </h2>
              {data.subtitle && (
                <p style={{ color: "#5d667a", fontSize: "13px", marginTop: "5px", lineHeight: 1.5 }}>
                  {data.subtitle}
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", flexShrink: 0 }}>
              {/* KPI value badge */}
              {data.kpiValue && sc && (
                <div style={{
                  padding: "10px 16px", borderRadius: "14px",
                  background: sc.bg, border: `1px solid ${sc.border}`,
                  textAlign: "center", minWidth: "90px",
                }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: sc.text }}>
                    {sc.label}
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.5px", color: sc.text, marginTop: "2px" }}>
                    {data.kpiValue}
                  </div>
                </div>
              )}
              <button
                onClick={onClose}
                style={{
                  background: "rgba(12,16,32,0.06)", border: "1px solid rgba(12,16,32,0.12)",
                  color: "#5d667a", padding: "10px 18px", borderRadius: "12px",
                  cursor: "pointer", fontWeight: 600, fontSize: "13px",
                  boxShadow: "none", fontFamily: "inherit",
                }}
              >
                Close ✕
              </button>
            </div>
          </div>
        </div>

        {/* ── Table Body ── */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {!hasRows ? (
            <div style={{ padding: "60px 28px", textAlign: "center" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>📂</div>
              <p style={{ fontWeight: 600, color: "#0c1020", fontSize: "15px" }}>No records found</p>
              <p style={{ color: "#5d667a", fontSize: "13px", marginTop: "6px" }}>
                Upload a CSV file from the Upload page, or adjust your active filters.
              </p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: "44px", textAlign: "center" }}>Rank</th>
                  {data.columns.map((col) => <th key={col} style={th}>{col}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => {
                  const isTop = i === 0;
                  const lastIdx = row.length - 1;
                  return (
                    <tr
                      key={i}
                      style={{
                        background: isTop
                          ? "rgba(208,71,60,0.04)"
                          : i % 2 === 0 ? "#ffffff" : "#fafbfd",
                        borderLeft: isTop ? "3px solid #d0473c" : "3px solid transparent",
                        transition: "background 0.15s",
                      }}
                    >
                      {/* Rank cell */}
                      <td style={{ ...td, textAlign: "center", fontWeight: 700 }}>
                        {isTop ? (
                          <span style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: "24px", height: "24px", borderRadius: "50%",
                            background: "#d0473c", color: "white", fontSize: "11px", fontWeight: 700,
                          }}>1</span>
                        ) : (
                          <span style={{ color: "#5d667a", fontSize: "12px" }}>{i + 1}</span>
                        )}
                      </td>

                      {row.map((cell, j) => {
                        const isLast = j === lastIdx;
                        const isId = j === 0;
                        const numVal = typeof cell === "number"
                          ? cell.toLocaleString(undefined, { maximumFractionDigits: 2 })
                          : null;
                        return (
                          <td
                            key={j}
                            style={{
                              ...td,
                              fontWeight: isLast ? 700 : isId ? 500 : 400,
                              color: isLast && isTop ? "#d0473c" : isLast ? "#0c1020" : "#0c1020",
                              fontFamily: isId ? "'IBM Plex Mono', monospace" : "inherit",
                              fontSize: isId ? "12px" : "13px",
                            }}
                          >
                            {numVal ?? cell}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Footer ── */}
        {hasRows && (
          <div style={{
            padding: "13px 28px",
            borderTop: "1px solid rgba(12,16,32,0.08)",
            background: "#f8faff",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexShrink: 0, gap: "12px",
          }}>
            <span style={{ fontSize: "11px", color: "#5d667a", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: "16px", height: "16px", borderRadius: "50%",
                background: "#d0473c", color: "white", fontSize: "9px", fontWeight: 700, flexShrink: 0,
              }}>1</span>
              Rank #1 is the highest-impact record — prioritise this to move the KPI
            </span>
            <span style={{
              fontSize: "11px", color: "#5d667a", whiteSpace: "nowrap",
              background: "rgba(12,16,32,0.05)", padding: "3px 8px", borderRadius: "6px",
            }}>
              {data.rows.length} record{data.rows.length !== 1 ? "s" : ""} · from uploaded CSV
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
