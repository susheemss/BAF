import pptxgen from "pptxgenjs";
import type { WmsKpis, TmsKpis, PlanningKpis, CrossKpis } from "./loadData";

// ── Palette (no # prefix for pptxgenjs) ──────────────────────────────────────
const NAVY    = "0A1F3D";
const NAVY2   = "1E3A5F";
const TEAL    = "00B4A2";
const WHITE   = "FFFFFF";
const SILVER  = "F1F5F9";
const SILVER2 = "EFF6FF";
const SLATE   = "64748B";
const DKGRAY  = "334155";
const GREEN   = "059669";
const AMBER   = "D97706";
const RED     = "DC2626";
const LGRAY   = "CBD5E1";
const TEAL_BG = "F0FDFA";

const TOTAL_SLIDES = 8;

// ── Types ─────────────────────────────────────────────────────────────────────
type Alert = { message: string; severity: "critical" | "high" | "medium" };

export interface PresentationData {
  wms:      WmsKpis;
  tms:      TmsKpis;
  planning: PlanningKpis;
  cross:    CrossKpis;
  alerts:   Alert[];
  breaches: string[];
  warehouse: string;
  dateRange: string;
  monthlyTrend: { month: string; wms: number; tms: number; planning: number }[];
  warehouseBreakdown: { wh: string; onTimeDispatch: number; orderFillRate: number; onTimeDelivery: number; delayRate: number }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function achievePct(actual: number, target: number, lowerIsBetter = false): number {
  if (actual === 0 && lowerIsBetter) return 100;
  const r = lowerIsBetter ? (target / Math.max(actual, 0.01)) : (actual / Math.max(target, 0.01));
  return Math.round(Math.min(r, 1) * 100);
}

function ragColor(pct: number): string {
  if (pct >= 97) return GREEN;
  if (pct >= 88) return AMBER;
  return RED;
}

function ragLabel(pct: number): string {
  if (pct >= 97) return "ON TRACK";
  if (pct >= 88) return "AT RISK";
  return "BELOW TARGET";
}

// ── Shared layout helpers ─────────────────────────────────────────────────────
function addHeader(slide: pptxgen.Slide, title: string, subtitle: string) {
  slide.addShape("rect" as pptxgen.ShapeType, { x: 0, y: 0, w: 13.33, h: 0.95, fill: { color: NAVY } });
  slide.addShape("rect" as pptxgen.ShapeType, { x: 0, y: 0.95, w: 13.33, h: 0.05, fill: { color: TEAL } });
  slide.addText(title, {
    x: 0.35, y: 0.1, w: 9.5, h: 0.48,
    fontSize: 20, bold: true, color: WHITE, fontFace: "Calibri",
  });
  slide.addText(subtitle, {
    x: 0.35, y: 0.58, w: 10, h: 0.3,
    fontSize: 10, color: TEAL, fontFace: "Calibri",
  });
}

function addHeadline(slide: pptxgen.Slide, text: string) {
  slide.addShape("rect" as pptxgen.ShapeType, { x: 0.3, y: 1.08, w: 12.73, h: 0.52, fill: { color: SILVER2 }, line: { color: "BFDBFE", width: 0.5 } });
  slide.addShape("rect" as pptxgen.ShapeType, { x: 0.3, y: 1.08, w: 0.07, h: 0.52, fill: { color: TEAL } });
  slide.addText(text, {
    x: 0.5, y: 1.11, w: 12.4, h: 0.44,
    fontSize: 11.5, bold: true, color: NAVY, fontFace: "Calibri",
  });
}

function addFooter(slide: pptxgen.Slide, pageNum: number, source = "Source: WMS · TMS · Planning Hub") {
  slide.addShape("line" as pptxgen.ShapeType, { x: 0.3, y: 7.12, w: 12.73, h: 0, line: { color: LGRAY, width: 0.6 } });
  slide.addText(source, { x: 0.35, y: 7.18, w: 7, h: 0.25, fontSize: 7.5, color: SLATE, fontFace: "Calibri" });
  slide.addText("CONFIDENTIAL", { x: 0.35, y: 7.18, w: 12.6, h: 0.25, fontSize: 7.5, color: SLATE, fontFace: "Calibri", align: "center" });
  slide.addText(`${pageNum} / ${TOTAL_SLIDES}`, { x: 0.35, y: 7.18, w: 12.6, h: 0.25, fontSize: 7.5, color: SLATE, fontFace: "Calibri", align: "right" });
}

function addSectionLabel(slide: pptxgen.Slide, x: number, y: number, w: number, text: string) {
  slide.addText(text.toUpperCase(), {
    x, y, w, h: 0.22, fontSize: 7.5, bold: true, color: SLATE,
    charSpacing: 1.5, fontFace: "Calibri",
  });
  slide.addShape("line" as pptxgen.ShapeType, { x, y: y + 0.22, w, h: 0, line: { color: LGRAY, width: 0.5 } });
}

// ── Reusable KPI table (actual / target / delta / status) ─────────────────────
function addKpiTable(
  slide: pptxgen.Slide,
  x: number, y: number, w: number,
  rows: { label: string; actual: string; target: string; pct: number }[],
) {
  const rh = 0.6;
  // Header
  slide.addShape("rect" as pptxgen.ShapeType, { x, y, w, h: 0.32, fill: { color: NAVY } });
  [["KPI", 0], ["Actual", w * 0.42], ["Target", w * 0.57], ["vs Target", w * 0.72], ["Status", w * 0.84]].forEach(([label, ox]) => {
    slide.addText(label as string, {
      x: x + (ox as number) + 0.05, y: y + 0.04, w: w * 0.2, h: 0.24,
      fontSize: 7.5, bold: true, color: WHITE, fontFace: "Calibri",
    });
  });
  y += 0.32;

  rows.forEach((row, i) => {
    const bg = i % 2 === 0 ? WHITE : SILVER;
    const delta = row.pct - 100;
    const deltaStr = `${delta >= 0 ? "+" : ""}${delta}%`;
    const color = ragColor(row.pct);
    slide.addShape("rect" as pptxgen.ShapeType, { x, y, w, h: rh, fill: { color: bg }, line: { color: LGRAY, width: 0.3 } });
    slide.addText(row.label, { x: x + 0.08, y: y + 0.14, w: w * 0.4, h: 0.3, fontSize: 9, color: DKGRAY, fontFace: "Calibri" });
    slide.addText(row.actual, { x: x + w * 0.42, y: y + 0.14, w: w * 0.14, h: 0.3, fontSize: 9.5, bold: true, color: NAVY, fontFace: "Calibri" });
    slide.addText(row.target, { x: x + w * 0.57, y: y + 0.14, w: w * 0.14, h: 0.3, fontSize: 9, color: SLATE, fontFace: "Calibri" });
    slide.addText(deltaStr,   { x: x + w * 0.72, y: y + 0.14, w: w * 0.13, h: 0.3, fontSize: 9, bold: true, color: delta >= 0 ? GREEN : RED, fontFace: "Calibri" });
    // Status pill
    slide.addShape("rect" as pptxgen.ShapeType, { x: x + w * 0.83, y: y + 0.16, w: w * 0.16, h: 0.26, fill: { color: `${color}22` }, line: { color, width: 0.8 }, rectRadius: 0.08 });
    slide.addText(ragLabel(row.pct), { x: x + w * 0.83, y: y + 0.17, w: w * 0.16, h: 0.26, fontSize: 6.5, bold: true, color, fontFace: "Calibri", align: "center" });
    y += rh;
  });
}

// ── Slide 1: Cover ────────────────────────────────────────────────────────────
function addCoverSlide(pptx: pptxgen, d: PresentationData) {
  const slide = pptx.addSlide();
  // Full navy background
  slide.addShape("rect" as pptxgen.ShapeType, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: NAVY } });
  // Teal left bar
  slide.addShape("rect" as pptxgen.ShapeType, { x: 0, y: 0, w: 0.22, h: 7.5, fill: { color: TEAL } });
  // Subtle grid lines
  for (let i = 1; i < 6; i++) {
    slide.addShape("line" as pptxgen.ShapeType, { x: 0.22, y: i * 1.25, w: 13.11, h: 0, line: { color: NAVY2, width: 0.5 } });
  }
  // Tag
  slide.addText("CONFIDENTIAL  ·  S&OP EXECUTIVE REVIEW", {
    x: 0.5, y: 0.5, w: 11, h: 0.28, fontSize: 8.5, color: TEAL, bold: true, charSpacing: 2, fontFace: "Calibri",
  });
  // Main title
  slide.addText("Supply Chain\nS&OP Review", {
    x: 0.5, y: 1.1, w: 11, h: 2.1, fontSize: 52, bold: true, color: WHITE, fontFace: "Calibri", lineSpacingMultiple: 1.0,
  });
  // Teal rule
  slide.addShape("rect" as pptxgen.ShapeType, { x: 0.5, y: 3.4, w: 3.2, h: 0.07, fill: { color: TEAL } });
  // Subtitle
  slide.addText("Executive Performance Overview  ·  WMS  ·  TMS  ·  Planning", {
    x: 0.5, y: 3.6, w: 12, h: 0.38, fontSize: 14.5, color: "A8C0D6", fontFace: "Calibri",
  });
  const wh = d.warehouse === "All" ? "All Warehouses" : `Warehouse: ${d.warehouse}`;
  const dt = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  slide.addText(`${wh}   ·   ${d.dateRange}   ·   Prepared: ${dt}`, {
    x: 0.5, y: 4.1, w: 12, h: 0.3, fontSize: 10.5, color: "6B8CAE", fontFace: "Calibri",
  });

  // KPI snapshot strip
  slide.addShape("rect" as pptxgen.ShapeType, { x: 0, y: 5.55, w: 13.33, h: 1.95, fill: { color: "061428" } });
  slide.addShape("rect" as pptxgen.ShapeType, { x: 0, y: 5.55, w: 13.33, h: 0.04, fill: { color: TEAL } });
  slide.addText("KEY METRICS SNAPSHOT", {
    x: 0.5, y: 5.6, w: 12, h: 0.28, fontSize: 7.5, color: TEAL, bold: true, charSpacing: 2, fontFace: "Calibri",
  });
  const metrics = [
    { label: "Perfect Order Rate",   value: `${d.cross.perfectOrderRate}%`,       sub: "Cross-system" },
    { label: "SC Reliability",       value: `${d.cross.supplyChainReliability}%`, sub: "Composite" },
    { label: "On-Time Dispatch",     value: `${d.wms.onTimeDispatch}%`,            sub: "WMS" },
    { label: "On-Time Delivery",     value: `${d.tms.onTimeDelivery}%`,            sub: "TMS" },
    { label: "High Stockout Risk",   value: `${d.planning.stockoutRiskHigh} SKUs`, sub: "Planning" },
  ];
  metrics.forEach((m, i) => {
    const x = 0.55 + i * 2.56;
    slide.addShape("rect" as pptxgen.ShapeType, { x, y: 5.9, w: 2.38, h: 1.45, fill: { color: "0D2A4A" }, line: { color: NAVY2, width: 0.5 } });
    slide.addText(m.label.toUpperCase(), { x: x + 0.12, y: 5.97, w: 2.15, h: 0.22, fontSize: 7, color: TEAL, bold: true, fontFace: "Calibri" });
    slide.addText(m.value, { x: x + 0.12, y: 6.18, w: 2.15, h: 0.65, fontSize: 30, bold: true, color: WHITE, fontFace: "Calibri" });
    slide.addText(m.sub, { x: x + 0.12, y: 6.82, w: 2.15, h: 0.22, fontSize: 8, color: SLATE, fontFace: "Calibri" });
  });
}

// ── Slide 2: Executive Dashboard ──────────────────────────────────────────────
function addExecutiveSlide(pptx: pptxgen, d: PresentationData) {
  const slide = pptx.addSlide();
  addHeader(slide, "Executive Dashboard", "Cross-system composite KPIs  ·  WMS · TMS · Planning");

  const crossKpis = [
    { label: "Perfect Order Rate",       value: d.cross.perfectOrderRate,       target: 95,  unit: "%",    lower: false },
    { label: "Supply Chain Reliability", value: d.cross.supplyChainReliability, target: 90,  unit: "%",    lower: false },
    { label: "Carrier-to-Shelf",         value: d.cross.carrierToShelfDays,     target: 4,   unit: " days",lower: true  },
    { label: "SC Cycle Time",            value: d.cross.supplychainCycleTime,   target: 48,  unit: "h",    lower: true  },
    { label: "Inbound Fulfillment Gap",  value: d.cross.inboundFulfillmentGap,  target: 5,   unit: "%",    lower: true  },
  ].map((k) => ({ ...k, pct: achievePct(k.value, k.target, k.lower) }));

  const redCount = crossKpis.filter((k) => k.pct < 88).length;
  const headline = redCount === 0
    ? "All cross-system KPIs within target — supply chain performing at SLA thresholds across WMS, TMS, and Planning"
    : `${redCount} cross-system KPI${redCount > 1 ? "s" : ""} below target — executive attention required to prevent service impact`;
  addHeadline(slide, headline);

  // ── Top: 5 KPI scorecards ──
  crossKpis.forEach((k, i) => {
    const x = 0.3 + i * 2.61;
    const color = ragColor(k.pct);
    slide.addShape("rect" as pptxgen.ShapeType, { x, y: 1.72, w: 2.5, h: 1.62, fill: { color: SILVER }, line: { color: LGRAY, width: 0.5 } });
    slide.addShape("rect" as pptxgen.ShapeType, { x, y: 1.72, w: 2.5, h: 0.08, fill: { color } });
    slide.addText(k.label.toUpperCase(), { x: x + 0.12, y: 1.84, w: 2.28, h: 0.24, fontSize: 7.5, bold: true, color: SLATE, fontFace: "Calibri" });
    slide.addText(`${k.value}${k.unit}`, { x: x + 0.1, y: 2.08, w: 2.28, h: 0.72, fontSize: 28, bold: true, color: NAVY, fontFace: "Calibri" });
    slide.addText(`Target: ${k.target}${k.unit}`, { x: x + 0.1, y: 2.76, w: 1.4, h: 0.26, fontSize: 8.5, color: SLATE, fontFace: "Calibri" });
    slide.addShape("rect" as pptxgen.ShapeType, { x: x + 1.55, y: 2.79, w: 0.82, h: 0.22, fill: { color: `${color}22` }, line: { color, width: 0.7 }, rectRadius: 0.05 });
    slide.addText(ragLabel(k.pct), { x: x + 1.55, y: 2.8, w: 0.82, h: 0.22, fontSize: 6, bold: true, color, align: "center", fontFace: "Calibri" });
  });

  // ── Left panel: KPI Achievement bar chart ──
  addSectionLabel(slide, 0.3, 3.5, 6.2, "Achievement vs Target (%)");
  const barData = crossKpis.map((k) => ({
    name: k.label.replace("Supply Chain ", "SC ").replace("Inbound Fulfillment Gap", "Fulfillment Gap"),
    labels: [k.label],
    values: [k.pct],
  }));
  slide.addChart("bar" as pptxgen.CHART_NAME, barData, {
    x: 0.3, y: 3.78, w: 6.2, h: 3.15,
    barDir: "bar",
    chartColors: crossKpis.map((k) => ragColor(k.pct)),
    showValue: true,
    dataLabelFontSize: 9,
    dataLabelColor: WHITE,
    dataLabelFormatCode: '0"%"',
    catAxisLabelColor: DKGRAY,
    catAxisLabelFontSize: 9,
    valAxisMinVal: 0,
    valAxisMaxVal: 110,
    showLegend: false,
    showTitle: false,
  } as pptxgen.IChartOpts);

  // ── Right panel: Monthly reliability trend line chart ──
  addSectionLabel(slide, 6.8, 3.5, 6.2, "On-Time Performance Trend (%)  ·  Monthly");
  if (d.monthlyTrend.length > 0) {
    const months = d.monthlyTrend.map((t) => t.month);
    const trendData = [
      { name: "WMS",      labels: months, values: d.monthlyTrend.map((t) => t.wms)      },
      { name: "TMS",      labels: months, values: d.monthlyTrend.map((t) => t.tms)      },
      { name: "Planning", labels: months, values: d.monthlyTrend.map((t) => t.planning) },
    ];
    slide.addChart("line" as pptxgen.CHART_NAME, trendData, {
      x: 6.8, y: 3.78, w: 6.2, h: 3.15,
      chartColors: ["14B8A6", "3B82F6", "6366F1"],
      lineSize: 2,
      showLegend: true,
      legendPos: "b",
      legendFontSize: 9,
      catAxisLabelFontSize: 8,
      valAxisMinVal: 60,
      valAxisMaxVal: 100,
      valAxisLabelFormatCode: '0"%"',
      showValue: false,
      showTitle: false,
    } as pptxgen.IChartOpts);
  }

  addFooter(slide, 2);
}

// ── Slide 3: WMS ──────────────────────────────────────────────────────────────
function addWmsSlide(pptx: pptxgen, d: PresentationData) {
  const slide = pptx.addSlide();
  addHeader(slide, "Warehouse Operations (WMS)", "Inbound velocity · Outbound accuracy · Pendency · Dock-to-stock");

  const kpis = [
    { label: "On-Time Dispatch",   actual: d.wms.onTimeDispatch,    target: 92,  unit: "%", lower: false, fmtActual: `${d.wms.onTimeDispatch}%`,    fmtTarget: "92%" },
    { label: "Order Fill Rate",    actual: d.wms.orderFillRate,     target: 95,  unit: "%", lower: false, fmtActual: `${d.wms.orderFillRate}%`,     fmtTarget: "95%" },
    { label: "Dock-to-Stock",      actual: d.wms.dockToStock,       target: 3,   unit: "h", lower: true,  fmtActual: `${d.wms.dockToStock}h`,       fmtTarget: "3h"  },
    { label: "Receiving Accuracy", actual: d.wms.receivingAccuracy, target: 97,  unit: "%", lower: false, fmtActual: `${d.wms.receivingAccuracy}%`, fmtTarget: "97%" },
    { label: "Order Pendency",     actual: d.wms.orderPendencyPct,  target: 5,   unit: "%", lower: true,  fmtActual: `${d.wms.orderPendencyPct}%`,  fmtTarget: "5%"  },
  ].map((k) => ({ ...k, pct: achievePct(k.actual, k.target, k.lower) }));

  const breachKpis = kpis.filter((k) => k.pct < 88);
  const headline = breachKpis.length === 0
    ? "WMS warehouse operations meeting all targets — dispatch, fill rate, and accuracy within SLA thresholds"
    : `${breachKpis.map((k) => k.label).join(" · ")} ${breachKpis.length > 1 ? "are" : "is"} below target — ${breachKpis.length > 1 ? "coordinated" : "immediate"} intervention required`;
  addHeadline(slide, headline);

  // ── Left: KPI Table ──
  addSectionLabel(slide, 0.3, 1.72, 6.3, "KPI Performance vs Target");
  addKpiTable(slide, 0.3, 1.96, 6.3,
    kpis.map((k) => ({ label: k.label, actual: k.fmtActual, target: k.fmtTarget, pct: k.pct }))
  );

  // ── Key finding box below table ──
  const findings = kpis
    .filter((k) => k.pct < 97)
    .map((k) => k.pct < 88
      ? `⚠  ${k.label}: ${k.fmtActual} vs ${k.fmtTarget} target — ${k.pct}% achievement`
      : `△  ${k.label}: ${k.fmtActual} — approaching threshold`
    );
  if (findings.length === 0) findings.push("✓  All WMS metrics within SLA thresholds");

  slide.addShape("rect" as pptxgen.ShapeType, { x: 0.3, y: 5.05, w: 6.3, h: 1.9, fill: { color: SILVER }, line: { color: LGRAY, width: 0.5 } });
  addSectionLabel(slide, 0.4, 5.1, 6.0, "Key Findings");
  findings.slice(0, 3).forEach((f, i) => {
    slide.addText(f, { x: 0.4, y: 5.4 + i * 0.47, w: 6.05, h: 0.42, fontSize: 9.5, color: NAVY, fontFace: "Calibri" });
  });

  // ── Right: Achievement % Horizontal Bar Chart ──
  addSectionLabel(slide, 6.8, 1.72, 6.2, "% of Target Achieved  ·  100% = at target");
  const barData = kpis.map((k) => ({ name: k.label, labels: [k.label], values: [k.pct] }));
  slide.addChart("bar" as pptxgen.CHART_NAME, barData, {
    x: 6.8, y: 1.97, w: 6.2, h: 4.98,
    barDir: "bar",
    chartColors: kpis.map((k) => ragColor(k.pct)),
    showValue: true,
    dataLabelFontSize: 10,
    dataLabelColor: WHITE,
    dataLabelFormatCode: '0"%"',
    catAxisLabelColor: DKGRAY,
    catAxisLabelFontSize: 9.5,
    valAxisMinVal: 0,
    valAxisMaxVal: 110,
    showLegend: false,
    showTitle: false,
  } as pptxgen.IChartOpts);

  addFooter(slide, 3, "Source: WMS Data  ·  Planning Hub");
}

// ── Slide 4: TMS ──────────────────────────────────────────────────────────────
function addTmsSlide(pptx: pptxgen, d: PresentationData) {
  const slide = pptx.addSlide();
  addHeader(slide, "Transportation & Logistics (TMS)", "On-time delivery · Transit time · Cost · Carrier acceptance");

  const kpis = [
    { label: "On-Time Delivery",  actual: d.tms.onTimeDelivery,   target: 92,   unit: "%",  lower: false, fmtActual: `${d.tms.onTimeDelivery}%`,             fmtTarget: "92%"   },
    { label: "Delay Rate",        actual: d.tms.delayRate,        target: 5,    unit: "%",  lower: true,  fmtActual: `${d.tms.delayRate}%`,                  fmtTarget: "5%"    },
    { label: "Avg Transit Time",  actual: d.tms.avgTransitDays,   target: 2.5,  unit: "d",  lower: true,  fmtActual: `${d.tms.avgTransitDays}d`,             fmtTarget: "2.5d"  },
    { label: "Cost / Shipment",   actual: d.tms.costPerShipment,  target: 3000, unit: "₹",  lower: true,  fmtActual: `₹${d.tms.costPerShipment.toLocaleString()}`, fmtTarget: "₹3,000" },
    { label: "Tender Acceptance", actual: d.tms.tenderAcceptance, target: 90,   unit: "%",  lower: false, fmtActual: `${d.tms.tenderAcceptance}%`,           fmtTarget: "90%"   },
  ].map((k) => ({ ...k, pct: achievePct(k.actual, k.target, k.lower) }));

  const breachKpis = kpis.filter((k) => k.pct < 88);
  const headline = breachKpis.length === 0
    ? "TMS carrier performance within targets — delivery SLAs and cost metrics tracking to plan"
    : `${breachKpis.map((k) => k.label).join(" · ")} ${breachKpis.length > 1 ? "are" : "is"} below target — carrier escalation and route review required`;
  addHeadline(slide, headline);

  // ── Left: KPI Table ──
  addSectionLabel(slide, 0.3, 1.72, 6.3, "KPI Performance vs Target");
  addKpiTable(slide, 0.3, 1.96, 6.3,
    kpis.map((k) => ({ label: k.label, actual: k.fmtActual, target: k.fmtTarget, pct: k.pct }))
  );

  const findings = kpis.filter((k) => k.pct < 97).map((k) =>
    k.pct < 88
      ? `⚠  ${k.label}: ${k.fmtActual} vs ${k.fmtTarget} — ${k.pct}% achievement`
      : `△  ${k.label}: ${k.fmtActual} — monitor closely`
  );
  if (findings.length === 0) findings.push("✓  All TMS metrics within SLA thresholds");

  slide.addShape("rect" as pptxgen.ShapeType, { x: 0.3, y: 5.05, w: 6.3, h: 1.9, fill: { color: SILVER }, line: { color: LGRAY, width: 0.5 } });
  addSectionLabel(slide, 0.4, 5.1, 6.0, "Key Findings");
  findings.slice(0, 3).forEach((f, i) => {
    slide.addText(f, { x: 0.4, y: 5.4 + i * 0.47, w: 6.05, h: 0.42, fontSize: 9.5, color: NAVY, fontFace: "Calibri" });
  });

  // ── Right: Achievement % chart ──
  addSectionLabel(slide, 6.8, 1.72, 6.2, "% of Target Achieved  ·  100% = at target");
  const barData = kpis.map((k) => ({ name: k.label, labels: [k.label], values: [k.pct] }));
  slide.addChart("bar" as pptxgen.CHART_NAME, barData, {
    x: 6.8, y: 1.97, w: 6.2, h: 4.98,
    barDir: "bar",
    chartColors: kpis.map((k) => ragColor(k.pct)),
    showValue: true,
    dataLabelFontSize: 10,
    dataLabelColor: WHITE,
    dataLabelFormatCode: '0"%"',
    catAxisLabelColor: DKGRAY,
    catAxisLabelFontSize: 9.5,
    valAxisMinVal: 0,
    valAxisMaxVal: 110,
    showLegend: false,
    showTitle: false,
  } as pptxgen.IChartOpts);

  addFooter(slide, 4, "Source: TMS Data  ·  Planning Hub");
}

// ── Slide 5: Planning & Inventory ─────────────────────────────────────────────
function addPlanningSlide(pptx: pptxgen, d: PresentationData) {
  const slide = pptx.addSlide();
  addHeader(slide, "Demand Planning & Inventory", "Stockout risk · Days of cover · PO pipeline · Demand variance");

  const safeSkus  = Math.max(0, d.planning.totalSkus - d.planning.stockoutRiskHigh);
  const kpis = [
    { label: "Stockout Risk (High)", actual: d.planning.stockoutRiskHigh,  target: 0,  lower: true,  fmtActual: `${d.planning.stockoutRiskHigh} SKUs`,  fmtTarget: "0 SKUs", pct: d.planning.stockoutRiskHigh === 0 ? 100 : Math.max(10, Math.round((1 - d.planning.stockoutRiskHigh / d.planning.totalSkus) * 100)) },
    { label: "Days of Cover",        actual: d.planning.avgDaysOfCover,    target: 21, lower: false, fmtActual: `${d.planning.avgDaysOfCover}d`,         fmtTarget: "21d",    pct: achievePct(d.planning.avgDaysOfCover, 21) },
    { label: "Demand Variance",      actual: Math.abs(d.planning.demandVariancePct), target: 5, lower: true, fmtActual: `${d.planning.demandVariancePct}%`, fmtTarget: "±5%", pct: achievePct(Math.abs(d.planning.demandVariancePct), 5, true) },
    { label: "Inventory Value",      actual: d.planning.inventoryValueCr,  target: 5,  lower: false, fmtActual: `₹${d.planning.inventoryValueCr}Cr`,     fmtTarget: "5Cr+",   pct: achievePct(d.planning.inventoryValueCr, 5) },
    { label: "Active POs",           actual: d.planning.activePos,         target: 60, lower: false, fmtActual: `${d.planning.activePos}`,               fmtTarget: "60+",    pct: achievePct(d.planning.activePos, 60) },
  ];

  const breachKpis = kpis.filter((k) => k.pct < 88);
  const headline = d.planning.stockoutRiskHigh > 0
    ? `${d.planning.stockoutRiskHigh} SKU${d.planning.stockoutRiskHigh > 1 ? "s" : ""} at high stockout risk — emergency replenishment required before next planning cycle`
    : breachKpis.length === 0
      ? "Inventory and planning metrics within target — demand coverage and PO pipeline healthy"
      : `${breachKpis.map((k) => k.label).join(" · ")} requires attention — review replenishment plan`;
  addHeadline(slide, headline);

  // ── Left: KPI Table ──
  addSectionLabel(slide, 0.3, 1.72, 6.3, "KPI Performance vs Target");
  addKpiTable(slide, 0.3, 1.96, 6.3,
    kpis.map((k) => ({ label: k.label, actual: k.fmtActual, target: k.fmtTarget, pct: k.pct }))
  );

  // Inventory insight strip
  slide.addShape("rect" as pptxgen.ShapeType, { x: 0.3, y: 5.05, w: 6.3, h: 1.9, fill: { color: SILVER }, line: { color: LGRAY, width: 0.5 } });
  addSectionLabel(slide, 0.4, 5.1, 6.0, "Planning Risk Summary");
  const planInsights = [];
  if (d.planning.stockoutRiskHigh > 0)          planInsights.push(`⚠  ${d.planning.stockoutRiskHigh} high-risk SKUs — trigger emergency POs immediately`);
  if (d.planning.avgDaysOfCover < 14)            planInsights.push(`△  Days of Cover at ${d.planning.avgDaysOfCover}d — below 14-day buffer threshold`);
  if (Math.abs(d.planning.demandVariancePct) > 5) planInsights.push(`△  Demand variance ${d.planning.demandVariancePct}% — revise forecast for affected categories`);
  if (planInsights.length === 0)                 planInsights.push("✓  Inventory levels and PO pipeline healthy");
  planInsights.slice(0, 3).forEach((f, i) => {
    slide.addText(f, { x: 0.4, y: 5.4 + i * 0.47, w: 6.05, h: 0.42, fontSize: 9.5, color: NAVY, fontFace: "Calibri" });
  });

  // ── Right top: Stockout Risk Doughnut ──
  addSectionLabel(slide, 6.8, 1.72, 6.2, "SKU Risk Distribution");
  slide.addChart("doughnut" as pptxgen.CHART_NAME, [
    { name: "Risk", labels: ["High Risk", "Safe / Low"], values: [d.planning.stockoutRiskHigh, safeSkus] },
  ], {
    x: 6.8, y: 1.97, w: 3.1, h: 3.0,
    chartColors: [RED, GREEN],
    showLabel: true,
    showValue: false,
    showPercent: true,
    dataLabelColor: WHITE,
    dataLabelFontSize: 11,
    legendPos: "b",
    showLegend: true,
    legendFontSize: 9,
    showTitle: false,
    holeSize: 55,
  } as pptxgen.IChartOpts);

  // ── Right bottom: Days of cover vs target bar ──
  addSectionLabel(slide, 10.15, 1.72, 2.85, "Cover vs Target");
  slide.addChart("bar" as pptxgen.CHART_NAME, [
    { name: "Days of Cover", labels: ["Avg. Days of Cover"], values: [d.planning.avgDaysOfCover] },
    { name: "Target (21d)",  labels: ["Avg. Days of Cover"], values: [21] },
  ], {
    x: 10.15, y: 1.97, w: 2.82, h: 3.0,
    barDir: "col",
    barGrouping: "clustered",
    chartColors: [d.planning.avgDaysOfCover >= 21 ? GREEN : d.planning.avgDaysOfCover >= 14 ? AMBER : RED, LGRAY],
    showValue: true,
    dataLabelFontSize: 10,
    dataLabelColor: WHITE,
    catAxisLabelFontSize: 8,
    valAxisMinVal: 0,
    valAxisMaxVal: 30,
    showLegend: true,
    legendPos: "b",
    legendFontSize: 8,
    showTitle: false,
  } as pptxgen.IChartOpts);

  // ── Right: Achievement bar chart for planning KPIs ──
  addSectionLabel(slide, 6.8, 5.1, 6.2, "% of Target Achieved");
  const barData = kpis.map((k) => ({ name: k.label.replace("Stockout Risk (High)", "Stockout Risk").replace("Inventory Value", "Inv. Value"), labels: [k.label], values: [k.pct] }));
  slide.addChart("bar" as pptxgen.CHART_NAME, barData, {
    x: 6.8, y: 5.33, w: 6.2, h: 1.65,
    barDir: "bar",
    chartColors: kpis.map((k) => ragColor(k.pct)),
    showValue: true,
    dataLabelFontSize: 8.5,
    dataLabelColor: WHITE,
    dataLabelFormatCode: '0"%"',
    catAxisLabelColor: DKGRAY,
    catAxisLabelFontSize: 8,
    valAxisMinVal: 0,
    valAxisMaxVal: 110,
    showLegend: false,
    showTitle: false,
  } as pptxgen.IChartOpts);

  addFooter(slide, 5, "Source: Planning Data  ·  Planning Hub");
}

// ── Slide 6: Warehouse Breakdown ──────────────────────────────────────────────
function addWarehouseSlide(pptx: pptxgen, d: PresentationData) {
  const slide = pptx.addSlide();
  addHeader(slide, "Warehouse-Level Performance Breakdown", "DEL · MUM · BLR  ·  Key operational metrics by location");

  const whNames   = d.warehouseBreakdown.map((w) => w.wh);
  const dispatch  = d.warehouseBreakdown.map((w) => w.onTimeDispatch);
  const fillRate  = d.warehouseBreakdown.map((w) => w.orderFillRate);
  const delivery  = d.warehouseBreakdown.map((w) => w.onTimeDelivery);
  const delayRate = d.warehouseBreakdown.map((w) => w.delayRate);

  const bestDispatch = [...d.warehouseBreakdown].sort((a, b) => b.onTimeDispatch - a.onTimeDispatch)[0];
  const worstDelay   = [...d.warehouseBreakdown].sort((a, b) => b.delayRate - a.delayRate)[0];
  const headline = `${bestDispatch.wh} leads on dispatch performance at ${bestDispatch.onTimeDispatch}%` +
    (worstDelay.delayRate > 5 ? ` · ${worstDelay.wh} delay rate at ${worstDelay.delayRate}% requires review` : " · delay rates within acceptable range across all locations");
  addHeadline(slide, headline);

  // ── Top: Grouped bar chart — 4 metrics across 3 warehouses ──
  addSectionLabel(slide, 0.3, 1.72, 12.7, "Key Metrics by Warehouse Location  ·  Grouped comparison");
  slide.addChart("bar" as pptxgen.CHART_NAME, [
    { name: "On-Time Dispatch (%)",  labels: whNames, values: dispatch  },
    { name: "Order Fill Rate (%)",   labels: whNames, values: fillRate  },
    { name: "On-Time Delivery (%)",  labels: whNames, values: delivery  },
  ], {
    x: 0.3, y: 1.97, w: 12.7, h: 3.5,
    barDir: "col",
    barGrouping: "clustered",
    chartColors: [NAVY, TEAL, "6366F1"],
    showValue: true,
    dataLabelFontSize: 9,
    dataLabelColor: WHITE,
    catAxisLabelFontSize: 11,
    catAxisLabelColor: NAVY,
    valAxisMinVal: 0,
    valAxisMaxVal: 100,
    valAxisLabelFormatCode: '0"%"',
    showLegend: true,
    legendPos: "b",
    legendFontSize: 9.5,
    showTitle: false,
  } as pptxgen.IChartOpts);

  // ── Bottom: Delay Rate comparison ──
  addSectionLabel(slide, 0.3, 5.6, 12.7, "Carrier Delay Rate by Location (%)  ·  Target: <5%");
  slide.addChart("bar" as pptxgen.CHART_NAME, [
    { name: "Delay Rate", labels: whNames, values: delayRate },
    { name: "Target",     labels: whNames, values: [5, 5, 5] },
  ], {
    x: 0.3, y: 5.82, w: 12.7, h: 1.2,
    barDir: "bar",
    barGrouping: "clustered",
    chartColors: [RED, LGRAY],
    showValue: true,
    dataLabelFontSize: 8.5,
    dataLabelColor: WHITE,
    catAxisLabelFontSize: 9,
    valAxisMinVal: 0,
    valAxisMaxVal: 15,
    showLegend: true,
    legendPos: "r",
    legendFontSize: 8,
    showTitle: false,
  } as pptxgen.IChartOpts);

  addFooter(slide, 6, "Source: WMS + TMS Data  ·  Planning Hub");
}

// ── Slide 7: Alerts ───────────────────────────────────────────────────────────
function addAlertsSlide(pptx: pptxgen, d: PresentationData) {
  const slide = pptx.addSlide();
  addHeader(slide, "Risk Signals & Active Alerts", "Cross-system alert summary  ·  Severity-ranked issues requiring action");

  if (d.alerts.length === 0) {
    addHeadline(slide, "No active alerts — all KPI thresholds within acceptable bounds across WMS, TMS, and Planning");
    slide.addShape("rect" as pptxgen.ShapeType, { x: 1.5, y: 2.2, w: 10.3, h: 3.5, fill: { color: TEAL_BG }, line: { color: TEAL, width: 1.5 } });
    slide.addText("✓  All Systems Nominal", { x: 2, y: 3.0, w: 9, h: 0.7, fontSize: 28, bold: true, color: GREEN, fontFace: "Calibri", align: "center" });
    slide.addText("No active alerts across WMS, TMS, or Planning. Supply chain operating within defined SLA thresholds.", {
      x: 2, y: 3.8, w: 9, h: 0.5, fontSize: 12, color: SLATE, fontFace: "Calibri", align: "center",
    });
    addFooter(slide, 7);
    return;
  }

  const crit = d.alerts.filter((a) => a.severity === "critical");
  const high = d.alerts.filter((a) => a.severity === "high");
  const med  = d.alerts.filter((a) => a.severity === "medium");
  const headline = `${d.alerts.length} active alert${d.alerts.length > 1 ? "s" : ""} · ` +
    [crit.length && `${crit.length} Critical`, high.length && `${high.length} High`, med.length && `${med.length} Medium`]
      .filter(Boolean).join(" · ") +
    " — escalation required for critical items";
  addHeadline(slide, headline);

  // ── Left: Alert list ──
  addSectionLabel(slide, 0.3, 1.72, 8.0, "Active Alerts by Severity");
  const sevStyle: Record<string, { color: string; bg: string; label: string }> = {
    critical: { color: RED,   bg: "FEF2F2", label: "CRITICAL" },
    high:     { color: AMBER, bg: "FFFBEB", label: "HIGH"     },
    medium:   { color: "EAB308", bg: "FEFCE8", label: "MEDIUM" },
  };
  let ay = 1.97;
  [...crit, ...high, ...med].slice(0, 8).forEach((a) => {
    const s = sevStyle[a.severity];
    slide.addShape("rect" as pptxgen.ShapeType, { x: 0.3, y: ay, w: 8.0, h: 0.58, fill: { color: s.bg }, line: { color: s.color, width: 0.7 } });
    slide.addShape("rect" as pptxgen.ShapeType, { x: 0.3, y: ay, w: 0.08, h: 0.58, fill: { color: s.color } });
    slide.addShape("rect" as pptxgen.ShapeType, { x: 0.42, y: ay + 0.14, w: 0.85, h: 0.28, fill: { color: `${s.color}22` }, line: { color: s.color, width: 0.5 }, rectRadius: 0.05 });
    slide.addText(s.label, { x: 0.42, y: ay + 0.15, w: 0.85, h: 0.26, fontSize: 6.5, bold: true, color: s.color, fontFace: "Calibri", align: "center" });
    slide.addText(a.message, { x: 1.35, y: ay + 0.12, w: 6.8, h: 0.34, fontSize: 9.5, color: NAVY, fontFace: "Calibri" });
    ay += 0.66;
  });

  // ── Right: Alert summary chart ──
  addSectionLabel(slide, 8.65, 1.72, 4.35, "Alert Distribution by Severity");
  if (d.alerts.length > 0) {
    slide.addChart("doughnut" as pptxgen.CHART_NAME, [
      { name: "Alerts", labels: ["Critical", "High", "Medium"], values: [crit.length || 0.001, high.length || 0.001, med.length || 0.001] },
    ], {
      x: 8.65, y: 1.97, w: 4.35, h: 3.2,
      chartColors: [RED, AMBER, "EAB308"],
      showLabel: true,
      showValue: true,
      showPercent: false,
      dataLabelColor: WHITE,
      dataLabelFontSize: 12,
      legendPos: "b",
      showLegend: true,
      legendFontSize: 9,
      holeSize: 50,
    } as pptxgen.IChartOpts);
  }

  // ── Right bottom: action box ──
  slide.addShape("rect" as pptxgen.ShapeType, { x: 8.65, y: 5.3, w: 4.35, h: 1.65, fill: { color: SILVER }, line: { color: LGRAY, width: 0.5 } });
  addSectionLabel(slide, 8.75, 5.35, 4.1, "Recommended Response");
  const responses = crit.length
    ? ["Escalate critical alerts to VP Supply Chain immediately", "Convene emergency S&OP sub-team within 24h"]
    : high.length
      ? ["Schedule expedited review with operations leads", "Update action tracker and assign DRI within 48h"]
      : ["Monitor at next weekly S&OP cadence", "No immediate escalation required"];
  responses.forEach((r, i) => {
    slide.addText(`→  ${r}`, { x: 8.75, y: 5.63 + i * 0.44, w: 4.1, h: 0.4, fontSize: 9, color: NAVY, fontFace: "Calibri" });
  });

  addFooter(slide, 7);
}

// ── Slide 8: Recommended Actions ──────────────────────────────────────────────
function addActionsSlide(pptx: pptxgen, d: PresentationData) {
  const slide = pptx.addSlide();
  addHeader(slide, "Recommended Actions & Next Steps", "Priority action plan for current S&OP cycle  ·  Owner accountability matrix");

  const allBreaches = [
    d.wms.onTimeDispatch < 92,
    d.wms.orderFillRate < 95,
    d.wms.dockToStock > 3,
    d.planning.stockoutRiskHigh > 0,
    d.tms.onTimeDelivery < 92,
    d.tms.delayRate > 5,
    d.planning.avgDaysOfCover < 14,
    Math.abs(d.planning.demandVariancePct) > 5,
  ].filter(Boolean).length;

  const headline = allBreaches === 0
    ? "No critical actions required — maintain operational cadence and focus on continuous improvement initiatives"
    : `${allBreaches} action item${allBreaches > 1 ? "s" : ""} identified — assign DRI and timeline before close of S&OP meeting`;
  addHeadline(slide, headline);

  type Action = { priority: string; system: string; owner: string; action: string; timeline: string; pColor: string };
  const actions: Action[] = [];

  if (d.wms.onTimeDispatch < 92)
    actions.push({ priority: "CRITICAL", system: "WMS", owner: "WH Ops Lead",  action: `On-Time Dispatch at ${d.wms.onTimeDispatch}% — audit outbound dock scheduling, shift allocation, and carrier cut-off adherence`, timeline: "48h", pColor: RED });
  if (d.planning.stockoutRiskHigh > 0)
    actions.push({ priority: "CRITICAL", system: "Planning", owner: "Planning Lead", action: `${d.planning.stockoutRiskHigh} high-risk SKU(s) — trigger emergency replenishment POs, validate supplier availability`, timeline: "24h", pColor: RED });
  if (d.tms.onTimeDelivery < 92)
    actions.push({ priority: "HIGH", system: "TMS", owner: "Logistics Lead", action: `On-Time Delivery at ${d.tms.onTimeDelivery}% — issue SLA warning to underperforming carriers, review lane-level delay data`, timeline: "1 week", pColor: AMBER });
  if (d.wms.orderFillRate < 95)
    actions.push({ priority: "HIGH", system: "WMS", owner: "WH Ops Lead",  action: `Fill Rate at ${d.wms.orderFillRate}% — identify SKU gaps, improve putaway accuracy and pick-path optimisation`, timeline: "1 week", pColor: AMBER });
  if (d.tms.delayRate > 5)
    actions.push({ priority: "HIGH", system: "TMS", owner: "Logistics Lead", action: `Delay Rate at ${d.tms.delayRate}% — identify top delay lanes, add buffer in transit planning, expand carrier network`, timeline: "2 weeks", pColor: AMBER });
  if (d.planning.avgDaysOfCover < 14)
    actions.push({ priority: "MEDIUM", system: "Planning", owner: "Planning Lead", action: `Days of Cover at ${d.planning.avgDaysOfCover}d — accelerate inbound receipts, review safety stock parameters`, timeline: "2 weeks", pColor: "2563EB" });
  if (Math.abs(d.planning.demandVariancePct) > 5)
    actions.push({ priority: "MEDIUM", system: "Planning", owner: "Demand Planner", action: `Demand Variance at ${d.planning.demandVariancePct}% — recalibrate forecast model, align with sales team on upcoming promotions`, timeline: "Next cycle", pColor: "2563EB" });

  // Always add standing item
  actions.push({ priority: "STANDING", system: "All", owner: "S&OP Team", action: "Update 8-week demand forecast, confirm supplier lead times for next replenishment cycle, align on inventory build for peak period", timeline: "By EOW", pColor: SLATE });

  // Table header
  const cols = { p: 0.3, sys: 1.55, own: 3.0, act: 4.65, time: 12.25 };
  const hdr_y = 1.72;
  slide.addShape("rect" as pptxgen.ShapeType, { x: 0.3, y: hdr_y, w: 12.73, h: 0.34, fill: { color: NAVY } });
  [
    ["Priority",  cols.p    + 0.08],
    ["System",    cols.sys  + 0.08],
    ["Owner",     cols.own  + 0.08],
    ["Action",    cols.act  + 0.08],
    ["Timeline",  cols.time + 0.08],
  ].forEach(([label, x]) => {
    slide.addText(label as string, { x: x as number, y: hdr_y + 0.06, w: 1.5, h: 0.22, fontSize: 8, bold: true, color: WHITE, fontFace: "Calibri" });
  });

  actions.slice(0, 7).forEach((a, i) => {
    const row_y = hdr_y + 0.34 + i * 0.67;
    const bg = i % 2 === 0 ? WHITE : SILVER;
    slide.addShape("rect" as pptxgen.ShapeType, { x: 0.3, y: row_y, w: 12.73, h: 0.64, fill: { color: bg }, line: { color: LGRAY, width: 0.4 } });
    // Priority pill
    slide.addShape("rect" as pptxgen.ShapeType, { x: cols.p + 0.05, y: row_y + 0.16, w: 1.2, h: 0.32, fill: { color: `${a.pColor}18` }, line: { color: a.pColor, width: 0.8 }, rectRadius: 0.06 });
    slide.addText(a.priority, { x: cols.p + 0.05, y: row_y + 0.17, w: 1.2, h: 0.3, fontSize: 7, bold: true, color: a.pColor, fontFace: "Calibri", align: "center" });
    slide.addText(a.system, { x: cols.sys + 0.08, y: row_y + 0.17, w: 1.3, h: 0.3, fontSize: 9, color: NAVY, fontFace: "Calibri" });
    slide.addText(a.owner,  { x: cols.own + 0.08, y: row_y + 0.17, w: 1.5, h: 0.3, fontSize: 9, color: DKGRAY, fontFace: "Calibri" });
    slide.addText(a.action, { x: cols.act + 0.08, y: row_y + 0.08, w: 7.45, h: 0.48, fontSize: 8.5, color: NAVY, fontFace: "Calibri" });
    slide.addText(a.timeline, { x: cols.time + 0.05, y: row_y + 0.17, w: 0.9, h: 0.3, fontSize: 8.5, bold: true, color: DKGRAY, fontFace: "Calibri", align: "center" });
  });

  addFooter(slide, 8, "Source: WMS · TMS · Planning Hub  ·  S&OP Review");
}

// ── Main ──────────────────────────────────────────────────────────────────────
export async function generatePresentation(data: PresentationData): Promise<void> {
  const pptx = new pptxgen();
  pptx.layout  = "LAYOUT_WIDE";
  pptx.author  = "Supply Chain Planning Hub";
  pptx.company = "S&OP Review";
  pptx.title   = "Supply Chain S&OP Executive Review";

  addCoverSlide(pptx, data);
  addExecutiveSlide(pptx, data);
  addWmsSlide(pptx, data);
  addTmsSlide(pptx, data);
  addPlanningSlide(pptx, data);
  addWarehouseSlide(pptx, data);
  addAlertsSlide(pptx, data);
  addActionsSlide(pptx, data);

  const dt = new Date().toISOString().slice(0, 10);
  await pptx.writeFile({ fileName: `SNOP-Review-${dt}.pptx` });
}
