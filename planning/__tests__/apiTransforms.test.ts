/**
 * Tests for data transformation logic that mirrors what the planning API route does.
 * Isolated from filesystem — no CSV reads, no Next.js request objects.
 */
import { describe, it, expect } from "vitest";

// ─── Helpers duplicated from route.ts for isolated testing ────────────────────
function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

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

// ─────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────
type MockRow = {
  month: string; warehouse: string; sku_id: string; category: string;
  supplier: string; demand_plan: number; actual_demand: number;
  demand_variance_pct: number; stock_on_hand: number; safety_stock: number;
  reorder_point: number; po_number: string; po_qty: number;
  po_date: string; expected_receipt_date: string; po_status: string;
  closing_stock: number; days_of_cover: number; stockout_risk: "High" | "Medium" | "Low";
  unit_cost_inr: number; inventory_value_inr: number;
};

function makeRow(overrides: Partial<MockRow> = {}): MockRow {
  return {
    month: "2025-02-01",
    warehouse: "DEL",
    sku_id: "SKU-001",
    category: "Personal Care",
    supplier: "HUL",
    demand_plan: 1000,
    actual_demand: 950,
    demand_variance_pct: -5,
    stock_on_hand: 3000,
    safety_stock: 500,
    reorder_point: 800,
    po_number: "PO-001",
    po_qty: 500,
    po_date: "2025-01-10",
    expected_receipt_date: "2025-02-10",
    po_status: "In Transit",
    closing_stock: 2050,
    days_of_cover: 18,
    stockout_risk: "Low",
    unit_cost_inr: 120,
    inventory_value_inr: 246000,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────
// avg() helper
// ─────────────────────────────────────────────────────────────────
describe("avg()", () => {
  it("returns 0 for empty array", () => expect(avg([])).toBe(0));
  it("returns value for single element", () => expect(avg([5])).toBe(5));
  it("computes correct average", () => expect(avg([10, 20, 30])).toBe(20));
  it("handles decimals correctly", () => expect(avg([1.5, 2.5])).toBe(2.0));
});

// ─────────────────────────────────────────────────────────────────
// Month label mapping
// ─────────────────────────────────────────────────────────────────
describe("MONTH_LABEL mapping", () => {
  it("covers all 6 months in the dataset", () => {
    expect(Object.keys(MONTH_LABEL)).toHaveLength(6);
  });

  it("maps ISO dates to display labels correctly", () => {
    expect(MONTH_LABEL["2024-09-01"]).toBe("Sep 24");
    expect(MONTH_LABEL["2025-02-01"]).toBe("Feb 25");
  });

  it("LABEL_TO_ISO is the inverse of MONTH_LABEL", () => {
    for (const [iso, label] of Object.entries(MONTH_LABEL)) {
      expect(LABEL_TO_ISO[label]).toBe(iso);
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// Warehouse filter
// ─────────────────────────────────────────────────────────────────
describe("Warehouse filter logic", () => {
  const rows = [
    makeRow({ warehouse: "DEL" }),
    makeRow({ warehouse: "MUM" }),
    makeRow({ warehouse: "BLR" }),
    makeRow({ warehouse: "DEL" }),
  ];

  it("All warehouse returns all rows", () => {
    const filtered = "All" === "All" ? rows : rows.filter((r) => r.warehouse === "All");
    expect(filtered).toHaveLength(4);
  });

  it("DEL filter returns only DEL rows", () => {
    const filtered = rows.filter((r) => r.warehouse === "DEL");
    expect(filtered).toHaveLength(2);
    expect(filtered.every((r) => r.warehouse === "DEL")).toBe(true);
  });

  it("MUM filter returns only MUM rows", () => {
    const filtered = rows.filter((r) => r.warehouse === "MUM");
    expect(filtered).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────
// Month range filter
// ─────────────────────────────────────────────────────────────────
describe("Month range filter logic", () => {
  const rows = [
    makeRow({ month: "2024-09-01" }),
    makeRow({ month: "2024-10-01" }),
    makeRow({ month: "2024-11-01" }),
    makeRow({ month: "2025-01-01" }),
    makeRow({ month: "2025-02-01" }),
  ];

  it("fromMonth filter includes boundary month", () => {
    const fromISO = LABEL_TO_ISO["Nov 24"];
    const filtered = rows.filter((r) => r.month >= fromISO);
    expect(filtered).toHaveLength(3); // Nov 24, Jan 25, Feb 25
  });

  it("toMonth filter includes boundary month", () => {
    const toISO = LABEL_TO_ISO["Oct 24"];
    const filtered = rows.filter((r) => r.month <= toISO);
    expect(filtered).toHaveLength(2); // Sep 24, Oct 24
  });

  it("combined from+to range filters correctly", () => {
    const fromISO = LABEL_TO_ISO["Oct 24"];
    const toISO   = LABEL_TO_ISO["Jan 25"];
    const filtered = rows.filter((r) => r.month >= fromISO && r.month <= toISO);
    expect(filtered).toHaveLength(3); // Oct 24, Nov 24, Jan 25
  });

  it("range that matches single month returns one group", () => {
    const fromISO = LABEL_TO_ISO["Feb 25"];
    const toISO   = LABEL_TO_ISO["Feb 25"];
    const filtered = rows.filter((r) => r.month >= fromISO && r.month <= toISO);
    expect(filtered).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────
// Summary KPI computation
// ─────────────────────────────────────────────────────────────────
describe("Summary KPI computation from latest-month rows", () => {
  const latestRows = [
    makeRow({ sku_id: "SKU-001", stockout_risk: "High",   days_of_cover: 5,  inventory_value_inr: 100_000, po_status: "In Transit" }),
    makeRow({ sku_id: "SKU-002", stockout_risk: "High",   days_of_cover: 8,  inventory_value_inr: 200_000, po_status: "Pending" }),
    makeRow({ sku_id: "SKU-003", stockout_risk: "Medium", days_of_cover: 15, inventory_value_inr: 300_000, po_status: "Delivered" }),
    makeRow({ sku_id: "SKU-004", stockout_risk: "Low",    days_of_cover: 25, inventory_value_inr: 400_000, po_status: "Not Raised", po_number: "" }),
  ];

  it("totalSkus counts distinct sku_ids", () => {
    const totalSkus = new Set(latestRows.map((r) => r.sku_id)).size;
    expect(totalSkus).toBe(4);
  });

  it("stockoutRiskHigh counts only High-risk rows", () => {
    const count = latestRows.filter((r) => r.stockout_risk === "High").length;
    expect(count).toBe(2);
  });

  it("stockoutRiskMed counts only Medium-risk rows", () => {
    const count = latestRows.filter((r) => r.stockout_risk === "Medium").length;
    expect(count).toBe(1);
  });

  it("avgDaysOfCover is correct average", () => {
    const covers = latestRows.map((r) => r.days_of_cover); // [5, 8, 15, 25]
    const result = parseFloat(avg(covers).toFixed(1));
    expect(result).toBe(13.3);
  });

  it("inventoryValueCr converts INR to crores correctly", () => {
    const total = latestRows.reduce((s, r) => s + r.inventory_value_inr, 0); // 1,000,000
    const cr = parseFloat((total / 10_000_000).toFixed(2));
    expect(cr).toBe(0.1);
  });

  it("activePos excludes Delivered and Not Raised statuses", () => {
    const activePos = latestRows.filter(
      (r) => r.po_number && r.po_status && !["Delivered", "Not Raised", ""].includes(r.po_status)
    ).length;
    expect(activePos).toBe(2); // In Transit + Pending
  });
});

// ─────────────────────────────────────────────────────────────────
// Monthly demand trend aggregation
// ─────────────────────────────────────────────────────────────────
describe("Monthly demand trend aggregation", () => {
  const rows = [
    makeRow({ month: "2025-01-01", demand_plan: 1000, actual_demand: 1100 }),
    makeRow({ month: "2025-01-01", demand_plan: 500,  actual_demand: 450  }),
    makeRow({ month: "2025-02-01", demand_plan: 800,  actual_demand: 800  }),
  ];

  const months = [...new Set(rows.map((r) => r.month))].sort();
  const trend = months.map((iso) => {
    const m = rows.filter((r) => r.month === iso);
    const plan   = m.reduce((s, r) => s + r.demand_plan, 0);
    const actual = m.reduce((s, r) => s + r.actual_demand, 0);
    return {
      month: MONTH_LABEL[iso] ?? iso,
      plan,
      actual,
      variance: plan > 0 ? parseFloat((((actual - plan) / plan) * 100).toFixed(1)) : 0,
    };
  });

  it("aggregates multiple rows in same month", () => {
    const jan = trend.find((t) => t.month === "Jan 25");
    expect(jan?.plan).toBe(1500);
    expect(jan?.actual).toBe(1550);
  });

  it("calculates variance as percentage of plan", () => {
    const jan = trend.find((t) => t.month === "Jan 25");
    // (1550-1500)/1500 * 100 = 3.3%
    expect(jan?.variance).toBeCloseTo(3.3, 1);
  });

  it("variance is 0 when plan equals actual", () => {
    const feb = trend.find((t) => t.month === "Feb 25");
    expect(feb?.variance).toBe(0);
  });

  it("months are in chronological order", () => {
    expect(trend[0].month).toBe("Jan 25");
    expect(trend[1].month).toBe("Feb 25");
  });
});

// ─────────────────────────────────────────────────────────────────
// PO data filtering (excludes "Not Raised")
// ─────────────────────────────────────────────────────────────────
describe("PO data extraction", () => {
  const rows = [
    makeRow({ po_number: "PO-001", po_status: "In Transit",  po_qty: 100, unit_cost_inr: 50 }),
    makeRow({ po_number: "PO-002", po_status: "Delivered",   po_qty: 200, unit_cost_inr: 60 }),
    makeRow({ po_number: "",       po_status: "Not Raised",  po_qty: 0,   unit_cost_inr: 0  }),
    makeRow({ po_number: "PO-003", po_status: "Delayed",     po_qty: 150, unit_cost_inr: 80 }),
  ];

  const poData = rows
    .filter((r) => r.po_number && r.po_status && r.po_status !== "Not Raised")
    .map((r) => ({
      po:    r.po_number,
      status: r.po_status,
      value: Math.round(r.po_qty * r.unit_cost_inr),
    }));

  it("excludes rows with empty po_number", () => {
    expect(poData.every((p) => p.po !== "")).toBe(true);
  });

  it("excludes Not Raised POs", () => {
    expect(poData.find((p) => p.status === "Not Raised")).toBeUndefined();
  });

  it("includes In Transit, Delivered, and Delayed POs", () => {
    expect(poData).toHaveLength(3);
  });

  it("calculates PO value as qty × unit cost", () => {
    const po1 = poData.find((p) => p.po === "PO-001");
    expect(po1?.value).toBe(5000); // 100 × 50
  });
});

// ─────────────────────────────────────────────────────────────────
// Inventory cover by category
// ─────────────────────────────────────────────────────────────────
describe("Inventory cover by category", () => {
  const latestRows = [
    makeRow({ category: "Personal Care",    days_of_cover: 10 }),
    makeRow({ category: "Personal Care",    days_of_cover: 20 }),
    makeRow({ category: "Food & Beverages", days_of_cover: 15 }),
  ];

  const coverMap: Record<string, number[]> = {};
  latestRows.forEach((r) => {
    coverMap[r.category] ??= [];
    coverMap[r.category].push(r.days_of_cover);
  });
  const inventoryCover = Object.entries(coverMap).map(([cat, covers]) => ({
    category: cat,
    avgCover: parseFloat(avg(covers).toFixed(1)),
    target: 21,
  }));

  it("averages days of cover per category", () => {
    const pc = inventoryCover.find((c) => c.category === "Personal Care");
    expect(pc?.avgCover).toBe(15.0); // (10+20)/2
  });

  it("target is always 21 days", () => {
    inventoryCover.forEach((c) => expect(c.target).toBe(21));
  });

  it("produces one entry per category", () => {
    expect(inventoryCover).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────
// PO status pie
// ─────────────────────────────────────────────────────────────────
describe("PO status pie chart data", () => {
  const poData = [
    { status: "In Transit" },
    { status: "Delayed" },
    { status: "Delayed" },
    { status: "Delivered" },
    { status: "In Transit" },
    { status: "In Transit" },
  ];

  const STATUS_COLORS: Record<string, string> = {
    Delivered: "#10B981", "In Transit": "#3B82F6",
    Pending: "#F59E0B", Delayed: "#EF4444",
  };

  const statusCount: Record<string, number> = {};
  poData.forEach((p) => { statusCount[p.status] = (statusCount[p.status] ?? 0) + 1; });
  const pie = Object.entries(statusCount).map(([name, value]) => ({
    name, value, color: STATUS_COLORS[name] ?? "#94a3b8",
  }));

  it("counts each status correctly", () => {
    expect(pie.find((p) => p.name === "In Transit")?.value).toBe(3);
    expect(pie.find((p) => p.name === "Delayed")?.value).toBe(2);
    expect(pie.find((p) => p.name === "Delivered")?.value).toBe(1);
  });

  it("assigns correct color to known statuses", () => {
    expect(pie.find((p) => p.name === "Delayed")?.color).toBe("#EF4444");
    expect(pie.find((p) => p.name === "Delivered")?.color).toBe("#10B981");
  });

  it("total count in pie equals total PO count", () => {
    const total = pie.reduce((s, p) => s + p.value, 0);
    expect(total).toBe(poData.length);
  });
});
