/**
 * Comprehensive filter tests for TMS filterShipments.
 * Verifies every FilterState dimension changes the result set correctly,
 * including date ranges, geo fields, route, orderType, combined filters,
 * and case-insensitive status matching.
 */
import { describe, it, expect } from "vitest";
import { filterShipments } from "../lib/tms/kpi";
import type { ShipmentRecord } from "../lib/tms/stores";

// ── Fixture factory ────────────────────────────────────────────────────────────
function makeShipment(overrides: Partial<ShipmentRecord> = {}): ShipmentRecord {
  return {
    shipmentId: "S001",
    loadId: "L001",
    route: "Delhi-Mumbai",
    date: "2024-10-01",
    month: "October",
    year: "2024",
    originRegion: "North",
    originCountry: "India",
    originState: "Delhi",
    originCity: "Delhi",
    originZipcode: "110001",
    originArea: "Area A",
    destinationRegion: "West",
    destinationCountry: "India",
    destinationState: "Maharashtra",
    destinationCity: "Mumbai",
    destinationZipcode: "400001",
    destinationArea: "Area B",
    carrierName: "Maersk",
    modeOfTransport: "Road",
    distanceKm: 1400,
    totalWeightKg: 5000,
    transitTimeDays: 3,
    operationalStatus: "Delivered",
    shipmentCostUsd: 1500,
    productType: "Electronics",
    delays: 0,
    onTimeStatus: "On-Time",
    shipmentPlanned: "Yes",
    equipment: "Truck",
    equipmentWeightCapacityKg: 10000,
    equipmentVolumeCapacityM3: 50,
    totalVolumeShipmentM3: 20,
    tenderedStatus: "Accepted",
    estimatedDeliveryDate: "2024-10-04",
    actualDeliveryDate: "2024-10-04",
    shipmentOrderType: "Standard",
    ...overrides,
  };
}

const ALL_FILTERS = {
  startDate: "", endDate: "", carrier: "All", mode: "All",
  productType: "All", originRegion: "All", originCountry: "All",
  originState: "All", originCity: "All", destinationRegion: "All",
  destinationCountry: "All", destinationState: "All", destinationCity: "All",
  route: "All", status: "All", orderType: "All",
};

// ── Test dataset ───────────────────────────────────────────────────────────────
const shipments: ShipmentRecord[] = [
  makeShipment({
    shipmentId: "S001", carrierName: "Maersk", modeOfTransport: "Road",
    productType: "Electronics", originRegion: "North", originCountry: "India",
    originState: "Delhi", originCity: "Delhi", destinationRegion: "West",
    destinationCountry: "India", destinationState: "Maharashtra",
    destinationCity: "Mumbai", route: "Delhi-Mumbai", onTimeStatus: "On-Time",
    shipmentOrderType: "Standard", date: "2024-09-15",
  }),
  makeShipment({
    shipmentId: "S002", carrierName: "Hapag Lloyd", modeOfTransport: "Air",
    productType: "Pharma", originRegion: "South", originCountry: "India",
    originState: "Tamil Nadu", originCity: "Chennai", destinationRegion: "East",
    destinationCountry: "India", destinationState: "West Bengal",
    destinationCity: "Kolkata", route: "Chennai-Kolkata", onTimeStatus: "Delayed",
    shipmentOrderType: "Express", date: "2024-10-10",
  }),
  makeShipment({
    shipmentId: "S003", carrierName: "Maersk", modeOfTransport: "Road",
    productType: "FMCG", originRegion: "North", originCountry: "India",
    originState: "Haryana", originCity: "Gurugram", destinationRegion: "South",
    destinationCountry: "India", destinationState: "Karnataka",
    destinationCity: "Bangalore", route: "Gurugram-Bangalore", onTimeStatus: "On-Time",
    shipmentOrderType: "Standard", date: "2024-11-05",
  }),
  makeShipment({
    shipmentId: "S004", carrierName: "DHL", modeOfTransport: "Ocean",
    productType: "Pharma", originRegion: "West", originCountry: "India",
    originState: "Maharashtra", originCity: "Mumbai", destinationRegion: "North",
    destinationCountry: "India", destinationState: "Delhi",
    destinationCity: "Delhi", route: "Mumbai-Delhi", onTimeStatus: "Delayed",
    shipmentOrderType: "Bulk", date: "2024-12-20",
  }),
];

// ── Single-field filters ───────────────────────────────────────────────────────
describe("filterShipments — single dimension", () => {
  it("originRegion: filters to North only", () => {
    const result = filterShipments(shipments, { ...ALL_FILTERS, originRegion: "North" });
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.originRegion === "North")).toBe(true);
  });

  it("originRegion: filters to West only", () => {
    const result = filterShipments(shipments, { ...ALL_FILTERS, originRegion: "West" });
    expect(result).toHaveLength(1);
    expect(result[0].shipmentId).toBe("S004");
  });

  it("destinationRegion: filters to East only", () => {
    const result = filterShipments(shipments, { ...ALL_FILTERS, destinationRegion: "East" });
    expect(result).toHaveLength(1);
    expect(result[0].shipmentId).toBe("S002");
  });

  it("originCountry: all shipments are India — returns all 4", () => {
    const result = filterShipments(shipments, { ...ALL_FILTERS, originCountry: "India" });
    expect(result).toHaveLength(4);
  });

  it("originState: filters to Tamil Nadu only", () => {
    const result = filterShipments(shipments, { ...ALL_FILTERS, originState: "Tamil Nadu" });
    expect(result).toHaveLength(1);
    expect(result[0].shipmentId).toBe("S002");
  });

  it("originCity: filters to Chennai only", () => {
    const result = filterShipments(shipments, { ...ALL_FILTERS, originCity: "Chennai" });
    expect(result).toHaveLength(1);
    expect(result[0].shipmentId).toBe("S002");
  });

  it("destinationCountry: all shipments are India — returns all 4", () => {
    const result = filterShipments(shipments, { ...ALL_FILTERS, destinationCountry: "India" });
    expect(result).toHaveLength(4);
  });

  it("destinationState: filters to Maharashtra only", () => {
    const result = filterShipments(shipments, { ...ALL_FILTERS, destinationState: "Maharashtra" });
    expect(result).toHaveLength(1);
    expect(result[0].shipmentId).toBe("S001");
  });

  it("destinationCity: filters to Mumbai only", () => {
    const result = filterShipments(shipments, { ...ALL_FILTERS, destinationCity: "Mumbai" });
    expect(result).toHaveLength(1);
    expect(result[0].shipmentId).toBe("S001");
  });

  it("route: filters by exact route string", () => {
    const result = filterShipments(shipments, { ...ALL_FILTERS, route: "Chennai-Kolkata" });
    expect(result).toHaveLength(1);
    expect(result[0].shipmentId).toBe("S002");
  });

  it("orderType: Standard returns 2 shipments", () => {
    const result = filterShipments(shipments, { ...ALL_FILTERS, orderType: "Standard" });
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.shipmentOrderType === "Standard")).toBe(true);
  });

  it("orderType: Express returns 1 shipment", () => {
    const result = filterShipments(shipments, { ...ALL_FILTERS, orderType: "Express" });
    expect(result).toHaveLength(1);
    expect(result[0].shipmentId).toBe("S002");
  });

  it("orderType: Bulk returns 1 shipment", () => {
    const result = filterShipments(shipments, { ...ALL_FILTERS, orderType: "Bulk" });
    expect(result).toHaveLength(1);
    expect(result[0].shipmentId).toBe("S004");
  });
});

// ── Date range filters ─────────────────────────────────────────────────────────
describe("filterShipments — date range", () => {
  it("startDate excludes earlier shipments", () => {
    // S001=Sep, S002=Oct, S003=Nov, S004=Dec
    const result = filterShipments(shipments, { ...ALL_FILTERS, startDate: "2024-11-01" });
    expect(result).toHaveLength(2); // S003, S004
    expect(result.map((s) => s.shipmentId)).toEqual(expect.arrayContaining(["S003", "S004"]));
  });

  it("endDate excludes later shipments", () => {
    const result = filterShipments(shipments, { ...ALL_FILTERS, endDate: "2024-10-31" });
    expect(result).toHaveLength(2); // S001, S002
    expect(result.map((s) => s.shipmentId)).toEqual(expect.arrayContaining(["S001", "S002"]));
  });

  it("startDate boundary: exact match date is included", () => {
    const result = filterShipments(shipments, { ...ALL_FILTERS, startDate: "2024-10-10" });
    // S002 date is exactly 2024-10-10 — should be included
    expect(result.map((s) => s.shipmentId)).toContain("S002");
  });

  it("endDate boundary: exact match date is included", () => {
    const result = filterShipments(shipments, { ...ALL_FILTERS, endDate: "2024-10-10" });
    // S002 date is exactly 2024-10-10 — should be included
    expect(result.map((s) => s.shipmentId)).toContain("S002");
  });

  it("combined startDate + endDate returns only shipments within window", () => {
    const result = filterShipments(shipments, {
      ...ALL_FILTERS, startDate: "2024-10-01", endDate: "2024-11-30",
    });
    expect(result).toHaveLength(2); // S002 (Oct), S003 (Nov)
    expect(result.map((s) => s.shipmentId)).toEqual(expect.arrayContaining(["S002", "S003"]));
  });

  it("date range that matches nothing returns empty array", () => {
    const result = filterShipments(shipments, {
      ...ALL_FILTERS, startDate: "2025-01-01", endDate: "2025-12-31",
    });
    expect(result).toHaveLength(0);
  });
});

// ── Status case-insensitivity ──────────────────────────────────────────────────
describe("filterShipments — status normalisation", () => {
  it("status filter is case-insensitive (mixed case input)", () => {
    const result = filterShipments(shipments, { ...ALL_FILTERS, status: "delayed" });
    expect(result).toHaveLength(2);
  });

  it("status filter with extra spaces is trimmed", () => {
    const result = filterShipments(shipments, { ...ALL_FILTERS, status: "  Delayed  " });
    expect(result).toHaveLength(2);
  });

  it("On-Time status returns correct shipments", () => {
    const result = filterShipments(shipments, { ...ALL_FILTERS, status: "on-time" });
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.onTimeStatus === "On-Time")).toBe(true);
  });
});

// ── Combined filters ───────────────────────────────────────────────────────────
describe("filterShipments — combined filters", () => {
  it("carrier + mode narrows correctly", () => {
    const result = filterShipments(shipments, {
      ...ALL_FILTERS, carrier: "Maersk", mode: "Road",
    });
    expect(result).toHaveLength(2); // S001, S003
    expect(result.every((s) => s.carrierName === "Maersk" && s.modeOfTransport === "Road")).toBe(true);
  });

  it("carrier + productType narrows to single result", () => {
    const result = filterShipments(shipments, {
      ...ALL_FILTERS, carrier: "Hapag Lloyd", productType: "Pharma",
    });
    expect(result).toHaveLength(1);
    expect(result[0].shipmentId).toBe("S002");
  });

  it("originRegion + destinationRegion narrows to single route", () => {
    const result = filterShipments(shipments, {
      ...ALL_FILTERS, originRegion: "North", destinationRegion: "West",
    });
    expect(result).toHaveLength(1);
    expect(result[0].shipmentId).toBe("S001");
  });

  it("productType + status returns matching subset", () => {
    const result = filterShipments(shipments, {
      ...ALL_FILTERS, productType: "Pharma", status: "Delayed",
    });
    expect(result).toHaveLength(2); // S002 and S004 are both Pharma+Delayed
    expect(result.every((s) => s.productType === "Pharma" && s.onTimeStatus === "Delayed")).toBe(true);
  });

  it("date range + carrier returns correct intersection", () => {
    const result = filterShipments(shipments, {
      ...ALL_FILTERS, startDate: "2024-11-01", carrier: "Maersk",
    });
    // S003 (Nov, Maersk) only — S004 is DHL
    expect(result).toHaveLength(1);
    expect(result[0].shipmentId).toBe("S003");
  });

  it("three simultaneous filters narrow to zero when contradictory", () => {
    const result = filterShipments(shipments, {
      ...ALL_FILTERS, carrier: "DHL", mode: "Air", productType: "Pharma",
    });
    // DHL uses Ocean, not Air — no match
    expect(result).toHaveLength(0);
  });

  it("all filters set to specific values returns exactly one match", () => {
    const result = filterShipments(shipments, {
      ...ALL_FILTERS,
      carrier: "Hapag Lloyd",
      mode: "Air",
      productType: "Pharma",
      originRegion: "South",
      destinationRegion: "East",
      status: "Delayed",
      orderType: "Express",
      route: "Chennai-Kolkata",
    });
    expect(result).toHaveLength(1);
    expect(result[0].shipmentId).toBe("S002");
  });
});

// ── KPI values change with filtered dataset ────────────────────────────────────
describe("KPI output changes correctly with filtered data", () => {
  // Import here to avoid circular issues — already imported at top
  // We verify that filtering affects computed KPIs meaningfully
  it("filtering to On-Time shipments raises onTimeRate to 100%", async () => {
    const { computeKPIs } = await import("../lib/tms/kpi");
    const onTimeOnly = filterShipments(shipments, { ...ALL_FILTERS, status: "On-Time" });
    const kpis = computeKPIs(onTimeOnly);
    expect(kpis.onTimeRate).toBe(100);
  });

  it("filtering to Delayed shipments drops onTimeRate to 0%", async () => {
    const { computeKPIs } = await import("../lib/tms/kpi");
    const delayedOnly = filterShipments(shipments, { ...ALL_FILTERS, status: "Delayed" });
    const kpis = computeKPIs(delayedOnly);
    expect(kpis.onTimeRate).toBe(0);
    expect(kpis.delayRate).toBe(100);
  });

  it("filtering to Air mode isolates only the Air shipment", async () => {
    const { computeKPIs } = await import("../lib/tms/kpi");
    const airOnly = filterShipments(shipments, { ...ALL_FILTERS, mode: "Air" });
    const airKpis = computeKPIs(airOnly);
    // Only S002 is Air — total shipments should shrink from 4 to 1
    expect(airKpis.totalShipments).toBe(1);
    expect(airKpis.totalShipments).toBeLessThan(shipments.length);
  });

  it("Maersk-only filter reduces total shipment count", async () => {
    const { computeKPIs } = await import("../lib/tms/kpi");
    const maerskOnly = filterShipments(shipments, { ...ALL_FILTERS, carrier: "Maersk" });
    const kpis = computeKPIs(maerskOnly);
    expect(kpis.totalShipments).toBe(2);
    expect(kpis.totalShipments).toBeLessThan(shipments.length);
  });
});
