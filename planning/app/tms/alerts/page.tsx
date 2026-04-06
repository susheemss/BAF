"use client";

import { useState } from "react";
import AlertCard from "@/components/tms/AlertCard";
import FiltersBar from "@/components/tms/FiltersBar";
import VapiCallPanel from "@/components/tms/VapiCallPanel";
import { useFilters, useShipments } from "@/lib/tms/stores";
import { buildAlerts } from "@/lib/tms/alerts";
import {
  computeKPIs,
  filterShipments,
  formatNumber,
  formatPercent,
  kpiStatus,
  KPI_THRESHOLDS
} from "@/lib/tms/kpi";

export default function AlertsPage() {
  const { shipments } = useShipments();
  const { filters } = useFilters();
  const filtered = filterShipments(shipments, filters);
  const alerts = buildAlerts(filtered, {
    startDate: filters.startDate,
    endDate: filters.endDate
  });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");

  const kpis = computeKPIs(filtered);
  const redKpis = [
    {
      label: "Freight Cost per Shipment",
      value: `$${formatNumber(kpis.costPerShipment)}`,
      status: kpiStatus("costPerShipment", kpis.costPerShipment)
    },
    {
      label: "Cost per Mile",
      value: `$${formatNumber(kpis.costPerMile)}`,
      status: kpiStatus("costPerMile", kpis.costPerMile)
    },
    {
      label: "On-Time Delivery Rate",
      value: formatPercent(kpis.onTimeRate),
      status: kpiStatus("onTimeRate", kpis.onTimeRate)
    },
    {
      label: "Transit Time Variance",
      value: `${formatNumber(kpis.transitTimeVariance)} days`,
      status: kpiStatus("transitVariance", kpis.transitTimeVariance)
    },
    {
      label: "Carrier On-Time Performance",
      value: formatPercent(kpis.carrierOnTimeRate),
      status: kpiStatus("carrierOnTimeRate", kpis.carrierOnTimeRate)
    },
    {
      label: "Tender Acceptance Rate",
      value: formatPercent(kpis.tenderAcceptanceRate),
      status: kpiStatus("tenderAcceptance", kpis.tenderAcceptanceRate)
    },
    {
      label: "Delay Rate",
      value: formatPercent(kpis.delayRate),
      status: kpiStatus("delayRate", kpis.delayRate)
    }
  ].filter((item) => item.status === "red");

  const handleSendAlerts = async () => {
    if (redKpis.length === 0) {
      setStatus("No red KPIs to send.");
      return;
    }
    setSending(true);
    setStatus("Sending alert email...");
    try {
      const response = await fetch("/api/alerts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          redKpis: redKpis.map(({ label, value }) => ({ label, value })),
          context: {
            filters,
            thresholds: {
              onTimeRate: KPI_THRESHOLDS.onTimeRate,
              delayRate: KPI_THRESHOLDS.delayRate,
              costPerShipment: KPI_THRESHOLDS.costPerShipment,
              costPerMile: KPI_THRESHOLDS.costPerMile,
              transitVariance: KPI_THRESHOLDS.transitVariance,
              tenderAcceptance: KPI_THRESHOLDS.tenderAcceptance
            }
          }
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to send alerts.");
      }
      setStatus("Alert email sent.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Send failed.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">Alerts & Exceptions</h1>
          <p className="page-subtitle">
            Automated exceptions triggered by threshold breaches and trend drops.
          </p>
        </div>
        <div className="page-actions">
          <button className="ghost">Export Log</button>
          <button onClick={handleSendAlerts} disabled={sending}>
            {sending ? "Sending..." : "Send Alert"}
          </button>
        </div>
      </div>

      <FiltersBar shipments={shipments} />

      <div className="alert-list">
        {alerts.length === 0 ? (
          <div className="card">No alerts triggered in this period.</div>
        ) : (
          alerts.map((alert, index) => (
            <AlertCard key={`${alert.kpi}-${index}`} {...alert} />
          ))
        )}
      </div>

      <VapiCallPanel disabled={redKpis.length === 0} />

      {status ? (
        <div className="card" style={{ marginTop: 16 }}>
          {status}
        </div>
      ) : null}
    </div>
  );
}
