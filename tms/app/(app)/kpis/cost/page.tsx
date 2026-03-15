"use client";

import Link from "next/link";
import FiltersBar from "../../../components/FiltersBar";
import SpeedometerGauge from "../../../components/SpeedometerGauge";
import { KPI_THRESHOLDS, computeKPIs, filterShipments } from "../../../lib/kpi";
import { useFilters, useShipments } from "../../../stores";

export default function CostKpisPage() {
  const { shipments } = useShipments();
  const { filters } = useFilters();
  const filtered = filterShipments(shipments, filters);
  const kpis = computeKPIs(filtered);

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">Cost Management KPIs</h1>
          <p className="page-subtitle">
            Track freight spend efficiency and distance-normalized costs.
          </p>
        </div>
      </div>

      <div className="kpi-tabs">
        <Link href="/kpis/cost" className="active">
          Cost Management
        </Link>
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
        />
      </div>
    </div>
  );
}
