import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { ALERT_RULES, ALERT_RECIPIENTS, evaluateRule, type KpiSnapshot } from "@/lib/alertConfig";
import { getDrillDown } from "@/lib/drillDownData";
import { buildConsolidatedEmail, type BreachItem } from "@/lib/alertEmailTemplate";

// ─── Cooldown store (file-based for MVP) ──────────────────────────────────────
const COOLDOWN_FILE = path.join(process.cwd(), ".alert-cooldown.json");

function readCooldowns(): Record<string, number> {
  try {
    if (fs.existsSync(COOLDOWN_FILE)) {
      return JSON.parse(fs.readFileSync(COOLDOWN_FILE, "utf-8"));
    }
  } catch {}
  return {};
}

function writeCooldowns(data: Record<string, number>) {
  try { fs.writeFileSync(COOLDOWN_FILE, JSON.stringify(data, null, 2)); } catch {}
}

function isInCooldown(kpiKey: string, cooldownHours: number, store: Record<string, number>): boolean {
  const last = store[kpiKey];
  if (!last) return false;
  return Date.now() - last < cooldownHours * 60 * 60 * 1000;
}

// ─── Mailer ───────────────────────────────────────────────────────────────────
function createTransport() {
  return nodemailer.createTransport({
    host:   "smtp.gmail.com",
    port:   587,
    secure: false,
    auth: {
      user: process.env.ALERT_FROM_EMAIL,
      pass: process.env.ALERT_APP_PASSWORD,
    },
  });
}

// ─── Alert history (in-memory for MVP; append to file) ────────────────────────
const HISTORY_FILE = path.join(process.cwd(), ".alert-history.json");

export type AlertHistoryEntry = {
  id:           string;
  kpiKey:       string;
  kpiLabel:     string;
  source:       string;
  severity:     string;
  value:        number;
  threshold:    number;
  unit:         string;
  firedAt:      string;
  recipients:   string[];
  emailSent:    boolean;
  emailError?:  string;
};

function appendHistory(entry: AlertHistoryEntry) {
  try {
    let history: AlertHistoryEntry[] = [];
    if (fs.existsSync(HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
    }
    history.unshift(entry);           // newest first
    history = history.slice(0, 200);  // keep last 200
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch {}
}

// ─── POST /api/alerts/check ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { kpis: KpiSnapshot };
    const kpis = body.kpis;

    const cooldowns     = readCooldowns();
    const transport     = createTransport();
    const firedAlerts:  AlertHistoryEntry[] = [];
    const skipped:      string[] = [];
    const breachItems:  BreachItem[] = [];

    const firedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false });

    // ── Collect all active non-cooldown breaches ──────────────────────────────
    for (const rule of ALERT_RULES) {
      const value = kpis[rule.kpiKey as keyof KpiSnapshot];
      if (value === undefined) continue;
      if (!evaluateRule(rule, value)) continue;

      if (isInCooldown(rule.kpiKey, rule.cooldownHours, cooldowns)) {
        skipped.push(rule.kpiKey);
        continue;
      }

      breachItems.push({ rule, value, drill: getDrillDown(rule.kpiKey) });
      cooldowns[rule.kpiKey] = Date.now();
    }

    // ── Send ONE consolidated email for all breaches ──────────────────────────
    let emailSent  = false;
    let emailError: string | undefined;

    if (breachItems.length > 0) {
      // Use highest-severity recipients (critical if any critical breach exists)
      const hasCritical = breachItems.some((b) => b.rule.severity === "critical");
      const recipients  = ALERT_RECIPIENTS[hasCritical ? "critical" : "warning"];
      const { subject, html } = buildConsolidatedEmail(breachItems, firedAt);

      if (process.env.ALERT_FROM_EMAIL && process.env.ALERT_APP_PASSWORD) {
        try {
          await transport.sendMail({
            from:    `"Supply Chain Intelligence Platform" <${process.env.ALERT_FROM_EMAIL}>`,
            to:      recipients.join(", "),
            subject,
            html,
          });
          emailSent = true;
        } catch (err: unknown) {
          emailError = err instanceof Error ? err.message : String(err);
        }
      } else {
        emailError = "Email credentials not configured";
      }

      // Save one history entry per breached KPI (for the Alert History panel)
      for (const b of breachItems) {
        const hasCrit = b.rule.severity === "critical";
        const entry: AlertHistoryEntry = {
          id:        `${b.rule.kpiKey}-${Date.now()}`,
          kpiKey:    b.rule.kpiKey,
          kpiLabel:  b.rule.kpiLabel,
          source:    b.rule.source,
          severity:  b.rule.severity,
          value:     b.value,
          threshold: b.rule.threshold,
          unit:      b.rule.unit,
          firedAt,
          recipients: ALERT_RECIPIENTS[hasCrit ? "critical" : "warning"],
          emailSent,
          emailError,
        };
        appendHistory(entry);
        firedAlerts.push(entry);
      }
    }

    writeCooldowns(cooldowns);

    return NextResponse.json({
      ok:           true,
      firedCount:   firedAlerts.length,
      skippedCount: skipped.length,
      fired:        firedAlerts,
    });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// ─── GET /api/alerts/check → return history ───────────────────────────────────
export async function GET() {
  try {
    let history: AlertHistoryEntry[] = [];
    if (fs.existsSync(HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
    }
    return NextResponse.json({ ok: true, history });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: String(err), history: [] }, { status: 500 });
  }
}
