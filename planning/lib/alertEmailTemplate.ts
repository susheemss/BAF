import type { AlertRule } from "./alertConfig";
import type { DrillDown } from "./drillDownData";

// ─── Consolidated multi-breach email ─────────────────────────────────────────
export type BreachItem = {
  rule:   AlertRule;
  value:  number;
  drill:  DrillDown | null;
};

export function buildConsolidatedEmail(
  breaches: BreachItem[],
  firedAt:  string,
): { subject: string; html: string } {
  const criticals = breaches.filter((b) => b.rule.severity === "critical");
  const warnings  = breaches.filter((b) => b.rule.severity === "warning");

  const subject = `[KPI ALERT] ${criticals.length} Critical, ${warnings.length} Warning — Supply Chain Intelligence Platform · ${firedAt}`;

  const breachRows = breaches.map((b) => {
    const isCrit    = b.rule.severity === "critical";
    const accentCol = isCrit ? "#DC2626" : "#D97706";
    const accentBg  = isCrit ? "#FEF2F2" : "#FFFBEB";
    const badgeBg   = isCrit ? "#DC2626" : "#D97706";
    const gap       = Math.abs(b.value - b.rule.threshold).toFixed(1);
    const direction = b.rule.condition === "below" ? "▼ Below" : "▲ Above";

    const srcColor: Record<string, string> = {
      WMS: "#0D9488", TMS: "#3B82F6", Planning: "#6366F1",
    };

    const topFactors = b.drill?.factors.slice(0, 3) ?? [];
    const factorList = topFactors.map((f) =>
      `<tr>
        <td style="padding:8px 14px;border-bottom:1px solid #F1F5F9;">
          <span style="background:#EEF2FF;color:#4F46E5;font-size:10px;font-weight:700;padding:1px 6px;border-radius:3px;">${f.dimension}</span>
          <span style="font-size:12px;font-weight:600;color:#1E293B;margin-left:6px;">${f.name}</span><br/>
          <span style="font-size:11px;color:#64748B;">${f.detail}</span>
        </td>
        <td style="padding:8px 14px;border-bottom:1px solid #F1F5F9;text-align:right;white-space:nowrap;">
          <span style="font-size:13px;font-weight:700;color:${accentCol};">${f.value}${f.unit}</span>
          <br/><span style="font-size:10px;color:#94A3B8;">${f.trend}</span>
        </td>
      </tr>`
    ).join("");

    return `
    <!-- ── Breach Card ── -->
    <tr><td style="padding:0 0 16px;">
      <table width="100%" cellpadding="0" cellspacing="0"
        style="border:1px solid ${accentCol}33;border-radius:10px;overflow:hidden;background:#fff;">

        <!-- Card Header -->
        <tr style="background:${accentBg};">
          <td style="padding:14px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="background:${badgeBg};color:#fff;font-size:10px;font-weight:800;
                    padding:3px 10px;border-radius:12px;letter-spacing:0.5px;">
                    ${b.rule.severity.toUpperCase()}
                  </span>
                  <span style="background:${srcColor[b.rule.source] ?? "#64748B"};color:#fff;font-size:10px;
                    font-weight:700;padding:3px 10px;border-radius:12px;margin-left:6px;">
                    ${b.rule.source}
                  </span>
                </td>
                <td align="right">
                  <span style="font-size:11px;color:#64748B;">${direction} threshold</span>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top:8px;">
                  <span style="font-size:15px;font-weight:700;color:#1E293B;">${b.rule.kpiLabel}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Metrics Row -->
        <tr>
          <td style="padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:14px 20px;border-right:1px solid #F1F5F9;text-align:center;width:33%;">
                  <div style="font-size:10px;color:#94A3B8;font-weight:600;text-transform:uppercase;margin-bottom:4px;">Current</div>
                  <div style="font-size:24px;font-weight:800;color:${accentCol};">${b.value}<span style="font-size:13px;color:#94A3B8;">${b.rule.unit}</span></div>
                </td>
                <td style="padding:14px 20px;border-right:1px solid #F1F5F9;text-align:center;width:33%;">
                  <div style="font-size:10px;color:#94A3B8;font-weight:600;text-transform:uppercase;margin-bottom:4px;">Threshold</div>
                  <div style="font-size:24px;font-weight:800;color:#475569;">${b.rule.threshold}<span style="font-size:13px;color:#94A3B8;">${b.rule.unit}</span></div>
                </td>
                <td style="padding:14px 20px;text-align:center;width:33%;">
                  <div style="font-size:10px;color:#94A3B8;font-weight:600;text-transform:uppercase;margin-bottom:4px;">Gap</div>
                  <div style="font-size:24px;font-weight:800;color:${accentCol};">${gap}<span style="font-size:13px;color:#94A3B8;">${b.rule.unit}</span></div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${topFactors.length > 0 ? `
        <!-- Factors -->
        <tr>
          <td style="padding:0 20px 8px;">
            <div style="font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.8px;padding:10px 0 6px;">
              Top Contributing Factors
            </div>
            <table width="100%" cellpadding="0" cellspacing="0"
              style="border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">
              ${factorList}
            </table>
          </td>
        </tr>` : ""}

        ${b.drill?.recommendation ? `
        <!-- Recommendation -->
        <tr>
          <td style="padding:0 20px 14px;">
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#EEF2FF;border-radius:8px;">
              <tr><td style="padding:12px 16px;">
                <span style="font-size:10px;font-weight:700;color:#6366F1;text-transform:uppercase;letter-spacing:0.5px;">
                  ⚡ Recommended Action
                </span><br/>
                <span style="font-size:12px;color:#1E293B;font-weight:500;">${b.drill.recommendation}</span>
              </td></tr>
            </table>
          </td>
        </tr>` : ""}

      </table>
    </td></tr>`;
  }).join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:32px 0;">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0"
  style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <!-- ── Header ── -->
  <tr>
    <td style="background:linear-gradient(135deg,#0B1F3B 0%,#1E3A5F 100%);padding:28px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="background:rgba(255,255,255,0.1);display:inline-block;border-radius:8px;
              padding:5px 14px;margin-bottom:10px;">
              <span style="color:#A5B4FC;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
                Supply Chain Intelligence Platform
              </span>
            </div><br/>
            <span style="font-size:20px;font-weight:700;color:#fff;">KPI Breach Summary</span><br/>
            <span style="font-size:12px;color:#94A3B8;">${firedAt} · Automated monitoring</span>
          </td>
          <td align="right" style="vertical-align:top;">
            <div style="text-align:right;">
              ${criticals.length > 0 ? `<div style="background:#DC2626;color:#fff;font-size:11px;font-weight:800;
                padding:6px 14px;border-radius:16px;margin-bottom:6px;display:inline-block;">
                🔴 ${criticals.length} Critical
              </div><br/>` : ""}
              ${warnings.length > 0 ? `<div style="background:#D97706;color:#fff;font-size:11px;font-weight:800;
                padding:6px 14px;border-radius:16px;display:inline-block;">
                ⚠️ ${warnings.length} Warning
              </div>` : ""}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── Summary Bar ── -->
  <tr>
    <td style="background:#F8FAFC;border-bottom:1px solid #E2E8F0;padding:14px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;color:#475569;">
            <strong>${breaches.length} KPI${breaches.length > 1 ? "s" : ""}</strong> have breached
            their thresholds and require immediate attention.
          </td>
          <td align="right" style="font-size:11px;color:#94A3B8;">
            Cooldown: 24h per KPI
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── Breach Cards ── -->
  <tr>
    <td style="padding:24px 32px 8px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${breachRows}
      </table>
    </td>
  </tr>

  <!-- ── Footer ── -->
  <tr>
    <td style="padding:20px 32px 28px;border-top:1px solid #F1F5F9;">
      <p style="font-size:11px;color:#94A3B8;margin:0;line-height:1.7;">
        This is an automated alert from your <strong style="color:#6366F1;">Supply Chain Intelligence Platform</strong>.<br/>
        Each KPI will not re-alert for 24 hours. To update thresholds, contact your system administrator.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, html };
}

export function buildAlertEmail(
  rule: AlertRule,
  currentValue: number,
  drill: DrillDown | null,
  firedAt: string,
): { subject: string; html: string } {
  const isCritical = rule.severity === "critical";
  const accentColor = isCritical ? "#DC2626" : "#D97706";
  const accentBg    = isCritical ? "#FEF2F2" : "#FFFBEB";
  const badgeText   = isCritical ? "CRITICAL ALERT" : "WARNING ALERT";
  const badgeBg     = isCritical ? "#DC2626" : "#D97706";

  const direction = rule.condition === "below" ? "▼ Below" : "▲ Above";
  const gap       = Math.abs(currentValue - rule.threshold).toFixed(1);

  const topFactors = drill?.factors.slice(0, 3) ?? [];

  const factorRows = topFactors
    .map(
      (f) => `
      <tr>
        <td style="padding:10px 12px; border-bottom:1px solid #F1F5F9;">
          <span style="display:inline-block;background:#EEF2FF;color:#4F46E5;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;letter-spacing:0.5px;margin-bottom:4px;">
            ${f.dimension.toUpperCase()}
          </span><br/>
          <span style="font-size:13px;font-weight:600;color:#1E293B;">${f.name}</span><br/>
          <span style="font-size:11px;color:#64748B;">${f.detail}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;text-align:right;vertical-align:top;">
          <span style="font-size:14px;font-weight:700;color:${accentColor};">${f.value}${f.unit}</span><br/>
          <span style="font-size:10px;color:#94A3B8;text-transform:capitalize;">${f.trend}</span>
        </td>
      </tr>`,
    )
    .join("");

  const subject = `[${badgeText}] ${rule.kpiLabel} — ${direction} threshold (${currentValue}${rule.unit} vs ${rule.threshold}${rule.unit})`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- ── Header ── -->
        <tr>
          <td style="background:linear-gradient(135deg,#0B1F3B 0%,#1E3A5F 100%);padding:28px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-block;background:rgba(255,255,255,0.12);border-radius:8px;padding:6px 14px;margin-bottom:12px;">
                    <span style="color:#A5B4FC;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Supply Chain Intelligence Platform</span>
                  </div>
                  <div style="font-size:20px;font-weight:700;color:#FFFFFF;margin-bottom:4px;">KPI Alert Notification</div>
                  <div style="font-size:12px;color:#94A3B8;">${firedAt} · Automated monitoring system</div>
                </td>
                <td align="right" style="vertical-align:top;">
                  <div style="background:${badgeBg};color:#FFFFFF;font-size:11px;font-weight:800;letter-spacing:1px;padding:8px 16px;border-radius:20px;display:inline-block;">
                    ${badgeText}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Alert Banner ── -->
        <tr>
          <td style="background:${accentBg};border-left:4px solid ${accentColor};padding:20px 36px;">
            <div style="font-size:13px;font-weight:700;color:${accentColor};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
              ${rule.source} · ${rule.kpiLabel}
            </div>
            <div style="font-size:16px;color:#1E293B;font-weight:500;line-height:1.5;">
              ${rule.description}
            </div>
          </td>
        </tr>

        <!-- ── KPI Scorecard ── -->
        <tr>
          <td style="padding:28px 36px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;">
              <tr>
                <td style="padding:20px 24px;border-right:1px solid #E2E8F0;width:33%;text-align:center;">
                  <div style="font-size:11px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Current Value</div>
                  <div style="font-size:32px;font-weight:800;color:${accentColor};">${currentValue}<span style="font-size:16px;font-weight:500;">${rule.unit}</span></div>
                </td>
                <td style="padding:20px 24px;border-right:1px solid #E2E8F0;width:33%;text-align:center;">
                  <div style="font-size:11px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Threshold</div>
                  <div style="font-size:32px;font-weight:800;color:#475569;">${rule.threshold}<span style="font-size:16px;font-weight:500;">${rule.unit}</span></div>
                </td>
                <td style="padding:20px 24px;width:33%;text-align:center;">
                  <div style="font-size:11px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Gap</div>
                  <div style="font-size:32px;font-weight:800;color:${accentColor};">${gap}<span style="font-size:16px;font-weight:500;">${rule.unit}</span></div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${topFactors.length > 0 ? `
        <!-- ── Contributing Factors ── -->
        <tr>
          <td style="padding:24px 36px 0;">
            <div style="font-size:12px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">
              Top Contributing Factors
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;">
              <tr style="background:#F8FAFC;">
                <td style="padding:8px 12px;font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px;">Factor</td>
                <td style="padding:8px 12px;font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Value / Trend</td>
              </tr>
              ${factorRows}
            </table>
          </td>
        </tr>` : ""}

        ${drill?.recommendation ? `
        <!-- ── Recommended Action ── -->
        <tr>
          <td style="padding:20px 36px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#EEF2FF;border:1px solid #C7D2FE;border-radius:10px;">
              <tr>
                <td style="padding:16px 20px;">
                  <div style="font-size:10px;font-weight:700;color:#6366F1;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;">
                    ⚡ Recommended Action
                  </div>
                  <div style="font-size:13px;color:#1E293B;font-weight:500;line-height:1.6;">
                    ${drill.recommendation}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>` : ""}

        <!-- ── Meta Info ── -->
        <tr>
          <td style="padding:20px 36px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border-radius:8px;border:1px solid #E2E8F0;">
              <tr>
                <td style="padding:12px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:11px;color:#94A3B8;">Source System</td>
                      <td style="font-size:11px;color:#94A3B8;">Cooldown Window</td>
                      <td style="font-size:11px;color:#94A3B8;">Fired At</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;font-weight:600;color:#334155;padding-top:4px;">${rule.source}</td>
                      <td style="font-size:13px;font-weight:600;color:#334155;padding-top:4px;">${rule.cooldownHours}h</td>
                      <td style="font-size:13px;font-weight:600;color:#334155;padding-top:4px;">${firedAt}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Footer ── -->
        <tr>
          <td style="padding:28px 36px;border-top:1px solid #F1F5F9;margin-top:24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:11px;color:#94A3B8;line-height:1.7;">
                    This is an automated alert from your <strong style="color:#6366F1;">Supply Chain Intelligence Platform</strong>.<br/>
                    Next alert for this KPI will fire after the ${rule.cooldownHours}-hour cooldown window.<br/>
                    To update thresholds or recipients, contact your system administrator.
                  </div>
                </td>
                <td align="right" style="vertical-align:top;">
                  <div style="font-size:10px;color:#CBD5E1;font-weight:700;letter-spacing:1px;">SCIP · v2.0</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
