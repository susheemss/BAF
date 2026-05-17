import fs from "fs";
import path from "path";
import Papa from "papaparse";
import {
  buildCarrierDelay,
  buildCarrierOnTime,
  buildRouteCost,
  buildRouteDelay,
  computeKPIs,
} from "@/lib/tms/kpi";
import type { ShipmentRecord } from "@/lib/tms/stores";

type PlanningRow = {
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

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

async function safeFetchJson(url: string, init?: RequestInit) {
  try {
    const response = await fetch(url, init);
    const text = await response.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { ok: response.ok, json };
  } catch {
    return { ok: false, json: null };
  }
}

function readPlanningData() {
  const csvPath = path.join(process.cwd(), "public", "planning_demand_supply.csv");
  if (!fs.existsSync(csvPath)) {
    return { available: false, reason: "planning CSV not found" };
  }

  const csvText = fs.readFileSync(csvPath, "utf-8");
  const { data } = Papa.parse<PlanningRow>(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  const rows = data.filter((row) => row && row.sku_id);
  if (!rows.length) {
    return { available: false, reason: "planning CSV is empty" };
  }

  const months = [...new Set(rows.map((row) => row.month))].sort();
  const latestMonth = months[months.length - 1];
  const latestRows = rows.filter((row) => row.month === latestMonth);

  const byWarehouse = [...new Set(latestRows.map((row) => row.warehouse))]
    .sort()
    .map((warehouse) => {
      const items = latestRows.filter((row) => row.warehouse === warehouse);
      return {
        warehouse,
        totalSkus: new Set(items.map((row) => row.sku_id)).size,
        highRiskSkus: items.filter((row) => row.stockout_risk === "High").length,
        avgDaysOfCover: Number(avg(items.map((row) => Number(row.days_of_cover || 0))).toFixed(1)),
        inventoryValueCr: Number(
          (items.reduce((sum, row) => sum + Number(row.inventory_value_inr || 0), 0) / 10000000).toFixed(2)
        ),
      };
    });

  const byCategory = [...new Set(latestRows.map((row) => row.category))]
    .sort()
    .map((category) => {
      const items = latestRows.filter((row) => row.category === category);
      const plan = items.reduce((sum, row) => sum + Number(row.demand_plan || 0), 0);
      const actual = items.reduce((sum, row) => sum + Number(row.actual_demand || 0), 0);
      return {
        category,
        demandPlan: plan,
        actualDemand: actual,
        variancePct: plan > 0 ? Number((((actual - plan) / plan) * 100).toFixed(1)) : 0,
      };
    });

  const highRiskSkus = latestRows
    .filter((row) => row.stockout_risk === "High")
    .sort((a, b) => Number(a.days_of_cover || 0) - Number(b.days_of_cover || 0))
    .slice(0, 10)
    .map((row) => ({
      sku: row.sku_id,
      warehouse: row.warehouse,
      category: row.category,
      daysOfCover: row.days_of_cover,
      stockOnHand: row.stock_on_hand,
      supplier: row.supplier,
    }));

  const delayedPos = latestRows
    .filter((row) => row.po_number && String(row.po_status).toLowerCase() === "delayed")
    .slice(0, 10)
    .map((row) => ({
      poNumber: row.po_number,
      sku: row.sku_id,
      warehouse: row.warehouse,
      supplier: row.supplier,
      expectedReceiptDate: row.expected_receipt_date,
      poQty: row.po_qty,
    }));

  return {
    available: true,
    latestMonth,
    totalRows: rows.length,
    summary: {
      totalSkus: new Set(latestRows.map((row) => row.sku_id)).size,
      highRiskSkus: latestRows.filter((row) => row.stockout_risk === "High").length,
      mediumRiskSkus: latestRows.filter((row) => row.stockout_risk === "Medium").length,
      avgDaysOfCover: Number(avg(latestRows.map((row) => Number(row.days_of_cover || 0))).toFixed(1)),
      demandVariancePct: Number(avg(rows.map((row) => Math.abs(Number(row.demand_variance_pct || 0)))).toFixed(1)),
      activePos: latestRows.filter((row) => row.po_number && row.po_status && !["Delivered", "Not Raised", ""].includes(row.po_status)).length,
    },
    byWarehouse,
    byCategory,
    highRiskSkus,
    delayedPos,
  };
}

function readTmsData() {
  const jsonPath = path.join(process.cwd(), "data", "tms_shipments.json");
  if (!fs.existsSync(jsonPath)) {
    return { available: false, reason: "TMS uploads have not been saved on the server yet" };
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const records = JSON.parse(raw) as ShipmentRecord[];
  if (!Array.isArray(records) || !records.length) {
    return { available: false, reason: "TMS upload store is empty" };
  }

  const kpis = computeKPIs(records);

  return {
    available: true,
    totalRecords: records.length,
    latestDate: [...new Set(records.map((record) => record.date).filter(Boolean))].sort().at(-1) ?? null,
    summary: {
      totalShipments: kpis.totalShipments,
      onTimeRate: Number(kpis.onTimeRate.toFixed(1)),
      delayRate: Number(kpis.delayRate.toFixed(1)),
      averageTransitTime: Number(kpis.averageTransitTime.toFixed(1)),
      costPerShipment: Number(kpis.costPerShipment.toFixed(1)),
      tenderAcceptanceRate: Number(kpis.tenderAcceptanceRate.toFixed(1)),
      totalWeightKg: Number(kpis.totalWeightKg.toFixed(1)),
      totalCo2Kg: Number(kpis.totalCo2Kg.toFixed(1)),
    },
    topCarriers: buildCarrierOnTime(records).slice(0, 10),
    worstCarrierDelay: buildCarrierDelay(records).slice(0, 10),
    worstRoutes: buildRouteDelay(records).slice(0, 10),
    highestCostRoutes: buildRouteCost(records).slice(0, 10),
  };
}

async function readWdeData() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8001";
  const headers = { Authorization: "Bearer demo-session" };

  const health = await safeFetchJson(`${apiBase}/health`);
  if (!health.ok) {
    return { available: false, reason: "WDE backend is not reachable" };
  }

  const statusResponse = await safeFetchJson(`${apiBase}/api/data/status`, { headers });
  const uploadStatus = (statusResponse.json ?? {}) as {
    uploaded?: Record<string, unknown>;
    missing?: string[];
  };

  const uploadedKeys = Object.keys(uploadStatus.uploaded ?? {});
  if (!uploadedKeys.length) {
    return { available: false, reason: "No WDE datasets uploaded to backend" };
  }

  const [kpis, disruptionRisk] = await Promise.all([
    safeFetchJson(`${apiBase}/api/kpis/all`, { headers }),
    safeFetchJson(`${apiBase}/api/ai/disruption-risk-score`, { headers }),
  ]);

  return {
    available: true,
    uploadedKeys,
    missingKeys: uploadStatus.missing ?? [],
    kpis: kpis.ok ? kpis.json : null,
    disruptionRisk: disruptionRisk.ok ? disruptionRisk.json : null,
  };
}

export async function buildUnifiedChatContext() {
  const [planning, tms, wde] = await Promise.all([
    Promise.resolve(readPlanningData()),
    Promise.resolve(readTmsData()),
    readWdeData(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    strictMode: true,
    guidance: "Answer only from this data context. If the answer is not supported here, say it is unavailable from uploaded data.",
    planning,
    tms,
    wde,
  };
}
