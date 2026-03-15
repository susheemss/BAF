"use client";

import Link from "next/link";
import FiltersBar from "../../../components/FiltersBar";
import SpeedometerGauge from "../../../components/SpeedometerGauge";
import { KPI_THRESHOLDS, computeKPIs, filterShipments } from "../../../lib/kpi";
import { useFilters, useShipments } from "../../../stores";

export default function CarrierKpisPage() {
  const { shipments } = useShipments();
  const { filters } = useFilters();
  const filtered = filterShipments(shipments, filters);
  const kpis = computeKPIs(filtered);

  return (
    <div className="container">
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
        <Link href="/kpis/carriers" className="active">
          Carrier Performance
        </Link>
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
        />
        <SpeedometerGauge
          label="Tender Acceptance Rate"
          value={kpis.tenderAcceptanceRate}
          unit="%"
          min={60}
          max={100}
          green={KPI_THRESHOLDS.tenderAcceptance.green}
          yellow={KPI_THRESHOLDS.tenderAcceptance.yellow}
        />
      </div>
    </div>
  );
}
