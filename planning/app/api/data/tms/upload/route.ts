import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const records = body.records;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "No TMS records provided." }, { status: 400 });
    }

    const dataDir = path.join(process.cwd(), "data");
    const filePath = path.join(dataDir, "tms_shipments.json");
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2));

    return NextResponse.json({ ok: true, count: records.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "TMS upload save failed." },
      { status: 500 }
    );
  }
}
