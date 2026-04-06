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

export async function GET() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured.", hasUrl: Boolean(process.env.SUPABASE_URL), hasKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) },
      { status: 500 }
    );
  }

  let data = null;
  let error: { message: string } | null = null;
  try {
    const response = await supabase
      .from("shipments")
      .select("*")
      .order("date", { ascending: false });
    data = response.data ?? null;
    error = response.error ?? null;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Supabase fetch error.";
    return NextResponse.json(
      {
        error: message,
        hasUrl: Boolean(process.env.SUPABASE_URL),
        hasKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        urlHost: (() => {
          try {
            return new URL(process.env.SUPABASE_URL ?? "").host || null;
          } catch {
            return null;
          }
        })()
      },
      { status: 500 }
    );
  }

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
        hasUrl: Boolean(process.env.SUPABASE_URL),
        hasKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
      },
      { status: 500 }
    );
  }

  const records =
    data?.map((row) => ({
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
    })) ?? [];

  return NextResponse.json({ records });
}
