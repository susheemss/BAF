import Papa from "papaparse";
import * as XLSX from "xlsx";
import { ShipmentRecord } from "@/lib/tms/stores";

const requiredColumns = [
  "Shipment ID",
  "Load ID",
  "Date",
  "Month",
  "Year",
  "Carrier Name",
  "Mode of Transport",
  "Product Type",
  "Origin Country",
  "Origin Region",
  "Origin State",
  "Origin City",
  "Origin Zipcode",
  "Origin Area",
  "Destination Country",
  "Destination Region",
  "Destination State",
  "Destination City",
  "Destination Zipcode",
  "Destination Area",
  "Distance_km",
  "Total_Weight_in_Shipment_kg",
  "Transit Time (Days)",
  "Operational Status",
  "Shipment Cost (USD)",
  "Shipment Planned",
  "Equipment",
  "Equipment Weight Capacity (KG)",
  "Equipment_VolumeCapacity_m3",
  "Total Volume in Shipment_m3",
  "Tendered Status",
  "Estimated Delivery Date",
  "Actual_Delivery_Date",
  "Delays",
  "On-Time / Delayed / In-Transit",
  "Shipment Order Type"
];

type RawRecord = Record<string, string | number | Date>;

function formatDateValue(value: string | number | Date) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number") {
    return XLSX.SSF.format("yyyy-mm-dd", value);
  }
  return String(value ?? "").trim();
}

function toNumber(value: unknown) {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
}

function monthToNumber(value: string) {
  const normalized = value.trim().toLowerCase();
  const map: Record<string, number> = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12
  };
  return map[normalized] ?? 0;
}

function fallbackDateFromMonthYear(month: string, year: string) {
  const monthNum = monthToNumber(month);
  const yearNum = toNumber(year);
  if (!monthNum || !yearNum) {
    return "";
  }
  const monthString = String(monthNum).padStart(2, "0");
  return `${yearNum}-${monthString}-01`;
}

function sanitizeDate(value: string) {
  const cleaned = value.trim();
  const lowered = cleaned.toLowerCase();
  if (
    !cleaned ||
    cleaned === "00:00.0" ||
    cleaned === "00:00" ||
    lowered === "null"
  ) {
    return "";
  }
  return cleaned;
}

function normalizeDate(rawDate: string, month: string, year: string) {
  const cleaned = sanitizeDate(rawDate);
  if (!cleaned) {
    return fallbackDateFromMonthYear(month, year);
  }
  return cleaned;
}

function normalizeRecord(row: RawRecord): ShipmentRecord {
  const originCity = String(row["Origin City"] ?? "").trim();
  const destinationCity = String(row["Destination City"] ?? "").trim();
  const dateRaw = formatDateValue(row.Date ?? "");
  const monthRaw = String(row.Month ?? "").trim();
  const yearRaw = String(row.Year ?? "").trim();
  const normalizedDate = normalizeDate(dateRaw, monthRaw, yearRaw);
  return {
    shipmentId: String(row["Shipment ID"] ?? "").trim(),
    loadId: String(row["Load ID"] ?? "").trim(),
    date: normalizedDate,
    month: monthRaw,
    year: yearRaw,
    carrierName: String(row["Carrier Name"] ?? "").trim() || "Unknown",
    modeOfTransport:
      String(row["Mode of Transport"] ?? "").trim() || "Unknown",
    productType: String(row["Product Type"] ?? "").trim() || "Unknown",
    originCountry: String(row["Origin Country"] ?? "").trim() || "Unknown",
    originRegion: String(row["Origin Region"] ?? "").trim() || "Unknown",
    originState: String(row["Origin State"] ?? "").trim() || "Unknown",
    originCity: originCity || "Unknown",
    originZipcode: String(row["Origin Zipcode"] ?? "").trim(),
    originArea: String(row["Origin Area"] ?? "").trim() || "Unknown",
    destinationCountry:
      String(row["Destination Country"] ?? "").trim() || "Unknown",
    destinationRegion:
      String(row["Destination Region"] ?? "").trim() || "Unknown",
    destinationState:
      String(row["Destination State"] ?? "").trim() || "Unknown",
    destinationCity: destinationCity || "Unknown",
    destinationZipcode: String(row["Destination Zipcode"] ?? "").trim(),
    destinationArea:
      String(row["Destination Area"] ?? "").trim() || "Unknown",
    distanceKm: toNumber(row.Distance_km ?? 0),
    totalWeightKg: toNumber(row.Total_Weight_in_Shipment_kg ?? 0),
    transitTimeDays: toNumber(row["Transit Time (Days)"] ?? 0),
    operationalStatus: String(row["Operational Status"] ?? "").trim(),
    shipmentCostUsd: toNumber(row["Shipment Cost (USD)"] ?? 0),
    shipmentPlanned: String(row["Shipment Planned"] ?? "").trim(),
    equipment: String(row.Equipment ?? "").trim(),
    equipmentWeightCapacityKg: toNumber(
      row["Equipment Weight Capacity (KG)"] ?? 0
    ),
    equipmentVolumeCapacityM3: toNumber(row.Equipment_VolumeCapacity_m3 ?? 0),
    totalVolumeShipmentM3: toNumber(row["Total Volume in Shipment_m3"] ?? 0),
    tenderedStatus: String(row["Tendered Status"] ?? "").trim(),
    estimatedDeliveryDate: sanitizeDate(
      formatDateValue(row["Estimated Delivery Date"] ?? "")
    ),
    actualDeliveryDate: sanitizeDate(
      formatDateValue(row.Actual_Delivery_Date ?? "")
    ),
    delays: toNumber(row.Delays ?? 0),
    onTimeStatus:
      String(row["On-Time / Delayed / In-Transit"] ?? "").trim() ||
      "On-Time",
    shipmentOrderType:
      String(row["Shipment Order Type"] ?? "").trim() || "Unknown",
    route: `${originCity || "Unknown"}-${destinationCity || "Unknown"}`
  };
}

function validateColumns(columns: string[]) {
  const missing = requiredColumns.filter((col) => !columns.includes(col));
  if (missing.length > 0) {
    throw new Error(`Missing columns: ${missing.join(", ")}`);
  }
}

export async function parseFile(file: File): Promise<ShipmentRecord[]> {
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith(".csv")) {
    return parseCsv(file);
  }
  if (fileName.endsWith(".xlsx")) {
    return parseXlsx(file);
  }
  throw new Error("Unsupported file format. Please upload CSV or XLSX.");
}

function parseCsv(file: File): Promise<ShipmentRecord[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as RawRecord[];
          const columns = results.meta.fields ?? [];
          validateColumns(columns);
          resolve(data.map(normalizeRecord));
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error)
    });
  });
}

function parseXlsx(file: File): Promise<ShipmentRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<RawRecord>(sheet, {
          defval: ""
        });
        const columns = Object.keys(json[0] ?? {});
        validateColumns(columns);
        resolve(json.map(normalizeRecord));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}
