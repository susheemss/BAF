/**
 * Data loader for Planning Tool.
 * In production this would call APIs. For now it reads the CSV demo files
 * that live in /public/data/ (copied there from demo_data/).
 */

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
    DEL: { onTimeDispatch: 86.2, orderFillRate: 92.4, dockToStock: 3.5, receivingAccuracy: 93.9, orderPendencyPct: 14.1 },
    MUM: { onTimeDispatch: 90.1, orderFillRate: 94.0, dockToStock: 2.9, receivingAccuracy: 95.8, orderPendencyPct: 10.9 },
    BLR: { onTimeDispatch: 89.0, orderFillRate: 92.8, dockToStock: 3.1, receivingAccuracy: 94.6, orderPendencyPct: 12.8 },
  };
  return base[warehouse] ?? base["All"];
}

export function getTmsKpis(warehouse = "All"): TmsKpis {
  const base: Record<string, TmsKpis> = {
    All: { onTimeDelivery: 89.8, delayRate: 10.2, avgTransitDays: 2.6, costPerShipment: 3140, tenderAcceptance: 92.1 },
    DEL: { onTimeDelivery: 88.3, delayRate: 11.7, avgTransitDays: 2.8, costPerShipment: 3320, tenderAcceptance: 91.4 },
    MUM: { onTimeDelivery: 91.2, delayRate: 8.8,  avgTransitDays: 2.4, costPerShipment: 2980, tenderAcceptance: 93.0 },
    BLR: { onTimeDelivery: 90.0, delayRate: 10.0, avgTransitDays: 2.5, costPerShipment: 3100, tenderAcceptance: 92.0 },
  };
  return base[warehouse] ?? base["All"];
}

export function getPlanningKpis(warehouse = "All"): PlanningKpis {
  const base: Record<string, PlanningKpis> = {
    All: { totalSkus: 90, stockoutRiskHigh: 14, avgDaysOfCover: 18.4, demandVariancePct: 6.2, inventoryValueCr: 4.38, activePos: 52 },
    DEL: { totalSkus: 30, stockoutRiskHigh: 5,  avgDaysOfCover: 17.1, demandVariancePct: 7.1, inventoryValueCr: 1.52, activePos: 18 },
    MUM: { totalSkus: 30, stockoutRiskHigh: 4,  avgDaysOfCover: 19.8, demandVariancePct: 5.4, inventoryValueCr: 1.61, activePos: 17 },
    BLR: { totalSkus: 30, stockoutRiskHigh: 5,  avgDaysOfCover: 18.2, demandVariancePct: 6.1, inventoryValueCr: 1.25, activePos: 17 },
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

export function getCrossAlerts(): CrossAlert[] {
  return [
    {
      id: "CA-001",
      severity: "critical",
      source: ["TMS", "Planning"],
      message: "Blue Dart delay spike (+2.3 days avg) — 14 inbound shipments to DEL overdue",
      impact: "8 SKUs projected to breach safety stock within 4 days",
      action: "Expedite alternate carrier for PO-47821, PO-47834",
    },
    {
      id: "CA-002",
      severity: "high",
      source: ["WMS", "Planning"],
      message: "DEL dock-to-stock at 5.1h (target 3.0h) — receiving backlog building",
      impact: "Demand plan for Oct-Nov at risk — 5 high-velocity SKUs delayed put-away",
      action: "Redeploy Team 2 to inbound dock; prioritize SKU-004, SKU-006",
    },
    {
      id: "CA-003",
      severity: "high",
      source: ["TMS", "WMS"],
      message: "Tender rejection rate at 11.2% — above 8% threshold",
      impact: "Outbound dispatch backlog growing at MUM warehouse",
      action: "Pre-book Delhivery capacity for next 72 hours",
    },
    {
      id: "CA-004",
      severity: "medium",
      source: ["Planning"],
      message: "14 SKUs at High stockout risk across 3 warehouses",
      impact: "Estimated ₹18L revenue at risk if not replenished in 7 days",
      action: "Raise emergency POs for 6 critical SKUs; review safety stock policy",
    },
    {
      id: "CA-005",
      severity: "medium",
      source: ["WMS", "TMS"],
      message: "On-Time Dispatch at 86.2% at DEL — lowest in 3 months",
      impact: "TMS outbound SLA breach risk for 42 orders",
      action: "Review picking team allocation for Shift B at DEL",
    },
  ];
}
