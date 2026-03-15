"use client";

import { useRef, useState } from "react";
import KpiCard from "../../components/KpiCard";
import FiltersBar from "../../components/FiltersBar";
import LineChart from "../../components/LineChart";
import BarChart from "../../components/BarChart";
import { useFilters, useShipments } from "../../stores";
import {
  buildOnTimeTrend,
  buildCarrierOnTime,
  buildCarrierDelay,
  buildRouteCost,
  buildRouteDelay,
  computeKPIs,
  filterShipments,
  formatNumber,
  formatPercent,
  KPI_THRESHOLDS
} from "../../lib/kpi";
import { differenceInCalendarDays, subDays } from "date-fns";

function compareTrend(current: number, previous: number) {
  if (previous === 0) {
    return "FLAT";
  }
  const delta = current - previous;
  if (delta >= 1) {
    return "UP";
  }
  if (delta <= -1) {
    return "DOWN";
  }
  return "FLAT";
}

function trendText(trend: string, positiveWhenUp = true) {
  if (trend === "FLAT") {
    return "stable versus previous period";
  }
  if (trend === "UP") {
    return positiveWhenUp
      ? "improving versus previous period"
      : "worsening versus previous period";
  }
  return positiveWhenUp
    ? "declining versus previous period"
    : "improving versus previous period";
}

export default function DashboardPage() {
  const dashboardRef = useRef<HTMLDivElement | null>(null);
  const { shipments } = useShipments();
  const { filters } = useFilters();
  const filtered = filterShipments(shipments, filters);
  const kpis = computeKPIs(filtered);

  const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
  const currentStart = filters.startDate
    ? new Date(filters.startDate)
    : subDays(endDate, 30);
  const windowDays = Math.max(
    1,
    differenceInCalendarDays(endDate, currentStart)
  );
  const previousEnd = subDays(currentStart, 1);
  const previousStart = subDays(previousEnd, windowDays);
  const previous = filterShipments(shipments, {
    ...filters,
    startDate: previousStart.toISOString().slice(0, 10),
    endDate: previousEnd.toISOString().slice(0, 10)
  });
  const previousKpis = computeKPIs(previous);

  const onTimeTrend = compareTrend(kpis.onTimeRate, previousKpis.onTimeRate);
  const transitTrend = compareTrend(
    kpis.averageTransitTime,
    previousKpis.averageTransitTime
  );
  const delayTrend = compareTrend(kpis.delayRate, previousKpis.delayRate);
  const costTrend = compareTrend(
    kpis.costPerShipment,
    previousKpis.costPerShipment
  );

  const trendFilters = { ...filters, startDate: "", endDate: "" };
  const trendFiltered = filterShipments(shipments, trendFilters);
  const onTimeTrendData = buildOnTimeTrend(trendFiltered);
  const carrierBarsAll = buildCarrierOnTime(filtered);
  const routeBarsAll = buildRouteDelay(filtered);
  const routeCost = buildRouteCost(filtered);
  const carrierDelay = buildCarrierDelay(filtered);
  const [drillKey, setDrillKey] = useState<
    "routeDelay" | "routeCost" | "carrierDelay"
  >("routeDelay");
  const [showMoreCarriers, setShowMoreCarriers] = useState(false);
  const [showMoreRoutes, setShowMoreRoutes] = useState(false);
  const [brief, setBrief] = useState("");
  const [copied, setCopied] = useState(false);
  const carrierBars = carrierBarsAll.slice(0, showMoreCarriers ? 10 : 3);
  const routeBars = routeBarsAll.slice(0, showMoreRoutes ? 10 : 3);

  const handleSnapshot = async () => {
    if (!dashboardRef.current) {
      return;
    }
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(dashboardRef.current, {
      backgroundColor: "#f4f6fb",
      scale: 2
    });
    const link = document.createElement("a");
    link.download = `dashboard-snapshot-${new Date()
      .toISOString()
      .slice(0, 10)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleGenerateBrief = () => {
    const activeFrom = filters.startDate || "not set";
    const activeTo = filters.endDate || "today";
    const topDelayedRoute = routeBarsAll[0];
    const topCostRoute = routeCost[0];
    const topDelayedCarrier = carrierDelay[0];
    const summary = [
      "Executive Brief",
      `Scope: ${filtered.length} shipments | Date filter ${activeFrom} to ${activeTo}.`,
      `On-time delivery is ${formatPercent(kpis.onTimeRate)} (${trendText(onTimeTrend, true)}), while delay rate is ${formatPercent(kpis.delayRate)} (${trendText(delayTrend, false)}).`,
      `Cost per shipment is $${formatNumber(kpis.costPerShipment)} (${trendText(costTrend, false)}), with average transit time at ${formatNumber(kpis.averageTransitTime)} days (${trendText(transitTrend, false)}).`,
      `Utilization snapshot: weight ${formatPercent(kpis.weightUtilization)}, volume ${formatPercent(kpis.volumeUtilization)}.`,
      topDelayedRoute
        ? `Highest delay intersection: ${topDelayedRoute.label} at ${formatPercent(topDelayedRoute.value)} delay rate.`
        : "No delayed route intersection found for current filters.",
      topCostRoute
        ? `Highest cost intersection: ${topCostRoute.label} at $${formatNumber(topCostRoute.value)} average shipment cost.`
        : "No high-cost route intersection found for current filters.",
      topDelayedCarrier
        ? `Primary carrier risk: ${topDelayedCarrier.label} at ${formatPercent(topDelayedCarrier.value)} delayed share.`
        : "No carrier delay concentration found for current filters.",
      "Recommendations: prioritize the top delayed route, run a carrier performance review for the highest-risk carrier, and enforce cost controls on high-cost lanes this week."
    ].join("\n");
    setCopied(false);
    setBrief(summary);
  };

  const handleCopyBrief = async () => {
    if (!brief) {
      return;
    }
    await navigator.clipboard.writeText(brief);
    setCopied(true);
  };

  const handleDownloadBrief = () => {
    if (!brief) {
      return;
    }
    const blob = new Blob([brief], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `executive-brief-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="container" ref={dashboardRef}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">
            Live OTIF health, delay exposure, and cost posture for leadership.
          </p>
        </div>
        <div className="page-actions">
          <button className="ghost" onClick={handleSnapshot}>
            Share Snapshot
          </button>
          <button onClick={handleGenerateBrief}>Generate Brief</button>
        </div>
      </div>

      {brief ? (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="filters-header">
            <div className="kpi-label">Executive Brief</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="ghost" onClick={handleCopyBrief}>
                {copied ? "Copied" : "Copy Brief"}
              </button>
              <button className="ghost" onClick={handleDownloadBrief}>
                Download Brief
              </button>
            </div>
          </div>
          <pre
            style={{
              marginTop: 12,
              whiteSpace: "pre-wrap",
              fontFamily: "inherit",
              fontSize: 14,
              lineHeight: 1.5
            }}
          >
            {brief}
          </pre>
        </div>
      ) : null}

      <FiltersBar shipments={shipments} />

      <div className="grid grid-4">
        <KpiCard
          label="On-Time Rate"
          value={formatPercent(kpis.onTimeRate)}
          trend={onTimeTrend}
          kpiKey="onTimeRate"
          numericValue={kpis.onTimeRate}
        />
        <KpiCard
          label="Delay Rate"
          value={formatPercent(kpis.delayRate)}
          trend={delayTrend}
          kpiKey="delayRate"
          numericValue={kpis.delayRate}
        />
        <KpiCard
          label="Avg Transit Time"
          value={`${formatNumber(kpis.averageTransitTime)} days`}
          trend={transitTrend}
          status="green"
        />
        <KpiCard
          label="Cost per Shipment"
          value={`$${formatNumber(kpis.costPerShipment)}`}
          trend={costTrend}
          status="green"
        />
      </div>

      <div className="grid grid-4" style={{ marginTop: 20 }}>
        <KpiCard
          label="Avg Delay Days"
          value={`${formatNumber(kpis.averageDelayDays)} days`}
          status="yellow"
        />
        <KpiCard
          label="Cost per KM"
          value={`$${formatNumber(kpis.costPerKm)}`}
          status="green"
        />
        <KpiCard
          label="Cost per KG"
          value={`$${formatNumber(kpis.costPerKg)}`}
          status="green"
        />
      </div>

      <div className="grid grid-3" style={{ marginTop: 20 }}>
        <LineChart title="On-time trend over time" points={onTimeTrendData} />
        <div>
          <BarChart
            title="Carrier on-time score"
            bars={carrierBars}
            unit="%"
          />
          {carrierBarsAll.length > 3 ? (
            <button
              className="ghost"
              style={{ marginTop: 10 }}
              onClick={() => setShowMoreCarriers((value) => !value)}
            >
              {showMoreCarriers ? "Show less" : "Show more"}
            </button>
          ) : null}
        </div>
        <div>
          <BarChart title="Route-wise Delay Rate" bars={routeBars} unit="%" />
          {routeBarsAll.length > 3 ? (
            <button
              className="ghost"
              style={{ marginTop: 10 }}
              onClick={() => setShowMoreRoutes((value) => !value)}
            >
              {showMoreRoutes ? "Show less" : "Show more"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-3" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="kpi-label">KPI Thresholds</div>
          <div className="data-row">
            <span>On-Time Green</span>
            <span>{KPI_THRESHOLDS.onTimeRate.green}%</span>
          </div>
          <div className="data-row">
            <span>On-Time Yellow</span>
            <span>{KPI_THRESHOLDS.onTimeRate.yellow}%</span>
          </div>
          <div className="data-row">
            <span>Delay Rate Green</span>
            <span>{KPI_THRESHOLDS.delayRate.green}%</span>
          </div>
          <div className="data-row">
            <span>Delay Rate Yellow</span>
            <span>{KPI_THRESHOLDS.delayRate.yellow}%</span>
          </div>
        </div>

        <div className="card">
          <div className="kpi-label">Utilization & Volume</div>
          <div className="data-row">
            <span>Weight Utilization</span>
            <span>{formatPercent(kpis.weightUtilization)}</span>
          </div>
          <div className="data-row">
            <span>Volume Utilization</span>
            <span>{formatPercent(kpis.volumeUtilization)}</span>
          </div>
          <div className="data-row">
            <span>Total Weight</span>
            <span>{formatNumber(kpis.totalWeightKg)} kg</span>
          </div>
          <div className="data-row">
          </div>
        </div>

        <div className="card">
          <div className="kpi-label">CO2 Snapshot</div>
          <div className="data-row">
            <span>Total CO2</span>
            <span>{formatNumber(kpis.totalCo2Kg)} kg</span>
          </div>
          <div className="data-row">
            <span>CO2 per Shipment</span>
            <span>{formatNumber(kpis.co2PerShipment)} kg</span>
          </div>
          <div className="data-row">
            <span>CO2 per Ton-KM</span>
            <span>{formatNumber(kpis.co2PerTonKm)} kg</span>
          </div>
        </div>

        <div className="card">
          <div className="kpi-label">Drilldown</div>
          <div className="drill-tabs">
            <button
              className={drillKey === "routeDelay" ? "active" : ""}
              onClick={() => setDrillKey("routeDelay")}
            >
              Delayed Routes
            </button>
            <button
              className={drillKey === "routeCost" ? "active" : ""}
              onClick={() => setDrillKey("routeCost")}
            >
              Highest Cost Routes
            </button>
            <button
              className={drillKey === "carrierDelay" ? "active" : ""}
              onClick={() => setDrillKey("carrierDelay")}
            >
              Carrier Delays
            </button>
          </div>
          {(drillKey === "routeDelay" ? routeBars : drillKey === "routeCost" ? routeCost : carrierDelay)
            .slice(0, 5)
            .map((item) => (
              <div key={item.label} className="data-row">
                <span>{item.label}</span>
                <span>
                  {drillKey === "routeCost"
                    ? `$${formatNumber(item.value)}`
                    : formatPercent(item.value)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
