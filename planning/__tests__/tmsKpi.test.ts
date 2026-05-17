/**
 * Tests for TMS KPI computation logic.
 * Validates threshold checks, formatting, and alert generation.
 */
import { describe, it, expect } from "vitest";
import {
  computeKPIs,
  filterShipments,
  KPI_THRESHOLDS,
  formatPercent,
  formatNumber,
} from "../lib/tms/kpi";
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
    orderType: "Standard",
    ...overrides,
  };
}

// ── KPI Thresholds ─────────────────────────────────────────────────────────────
describe("KPI_THRESHOLDS", () => {
  it("onTimeRate green threshold is >= 92%", () => {
    expect(KPI_THRESHOLDS.onTimeRate.green).toBe(92);
  });

  it("delayRate green threshold is <= 5%", () => {
    expect(KPI_THRESHOLDS.delayRate.green).toBe(5);
  });

  it("costPerShipment green threshold is <= 1800", () => {
    expect(KPI_THRESHOLDS.costPerShipment.green).toBe(1800);
  });
});

// ── filterShipments ────────────────────────────────────────────────────────────
describe("filterShipments", () => {
  const shipments = [
    makeShipment({ carrierName: "Maersk", modeOfTransport: "Road", productType: "Electronics", originRegion: "North", destinationRegion: "West", onTimeStatus: "On-Time" }),
    makeShipment({ carrierName: "Hapag Lyod", modeOfTransport: "Air", productType: "Pharma", originRegion: "South", destinationRegion: "East", onTimeStatus: "Delayed" }),
    makeShipment({ carrierName: "Maersk", modeOfTransport: "Road", productType: "Electronics", originRegion: "North", destinationRegion: "West", onTimeStatus: "Delayed" }),
  ];

  const defaultFilters = {
    startDate: "", endDate: "", carrier: "All", mode: "All",
    productType: "All", originRegion: "All", originCountry: "All",
    originState: "All", originCity: "All", destinationRegion: "All",
    destinationCountry: "All", destinationState: "All", destinationCity: "All",
    route: "All", status: "All", orderType: "All",
  };

  it("returns all shipments when all filters are All", () => {
    const result = filterShipments(shipments, defaultFilters);
    expect(result).toHaveLength(3);
  });

  it("filters by carrier", () => {
    const result = filterShipments(shipments, { ...defaultFilters, carrier: "Maersk" });
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.carrierName === "Maersk")).toBe(true);
  });

  it("filters by mode of transport", () => {
    const result = filterShipments(shipments, { ...defaultFilters, mode: "Air" });
    expect(result).toHaveLength(1);
    expect(result[0].carrierName).toBe("Hapag Lyod");
  });

  it("filters by product type", () => {
    const result = filterShipments(shipments, { ...defaultFilters, productType: "Pharma" });
    expect(result).toHaveLength(1);
  });

  it("filters by status", () => {
    const result = filterShipments(shipments, { ...defaultFilters, status: "Delayed" });
    expect(result).toHaveLength(2);
  });

  it("returns empty array when no shipments match", () => {
    const result = filterShipments(shipments, { ...defaultFilters, carrier: "Unknown Carrier" });
    expect(result).toHaveLength(0);
  });
});

// ── computeKPIs ────────────────────────────────────────────────────────────────
describe("computeKPIs", () => {
  it("returns zero KPIs for empty shipment list", () => {
    const kpis = computeKPIs([]);
    expect(kpis.onTimeRate).toBe(0);
    expect(kpis.delayRate).toBe(0);
    expect(kpis.averageTransitTime).toBe(0);
    expect(kpis.costPerShipment).toBe(0);
  });

  it("calculates 100% on-time rate when all shipments are on time", () => {
    const shipments = [
      makeShipment({ onTimeStatus: "On-Time" }),
      makeShipment({ onTimeStatus: "On-Time" }),
      makeShipment({ onTimeStatus: "On-Time" }),
    ];
    const kpis = computeKPIs(shipments);
    expect(kpis.onTimeRate).toBe(100);
  });

  it("calculates 0% on-time rate when all shipments are delayed", () => {
    const shipments = [
      makeShipment({ onTimeStatus: "Delayed" }),
      makeShipment({ onTimeStatus: "Delayed" }),
    ];
    const kpis = computeKPIs(shipments);
    expect(kpis.onTimeRate).toBe(0);
    expect(kpis.delayRate).toBe(100);
  });

  it("calculates correct mixed on-time rate", () => {
    const shipments = [
      makeShipment({ onTimeStatus: "On-Time" }),
      makeShipment({ onTimeStatus: "On-Time" }),
      makeShipment({ onTimeStatus: "Delayed" }),
      makeShipment({ onTimeStatus: "Delayed" }),
    ];
    const kpis = computeKPIs(shipments);
    expect(kpis.onTimeRate).toBe(50);
    expect(kpis.delayRate).toBe(50);
  });

  it("calculates average transit time correctly", () => {
    const shipments = [
      makeShipment({ transitTimeDays: 2 }),
      makeShipment({ transitTimeDays: 4 }),
    ];
    const kpis = computeKPIs(shipments);
    expect(kpis.averageTransitTime).toBe(3);
  });

  it("calculates average cost per shipment correctly", () => {
    const shipments = [
      makeShipment({ shipmentCostUsd: 1000 }),
      makeShipment({ shipmentCostUsd: 2000 }),
    ];
    const kpis = computeKPIs(shipments);
    expect(kpis.costPerShipment).toBe(1500);
  });

  it("onTimeRate + delayRate = 100 for any dataset", () => {
    const shipments = [
      makeShipment({ onTimeStatus: "On-Time" }),
      makeShipment({ onTimeStatus: "Delayed" }),
      makeShipment({ onTimeStatus: "On-Time" }),
    ];
    const kpis = computeKPIs(shipments);
    expect(kpis.onTimeRate + kpis.delayRate).toBeCloseTo(100, 1);
  });
});

// ── Formatting helpers ─────────────────────────────────────────────────────────
describe("formatPercent", () => {
  it("formats number as percentage string", () => {
    expect(formatPercent(85.5)).toBe("85.5%");
  });

  it("formats 100 correctly", () => {
    expect(formatPercent(100)).toBe("100.0%");
  });

  it("formats 0 correctly", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });
});

describe("formatNumber", () => {
  it("formats numbers with one decimal place", () => {
    expect(formatNumber(1500)).toBe("1500.0");
  });

  it("formats zero with one decimal place", () => {
    expect(formatNumber(0)).toBe("0.0");
  });

  it("formats fractional numbers correctly", () => {
    expect(formatNumber(3.14159)).toBe("3.1");
  });
});
