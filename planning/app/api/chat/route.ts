import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Row = Record<string, string>;

function parseCSV(): Row[] {
  try {
    const csvPath = path.join(process.cwd(), "..", "..", "tms", "supply-master", "public", "TMS.csv");
    const raw = fs.readFileSync(csvPath, "utf-8").replace(/^\uFEFF/, "");
    const lines = raw.split("\n").filter(Boolean);
    const headers = lines[0].split(",");
    return lines.slice(1).map((line) => {
      const vals = line.split(",");
      const row: Row = {};
      headers.forEach((h, i) => { row[h.trim()] = (vals[i] ?? "").trim(); });
      return row;
    });
  } catch {
    return [];
  }
}

function computeStats(): string {
  const rows = parseCSV();
  if (!rows.length) return "No data available.";

  const total = rows.length;

  // Status counts
  const statusCount: Record<string, number> = {};
  rows.forEach((r) => {
    const s = r["On-Time / Delayed / In-Transit"] ?? "Unknown";
    statusCount[s] = (statusCount[s] ?? 0) + 1;
  });

  // Carrier delay rates
  const carrierTotal: Record<string, number> = {};
  const carrierDelayed: Record<string, number> = {};
  rows.forEach((r) => {
    const c = r["Carrier Name"] ?? "Unknown";
    carrierTotal[c] = (carrierTotal[c] ?? 0) + 1;
    if ((r["On-Time / Delayed / In-Transit"] ?? "").includes("Delayed")) {
      carrierDelayed[c] = (carrierDelayed[c] ?? 0) + 1;
    }
  });
  const carrierRates = Object.keys(carrierTotal).map((c) => ({
    name: c,
    total: carrierTotal[c],
    delayed: carrierDelayed[c] ?? 0,
    rate: Math.round(((carrierDelayed[c] ?? 0) / carrierTotal[c]) * 100),
  })).sort((a, b) => b.rate - a.rate);

  // Mode distribution
  const modeCount: Record<string, number> = {};
  rows.forEach((r) => {
    const m = r["Mode of Transport"] ?? "Unknown";
    modeCount[m] = (modeCount[m] ?? 0) + 1;
  });
  const modesSorted = Object.entries(modeCount).sort((a, b) => b[1] - a[1]);

  // Cost stats
  const costs = rows.map((r) => parseFloat(r["Shipment Cost (USD)"] ?? "0")).filter((c) => c > 0);
  const avgCost = Math.round(costs.reduce((a, b) => a + b, 0) / costs.length);
  const maxCost = Math.round(Math.max(...costs));
  const minCost = Math.round(Math.min(...costs));

  // Top delayed routes
  const routeDelays: Record<string, number> = {};
  rows.forEach((r) => {
    if ((r["On-Time / Delayed / In-Transit"] ?? "").includes("Delayed")) {
      const key = `${r["Origin City"]} → ${r["Destination City"]}`;
      routeDelays[key] = (routeDelays[key] ?? 0) + 1;
    }
  });
  const topDelayedRoutes = Object.entries(routeDelays).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Mode avg cost
  const modeCosts: Record<string, number[]> = {};
  rows.forEach((r) => {
    const m = r["Mode of Transport"] ?? "Unknown";
    const c = parseFloat(r["Shipment Cost (USD)"] ?? "0");
    if (c > 0) { modeCosts[m] = modeCosts[m] ?? []; modeCosts[m].push(c); }
  });
  const modeAvgCost = Object.entries(modeCosts).map(([m, cs]) => ({
    mode: m, avg: Math.round(cs.reduce((a, b) => a + b, 0) / cs.length),
  })).sort((a, b) => b.avg - a.avg);

  return `
SUPPLY CHAIN DATA SUMMARY (${total} total shipments):

SHIPMENT STATUS:
${Object.entries(statusCount).map(([s, n]) => `  - ${s}: ${n} shipments (${Math.round((n / total) * 100)}%)`).join("\n")}

CARRIER PERFORMANCE (ranked by delay rate, highest first):
${carrierRates.map((c) => `  - ${c.name}: ${c.rate}% delay rate (${c.delayed} delayed out of ${c.total} shipments)`).join("\n")}

MODE OF TRANSPORT:
${modesSorted.map(([m, n]) => `  - ${m}: ${n} shipments (${Math.round((n / total) * 100)}%)`).join("\n")}

AVERAGE COST BY MODE:
${modeAvgCost.map((m) => `  - ${m.mode}: $${m.avg} average`).join("\n")}

SHIPMENT COST OVERALL:
  - Average: $${avgCost}
  - Lowest: $${minCost}
  - Highest: $${maxCost}

TOP DELAYED ROUTES:
${topDelayedRoutes.map(([r, n]) => `  - ${r}: ${n} delays`).join("\n")}
`.trim();
}

const PRECOMPUTED_STATS = computeStats();

const SYSTEM_PROMPT = `You are an AI supply chain assistant. You have access to pre-computed statistics from the TMS shipment data below. These numbers are already calculated and accurate.

Rules:
- Answer in 2-3 sentences maximum. Be direct and specific.
- Lead with the exact answer (name, number, or fact) — never hedge.
- Never say "I would need more data" or "based on the sample" — the data is complete and accurate.
- Use the exact numbers provided. Do not recalculate.

TMS DATA STATISTICS:
${PRECOMPUTED_STATS}`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API key not configured." }, { status: 500 });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://baf-unified.vercel.app",
        "X-Title": "Supply Chain AI Assistant",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-haiku",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: err }, { status: response.status });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content ?? "I could not generate a response.";
    return NextResponse.json({ answer });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
