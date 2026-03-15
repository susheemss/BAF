"use client";

import Link from "next/link";
import FiltersBar from "../../../components/FiltersBar";
import SpeedometerGauge from "../../../components/SpeedometerGauge";
import { KPI_THRESHOLDS, computeKPIs, filterShipments } from "../../../lib/kpi";
import { useFilters, useShipments } from "../../../stores";

export default function OperationalKpisPage() {
  const { shipments } = useShipments();
  const { filters } = useFilters();
  const filtered = filterShipments(shipments, filters);
  const kpis = computeKPIs(filtered);

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">Operational KPIs</h1>
          <p className="page-subtitle">
            Execution health across on-time delivery, variance, and planning.
          </p>
        </div>
      </div>

      <div className="kpi-tabs">
        <Link href="/kpis/cost">Cost Management</Link>
        <Link href="/kpis/operations" className="active">
          Operational
        </Link>
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
        />
        <SpeedometerGauge
          label="Transit Time Variance"
          value={kpis.transitTimeVariance}
          unit="days"
          min={0}
          max={6}
          green={KPI_THRESHOLDS.transitVariance.green}
          yellow={KPI_THRESHOLDS.transitVariance.yellow}
          lowerIsBetter
        />
      </div>
    </div>
  );
}
