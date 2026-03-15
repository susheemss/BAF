import { subDays, parseISO, differenceInCalendarDays } from "date-fns";
import { ShipmentRecord } from "../stores";
import { computeKPIs, KPI_THRESHOLDS } from "./kpi";

type Alert = {
  severity: "Critical" | "Warning";
  kpi: string;
  scope: string;
  message: string;
};

function periodSplit(
  records: ShipmentRecord[],
  range?: { startDate?: string; endDate?: string }
) {
  const end = range?.endDate ? parseISO(range.endDate) : new Date();
  const start = range?.startDate ? parseISO(range.startDate) : subDays(end, 30);
  const windowDays = Math.max(1, differenceInCalendarDays(end, start));
  const prevEnd = subDays(start, 1);
  const prevStart = subDays(prevEnd, windowDays);

  const current = records.filter((record) => {
    const dispatch = safeParse(record.date);
    return dispatch >= start && dispatch <= end;
  });

  const previous = records.filter((record) => {
    const dispatch = safeParse(record.date);
    return dispatch >= prevStart && dispatch <= prevEnd;
  });

  return { current, previous, start, end, prevStart, prevEnd };
}

function safeParse(value: string) {
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(0);
  }
  return parsed;
}

function percentDrop(current: number, previous: number) {
  if (previous === 0) {
    return 0;
  }
  return ((previous - current) / previous) * 100;
}

export function buildAlerts(
  records: ShipmentRecord[],
  range?: { startDate?: string; endDate?: string }
): Alert[] {
  const alerts: Alert[] = [];
  const kpis = computeKPIs(records);

  if (kpis.onTimeRate < KPI_THRESHOLDS.onTimeRate.yellow) {
    alerts.push({
      severity: "Critical",
      kpi: "On-Time Rate",
      scope: "Overall network",
      message:
        "On-time rate has dropped below threshold. Review late lanes and carrier mix."
    });
  }

  if (kpis.delayRate > KPI_THRESHOLDS.delayRate.yellow) {
    alerts.push({
      severity: "Critical",
      kpi: "Delay Rate",
      scope: "Overall network",
      message: "Delays exceed acceptable range. Prioritize late lanes."
    });
  }

  const { current, previous, start, end, prevStart, prevEnd } = periodSplit(
    records,
    range
  );
  if (current.length > 0 && previous.length > 0) {
    const currentKpis = computeKPIs(current);
    const previousKpis = computeKPIs(previous);
    const onTimeDrop = percentDrop(
      currentKpis.onTimeRate,
      previousKpis.onTimeRate
    );
    if (onTimeDrop > 5) {
      alerts.push({
        severity: "Warning",
        kpi: "On-Time Rate",
        scope: `Period ${formatPeriod(start, end)}`,
        message: `On-time rate dropped ${onTimeDrop.toFixed(
          1
        )}% vs ${formatPeriod(prevStart, prevEnd)}.`
      });
    }
  }

  return alerts;
}

function formatPeriod(start: Date, end: Date) {
  const days = differenceInCalendarDays(end, start);
  return `${days}d window`;
}
