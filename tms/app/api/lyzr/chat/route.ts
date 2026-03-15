import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeKPIs } from "../../../lib/kpi";

export const runtime = "nodejs";

type LyzrResponse = {
  message?: string;
  response?: string;
  data?: { response?: string };
};

type ShipmentRow = Record<string, any>;

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function mapRow(row: ShipmentRow) {
  return {
    shipmentId: row.shipment_id ?? "",
    loadId: row.load_id ?? "",
    date: row.date ?? "",
    month: row.month ?? "",
    year: row.year ?? "",
    carrierName: row.carrier_name ?? "Unknown",
    modeOfTransport: row.mode_of_transport ?? "Unknown",
    productType: row.product_type ?? "Unknown",
    originCountry: row.origin_country ?? "Unknown",
    originRegion: row.origin_region ?? "Unknown",
    originState: row.origin_state ?? "Unknown",
    originCity: row.origin_city ?? "Unknown",
    originZipcode: row.origin_zipcode ?? "",
    originArea: row.origin_area ?? "Unknown",
    destinationCountry: row.destination_country ?? "Unknown",
    destinationRegion: row.destination_region ?? "Unknown",
    destinationState: row.destination_state ?? "Unknown",
    destinationCity: row.destination_city ?? "Unknown",
    destinationZipcode: row.destination_zipcode ?? "",
    destinationArea: row.destination_area ?? "Unknown",
    distanceKm: Number(row.distance_km ?? 0),
    totalWeightKg: Number(row.total_weight_kg ?? 0),
    transitTimeDays: Number(row.transit_time_days ?? 0),
    operationalStatus: row.operational_status ?? "",
    shipmentCostUsd: Number(row.shipment_cost_usd ?? 0),
    shipmentPlanned: row.shipment_planned ?? "",
    equipment: row.equipment ?? "",
    equipmentWeightCapacityKg: Number(row.equipment_weight_capacity_kg ?? 0),
    equipmentVolumeCapacityM3: Number(row.equipment_volume_capacity_m3 ?? 0),
    totalVolumeShipmentM3: Number(row.total_volume_shipment_m3 ?? 0),
    tenderedStatus: row.tendered_status ?? "",
    estimatedDeliveryDate: row.estimated_delivery_date ?? "",
    actualDeliveryDate: row.actual_delivery_date ?? "",
    delays: Number(row.delays ?? 0),
    onTimeStatus: row.on_time_status ?? "",
    shipmentOrderType: row.shipment_order_type ?? "",
    route: row.route ?? ""
  };
}

function summarizeCarrierKpis(records: ReturnType<typeof mapRow>[]) {
  const byCarrier: Record<string, ReturnType<typeof mapRow>[]> = {};
  records.forEach((record) => {
    const key = record.carrierName || "Unknown";
    if (!byCarrier[key]) {
      byCarrier[key] = [];
    }
    byCarrier[key].push(record);
  });

  const carriers = Object.entries(byCarrier).map(([carrier, list]) => {
    const kpis = computeKPIs(list);
    return {
      carrier,
      shipments: list.length,
      kpis
    };
  });

  carriers.sort((a, b) => b.shipments - a.shipments);
  return carriers.slice(0, 20);
}

export async function POST(request: Request) {
  const apiKey = process.env.LYZR_API_KEY ?? "";
  const agentId = process.env.LYZR_AGENT_ID ?? "";
  const userId = process.env.LYZR_USER_ID ?? "";
  if (!apiKey || !agentId || !userId) {
    return NextResponse.json(
      { error: "LYZR credentials are not configured." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const messages =
    (body.messages as Array<{ role: string; content: string }>) ?? [];

  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const records = (data ?? []).map(mapRow);
  const overall = computeKPIs(records);
  const carriers = summarizeCarrierKpis(records);
  const carrierNames = carriers.map((carrier) => carrier.carrier);

  const system = [
    "You are a supply chain KPI assistant.",
    "Respond only in English.",
    "Be concise and action-oriented.",
    "Use only the provided data context. Do not fabricate numbers or claims.",
    "If a carrier is not in the provided list, say it is not found.",
    "If the user asks for a metric not in the data context, say it is unavailable."
  ].join(" ");

  const dataContext = {
    generatedAt: new Date().toISOString(),
    totals: overall,
    carriers,
    carrierNames
  };

  const merged = [
    { role: "system", content: system },
    {
      role: "system",
      content: `DATA_CONTEXT:\n${JSON.stringify(dataContext)}`
    },
    ...messages.slice(-10)
  ];
  const lastUser = [...merged].reverse().find((item) => item.role === "user");
  const message = lastUser?.content ?? "";
  const sessionId =
    body.sessionId ?? `${agentId}-${userId.replace(/[^a-zA-Z0-9]/g, "")}`;

  const payload = {
    user_id: userId,
    agent_id: agentId,
    session_id: sessionId,
    message
  };

  const response = await fetch(
    "https://agent-prod.studio.lyzr.ai/v3/inference/chat/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify(payload)
    }
  );

  const raw = await response.text();
  if (!response.ok) {
    return NextResponse.json({ error: `Lyzr error: ${raw}` }, { status: 500 });
  }

  let parsed: LyzrResponse | null = null;
  try {
    parsed = JSON.parse(raw) as LyzrResponse;
  } catch {
    parsed = null;
  }

  const reply =
    parsed?.response ?? parsed?.message ?? parsed?.data?.response ?? raw;

  return NextResponse.json({ reply });
}
