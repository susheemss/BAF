"use client";

import { useState } from "react";
import Link from "next/link";
import FiltersBar from "@/components/tms/FiltersBar";
import SpeedometerGauge from "@/components/tms/SpeedometerGauge";
import DrilldownModal, { DrilldownData } from "@/components/tms/DrilldownModal";
import { KPI_THRESHOLDS, computeKPIs, filterShipments } from "@/lib/tms/kpi";
import { getDrilldown } from "@/lib/tms/drilldown";
import { useFilters, useShipments } from "@/lib/tms/stores";

function gaugeStatus(value: number, green: number, yellow: number, lowerIsBetter = false): "green" | "yellow" | "red" {
  if (lowerIsBetter) {
    if (value <= green) return "green";
    if (value <= yellow) return "yellow";
    return "red";
  }
  if (value >= green) return "green";
  if (value >= yellow) return "yellow";
  return "red";
}

export default function OperationalKpisPage() {
  const { shipments } = useShipments();
  const { filters } = useFilters();
  const filtered = filterShipments(shipments, filters);
  const kpis = computeKPIs(filtered);
  const [drilldown, setDrilldown] = useState<DrilldownData | null>(null);

  const open = (label: string, value: number, unit: string, green: number, yellow: number, lowerIsBetter = false) => {
    const status = gaugeStatus(value, green, yellow, lowerIsBetter);
    setDrilldown(getDrilldown(label, filtered, `${value.toFixed(1)}${unit}`, status));
  };

  return (
    <div className="container">
      {drilldown && <DrilldownModal data={drilldown} onClose={() => setDrilldown(null)} />}

      <div className="page-head">
        <div>
          <h1 className="page-title">Operational KPIs</h1>
          <p className="page-subtitle">
            Execution health across on-time delivery and transit time variance.
          </p>
        </div>
      </div>

      <div className="kpi-tabs">
        <Link href="/kpis/cost">Cost Management</Link>
        <Link href="/kpis/operations" className="active">Operational</Link>
        <Link href="/kpis/carriers">Carrier Performance</Link>
      </div>

      <FiltersBar shipments={shipments} />

      <div className="grid grid-3">
        <SpeedometerGauge
          label="On-Time Delivery Rate"
          value={kpis.onTimeRate}
          unit="%"
          min={60}
          max={100}
          green={KPI_THRESHOLDS.onTimeRate.green}
          yellow={KPI_THRESHOLDS.onTimeRate.yellow}
          onClick={() => open(
            "On-Time Delivery Rate",
            kpis.onTimeRate, "%",
            KPI_THRESHOLDS.onTimeRate.green,
            KPI_THRESHOLDS.onTimeRate.yellow
          )}
        />
        <SpeedometerGauge
          label="Transit Time Variance"
          value={kpis.transitTimeVariance}
          unit=" days"
          min={0}
          max={6}
          green={KPI_THRESHOLDS.transitVariance.green}
          yellow={KPI_THRESHOLDS.transitVariance.yellow}
          lowerIsBetter
          onClick={() => open(
            "Transit Time Variance",
            kpis.transitTimeVariance, " days",
            KPI_THRESHOLDS.transitVariance.green,
            KPI_THRESHOLDS.transitVariance.yellow,
            true
          )}
        />
      </div>
    </div>
  );
}
