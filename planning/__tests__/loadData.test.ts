import { describe, it, expect } from "vitest";
import {
  getCrossAlerts,
  getCrossKpis,
  getWmsKpis,
  getTmsKpis,
  getPlanningKpis,
  type WmsKpis,
  type TmsKpis,
  type PlanningKpis,
} from "../lib/loadData";

// ─────────────────────────────────────────────────────────────────
// Fixtures: healthy KPIs (no alerts should fire)
// ─────────────────────────────────────────────────────────────────
const healthyWms: WmsKpis = {
  onTimeDispatch: 93,
  orderFillRate: 96,
  dockToStock: 2.5,
  receivingAccuracy: 97,
  orderPendencyPct: 8,
};
const healthyTms: TmsKpis = {
  onTimeDelivery: 94,
  delayRate: 6,
  avgTransitDays: 2.0,
  costPerShipment: 2800,
  tenderAcceptance: 95,
};
const healthyPlanning: PlanningKpis = {
  totalSkus: 90,
  stockoutRiskHigh: 3,
  avgDaysOfCover: 22,
  demandVariancePct: 3.5,
  inventoryValueCr: 4.5,
  activePos: 50,
};

// ─────────────────────────────────────────────────────────────────
// getCrossAlerts — alert firing logic
// ─────────────────────────────────────────────────────────────────
describe("getCrossAlerts", () => {
  it("returns no alerts when all KPIs are within targets", () => {
    const alerts = getCrossAlerts(healthyWms, healthyTms, healthyPlanning);
    expect(alerts).toHaveLength(0);
  });

  describe("CA-001 — inbound transit delay", () => {
    it("fires when avgTransitDays > 2.5", () => {
      const tms = { ...healthyTms, avgTransitDays: 2.6 };
      const alerts = getCrossAlerts(healthyWms, tms, healthyPlanning);
      const ca001 = alerts.find((a) => a.id === "CA-001");
      expect(ca001).toBeDefined();
      expect(ca001?.severity).toBe("high");
      expect(ca001?.source).toContain("TMS");
      expect(ca001?.source).toContain("Planning");
    });

    it("does NOT fire when avgTransitDays = 2.5 (at threshold)", () => {
      const tms = { ...healthyTms, avgTransitDays: 2.5 };
      const alerts = getCrossAlerts(healthyWms, tms, healthyPlanning);
      expect(alerts.find((a) => a.id === "CA-001")).toBeUndefined();
    });

    it("escalates to critical when avgTransitDays > 3.2", () => {
      const tms = { ...healthyTms, avgTransitDays: 3.3 };
      const alerts = getCrossAlerts(healthyWms, tms, healthyPlanning);
      expect(alerts.find((a) => a.id === "CA-001")?.severity).toBe("critical");
    });

    it("message includes the actual avgTransitDays value", () => {
      const tms = { ...healthyTms, avgTransitDays: 2.8 };
      const alerts = getCrossAlerts(healthyWms, tms, healthyPlanning);
      expect(alerts.find((a) => a.id === "CA-001")?.message).toContain("2.8");
    });
  });

  describe("CA-002 — dock-to-stock backlog", () => {
    it("fires when dockToStock > 3.0", () => {
      const wms = { ...healthyWms, dockToStock: 3.1 };
      const alerts = getCrossAlerts(wms, healthyTms, healthyPlanning);
      const ca002 = alerts.find((a) => a.id === "CA-002");
      expect(ca002).toBeDefined();
      expect(ca002?.severity).toBe("high");
    });

    it("does NOT fire at exactly 3.0", () => {
      const wms = { ...healthyWms, dockToStock: 3.0 };
      const alerts = getCrossAlerts(wms, healthyTms, healthyPlanning);
      expect(alerts.find((a) => a.id === "CA-002")).toBeUndefined();
    });

    it("escalates to critical when dockToStock > 4.0", () => {
      const wms = { ...healthyWms, dockToStock: 4.1 };
      const alerts = getCrossAlerts(wms, healthyTms, healthyPlanning);
      expect(alerts.find((a) => a.id === "CA-002")?.severity).toBe("critical");
    });

    it("message includes actual dockToStock hours", () => {
      const wms = { ...healthyWms, dockToStock: 3.5 };
      const alerts = getCrossAlerts(wms, healthyTms, healthyPlanning);
      expect(alerts.find((a) => a.id === "CA-002")?.message).toContain("3.5");
    });
  });

  describe("CA-003 — tender acceptance below threshold", () => {
    it("fires when tenderAcceptance < 90", () => {
      const tms = { ...healthyTms, tenderAcceptance: 89 };
      const alerts = getCrossAlerts(healthyWms, tms, healthyPlanning);
      const ca003 = alerts.find((a) => a.id === "CA-003");
      expect(ca003).toBeDefined();
      expect(ca003?.severity).toBe("high");
    });

    it("does NOT fire at exactly 90", () => {
      const tms = { ...healthyTms, tenderAcceptance: 90 };
      const alerts = getCrossAlerts(healthyWms, tms, healthyPlanning);
      expect(alerts.find((a) => a.id === "CA-003")).toBeUndefined();
    });

    it("escalates to critical when tenderAcceptance < 85", () => {
      const tms = { ...healthyTms, tenderAcceptance: 84 };
      const alerts = getCrossAlerts(healthyWms, tms, healthyPlanning);
      expect(alerts.find((a) => a.id === "CA-003")?.severity).toBe("critical");
    });
  });

  describe("CA-004 — high stockout risk SKUs", () => {
    it("fires when stockoutRiskHigh > 5", () => {
      const planning = { ...healthyPlanning, stockoutRiskHigh: 6 };
      const alerts = getCrossAlerts(healthyWms, healthyTms, planning);
      const ca004 = alerts.find((a) => a.id === "CA-004");
      expect(ca004).toBeDefined();
      expect(ca004?.severity).toBe("medium");
    });

    it("does NOT fire when stockoutRiskHigh = 5", () => {
      const planning = { ...healthyPlanning, stockoutRiskHigh: 5 };
      const alerts = getCrossAlerts(healthyWms, healthyTms, planning);
      expect(alerts.find((a) => a.id === "CA-004")).toBeUndefined();
    });

    it("escalates to critical when stockoutRiskHigh > 10", () => {
      const planning = { ...healthyPlanning, stockoutRiskHigh: 11 };
      const alerts = getCrossAlerts(healthyWms, healthyTms, planning);
      expect(alerts.find((a) => a.id === "CA-004")?.severity).toBe("critical");
    });

    it("message includes the actual SKU count from data", () => {
      const planning = { ...healthyPlanning, stockoutRiskHigh: 14 };
      const alerts = getCrossAlerts(healthyWms, healthyTms, planning);
      expect(alerts.find((a) => a.id === "CA-004")?.message).toContain("14");
    });
  });

  describe("CA-005 — on-time dispatch below watch threshold", () => {
    it("fires when onTimeDispatch < 88", () => {
      const wms = { ...healthyWms, onTimeDispatch: 87 };
      const alerts = getCrossAlerts(wms, healthyTms, healthyPlanning);
      const ca005 = alerts.find((a) => a.id === "CA-005");
      expect(ca005).toBeDefined();
      expect(ca005?.severity).toBe("medium");
    });

    it("does NOT fire at exactly 88", () => {
      const wms = { ...healthyWms, onTimeDispatch: 88 };
      const alerts = getCrossAlerts(wms, healthyTms, healthyPlanning);
      expect(alerts.find((a) => a.id === "CA-005")).toBeUndefined();
    });

    it("escalates to high when onTimeDispatch < 84", () => {
      const wms = { ...healthyWms, onTimeDispatch: 83 };
      const alerts = getCrossAlerts(wms, healthyTms, healthyPlanning);
      expect(alerts.find((a) => a.id === "CA-005")?.severity).toBe("high");
    });
  });

  describe("CA-006 — demand variance too high", () => {
    it("fires when demandVariancePct > 5", () => {
      const planning = { ...healthyPlanning, demandVariancePct: 5.1 };
      const alerts = getCrossAlerts(healthyWms, healthyTms, planning);
      const ca006 = alerts.find((a) => a.id === "CA-006");
      expect(ca006).toBeDefined();
      expect(ca006?.severity).toBe("medium");
    });

    it("does NOT fire at exactly 5", () => {
      const planning = { ...healthyPlanning, demandVariancePct: 5.0 };
      const alerts = getCrossAlerts(healthyWms, healthyTms, planning);
      expect(alerts.find((a) => a.id === "CA-006")).toBeUndefined();
    });

    it("message includes actual variance from data", () => {
      const planning = { ...healthyPlanning, demandVariancePct: 7.3 };
      const alerts = getCrossAlerts(healthyWms, healthyTms, planning);
      expect(alerts.find((a) => a.id === "CA-006")?.message).toContain("7.3");
    });
  });

  it("can fire multiple alerts simultaneously", () => {
    const badWms = { ...healthyWms, dockToStock: 3.5, onTimeDispatch: 82 };
    const badTms = { ...healthyTms, avgTransitDays: 3.0, tenderAcceptance: 87 };
    const badPlanning = { ...healthyPlanning, stockoutRiskHigh: 12, demandVariancePct: 6.5 };
    const alerts = getCrossAlerts(badWms, badTms, badPlanning);
    expect(alerts.length).toBeGreaterThanOrEqual(5);
  });
});

// ─────────────────────────────────────────────────────────────────
// getCrossKpis — composite KPI calculations
// ─────────────────────────────────────────────────────────────────
describe("getCrossKpis", () => {
  const kpis = getCrossKpis(healthyWms, healthyTms, healthyPlanning);

  it("perfectOrderRate = OTD × fillRate × onTimeDispatch (compound probability)", () => {
    const expected = parseFloat(
      ((94 / 100) * (96 / 100) * (93 / 100) * 100).toFixed(1)
    );
    expect(kpis.perfectOrderRate).toBeCloseTo(expected, 1);
  });

  it("perfectOrderRate is between 0 and 100", () => {
    expect(kpis.perfectOrderRate).toBeGreaterThan(0);
    expect(kpis.perfectOrderRate).toBeLessThanOrEqual(100);
  });

  it("supplychainCycleTime includes transit + dock-to-stock + order cycle", () => {
    // = avgTransitDays * 24 * 2 + dockToStock + 6h order cycle
    const expected = parseFloat((2.0 * 24 + 2.5 + 6.0 + 2.0 * 24).toFixed(1));
    expect(kpis.supplychainCycleTime).toBeCloseTo(expected, 1);
  });

  it("supplychainCycleTime is positive", () => {
    expect(kpis.supplychainCycleTime).toBeGreaterThan(0);
  });

  it("inboundFulfillmentGap = (highRiskSkus / totalSkus) * 100", () => {
    const expected = parseFloat(((3 / 90) * 100).toFixed(1));
    expect(kpis.inboundFulfillmentGap).toBeCloseTo(expected, 1);
  });

  it("inboundFulfillmentGap is 0 when no high-risk SKUs", () => {
    const p = { ...healthyPlanning, stockoutRiskHigh: 0 };
    const result = getCrossKpis(healthyWms, healthyTms, p);
    expect(result.inboundFulfillmentGap).toBe(0);
  });

  it("carrierToShelfDays = avgTransitDays + dockToStock hours as fraction of day", () => {
    const expected = parseFloat((2.0 + 2.5 / 24).toFixed(2));
    expect(kpis.carrierToShelfDays).toBeCloseTo(expected, 2);
  });

  it("supplyChainReliability is a weighted score between 0 and 100", () => {
    expect(kpis.supplyChainReliability).toBeGreaterThan(0);
    expect(kpis.supplyChainReliability).toBeLessThanOrEqual(100);
  });

  it("supplyChainReliability weights sum correctly (spot check)", () => {
    // weights: OTD 30%, fillRate 25%, onTimeDispatch 25%, receivingAccuracy 10%, tenderAcceptance 10%
    const expected = parseFloat(
      (94 * 0.30 + 96 * 0.25 + 93 * 0.25 + 97 * 0.10 + 95 * 0.10).toFixed(1)
    );
    expect(kpis.supplyChainReliability).toBeCloseTo(expected, 1);
  });
});

// ─────────────────────────────────────────────────────────────────
// Hardcoded KPI lookups
// ─────────────────────────────────────────────────────────────────
describe("getWmsKpis", () => {
  it("returns All warehouse KPIs by default", () => {
    const k = getWmsKpis();
    expect(k.onTimeDispatch).toBe(88.4);
    expect(k.orderFillRate).toBe(93.1);
  });

  it("returns warehouse-specific values for DEL, MUM, BLR", () => {
    expect(getWmsKpis("DEL").onTimeDispatch).toBe(86.2);
    expect(getWmsKpis("MUM").onTimeDispatch).toBe(90.1);
    expect(getWmsKpis("BLR").onTimeDispatch).toBe(89.0);
  });

  it("falls back to All for unknown warehouse", () => {
    const fallback = getWmsKpis("XYZ");
    const all = getWmsKpis("All");
    expect(fallback).toEqual(all);
  });
});

describe("getTmsKpis", () => {
  it("returns All warehouse KPIs by default", () => {
    const k = getTmsKpis();
    expect(k.onTimeDelivery).toBe(89.8);
    expect(k.delayRate).toBe(10.2);
  });

  it("MUM has lower cost per shipment than DEL", () => {
    expect(getTmsKpis("MUM").costPerShipment).toBeLessThan(getTmsKpis("DEL").costPerShipment);
  });

  it("falls back to All for unknown warehouse", () => {
    expect(getTmsKpis("ZZZ")).toEqual(getTmsKpis("All"));
  });
});

describe("getPlanningKpis", () => {
  it("returns All warehouse KPIs by default", () => {
    const k = getPlanningKpis();
    expect(k.totalSkus).toBe(90);
    expect(k.stockoutRiskHigh).toBe(14);
  });

  it("per-warehouse SKU count adds up to total", () => {
    const del = getPlanningKpis("DEL").totalSkus;
    const mum = getPlanningKpis("MUM").totalSkus;
    const blr = getPlanningKpis("BLR").totalSkus;
    expect(del + mum + blr).toBe(getPlanningKpis("All").totalSkus);
  });

  it("falls back to All for unknown warehouse", () => {
    expect(getPlanningKpis("Unknown")).toEqual(getPlanningKpis("All"));
  });
});
