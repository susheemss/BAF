/**
 * Alert Configuration — Enterprise KPI Alert System
 * Edit thresholds and recipients here.
 * In production, store in DB / Supabase.
 */

export type Severity = "warning" | "critical";
export type Condition = "below" | "above";

export type AlertRule = {
  kpiKey:        string;
  kpiLabel:      string;
  source:        "WMS" | "TMS" | "Planning";
  condition:     Condition;
  threshold:     number;
  unit:          string;
  severity:      Severity;
  cooldownHours: number;   // don't re-fire within this window
  description:   string;   // shown in email subject line
};

// ─── Recipients ───────────────────────────────────────────────────────────────
// Add / remove email addresses here. Will also be read from .env if set.
export const ALERT_RECIPIENTS: Record<"warning" | "critical", string[]> = {
  warning:  [
    process.env.ALERT_RECIPIENT_1 ?? "logistics.manager@company.com",
    process.env.ALERT_RECIPIENT_2 ?? "warehouse.ops@company.com",
  ],
  critical: [
    process.env.ALERT_RECIPIENT_1 ?? "logistics.manager@company.com",
    process.env.ALERT_RECIPIENT_2 ?? "warehouse.ops@company.com",
    process.env.ALERT_RECIPIENT_3 ?? "supply.director@company.com",
  ],
};

// ─── Alert Rules ──────────────────────────────────────────────────────────────
export const ALERT_RULES: AlertRule[] = [

  // ── WMS ────────────────────────────────────────────────────────────────────
  {
    kpiKey:        "on-time-dispatch",
    kpiLabel:      "On-Time Dispatch",
    source:        "WMS",
    condition:     "below",
    threshold:     82,
    unit:          "%",
    severity:      "critical",
    cooldownHours: 24,
    description:   "On-Time Dispatch fell below 82% — outbound SLA at risk",
  },
  {
    kpiKey:        "on-time-dispatch-warn",
    kpiLabel:      "On-Time Dispatch",
    source:        "WMS",
    condition:     "below",
    threshold:     90,
    unit:          "%",
    severity:      "warning",
    cooldownHours: 12,
    description:   "On-Time Dispatch below 90% — approaching breach threshold",
  },
  {
    kpiKey:        "order-fill-rate",
    kpiLabel:      "Order Fill Rate",
    source:        "WMS",
    condition:     "below",
    threshold:     88,
    unit:          "%",
    severity:      "critical",
    cooldownHours: 24,
    description:   "Order Fill Rate below 88% — customer service impact likely",
  },
  {
    kpiKey:        "dock-to-stock",
    kpiLabel:      "Dock-to-Stock Time",
    source:        "WMS",
    condition:     "above",
    threshold:     5,
    unit:          "h",
    severity:      "warning",
    cooldownHours: 12,
    description:   "Dock-to-Stock exceeds 5 hours — inbound throughput degraded",
  },
  {
    kpiKey:        "receiving-accuracy",
    kpiLabel:      "Receiving Accuracy",
    source:        "WMS",
    condition:     "below",
    threshold:     95,
    unit:          "%",
    severity:      "critical",
    cooldownHours: 24,
    description:   "Receiving Accuracy below 95% — inventory integrity risk",
  },
  {
    kpiKey:        "order-pendency",
    kpiLabel:      "Order Pendency",
    source:        "WMS",
    condition:     "above",
    threshold:     12,
    unit:          "%",
    severity:      "warning",
    cooldownHours: 12,
    description:   "Order Pendency above 12% — unfulfilled order backlog growing",
  },

  // ── TMS ────────────────────────────────────────────────────────────────────
  {
    kpiKey:        "on-time-delivery",
    kpiLabel:      "On-Time Delivery Rate",
    source:        "TMS",
    condition:     "below",
    threshold:     90,
    unit:          "%",
    severity:      "critical",
    cooldownHours: 24,
    description:   "On-Time Delivery fell below 90% — carrier SLA breach detected",
  },
  {
    kpiKey:        "delay-rate",
    kpiLabel:      "Shipment Delay Rate",
    source:        "TMS",
    condition:     "above",
    threshold:     10,
    unit:          "%",
    severity:      "critical",
    cooldownHours: 24,
    description:   "Shipment Delay Rate above 10% — escalation required",
  },
  {
    kpiKey:        "tender-acceptance",
    kpiLabel:      "Tender Acceptance Rate",
    source:        "TMS",
    condition:     "below",
    threshold:     80,
    unit:          "%",
    severity:      "warning",
    cooldownHours: 12,
    description:   "Tender Acceptance below 80% — carrier capacity risk",
  },
  {
    kpiKey:        "avg-transit-days",
    kpiLabel:      "Average Transit Time",
    source:        "TMS",
    condition:     "above",
    threshold:     4,
    unit:          "d",
    severity:      "warning",
    cooldownHours: 12,
    description:   "Avg Transit Time exceeds 4 days — delivery cycle deteriorating",
  },

  // ── Planning ───────────────────────────────────────────────────────────────
  {
    kpiKey:        "stockout-risk",
    kpiLabel:      "High Stockout Risk SKUs",
    source:        "Planning",
    condition:     "above",
    threshold:     10,
    unit:          " SKUs",
    severity:      "critical",
    cooldownHours: 24,
    description:   "10+ SKUs at high stockout risk — replenishment action needed",
  },
  {
    kpiKey:        "demand-variance",
    kpiLabel:      "Demand Variance",
    source:        "Planning",
    condition:     "above",
    threshold:     15,
    unit:          "%",
    severity:      "warning",
    cooldownHours: 12,
    description:   "Demand Variance above 15% — forecast accuracy degraded",
  },
];

// ─── KPI Value Map type ────────────────────────────────────────────────────────
export type KpiSnapshot = {
  "on-time-dispatch":     number;
  "on-time-dispatch-warn":number;
  "order-fill-rate":      number;
  "dock-to-stock":        number;
  "receiving-accuracy":   number;
  "order-pendency":       number;
  "on-time-delivery":     number;
  "delay-rate":           number;
  "tender-acceptance":    number;
  "avg-transit-days":     number;
  "stockout-risk":        number;
  "demand-variance":      number;
};

export function evaluateRule(rule: AlertRule, value: number): boolean {
  return rule.condition === "below" ? value < rule.threshold : value > rule.threshold;
}
