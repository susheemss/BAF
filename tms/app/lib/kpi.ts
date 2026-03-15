import { differenceInDays, format, parseISO } from "date-fns";
import { FilterState, ShipmentRecord } from "../stores";

export const KPI_THRESHOLDS = {
  onTimeRate: { green: 92, yellow: 85 },
  carrierOnTimeRate: { green: 92, yellow: 85 },
  delayRate: { green: 5, yellow: 10 },
  costPerShipment: { green: 1800, yellow: 2300 },
  costPerMile: { green: 1.6, yellow: 2.2 },
  transitVariance: { green: 1.5, yellow: 3.0 },
  tenderAcceptance: { green: 90, yellow: 80 }
};

export type KPISet = {
  onTimeRate: number;
  averageTransitTime: number;
  transitTimeVariance: number;
  averageDelayDays: number;
  delayRate: number;
  costPerShipment: number;
  costPerKm: number;
  costPerMile: number;
  costPerKg: number;
  weightUtilization: number;
  volumeUtilization: number;
  carrierOnTimeRate: number;
  tenderAcceptanceRate: number;
  totalCo2Kg: number;
  co2PerShipment: number;
  co2PerTonKm: number;
  totalShipments: number;
  totalWeightKg: number;
};

function safeParse(value?: string) {
  if (!value) {
    return new Date(0);
  }
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(0);
  }
  return parsed;
}

function normalizedStatus(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

function emissionFactor(mode?: string) {
  const normalized = (mode ?? "").toLowerCase();
  if (normalized.includes("air")) {
    return 0.6;
  }
  if (normalized.includes("rail")) {
    return 0.02;
  }
  if (
    normalized.includes("ocean") ||
    normalized.includes("sea") ||
    normalized.includes("ship")
  ) {
    return 0.01;
  }
  return 0.12;
}

export function filterShipments(shipments: ShipmentRecord[], filters: FilterState) {
  return shipments.filter((record) => {
    if (filters.carrier !== "All" && record.carrierName !== filters.carrier) {
      return false;
    }
    if (filters.mode !== "All" && record.modeOfTransport !== filters.mode) {
      return false;
    }
    if (
      filters.productType !== "All" &&
      record.productType !== filters.productType
    ) {
      return false;
    }
    if (
      filters.originRegion !== "All" &&
      record.originRegion !== filters.originRegion
    ) {
      return false;
    }
    if (
      filters.originCountry !== "All" &&
      record.originCountry !== filters.originCountry
    ) {
      return false;
    }
    if (
      filters.originState !== "All" &&
      record.originState !== filters.originState
    ) {
      return false;
    }
    if (
      filters.originCity !== "All" &&
      record.originCity !== filters.originCity
    ) {
      return false;
    }
    if (
      filters.destinationRegion !== "All" &&
      record.destinationRegion !== filters.destinationRegion
    ) {
      return false;
    }
    if (
      filters.destinationCountry !== "All" &&
      record.destinationCountry !== filters.destinationCountry
    ) {
      return false;
    }
    if (
      filters.destinationState !== "All" &&
      record.destinationState !== filters.destinationState
    ) {
      return false;
    }
    if (
      filters.destinationCity !== "All" &&
      record.destinationCity !== filters.destinationCity
    ) {
      return false;
    }
    if (filters.route !== "All" && record.route !== filters.route) {
      return false;
    }
    if (
      filters.status !== "All" &&
      normalizedStatus(record.onTimeStatus) !==
        normalizedStatus(filters.status)
    ) {
      return false;
    }
    if (
      filters.orderType !== "All" &&
      record.shipmentOrderType !== filters.orderType
    ) {
      return false;
    }
    if (filters.startDate) {
      const dispatch = safeParse(record.date);
      if (dispatch < safeParse(filters.startDate)) {
        return false;
      }
    }
    if (filters.endDate) {
      const dispatch = safeParse(record.date);
      if (dispatch > safeParse(filters.endDate)) {
        return false;
      }
    }
    return true;
  });
}

export function computeKPIs(records: ShipmentRecord[]): KPISet {
  const totalShipments = records.length;
  if (totalShipments === 0) {
    return {
      onTimeRate: 0,
      averageTransitTime: 0,
      transitTimeVariance: 0,
      averageDelayDays: 0,
      delayRate: 0,
      costPerShipment: 0,
      costPerKm: 0,
      costPerMile: 0,
      costPerKg: 0,
      weightUtilization: 0,
      volumeUtilization: 0,
      carrierOnTimeRate: 0,
      tenderAcceptanceRate: 0,
      totalCo2Kg: 0,
      co2PerShipment: 0,
      co2PerTonKm: 0,
      totalShipments: 0,
      totalWeightKg: 0
    };
  }

  let onTime = 0;
  let delayed = 0;
  let totalTransitDays = 0;
  let totalTransitDaysSquared = 0;
  let totalDelayDays = 0;
  let totalCost = 0;
  let totalDistance = 0;
  let totalWeight = 0;
  let totalTonKm = 0;
  let totalCo2 = 0;
  let weightUtilSum = 0;
  let weightUtilCount = 0;
  let volumeUtilSum = 0;
  let volumeUtilCount = 0;
  let tenderAccepted = 0;

  records.forEach((record) => {
    const actual = safeParse(record.actualDeliveryDate);
    const estimated = safeParse(record.estimatedDeliveryDate);
    const status = normalizedStatus(record.onTimeStatus);

    const isInTransit = status.includes("in-transit");
    const isDelayed =
      status.includes("delayed") ||
      record.delays > 0 ||
      actual > estimated;
    const isOnTime = status.includes("on-time") || (!isDelayed && !isInTransit);

    if (isOnTime) {
      onTime += 1;
    }
    if (isDelayed) {
      delayed += 1;
    }

    const transitDays = record.transitTimeDays
      ? record.transitTimeDays
      : Math.max(0, differenceInDays(actual, safeParse(record.date)));
    totalTransitDays += transitDays;
    totalTransitDaysSquared += transitDays * transitDays;
    totalDelayDays += Math.max(0, record.delays);

    totalCost += record.shipmentCostUsd;
    totalDistance += record.distanceKm;
    totalWeight += record.totalWeightKg;
    const tonKm = (record.totalWeightKg / 1000) * record.distanceKm;
    const co2 = tonKm * emissionFactor(record.modeOfTransport);
    totalTonKm += tonKm;
    totalCo2 += co2;

    if (record.equipmentWeightCapacityKg > 0) {
      weightUtilSum +=
        (record.totalWeightKg / record.equipmentWeightCapacityKg) * 100;
      weightUtilCount += 1;
    }
    if (record.equipmentVolumeCapacityM3 > 0) {
      volumeUtilSum +=
        (record.totalVolumeShipmentM3 / record.equipmentVolumeCapacityM3) * 100;
      volumeUtilCount += 1;
    }

    if (normalizedStatus(record.tenderedStatus) === "accepted") {
      tenderAccepted += 1;
    }
  });

  const averageTransitTime = totalTransitDays / totalShipments;
  const variance =
    totalShipments > 0
      ? totalTransitDaysSquared / totalShipments - averageTransitTime ** 2
      : 0;
  const carriers = Array.from(
    new Set(records.map((record) => record.carrierName))
  );
  const carrierOnTime =
    carriers.length > 0
      ? carriers.reduce((sum, carrier) => {
          const carrierRecords = records.filter(
            (record) => record.carrierName === carrier
          );
          const carrierOnTimeCount = carrierRecords.filter((record) => {
            const status = normalizedStatus(record.onTimeStatus);
            return status.includes("on-time");
          }).length;
          return sum + (carrierOnTimeCount / carrierRecords.length) * 100;
        }, 0) / carriers.length
      : 0;

  return {
    onTimeRate: (onTime / totalShipments) * 100,
    averageTransitTime,
    transitTimeVariance: Math.max(0, variance),
    averageDelayDays: totalDelayDays / totalShipments,
    delayRate: (delayed / totalShipments) * 100,
    costPerShipment: totalCost / totalShipments,
    costPerKm: totalDistance ? totalCost / totalDistance : 0,
    costPerMile: totalDistance
      ? totalCost / (totalDistance * 0.621371)
      : 0,
    costPerKg: totalWeight ? totalCost / totalWeight : 0,
    weightUtilization: weightUtilCount
      ? weightUtilSum / weightUtilCount
      : 0,
    volumeUtilization: volumeUtilCount
      ? volumeUtilSum / volumeUtilCount
      : 0,
    carrierOnTimeRate: carrierOnTime,
    tenderAcceptanceRate: (tenderAccepted / totalShipments) * 100,
    totalCo2Kg: totalCo2,
    co2PerShipment: totalCo2 / totalShipments,
    co2PerTonKm: totalTonKm ? totalCo2 / totalTonKm : 0,
    totalShipments,
    totalWeightKg: totalWeight
  };
}

export function kpiStatus(
  kpi:
    | "onTimeRate"
    | "carrierOnTimeRate"
    | "delayRate"
    | "costPerShipment"
    | "costPerMile"
    | "transitVariance"
    | "tenderAcceptance",
  value: number
) {
  const thresholds = KPI_THRESHOLDS[kpi];
  const lowerIsBetter =
    kpi === "delayRate" || kpi === "costPerShipment" || kpi === "costPerMile" || kpi === "transitVariance";
  if (lowerIsBetter) {
    if (value <= thresholds.green) {
      return "green";
    }
    if (value <= thresholds.yellow) {
      return "yellow";
    }
    return "red";
  }
  if (value >= thresholds.green) {
    return "green";
  }
  if (value >= thresholds.yellow) {
    return "yellow";
  }
  return "red";
}

export function buildOnTimeTrend(records: ShipmentRecord[]) {
  const byMonth: Record<string, ShipmentRecord[]> = {};
  records.forEach((record) => {
    const label = format(safeParse(record.date), "yyyy-MM");
    if (!byMonth[label]) {
      byMonth[label] = [];
    }
    byMonth[label].push(record);
  });

  return Object.entries(byMonth)
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([label, group]) => {
      const kpis = computeKPIs(group);
      return { label, value: kpis.onTimeRate };
    });
}

export function buildCarrierOnTime(records: ShipmentRecord[]) {
  const byCarrier: Record<string, ShipmentRecord[]> = {};
  records.forEach((record) => {
    const key = record.carrierName || "Unknown";
    if (!byCarrier[key]) {
      byCarrier[key] = [];
    }
    byCarrier[key].push(record);
  });
  return Object.entries(byCarrier)
    .map(([label, group]) => ({ label, value: computeKPIs(group).onTimeRate }))
    .sort((a, b) => b.value - a.value);
}

export function buildRouteDelay(records: ShipmentRecord[]) {
  const byRoute: Record<string, ShipmentRecord[]> = {};
  records.forEach((record) => {
    const key = record.route || "Unknown";
    if (!byRoute[key]) {
      byRoute[key] = [];
    }
    byRoute[key].push(record);
  });
  return Object.entries(byRoute)
    .map(([label, group]) => ({
      label,
      value: computeKPIs(group).delayRate
    }))
    .sort((a, b) => b.value - a.value);
}

export function buildRouteCost(records: ShipmentRecord[]) {
  const byRoute: Record<string, ShipmentRecord[]> = {};
  records.forEach((record) => {
    const key = record.route || "Unknown";
    if (!byRoute[key]) {
      byRoute[key] = [];
    }
    byRoute[key].push(record);
  });
  return Object.entries(byRoute)
    .map(([label, group]) => ({
      label,
      value:
        group.reduce((sum, item) => sum + item.shipmentCostUsd, 0) /
        Math.max(group.length, 1)
    }))
    .sort((a, b) => b.value - a.value);
}

export function buildCarrierDelay(records: ShipmentRecord[]) {
  const byCarrier: Record<string, ShipmentRecord[]> = {};
  records.forEach((record) => {
    const key = record.carrierName || "Unknown";
    if (!byCarrier[key]) {
      byCarrier[key] = [];
    }
    byCarrier[key].push(record);
  });
  return Object.entries(byCarrier)
    .map(([label, group]) => ({
      label,
      value:
        (group.filter((record) =>
          normalizedStatus(record.onTimeStatus).includes("delayed")
        ).length /
          Math.max(group.length, 1)) *
        100
    }))
    .sort((a, b) => b.value - a.value);
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function formatNumber(value: number) {
  return value.toFixed(1);
}
