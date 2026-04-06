import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const dest = path.join(process.cwd(), "public", "planning_demand_supply.csv");
    fs.writeFileSync(dest, buffer);

    // Quick row count
    const text = buffer.toString("utf-8");
    const rows = text.split("\n").filter(Boolean).length - 1; // minus header

    return NextResponse.json({ ok: true, rows, filename: file.name });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
