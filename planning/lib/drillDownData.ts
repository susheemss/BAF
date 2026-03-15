/**
 * Drill-down breakdowns for each KPI.
 * Each factor explains *why* the KPI is below target.
 * In production these would come from live APIs.
 */

export type DrillFactor = {
  dimension: string;   // e.g. "Carrier", "Route", "SKU", "Supplier"
  name: string;        // e.g. "Blue Dart", "DEL → MUM"
  value: number;       // the factor's own KPI value
  unit: string;
  impact: number;      // negative = dragging overall KPI down (percentage points)
  trend: "improving" | "stable" | "worsening";
  detail: string;      // one-line explanation
};

export type DrillDown = {
  kpiKey: string;
  kpiLabel: string;
  value: number;
  unit: string;
  target: number;
  source: string;
  insight: string;            // one-line diagnosis
  recommendation: string;     // one-line action
  factors: DrillFactor[];
};

const DRILL_DOWN_MAP: Record<string, DrillDown> = {

  // ─── TMS ──────────────────────────────────────────────────────────────────

  "on-time-delivery": {
    kpiKey: "on-time-delivery",
    kpiLabel: "On-Time Delivery Rate",
    value: 89.2,
    unit: "%",
    target: 92,
    source: "TMS",
    insight: "2.8 pp below target — carrier SLA breaches and one high-delay route are the primary drivers.",
    recommendation: "Escalate Blue Dart SLA; reroute DEL→MUM heavy loads via Gati.",
    factors: [
      { dimension: "Carrier",    name: "Blue Dart",           value: 67.3, unit: "%", impact: -2.1, trend: "worsening",  detail: "Consistently missing 3-day SLA on inter-zonal shipments" },
      { dimension: "Route",      name: "DEL → MUM",           value: 71.2, unit: "%", impact: -1.8, trend: "stable",     detail: "Highway congestion near Vadodara adding avg 1.4 days" },
      { dimension: "Category",   name: "Food & Beverages",    value: 74.5, unit: "%", impact: -1.4, trend: "improving",  detail: "Temperature-sensitive handling causing dock hold-ups" },
      { dimension: "Weight Band",name: "> 500 kg loads",      value: 76.1, unit: "%", impact: -0.9, trend: "stable",     detail: "Overweight loads deprioritised during peak traffic slots" },
      { dimension: "Warehouse",  name: "MUM Hub",             value: 81.4, unit: "%", impact: -0.6, trend: "worsening",  detail: "Outbound dock congestion delaying first-mile pickup" },
    ],
  },

  "delay-rate": {
    kpiKey: "delay-rate",
    kpiLabel: "Delay Rate",
    value: 10.8,
    unit: "%",
    target: 5,
    source: "TMS",
    insight: "Delay rate is 5.8 pp above target — concentrated in two carriers and one product type.",
    recommendation: "Cap Blue Dart allocation to <20% of volumes until SLA improves.",
    factors: [
      { dimension: "Carrier",   name: "Blue Dart",        value: 32.7, unit: "%", impact: +3.2, trend: "worsening",  detail: "Highest delay contributor — 32.7% shipments delayed" },
      { dimension: "Carrier",   name: "DTDC",             value: 18.4, unit: "%", impact: +1.6, trend: "stable",     detail: "Last-mile failures in Tier-2 cities" },
      { dimension: "Category",  name: "Household",        value: 15.1, unit: "%", impact: +0.9, trend: "improving",  detail: "Bulky items causing vehicle utilisation issues" },
      { dimension: "Route",     name: "BLR → HYD",        value: 22.3, unit: "%", impact: +0.8, trend: "worsening",  detail: "Road construction near Hosur adding transit time" },
      { dimension: "Month",     name: "December 2024",    value: 18.6, unit: "%", impact: +2.1, trend: "improving",  detail: "Festive season surge caused transient spike" },
    ],
  },

  // ─── WMS ──────────────────────────────────────────────────────────────────

  "order-fill-rate": {
    kpiKey: "order-fill-rate",
    kpiLabel: "Order Fill Rate",
    value: 91.4,
    unit: "%",
    target: 95,
    source: "WMS",
    insight: "3.6 pp gap to target — three SKUs account for 68% of all short-picks.",
    recommendation: "Trigger emergency replenishment for SKU-0047 and SKU-0112; review safety stock formula.",
    factors: [
      { dimension: "SKU",       name: "SKU-0047 (Shampoo 200ml)",     value: 63.2, unit: "%", impact: -1.8, trend: "worsening",  detail: "Stock-out 4 times this month; safety stock set too low" },
      { dimension: "SKU",       name: "SKU-0112 (Body Lotion 100ml)", value: 68.7, unit: "%", impact: -1.2, trend: "stable",     detail: "Supplier lead time increased from 7 to 14 days" },
      { dimension: "Warehouse", name: "DEL",                          value: 87.1, unit: "%", impact: -0.9, trend: "worsening",  detail: "Inbound backlog reducing pick-ready inventory" },
      { dimension: "Category",  name: "Personal Care",                value: 88.4, unit: "%", impact: -0.8, trend: "stable",     detail: "Highest-volume category with most stock-out exposure" },
      { dimension: "Shift",     name: "Night Shift",                  value: 85.3, unit: "%", impact: -0.4, trend: "improving",  detail: "Pick accuracy lower; team upskilling underway" },
    ],
  },

  "dock-to-stock": {
    kpiKey: "dock-to-stock",
    kpiLabel: "Dock-to-Stock Time",
    value: 4.2,
    unit: "h",
    target: 3,
    source: "WMS",
    insight: "1.2h above target — unloading delays and GRN bottlenecks at DEL are the core issues.",
    recommendation: "Add one QC inspector to DEL inbound bay; digitise GRN with handheld scanners.",
    factors: [
      { dimension: "Warehouse", name: "DEL",                       value: 5.8, unit: "h", impact: +1.2, trend: "worsening",  detail: "Inbound dock has 2 of 5 bays under maintenance" },
      { dimension: "Supplier",  name: "ITC Limited",               value: 6.1, unit: "h", impact: +0.9, trend: "stable",     detail: "Multi-pallet mixed-SKU loads slow GRN process" },
      { dimension: "Supplier",  name: "Nestle India",              value: 5.4, unit: "h", impact: +0.7, trend: "improving",  detail: "Temperature check adds 45min for cold-chain items" },
      { dimension: "Shift",     name: "Morning Shift (06–14h)",    value: 5.1, unit: "h", impact: +0.6, trend: "stable",     detail: "Peak inbound slot — queueing at weigh bridge" },
      { dimension: "Category",  name: "Food & Beverages",          value: 5.6, unit: "h", impact: +0.5, trend: "worsening",  detail: "FIFO + expiry checks extend put-away time" },
    ],
  },

  "receiving-accuracy": {
    kpiKey: "receiving-accuracy",
    kpiLabel: "Receiving Accuracy",
    value: 94.7,
    unit: "%",
    target: 97,
    source: "WMS",
    insight: "2.3 pp below target — two suppliers with poor packing quality drive most mismatches.",
    recommendation: "Enforce ASN compliance for Dabur India; request pre-labelled pallets from Emami.",
    factors: [
      { dimension: "Supplier",  name: "Dabur India",              value: 82.1, unit: "%", impact: -1.4, trend: "worsening",  detail: "Barcode label quality failing scanner — manual entry errors" },
      { dimension: "Supplier",  name: "Emami Limited",            value: 85.6, unit: "%", impact: -0.9, trend: "stable",     detail: "Mixed-SKU pallets without ASN causing count mismatches" },
      { dimension: "Warehouse", name: "BLR",                      value: 91.3, unit: "%", impact: -0.6, trend: "improving",  detail: "New WMS screens reduced but not eliminated keying errors" },
      { dimension: "Category",  name: "Household",                value: 88.4, unit: "%", impact: -0.5, trend: "stable",     detail: "High SKU variety in single shipment causes count drift" },
      { dimension: "Shift",     name: "Evening Shift (14–22h)",   value: 90.2, unit: "%", impact: -0.3, trend: "improving",  detail: "Shift overlap gap — handover checklist not followed" },
    ],
  },

  "on-time-dispatch": {
    kpiKey: "on-time-dispatch",
    kpiLabel: "On-Time Dispatch",
    value: 86.5,
    unit: "%",
    target: 92,
    source: "WMS",
    insight: "5.5 pp gap — picking delays and late carrier arrivals are the top two causes.",
    recommendation: "Implement wave picking for priority orders; enforce carrier gate-in SLA.",
    factors: [
      { dimension: "Warehouse", name: "MUM",                      value: 79.2, unit: "%", impact: -2.1, trend: "worsening",  detail: "Outbound dock congestion; 3 dispatch lanes operational of 6" },
      { dimension: "Carrier",   name: "Gati Ltd",                 value: 74.3, unit: "%", impact: -1.6, trend: "stable",     detail: "Carrier arriving 2–3h late for scheduled pickup slots" },
      { dimension: "Category",  name: "Food & Beverages",         value: 81.1, unit: "%", impact: -0.9, trend: "improving",  detail: "Late palletisation due to FEFO sort requirement" },
      { dimension: "Shift",     name: "Night Shift (22–06h)",     value: 76.8, unit: "%", impact: -0.7, trend: "worsening",  detail: "Reduced staff causing loading delays on bulk orders" },
      { dimension: "SKU",       name: "High-volume FMCG (>1000u)",value: 82.4, unit: "%", impact: -0.4, trend: "stable",     detail: "Large pick lists exceed shift capacity regularly" },
    ],
  },

  // ─── Planning ─────────────────────────────────────────────────────────────

  "demand-variance": {
    kpiKey: "demand-variance",
    kpiLabel: "Demand Variance",
    value: 12.4,
    unit: "%",
    target: 5,
    source: "Planning",
    insight: "Variance is 7.4 pp above target — festive spikes and two under-planned SKUs dominate.",
    recommendation: "Incorporate Diwali/Republic Day seasonality into the forecast model for FY26.",
    factors: [
      { dimension: "Month",     name: "October 2024 (Diwali)",    value: 28.3, unit: "%", impact: +4.1, trend: "improving",  detail: "Festive demand not captured in baseline forecast" },
      { dimension: "SKU",       name: "SKU-0088 (Face Wash)",     value: 31.4, unit: "%", impact: +2.3, trend: "worsening",  detail: "New competitor launch caused demand shift not forecasted" },
      { dimension: "Category",  name: "Personal Care",            value: 18.6, unit: "%", impact: +1.7, trend: "stable",     detail: "Highest volatility category — seasonal promotions vary" },
      { dimension: "Warehouse", name: "BLR",                      value: 16.2, unit: "%", impact: +1.1, trend: "improving",  detail: "South India demand pattern differs from national model" },
      { dimension: "Supplier",  name: "Procter & Gamble India",   value: 19.8, unit: "%", impact: +0.9, trend: "stable",     detail: "Trade promotions creating irregular demand peaks" },
    ],
  },

  "stockout-risk": {
    kpiKey: "stockout-risk",
    kpiLabel: "Stockout Risk (High)",
    value: 14,
    unit: " SKUs",
    target: 0,
    source: "Planning",
    insight: "14 SKUs at high stockout risk — concentrated in Personal Care at DEL.",
    recommendation: "Raise safety stock for top-5 at-risk SKUs; expedite PO-2024-0891.",
    factors: [
      { dimension: "Category",  name: "Personal Care",            value: 8,  unit: " SKUs", impact: +8,  trend: "worsening",  detail: "8 of 14 at-risk SKUs are Personal Care — lead time increased" },
      { dimension: "Warehouse", name: "DEL",                      value: 9,  unit: " SKUs", impact: +9,  trend: "worsening",  detail: "DEL accounts for 9 stockout-risk SKUs due to inbound backlog" },
      { dimension: "Supplier",  name: "HUL (Delayed PO)",         value: 5,  unit: " SKUs", impact: +5,  trend: "stable",     detail: "PO-2024-0891 delayed 11 days — 5 dependent SKUs at risk" },
      { dimension: "SKU",       name: "SKU-0047 (Shampoo 200ml)", value: 2,  unit: " days", impact: +2,  trend: "worsening",  detail: "Only 2 days of stock remaining; reorder point breached" },
      { dimension: "SKU",       name: "SKU-0061 (Conditioner)",   value: 3,  unit: " days", impact: +3,  trend: "stable",     detail: "3 days of cover; dependent on delayed HUL shipment" },
    ],
  },
};

export function getDrillDown(kpiKey: string): DrillDown | null {
  return DRILL_DOWN_MAP[kpiKey] ?? null;
}

export function getAllDrillDownKeys(): string[] {
  return Object.keys(DRILL_DOWN_MAP);
}
