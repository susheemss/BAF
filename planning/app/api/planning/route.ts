import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

type Row = {
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

// Map ISO date strings to display labels
const MONTH_LABEL: Record<string, string> = {
  "2024-09-01": "Sep 24",
  "2024-10-01": "Oct 24",
  "2024-11-01": "Nov 24",
  "2024-12-01": "Dec 24",
  "2025-01-01": "Jan 25",
  "2025-02-01": "Feb 25",
};
const LABEL_TO_ISO: Record<string, string> = Object.fromEntries(
  Object.entries(MONTH_LABEL).map(([iso, label]) => [label, iso])
);

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const warehouse = searchParams.get("warehouse") || "All";
    const fromMonth = searchParams.get("fromMonth") || "All";
    const toMonth   = searchParams.get("toMonth")   || "All";
    const category  = searchParams.get("category")  || "All";

    const csvPath = path.join(process.cwd(), "public", "planning_demand_supply.csv");
    const csvText = fs.readFileSync(csvPath, "utf-8");

    const { data: allRows } = Papa.parse<Row>(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    // Apply warehouse filter
    let rows = warehouse === "All" ? allRows : allRows.filter((r) => r.warehouse === warehouse);

    // Apply month range filter
    const fromISO = fromMonth !== "All" ? LABEL_TO_ISO[fromMonth] : null;
    const toISO   = toMonth   !== "All" ? LABEL_TO_ISO[toMonth]   : null;
    if (fromISO) rows = rows.filter((r) => r.month >= fromISO);
    if (toISO)   rows = rows.filter((r) => r.month <= toISO);

    // Apply category filter
    if (category !== "All") rows = rows.filter((r) => r.category === category);

    // Latest month in the filtered set
    const months = [...new Set(rows.map((r) => r.month))].sort();
    const latestISO = months[months.length - 1];
    const latestRows = rows.filter((r) => r.month === latestISO);

    // ── Planning summary KPIs (from latest month) ──────────────────────────
    const totalSkus        = new Set(latestRows.map((r) => r.sku_id)).size;
    const stockoutRiskHigh = latestRows.filter((r) => r.stockout_risk === "High").length;
    const stockoutRiskMed  = latestRows.filter((r) => r.stockout_risk === "Medium").length;
    const avgDaysOfCover   = parseFloat(avg(latestRows.map((r) => r.days_of_cover)).toFixed(1));
    const demandVariancePct = parseFloat(avg(rows.map((r) => Math.abs(r.demand_variance_pct))).toFixed(1));
    const inventoryValueCr  = parseFloat(
      (latestRows.reduce((s, r) => s + r.inventory_value_inr, 0) / 10_000_000).toFixed(2)
    );
    const activePos = latestRows.filter(
      (r) => r.po_number && r.po_status && !["Delivered", "Not Raised", ""].includes(r.po_status)
    ).length;

    // ── Monthly demand trend ───────────────────────────────────────────────
    const monthlyTrend = months.map((iso) => {
      const m = rows.filter((r) => r.month === iso);
      const plan   = m.reduce((s, r) => s + r.demand_plan,    0);
      const actual = m.reduce((s, r) => s + r.actual_demand,  0);
      return {
        month:    MONTH_LABEL[iso] ?? iso,
        plan,
        actual,
        variance: plan > 0 ? parseFloat((((actual - plan) / plan) * 100).toFixed(1)) : 0,
      };
    });

    // ── Category mix (latest month) ────────────────────────────────────────
    const catMap: Record<string, { plan: number; actual: number }> = {};
    latestRows.forEach((r) => {
      catMap[r.category] ??= { plan: 0, actual: 0 };
      catMap[r.category].plan   += r.demand_plan;
      catMap[r.category].actual += r.actual_demand;
    });
    const categoryMix = Object.entries(catMap).map(([cat, v]) => ({
      category: cat,
      plan:     v.plan,
      actual:   v.actual,
      variance: v.plan > 0 ? parseFloat((((v.actual - v.plan) / v.plan) * 100).toFixed(1)) : 0,
    }));

    // ── SKU risk table (latest month, sorted by days of cover asc) ─────────
    const skuRisks = latestRows
      .map((r) => ({
        sku:         r.sku_id,
        warehouse:   r.warehouse,
        category:    r.category,
        daysOfCover: r.days_of_cover,
        risk:        r.stockout_risk,
        stockOnHand: r.stock_on_hand,
        demandPlan:  r.demand_plan,
        variance:    r.demand_variance_pct,
      }))
      .sort((a, b) => a.daysOfCover - b.daysOfCover);

    // ── PO data (all months in filter, exclude Not Raised) ─────────────────
    const STATUS_COLORS: Record<string, string> = {
      Delivered:    "#10B981",
      "In Transit": "#3B82F6",
      Pending:      "#F59E0B",
      Delayed:      "#EF4444",
    };
    const poData = rows
      .filter((r) => r.po_number && r.po_status && r.po_status !== "Not Raised")
      .map((r) => ({
        po:           r.po_number,
        sku:          r.sku_id,
        supplier:     r.supplier,
        warehouse:    r.warehouse,
        category:     r.category,
        qty:          r.po_qty,
        poDate:       r.po_date,
        expectedDate: r.expected_receipt_date,
        status:       r.po_status,
        daysDelay:    0, // not in source data; could be derived if needed
        value:        Math.round(r.po_qty * r.unit_cost_inr),
      }));

    // ── Inventory cover by category (latest month) ─────────────────────────
    const coverMap: Record<string, number[]> = {};
    latestRows.forEach((r) => {
      coverMap[r.category] ??= [];
      coverMap[r.category].push(r.days_of_cover);
    });
    const inventoryCover = Object.entries(coverMap).map(([cat, covers]) => ({
      category: cat,
      avgCover: parseFloat(avg(covers).toFixed(1)),
      target:   21,
    }));

    // ── PO status pie ──────────────────────────────────────────────────────
    const statusCount: Record<string, number> = {};
    poData.forEach((p) => { statusCount[p.status] = (statusCount[p.status] ?? 0) + 1; });
    const poStatusPie = Object.entries(statusCount).map(([name, value]) => ({
      name, value, color: STATUS_COLORS[name] ?? "#94a3b8",
    }));

    return NextResponse.json({
      summary: {
        totalSkus,
        stockoutRiskHigh,
        stockoutRiskMed,
        avgDaysOfCover,
        demandVariancePct,
        inventoryValueCr,
        activePos,
      },
      monthlyTrend,
      categoryMix,
      skuRisks,
      poData,
      inventoryCover,
      poStatusPie,
      latestMonth: MONTH_LABEL[latestISO] ?? latestISO,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
