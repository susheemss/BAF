/**
 * Chart data for the Operational Dashboard (Power BI style).
 * All values derived from TMS.csv patterns and planning_demand_supply.csv averages.
 */

export const OPS_MONTHS = ["Sep 24", "Oct 24", "Nov 24", "Dec 24", "Jan 25", "Feb 25"];

// ── Carrier Performance ────────────────────────────────────────────────────────

export type CarrierPerf = {
  carrier: string;
  onTime: number;
  delayRate: number;
  avgCost: number;
  shipments: number;
  avgTransit: number;
};

export function getCarrierPerformance(): CarrierPerf[] {
  return [
    { carrier: "Blue Dart",  onTime: 91.2, delayRate: 8.8,  avgCost: 2840, shipments: 412, avgTransit: 2.3 },
    { carrier: "Delhivery", onTime: 87.4, delayRate: 12.6, avgCost: 3120, shipments: 387, avgTransit: 2.8 },
    { carrier: "DTDC",      onTime: 84.1, delayRate: 15.9, avgCost: 2960, shipments: 298, avgTransit: 3.1 },
    { carrier: "Ekart",     onTime: 89.6, delayRate: 10.4, avgCost: 3050, shipments: 321, avgTransit: 2.6 },
    { carrier: "Shadowfax", onTime: 93.2, delayRate: 6.8,  avgCost: 2780, shipments: 256, avgTransit: 2.1 },
    { carrier: "XpressBees",onTime: 85.8, delayRate: 14.2, avgCost: 3210, shipments: 189, avgTransit: 3.3 },
  ];
}

export type CarrierMonthly = { month: string; onTime: number; shipments: number };

export function getCarrierMonthly(carrier: string): CarrierMonthly[] {
  const data: Record<string, CarrierMonthly[]> = {
    "Blue Dart": [
      { month: "Sep 24", onTime: 88.1, shipments: 62 },
      { month: "Oct 24", onTime: 86.4, shipments: 68 },
      { month: "Nov 24", onTime: 84.9, shipments: 71 },
      { month: "Dec 24", onTime: 89.2, shipments: 74 },
      { month: "Jan 25", onTime: 91.8, shipments: 68 },
      { month: "Feb 25", onTime: 94.1, shipments: 69 },
    ],
    "Delhivery": [
      { month: "Sep 24", onTime: 85.0, shipments: 58 },
      { month: "Oct 24", onTime: 83.2, shipments: 65 },
      { month: "Nov 24", onTime: 82.1, shipments: 70 },
      { month: "Dec 24", onTime: 87.4, shipments: 72 },
      { month: "Jan 25", onTime: 89.6, shipments: 66 },
      { month: "Feb 25", onTime: 91.0, shipments: 56 },
    ],
    "DTDC": [
      { month: "Sep 24", onTime: 80.2, shipments: 44 },
      { month: "Oct 24", onTime: 79.4, shipments: 51 },
      { month: "Nov 24", onTime: 78.8, shipments: 55 },
      { month: "Dec 24", onTime: 83.6, shipments: 54 },
      { month: "Jan 25", onTime: 86.4, shipments: 48 },
      { month: "Feb 25", onTime: 88.0, shipments: 46 },
    ],
    "Ekart": [
      { month: "Sep 24", onTime: 86.4, shipments: 50 },
      { month: "Oct 24", onTime: 85.0, shipments: 54 },
      { month: "Nov 24", onTime: 84.2, shipments: 58 },
      { month: "Dec 24", onTime: 88.8, shipments: 57 },
      { month: "Jan 25", onTime: 91.4, shipments: 52 },
      { month: "Feb 25", onTime: 92.6, shipments: 50 },
    ],
    "Shadowfax": [
      { month: "Sep 24", onTime: 91.0, shipments: 38 },
      { month: "Oct 24", onTime: 89.5, shipments: 42 },
      { month: "Nov 24", onTime: 88.2, shipments: 45 },
      { month: "Dec 24", onTime: 91.8, shipments: 44 },
      { month: "Jan 25", onTime: 94.2, shipments: 43 },
      { month: "Feb 25", onTime: 96.1, shipments: 44 },
    ],
    "XpressBees": [
      { month: "Sep 24", onTime: 82.4, shipments: 28 },
      { month: "Oct 24", onTime: 80.8, shipments: 32 },
      { month: "Nov 24", onTime: 79.6, shipments: 35 },
      { month: "Dec 24", onTime: 84.2, shipments: 34 },
      { month: "Jan 25", onTime: 87.0, shipments: 32 },
      { month: "Feb 25", onTime: 89.2, shipments: 28 },
    ],
  };
  return data[carrier] ?? [
    { month: "Sep 24", onTime: 82.0, shipments: 30 },
    { month: "Oct 24", onTime: 80.5, shipments: 33 },
    { month: "Nov 24", onTime: 79.2, shipments: 35 },
    { month: "Dec 24", onTime: 83.4, shipments: 34 },
    { month: "Jan 25", onTime: 86.1, shipments: 32 },
    { month: "Feb 25", onTime: 88.6, shipments: 31 },
  ];
}

// ── Delay by Transport Mode ────────────────────────────────────────────────────

export type DelayByMode = {
  mode: string;
  delayed: number;
  onTime: number;
  inTransit: number;
};

export function getDelayByMode(): DelayByMode[] {
  return [
    { mode: "Truck",  delayed: 142, onTime: 834, inTransit: 45 },
    { mode: "Air",    delayed: 18,  onTime: 289, inTransit: 12 },
    { mode: "Rail",   delayed: 34,  onTime: 198, inTransit: 8  },
    { mode: "Sea",    delayed: 9,   onTime: 87,  inTransit: 4  },
  ];
}

export type ModeRoute = {
  route: string;
  delays: number;
  avgTransit: number;
  cost: number;
};

export function getModeRoutes(mode: string): ModeRoute[] {
  const data: Record<string, ModeRoute[]> = {
    "Truck": [
      { route: "DEL → MUM", delays: 38, avgTransit: 3.2, cost: 3450 },
      { route: "DEL → BLR", delays: 31, avgTransit: 3.5, cost: 3820 },
      { route: "MUM → BLR", delays: 24, avgTransit: 2.8, cost: 2980 },
      { route: "MUM → DEL", delays: 29, avgTransit: 3.0, cost: 3210 },
      { route: "BLR → DEL", delays: 12, avgTransit: 3.4, cost: 3640 },
      { route: "BLR → MUM", delays: 8,  avgTransit: 2.6, cost: 2870 },
    ],
    "Air": [
      { route: "DEL → MUM", delays: 5,  avgTransit: 0.8, cost: 7800 },
      { route: "DEL → BLR", delays: 4,  avgTransit: 0.9, cost: 8200 },
      { route: "MUM → DEL", delays: 6,  avgTransit: 0.7, cost: 7600 },
      { route: "BLR → MUM", delays: 3,  avgTransit: 0.8, cost: 7400 },
    ],
    "Rail": [
      { route: "DEL → MUM", delays: 12, avgTransit: 2.0, cost: 1820 },
      { route: "DEL → BLR", delays: 14, avgTransit: 2.4, cost: 2100 },
      { route: "MUM → BLR", delays: 8,  avgTransit: 1.8, cost: 1640 },
    ],
    "Sea": [
      { route: "MUM → JNPT", delays: 4, avgTransit: 1.5, cost: 1280 },
      { route: "DEL → JNPT", delays: 5, avgTransit: 2.0, cost: 1560 },
    ],
  };
  return data[mode] ?? [];
}

// ── Demand vs Supply by Category ──────────────────────────────────────────────

export type DemandSupply = {
  category: string;
  demandPlan: number;
  actualDemand: number;
  supplyAvail: number;
  gap: number;
};

export function getDemandSupplyByCategory(warehouse = "All"): DemandSupply[] {
  const m = warehouse === "All" ? 1 : warehouse === "DEL" ? 0.37 : warehouse === "MUM" ? 0.35 : 0.28;
  return [
    { category: "Personal Care",    demandPlan: 124800, actualDemand: 131200, supplyAvail: 119400, gap: 11800 },
    { category: "Food & Beverages", demandPlan: 98400,  actualDemand: 105600, supplyAvail: 97200,  gap: 8400  },
    { category: "Household",        demandPlan: 76200,  actualDemand: 79400,  supplyAvail: 75800,  gap: 3600  },
  ].map(r => ({
    ...r,
    demandPlan:   Math.round(r.demandPlan * m),
    actualDemand: Math.round(r.actualDemand * m),
    supplyAvail:  Math.round(r.supplyAvail * m),
    gap:          Math.round(r.gap * m),
  }));
}

export type CategorySku = {
  sku: string;
  demand: number;
  stock: number;
  risk: "High" | "Medium" | "Low";
  daysOfCover: number;
};

export function getCategorySkus(category: string): CategorySku[] {
  const data: Record<string, CategorySku[]> = {
    "Personal Care": [
      { sku: "Shampoo 400ml",      demand: 13800, stock: 8200,  risk: "High",   daysOfCover: 8.9  },
      { sku: "Conditioner 200ml",  demand: 10400, stock: 7600,  risk: "High",   daysOfCover: 11.0 },
      { sku: "Face Wash 100ml",    demand: 15100, stock: 13800, risk: "Medium", daysOfCover: 13.7 },
      { sku: "Moisturizer 50ml",   demand: 8900,  stock: 9200,  risk: "Low",    daysOfCover: 23.4 },
      { sku: "Sunscreen SPF50",    demand: 12400, stock: 8900,  risk: "High",   daysOfCover: 10.2 },
    ],
    "Food & Beverages": [
      { sku: "Biscuits 500g",      demand: 19800, stock: 16200, risk: "High",   daysOfCover: 12.3 },
      { sku: "Instant Noodles",    demand: 15400, stock: 13800, risk: "Medium", daysOfCover: 15.1 },
      { sku: "Juice 1L",           demand: 10200, stock: 9600,  risk: "Low",    daysOfCover: 19.2 },
      { sku: "Coffee 200g",        demand: 8100,  stock: 6800,  risk: "High",   daysOfCover: 11.9 },
    ],
    "Household": [
      { sku: "Detergent 1kg",      demand: 17200, stock: 15400, risk: "Medium", daysOfCover: 16.0 },
      { sku: "Floor Cleaner 500ml",demand: 12800, stock: 13200, risk: "Low",    daysOfCover: 21.8 },
      { sku: "Dish Soap 500ml",    demand: 10200, stock: 8900,  risk: "Medium", daysOfCover: 14.7 },
    ],
  };
  return data[category] ?? [];
}

// ── Inventory Risk by Warehouse ────────────────────────────────────────────────

export type InventoryRisk = {
  warehouse: string;
  high: number;
  medium: number;
  low: number;
};

export function getInventoryRisk(): InventoryRisk[] {
  return [
    { warehouse: "DEL", high: 5,  medium: 8,  low: 17 },
    { warehouse: "MUM", high: 4,  medium: 6,  low: 20 },
    { warehouse: "BLR", high: 5,  medium: 7,  low: 18 },
  ];
}

export type WarehouseSkuRisk = { sku: string; category: string; daysOfCover: number; risk: "High" | "Medium" | "Low" };

export function getWarehouseHighRiskSkus(warehouse: string): WarehouseSkuRisk[] {
  const data: Record<string, WarehouseSkuRisk[]> = {
    "DEL": [
      { sku: "Shampoo 400ml",   category: "Personal Care",    daysOfCover: 7.2,  risk: "High"   },
      { sku: "Sunscreen SPF50", category: "Personal Care",    daysOfCover: 8.8,  risk: "High"   },
      { sku: "Biscuits 500g",   category: "Food & Beverages", daysOfCover: 10.4, risk: "High"   },
      { sku: "Coffee 200g",     category: "Food & Beverages", daysOfCover: 9.6,  risk: "High"   },
      { sku: "Dish Soap 500ml", category: "Household",        daysOfCover: 12.1, risk: "High"   },
    ],
    "MUM": [
      { sku: "Conditioner 200ml",category: "Personal Care",   daysOfCover: 9.4,  risk: "High"   },
      { sku: "Biscuits 500g",    category: "Food & Beverages",daysOfCover: 11.2, risk: "High"   },
      { sku: "Coffee 200g",      category: "Food & Beverages",daysOfCover: 10.8, risk: "High"   },
      { sku: "Detergent 1kg",    category: "Household",       daysOfCover: 14.2, risk: "Medium" },
    ],
    "BLR": [
      { sku: "Shampoo 400ml",   category: "Personal Care",    daysOfCover: 8.1,  risk: "High"   },
      { sku: "Face Wash 100ml", category: "Personal Care",    daysOfCover: 11.4, risk: "High"   },
      { sku: "Biscuits 500g",   category: "Food & Beverages", daysOfCover: 12.8, risk: "High"   },
      { sku: "Dish Soap 500ml", category: "Household",        daysOfCover: 13.2, risk: "Medium" },
      { sku: "Detergent 1kg",   category: "Household",        daysOfCover: 13.8, risk: "Medium" },
    ],
  };
  return data[warehouse] ?? [];
}

// ── Shipment Cost by Route ─────────────────────────────────────────────────────

export type RouteCost = {
  route: string;
  avgCost: number;
  shipments: number;
  delayRate: number;
  distanceKm: number;
};

export function getCostByRoute(): RouteCost[] {
  return [
    { route: "DEL→MUM", avgCost: 3820, shipments: 284, delayRate: 14.8, distanceKm: 1400 },
    { route: "DEL→BLR", avgCost: 4120, shipments: 198, delayRate: 17.2, distanceKm: 2000 },
    { route: "MUM→BLR", avgCost: 2980, shipments: 156, delayRate: 11.5, distanceKm: 980  },
    { route: "MUM→DEL", avgCost: 3640, shipments: 201, delayRate: 13.4, distanceKm: 1400 },
    { route: "BLR→DEL", avgCost: 4280, shipments: 142, delayRate: 18.3, distanceKm: 2000 },
    { route: "BLR→MUM", avgCost: 2840, shipments: 118, delayRate: 10.2, distanceKm: 980  },
    { route: "DEL→HYD", avgCost: 3420, shipments: 89,  delayRate: 12.4, distanceKm: 1580 },
    { route: "MUM→HYD", avgCost: 2680, shipments: 76,  delayRate: 9.8,  distanceKm: 720  },
  ];
}

export type RouteCarrier = {
  carrier: string;
  shipments: number;
  onTime: number;
  avgCost: number;
};

export function getRouteCarriers(route: string): RouteCarrier[] {
  const data: Record<string, RouteCarrier[]> = {
    "DEL→MUM": [
      { carrier: "Blue Dart",  shipments: 98,  onTime: 91.8, avgCost: 3640 },
      { carrier: "Delhivery", shipments: 82,  onTime: 86.6, avgCost: 3920 },
      { carrier: "DTDC",      shipments: 68,  onTime: 82.4, avgCost: 3840 },
      { carrier: "Ekart",     shipments: 36,  onTime: 88.9, avgCost: 3760 },
    ],
    "DEL→BLR": [
      { carrier: "Blue Dart",  shipments: 74,  onTime: 89.2, avgCost: 3980 },
      { carrier: "Delhivery", shipments: 62,  onTime: 84.0, avgCost: 4280 },
      { carrier: "XpressBees",shipments: 38,  onTime: 81.6, avgCost: 4420 },
      { carrier: "Ekart",     shipments: 24,  onTime: 87.5, avgCost: 4080 },
    ],
    "MUM→BLR": [
      { carrier: "Shadowfax", shipments: 64,  onTime: 94.1, avgCost: 2780 },
      { carrier: "Blue Dart", shipments: 48,  onTime: 91.7, avgCost: 3020 },
      { carrier: "Delhivery", shipments: 44,  onTime: 85.2, avgCost: 3180 },
    ],
    "BLR→DEL": [
      { carrier: "Blue Dart",  shipments: 56,  onTime: 88.2, avgCost: 4120 },
      { carrier: "Delhivery", shipments: 48,  onTime: 83.4, avgCost: 4380 },
      { carrier: "DTDC",      shipments: 38,  onTime: 80.8, avgCost: 4240 },
    ],
  };
  return data[route] ?? [
    { carrier: "Blue Dart",  shipments: 42, onTime: 90.5, avgCost: 3200 },
    { carrier: "Delhivery", shipments: 38, onTime: 85.8, avgCost: 3400 },
    { carrier: "DTDC",      shipments: 28, onTime: 83.1, avgCost: 3280 },
  ];
}

// ── Monthly trend warehouse breakdown ─────────────────────────────────────────

export type MonthWarehouseBreak = {
  warehouse: string;
  wms: number;
  tms: number;
  planning: number;
};

export function getMonthBreakdown(month: string): MonthWarehouseBreak[] {
  const data: Record<string, MonthWarehouseBreak[]> = {
    "Sep 24": [
      { warehouse: "DEL", wms: 85.2, tms: 86.4, planning: 80.1 },
      { warehouse: "MUM", wms: 89.1, tms: 89.8, planning: 84.2 },
      { warehouse: "BLR", wms: 87.2, tms: 88.0, planning: 81.6 },
    ],
    "Oct 24": [
      { warehouse: "DEL", wms: 83.4, tms: 84.2, planning: 76.8 },
      { warehouse: "MUM", wms: 87.2, tms: 88.1, planning: 80.6 },
      { warehouse: "BLR", wms: 85.6, tms: 86.4, planning: 78.2 },
    ],
    "Nov 24": [
      { warehouse: "DEL", wms: 81.2, tms: 82.4, planning: 73.4 },
      { warehouse: "MUM", wms: 84.8, tms: 85.6, planning: 77.1 },
      { warehouse: "BLR", wms: 83.4, tms: 84.2, planning: 75.2 },
    ],
    "Dec 24": [
      { warehouse: "DEL", wms: 82.8, tms: 83.8, planning: 75.6 },
      { warehouse: "MUM", wms: 86.4, tms: 87.2, planning: 79.0 },
      { warehouse: "BLR", wms: 85.2, tms: 85.8, planning: 77.6 },
    ],
    "Jan 25": [
      { warehouse: "DEL", wms: 87.2, tms: 88.2, planning: 81.4 },
      { warehouse: "MUM", wms: 90.4, tms: 90.8, planning: 84.8 },
      { warehouse: "BLR", wms: 88.8, tms: 89.2, planning: 83.0 },
    ],
    "Feb 25": [
      { warehouse: "DEL", wms: 88.1, tms: 89.2, planning: 83.4 },
      { warehouse: "MUM", wms: 92.4, tms: 93.1, planning: 88.2 },
      { warehouse: "BLR", wms: 90.2, tms: 90.7, planning: 85.1 },
    ],
  };
  return data[month] ?? [
    { warehouse: "DEL", wms: 86.2, tms: 88.3, planning: 81.0 },
    { warehouse: "MUM", wms: 90.1, tms: 91.2, planning: 85.5 },
    { warehouse: "BLR", wms: 89.0, tms: 90.0, planning: 83.8 },
  ];
}
