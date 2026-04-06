import { ShipmentRecord } from "@/lib/tms/stores";
import { DrilldownData } from "@/components/tms/DrilldownModal";

function ns(v?: string) {
  return (v ?? "").trim().toLowerCase();
}

export function getDrilldown(
  kpi: string,
  shipments: ShipmentRecord[],
  kpiValue?: string,
  kpiStatus?: "green" | "yellow" | "red"
): DrilldownData {
  const top = <T,>(arr: T[], n = 5) => arr.slice(0, n);
  const fmt = (n: number, dec = 2) => parseFloat(n.toFixed(dec));

  switch (kpi) {
    // ── On-Time Delivery Rate ────────────────────────────────────────────────
    case "On-Time Delivery Rate": {
      const delayed = shipments
        .filter((s) => ns(s.onTimeStatus).includes("delayed"))
        .sort((a, b) => b.transitTimeDays - a.transitTimeDays);
      return {
        kpi: "Most Delayed Shipments",
        kpiValue,
        kpiStatus,
        subtitle: `${delayed.length} delayed shipments in filtered data — top 5 by transit time`,
        columns: ["Shipment ID", "Carrier", "Origin City", "Destination City", "Transit Days", "Cost (USD)"],
        rows: top(delayed).map((s) => [
          s.shipmentId, s.carrierName, s.originCity, s.destinationCity,
          fmt(s.transitTimeDays, 1), fmt(s.shipmentCostUsd),
        ]),
      };
    }

    // ── Transit Time Variance ────────────────────────────────────────────────
    case "Transit Time Variance": {
      const sorted = [...shipments]
        .filter((s) => s.transitTimeDays > 0)
        .sort((a, b) => b.transitTimeDays - a.transitTimeDays);
      return {
        kpi: "Longest Transit Time Shipments",
        kpiValue,
        kpiStatus,
        subtitle: `${sorted.length} shipments in filtered data — top 5 by transit days`,
        columns: ["Shipment ID", "Carrier", "Origin City", "Destination City", "Mode", "Transit Days"],
        rows: top(sorted).map((s) => [
          s.shipmentId, s.carrierName, s.originCity, s.destinationCity,
          s.modeOfTransport, fmt(s.transitTimeDays, 1),
        ]),
      };
    }

    // ── Freight Cost per Shipment ────────────────────────────────────────────
    case "Freight Cost per Shipment": {
      const sorted = [...shipments].sort((a, b) => b.shipmentCostUsd - a.shipmentCostUsd);
      return {
        kpi: "Highest Cost Shipments",
        kpiValue,
        kpiStatus,
        subtitle: `${sorted.length} shipments in filtered data — top 5 by shipment cost (USD)`,
        columns: ["Shipment ID", "Carrier", "Origin City", "Destination City", "Mode", "Cost (USD)"],
        rows: top(sorted).map((s) => [
          s.shipmentId, s.carrierName, s.originCity, s.destinationCity,
          s.modeOfTransport, fmt(s.shipmentCostUsd),
        ]),
      };
    }

    // ── Cost per Mile ────────────────────────────────────────────────────────
    case "Cost per Mile": {
      const withCpm = shipments
        .filter((s) => s.distanceKm > 0)
        .map((s) => ({ ...s, _cpm: s.shipmentCostUsd / (s.distanceKm * 0.621371) }))
        .sort((a, b) => b._cpm - a._cpm);
      return {
        kpi: "Highest Cost-per-Mile Shipments",
        kpiValue,
        kpiStatus,
        subtitle: `${withCpm.length} shipments in filtered data — top 5 by cost per mile (USD)`,
        columns: ["Shipment ID", "Carrier", "Origin City", "Destination City", "Distance (km)", "Cost / Mile (USD)"],
        rows: top(withCpm).map((s) => [
          s.shipmentId, s.carrierName, s.originCity, s.destinationCity,
          fmt(s.distanceKm, 0), fmt(s._cpm),
        ]),
      };
    }

    // ── Carrier On-Time Performance ──────────────────────────────────────────
    case "Carrier On-Time Performance": {
      const byCarrier: Record<string, { total: number; onTime: number; delayed: number }> = {};
      shipments.forEach((s) => {
        const c = s.carrierName || "Unknown";
        if (!byCarrier[c]) byCarrier[c] = { total: 0, onTime: 0, delayed: 0 };
        byCarrier[c].total += 1;
        if (ns(s.onTimeStatus).includes("on-time")) byCarrier[c].onTime += 1;
        if (ns(s.onTimeStatus).includes("delayed")) byCarrier[c].delayed += 1;
      });
      const rows = Object.entries(byCarrier)
        .map(([carrier, { total, onTime, delayed }]) => ({
          carrier, total, onTime, delayed, rate: fmt((onTime / total) * 100, 1),
        }))
        .sort((a, b) => a.rate - b.rate)
        .slice(0, 5);
      return {
        kpi: "Carriers with Lowest On-Time Rate",
        kpiValue,
        kpiStatus,
        subtitle: `${Object.keys(byCarrier).length} carriers in filtered data — bottom 5 by on-time %`,
        columns: ["Carrier Name", "Total Shipments", "On-Time", "Delayed", "On-Time Rate (%)"],
        rows: rows.map((r) => [r.carrier, r.total, r.onTime, r.delayed, r.rate]),
      };
    }

    // ── Tender Acceptance Rate ───────────────────────────────────────────────
    case "Tender Acceptance Rate": {
      const byCarrier: Record<string, { total: number; accepted: number; rejected: number }> = {};
      shipments.forEach((s) => {
        const c = s.carrierName || "Unknown";
        if (!byCarrier[c]) byCarrier[c] = { total: 0, accepted: 0, rejected: 0 };
        byCarrier[c].total += 1;
        if (ns(s.tenderedStatus) === "accepted") byCarrier[c].accepted += 1;
        else byCarrier[c].rejected += 1;
      });
      const rows = Object.entries(byCarrier)
        .map(([carrier, { total, accepted, rejected }]) => ({
          carrier, total, accepted, rejected,
          acceptRate: fmt((accepted / total) * 100, 1),
        }))
        .sort((a, b) => a.acceptRate - b.acceptRate)
        .slice(0, 5);
      return {
        kpi: "Carriers with Lowest Tender Acceptance",
        kpiValue,
        kpiStatus,
        subtitle: `${Object.keys(byCarrier).length} carriers in filtered data — bottom 5 by acceptance rate`,
        columns: ["Carrier Name", "Total Tenders", "Accepted", "Rejected", "Acceptance Rate (%)"],
        rows: rows.map((r) => [r.carrier, r.total, r.accepted, r.rejected, r.acceptRate]),
      };
    }

    default:
      return { kpi, kpiValue, kpiStatus, columns: [], rows: [], subtitle: "No drill-down available." };
  }
}
