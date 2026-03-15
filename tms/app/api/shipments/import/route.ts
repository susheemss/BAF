import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const records = (body.records as Array<Record<string, unknown>>) ?? [];
  if (records.length === 0) {
    return NextResponse.json({ error: "No records to import." }, { status: 400 });
  }

  const normalizeDate = (value: unknown) => {
    if (typeof value !== "string") {
      return value ?? null;
    }
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === "null") {
      return null;
    }
    return trimmed;
  };

  const payload = records.map((record) => ({
    shipment_id: record.shipmentId ?? "",
    load_id: record.loadId ?? "",
    date: normalizeDate(record.date),
    month: record.month ?? "",
    year: record.year ?? "",
    carrier_name: record.carrierName ?? "",
    mode_of_transport: record.modeOfTransport ?? "",
    product_type: record.productType ?? "",
    origin_country: record.originCountry ?? "",
    origin_region: record.originRegion ?? "",
    origin_state: record.originState ?? "",
    origin_city: record.originCity ?? "",
    origin_zipcode: record.originZipcode ?? "",
    origin_area: record.originArea ?? "",
    destination_country: record.destinationCountry ?? "",
    destination_region: record.destinationRegion ?? "",
    destination_state: record.destinationState ?? "",
    destination_city: record.destinationCity ?? "",
    destination_zipcode: record.destinationZipcode ?? "",
    destination_area: record.destinationArea ?? "",
    distance_km: record.distanceKm ?? 0,
    total_weight_kg: record.totalWeightKg ?? 0,
    transit_time_days: record.transitTimeDays ?? 0,
    operational_status: record.operationalStatus ?? "",
    shipment_cost_usd: record.shipmentCostUsd ?? 0,
    shipment_planned: record.shipmentPlanned ?? "",
    equipment: record.equipment ?? "",
    equipment_weight_capacity_kg: record.equipmentWeightCapacityKg ?? 0,
    equipment_volume_capacity_m3: record.equipmentVolumeCapacityM3 ?? 0,
    total_volume_shipment_m3: record.totalVolumeShipmentM3 ?? 0,
    tendered_status: record.tenderedStatus ?? "",
    estimated_delivery_date: normalizeDate(record.estimatedDeliveryDate),
    actual_delivery_date: normalizeDate(record.actualDeliveryDate),
    delays: record.delays ?? 0,
    on_time_status: record.onTimeStatus ?? "",
    shipment_order_type: record.shipmentOrderType ?? "",
    route: record.route ?? ""
  }));

  const { error } = await supabase.from("shipments").insert(payload);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: payload.length });
}
