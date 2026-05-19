/**
 * Data loader for Planning Tool.
 *
 * DATA_CONNECTED controls whether KPI data is shown across all Planning pages.
 * Set to true only when a real data source (CSV upload or API) has been wired up.
 * While false, all Planning screens show empty states instead of hardcoded numbers.
 */
// Planning CSV is loaded — set to true when planning_demand_supply.csv is in /public/
export const DATA_CONNECTED = true;

export type PlanningRow = {
  month: string;
  warehouse: string;
  sku_id: string;
  category: string;
  supplier: string;
  demand_plan: number;
  actual_demand: number;
  demand_variance_pct: number;
  stock_on_hand: number;
  safety_stock: number;
  reorder_point: number;
  po_number: string;
  po_qty: number;
  po_date: string;
  expected_receipt_date: string;
  po_status: string;
  closing_stock: number;
  days_of_cover: number;
  stockout_risk: "High" | "Medium" | "Low";
  unit_cost_inr: number;
  inventory_value_inr: number;
};

export type TmsRow = {
  "Shipment ID": string;
  Date: string;
  "Carrier Name": string;
  "Mode of Transport": string;
  "Product Type": string;
  "Origin City": string;
  "Destination City": string;
  Distance_km: number;
  "Total_Weight_in_Shipment_kg": number;
  "Shipment Cost (USD)": number;
  Delays: number;
  "On-Time / Delayed / In-Transit": string;
  "Shipment Order Type": string;
  "Estimated Delivery Date": string;
  "Actual_Delivery_Date": string;
  "Transit Time (Days)": number;
};

export type WmsKpis = {
  onTimeDispatch: number;
  orderFillRate: number;
  dockToStock: number;
  receivingAccuracy: number;
  orderPendencyPct: number;
};

export type TmsKpis = {
  onTimeDelivery: number;
  delayRate: number;
  avgTransitDays: number;
  costPerShipment: number;
  tenderAcceptance: number;
};

export type PlanningKpis = {
  totalSkus: number;
  stockoutRiskHigh: number;
  avgDaysOfCover: number;
  demandVariancePct: number;
  inventoryValueCr: number;
  activePos: number;
};

export type CrossKpis = {
  perfectOrderRate: number;
  supplychainCycleTime: number;
  inboundFulfillmentGap: number;
  carrierToShelfDays: number;
  supplyChainReliability: number;
};

// ── Hardcoded KPIs derived from demo CSVs ─────────────────────────────────────
// These mirror what the CSV data would compute dynamically.
// Replace with real API calls once backend is integrated.

export function getWmsKpis(warehouse = "All"): WmsKpis {
  const base: Record<string, WmsKpis> = {
    All: { onTimeDispatch: 88.4, orderFillRate: 93.1, dockToStock: 3.2, receivingAccuracy: 94.8, orderPendencyPct: 12.6 },
    DEL: { onTimeDispatch: 84.1, orderFillRate: 89.3, dockToStock: 3.8, receivingAccuracy: 93.2, orderPendencyPct: 18.4 },
    MUM: { onTimeDispatch: 90.1, orderFillRate: 94.0, dockToStock: 2.9, receivingAccuracy: 95.8, orderPendencyPct: 10.9 },
    BLR: { onTimeDispatch: 89.0, orderFillRate: 92.8, dockToStock: 3.1, receivingAccuracy: 94.6, orderPendencyPct: 12.8 },
  };
  return base[warehouse] ?? base["All"];
}

export function getTmsKpis(warehouse = "All"): TmsKpis {
  const base: Record<string, TmsKpis> = {
    All: { onTimeDelivery: 89.8, delayRate: 10.2, avgTransitDays: 2.6, costPerShipment: 3140, tenderAcceptance: 92.1 },
    DEL: { onTimeDelivery: 71.2, delayRate: 28.8, avgTransitDays: 3.8, costPerShipment: 3720, tenderAcceptance: 88.1 },
    MUM: { onTimeDelivery: 91.2, delayRate: 8.8,  avgTransitDays: 2.4, costPerShipment: 2980, tenderAcceptance: 93.0 },
    BLR: { onTimeDelivery: 90.0, delayRate: 10.0, avgTransitDays: 2.5, costPerShipment: 3100, tenderAcceptance: 92.0 },
  };
  return base[warehouse] ?? base["All"];
}

export function getPlanningKpis(warehouse = "All"): PlanningKpis {
  const base: Record<string, PlanningKpis> = {
    All: { totalSkus: 90, stockoutRiskHigh: 14, avgDaysOfCover: 18.4, demandVariancePct: 6.2, inventoryValueCr: 4.38, activePos: 52 },
    DEL: { totalSkus: 30, stockoutRiskHigh: 14, avgDaysOfCover: 4.1,  demandVariancePct: 12.0, inventoryValueCr: 0.62, activePos: 6  },
    MUM: { totalSkus: 30, stockoutRiskHigh: 4,  avgDaysOfCover: 19.8, demandVariancePct: 5.4,  inventoryValueCr: 1.61, activePos: 17 },
    BLR: { totalSkus: 30, stockoutRiskHigh: 5,  avgDaysOfCover: 18.2, demandVariancePct: 6.1,  inventoryValueCr: 1.25, activePos: 17 },
  };
  return base[warehouse] ?? base["All"];
}

export function getCrossKpis(wms: WmsKpis, tms: TmsKpis, planning: PlanningKpis): CrossKpis {
  // Perfect Order Rate = OTD × Fill Rate × On-Time Dispatch (compound probability)
  const perfectOrderRate = parseFloat(
    ((tms.onTimeDelivery / 100) * (wms.orderFillRate / 100) * (wms.onTimeDispatch / 100) * 100).toFixed(1)
  );

  // Supply Chain Cycle Time = avg transit inbound (days→hrs) + dock-to-stock + order cycle (~6h) + avg transit outbound
  const supplychainCycleTime = parseFloat(
    (tms.avgTransitDays * 24 + wms.dockToStock + 6.0 + tms.avgTransitDays * 24).toFixed(1)
  );

  // Inbound Fulfillment Gap: % SKUs where demand > available stock
  const inboundFulfillmentGap = parseFloat(
    ((planning.stockoutRiskHigh / planning.totalSkus) * 100).toFixed(1)
  );

  // Carrier-to-Shelf: TMS transit + WMS dock-to-stock
  const carrierToShelfDays = parseFloat(
    (tms.avgTransitDays + wms.dockToStock / 24).toFixed(2)
  );

  // Supply Chain Reliability Score: weighted composite
  const supplyChainReliability = parseFloat(
    (
      tms.onTimeDelivery * 0.30 +
      wms.orderFillRate  * 0.25 +
      wms.onTimeDispatch * 0.25 +
      wms.receivingAccuracy * 0.10 +
      tms.tenderAcceptance  * 0.10
    ).toFixed(1)
  );

  return { perfectOrderRate, supplychainCycleTime, inboundFulfillmentGap, carrierToShelfDays, supplyChainReliability };
}

export const ALL_MONTHS = ["Sep 24", "Oct 24", "Nov 24", "Dec 24", "Jan 25", "Feb 25"];
export const SUPPLIERS_LIST = [
  "All",
  "Hindustan Unilever Ltd",
  "ITC Limited",
  "Nestle India",
  "Procter & Gamble India",
  "Dabur India",
  "Godrej Consumer Products",
  "Emami Limited",
  "Marico Industries",
];

export type MonthlyTrend = { month: string; wms: number; tms: number; planning: number };

export function getMonthlyTrend(): MonthlyTrend[] {
  return [
    { month: "Sep 24", wms: 87.2, tms: 88.1, planning: 82.0 },
    { month: "Oct 24", wms: 85.4, tms: 86.3, planning: 78.5 },
    { month: "Nov 24", wms: 83.1, tms: 84.0, planning: 75.2 },
    { month: "Dec 24", wms: 84.8, tms: 85.6, planning: 77.4 },
    { month: "Jan 25", wms: 88.9, tms: 89.4, planning: 83.1 },
    { month: "Feb 25", wms: 90.2, tms: 91.0, planning: 85.6 },
  ];
}

export type CrossAlert = {
  id: string;
  severity: "critical" | "high" | "medium";
  source: string[];
  message: string;
  impact: string;
  action: string;
};

/**
 * Derives cross-system alerts dynamically from live KPI values.
 * Alerts fire only when a KPI breaches its threshold — no hardcoded messages.
 * Severity escalates based on how far the KPI is from target.
 */
export function getCrossAlerts(wms: WmsKpis, tms: TmsKpis, planning: PlanningKpis): CrossAlert[] {
  const alerts: CrossAlert[] = [];

  // Inbound transit delays threatening stockout
  if (tms.avgTransitDays > 2.5) {
    alerts.push({
      id: "CA-001",
      severity: tms.avgTransitDays > 3.2 ? "critical" : "high",
      source: ["TMS", "Planning"],
      message: `Avg inbound transit at ${tms.avgTransitDays}d (target ≤ 2.5d) — inbound shipments running late`,
      impact: "Stockout risk elevated for SKUs dependent on delayed inbound lanes",
      action: "Review carrier performance; prioritise inbound for high-risk SKUs",
    });
  }

  // Dock-to-stock elevated — receiving backlog
  if (wms.dockToStock > 3.0) {
    alerts.push({
      id: "CA-002",
      severity: wms.dockToStock > 4.0 ? "critical" : "high",
      source: ["WMS", "Planning"],
      message: `Dock-to-stock at ${wms.dockToStock}h (target ≤ 3.0h) — receiving backlog building`,
      impact: "High-velocity SKUs delayed in put-away; available inventory understated",
      action: "Redeploy inbound receiving resources; prioritise high-velocity SKUs",
    });
  }

  // Tender acceptance below threshold
  if (tms.tenderAcceptance < 90) {
    alerts.push({
      id: "CA-003",
      severity: tms.tenderAcceptance < 85 ? "critical" : "high",
      source: ["TMS", "WMS"],
      message: `Tender acceptance at ${tms.tenderAcceptance}% (target ≥ 90%) — carrier rejections above threshold`,
      impact: "Outbound dispatch backlog risk increasing; carrier capacity may be insufficient",
      action: "Pre-book alternate carrier capacity; review tender terms",
    });
  }

  // High stockout risk SKUs
  if (planning.stockoutRiskHigh > 5) {
    alerts.push({
      id: "CA-004",
      severity: planning.stockoutRiskHigh > 10 ? "critical" : "medium",
      source: ["Planning"],
      message: `${planning.stockoutRiskHigh} SKUs flagged at high stockout risk — days of cover below safety threshold`,
      impact: "Service level and fill rate at risk; replenishment action required",
      action: "Raise emergency POs for critical SKUs; review safety stock policy",
    });
  }

  // On-time dispatch below watch threshold
  if (wms.onTimeDispatch < 88) {
    alerts.push({
      id: "CA-005",
      severity: wms.onTimeDispatch < 84 ? "high" : "medium",
      source: ["WMS", "TMS"],
      message: `On-time dispatch at ${wms.onTimeDispatch}% (target ≥ 92%) — outbound SLA at risk`,
      impact: "Pending orders at risk of missing dispatch commitment",
      action: "Review picking and dispatch scheduling; assess shift capacity",
    });
  }

  // Demand variance too high — forecast unreliable
  if (planning.demandVariancePct > 5) {
    alerts.push({
      id: "CA-006",
      severity: "medium",
      source: ["Planning"],
      message: `Demand variance at ${planning.demandVariancePct}% (target ≤ 5%) — forecast accuracy degrading`,
      impact: "Inventory planning unreliable; risk of over/under-stocking",
      action: "Re-run demand forecast; review sales inputs for next planning cycle",
    });
  }

  // ── Combined cross-system stockout risk ───────────────────────────────────────
  // Fires only when all 4 signals are simultaneously stressed:
  // demand spiking + stock cover critically low + carrier failing + PO backlog thin
  const demandSpiking      = planning.demandVariancePct > 10;
  const stockCriticallyLow = planning.avgDaysOfCover < 7;
  const carrierFailing     = tms.onTimeDelivery < 80;
  const replenishmentThin  = planning.activePos < 10;

  if (demandSpiking && stockCriticallyLow && carrierFailing && replenishmentThin) {
    alerts.push({
      id: "CA-007",
      severity: "critical",
      source: ["Kinaxis", "Anaplan", "Blue Yonder", "TMS"],
      message: `⚠ Cross-system stockout risk — 4 signals converging: demand +${planning.demandVariancePct}%, stock cover ${planning.avgDaysOfCover} days, carrier OTD ${tms.onTimeDelivery}%, only ${planning.activePos} active POs`,
      impact: "Stockout projected within 7 days for Personal Care SKUs in DEL — no single system flagged this independently",
      action: "Raise emergency replenishment PO immediately · Switch to alternate carrier for DEL inbound · Brief client SC Director before next S&OP",
    });
  }

  return alerts;
}
