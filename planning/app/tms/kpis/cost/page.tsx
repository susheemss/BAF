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

export default function CostKpisPage() {
  const { shipments } = useShipments();
  const { filters } = useFilters();
  const filtered = filterShipments(shipments, filters);
  const kpis = computeKPIs(filtered);
  const [drilldown, setDrilldown] = useState<DrilldownData | null>(null);

  const open = (label: string, value: number, unit: string, green: number, yellow: number, lowerIsBetter = false) => {
    const status = gaugeStatus(value, green, yellow, lowerIsBetter);
    setDrilldown(getDrilldown(label, filtered, `${unit}${value.toFixed(1)}`, status));
  };

  return (
    <div className="container">
      {drilldown && <DrilldownModal data={drilldown} onClose={() => setDrilldown(null)} />}

      <div className="page-head">
        <div>
          <h1 className="page-title">Cost Management KPIs</h1>
          <p className="page-subtitle">
            Track freight spend efficiency and distance-normalized costs.
          </p>
        </div>
      </div>

      <div className="kpi-tabs">
        <Link href="/kpis/cost" className="active">Cost Management</Link>
        <Link href="/kpis/operations">Operational</Link>
        <Link href="/kpis/carriers">Carrier Performance</Link>
      </div>

      <FiltersBar shipments={shipments} />

      <div className="grid grid-3">
        <SpeedometerGauge
          label="Freight Cost per Shipment"
          value={kpis.costPerShipment}
          unit="USD"
          min={800}
          max={3000}
          green={KPI_THRESHOLDS.costPerShipment.green}
          yellow={KPI_THRESHOLDS.costPerShipment.yellow}
          lowerIsBetter
          onClick={() => open(
            "Freight Cost per Shipment",
            kpis.costPerShipment, "$",
            KPI_THRESHOLDS.costPerShipment.green,
            KPI_THRESHOLDS.costPerShipment.yellow,
            true
          )}
        />
        <SpeedometerGauge
          label="Cost per Mile"
          value={kpis.costPerMile}
          unit="USD"
          min={0.8}
          max={3.2}
          green={KPI_THRESHOLDS.costPerMile.green}
          yellow={KPI_THRESHOLDS.costPerMile.yellow}
          lowerIsBetter
          onClick={() => open(
            "Cost per Mile",
            kpis.costPerMile, "$",
            KPI_THRESHOLDS.costPerMile.green,
            KPI_THRESHOLDS.costPerMile.yellow,
            true
          )}
        />
      </div>
    </div>
  );
}
