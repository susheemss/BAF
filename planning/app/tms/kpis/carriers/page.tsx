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

export default function CarrierKpisPage() {
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
          <h1 className="page-title">Carrier Performance KPIs</h1>
          <p className="page-subtitle">
            Carrier on-time quality and tender acceptance benchmarks.
          </p>
        </div>
      </div>

      <div className="kpi-tabs">
        <Link href="/kpis/cost">Cost Management</Link>
        <Link href="/kpis/operations">Operational</Link>
        <Link href="/kpis/carriers" className="active">Carrier Performance</Link>
      </div>

      <FiltersBar shipments={shipments} />

      <div className="grid grid-3">
        <SpeedometerGauge
          label="Carrier On-Time Performance"
          value={kpis.carrierOnTimeRate}
          unit="%"
          min={60}
          max={100}
          green={KPI_THRESHOLDS.onTimeRate.green}
          yellow={KPI_THRESHOLDS.onTimeRate.yellow}
          onClick={() => open(
            "Carrier On-Time Performance",
            kpis.carrierOnTimeRate, "%",
            KPI_THRESHOLDS.onTimeRate.green,
            KPI_THRESHOLDS.onTimeRate.yellow
          )}
        />
        <SpeedometerGauge
          label="Tender Acceptance Rate"
          value={kpis.tenderAcceptanceRate}
          unit="%"
          min={60}
          max={100}
          green={KPI_THRESHOLDS.tenderAcceptance.green}
          yellow={KPI_THRESHOLDS.tenderAcceptance.yellow}
          onClick={() => open(
            "Tender Acceptance Rate",
            kpis.tenderAcceptanceRate, "%",
            KPI_THRESHOLDS.tenderAcceptance.green,
            KPI_THRESHOLDS.tenderAcceptance.yellow
          )}
        />
      </div>
    </div>
  );
}
